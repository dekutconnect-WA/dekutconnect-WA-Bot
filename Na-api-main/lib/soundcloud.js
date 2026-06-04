const axios = require('axios');
const cheerio = require('cheerio');
const qs = require('querystring');

// URL Target
const BASE_URL = 'https://www.forhub.io/soundcloud/';
const DOWNLOAD_API = 'https://www.forhub.io/download.php';

// Header dasar menyerupai browser (User-Agent dari curl request)
const HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Linux; Android 10; RMX2185 Build/QP1A.190711.020) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.7444.171 Mobile Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
    'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
    'sec-ch-ua': '"Chromium";v="142", "Android WebView";v="142", "Not_A Brand";v="99"',
    'sec-ch-ua-mobile': '?1',
    'sec-ch-ua-platform': '"Android"',
    'upgrade-insecure-requests': '1',
    'sec-fetch-site': 'same-origin',
    'sec-fetch-mode': 'navigate',
    'sec-fetch-user': '?1',
    'sec-fetch-dest': 'document',
};

async function downloadSoundCloud(url) {
    if (!url) {
        throw new Error('URL tidak boleh kosong.');
    }

    try {
        // 1. GET Request untuk mendapatkan CSRF Token dan Cookies
        const pageResponse = await axios.get(BASE_URL, { headers: HEADERS });
        
        // Ambil Cookies dari response header 'set-cookie'
        const rawCookies = pageResponse.headers['set-cookie'];
        if (!rawCookies) throw new Error("Gagal mengambil cookie dari forhub.io.");
        
        // Format cookie menjadi string (terutama PHPSESSID)
        const cookieStr = rawCookies.map(c => c.split(';')[0]).join('; ');
        
        // Load HTML dengan Cheerio untuk ambil hidden input csrf_token
        const $ = cheerio.load(pageResponse.data);
        const csrfToken = $('input[name="csrf_token"]').val();
        
        if (!csrfToken) throw new Error("Gagal mengambil CSRF Token.");
        
        // 2. POST Request ke download.php
        const payload = qs.stringify({
            'csrf_token': csrfToken,
            'formurl': url
        });

        const postHeaders = {
            ...HEADERS,
            'Content-Type': 'application/x-www-form-urlencoded',
            'Origin': 'https://www.forhub.io',
            'Referer': 'https://www.forhub.io/soundcloud/en8/',
            'Cookie': cookieStr, // Penting: Kirim balik cookie yang didapat
            'x-requested-with': 'mark.via.gp'
        };

        const downloadResponse = await axios.post(DOWNLOAD_API, payload, { 
            headers: postHeaders 
        });

        // 3. Ekstrak Hasil dari HTML Response
        const $dl = cheerio.load(downloadResponse.data);
        
        // Mencari elemen div dengan id="dlMP3" sesuai snippet HTML
        const downloadDiv = $dl('#dlMP3');

        if (downloadDiv.length === 0) {
            throw new Error("Tombol download tidak ditemukan. Mungkin URL salah atau layanan sedang sibuk.");
        }

        // Ambil atribut data-src (base64) dan data-name
        const encodedUrl = downloadDiv.attr('data-src');
        const fileName = downloadDiv.attr('data-name'); // Judul file
        const fullTitle = downloadDiv.attr('title'); // Judul lengkap dengan ekstensi

        // Decode Base64 menjadi URL asli
        const decodedUrl = Buffer.from(encodedUrl, 'base64').toString('utf-8');

        const result = {
            title: fileName,
            full_title: fullTitle ? fullTitle.replace('Download ', '') : fileName + '.mp3',
            download_url: decodedUrl
        };

        return result;

    } catch (error) {
        if (error.response) {
            throw new Error(`HTTP Error: ${error.response.status}`);
        }
        throw new Error(error.message || 'Terjadi kesalahan saat mengunduh dari SoundCloud.');
    }
}

module.exports = { downloadSoundCloud };