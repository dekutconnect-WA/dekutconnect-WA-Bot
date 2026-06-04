import { NextResponse } from 'next/server';
import { generateFlux } from '../../../../lib/flux';
import tempService from '../../../../lib/tempService';

export const runtime = 'nodejs';

// Daftar Fakta Unik untuk Keep Alive
const FACTS = [
    "Flux adalah model generasi gambar yang sangat efisien.",
    "Semut tidak pernah tidur.",
    "Madu adalah satu-satunya makanan yang tidak basi.",
    "AI dapat memproses gambar ribuan kali lebih cepat dari manusia.",
    "Gajah adalah satu-satunya mamalia yang tidak bisa melompat.",
    "Lidah jerapah berwarna biru hitam.",
    "Otak manusia bekerja lebih aktif saat tidur daripada saat menonton TV.",
    "Air panas membeku lebih cepat daripada air dingin."
];

export async function POST(req) {
    try {
        const body = await req.json();
        const { prompt } = body;
        
        if (!prompt) {
            return NextResponse.json({ error: "Parameter 'prompt' wajib diisi." }, { status: 400 });
        }

        const origin = new URL(req.url).origin;
        const encoder = new TextEncoder();
        
        const customStream = new TransformStream();
        const writer = customStream.writable.getWriter();

        const send = (text) => {
            return writer.write(encoder.encode(text)).catch(() => {});
        };

        (async () => {
            let keepAliveInterval;
            try {
                await send(`Menghubungkan ke Engine GraduallyAI...\nGenerating: "${prompt}"\n`);

                // Timer untuk mengirim fakta setiap 2 detik agar koneksi tidak putus
                keepAliveInterval = setInterval(() => {
                    const fact = FACTS[Math.floor(Math.random() * FACTS.length)];
                    send(`Info: ${fact}\n`);
                }, 2000);

                const result = await generateFlux(prompt);
                
                clearInterval(keepAliveInterval);

                if (result.success) {
                    // Pastikan URL di result memiliki origin lengkap sebelum disimpan
                    if (result.result && result.result.url.startsWith('/')) {
                        result.result.url = origin + result.result.url;
                    }
                    
                    const dbId = await tempService.save(result, 30);
                    // Format SSE: [true] link_pengambilan_data
                    await send(`[true] ${origin}/api/temp/${dbId}`);
                } else {
                    await send(`[false] Gagal menghasilkan gambar.`);
                }
            } catch (err) {
                if (keepAliveInterval) clearInterval(keepAliveInterval);
                await send(`[false] ${err.message}`);
            } finally {
                try {
                    await writer.close();
                } catch (e) {
                    // Ignore close errors
                }
            }
        })();

        return new Response(customStream.readable, {
            headers: {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
            },
        });

    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}