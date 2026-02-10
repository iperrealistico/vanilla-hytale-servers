import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

const SECRET = process.env.JWT_SECRET || 'fallback-secret-for-dev-only';

export async function createToken(password: string) {
    if (password !== process.env.ADMIN_PASSWORD) {
        throw new Error('Invalid password');
    }
    return jwt.sign({ admin: true }, SECRET, { expiresIn: '7d' });
}

export async function verifyAuth() {
    const cookieStore = await cookies();
    const token = cookieStore.get('admin_token')?.value;

    if (!token) return false;

    try {
        jwt.verify(token, SECRET);
        return true;
    } catch (e) {
        return false;
    }
}
