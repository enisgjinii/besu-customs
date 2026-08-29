/**
 * Dependency-free Chrome DevTools Protocol driver for the designer browser QA harness.
 *
 * It uses the Chromium build already cached on the machine and Node's built-in WebSocket,
 * so real browser QA does not require adding a browser-automation dependency to the project.
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";

const CHROMIUM_CANDIDATES = [
  ...(process.env.QA_CHROME ? [process.env.QA_CHROME] : []),
  ...["1234", "1228", "1223", "1187"].map((build) =>
    path.join(
      os.homedir(),
      `Library/Caches/ms-playwright/chromium-${build}/chrome-mac-arm64/Chromium.app/Contents/MacOS/Chromium`,
    ),
  ),
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser",
  "/Applications/Chromium.app/Contents/MacOS/Chromium",
];

function findBrowser() {
  for (const candidate of CHROMIUM_CANDIDATES) if (fs.existsSync(candidate)) return candidate;
  throw new Error("No Chromium-based browser found for browser QA. Set QA_CHROME to a binary path.");
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function fetchJson(url, attempts = 60) {
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      const response = await fetch(url);
      if (response.ok) return await response.json();
    } catch {
      /* browser not up yet */
    }
    await sleep(250);
  }
  throw new Error(`DevTools endpoint never became available: ${url}`);
}

export async function launch({ port = 9400 + Math.floor(Math.random() * 500), headless = true } = {}) {
  const binary = findBrowser();
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), "besu-qa-"));
  const child = spawn(
    binary,
    [
      `--remote-debugging-port=${port}`,
      `--user-data-dir=${profile}`,
      ...(headless ? ["--headless=new"] : []),
      "--hide-scrollbars",
      "--no-first-run",
      "--no-default-browser-check",
      "--disable-extensions",
      "--disable-background-networking",
      "--no-proxy-server",
      "--force-device-scale-factor=2",
      "--force-color-profile=srgb",
      "about:blank",
    ],
    { stdio: "ignore" },
  );

  const version = await fetchJson(`http://127.0.0.1:${port}/json/version`);
  const targets = await fetchJson(`http://127.0.0.1:${port}/json/list`);
  const page = targets.find((target) => target.type === "page") || targets[0];

  const session = await connect(page.webSocketDebuggerUrl);
  session.browser = {
    binary,
    version: version["User-Agent"],
    async close() {
      session.socket.close();
      child.kill("SIGTERM");
      await sleep(300);
      fs.rmSync(profile, { recursive: true, force: true });
    },
  };
  return session;
}

async function connect(url) {
  const socket = new WebSocket(url);
  await new Promise((resolve, reject) => {
    socket.addEventListener("open", resolve, { once: true });
    socket.addEventListener("error", () => reject(new Error("Could not attach to the browser tab.")), { once: true });
  });

  let nextId = 0;
  const pending = new Map();
  const listeners = [];

  socket.addEventListener("message", (event) => {
    const message = JSON.parse(event.data);
    if (message.id !== undefined && pending.has(message.id)) {
      const { resolve, reject } = pending.get(message.id);
      pending.delete(message.id);
      if (message.error) reject(new Error(`${message.error.message} (${JSON.stringify(message.error.data ?? "")})`));
      else resolve(message.result);
      return;
    }
    for (const listener of listeners) listener(message);
  });

  function send(method, params = {}) {
    const id = (nextId += 1);
    socket.send(JSON.stringify({ id, method, params }));
    return new Promise((resolve, reject) => {
      pending.set(id, { resolve, reject });
      setTimeout(() => {
        if (pending.has(id)) {
          pending.delete(id);
          reject(new Error(`CDP timeout: ${method}`));
        }
      }, 60_000);
    });
  }

  return { socket, send, on: (listener) => listeners.push(listener) };
}

