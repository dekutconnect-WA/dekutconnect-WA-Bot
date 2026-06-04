const axios = require('axios');

/**
 * [ *CLAUDE-HAIKU* ]
 * 🔗 Base Url: overchat.com
 * 👤 Creator: Hazel
 * 📝 Noted: Bang bantu follow ah, Jangan 100% percaya sama ai
 * 🔗 Links Pastebin: https://fgsi.dpdns.org/pastebin/rT7yw91R
 * https://whatsapp.com/channel/0029VbCFHgx2ZjCilnMuM50X/231
 */

async function overchat(question) {
    if (!question) throw new Error('Question is required.');

    const payload = {
        chatId: "6c35194a-a004-4efe-980a-df317eb105b7",
        model: "claude-haiku-4-5-20251001",
        messages: [
            {
                id: "fcebb6f5-2d7c-42c0-a177-ced59262c453",
                role: "user",
                content: question
            },
            {
                id: "4aad5888-14ec-4dbb-9d1f-ac8b243565e3",
                role: "system",
                content: ""
            }
        ],
        personaId: "claude-haiku-4-5-landing",
        frequency_penalty: 0,
        max_tokens: 4000,
        presence_penalty: 0,
        stream: true,
        temperature: 0.5,
        top_p: 0.95
    };

    try {
        const response = await axios.post(
            'https://api.overchat.ai/v1/chat/completions',
            payload,
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': '*/*',
                    'X-Device-Platform': 'web',
                    'X-Device-Language': 'id-ID',
                    'X-Device-Uuid': '0084ff72-2faf-4338-ac78-f0e59fad3108',
                    'X-Device-Version': '1.0.44',
                    'Origin': 'https://overchat.ai'
                }
            }
        );

        let result = '';
        const lines = response.data.split('\n');
        
        for (const line of lines) {
            if (line.startsWith('data: ') && !line.includes('[DONE]')) {
                const jsonStr = line.replace('data: ', '');
                try {
                    const data = JSON.parse(jsonStr);
                    if (data.choices && data.choices[0] && data.choices[0].delta && data.choices[0].delta.content) {
                        result += data.choices[0].delta.content;
                    }
                } catch (e) {
                    // Skip invalid JSON chunks
                }
            }
        }
        
        return result;
    } catch (err) {
        throw err;
    }
}

module.exports = { overchat };