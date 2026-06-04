const axios = require('axios');
const { uploadToTmp } = require('./uploader');

/**
 * GraduallyAI - FLUX Image Generator Wrapper
 * Author: RE Specialist (Integrated for PuruBoy API)
 */
class GraduallyAI {
    constructor() {
        this.baseUrl = 'https://www.gradually.ai';
        this.client = axios.create({
            baseURL: this.baseUrl,
            headers: {
                'authority': 'www.gradually.ai',
                'accept': '*/*',
                'content-type': 'application/json',
                'origin': this.baseUrl,
                'referer': `${this.baseUrl}/en/flux-ai-image-generator/`,
                'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            },
            timeout: 60000 
        });
    }

    /**
     * Menghasilkan prompt gabungan sesuai standar UI Gradually.ai
     */
    _formatPrompt(options) {
        if (typeof options === 'string') return options;
        
        const parts = [options.prompt];
        if (options.style) parts.push(`${options.style} style`);
        if (options.light) parts.push(`${options.light} Light`);
        if (options.mood) parts.push(`${options.mood} mood`);
        if (options.perspective) parts.push(`${options.perspective} view`);
        if (options.material) parts.push(`made of ${options.material}`);
        
        return parts.filter(Boolean).join(', ');
    }

    async generate(prompt) {
        // Karena API internal kita menerima string prompt tunggal, 
        // kita kirimkan string tersebut langsung.
        const fullPrompt = this._formatPrompt(prompt);

        try {
            const response = await this.client.post('/api/generate-image/', {
                prompt: fullPrompt
            });

            if (response.data && response.data.imageUrl) {
                return response.data.imageUrl;
            } else {
                throw new Error('Invalid response format from GraduallyAI');
            }
        } catch (error) {
            if (error.response?.status === 429) {
                throw new Error('Rate limit reached (GraduallyAI). Max 6 images/min.');
            }
            throw new Error(error.message || 'Internal GraduallyAI Error');
        }
    }
}

/**
 * Main function for NextA/PuruBoy API
 */
async function generateFlux(prompt) {
    if (!prompt) {
        throw new Error('Parameter prompt diperlukan.');
    }

    try {
        const api = new GraduallyAI();
        const base64Image = await api.generate(prompt);

        if (!base64Image.startsWith('data:image')) {
            throw new Error('Respons tidak mengandung data gambar base64.');
        }

        // Ekstrak buffer dari base64
        const base64Data = base64Image.split(';base64,').pop();
        const buffer = Buffer.from(base64Data, 'base64');

        // Upload ke sistem penyimpanan sementara kita
        const proxyUrl = await uploadToTmp(buffer, `flux-${Date.now()}.jpg`);

        return {
            success: true,
            result: {
                url: proxyUrl, // Relatif /api/media/...
                prompt: prompt,
                type: 'text-to-image'
            }
        };

    } catch (error) {
        throw error;
    }
}

module.exports = { generateFlux };