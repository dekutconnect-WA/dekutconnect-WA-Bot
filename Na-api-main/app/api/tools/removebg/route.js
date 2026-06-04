import { NextResponse } from 'next/server';
import removeBgController from '../../../../lib/controllers/tools/removebg';

export async function POST(req) {
    try {
        const body = await req.json();
        const origin = new URL(req.url).origin;
        
        // Mock request object for controller
        const mockReq = { body, origin };
        
        const result = await removeBgController(mockReq);
        return NextResponse.json(result);
    } catch (error) {
        return NextResponse.json({ 
            status: 'error', 
            message: error.message 
        }, { status: 500 });
    }
}