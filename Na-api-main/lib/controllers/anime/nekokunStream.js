/**
 * @title Nekokun Stream
 * @summary Link streaming dan download anime dari Nekokun.
 * @description Mengambil link embed video dan link download untuk episode tertentu.
 * @method GET
 * @path /api/anime/nekokun/stream
 * @param {string} query.url - Path atau URL episode dari Nekokun.
 * @example
 * async function getStream() {
 *   const res = await fetch('/api/anime/nekokun/stream?url=/one-piece-episode-1162/');
 *   const data = await res.json();
 *   console.log(data);
 * }
 */
const nekokun = require('../../nekokun');

const nekokunStreamController = async (req) => {
    const origin = req.origin || '';
    const url = req.query?.url || '';

    if (!url) {
        throw new Error("Parameter 'url' wajib diisi.");
    }

    const result = await nekokun.getEpisode(origin, url);

    return {
        success: true,
        author: 'PuruBoy',
        result: result
    };
};

module.exports = nekokunStreamController;
