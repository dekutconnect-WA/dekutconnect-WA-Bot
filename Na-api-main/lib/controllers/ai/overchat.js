/**
 * @title Claude Haiku AI
 * @summary Claude Haiku Chat (Overchat).
 * @description Berinteraksi dengan model Claude Haiku melalui provider Overchat.ai. Memberikan jawaban cerdas dan cepat. Credit: Hazel.
 * @method POST
 * @path /api/ai/overchat
 * @response json
 * @param {string} body.question - Pertanyaan atau pesan untuk AI.
 * @example
 * async function askClaude() {
 *   const res = await fetch('/api/ai/overchat', {
 *     method: 'POST',
 *     headers: { 'Content-Type': 'application/json' },
 *     body: JSON.stringify({ "question": "Halo Claude!" })
 *   });
 *   const data = await res.json();
 *   console.log(data.result);
 * }
 */
const { overchat } = require('../../overchat');

const overchatController = async (req) => {
    const { question } = req.body;

    if (!question) {
        throw new Error("Parameter 'question' wajib diisi.");
    }

    const answer = await overchat(question);

    return {
        success: true,
        author: 'PuruBoy x Hazel',
        result: answer
    };
};

module.exports = overchatController;