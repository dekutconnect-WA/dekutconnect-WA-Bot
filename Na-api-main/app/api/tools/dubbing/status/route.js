import { NextResponse } from 'next/server';
import dubbing from '../../../../../lib/dubbing';

export const dynamic = 'force-dynamic';

export async function GET(req) {
    try {
        const { searchParams } = new URL(req.url);
        const taskId = searchParams.get('taskId');

        if (!taskId) {
            return NextResponse.json({ error: "Parameter 'taskId' wajib diisi." }, { status: 400 });
        }

        const status = await dubbing.checkStatus(taskId);

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