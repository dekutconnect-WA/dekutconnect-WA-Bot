/**
 * @title Instagram Downloader
 * @summary Download Instagram Media (Reels/Slide/Photo).
 * @description Mengunduh konten Instagram (Video, Reels, atau Carousel Slide) secara cepat menggunakan API Siputzx.
 * @method POST
 * @path /api/downloader/instagram
 * @response json
 * @param {string} body.url - URL media Instagram.
 * @example
 * async function downloadIg() {
 *   const res = await fetch('/api/downloader/instagram', {
 *     method: 'POST',
 *     headers: { 'Content-Type': 'application/json' },
 *     body: JSON.stringify({ "url": "https://www.instagram.com/reel/DOxOvd9jz6f/" })
 *   });
 *   const data = await res.json();
 *   console.log(data);
 * }
 */
const { download } = require('../../siputzxInstagram');

const instagramController = async (req) => {
    const { url } = req.body;

    if (!url) {
        throw new Error("Parameter 'url' wajib diisi.");
    }

    const data = await download(url);

    return {
        success: true,
        author: 'siputzx',
        link: 'https://app.siputzx.my.id/playground',
        result: data
    };
};

module.exports = instagramController;