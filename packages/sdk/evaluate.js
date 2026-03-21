import fs from 'fs';
import path from 'path';

const file = './dist/index.js';
const content = fs.readFileSync(file, 'utf8');

const importExportRegex = /((?:import|export)\s+(?:(?:\{[^}]*\}\s*|\*\s*|[^'"]+\s*)from\s*)?['"])(\.[^'"]+)(['"])/g;

let found = 0;
content.replace(importExportRegex, (match, p1, p2, p3) => {
  if (p2 === './errors') {
    found++;
    const dir = path.dirname(file);
    const resolvedPath = path.resolve(dir, p2);
    console.log("Found ./errors");
    console.log("dir:", dir);
    console.log("resolvedPath:", resolvedPath);
    console.log("exists .js:", fs.existsSync(resolvedPath + '.js'));
    console.log("exists index.js:", fs.existsSync(path.join(resolvedPath, 'index.js')));
  }
  return match;
});
if (found === 0) console.log("Did not find ./errors");
