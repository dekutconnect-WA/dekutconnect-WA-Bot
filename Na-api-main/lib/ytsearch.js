const axios = require('axios');

/**
 * Fungsi untuk mencari lagu di devers-en-geste.fr dan menampilkan Link YouTube
 * @param {string} query - Kata kunci pencarian
 */
async function search(query) {
    if (!query) throw new Error("Query is required.");
    const baseURL = 'https://www.devers-en-geste.fr/search';
    
    try {
        const response = await axios.get(baseURL, {
            params: {
                q: query
            },
            headers: {
                'Accept': 'application/json, text/javascript, */*; q=0.01',
                'X-Requested-With': 'XMLHttpRequest',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
                'Referer': 'https://www.devers-en-geste.fr/'
            }
        });

        const data = response.data;
        if (!data.items) return [];

        return data.items.map(item => ({
            title: item.title,
            url: `https://www.youtube.com/watch?v=${item.id}`,
            videoId: item.id,
            channel: item.channelTitle,
            duration: item.duration,
            size: item.size,
            thumbnail: `https://i.ytimg.com/vi/${item.id}/hqdefault.jpg`
        }));

    } catch (error) {
        throw new Error(error.message);
    }
}

module.exports = { search };