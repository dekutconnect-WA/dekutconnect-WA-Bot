import { NextResponse } from 'next/server';
import soundcloudController from '../../../../lib/controllers/downloader/soundcloud';

export async function POST(req) {
    try {
        const body = await req.json();
        
        // Mock request object for controller
        const mockReq = { body };
        
        const result = await soundcloudController(mockReq);
        return NextResponse.json(result);
    } catch (error) {
        return NextResponse.json({ 
            success: false, 
            message: error.message 
        }, { status: 500 });
    }
}