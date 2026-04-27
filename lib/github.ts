import fs from 'fs';
import path from 'path';

import { Octokit } from 'octokit';

const OWNER = process.env.VERCEL_GIT_REPO_OWNER || 'iperrealistico';
const REPO = process.env.VERCEL_GIT_REPO_SLUG || 'vanilla-hytale-servers';
const BRANCH = process.env.VERCEL_GIT_COMMIT_REF || 'main';

function getOctokit() {
  return new Octokit({ auth: process.env.GITHUB_TOKEN });
}

export async function commitFiles(files: { path: string; content: string | Buffer }[]) {
  if (process.env.NODE_ENV !== 'production' && !process.env.GITHUB_TOKEN) {
    console.log('Local dev: saving files to disk instead of GitHub');
    for (const file of files) {
      fs.writeFileSync(path.join(process.cwd(), file.path), file.content);
    }
    return { success: true };
  }

  try {
    const octokit = getOctokit();
    const { data: refData } = await octokit.rest.git.getRef({
      owner: OWNER,
      repo: REPO,
      ref: `heads/${BRANCH}`,
    });
    const baseSha = refData.object.sha;

    const blobs = await Promise.all(
      files.map(async (file) => {
        const { data } = await octokit.rest.git.createBlob({
          owner: OWNER,
          repo: REPO,
          content: typeof file.content === 'string' ? file.content : file.content.toString('base64'),
          encoding: typeof file.content === 'string' ? 'utf-8' : 'base64',
        });
        return { path: file.path, sha: data.sha };
      }),
    );

    const { data: currentTree } = await octokit.rest.git.getTree({
      owner: OWNER,
      repo: REPO,
      tree_sha: baseSha,
    });

    const { data: newTree } = await octokit.rest.git.createTree({
      owner: OWNER,
      repo: REPO,
      base_tree: currentTree.sha,
      tree: blobs.map((blob) => ({
        path: blob.path,
        mode: '100644',
        type: 'blob',
        sha: blob.sha,
      })),
    });

    const { data: newCommit } = await octokit.rest.git.createCommit({
      owner: OWNER,
      repo: REPO,
      message: 'Admin content update [skip ci]',
      tree: newTree.sha,
      parents: [baseSha],
    });

    await octokit.rest.git.updateRef({
      owner: OWNER,
      repo: REPO,
      ref: `heads/${BRANCH}`,
      sha: newCommit.sha,
    });

    return { success: true, sha: newCommit.sha };
  } catch (error: unknown) {
    console.error('GitHub Commit Error:', error);
    return { success: false, message: error instanceof Error ? error.message : 'Unknown GitHub commit error' };
  }
}
