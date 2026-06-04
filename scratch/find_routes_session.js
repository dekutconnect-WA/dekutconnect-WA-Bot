const fs = require('fs');
const files = ['gifted-session-main/routes/pair.js', 'gifted-session-main/routes/qr.js'];
files.forEach(file => {
    if (fs.existsSync(file)) {
        const content = fs.readFileSync(file, 'utf8');
        console.log(`=== ${file} ===`);
        content.split('\n').forEach((line, i) => {
            if (line.includes('sessionDir') || line.includes('getSessionDir')) {
                console.log(`${i + 1}: ${line}`);
            }
        });
    }
});
