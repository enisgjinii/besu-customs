/**
 * Minimal TypeScript module loader for the designer verification suite.
 *
 * It transpiles project modules on the fly so the verification scripts can execute the real
 * production code (store, generation client, generation hook) instead of pattern-matching
 * source text. Modules are cached, so a store singleton stays shared across importers.
 */
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import ts from "typescript";

export const ROOT = path.resolve(import.meta.dirname, "..", "..");
const nodeRequire = createRequire(path.join(ROOT, "noop.cjs"));
const EXTENSIONS = ["", ".ts", ".tsx", "/index.ts", "/index.tsx"];

export function createLoader({ stubs = {} } = {}) {
  const cache = new Map();

  function resolveFile(specifier, fromFile) {
    const base = specifier.startsWith("@/")
      ? path.join(ROOT, specifier.slice(2))
      : path.resolve(path.dirname(fromFile), specifier);
    for (const extension of EXTENSIONS) {
      const candidate = base + extension;
      if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) return candidate;
    }
    return null;
  }

  function loadFile(absolutePath) {
    const cached = cache.get(absolutePath);
    if (cached) return cached.exports;

    const source = fs.readFileSync(absolutePath, "utf8");
    const compiled = ts.transpileModule(source, {
      compilerOptions: {
        target: ts.ScriptTarget.ES2022,
        module: ts.ModuleKind.CommonJS,
        jsx: ts.JsxEmit.React,
        esModuleInterop: true,
      },
      fileName: absolutePath,
    }).outputText;

    const module = { exports: {} };
    cache.set(absolutePath, module);

    const requireDependency = (specifier) => {
      if (specifier in stubs) return stubs[specifier];
      const file = resolveFile(specifier, absolutePath);
      if (file) return loadFile(file);
      return nodeRequire(specifier);
    };

    new Function("require", "module", "exports", "__filename", "__dirname", compiled)(
      requireDependency,
      module,
      module.exports,
      absolutePath,
      path.dirname(absolutePath),
    );
    return module.exports;
  }

  return function load(relativePath) {
    const absolutePath = resolveFile(
      relativePath.startsWith("@/") ? relativePath : `@/${relativePath}`,
      path.join(ROOT, "noop.ts"),
    );
    if (!absolutePath) throw new Error(`Cannot resolve module: ${relativePath}`);
    return loadFile(absolutePath);
  };
}
