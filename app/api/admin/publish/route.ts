import { NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import { commitFiles } from '@/lib/github';

export async function POST(req: Request) {
    if (!(await verifyAuth())) {
        return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { content, manifest, schedules } = await req.json();

    const files = [
        { path: 'content/site.json', content: JSON.stringify(content, null, 2) },
        { path: 'content/uploads.manifest.json', content: JSON.stringify(manifest, null, 2) }
    ];

    if (schedules) {
        files.push({
            path: 'data/schedules.json',
            content: JSON.stringify(schedules, null, 2)
        });
    }

    const result = await commitFiles(files);
    return NextResponse.json(result);
}
