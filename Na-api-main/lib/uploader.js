const axios = require('axios');
const FormData = require('form-data');
const { encrypt } = require('./crypto');

/**
 * Upload file ke layanan sementara (tmpfiles.org).
 * Mengembalikan URL Proxy terenkripsi (/api/media/...).
 */
async function uploadToTmp(buffer, filename = 'image.png') {
    if (!Buffer.isBuffer(buffer)) {
        throw new Error('Input harus berupa Buffer.');
    }

    const form = new FormData();
    form.append("file", buffer, filename);

    try {
        const response = await axios.post("https://tmpfiles.org/api/v1/upload", form, {
            headers: {
                ...form.getHeaders(),
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36'
            }
        });

        if (response.data.status !== 'success') {
            throw new Error('Gagal mengupload ke tmpfiles.org');
        }

        const rawUrl = response.data.data.url;
        
        // Perbaikan Regex: Pastikan menyisipkan /dl/ tepat setelah domain tmpfiles.org
        // Mendukung variasi http/https dan www.
        const realUrl = rawUrl.replace(/https?:\/\/(www\.)?tmpfiles\.org\//, 'https://tmpfiles.org/dl/');
        
        // Encrypt URL dan kembalikan Path Proxy relatif
        const encrypted = encrypt(realUrl);
        const proxyUrl = `/api/media/${encrypted}`;
        
        return proxyUrl;

    } catch (error) {
        if (error.response) {
            throw new Error(`Uploader Error: Upload failed with status ${error.response.status}`);
        }
        throw new Error(`Uploader Error: ${error.message}`);
    }
}

module.exports = { uploadToTmp };