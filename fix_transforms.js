const fs = require('fs');
const path = require('path');

function processDir(dir) {
    const files = fs.readdirSync(dir);
    let count = 0;
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            count += processDir(fullPath);
        } else if (fullPath.endsWith('.css')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            const original = content;

            // Fix empty transform declarations (standalone lines)
            content = content.replace(/^(\s*)transform:\s*;$/gm, '$1transform: none;');

            // Fix empty transform inside keyframes like: 50% { opacity: 0.5; transform: ; }
            content = content.replace(/transform:\s*;(\s*})/g, 'transform: none;$1');

            if (content !== original) {
                fs.writeFileSync(fullPath, content, 'utf8');
                console.log(`Fixed: ${fullPath}`);
                count++;
            }
        }
    }
    return count;
}

const total = processDir(path.join(__dirname, 'apps/web/src/styles/modules'));
console.log(`\nFixed empty transform declarations in ${total} files.`);
