/**
 * @title YouTube DL
 * @summary YouTube Downloader (YTDown).
 * @description Mengunduh video dan audio dari YouTube menggunakan layanan YTDown. Mendukung berbagai resolusi (hingga 1080p FHD).
 * @method POST
 * @path /api/downloader/youtube
 * @response json
 * @param {string} body.url - URL video YouTube yang valid.
 * @example
 * async function dl() {
 *   const res = await fetch('/api/downloader/youtube', {
 *     method: 'POST',
 *     headers: { 'Content-Type': 'application/json' },
 *     body: JSON.stringify({ "url": "https://www.youtube.com/watch?v=Fmf-G9fpwto" })
 *   });
 *   const data = await res.json();
 *   console.log(data);
 * }
 */
const ytdown = require('../../ytdown');

const youtubeController = async (req) => {
    const { url } = req.body;

    if (!url) {
        throw new Error("Parameter 'url' wajib diisi.");
    }

    const result = await ytdown.download(url);

    return {
        success: true,
        author: 'PuruBoy',
        result: result
    };
};

module.exports = youtubeController;