import { NextResponse } from 'next/server';
import savetubeController from '../../../../lib/controllers/downloader/savetube';

export const maxDuration = 60;

export async function POST(req) {
    try {
        const body = await req.json();
        const mockReq = { body };
        
        const result = await savetubeController(mockReq);
        return NextResponse.json(result);
    } catch (error) {
        return NextResponse.json({ 
            success: false, 
            message: error.message 
        }, { status: 500 });
    }
}