const fs = require('fs');
const path = require('path');

const modalsDir = path.join(__dirname, 'apps/web/src/components/modals');
const stylesDir = path.join(__dirname, 'apps/web/src/styles/modules/modals');

const tsxFiles = fs.readdirSync(modalsDir).filter(f => f.endsWith('.tsx'));

let totalMissing = 0;

for (const tsx of tsxFiles) {
    const tsxPath = path.join(modalsDir, tsx);
    const tsxContent = fs.readFileSync(tsxPath, 'utf8');

    // Extract styles import
    const importMatch = tsxContent.match(/import styles from ['"]([^'"]+\.module\.css)['"]/);
    if (!importMatch) continue;

    const cssRelativePath = importMatch[1];
    const cssName = path.basename(cssRelativePath);
    const cssPath = path.join(stylesDir, cssName);

    if (!fs.existsSync(cssPath)) {
        console.log(`[!] ${tsx} imports missing CSS: ${cssName}`);
        continue;
    }

    const cssContent = fs.readFileSync(cssPath, 'utf8');

    // Extract all className={styles.foo} or styles['foo']
    const classRegex = /styles\[['"]([^'"]+)['"]\]|styles\.([a-zA-Z0-9_]+)/g;
    const usedClasses = new Set();
    let match;
    while ((match = classRegex.exec(tsxContent)) !== null) {
        usedClasses.add(match[1] || match[2]);
    }

    // Check if they exist in CSS
    const missing = [];
    for (const cls of usedClasses) {
        if (!cssContent.includes(`.${cls}`) && !cssContent.includes(`[class*="${cls}"]`)) {
            missing.push(cls);
        }
    }

    if (missing.length > 0) {
        console.log(`\n❌ ${tsx} is using classes missing in ${cssName}:`);
        missing.forEach(m => console.log(`   - ${m}`));
        totalMissing += missing.length;
    }
}

console.log(`\nAudit complete: ${totalMissing} missing classes found.`);
