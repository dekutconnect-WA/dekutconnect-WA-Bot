const axios = require('axios');
const vm = require('vm');

// ==========================================
// MOCK DOM (Minimalist)
// ==========================================
function createMockDOM() {
    const noop = () => {};
    const mockElement = {
        style: {},
        setAttribute: noop,
        getAttribute: () => '',
        appendChild: () => mockElement,
        innerHTML: '',
        value: '',
        click: noop
    };
    return {
        window: {},
        document: {
            getElementById: () => mockElement,
            createElement: () => mockElement,
            querySelector: () => mockElement,
            querySelectorAll: () => [mockElement],
            cookie: '',
            body: mockElement,
            head: mockElement,
            location: { href: 'https://id.ytmp3.mobi/' }
        },
        navigator: { 
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/121.0.0.0 Safari/537.36',
            serviceWorker: { register: () => Promise.resolve() }
        },
        location: { href: 'https://id.ytmp3.mobi/' },
        console: { log: noop, error: noop },
        String: String, Math: Math, Date: Date, parseInt: parseInt,
        setTimeout: (cb) => cb(), setInterval: noop, clearTimeout: noop
    };
}

// ==========================================
// CONFIG FETCHER
// ==========================================
async function getFreshConfig() {
    try {
        const homeRes = await axios.get('https://id.ytmp3.mobi/v1/');
        const jsMatch = homeRes.data.match(/src="(\/js\/ytmp3\.js\?t=[0-9]+)"/);
        if (!jsMatch) throw new Error('JS File not found');
        
        const jsUrl = `https://id.ytmp3.mobi${jsMatch[1]}`;
        const jsRes = await axios.get(jsUrl);
        const code = jsRes.data;

        // --- STEP 1: VM Execution ---
        const sandbox = createMockDOM();
        sandbox.window = sandbox;
        const context = vm.createContext(sandbox);
        try { vm.runInContext(code, context); } catch (e) {}

        let backend = sandbox.backend;
        
        // --- STEP 2: FIX BACKEND ---
        if (!backend || backend === '.ymcdn.org' || backend.startsWith('https:.') || backend.startsWith('.')) {
            const subMatch = code.match(/['"](https:\/\/[a-z])['"]/);
            if (subMatch) {
                backend = `${subMatch[1]}.ymcdn.org`;
            } else {
                backend = 'https://d.ymcdn.org';
            }
        } else {
            if (backend.startsWith('//')) backend = 'https:' + backend;
            if (!backend.startsWith('http')) backend = 'https://' + backend;
        }

        // --- STEP 3: DECODE INIT PARAMS ---
        let initQuery = 'it?p=y&23=';
        let initToken = '1llum1n471';

        const decoderMatch = code.match(/var\s+(_0x[a-f0-9]+)\s*=\s*_0x[a-f0-9]+;/);
        if (decoderMatch) {
            const decoder = sandbox[decoderMatch[1]];
            if (typeof decoder === 'function') {
                for (let i = 0; i < 800; i++) {
                    try {
                        const val = decoder(i);
                        if (val && typeof val === 'string') {
                            if (val.includes('it?p=')) initQuery = val;
                            if (val.length === 10 && /\d.*[a-z]/.test(val)) initToken = val;
                        }
                    } catch (e) {}
                }
            }
        }

        return { BASE_DOMAIN: backend, INIT_QUERY: initQuery, INIT_TOKEN: initToken };

    } catch (error) {
        return {
            BASE_DOMAIN: 'https://d.ymcdn.org',
            INIT_QUERY: 'it?p=y&23=',
            INIT_TOKEN: '1llum1n471'
        };
    }
}

const HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/121.0.0.0 Safari/537.36',
    'Referer': 'https://id.ytmp3.mobi/',
    'Origin': 'https://id.ytmp3.mobi'
};
const getRandom = () => Math.random().toString();

async function download(url) {
    if (!url) throw new Error("URL wajib diisi.");

    // Extract Video ID (Support standard & short links)
    const idMatch = url.match(/(?:v=|\/)([0-9A-Za-z_-]{11})/);
    if (!idMatch) throw new Error("URL YouTube tidak valid.");
    const videoId = idMatch[1];

    try {
        // 1. Config
        const config = await getFreshConfig();

        // 2. Init
        const cleanQuery = config.INIT_QUERY.replace('it?', 'init?').replace('/api/v1/', '');
        const initUrl = `${config.BASE_DOMAIN}/api/v1/${cleanQuery}${config.INIT_TOKEN}&_=${getRandom()}`;
        
        const initRes = await axios.get(initUrl, { headers: HEADERS });
        if (initRes.data.error) throw new Error(initRes.data.error);
        
        // 3. Convert
        const doConvert = async (targetUrl) => {
            const prefix = targetUrl.includes('?') ? '&' : '?';
            const res = await axios.get(`${targetUrl}${prefix}v=${videoId}&f=mp3&_=${getRandom()}`, { headers: HEADERS });
            if (res.data.redirectURL) return doConvert(res.data.redirectURL);
            return res.data;
        };
        
        const convertData = await doConvert(initRes.data.convertURL);

        // 4. Progress
        let result = null;
        for (let i = 0; i < 40; i++) {
            const res = await axios.get(`${convertData.progressURL}&_=${getRandom()}`, { headers: HEADERS });
            if (res.data.progress == 3) {
                result = res.data;
                break;
            }
            await new Promise(r => setTimeout(r, 1500));
        }

        if (!result) throw new Error('Timeout saat konversi.');

        return {
            title: result.title,
            download_url: convertData.downloadURL,
            source: 'ytmp3.mobi'
        };

    } catch (e) {
        throw new Error(e.message || "Gagal mengunduh MP3.");
    }
}

module.exports = { download };