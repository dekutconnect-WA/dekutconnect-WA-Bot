/**
 * @title Nekokun Search
 * @summary Cari anime di Nekokun.
 * @description Mencari anime berdasarkan kata kunci di database Nekokun.
 * @method GET
 * @path /api/anime/nekokun/search
 * @param {string} query.q - Kata kunci pencarian.
 * @param {string} [query.page] - Nomor halaman.
 * @example
 * async function searchAnime() {
 *   const res = await fetch('/api/anime/nekokun/search?q=One Piece&page=1');
 *   const data = await res.json();
 *   console.log(data);
 * }
 */
const nekokun = require('../../nekokun');

const nekokunSearchController = async (req) => {
    const origin = req.origin || '';
    const query = req.query?.q || '';
    const page = req.query?.page || 1;

    if (!query) {
        throw new Error("Parameter 'q' wajib diisi.");
    }

    const result = await nekokun.search(origin, query, page);

    return {
        success: true,
        author: 'PuruBoy',
        result: result
    };
};

module.exports = nekokunSearchController;
