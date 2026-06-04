import { NextResponse } from 'next/server';
import removeBgV2Controller from '../../../../lib/controllers/tools/removebgV2';

export const maxDuration = 60; // Proses mungkin memakan waktu

export async function POST(req) {
    try {
        const body = await req.json();
        const origin = new URL(req.url).origin;
        
        // Mock request object for controller
        const mockReq = { body, origin };
        
        const result = await removeBgV2Controller(mockReq);
        return NextResponse.json(result);
    } catch (error) {
        return NextResponse.json({ 
            status: 'error', 
            message: error.message 
        }, { status: 500 });
    }
}