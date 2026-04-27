import { getContentOpsPaths } from '@/lib/content-ops/paths';
import { discoverTitles } from '@/lib/content-ops/discovery/engine';

function readArg(name: string) {
  const match = process.argv.find((arg) => arg.startsWith(`--${name}=`));
  return match ? match.slice(name.length + 3) : undefined;
}

const familyId = readArg('family');

async function main() {
  const result = await discoverTitles({
    familyId,
    paths: getContentOpsPaths(),
  });

  console.log(JSON.stringify({ ok: true, ...result }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
