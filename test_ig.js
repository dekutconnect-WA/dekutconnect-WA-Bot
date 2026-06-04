const axios = require('axios');

const testUrl = 'https://www.instagram.com/reel/C8jYkXvt3xG/';
const shortcode = 'C8jYkXvt3xG';

// Try Instagram's media API (used by various apps)
// These don't require auth for public posts
async function testIGMediaAPI() {
    const endpoints = [
        // Old shared data endpoint
        `https://www.instagram.com/p/${shortcode}/?__a=1&__d=dis`,
        // Media info API
        `https://i.instagram.com/api/v1/media/${shortcodeToId(shortcode)}/info/`,
        // graphql
        `https://www.instagram.com/api/graphql`,
    ];
    
    for (const url of endpoints) {
        try {
            const res = await axios.get(url, {
                headers: {
                    'User-Agent': 'Instagram 250.0.0.14.111 Android',
                    'Accept': '*/*',
                    'x-ig-app-id': '936619743392459',
                },
                timeout: 10000,
            });
            console.log('URL:', url.slice(0, 60));
            console.log('Status:', res.status, '| Length:', JSON.stringify(res.data).length);
            const hasVideo = JSON.stringify(res.data).includes('video_url');
            console.log('Has video_url:', hasVideo);
            if (hasVideo) console.log('Data:', JSON.stringify(res.data).slice(0, 500));
            console.log('---');
        } catch(e) { console.log('FAILED:', url.slice(0, 60), e.response?.status || e.code, e.message.slice(0, 80)); }
    }
}

// Convert shortcode to Instagram media ID
function shortcodeToId(code) {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
    let id = BigInt(0);
    for (const c of code) {
        id = id * BigInt(64) + BigInt(alphabet.indexOf(c));
    }
    return id.toString();
}

console.log('Shortcode to ID:', shortcodeToId(shortcode));

// Try instagram mobile API
async function testIGMobileAPI() {
    const mediaId = shortcodeToId(shortcode);
    const headers = {
        'User-Agent': 'Instagram 250.0.0.14.111 Android (30/11; 420dpi; 1080x2261; Xiaomi; M2007J17G; venus; qcom; en_US; 391040010)',
        'Accept-Language': 'en-US',
        'Accept-Encoding': 'gzip, deflate',
        'X-IG-Capabilities': '3brTvw==',
        'X-IG-Connection-Type': 'WIFI',
        'X-IG-App-ID': '567067343352427',
    };
    
    try {
        const res = await axios.get(`https://i.instagram.com/api/v1/media/${mediaId}/info/`, {
            headers,
            timeout: 15000,
        });
        const data = res.data;
        console.log('Mobile API status:', res.status);
        const str = JSON.stringify(data);
        if (str.includes('video_url')) {
            const m = /"video_url":"([^"]+)"/.exec(str);
            console.log('Video URL:', m ? m[1].replace(/\\u0026/g, '&').slice(0, 150) : 'found but cant extract');
        } else {
            console.log('Response:', str.slice(0, 300));
        }
    } catch(e) { 
        console.log('Mobile API FAILED:', e.response?.status, e.message.slice(0, 100));
        if (e.response) console.log('Response:', JSON.stringify(e.response.data).slice(0, 200));
    }
}

async function main() {
    await testIGMediaAPI();
    await testIGMobileAPI();
}
main().catch(console.error);
