import { NextResponse } from 'next/server';
import yahooController from '../../../../lib/controllers/search/yahoo';

export const dynamic = 'force-dynamic';

export async function GET(req) {
    try {
        const { searchParams } = new URL(req.url);
        const query = Object.fromEntries(searchParams);
        
        const mockReq = { query };
        
        const result = await yahooController(mockReq);
        return NextResponse.json(result);
    } catch (error) {
        return NextResponse.json({ 
            success: false, 
            message: error.message 
        }, { status: 500 });
    }
}