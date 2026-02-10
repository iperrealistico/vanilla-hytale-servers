import { Metadata } from 'next';
import HomePage from '../../components/HomePage';
import { getSiteContent } from '../../lib/content';

export async function generateMetadata(): Promise<Metadata> {
    const content = await getSiteContent('en');
    return {
        title: content.meta.title,
        description: content.meta.description,
        alternates: {
            canonical: 'https://www.vanillahytaleservers.com/en',
            languages: {
                'it': 'https://www.vanillahytaleservers.com/',
                'en': 'https://www.vanillahytaleservers.com/en',
                'x-default': 'https://www.vanillahytaleservers.com/',
            }
        },
        openGraph: {
            title: content.meta.ogTitle,
            description: content.meta.ogDescription,
            images: [{ url: content.meta.ogImage }],
            url: 'https://www.vanillahytaleservers.com/en',
            type: 'website',
        },
        twitter: {
            card: 'summary_large_image',
            title: content.meta.twitterTitle,
            description: content.meta.twitterDescription,
            images: [content.meta.twitterImage],
        }
    };
}

export default async function HomeEn() {
    const content = await getSiteContent('en');
    return <HomePage content={content} lang="en" />;
}
