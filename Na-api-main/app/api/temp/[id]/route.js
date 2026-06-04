import { NextResponse } from 'next/server';
import tempService from '../../../../lib/tempService';

export const dynamic = 'force-dynamic';

export async function GET(req, { params }) {
    try {
        const data = await tempService.get(params.id);
        
        if (!data) {
            return NextResponse.json({ 
                error: 'Data tidak ditemukan atau sudah kadaluarsa (Expired).' 
            }, { status: 404 });
        }

        return NextResponse.json(data);
    } catch (error) {
        return NextResponse.json({ 
            error: 'Terjadi kesalahan internal saat mengambil data.' 
        }, { status: 500 });
    }
}