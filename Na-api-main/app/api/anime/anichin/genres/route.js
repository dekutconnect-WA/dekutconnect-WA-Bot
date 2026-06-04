import { NextResponse } from 'next/server';
import anichinGenreListController from '../../../../../lib/controllers/anime/anichinGenreList';

export const dynamic = 'force-dynamic';

export async function GET(req) {
    try {
        const result = await anichinGenreListController({});
        return NextResponse.json(result);
    } catch (error) {
        return NextResponse.json({ 
            success: false, 
            message: error.message 
        }, { status: 500 });
    }
}