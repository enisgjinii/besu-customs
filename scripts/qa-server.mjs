/**
 * Starts (or stops) a detached Next dev server in deterministic mock mode for browser QA.
 * Run: node scripts/qa-server.mjs start|stop [port]
 */
import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";

const ROOT = path.resolve(import.meta.dirname, "..");
const action = process.argv[2] || "start";
const port = process.argv[3] || "3200";
const pidFile = path.join(ROOT, ".next", "qa-server.pid");
const logFile = "/tmp/besu-qa-server.log";

if (action === "stop") {
  if (fs.existsSync(pidFile)) {
    const pid = Number(fs.readFileSync(pidFile, "utf8").trim());
    try {
      process.kill(-pid, "SIGTERM");
    } catch {
      try {
        process.kill(pid, "SIGTERM");
      } catch {
        /* already gone */
      }
    }
    fs.rmSync(pidFile, { force: true });
    console.log(`stopped ${pid}`);
  } else {
    console.log("no QA server pid file");
  }
  process.exit(0);
}

fs.mkdirSync(path.dirname(pidFile), { recursive: true });
const out = fs.openSync(logFile, "a");
const child = spawn(process.execPath, [path.join(ROOT, "node_modules/next/dist/bin/next"), "dev", "-p", port], {
  cwd: ROOT,
  detached: true,
  stdio: ["ignore", out, out],
  env: {
    ...process.env,
    DESIGNER_MOCK_AI: "true",
    DESIGNER_LOCAL_ASSETS: "true",
    NEXT_DISABLE_VERCEL_TOOLBAR: "1",
  },
});
child.unref();
fs.writeFileSync(pidFile, String(child.pid));
console.log(`QA server pid ${child.pid} on port ${port}, log ${logFile}`);
