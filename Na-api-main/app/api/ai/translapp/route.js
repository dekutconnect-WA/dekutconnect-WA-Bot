import { NextResponse } from 'next/server';
import translappController from '../../../../lib/controllers/ai/translapp';

export async function POST(req) {
    try {
        const body = await req.json();
        
        const mockReq = { body };
        
        const result = await translappController(mockReq);
        return NextResponse.json(result);
    } catch (error) {
        return NextResponse.json({ 
            success: false, 
            message: error.message 
        }, { status: 500 });
    }
}