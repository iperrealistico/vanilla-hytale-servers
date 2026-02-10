import { Octokit } from 'octokit';

const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
const OWNER = 'iperrealistico';
const REPO = 'vanilla-hytale-servers';
const BRANCH = 'main';

export async function commitFiles(files: { path: string, content: string | Buffer }[]) {
    if (process.env.NODE_ENV !== 'production' && !process.env.GITHUB_TOKEN) {
        console.log('Local dev: saving files to disk instead of GitHub');
        const fs = require('fs');
        const path = require('path');
        for (const file of files) {
            fs.writeFileSync(path.join(process.cwd(), file.path), file.content);
        }
        return { success: true };
    }

    try {
        // Get ref for base sha
        const { data: refData } = await octokit.rest.git.getRef({
            owner: OWNER,
            repo: REPO,
            ref: `heads/${BRANCH}`,
        });
        const baseSha = refData.object.sha;

        // Create blobs
        const blobs = await Promise.all(files.map(async (file) => {
            const { data } = await octokit.rest.git.createBlob({
                owner: OWNER,
                repo: REPO,
                content: typeof file.content === 'string' ? file.content : file.content.toString('base64'),
                encoding: typeof file.content === 'string' ? 'utf-8' : 'base64',
            });
            return { path: file.path, sha: data.sha };
        }));

        // Get the current tree
        const { data: currentTree } = await octokit.rest.git.getTree({
            owner: OWNER,
            repo: REPO,
            tree_sha: baseSha,
        });

        // Create new tree
        const { data: newTree } = await octokit.rest.git.createTree({
            owner: OWNER,
            repo: REPO,
            base_tree: currentTree.sha,
            tree: blobs.map(b => ({
                path: b.path,
                mode: '100644',
                type: 'blob',
                sha: b.sha
            }))
        });

        // Create commit
        const { data: newCommit } = await octokit.rest.git.createCommit({
            owner: OWNER,
            repo: REPO,
            message: 'CMS update [skip ci]',
            tree: newTree.sha,
            parents: [baseSha],
        });

        // Update ref
        await octokit.rest.git.updateRef({
            owner: OWNER,
            repo: REPO,
            ref: `heads/${BRANCH}`,
            sha: newCommit.sha,
        });

        return { success: true, sha: newCommit.sha };
    } catch (e: any) {
        console.error('GitHub Commit Error:', e);
        return { success: false, message: e.message };
    }
}
