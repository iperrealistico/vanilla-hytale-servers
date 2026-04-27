import fs from 'fs';
import path from 'path';

import type { ContentOpsPaths } from '@/lib/content-ops/paths';
import type { QueueRecord, SourceRef } from '@/lib/content-ops/discovery/schema';
import { normalizeWhitespace, unique } from '@/lib/content-ops/discovery/text';

export type ArticleImageSlot = 'cover' | 'wash' | 'orbit';

export const HYTALE_BLUEPRINT_PALETTE = {
  base: '#4560a9',
  highlight: '#70afdb',
} as const;

const SLOT_CONFIG: Record<
  ArticleImageSlot,
  {
    sidecarSuffix: string;
    slotId: string;
    slotKeySuffix: string;
    outputDimensions: string;
    aspectRatio: string;
    assetKeySuffix: string;
    promptFocus: string;
  }
> = {
  cover: {
    sidecarSuffix: 'cover',
    slotId: 'cover',
    slotKeySuffix: 'cover',
    outputDimensions: '1600x900',
    aspectRatio: 'strict horizontal 16:9',
    assetKeySuffix: 'cover',
    promptFocus:
      'Keep one clear hero composition with strong silhouettes, editorial readability, and enough breathing room for a blog header crop.',
  },
  wash: {
    sidecarSuffix: 'wash',
    slotId: 'ornament-wash',
    slotKeySuffix: 'ornament.wash',
    outputDimensions: '1600x900',
    aspectRatio: 'broad ambient rectangle',
    assetKeySuffix: 'ornament-wash',
    promptFocus:
      'Turn the reference into a quieter atmospheric blueprint field with layered depth, lower contrast, and generous negative space.',
  },
  orbit: {
    sidecarSuffix: 'orbit',
    slotId: 'ornament-orbit',
    slotKeySuffix: 'ornament.orbit',
    outputDimensions: '640x640',
    aspectRatio: 'compact square orbit ornament',
    assetKeySuffix: 'ornament-orbit',
    promptFocus:
      'Isolate one iconic object, block cluster, tool, or symbol from the reference and redraw it as a compact emblem-like blueprint ornament.',
  },
};

function collectGuidelineSources(record: QueueRecord) {
  return record.sourceRefs.filter((source) => source.guidelineImagePath || source.imageUrl);
}

function collectSourceTitles(record: QueueRecord) {
  return unique(
    record.sourceRefs
      .map((source) => normalizeWhitespace(source.title))
      .filter(Boolean),
  );
}

function buildSourceTheme(record: QueueRecord) {
  const titles = collectSourceTitles(record);
  if (titles.length === 0) {
    return record.title;
  }

  return titles.slice(0, 3).join('; ');
}

function renderReferenceLines(referenceSources: SourceRef[]) {
  if (referenceSources.length === 0) {
    return ['- none available; use the article title and angle summary as the concept brief'];
  }

  return referenceSources.map((source, index) => {
    const parts = [
      `${index + 1}. ${source.title}`,
      source.guidelineImagePath ? `path: ${source.guidelineImagePath}` : null,
      source.imageUrl ? `url: ${source.imageUrl}` : null,
    ].filter(Boolean);
    return `- ${parts.join(' | ')}`;
  });
}

