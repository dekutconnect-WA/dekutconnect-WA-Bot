const cloudscraper = require('cloudscraper');
const cheerio = require('cheerio');

const BASE_URL = 'https://nekokun.my.id';

const HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
    'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
    'Referer': BASE_URL + '/',
};

const makeProxyLink = (originalUrl, type, apiBaseUrl) => {
    if (!apiBaseUrl || !originalUrl) return originalUrl;
    const cleanPath = originalUrl.replace(BASE_URL, '').replace(/^\/+/, '');
    const endpoint = type === 'detail' ? 'detail' : 'stream';
    return `${apiBaseUrl}/api/anime/nekokun/${endpoint}?url=/${encodeURIComponent(cleanPath)}`;
};

async function getHome(apiBaseUrl, page = 1) {
    try {
        const url = page > 1 ? `${BASE_URL}/page/${page}/` : BASE_URL + '/';
        const data = await cloudscraper.get({ uri: url, headers: HEADERS });
        const $ = cheerio.load(data);
        
        const latest = [];
        const popular = [];

        $('.listupd:not(.popularslider) article.bs, .listupd:not(.popularslider) .bs').each((_, el) => {
            const title = $(el).find('.tt h2').text().trim() || $(el).find('.tt').text().trim();
            const thumb = $(el).find('img').attr('data-src') || $(el).find('img').attr('src') || '';
            const ep = $(el).find('.epx').text().trim();
            const type = $(el).find('.typez').text().trim();
            const originalUrl = $(el).find('a').attr('href');
            if (originalUrl) {
                latest.push({ 
                    title, 
                    thumbnail: thumb, 
                    episode: ep, 
                    type, 
                    original_url: originalUrl,
                    url: makeProxyLink(originalUrl, 'stream', apiBaseUrl)
                });
            }
        });

        $('.popularslider article.bs').each((_, el) => {
            const title = $(el).find('.tt h2').text().trim() || $(el).find('.tt').text().trim();
            const thumb = $(el).find('img').attr('data-src') || $(el).find('img').attr('src') || '';
            const ep = $(el).find('.epx').text().trim();
            const type = $(el).find('.typez').text().trim();
            const originalUrl = $(el).find('a').attr('href');
            if (originalUrl) {
                popular.push({ 
                    title, 
                    thumbnail: thumb, 
                    episode: ep, 
                    type, 
                    original_url: originalUrl,
                    url: makeProxyLink(originalUrl, 'detail', apiBaseUrl)
                });
            }
        });

        const pagination = $('.pagination, .hpage, .page-numbers');
        return {
            latest: {
                data: latest,
                hasNext: pagination.find('.next, .next.page-numbers').length > 0,
                hasPrev: pagination.find('.prev, .prev.page-numbers').length > 0,
            },
            popular
        };
    } catch (error) {
        throw new Error(`Nekokun Home Error: ${error.message}`);
    }
}

async function search(apiBaseUrl, query, page = 1) {
    try {
        const url = page > 1 
          ? `${BASE_URL}/page/${page}/?s=${encodeURIComponent(query)}`
          : `${BASE_URL}/?s=${encodeURIComponent(query)}`;
        
        const data = await cloudscraper.get({ uri: url, headers: HEADERS });
        const $ = cheerio.load(data);
        const results = [];

        $('.listupd article.bs, .listupd .bs').each((_, el) => {
            const originalUrl = $(el).find('a').attr('href');
            if (originalUrl) {
                results.push({
                    title: $(el).find('.tt h2').text().trim() || $(el).find('.tt').text().trim(),
                    thumbnail: $(el).find('img').attr('data-src') || $(el).find('img').attr('src') || '',
                    episode: $(el).find('.epx').text().trim(),
                    type: $(el).find('.typez').text().trim(),
                    original_url: originalUrl,
                    url: makeProxyLink(originalUrl, 'detail', apiBaseUrl)
                });
            }
        });

        const pagination = $('.pagination, .hpage, .page-numbers');
        return {
            data: results,
            hasNext: pagination.find('.next, .next.page-numbers').length > 0,
            hasPrev: pagination.find('.prev, .prev.page-numbers').length > 0,
        };
    } catch (error) {
        throw new Error(`Nekokun Search Error: ${error.message}`);
    }
}

async function getDetail(apiBaseUrl, path) {
    try {
        const url = path.startsWith('http') ? path : `${BASE_URL}${path}`;
        const data = await cloudscraper.get({ uri: url, headers: { ...HEADERS, Referer: BASE_URL + '/' } });
        const $ = cheerio.load(data);
        
        const isEpisodePage = url.includes('/episode-') || !$('.eplister').length;
        const seriesUrl = $('.nvsc a').attr('href') || $('.ts-breadcrumb a[href*="/anime/"]').first().attr('href');
        
        if (isEpisodePage && seriesUrl && seriesUrl !== url) {
            return getDetail(apiBaseUrl, seriesUrl);
        }

        const info = {};
        $('.info-content .spe span').each((_, el) => {
            const keyPart = $(el).find('b').text();
            const key = keyPart.replace(':', '').trim().toLowerCase();
            const value = $(el).text().replace(keyPart, '').trim();
            if (key) info[key] = value;
        });

        const episodes = [];
        $('.eplister ul li').each((_, el) => {
            const originalUrl = $(el).find('a').attr('href');
            episodes.push({
                title: $(el).find('.epl-title').text().trim(),
                original_url: originalUrl,
                url: makeProxyLink(originalUrl, 'stream', apiBaseUrl),
                date: $(el).find('.epl-date').text().trim()
            });
        });

        return {
            title: $('.entry-title').text().trim(),
            thumbnail: $('.thumb img').attr('data-src') || $('.thumb img').attr('src'),
            synopsis: $('.entry-content[itemprop="description"]').text().trim() || $('.desc').text().trim(),
            info,
            episodes
        };
    } catch (error) {
        throw new Error(`Nekokun Detail Error: ${error.message}`);
    }
}

async function getEpisode(apiBaseUrl, path) {
    try {
        const url = path.startsWith('http') ? path : `${BASE_URL}${path}`;
        const data = await cloudscraper.get({ uri: url, headers: { ...HEADERS, Referer: BASE_URL + '/' } });
        const $ = cheerio.load(data);
        
        const streaming = [];
        
        const mainStream = $('#pembed iframe').attr('src');
        if (mainStream) streaming.push({ name: 'Default', url: mainStream });

        $('.mirror option').each((_, el) => {
            const name = $(el).text().trim();
            const val = $(el).val();
            if (name && !name.includes('Pilih')) {
                streaming.push({ name, url: val });
            }
        });

        const download = [];
        $('.soraddlx, .soraurlx').each((_, el) => {
            const quality = $(el).find('strong, h3').first().text().trim();
            const links = [];
            $(el).find('a').each((_, a) => {
                links.push({ host: $(a).text().trim(), url: $(a).attr('href') });
            });
            if (quality && links.length > 0) download.push({ quality, links });
        });

        return {
            title: $('.entry-title').text().trim(),
            streaming,
            download,
            prev: $('.naveps .nvs a[rel="prev"]').attr('href') || null,
            next: $('.naveps .nvs a[rel="next"]').attr('href') || null,
        };
    } catch (error) {
        throw new Error(`Nekokun Episode Error: ${error.message}`);
    }
}

module.exports = {
    getHome,
    search,
    getDetail,
    getEpisode
};
