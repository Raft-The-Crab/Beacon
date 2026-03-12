const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        file = path.join(dir, file);
        if (fs.statSync(file).isDirectory()) {
            results = results.concat(walk(file));
        } else if (file.endsWith('.css')) {
            results.push(file);
        }
    });
    return results;
}

const files = walk('./apps/web/src/styles');
let count = 0;

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let original = content;

    content = content.replace(/border-radius:\s*[1-5]px;/g, 'border-radius: var(--radius-xs);');
    content = content.replace(/border-radius:\s*[6-9]px;/g, 'border-radius: var(--radius-sm);');
    content = content.replace(/border-radius:\s*1[0-5]px;/g, 'border-radius: var(--radius-md);');

    if (content !== original) {
        fs.writeFileSync(file, content);
        count++;
    }
});

console.log('Updated ' + count + ' CSS files with soft border radius variables.');
