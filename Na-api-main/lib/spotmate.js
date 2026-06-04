const axios = require('axios');
const cheerio = require('cheerio');

/**
 * Spotify to MP3 Automation via Spotmate.online
 */
async function download(spotifyUrl) {
    const baseUrl = 'https://spotmate.online';
    
    const session = axios.create({
        baseURL: baseUrl,
        headers: {
            'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'accept': 'application/json, text/plain, */*',
            'origin': baseUrl,
            'referer': `${baseUrl}/en1`,
            'x-requested-with': 'XMLHttpRequest'
        }
    });

    try {
        // 1. Ambil CSRF & Session Cookie
        const landingPage = await session.get('/en1');
        const cookies = landingPage.headers['set-cookie']?.map(c => c.split(';')[0]).join('; ') || '';
        
        const $ = cheerio.load(landingPage.data);
        const csrfToken = $('meta[name="csrf-token"]').attr('content');

        if (!csrfToken) throw new Error('Gagal mendapatkan token keamanan.');

        const authHeaders = {
            'x-csrf-token': csrfToken,
            'cookie': cookies
        };

        // 2. Metadata Check (Handshake)
        const trackReq = await session.post('/getTrackData', {
            spotify_url: spotifyUrl
        }, { headers: authHeaders });

        const trackData = trackReq.data;

        // 3. Request Conversion
        const convertReq = await session.post('/convert', {
            urls: spotifyUrl
        }, { headers: authHeaders });

        if (convertReq.data.error === false && convertReq.data.url) {
            return {
                title: trackData.name || 'Spotify Track',
                artists: trackData.artists?.map(a => a.name).join(', ') || 'Unknown',
                thumbnail: trackData.album?.images?.[0]?.url || null,
                download_url: convertReq.data.url
            };
        } else {
            throw new Error(convertReq.data.message || 'Gagal memproses link download.');
        }

    } catch (error) {
        throw new Error(error.response?.data?.message || error.message);
    }
}

module.exports = { download };