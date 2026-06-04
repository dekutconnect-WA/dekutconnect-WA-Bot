import { NextResponse } from 'next/server';
import blogService from '../../../lib/blogService';

export async function GET(req) {
    try {
        const { searchParams } = new URL(req.url);
        const page = searchParams.get('page') || 1;
        const limit = searchParams.get('limit') || 5;
        const data = await blogService.getAll(page, limit);
        return NextResponse.json(data);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch posts', details: error.message }, { status: 500 });
    }
}

export async function POST(req) {
    const password = req.headers.get('authorization');

    if (!password || password !== process.env.PURUBOY_ADMIN_KEY) {
        return NextResponse.json({ error: 'Unauthorized: Invalid admin password' }, { status: 401 });
    }

    try {
        const body = await req.json();
        const newPost = await blogService.create(body);
        return NextResponse.json(newPost, { status: 201 });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to create post', details: error.message }, { status: 400 });
    }
}