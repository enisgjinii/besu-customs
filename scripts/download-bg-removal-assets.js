const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ASSET_VERSION = '1.7.0'; // Match @imgly/background-removal version
const PUBLIC_DIR = path.join(__dirname, '../public/imgly-background-removal');
const URL = `https://staticimgly.com/@imgly/background-removal-data/${ASSET_VERSION}/package.tgz`;

async function downloadAssets() {
    console.log(`Checking for background removal assets in ${PUBLIC_DIR}...`);

    if (fs.existsSync(PUBLIC_DIR)) {
        console.log('Extensions directory already exists. Removing to ensure fresh install...');
        fs.rmSync(PUBLIC_DIR, { recursive: true, force: true });
    }

    fs.mkdirSync(PUBLIC_DIR, { recursive: true });

    console.log(`Downloading assets from ${URL}...`);

    try {
        // Determine if we should use fetch (Node 18+)
        if (typeof fetch !== 'undefined') {
            const response = await fetch(URL);
            if (!response.ok) throw new Error(`Failed to fetch: ${response.statusText}`);

            const arrayBuffer = await response.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            const tarPath = path.join(PUBLIC_DIR, 'dist.tgz');
            fs.writeFileSync(tarPath, buffer);

            console.log('Extracting assets...');
            // Strip the wrapping 'dist' folder if the tgz contains it, or just extract
            // The URL is .../dist.tgz, usually it contains the files directly or inside a folder. 
            // Let's assume standard tar behavior.
            // We'll use tar command for simplicity on Mac/Linux.
            execSync(`tar -xzf "${tarPath}" -C "${PUBLIC_DIR}"`);

            // Clean up tar file
            fs.unlinkSync(tarPath);

            // Check if there's a 'dist' subdir and move contents up if so
            const distSubDir = path.join(PUBLIC_DIR, 'dist');
            if (fs.existsSync(distSubDir)) {
                const files = fs.readdirSync(distSubDir);
                files.forEach(file => {
                    fs.renameSync(path.join(distSubDir, file), path.join(PUBLIC_DIR, file));
                });
                fs.rmdirSync(distSubDir);
            }

            console.log('Assets downloaded and extracted successfully.');
        } else {
            throw new Error('Node.js version too old, fetch not found.');
        }

    } catch (error) {
        console.error('Error downloading assets:', error);
        process.exit(1);
    }
}

downloadAssets();