export function buildBlueprintImagePrompt(record: QueueRecord, slot: ArticleImageSlot) {
  const slotConfig = SLOT_CONFIG[slot];
  const referenceSources = collectGuidelineSources(record);
  const referenceDirective =
    referenceSources.length > 0
      ? 'Use the attached scraped source image(s) only for silhouette, camera framing, object relationships, and major landmark shapes. Redraw every visible element from scratch in blueprint form.'
      : 'No scraped source image is attached for this article. Create an original blueprint scene from the article title, angle summary, and source topic list.';
  const sourceTheme = buildSourceTheme(record);

  const lines = [
    `Create an original Hytale blueprint illustration for the article "${record.title}".`,
    referenceDirective,
    `Source topic focus: ${sourceTheme}.`,
    record.angleSummary ? `Editorial angle: ${record.angleSummary}` : null,
    `Slot intent: ${slotConfig.promptFocus}`,
    `Visual language: premium technical blueprint drawing, crisp linework, construction marks, contour diagrams, subtle grid, callout circles, measured geometry, restrained glow, and polished editorial finish.`,
    `Palette rule: use only Hytale blueprint blues in the range ${HYTALE_BLUEPRINT_PALETTE.base} through ${HYTALE_BLUEPRINT_PALETTE.highlight}. Keep the darker field anchored near ${HYTALE_BLUEPRINT_PALETTE.base} and the brightest lines and glow near ${HYTALE_BLUEPRINT_PALETTE.highlight}.`,
    `Do not keep original logos, UI text, watermarks, screenshots, photo textures, realistic materials, or any non-blue accent colors.`,
    `Everything in frame must feel blueprint-redrawn rather than painted over.`,
    slot === 'cover'
      ? 'Compose a readable 16:9 hero scene with one dominant focal subject, strong depth, and clean negative space around the silhouette.'
      : null,
    slot === 'wash'
      ? 'Favor atmosphere over detail density. This asset should support text and decorative layering without becoming noisy.'
      : null,
    slot === 'orbit'
      ? 'Keep the composition centered and symbolic, suitable for a compact ornament graphic with one immediately readable silhouette.'
      : null,
    `Output size target: ${slotConfig.outputDimensions}.`,
  ].filter(Boolean);

  return `${lines.join('\n')}\n`;
}

export function renderImageWorkSidecar(options: {
  paths: ContentOpsPaths;
  record: QueueRecord;
  slug: string;
  slot: ArticleImageSlot;
}) {
  const { paths, record, slug, slot } = options;
  const slotConfig = SLOT_CONFIG[slot];
  const referenceSources = collectGuidelineSources(record);
  const queueIndex = String(record.queueIndex).padStart(4, '0');
  const outputFilePath = path.join(
    paths.contentOpsRoot,
    'staging',
    'generated-assets',
    `${slug}-${slotConfig.sidecarSuffix}.png`,
  );
  const prompt = buildBlueprintImagePrompt(record, slot);

  return `# Image Work Sidecar
<!-- generated: blueprint-sidecar-v1 -->

- Article title: ${record.title}
- Family: ${record.familyId}
- Slot ID: ${slotConfig.slotId}
- Slot key: \`blog.${slug}.${slotConfig.slotKeySuffix}\`
- Why generation was needed: staged draft ${queueIndex} needs a publishable blueprint-derived image package before live promotion
- Style reference used: scraped source image guidance transformed into the Hytale blueprint style
- Blueprint palette: \`${HYTALE_BLUEPRINT_PALETTE.base} -> ${HYTALE_BLUEPRINT_PALETTE.highlight}\`
- Raw source publishing rule: never publish scraped source images directly; only publish AI-generated blueprint derivatives
- Generation method used: AI image generation, image-to-image blueprint stylization when reference images exist, otherwise text-to-image blueprint concept fallback
- Output file path: ${outputFilePath}
- Output pixel dimensions: ${slotConfig.outputDimensions}
- Aspect-ratio confirmation: ${slotConfig.aspectRatio}
- Optimization status: pending blueprint generation, crop review, resize, compression, and metadata cleanup
- Selected future asset-library key: \`staged-${slug}-${slotConfig.assetKeySuffix}\`

## Scraped Source References
${renderReferenceLines(referenceSources).join('\n')}

## Blueprint Prompt
\`\`\`text
${prompt}\`\`\`
`;
}

export function syncImageWorkSidecarsForRecord(options: {
  paths: ContentOpsPaths;
  record: QueueRecord;
  slug?: string | null;
}) {
  const { paths, record } = options;
  const slug = options.slug ?? record.articleSlug;

  if (!slug) {
    throw new Error(`Cannot sync image sidecars for ${record.queueId} without an article slug.`);
  }

  const imageWorkDir = path.join(paths.contentOpsRoot, 'staging', 'image-work');
  fs.mkdirSync(imageWorkDir, { recursive: true });

  for (const slot of Object.keys(SLOT_CONFIG) as ArticleImageSlot[]) {
    const sidecarPath = path.join(imageWorkDir, `${slug}-${SLOT_CONFIG[slot].sidecarSuffix}.md`);
    fs.writeFileSync(
      sidecarPath,
      renderImageWorkSidecar({
        paths,
        record,
        slug,
        slot,
      }),
    );
  }
}
