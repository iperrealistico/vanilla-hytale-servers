import test from 'node:test';
import assert from 'node:assert/strict';

import { analyzeArticleSource } from '@/lib/articles/analyzer';

const sampleSource = `
<ArticleQuickAnswer title="Short answer">
  <p>Quick orientation.</p>
</ArticleQuickAnswer>

## First section

This section explains the first idea and includes a [homepage shortlist](/#servers).

### First subheading

More detail.

## Second section

This section points readers to the [homepage scoring section](/#methodology).

<ArticlePrimarySegue />

## Third section

More detail.

<ArticlePlanningNote title="Practical note">
  <p>Plan before you join.</p>
</ArticlePlanningNote>

## Fourth section

Closing thoughts.
`;

test('analyzeArticleSource extracts sections, blocks, and strategic links', () => {
  const analysis = analyzeArticleSource(sampleSource);

  assert.equal(analysis.sections.length, 4);
  assert.equal(analysis.primarySegueCount, 1);
  assert.equal(analysis.approvedBlockCountExcludingSegue, 2);
  assert.deepEqual(analysis.strategicLinks.sort(), ['/#methodology', '/#servers']);
  assert.equal(analysis.sections[0]?.id, 'first-section');
  assert.equal(analysis.sections[0]?.subheadings[0]?.id, 'first-subheading');
});
