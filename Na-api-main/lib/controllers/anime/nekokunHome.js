/**
 * @title Nekokun Home
 * @summary Beranda Nekokun.
 * @description Mengambil data dari halaman utama Nekokun, mencakup anime terbaru dan populer.
 * @method GET
 * @path /api/anime/nekokun/home
 * @param {string} [query.page] - Nomor halaman.
 * @example
 * async function getHome() {
 *   const res = await fetch('/api/anime/nekokun/home?page=1');
 *   const data = await res.json();
 *   console.log(data);
 * }
 */
const nekokun = require('../../nekokun');

const nekokunHomeController = async (req) => {
    const origin = req.origin || '';
    const page = req.query?.page || 1;
    const result = await nekokun.getHome(origin, page);

    return {
        success: true,
        author: 'PuruBoy',
        result: result
    };
};

module.exports = nekokunHomeController;
