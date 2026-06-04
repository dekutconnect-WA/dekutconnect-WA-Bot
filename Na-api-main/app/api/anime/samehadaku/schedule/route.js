import { NextResponse } from 'next/server';
import samehadakuScheduleController from '../../../../../lib/controllers/anime/samehadakuSchedule';

export const dynamic = 'force-dynamic';

export async function GET(req) {
    try {
        const origin = new URL(req.url).origin;
        const mockReq = { origin };

        const result = await samehadakuScheduleController(mockReq);
        return NextResponse.json(result);
    } catch (error) {
        return NextResponse.json({ 
            success: false, 
            message: error.message 
        }, { status: 500 });
    }
}