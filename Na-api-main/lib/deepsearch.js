const axios = require('axios');

// Konfigurasi
const TARGET_URL = 'https://www.deepsearchchat.com/api/chat-router';

// Header untuk meniru browser asli
const HEADERS = {
    'Content-Type': 'application/json',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Origin': 'https://www.deepsearchchat.com',
    'Referer': 'https://www.deepsearchchat.com/en',
    'Accept': '*/*',
    'Accept-Language': 'en-US,en;q=0.9',
    'Cache-Control': 'no-cache',
    'Pragma': 'no-cache'
};

async function* chatStream(prompt, modelType = 'reasoner') {
    const payload = {
        messages: [
            {
                role: "user",
                content: prompt
            }
        ],
        modelType: modelType 
    };

    try {
        const response = await axios.post(TARGET_URL, payload, {
            headers: HEADERS,
            responseType: 'stream'
        });

        const stream = response.data;
        let buffer = '';

        for await (const chunk of stream) {
            buffer += chunk.toString();
            let lines = buffer.split('\n');
            buffer = lines.pop(); 

            for (const line of lines) {
                const trimmedLine = line.trim();
                if (!trimmedLine) continue;

                if (trimmedLine.startsWith('data: ')) {
                    try {
                        const jsonStr = trimmedLine.replace('data: ', '');
                        const data = JSON.parse(jsonStr);
                        yield data;
                    } catch (e) {
                        // ignore parse error
                    }
                }
            }
        }
    } catch (error) {
        throw new Error(error.response?.data ? error.response.status + ' ' + JSON.stringify(error.response.data) : error.message);
    }
}

module.exports = { chatStream };