const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        if (stat && stat.isDirectory()) {
            if (file !== 'node_modules' && file !== '.git') {
                results = results.concat(walk(filePath));
            }
        } else if (filePath.endsWith('.js')) {
            results.push(filePath);
        }
    });
    return results;
}

const jsFiles = walk('.');
jsFiles.forEach(file => {
    const content = fs.readFileSync(file, 'utf8');
    const lines = content.split('\n');
    lines.forEach((line, i) => {
        if (line.includes('sessionDir') && !file.includes('scratch') && !file.includes('find_')) {
            console.log(`${file}:${i + 1}: ${line}`);
        }
    });
});
