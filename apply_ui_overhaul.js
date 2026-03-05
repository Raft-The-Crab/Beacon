const fs = require('fs');
const path = require('path');

function processDir(dir) {
    const files = fs.readdirSync(dir);
    let changedFilesCount = 0;

    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            changedFilesCount += processDir(fullPath);
        } else if (fullPath.endsWith('.css')) {
            let originalContent = fs.readFileSync(fullPath, 'utf8');
            let content = originalContent;

            // Makes it softer and rounder:
            content = content.replace(/var\(--radius-sm\)/g, 'var(--radius-md)');
            content = content.replace(/var\(--radius-md\)/g, 'var(--radius-lg)');
            content = content.replace(/var\(--radius-lg\)/g, 'var(--radius-xl)');

            // Make shadows softer:
            content = content.replace(/var\(--shadow-md\)/g, 'var(--shadow-sm)');
            content = content.replace(/var\(--shadow-lg\)/g, 'var(--shadow-md)');
            content = content.replace(/var\(--shadow-xl\)/g, 'var(--shadow-lg)');

            // Relax intense hover transforms
            content = content.replace(/transform:\s*translateY\(-[4-9]px\)/g, 'transform: translateY(-2px)');
            content = content.replace(/scale\(1\.0[1-9]\)/g, '');

            if (originalContent !== content) {
                fs.writeFileSync(fullPath, content, 'utf8');
                console.log(`Updated: ${fullPath}`);
                changedFilesCount++;
            }
        }
    }
    return changedFilesCount;
}

const dirPath = path.join(__dirname, 'apps/web/src/styles/modules');
const total = processDir(dirPath);
console.log(`\nSuccessfully applied soft UI overhaul to ${total} CSS files.`);
