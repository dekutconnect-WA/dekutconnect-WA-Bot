import { NextResponse } from 'next/server';
import pingController from '../../../../lib/controllers/main/ping';

export async function GET(req) {
    try {
        const { searchParams } = new URL(req.url);
        const query = Object.fromEntries(searchParams);
        
        // Mock request object for controller
        const mockReq = { query };
        
        const result = await pingController(mockReq);
        return NextResponse.json(result);
    } catch (error) {
        return NextResponse.json({ 
            status: 'error', 
            message: error.message 
        }, { status: 500 });
    }
}