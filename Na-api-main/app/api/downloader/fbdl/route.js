import { NextResponse } from 'next/server';
import fbdlController from '../../../../lib/controllers/downloader/fbdl';

export async function POST(req) {
    try {
        const body = await req.json();
        
        const mockReq = { body };
        
        const result = await fbdlController(mockReq);
        return NextResponse.json(result);
    } catch (error) {
        return NextResponse.json({ 
            success: false, 
            message: error.message 
        }, { status: 500 });
    }
}