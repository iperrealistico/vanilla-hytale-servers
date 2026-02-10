import { redirect } from 'next/navigation';
import { verifyAuth } from '@/lib/auth';
import { getSiteContent, getUploadsManifest } from '@/lib/content';
import AdminDashboard from '@/app/secret-admin-gate/AdminDashboard';

export default async function AdminPage() {
    const isAuth = await verifyAuth();
    if (!isAuth) {
        redirect('/secret-admin-gate/login');
    }

    const content = await getSiteContent();
    const manifest = await getUploadsManifest();

    return <AdminDashboard initialContent={content} initialManifest={manifest} />;
}
