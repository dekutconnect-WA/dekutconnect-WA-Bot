const axios = require('axios');
const qs = require('qs');

/**
 * YTDown.to Automation Fix
 * Berdasarkan hasil intercept AJAX & HAR Terbaru
 */

class YTDown {
    constructor() {
        this.baseUrl = 'https://app.ytdown.to';
        this.session = axios.create({
            baseURL: this.baseUrl,
            headers: {
                'authority': 'app.ytdown.to',
                'accept': '*/*',
                'accept-language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
                'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
                'origin': this.baseUrl,
                'referer': `${this.baseUrl}/id2/`,
                'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
                'x-requested-with': 'XMLHttpRequest'
            },
            withCredentials: true
        });
        this.cookie = "";
    }

    async download(youtubeUrl) {
        try {
            // --- STEP 1: INITIAL VISIT (Get Session Cookie) ---
            const init = await this.session.get('/id2/');
            this.cookie = init.headers['set-cookie'] ? init.headers['set-cookie'][0].split(';')[0] : "";
            
            // Update header dengan cookie yang didapat
            const headers = { 'Cookie': this.cookie };

            // --- STEP 2: COOLDOWN CHECK (Handshake) ---
            const check = await this.session.post('/cooldown.php', qs.stringify({ action: 'check' }), { headers });
            if (!check.data.can_download) {
                throw new Error("Server Cooldown: Silakan tunggu beberapa saat.");
            }

            // --- STEP 3: GET VIDEO INFO & FORMATS ---
            const info = await this.session.post('/proxy.php', qs.stringify({ url: youtubeUrl }), { headers });
            if (!info.data.api || info.data.api.status !== 'ok') {
                throw new Error("Gagal mengambil info video. Pastikan URL benar.");
            }

            const videoData = info.data.api;
            // Pilih kualitas (Default: HD/720p atau pertama tersedia)
            const selectedMedia = videoData.mediaItems.find(m => m.mediaQuality === 'HD') || videoData.mediaItems[0];
            
            // --- STEP 4: RECORD ACTION ---
            await this.session.post('/cooldown.php', qs.stringify({ action: 'record' }), { headers });

            // --- STEP 5: POLLING CONVERSION ---
            let isReady = false;
            let downloadLink = "";
            let attempts = 0;

            while (!isReady && attempts < 30) {
                const convert = await this.session.post('/proxy.php', qs.stringify({ url: selectedMedia.mediaUrl }), { headers });
                const result = convert.data.api;

                if (result.status === 'completed') {
                    isReady = true;
                    downloadLink = result.fileUrl;
                    return {
                        success: true,
                        title: videoData.title,
                        quality: selectedMedia.mediaQuality,
                        size: result.fileSize,
                        downloadUrl: downloadLink,
                        thumbnail: videoData.imagePreviewUrl
                    };
                } else if (result.status === 'queued' || result.status === 'processing') {
                    attempts++;
                    await new Promise(r => setTimeout(r, 3000)); // Tunggu 3 detik
                } else {
                    throw new Error("Terjadi kesalahan saat konversi.");
                }
            }

            throw new Error("Timeout: Proses terlalu lama.");

        } catch (err) {
            throw new Error(err.message);
        }
    }
}

module.exports = new YTDown();