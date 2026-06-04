const axios = require('axios');
const crypto = require('crypto');

const MASTER_KEY_HEX = 'C5D58EF67A7584E4A29F6C35BBC4EB12';

/**
 * Decrypts Savetube API response
 */
function decryptPayload(encryptedBase64) {
    const dataBuffer = Buffer.from(encryptedBase64, 'base64');
    const iv = dataBuffer.slice(0, 16);
    const ciphertext = dataBuffer.slice(16);
    const key = Buffer.from(MASTER_KEY_HEX, 'hex');
    const decipher = crypto.createDecipheriv('aes-128-cbc', key, iv);
    let decrypted = decipher.update(ciphertext, 'binary', 'utf8');
    decrypted += decipher.final('utf8');
    return JSON.parse(decrypted);
}

const savetube = {
    /**
     * Get active CDN node
     */
    getCDN: async () => {
        const res = await axios.get('https://media.savetube.vip/api/random-cdn');
        return res.data.cdn;
    },

    /**
     * Get Video/Audio Info and Decrypt
     */
    getInfo: async (url) => {
        const cdn = await savetube.getCDN();
        const res = await axios.post(`https://${cdn}/v2/info`, { url }, {
            headers: { 
                'Content-Type': 'application/json', 
                'Origin': 'https://ytmp4.co.za',
                'Referer': 'https://ytmp4.co.za/'
            }
        });

        if (!res.data.status) throw new Error(res.data.message || "Failed to fetch info");
        
        const decrypted = decryptPayload(res.data.data);
        return {
            cdn,
            ...decrypted
        };
    },

    /**
     * Generate final download link for specific quality
     */
    getDownload: async (cdn, key, quality, type = 'video') => {
        const res = await axios.post(`https://${cdn}/download`, {
            downloadType: type,
            quality: quality,
            key: key
        }, {
            headers: { 
                'Content-Type': 'application/json', 
                'Origin': 'https://ytmp4.co.za',
                'Referer': 'https://ytmp4.co.za/'
            }
        });

        if (!res.data.status) throw new Error(res.data.message || "Failed to generate link");
        return res.data.data;
    }
};

module.exports = savetube;