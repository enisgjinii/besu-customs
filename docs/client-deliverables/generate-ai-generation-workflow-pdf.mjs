import { createRequire } from "node:module";
import fs from "node:fs/promises";
import path from "node:path";

const require = createRequire(
  "/Users/enisgjini/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/",
);
const { chromium } = require("playwright");
const { marked } = require("marked");

const root = "/Users/enisgjini/Desktop/besu-customs";
const sourcePath = path.join(root, "docs/client-deliverables/ai-generation-workflow-client-brief.md");
const outputPath = path.join(root, "docs/client-deliverables/ai-generation-workflow-client-brief.pdf");

const markdown = await fs.readFile(sourcePath, "utf8");
const htmlBody = marked.parse(markdown);

const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Besu Customs AI Design Generation Workflow</title>
  <style>
    @page {
      size: Letter;
      margin: 0.62in 0.72in;
    }
    * {
      box-sizing: border-box;
    }
    body {
      margin: 0;
      color: #111827;
      font-family: Arial, Helvetica, sans-serif;
      font-size: 10.2pt;
      line-height: 1.4;
      background: white;
    }
    h1 {
      margin: 0 0 8px;
      color: #0f172a;
      font-size: 24pt;
      line-height: 1.08;
      letter-spacing: 0;
      page-break-after: avoid;
    }
    h2 {
      margin: 18px 0 7px;
      color: #0f172a;
      font-size: 13.5pt;
      line-height: 1.18;
      border-top: 1px solid #d7dde7;
      padding-top: 10px;
      page-break-after: avoid;
    }
    h3 {
      margin: 14px 0 6px;
      color: #1f2937;
      font-size: 11.5pt;
      page-break-after: avoid;
    }
    p {
      margin: 0 0 7px;
    }
    ul, ol {
      margin: 3px 0 8px 20px;
      padding: 0;
    }
    li {
      margin: 2px 0;
      padding-left: 2px;
    }
    code {
      font-family: "SFMono-Regular", Consolas, "Liberation Mono", monospace;
      font-size: 9.5pt;
      color: #0f172a;
      background: #eef2f7;
      border-radius: 4px;
      padding: 1px 4px;
    }
    a {
      color: #155e75;
      text-decoration: none;
    }
    strong {
      color: #0f172a;
    }
    body > p:nth-of-type(1) {
      margin-bottom: 14px;
      color: #475569;
      font-size: 10pt;
    }
    h2 + p {
      margin-top: 0;
    }
    hr {
      border: 0;
      border-top: 1px solid #d7dde7;
      margin: 18px 0;
    }
  </style>
</head>
<body>
  ${htmlBody}
</body>
</html>`;

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
await page.setContent(html, { waitUntil: "networkidle" });
await page.pdf({
  path: outputPath,
  format: "Letter",
  printBackground: true,
  displayHeaderFooter: true,
  headerTemplate: `<div></div>`,
  footerTemplate: `
    <div style="width:100%;font-family:Arial,Helvetica,sans-serif;font-size:8px;color:#64748b;padding:0 0.72in;display:flex;justify-content:space-between;">
      <span>Besu Customs AI Design Generation Workflow</span>
      <span>Page <span class="pageNumber"></span> of <span class="totalPages"></span></span>
    </div>
  `,
  margin: {
    top: "0.62in",
    right: "0.72in",
    bottom: "0.72in",
    left: "0.72in",
  },
});
await browser.close();

console.log(outputPath);
