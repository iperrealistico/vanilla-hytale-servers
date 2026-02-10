import { NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import { commitFiles } from '@/lib/github';
import crypto from 'crypto';

export async function POST(req: Request) {
    if (!(await verifyAuth())) {
        return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
        return NextResponse.json({ success: false, message: 'No file provided' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const hash = crypto.createHash('md5').update(buffer).digest('hex');
    const ext = file.name.split('.').pop();
    const fileName = `${hash}.${ext}`;
    const filePath = `public/uploads/${fileName}`;

    // Note: In a real production environment on Vercel, 
    // we can't write to public/ locally at runtime.
    // We must commit to GitHub or use a storage like Vercel Blob.
    // But the request says: "GitHub storage default (commit assets to repo)"

    const result = await commitFiles([{ path: filePath, content: buffer }]);

    if (result.success) {
        const entry = {
            storage: 'github',
            path: '/' + filePath,
            size: file.size,
            hash: hash,
            refCount: 1
        };
        return NextResponse.json({ success: true, path: filePath, entry });
    } else {
        return NextResponse.json(result, { status: 500 });
    }
}
