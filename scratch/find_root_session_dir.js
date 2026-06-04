const fs = require('fs');
const content = fs.readFileSync('index.js', 'utf8');
content.split('\n').forEach((line, i) => {
    if (line.includes('sessionDir')) {
        console.log(`${i + 1}: ${line}`);
    }
});
