const fs = require('fs');
const path = require('path');

const distDir = path.join(__dirname, '../dist');

if (!fs.existsSync(distDir)) {
    console.log('Dist directory not found, skipping ESM build');
    process.exit(0);
}

function processDir(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
            processDir(fullPath);
        } else if (file.endsWith('.js')) {
            const mjsPath = fullPath.replace('.js', '.mjs');
            // Read content, potentially fix imports if needed (simple copy for now)
            fs.copyFileSync(fullPath, mjsPath);
        }
    }
}

console.log('Creating .mjs copies for ESM...');
processDir(distDir);
console.log('Done.');
