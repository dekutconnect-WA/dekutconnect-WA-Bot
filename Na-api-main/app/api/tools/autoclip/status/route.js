import { NextResponse } from 'next/server';
import autoclip from '../../../../../lib/autoclip';

export const dynamic = 'force-dynamic';

export async function GET(req) {
    try {
        const { searchParams } = new URL(req.url);
        const jobId = searchParams.get('jobId');

        if (!jobId) {
            return NextResponse.json({ error: "Parameter 'jobId' wajib diisi." }, { status: 400 });
        }

        const status = await autoclip.checkStatus(jobId);

        return NextResponse.json({
            success: true,
            author: 'PuruBoy',
            result: status
        });
    } catch (error) {
        return NextResponse.json({ 
            success: false, 
            message: error.message 
        }, { status: 500 });
    }
}