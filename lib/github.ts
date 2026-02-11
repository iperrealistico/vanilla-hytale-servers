import { Octokit } from 'octokit';

const OWNER = process.env.VERCEL_GIT_REPO_OWNER || 'iperrealistico';
const REPO = process.env.VERCEL_GIT_REPO_SLUG || 'vanilla-hytale-servers';
const BRANCH = process.env.VERCEL_GIT_COMMIT_REF || 'main';

// Instantiate Octokit inside commitFiles or using a getter to ensure it picks up GITHUB_TOKEN if it changes (less likely but safer)
function getOctokit() {
    return new Octokit({ auth: process.env.GITHUB_TOKEN });
}

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
        const { data: refData } = await getOctokit().rest.git.getRef({
            owner: OWNER,
            repo: REPO,
            ref: `heads/${BRANCH}`,
        });
        const baseSha = refData.object.sha;

        // Create blobs
        const blobs = await Promise.all(files.map(async (file) => {
            const { data } = await getOctokit().rest.git.createBlob({
                owner: OWNER,
                repo: REPO,
                content: typeof file.content === 'string' ? file.content : file.content.toString('base64'),
                encoding: typeof file.content === 'string' ? 'utf-8' : 'base64',
            });
            return { path: file.path, sha: data.sha };
        }));

        // Get the current tree
        const { data: currentTree } = await getOctokit().rest.git.getTree({
            owner: OWNER,
            repo: REPO,
            tree_sha: baseSha,
        });

        // Create new tree
        const { data: newTree } = await getOctokit().rest.git.createTree({
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
        const { data: newCommit } = await getOctokit().rest.git.createCommit({
            owner: OWNER,
            repo: REPO,
            message: 'CMS update [skip ci]',
            tree: newTree.sha,
            parents: [baseSha],
        });

        // Update ref
        await getOctokit().rest.git.updateRef({
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
export async function deleteFile(filePath: string) {
    if (process.env.NODE_ENV !== 'production' && !process.env.GITHUB_TOKEN) {
        console.log('Local dev: deleting file from disk');
        const fs = require('fs');
        const path = require('path');
        const fullPath = path.join(process.cwd(), filePath);
        if (fs.existsSync(fullPath)) {
            fs.unlinkSync(fullPath);
        }
        return { success: true };
    }

    try {
        // We need the current file SHA to delete it
        const { data: fileData } = await getOctokit().rest.repos.getContent({
            owner: OWNER,
            repo: REPO,
            path: filePath,
            ref: BRANCH,
        });

        if (Array.isArray(fileData)) throw new Error('Path is a directory, not a file');

        const result = await getOctokit().rest.repos.deleteFile({
            owner: OWNER,
            repo: REPO,
            path: filePath,
            message: `Delete ${filePath} [skip ci]`,
            sha: fileData.sha,
            branch: BRANCH,
        });

        return { success: true, sha: result.data.commit.sha };
    } catch (e: any) {
        console.error('GitHub Delete Error:', e);
        return { success: false, message: e.message };
    }
}

export async function triggerWorkflow(topic: string, typology: string) {
    if (process.env.NODE_ENV !== 'production' && !process.env.GITHUB_TOKEN) {
        console.log('Local dev: skipping workflow trigger');
        return { success: true, message: 'Simulated trigger' };
    }

    try {
        await getOctokit().rest.actions.createWorkflowDispatch({
            owner: OWNER,
            repo: REPO,
            workflow_id: 'deep-research.yml',
            ref: BRANCH,
            inputs: {
                topic,
                typology
            },
        });
        return { success: true };
    } catch (e: any) {
        console.error('GitHub Workflow Trigger Error:', e);
        return { success: false, message: e.message };
    }
}
