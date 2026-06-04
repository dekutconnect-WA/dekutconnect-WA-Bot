/**
 * @title M3U8 to MP4
 * @summary Konversi HLS (M3U8) ke MP4.
 * @description Mengunduh dan mengonversi playlist video streaming (HLS/M3U8) menjadi satu file MP4 yang solid. Endpoint ini menggunakan Server-Sent Events (SSE) karena proses penggabungan video membutuhkan waktu sesuai durasi.
 * @method POST
 * @path /api/tools/m3u8
 * @response json
 * @param {string} body.url - URL playlist M3U8 (HLS).
 * @example
 * async function convertM3U8() {
 *   const res = await fetch('/api/tools/m3u8', {
 *     method: 'POST',
 *     headers: { 'Content-Type': 'application/json' },
 *     body: JSON.stringify({ "url": "https://cdn.jwplayer.com/manifests/pZxWPRg4.m3u8" })
 *   });
 *   
 *   const reader = res.body.getReader();
 *   const decoder = new TextDecoder();
 *   while (true) {
 *     const { done, value } = await reader.read();
 *     if (done) break;
 *     console.log(decoder.decode(value));
 *   }
 * }
 */
const m3u8Controller = async (req) => {
    return { status: 'SSE Stream Endpoint' };
};

module.exports = m3u8Controller;