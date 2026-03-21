import fs from 'fs';
import path from 'path';

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach((file) => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(filePath));
    } else if (filePath.endsWith('.js') || filePath.endsWith('.d.ts')) {
      results.push(filePath);
    }
  });
  return results;
}

const files = walk('./dist');
files.forEach((file) => {
  let content = fs.readFileSync(file, 'utf8');
  let changed = false;

  const importExportRegex = /((?:import|export)\s+(?:(?:\{[^}]*\}\s*|\*\s*|[^'"]+\s*)from\s*)?['"])(\.[^'"]+)(['"])/g;
  
  content = content.replace(importExportRegex, (match, p1, p2, p3) => {
    if (p2.endsWith('.js') || p2.endsWith('.cjs') || p2.endsWith('.mjs') || p2.endsWith('.json')) {
      return match;
    }
    changed = true;

    // Resolve path relative to the current file
    const dir = path.dirname(file);
    const resolvedPath = path.resolve(dir, p2);

    if (fs.existsSync(resolvedPath + '.js')) {
      return `${p1}${p2}.js${p3}`;
    } else if (fs.existsSync(path.join(resolvedPath, 'index.js'))) {
      return `${p1}${p2}/index.js${p3}`;
    }
    
    // Fallback if we couldn't resolve exactly
    return `${p1}${p2}.js${p3}`;
  });

  const dynamicImportRegex = /(import\(['"])(\.[^'"]+)(['"]\))/g;
  content = content.replace(dynamicImportRegex, (match, p1, p2, p3) => {
    if (p2.endsWith('.js') || p2.endsWith('.cjs') || p2.endsWith('.mjs') || p2.endsWith('.json')) {
      return match;
    }
    changed = true;
    const dir = path.dirname(file);
    const resolvedPath = path.resolve(dir, p2);

    if (fs.existsSync(resolvedPath + '.js')) {
      return `${p1}${p2}.js${p3}`;
    } else if (fs.existsSync(path.join(resolvedPath, 'index.js'))) {
      return `${p1}${p2}/index.js${p3}`;
    }
    return `${p1}${p2}.js${p3}`;
  });

  if (changed) {
    fs.writeFileSync(file, content, 'utf8');
  }
});
console.log('Fixed relative ESM imports in dist/');
