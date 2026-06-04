/**
 * ══════════════════════════════════════════════════════════
 *  Instagram Downloader — igDownloader.js
 *  Tier 1: SnapSave (snapsave.app) — obfuscated JS decode
 *  Tier 2: igram.world — correct POST payload
 *  Tier 3: SnapInsta (snapinsta.app) — form scraper
 * ══════════════════════════════════════════════════════════
 */

const axios    = require('axios');
const FormData = require('form-data');

const UA = 'Mozilla/5.0 (Linux; Android 10; SM-G975U) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.6099.144 Mobile Safari/537.36';

function normalizeUrl(url) {
    try {
        const u = new URL(url.trim());
        return `https://www.instagram.com${u.pathname.replace(/\/$/, '')}/`;
    } catch {
        return url.trim();
    }
}

// ─── Shared obfuscated-JS decoder (same algorithm as snaptik) ────────────────

function decodeObfuscatedJs(h, u, n, t, e, r) {
    const _0xc98e = ["", "split", "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ+/", "slice", "indexOf", "", "", ".", "pow", "reduce", "reverse", "0"];
    function _0xe54c(d, e, f) {
        const g = _0xc98e[2][_0xc98e[1]](_0xc98e[0]);
        const h2 = g[_0xc98e[3]](0, e);
        const i  = g[_0xc98e[3]](0, f);
        const j  = d[_0xc98e[1]](_0xc98e[0])[_0xc98e[10]]()[_0xc98e[9]](function(a, b, c) {
            if (h2[_0xc98e[4]](b) !== -1) return a += h2[_0xc98e[4]](b) * (Math[_0xc98e[8]](e, c));
        }, 0);
        let k = _0xc98e[0];
        let jj = j;
        while (jj > 0) { k = i[jj % f] + k; jj = (jj - (jj % f)) / f; }
        return k || _0xc98e[11];
    }
    let res = "";
    for (let i = 0, len = h.length; i < len; i++) {
        let s = "";
        while (h[i] !== n[e]) { s += h[i]; i++; }
        for (let j = 0; j < n.length; j++) s = s.replace(new RegExp(n[j], "g"), j);
        res += String.fromCharCode(_0xe54c(s, e, 10) - t);
    }
    return decodeURIComponent(escape(res));
}

function extractUrlsFromHtml(html) {
    const items = [];
    // mp4 links
    const mp4re = /href=["'](https?:\/\/[^"']+\.mp4[^"']*)/gi;
    let m;
    while ((m = mp4re.exec(html)) !== null) {
        const url = m[1].replace(/&amp;/g, '&');
        if (!items.find(i => i.url === url)) items.push({ url, type: 'video' });
    }
    // image links
    const jpgre = /href=["'](https?:\/\/[^"']+\.(jpg|jpeg|png|webp)[^"']*)/gi;
    while ((m = jpgre.exec(html)) !== null) {
        const url = m[1].replace(/&amp;/g, '&');
        if (!items.find(i => i.url === url)) items.push({ url, type: 'image' });
    }
    // thumbnail
    const thumbre = /src=["'](https?:\/\/[^"']+\.(jpg|jpeg|webp|png)[^"']*)/i;
    const thumb = thumbre.exec(html);
    return { items, thumbnail: thumb ? thumb[1].replace(/&amp;/g, '&') : null };
}

// ─── Tier 1: SnapSave (snapsave.app) ─────────────────────────────────────────

async function snapSave(url) {
    const form = new FormData();
    form.append('url', url);

    const res = await axios.post('https://snapsave.app/action.php?lang=en', form, {
        headers: {
            ...form.getHeaders(),
            'User-Agent': UA,
            'Referer': 'https://snapsave.app/',
            'Origin': 'https://snapsave.app',
        },
        timeout: 20000,
    });

    const raw = typeof res.data === 'string' ? res.data : JSON.stringify(res.data);

    // Response is obfuscated JS — decode it like snaptik does
    const regex = /}\("(.+?)",(\d+),"(.+?)",(\d+),(\d+),(\d+)\)\)/;
    const match = raw.match(regex);
    if (!match) {
        // Maybe already plain HTML — try direct extraction
        const direct = extractUrlsFromHtml(raw);
        if (direct.items.length) return direct;
        throw new Error('SnapSave: could not parse response');
    }

    const [, h, u, n, t, e, r] = match;
    const decoded = decodeObfuscatedJs(h, parseInt(u), n, parseInt(t), parseInt(e), parseInt(r));
    return extractUrlsFromHtml(decoded);
}

// ─── Tier 2: igram.world (correct payload) ────────────────────────────────────

