import test from 'node:test';
import assert from 'node:assert/strict';

import { resolveImageSlot } from '@/lib/images/imageManifest';

test('image slots resolve to registered assets', () => {
  const cover = resolveImageSlot('blog.how-to-choose-a-vanilla-hytale-server-if-you-care-about-fair-monetization.cover');
  const wash = resolveImageSlot('blog.vanilla-vs-semi-vanilla-in-hytale-what-actually-changes-the-survival-experience.ornament.wash');

  assert.equal(cover.id, 'blog-fair-monetization-cover');
  assert.equal(wash.id, 'blog-vanilla-vs-semi-vanilla-wash');
});
