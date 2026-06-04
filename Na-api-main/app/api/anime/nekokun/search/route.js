import { NextResponse } from 'next/server';
import nekokunSearchController from '../../../../../lib/controllers/anime/nekokunSearch';

export const dynamic = 'force-dynamic';

export async function GET(req) {
    try {
        const origin = new URL(req.url).origin;
        const { searchParams } = new URL(req.url);
        const q = searchParams.get('q');
        const page = searchParams.get('page') || 1;
        
        const mockReq = { origin, query: { q, page } };
        
        const result = await nekokunSearchController(mockReq);
        return NextResponse.json(result);
    } catch (error) {
        return NextResponse.json({ 
            success: false, 
            message: error.message 
        }, { status: 500 });
    }
}
