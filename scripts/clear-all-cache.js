#!/usr/bin/env node

/**
 * Clear all caches - Service Worker, Browser, Next.js
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🧹 Clearing All Caches...\n');

// 1. Clear Next.js cache
console.log('1️⃣  Clearing Next.js cache...');
const nextDir = path.join(__dirname, '../.next');
if (fs.existsSync(nextDir)) {
  try {
    fs.rmSync(nextDir, { recursive: true, force: true });
    console.log('   ✅ .next directory removed');
  } catch (error) {
    console.log('   ⚠️  Could not remove .next:', error.message);
  }
} else {
  console.log('   ℹ️  .next directory not found');
}

// 2. Clear Turbopack cache
console.log('\n2️⃣  Clearing Turbopack cache...');
const turbopackDir = path.join(__dirname, '../.turbo');
if (fs.existsSync(turbopackDir)) {
  try {
    fs.rmSync(turbopackDir, { recursive: true, force: true });
    console.log('   ✅ .turbo directory removed');
  } catch (error) {
    console.log('   ⚠️  Could not remove .turbo:', error.message);
  }
} else {
  console.log('   ℹ️  .turbo directory not found');
}

// 3. Clear node_modules/.cache
console.log('\n3️⃣  Clearing node_modules cache...');
const nodeModulesCache = path.join(__dirname, '../node_modules/.cache');
if (fs.existsSync(nodeModulesCache)) {
  try {
    fs.rmSync(nodeModulesCache, { recursive: true, force: true });
    console.log('   ✅ node_modules/.cache removed');
  } catch (error) {
    console.log('   ⚠️  Could not remove cache:', error.message);
  }
} else {
  console.log('   ℹ️  node_modules/.cache not found');
}

// 4. Instructions for browser cache
console.log('\n4️⃣  Browser Cache (Manual Steps):');
console.log('   📱 Chrome/Edge:');
console.log('      1. Open DevTools (F12)');
console.log('      2. Application → Storage → Clear site data');
console.log('      3. Or: Settings → Privacy → Clear browsing data');
console.log('');
console.log('   🦊 Firefox:');
console.log('      1. Settings → Privacy & Security');
console.log('      2. Cookies and Site Data → Clear Data');
console.log('');
console.log('   🧭 Safari:');
console.log('      1. Develop → Empty Caches');
console.log('      2. Or: Preferences → Privacy → Manage Website Data');

// 5. Service Worker instructions
console.log('\n5️⃣  Service Worker Cache (Manual Steps):');
console.log('   1. Open DevTools (F12)');
console.log('   2. Application → Service Workers');
console.log('   3. Click "Unregister" for all workers');
console.log('   4. Application → Cache Storage');
console.log('   5. Right-click each cache → Delete');

// 6. Create a client-side cache clear page
console.log('\n6️⃣  Creating cache clear utility page...');
const clearCacheHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Clear Cache</title>
  <style>
    body {
      font-family: system-ui, -apple-system, sans-serif;
      max-width: 600px;
      margin: 50px auto;
      padding: 20px;
      background: #f5f5f5;
    }
    .container {
      background: white;
      padding: 30px;
      border-radius: 10px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }
    h1 { color: #333; margin-top: 0; }
    button {
      background: #0070f3;
      color: white;
      border: none;
      padding: 12px 24px;
      border-radius: 6px;
      cursor: pointer;
      font-size: 16px;
      margin: 10px 10px 10px 0;
    }
    button:hover { background: #0051cc; }
    button:disabled {
      background: #ccc;
      cursor: not-allowed;
    }
    .status {
      margin-top: 20px;
      padding: 15px;
      border-radius: 6px;
      display: none;
    }
    .status.success {
      background: #d4edda;
      color: #155724;
      display: block;
    }
    .status.error {
      background: #f8d7da;
      color: #721c24;
      display: block;
    }
    .info {
      background: #e7f3ff;
      padding: 15px;
      border-radius: 6px;
      margin: 20px 0;
      border-left: 4px solid #0070f3;
    }
    ul { margin: 10px 0; }
    li { margin: 5px 0; }
  </style>
</head>
<body>
  <div class="container">
    <h1>🧹 Clear All Caches</h1>
    
    <div class="info">
      <strong>This will clear:</strong>
      <ul>
        <li>Service Worker caches</li>
        <li>Browser cache storage</li>
        <li>IndexedDB</li>
        <li>Local Storage</li>
        <li>Session Storage</li>
      </ul>
    </div>

    <button onclick="clearAllCaches()">Clear All Caches</button>
    <button onclick="unregisterServiceWorkers()">Unregister Service Workers</button>
    <button onclick="window.location.reload()">Reload Page</button>

    <div id="status" class="status"></div>

    <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
      <h3>Cache Status</h3>
      <div id="cacheInfo"></div>
    </div>
  </div>

  <script>
    async function clearAllCaches() {
      const status = document.getElementById('status');
      status.className = 'status';
      status.textContent = 'Clearing caches...';
      status.style.display = 'block';

      const results = [];

      try {
        // 1. Clear Cache Storage
        if ('caches' in window) {
          const cacheNames = await caches.keys();
          for (const name of cacheNames) {
            await caches.delete(name);
            results.push(\`✅ Deleted cache: \${name}\`);
          }
        }

        // 2. Clear IndexedDB
        if ('indexedDB' in window) {
          const dbs = await indexedDB.databases();
          for (const db of dbs) {
            indexedDB.deleteDatabase(db.name);
            results.push(\`✅ Deleted IndexedDB: \${db.name}\`);
          }
        }

        // 3. Clear Local Storage
        localStorage.clear();
        results.push('✅ Cleared localStorage');

        // 4. Clear Session Storage
        sessionStorage.clear();
        results.push('✅ Cleared sessionStorage');

        // 5. Unregister Service Workers
        if ('serviceWorker' in navigator) {
          const registrations = await navigator.serviceWorker.getRegistrations();
          for (const registration of registrations) {
            await registration.unregister();
            results.push('✅ Unregistered Service Worker');
          }
        }

        status.className = 'status success';
        status.innerHTML = results.join('<br>') + '<br><br><strong>✅ All caches cleared!</strong><br>Reload the page to see changes.';

      } catch (error) {
        status.className = 'status error';
        status.textContent = '❌ Error: ' + error.message;
      }
    }

    async function unregisterServiceWorkers() {
      const status = document.getElementById('status');
      status.className = 'status';
      status.textContent = 'Unregistering service workers...';
      status.style.display = 'block';

      try {
        if ('serviceWorker' in navigator) {
          const registrations = await navigator.serviceWorker.getRegistrations();
          for (const registration of registrations) {
            await registration.unregister();
          }
          status.className = 'status success';
          status.textContent = '✅ All service workers unregistered!';
        } else {
          status.className = 'status error';
          status.textContent = '⚠️ Service Workers not supported';
        }
      } catch (error) {
        status.className = 'status error';
        status.textContent = '❌ Error: ' + error.message;
      }
    }

    async function updateCacheInfo() {
      const info = document.getElementById('cacheInfo');
      const details = [];

      // Cache Storage
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        details.push(\`<strong>Cache Storage:</strong> \${cacheNames.length} caches\`);
        if (cacheNames.length > 0) {
          details.push('<ul>' + cacheNames.map(name => \`<li>\${name}</li>\`).join('') + '</ul>');
        }
      }

      // Service Workers
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        details.push(\`<strong>Service Workers:</strong> \${registrations.length} registered\`);
      }

      // Storage
      details.push(\`<strong>localStorage:</strong> \${localStorage.length} items\`);
      details.push(\`<strong>sessionStorage:</strong> \${sessionStorage.length} items\`);

      // Storage Estimate
      if ('storage' in navigator && 'estimate' in navigator.storage) {
        const estimate = await navigator.storage.estimate();
        const used = (estimate.usage / 1024 / 1024).toFixed(2);
        const quota = (estimate.quota / 1024 / 1024).toFixed(2);
        details.push(\`<strong>Storage Used:</strong> \${used} MB / \${quota} MB\`);
      }

      info.innerHTML = details.join('<br>');
    }

    // Update cache info on load
    updateCacheInfo();
  </script>
</body>
</html>`;

const publicDir = path.join(__dirname, '../public');
fs.writeFileSync(path.join(publicDir, 'clear-cache.html'), clearCacheHtml);
console.log('   ✅ Created public/clear-cache.html');
console.log('   🌐 Visit: http://localhost:3000/clear-cache.html');

console.log('\n' + '='.repeat(60));
console.log('✅ Cache Clearing Complete!');
console.log('='.repeat(60));
console.log('\n📝 Next Steps:');
console.log('1. Visit http://localhost:3000/clear-cache.html');
console.log('2. Click "Clear All Caches"');
console.log('3. Reload your app');
console.log('');
