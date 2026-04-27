import { validateAllArticles } from '@/lib/articles/validation';

const { issues, summary } = validateAllArticles();

if (issues.length > 0) {
  console.error(JSON.stringify({ ok: false, issues, summary }, null, 2));
  process.exit(1);
}

console.log(JSON.stringify({ ok: true, ...summary }, null, 2));
