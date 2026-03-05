const fs = require('fs');
const path = require('path');

const replacements = [
    // Undefined CSS variables -> proper equivalents
    ['var(--bg-secondary-glass)', 'var(--bg-secondary)'],
    ['var(--bg-glass, rgba(32, 34, 37, 0.85))', 'var(--bg-panel)'],
    ['var(--bg-glass)', 'var(--bg-panel)'],
    ['var(--border-glass)', 'var(--glass-border)'],
    ['var(--brand-experiment)', 'var(--beacon-brand)'],
];

function processDir(dir) {
    let count = 0;
    for (const file of fs.readdirSync(dir)) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            count += processDir(fullPath);
        } else if (fullPath.endsWith('.css')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            const original = content;
            for (const [from, to] of replacements) {
                content = content.split(from).join(to);
            }
            if (content !== original) {
                fs.writeFileSync(fullPath, content, 'utf8');
                console.log(`Fixed: ${path.basename(fullPath)}`);
                count++;
            }
        }
    }
    return count;
}

const total = processDir(path.join(__dirname, 'apps/web/src/styles/modules'));
console.log(`\nFixed undefined CSS variables in ${total} files.`);
