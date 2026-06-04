const axios = require('axios');

/**
 * Instagram Fast Downloader via Siputzx API
 * @param {string} url - Instagram URL (Reels, Post, Slide)
 */
async function download(url) {
    try {
        const response = await axios.get(`https://api.siputzx.my.id/api/d/fastdl?url=${encodeURIComponent(url)}`, {
            headers: {
                'Accept': 'application/json',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        });
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.message || "Gagal menghubungi API Downloader.");
    }
}

module.exports = { download };