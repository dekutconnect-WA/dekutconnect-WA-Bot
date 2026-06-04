/**
 * @title puruAI (Time Aware)
 * @summary Advanced AI Gateway by PuruBoy.
 * @description Model AI yang menyadari waktu dan urutan pesan. Mendukung persistensi riwayat (history) per UserID menggunakan Node-cache.
 * @method POST
 * @path /api/ai/puruai
 * @response json
 * @param {string} body.userid - Session ID untuk riwayat pesan persisten.
 * @param {string} body.prompt - Pesan dari pengguna.
 * @param {string} body.model - Pilihan model: 'puruboy-flash' atau 'puruboy-pro'.
 * @param {string} [body.system] - (Opsional) Instruksi kepribadian dasar AI.
 * @example
 * async function chat() {
 *   const res = await fetch('/api/ai/puruai', {
 *     method: 'POST',
 *     headers: { 'Content-Type': 'application/json' },
 *     body: JSON.stringify({ 
 *       "userid": "user-session-001", 
 *       "prompt": "Halo, siapa namamu?",
 *       "model": "puruboy-flash",
 *       "system": "Kamu adalah AI asisten dari PuruBoy yang ramah."
 *     })
 *   });
 *   const data = await res.json();
 *   console.log(data);
 * }
 */
const { askPuruAI } = require('../../puruai');

const puruaiController = async (req) => {
    const { userid, prompt, model, system } = req.body;

    if (!userid || !prompt || !model) {
        throw new Error("Parameter 'userid', 'prompt', dan 'model' wajib diisi.");
    }

    const result = await askPuruAI(userid, prompt, model, system || '');

    return {
        success: true,
        author: 'PuruBoy',
        result: result
    };
};

module.exports = puruaiController;