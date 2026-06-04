/**
 * @title Savetube Downloader
 * @summary YouTube Video/Audio Downloader (Savetube).
 * @description Mengunduh video atau audio dari YouTube menggunakan provider Savetube. Mendukung metadata lengkap dan pemilihan kualitas (720p, 1080p, MP3).
 * @method POST
 * @path /api/downloader/savetube
 * @response json
 * @param {string} body.url - URL Video YouTube.
 * @param {string} [body.quality] - Kualitas target (contoh: '1080', '720', '128' untuk MP3). Jika kosong, akan mengembalikan semua metadata.
 * @param {string} [body.type] - Tipe konten: 'video' atau 'audio'. Default: 'video'.
 * @example
 * async function download() {
 *   const res = await fetch('/api/downloader/savetube', {
 *     method: 'POST',
 *     headers: { 'Content-Type': 'application/json' },
 *     body: JSON.stringify({ 
 *       "url": "https://www.youtube.com/watch?v=Fmf-G9fpwto",
 *       "quality": "128",
 *       "type": "audio"
 *     })
 *   });
 *   const data = await res.json();
 *   console.log(data);
 * }
 */
const savetube = require('../../savetube');

const savetubeController = async (req) => {
    const { url, quality, type = 'video' } = req.body;

    if (!url) {
        throw new Error("Parameter 'url' wajib diisi.");
    }

    // 1. Get Info & Decrypt
    const info = await savetube.getInfo(url);

    // 2. If quality is requested, generate specific link
    if (quality) {
        const downloadData = await savetube.getDownload(info.cdn, info.key, quality, type);
        return {
            success: true,
            author: 'PuruBoy',
            result: {
                title: info.title,
                thumbnail: info.thumbnail,
                quality: quality,
                type: type,
                downloadUrl: downloadData.downloadUrl
            }
        };
    }

    // 3. Otherwise return all metadata
    return {
        success: true,
        author: 'PuruBoy',
        result: info
    };
};

module.exports = savetubeController;