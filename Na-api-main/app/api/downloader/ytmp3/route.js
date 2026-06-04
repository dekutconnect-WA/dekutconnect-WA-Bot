import { NextResponse } from 'next/server';
import ytmp3Controller from '../../../../lib/controllers/downloader/ytmp3';

// Proses konversi dan polling status bisa memakan waktu hingga 60 detik
export const maxDuration = 60; 

export async function POST(req) {
    try {
        const body = await req.json();
        const mockReq = { body };
        
        const result = await ytmp3Controller(mockReq);
        return NextResponse.json(result);
    } catch (error) {
        return NextResponse.json({ 
            success: false, 
            message: error.message 
        }, { status: 500 });
    }
}