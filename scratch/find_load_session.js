const fs = require('fs');
const content = fs.readFileSync('gift/gmdFunctions.js', 'utf8');
const lines = content.split('\n');
lines.forEach((line, i) => {
    if (line.includes('loadSession')) {
        console.log(`${i + 1}: ${line}`);
    }
});
