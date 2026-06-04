const axios = require('axios');

const BASE_URL = 'https://api.jikan.moe/v4';

const jikan = {
    request: async (endpoint, params = {}) => {
        try {
            const response = await axios.get(`${BASE_URL}${endpoint}`, {
                params,
                headers: {
                    'User-Agent': 'PuruBoy-API/1.0.0'
                }
            });
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data?.message || error.message || 'Jikan API Error');
        }
    },

    getTopAnime: async (page = 1, limit = 10) => {
        return await jikan.request('/top/anime', { page, limit });
    },

    getSeasonNow: async (page = 1, limit = 10) => {
        return await jikan.request('/seasons/now', { page, limit });
    },

    searchAnime: async (q, page = 1, limit = 10) => {
        return await jikan.request('/anime', { q, page, limit });
    },

    getAnimeByGenre: async (genreId, page = 1, limit = 10) => {
        // genres: Comma separated genre IDs
        return await jikan.request('/anime', { genres: genreId, page, limit });
    }
};

module.exports = jikan;