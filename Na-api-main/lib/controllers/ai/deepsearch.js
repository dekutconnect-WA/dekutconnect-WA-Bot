/**
 * @title DeepSearch Chat
 * @summary DeepSeek R1 / Deep Thinking Chat.
 * @description Berinteraksi dengan model DeepSearch (DeepSeek R1/V3) yang mendukung kemampuan "Reasoning" atau berpikir mendalam sebelum menjawab. Endpoint ini menggunakan Server-Sent Events (SSE) untuk streaming output proses berpikir (reasoning) dan jawaban akhir.
 * @method POST
 * @path /api/ai/deepsearch
 * @response json
 * @param {string} body.prompt - Pertanyaan atau instruksi.
 * @param {string} [body.modelType] - Tipe model: 'reasoner' (Deep Thinking) atau 'chat' (Fast). Default: 'reasoner'.
 * @example
 * async function askDeepSearch() {
 *   const response = await fetch('/api/ai/deepsearch', {
 *     method: 'POST',
 *     headers: { 'Content-Type': 'application/json' },
 *     body: JSON.stringify({ 
 *       "prompt": "Jelaskan tentang Black Hole secara sederhana",
 *       "modelType": "reasoner"
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
 *     // Format SSE: data: {"type": "reasoning"|"text", "content": "..."}
 *     console.log(text);
 *   }
 * }
 */
const deepsearchController = async (req) => {
    // Dummy controller for documentation generation
    return { status: 'SSE Stream Endpoint' };
};

module.exports = deepsearchController;