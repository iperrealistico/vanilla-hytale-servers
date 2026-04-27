import fs from 'fs';
import path from 'path';

import { ImageSlotMapSchema, type ImageAsset } from '@/lib/articles/schema';
import { imageLibrary } from '@/lib/images/imageLibrary';

const slotMapPath = path.join(process.cwd(), 'content', 'site', 'image-slots.json');

export interface ArticleImageManifest {
  cover: ImageAsset;
  wash: ImageAsset;
  orbit: ImageAsset;
}

export function getImageSlotMap() {
  const raw = fs.readFileSync(slotMapPath, 'utf8');
  return ImageSlotMapSchema.parse(JSON.parse(raw));
}

export function resolveImageSlot(slotKey: string): ImageAsset {
  const slotMap = getImageSlotMap();
  const assignment = slotMap[slotKey];

  if (!assignment) {
    throw new Error(`Missing image slot assignment for "${slotKey}".`);
  }

  const asset = imageLibrary[assignment.asset as keyof typeof imageLibrary];
  if (!asset) {
    throw new Error(`Image slot "${slotKey}" points to unknown asset "${assignment.asset}".`);
  }

  return asset;
}

export function resolveArticleImageManifest(frontmatter: {
  coverImage: string;
  ornamentWashImage: string;
  ornamentOrbitImage: string;
}): ArticleImageManifest {
  return {
    cover: resolveImageSlot(frontmatter.coverImage),
    wash: resolveImageSlot(frontmatter.ornamentWashImage),
    orbit: resolveImageSlot(frontmatter.ornamentOrbitImage),
  };
}

export function validateImageLibraryIntegrity(): string[] {
  const slotMap = getImageSlotMap();
  const errors: string[] = [];

  for (const [slotKey, assignment] of Object.entries(slotMap)) {
    const asset = imageLibrary[assignment.asset as keyof typeof imageLibrary];
    if (!asset) {
      errors.push(`Slot "${slotKey}" points to unknown asset "${assignment.asset}".`);
      continue;
    }

    const publicPath = path.join(process.cwd(), 'public', asset.src.replace(/^\//, ''));
    if (!fs.existsSync(publicPath)) {
      errors.push(`Asset "${asset.id}" is missing public file ${asset.src}.`);
    }
  }

  return errors;
}
