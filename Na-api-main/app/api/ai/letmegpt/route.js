import { NextResponse } from 'next/server';
import letmegptController from '../../../../lib/controllers/ai/letmegpt';

export async function POST(req) {
    try {
        const body = await req.json();
        const mockReq = { body };
        
        const result = await letmegptController(mockReq);
        return NextResponse.json(result);
    } catch (error) {
        return NextResponse.json({ 
            success: false, 
            message: error.message 
        }, { status: 500 });
    }
}