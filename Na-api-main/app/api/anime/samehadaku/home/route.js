import { NextResponse } from 'next/server';
import samehadakuHomeController from '../../../../../lib/controllers/anime/samehadakuHome';

export const dynamic = 'force-dynamic';

export async function GET(req) {
    try {
        const origin = new URL(req.url).origin;
        const mockReq = { origin };
        
        const result = await samehadakuHomeController(mockReq);
        return NextResponse.json(result);
    } catch (error) {
        return NextResponse.json({ 
            success: false, 
            message: error.message 
        }, { status: 500 });
    }
}