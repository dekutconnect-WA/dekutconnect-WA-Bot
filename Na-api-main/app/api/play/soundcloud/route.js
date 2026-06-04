import { NextResponse } from 'next/server';
import playSoundCloudController from '../../../../lib/controllers/play/soundcloud';

export const dynamic = 'force-dynamic';

export async function GET(req) {
    try {
        const { searchParams } = new URL(req.url);
        const query = Object.fromEntries(searchParams);
        
        // Mock request object for controller
        const mockReq = { query };
        
        const result = await playSoundCloudController(mockReq);
        
        return NextResponse.json({
            success: true,
            author: 'NextA',
            result: result
        });
    } catch (error) {
        return NextResponse.json({ 
            success: false, 
            message: error.message 
        }, { status: 500 });
    }
}