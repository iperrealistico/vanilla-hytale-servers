import { ImageAsset, ImageAssetSchema } from '@/lib/articles/schema';

function createAsset(
  id: string,
  src: string,
  alt: string,
  width: number,
  height: number,
  tone: string,
): ImageAsset {
  return ImageAssetSchema.parse({ id, src, alt, width, height, tone });
}

export const imageLibrary = {
  'blog-fair-monetization-cover': createAsset(
    'blog-fair-monetization-cover',
    '/img/hytale/hytale_vanilla_servers_list_2.jpeg',
    'A polished Hytale landscape with structures and terrain that suggest long-term survival play.',
    1600,
    900,
    'aqua',
  ),
  'blog-fair-monetization-wash': createAsset(
    'blog-fair-monetization-wash',
    '/images/blog/ornaments/fair-monetization-wash.svg',
    'A decorative wash built from layered voxel-inspired lines and fairness markers.',
    1600,
    900,
    'cyan',
  ),
  'blog-fair-monetization-orbit': createAsset(
    'blog-fair-monetization-orbit',
    '/images/blog/ornaments/fair-monetization-orbit.svg',
    'A compact ornament with a clean voxel-inspired ring and signal marks.',
    640,
    640,
    'emerald',
  ),
  'blog-vanilla-vs-semi-vanilla-cover': createAsset(
    'blog-vanilla-vs-semi-vanilla-cover',
    '/img/hytale/hytale_vanilla_servers_list_3.jpeg',
    'A dramatic Hytale scene that suits a comparison between pure survival and convenience-heavy play.',
    1600,
    900,
    'teal',
  ),
  'blog-vanilla-vs-semi-vanilla-wash': createAsset(
    'blog-vanilla-vs-semi-vanilla-wash',
    '/images/blog/ornaments/vanilla-vs-semi-vanilla-wash.svg',
    'A broad decorative wash split into two balanced voxel-like masses.',
    1600,
    900,
    'aqua',
  ),
  'blog-vanilla-vs-semi-vanilla-orbit': createAsset(
    'blog-vanilla-vs-semi-vanilla-orbit',
    '/images/blog/ornaments/vanilla-vs-semi-vanilla-orbit.svg',
    'A compact comparison ornament with mirrored directional shapes.',
    640,
    640,
    'lime',
  ),
  'blog-vanilla-smp-checklist-cover': createAsset(
    'blog-vanilla-smp-checklist-cover',
    '/img/hytale/hytale_vanilla_servers_list_4.jpeg',
    'A detailed Hytale environment that evokes community scouting and server due diligence.',
    1600,
    900,
    'emerald',
  ),
  'blog-vanilla-smp-checklist-wash': createAsset(
    'blog-vanilla-smp-checklist-wash',
    '/images/blog/ornaments/vanilla-smp-checklist-wash.svg',
    'A soft planning-themed wash with map-like grids and voxel silhouettes.',
    1600,
    900,
    'mint',
  ),
  'blog-vanilla-smp-checklist-orbit': createAsset(
    'blog-vanilla-smp-checklist-orbit',
    '/images/blog/ornaments/vanilla-smp-checklist-orbit.svg',
    'A small orbit ornament built from checklist ticks and an isometric block glyph.',
    640,
    640,
    'cyan',
  ),
} as const;

export type ImageAssetId = keyof typeof imageLibrary;
