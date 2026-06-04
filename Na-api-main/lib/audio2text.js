const axios = require('axios');

/**
 * Audio to Text (Transcription) Service
 * @param {string} audioUrl - URL file audio yang ingin ditranskripsi.
 */
async function transcribe(audioUrl) {
    if (!audioUrl) throw new Error("Audio URL is required.");
    const baseURL = 'https://nirkyy-audio2text.hf.space/generate';
    
    try {
        const response = await axios.get(baseURL, {
            params: { url: audioUrl },
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
            }
        });

        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.message || error.message);
    }
}

module.exports = { transcribe };