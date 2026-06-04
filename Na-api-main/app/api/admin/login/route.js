import { NextResponse } from 'next/server';

export async function POST(req) {
    const body = await req.json();
    if (body.password === process.env.PURUBOY_ADMIN_KEY) {
        return NextResponse.json({ success: true, message: 'Login successful' });
    } else {
        return NextResponse.json({ success: false, message: 'Invalid password' }, { status: 401 });
    }
}