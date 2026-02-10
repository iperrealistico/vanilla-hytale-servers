import { NextResponse } from 'next/server';
import { createToken } from '@/lib/auth';

export async function POST(req: Request) {
    // Basic CSRF protection
    const origin = req.headers.get('origin');
    const host = req.headers.get('host');
    if (origin && !origin.includes(host || '')) {
        return NextResponse.json({ success: false, message: 'Invalid origin' }, { status: 403 });
    }

    const { password } = await req.json();
    try {
        const token = await createToken(password);
        const response = NextResponse.json({ success: true });
        response.cookies.set('admin_token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            path: '/',
            maxAge: 60 * 60 * 24 * 7 // 1 week
        });
        return response;
    } catch (e) {
        return NextResponse.json({ success: false, message: 'Invalid password' }, { status: 401 });
    }
}
