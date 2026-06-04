/**
 * @title Nekokun Detail
 * @summary Detail anime dari Nekokun.
 * @description Mengambil informasi lengkap anime termasuk daftar episode.
 * @method GET
 * @path /api/anime/nekokun/detail
 * @param {string} query.url - Path atau URL anime dari Nekokun.
 * @example
 * async function getDetail() {
 *   const res = await fetch('/api/anime/nekokun/detail?url=/anime/one-piece/');
 *   const data = await res.json();
 *   console.log(data);
 * }
 */
const nekokun = require('../../nekokun');

const nekokunDetailController = async (req) => {
    const origin = req.origin || '';
    const url = req.query?.url || '';

    if (!url) {
        throw new Error("Parameter 'url' wajib diisi.");
    }

    const result = await nekokun.getDetail(origin, url);

    return {
        success: true,
        author: 'PuruBoy',
        result: result
    };
};

module.exports = nekokunDetailController;
