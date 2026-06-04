import { NextResponse } from 'next/server';
import instagramController from '../../../../lib/controllers/downloader/instagram';

export const dynamic = 'force-dynamic';

export async function POST(req) {
    try {
        const body = await req.json();
        const mockReq = { body };
        
        const result = await instagramController(mockReq);
        return NextResponse.json(result);
    } catch (error) {
        return NextResponse.json({ 
            success: false, 
            message: error.message 
        }, { status: 500 });
    }
}