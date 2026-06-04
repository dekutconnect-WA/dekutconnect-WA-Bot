/**
 * @title DeepSeek R1
 * @summary DeepSeek R1 via ChatGot.
 * @description Berinteraksi dengan model DeepSeek R1 yang memiliki kemampuan reasoning (berpikir). Endpoint ini menggunakan Server-Sent Events (SSE) untuk streaming output proses berpikir (reasoning) dan jawaban akhir.
 * @method POST
 * @path /api/ai/deepseek
 * @response json
 * @param {string} body.prompt - Pertanyaan atau instruksi.
 * @example
 * async function askDeepSeek() {
 *   const response = await fetch('/api/ai/deepseek', {
 *     method: 'POST',
 *     headers: { 'Content-Type': 'application/json' },
 *     body: JSON.stringify({ 
 *       "prompt": "Jelaskan kenapa langit berwarna biru?"
 *     })
 *   });
 * 
 *   const reader = response.body.getReader();
 *   const decoder = new TextDecoder();
 *   
 *   while (true) {
 *     const { done, value } = await reader.read();
 *     if (done) break;
 *     const text = decoder.decode(value);
 *     // Output berupa SSE event: data: {...}
 *     console.log(text);
 *   }
 * }
 */
const deepseekController = async (req) => {
    // Dummy controller for documentation generation
    return { status: 'SSE Stream Endpoint' };
};

module.exports = deepseekController;