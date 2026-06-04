import { NextResponse } from 'next/server';
import oploverzSearchController from '../../../../../lib/controllers/anime/oploverzSearch';

export const dynamic = 'force-dynamic';

export async function GET(req) {
    try {
        const { searchParams } = new URL(req.url);
        const query = Object.fromEntries(searchParams);
        const origin = new URL(req.url).origin;
        
        const mockReq = { query, origin };
        
        const result = await oploverzSearchController(mockReq);
        return NextResponse.json(result);
    } catch (error) {
        return NextResponse.json({ 
            success: false, 
            message: error.message 
        }, { status: 500 });
    }
}