/** Wraps a raw session with the page interactions the QA scenario needs. */
export function createPage(session) {
  const consoleErrors = [];
  const pageExceptions = [];
  const failedRequests = [];
  const requests = [];

  session.on((message) => {
    if (message.method === "Runtime.consoleAPICalled" && message.params.type === "error") {
      consoleErrors.push(message.params.args.map((arg) => arg.value ?? arg.description ?? arg.type).join(" "));
    }
    if (message.method === "Runtime.exceptionThrown") {
      pageExceptions.push(message.params.exceptionDetails.exception?.description || message.params.exceptionDetails.text);
    }
    if (message.method === "Network.requestWillBeSent") {
      requests.push({ url: message.params.request.url, method: message.params.request.method });
    }
    if (message.method === "Network.loadingFailed" && !message.params.canceled) {
      failedRequests.push(`${message.params.errorText}`);
    }
    if (message.method === "Network.responseReceived" && message.params.response.status >= 400) {
      failedRequests.push(`${message.params.response.status} ${message.params.response.url}`);
    }
  });

  const api = {
    consoleErrors,
    pageExceptions,
    failedRequests,
    requests,

    async init() {
      await session.send("Page.enable");
      await session.send("Runtime.enable");
      await session.send("Network.enable");
      await session.send("Log.enable");
    },

    async viewport(width, height, mobile = false) {
      await session.send("Emulation.setDeviceMetricsOverride", {
        width,
        height,
        deviceScaleFactor: 2,
        mobile,
        screenWidth: width,
        screenHeight: height,
      });
      await session.send("Emulation.setTouchEmulationEnabled", { enabled: mobile, maxTouchPoints: 5 });
    },

    async goto(url) {
      await session.send("Page.navigate", { url });
      await api.waitFor("[data-designer-shell]", 30_000);
      await sleep(600);
    },

    async evaluate(expression) {
      const result = await session.send("Runtime.evaluate", {
        expression: `(async () => { ${expression} })()`,
        returnByValue: true,
        awaitPromise: true,
      });
      if (result.exceptionDetails) {
        throw new Error(`Evaluate failed: ${result.exceptionDetails.exception?.description || result.exceptionDetails.text}`);
      }
      return result.result.value;
    },

    async waitFor(selector, timeout = 20_000, { visible = true } = {}) {
      const deadline = Date.now() + timeout;
      while (Date.now() < deadline) {
        const ok = await api.evaluate(`
          const el = document.querySelector(${JSON.stringify(selector)});
          if (!el) return false;
          if (!${visible}) return true;
          const rect = el.getBoundingClientRect();
          return rect.width > 0 && rect.height > 0;
        `);
        if (ok) return true;
        await sleep(150);
      }
      throw new Error(`Timed out waiting for ${selector}`);
    },

    async waitForCondition(expression, timeout = 240_000, label = expression) {
      const deadline = Date.now() + timeout;
      while (Date.now() < deadline) {
        if (await api.evaluate(`return Boolean(${expression});`)) return true;
        await sleep(300);
      }
      throw new Error(`Timed out waiting for condition: ${label}`);
    },

    /** Real pointer input, so react-aria `onPress` handlers behave as they do for a customer. */
    async click(selector) {
      const box = await api.evaluate(`
        const el = document.querySelector(${JSON.stringify(selector)});
        if (!el) return null;
        el.scrollIntoView({ block: "center" });
        const rect = el.getBoundingClientRect();
        return { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 };
      `);
      if (!box) throw new Error(`Cannot click missing element: ${selector}`);
      await sleep(120);
      const point = { x: Math.round(box.x), y: Math.round(box.y), button: "left", clickCount: 1 };
      await session.send("Input.dispatchMouseEvent", { type: "mouseMoved", ...point });
      await session.send("Input.dispatchMouseEvent", { type: "mousePressed", ...point });
      await session.send("Input.dispatchMouseEvent", { type: "mouseReleased", ...point });
      await sleep(180);
    },

    /** Clicks the first element matching `selector` whose text contains `text`. */
    async clickText(selector, text, { exact = false } = {}) {
      const marker = `data-qa-hit-${Math.random().toString(36).slice(2, 8)}`;
      const found = await api.evaluate(`
        const wanted = ${JSON.stringify(text)}.trim().toLowerCase();
        const nodes = [...document.querySelectorAll(${JSON.stringify(selector)})];
        const hit = nodes.find((node) => {
          const label = (node.textContent || "").trim().toLowerCase();
          return ${exact} ? label === wanted : label.includes(wanted);
        });
        if (!hit) return false;
        hit.setAttribute(${JSON.stringify(marker)}, "1");
        return true;
      `);
      if (!found) throw new Error(`No ${selector} containing text "${text}"`);
      await api.click(`[${marker}]`);
      await api.evaluate(`
        const el = document.querySelector("[${marker}]");
        if (el) el.removeAttribute(${JSON.stringify(marker)});
        return true;
      `);
    },

    async type(selector, text, { clear = true } = {}) {
      await api.click(selector);
      if (clear) {
        // insertText replaces the active selection, so selecting everything clears the field.
        // number/email inputs reject setSelectionRange, so fall back to select().
        await api.evaluate(`
          const el = document.querySelector(${JSON.stringify(selector)});
          if (!el) return false;
          el.focus();
          try { el.setSelectionRange(0, el.value.length); } catch { el.select(); }
          return true;
        `);
      }
      await session.send("Input.insertText", { text });
      await sleep(150);
    },

    async pressEnter() {
      for (const type of ["keyDown", "keyUp"]) {
        await session.send("Input.dispatchKeyEvent", { type, key: "Enter", code: "Enter", windowsVirtualKeyCode: 13, text: type === "keyDown" ? "\r" : undefined });
      }
      await sleep(200);
    },

    async pressTab() {
      for (const type of ["keyDown", "keyUp"]) {
        await session.send("Input.dispatchKeyEvent", { type, key: "Tab", code: "Tab", windowsVirtualKeyCode: 9 });
      }
      await sleep(120);
    },

    async screenshot(file) {
      fs.mkdirSync(path.dirname(file), { recursive: true });
      const { data } = await session.send("Page.captureScreenshot", { format: "png", captureBeyondViewport: false });
      fs.writeFileSync(file, Buffer.from(data, "base64"));
      return file;
    },

    /** Captures one element, including any part of it scrolled outside the viewport. */
    async screenshotElement(selector, file, { padding = 12 } = {}) {
      const box = await api.evaluate(`
        const el = document.querySelector(${JSON.stringify(selector)});
        if (!el) return null;
        const r = el.getBoundingClientRect();
        return { x: r.x + window.scrollX, y: r.y + window.scrollY, width: r.width, height: r.height };
      `);
      if (!box) throw new Error(`screenshotElement: no element for ${selector}`);
      fs.mkdirSync(path.dirname(file), { recursive: true });
      const { data } = await session.send("Page.captureScreenshot", {
        format: "png",
        captureBeyondViewport: true,
        clip: {
          x: Math.max(0, box.x - padding),
          y: Math.max(0, box.y - padding),
          width: box.width + padding * 2,
          height: box.height + padding * 2,
          scale: 2,
        },
      });
      fs.writeFileSync(file, Buffer.from(data, "base64"));
      return file;
    },

    async horizontalOverflow() {
      return api.evaluate(`
        return {
          overflow: document.documentElement.scrollWidth - window.innerWidth,
          width: window.innerWidth,
        };
      `);
    },

    generationRequests() {
      return api.requests.filter((r) => r.method === "POST" && r.url.includes("/api/designer/generate")).length;
    },
  };

  return api;
}

export { sleep };
