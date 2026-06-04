import { NextResponse } from 'next/server';
import nekokunDetailController from '../../../../../lib/controllers/anime/nekokunDetail';

export const dynamic = 'force-dynamic';

export async function GET(req) {
    try {
        const origin = new URL(req.url).origin;
        const { searchParams } = new URL(req.url);
        const url = searchParams.get('url');
        
        const mockReq = { origin, query: { url } };
        
        const result = await nekokunDetailController(mockReq);
        return NextResponse.json(result);
    } catch (error) {
        return NextResponse.json({ 
            success: false, 
            message: error.message 
        }, { status: 500 });
    }
}
