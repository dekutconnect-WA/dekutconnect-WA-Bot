const axios = require('axios');

async function main() {
    const url = 'https://www.instagram.com/reel/C8qYt2BOHp5/';
    const apikey = '_0u5aff45,_0l1876s8qc';
    const apiurl = `https://bot.connect.dekut.org/api/download/instadl?apikey=${apikey}&url=${encodeURIComponent(url)}`;
    
    try {
        console.log(`Testing GiftedTech API: ${apiurl} ...`);
        const res = await axios.get(apiurl, { timeout: 10000 });
        console.log(`SUCCESS:`, res.data);
    } catch (e) {
        console.log(`FAILED: ${e.message}`, e.response ? JSON.stringify(e.response.data) : '');
    }
}

main();