async function igramWorld(url) {
    // igram.world needs a form with 'url' key sent as application/x-www-form-urlencoded
    const params = new URLSearchParams();
    params.append('url', url);
    params.append('lang', 'en');

    const res = await axios.post('https://igram.world/api/convert', params.toString(), {
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'User-Agent': UA,
            'Referer': 'https://igram.world/',
            'Origin': 'https://igram.world',
            'X-Requested-With': 'XMLHttpRequest',
        },
        timeout: 20000,
    });

    const data = res.data;
    if (!data?.media?.length) return null;

    const items = data.media.map(m => ({
        url: m.url,
        type: (m.ext || '').toLowerCase() === 'mp4' ? 'video' : 'image',
    }));

    const thumbnail = data.thumbnail || null;
    return { items, thumbnail };
}

// ─── Tier 3: SnapInsta (snapinsta.app) ───────────────────────────────────────

async function snapInsta(url) {
    // Step 1: get token from the homepage
    const homeRes = await axios.get('https://snapinsta.app/', {
        headers: { 'User-Agent': UA },
        timeout: 15000,
    });

    const tokenMatch = /<input[^>]+name="token"[^>]+value="([^"]+)"/.exec(homeRes.data);
    if (!tokenMatch) throw new Error('SnapInsta: token not found');

    const form = new FormData();
    form.append('url', url);
    form.append('lang', 'en');
    form.append('token', tokenMatch[1]);

    const res = await axios.post('https://snapinsta.app/action.php', form, {
        headers: {
            ...form.getHeaders(),
            'User-Agent': UA,
            'Referer': 'https://snapinsta.app/',
            'Origin': 'https://snapinsta.app',
        },
        timeout: 20000,
    });

    const raw = typeof res.data === 'string' ? res.data : JSON.stringify(res.data);

    // Try obfuscated decode first
    const regex = /}\("(.+?)",(\d+),"(.+?)",(\d+),(\d+),(\d+)\)\)/;
    const match = raw.match(regex);
    if (match) {
        const [, h, u, n, t, e, r] = match;
        const decoded = decodeObfuscatedJs(h, parseInt(u), n, parseInt(t), parseInt(e), parseInt(r));
        return extractUrlsFromHtml(decoded);
    }

    return extractUrlsFromHtml(raw);
}

// ─── Tier 4: sssinstagram.com ─────────────────────────────────────────────────

async function sssInstagram(url) {
    const params = new URLSearchParams({ url, lang: 'en' });
    const res = await axios.post('https://sssinstagram.com/request', params.toString(), {
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'User-Agent': UA,
            'Referer': 'https://sssinstagram.com/',
            'Origin': 'https://sssinstagram.com',
            'X-Requested-With': 'XMLHttpRequest',
        },
        timeout: 20000,
    });

    const data = res.data;
    // { links: [{url, quality}], thumbnail }
    if (!data?.links?.length) return null;

    const items = data.links.map(l => ({
        url: l.url,
        type: l.url.includes('.mp4') ? 'video' : 'image',
    }));

    return { items, thumbnail: data.thumbnail || null };
}

// ─── Main exported function ───────────────────────────────────────────────────

/**
 * Download Instagram media (Reels, Posts, Carousels)
 * @param {string} rawUrl
 * @returns {{ status: boolean, data: Array<{url,type,thumbnail}>, title: string, thumbnail: string|null }}
 */
async function download(rawUrl) {
    const url = normalizeUrl(rawUrl);

    const tiers = [
        { name: 'SnapSave',      fn: () => snapSave(url)      },
        { name: 'igram.world',   fn: () => igramWorld(url)    },
        { name: 'SnapInsta',     fn: () => snapInsta(url)     },
        { name: 'sssInstagram',  fn: () => sssInstagram(url)  },
    ];

    for (const tier of tiers) {
        try {
            const result = await tier.fn();
            if (result?.items?.length) {
                console.log(`✅ [igDownloader] ${tier.name} → ${result.items.length} item(s)`);
                return {
                    status: true,
                    data: result.items.map(item => ({
                        url: item.url,
                        type: item.type,
                        thumbnail: result.thumbnail || null,
                    })),
                    title: 'Instagram Media',
                    thumbnail: result.thumbnail || null,
                };
            }
            console.warn(`⚠️ [igDownloader] ${tier.name} returned 0 items`);
        } catch (e) {
            console.warn(`⚠️ [igDownloader] ${tier.name} failed: ${e.message}`);
        }
    }

    return { status: false, data: [], title: '', thumbnail: null };
}

module.exports = { download };
