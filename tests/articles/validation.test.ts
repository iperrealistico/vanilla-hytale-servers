import test from 'node:test';
import assert from 'node:assert/strict';

import { validateAllArticles } from '@/lib/articles/validation';

test('live article set passes the article-system validator', () => {
  const { issues, summary } = validateAllArticles();

  assert.equal(issues.length, 0);
  assert.equal(summary.articleTemplateVersion, 'v3');
  assert.equal(summary.surface, 'blog');
  assert.ok(Number.isInteger(summary.articleCount));
  assert.ok(summary.articleCount >= 0);
});
