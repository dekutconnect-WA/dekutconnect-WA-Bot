import { NextResponse } from 'next/server';
import youtubeSearchController from '../../../../lib/controllers/search/youtube';

export const dynamic = 'force-dynamic';

export async function GET(req) {
    try {
        const { searchParams } = new URL(req.url);
        const query = Object.fromEntries(searchParams);
        
        // Mock request object for controller
        const mockReq = { query };
        
        const result = await youtubeSearchController(mockReq);
        return NextResponse.json(result);
    } catch (error) {
        return NextResponse.json({ 
            success: false, 
            message: error.message 
        }, { status: 500 });
    }
}