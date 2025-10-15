#!/usr/bin/env node

/*
  Robust materials name extractor

  - Supports: .glb (reads JSON chunk), .gltf (reads JSON), .obj (reads mtllib -> .mtl -> newmtl)
  - Walks project model folders and writes per-model `*-material-names-simple.txt`
    and a merged `all-material-names-simple.txt` into `materials-output/`.

  No external dependencies required.
*/

const fs = require('fs');
const path = require('path');

const projectRoot = path.resolve(__dirname, '..');
const MODEL_DIRS = [
  path.join(projectRoot, 'public', 'models'),
  path.join(projectRoot, 'Models (Phase 1)'),
  path.join(projectRoot, 'Models (Phase 2)'),
];
const OUT_DIR = path.join(projectRoot, 'materials-output');

function ensureOutDir() {
  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });
}

function writeModelOutput(modelName, names) {
  const safeName = modelName.replace(/[\\/:*?"<>|]/g, '_');
  const outPath = path.join(OUT_DIR, `${safeName}-material-names-simple.txt`);
  fs.writeFileSync(outPath, names.join('\n'), 'utf8');
  console.log(`Wrote ${path.relative(projectRoot, outPath)} (${names.length})`);
}

function scanDirForModels(dir) {
  const files = [];
  if (!fs.existsSync(dir)) return files;
  const entries = fs.readdirSync(dir);
  for (const e of entries) {
    const full = path.join(dir, e);
    const st = fs.statSync(full);
    if (st.isDirectory()) {
      files.push(...scanDirForModels(full));
    } else if (st.isFile()) {
      const ext = path.extname(e).toLowerCase();
      if (['.glb', '.gltf', '.obj'].includes(ext)) files.push(full);
    }
  }
  return files;
}

function parseGLBJsonChunk(buffer) {
  // GLB header: 12 bytes (magic, version, length)
  if (buffer.length < 12) return null;
  const magic = buffer.toString('utf8', 0, 4);
  if (magic !== 'glTF') return null;
  // iterate chunks
  let offset = 12;
  while (offset + 8 <= buffer.length) {
    const chunkLength = buffer.readUInt32LE(offset);
    const chunkType = buffer.readUInt32LE(offset + 4);
    offset += 8;
    if (offset + chunkLength > buffer.length) break;
    const chunkData = buffer.slice(offset, offset + chunkLength);
    // JSON chunk type is 0x4E4F534A ('JSON')
    if (chunkType === 0x4e4f534a) {
      try {
        return JSON.parse(chunkData.toString('utf8'));
      } catch (err) {
        return null;
      }
    }
    offset += chunkLength;
  }
  return null;
}

function extractFromGLB(filePath) {
  try {
    const buf = fs.readFileSync(filePath);
    const json = parseGLBJsonChunk(buf);
    if (!json) return [];
    if (Array.isArray(json.materials)) {
      return json.materials.map((m) => (m && m.name) || '').filter(Boolean);
    }
    return [];
  } catch (err) {
    console.warn('GLB parse failed:', filePath, err.message);
    return [];
  }
}

function extractFromGltf(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const json = JSON.parse(content);
    if (Array.isArray(json.materials)) {
      return json.materials.map((m) => (m && m.name) || '').filter(Boolean);
    }
    return [];
  } catch (err) {
    console.warn('GLTF parse failed:', filePath, err.message);
    return [];
  }
}

function readMtlFile(mtlPath) {
  if (!fs.existsSync(mtlPath)) return [];
  const content = fs.readFileSync(mtlPath, 'utf8');
  const lines = content.split(/\r?\n/);
  const names = [];
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.toLowerCase().startsWith('newmtl ')) {
      names.push(trimmed.substring(7).trim());
    }
  }
  return names;
}

function extractFromObj(filePath) {
  try {
    const dir = path.dirname(filePath);
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split(/\r?\n/);
    let mtlFile = null;
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.toLowerCase().startsWith('mtllib ')) {
        mtlFile = trimmed.substring(7).trim();
        break;
      }
    }
    if (mtlFile) {
      const mtlPath = path.join(dir, mtlFile);
      return readMtlFile(mtlPath);
    }
    // Fallback: collect 'usemtl' occurrences as material names
    const names = new Set();
    for (const line of lines) {
      const t = line.trim();
      if (t.toLowerCase().startsWith('usemtl ')) {
        names.add(t.substring(7).trim());
      }
    }
    return [...names];
  } catch (err) {
    console.warn('OBJ parse failed:', filePath, err.message);
    return [];
  }
}

function normalizeNames(names) {
  return names
    .map((n) => (n || '').trim())
    .filter(Boolean)
    .map((n) => n.replace(/\s+/g, ' '))
    .map((n) => n.replace(/[\u0000-\u001F]/g, ''))
    .map((n) => n.replace(/^[#\-\._]+/, ''));
}

function uniquePreserveOrder(arr) {
  const seen = new Set();
  const out = [];
  for (const v of arr) {
    if (!seen.has(v)) {
      seen.add(v);
      out.push(v);
    }
  }
  return out;
}

function relativeModelName(absPath) {
  return path.relative(projectRoot, absPath).replace(/\\/g, '/');
}

function run() {
  ensureOutDir();
  const globalSet = new Set();
  let totalModels = 0;

  for (const dir of MODEL_DIRS) {
    const models = scanDirForModels(dir);
    for (const m of models) {
      totalModels++;
      const ext = path.extname(m).toLowerCase();
      let names = [];
      if (ext === '.glb') names = extractFromGLB(m);
      else if (ext === '.gltf') names = extractFromGltf(m);
      else if (ext === '.obj') names = extractFromObj(m);
      else names = [];

      const normalized = normalizeNames(names);
      const unique = uniquePreserveOrder(normalized);

      unique.forEach((u) => globalSet.add(u));

      writeModelOutput(relativeModelName(m), unique);
    }
  }

  const globalArr = [...globalSet].sort((a, b) => a.localeCompare(b));
  const globalOut = path.join(OUT_DIR, `all-material-names-simple.txt`);
  fs.writeFileSync(globalOut, globalArr.join('\n'), 'utf8');
  console.log(`Wrote ${path.relative(projectRoot, globalOut)} (${globalArr.length} unique names)`);
  console.log(`Processed ${totalModels} models`);
}

run();