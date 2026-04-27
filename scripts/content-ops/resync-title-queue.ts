import { discoverTitles } from '@/lib/content-ops/discovery/engine';

async function main() {
  const result = await discoverTitles();

  console.log(
    JSON.stringify(
      {
        ok: true,
        mode: 'discovery-materialization',
        ...result,
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
