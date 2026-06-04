const axios = require('axios');
const cheerio = require('cheerio');
const FormData = require('form-data');
const crypto = require('crypto');

// Fungsi jeda
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const BASE_URL = 'http://1page.ct.ws';
const TARGET_ENDPOINT = `${BASE_URL}/index.php`;

// Fungsi untuk memecahkan tantangan AES (Bypass __test cookie)
function solveAntibot(html) {
    try {
        const a = html.match(/a=toNumbers\("([a-f0-9]+)"\)/)[1];
        const b = html.match(/b=toNumbers\("([a-f0-9]+)"\)/)[1];
        const c = html.match(/c=toNumbers\("([a-f0-9]+)"\)/)[1];

        const key = Buffer.from(a, 'hex');
        const iv = Buffer.from(b, 'hex');
        const ciphertext = Buffer.from(c, 'hex');

        const decipher = crypto.createDecipheriv('aes-128-cbc', key, iv);
        decipher.setAutoPadding(false); // Hosting ini biasanya tidak pakai padding standar

        let decrypted = decipher.update(ciphertext, 'hex', 'hex');
        decrypted += decipher.final('hex');

        return decrypted;
    } catch (e) {
        return null;
    }
}

/**
 * Automasi pembuatan halaman di 1page.ct.ws
 */
async function createPage(pageName, htmlContent) {
    let cookies = [];
    
    // Inisialisasi Instance Axios
    const client = axios.create({
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        },
        withCredentials: true,
        timeout: 20000
    });

    try {
        let response = await client.get(BASE_URL);

        // Cek apakah terkena tantangan Anti-Bot
        if (response.data.includes('__test')) {
            const cookieValue = solveAntibot(response.data);
            
            if (cookieValue) {
                const testCookie = `__test=${cookieValue}`;
                cookies.push(testCookie);
                
                // Akses ulang dengan cookie __test
                response = await client.get(BASE_URL, {
                    headers: { 'Cookie': cookies.join('; ') }
                });
            }
        }

        // Ambil Cookie Sesi (PHPSESSID)
        if (response.headers['set-cookie']) {
            const sessionCookies = response.headers['set-cookie'].map(c => c.split(';')[0]);
            cookies = [...new Set([...cookies, ...sessionCookies])];
        }

        // Analisis Halaman Utama (CSRF & Captcha)
        const $ = cheerio.load(response.data);
        const csrfToken = $('input[name="csrf_token"]').val();
        const captchaText = $('#captcha-question').text();

        if (!csrfToken) throw new Error("Gagal mendapatkan CSRF Token. Bypass Anti-Bot mungkin gagal.");

        const mathMatch = captchaText.match(/(\d+)\s*([\+\-\*])\s*(\d+)/);
        if (!mathMatch) throw new Error("Gagal memproses Captcha.");

        const num1 = parseInt(mathMatch[1]);
        const op = mathMatch[2];
        const num2 = parseInt(mathMatch[3]);
        
        let captchaAnswer;
        if (op === '+') captchaAnswer = num1 + num2;
        else if (op === '-') captchaAnswer = num1 - num2;
        else if (op === '*') captchaAnswer = num1 * num2;

        // Tunggu Anti-Spam (Wajib oleh hosting)
        await sleep(6500);

        const form = new FormData();
        form.append('csrf_token', csrfToken);
        form.append('action', 'create_page');
        form.append('page_name', pageName);
        form.append('html_code', htmlContent);
        form.append('html_file', '', { filename: '' });
        form.append('captcha_answer', captchaAnswer.toString());

        const finalResponse = await client.post(TARGET_ENDPOINT, form, {
            headers: {
                ...form.getHeaders(),
                'Cookie': cookies.join('; '),
                'Referer': BASE_URL + '/',
                'X-Requested-With': 'XMLHttpRequest'
            }
        });

        if (finalResponse.data && finalResponse.data.success) {
            return {
                success: true,
                page_url: finalResponse.data.page_url,
                message: finalResponse.data.message
            };
        } else {
            throw new Error(finalResponse.data?.message || "Gagal membuat halaman.");
        }

    } catch (error) {
        throw new Error(error.message);
    }
}

module.exports = { createPage };