const axios = require('axios');

/**
 * puruAI API (Time Aware)
 * Advanced AI Gateway by PuruBoy
 */
async function askPuruAI(userId, prompt, model = 'puruboy-flash', system = '') {
    try {
        const response = await axios.get('https://nirkyy-learning.hf.space/chat', {
            params: {
                userid: userId,
                prompt: prompt,
                model: model,
                system: system
            }
        });

        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.message || error.message);
    }
}

module.exports = { askPuruAI };