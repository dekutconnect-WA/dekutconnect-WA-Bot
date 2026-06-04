import { NextResponse } from 'next/server';
import oploverzScheduleController from '../../../../../lib/controllers/anime/oploverzSchedule';

export const dynamic = 'force-dynamic';

export async function GET(req) {
    try {
        const result = await oploverzScheduleController({});
        return NextResponse.json(result);
    } catch (error) {
        return NextResponse.json({ 
            success: false, 
            message: error.message 
        }, { status: 500 });
    }
}