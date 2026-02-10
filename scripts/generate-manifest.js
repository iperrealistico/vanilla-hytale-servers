const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

function getFiles(dir, allFiles = []) {
    const files = fs.readdirSync(dir);
    for (const f of files) {
        const name = path.join(dir, f);
        if (fs.statSync(name).isDirectory()) {
            getFiles(name, allFiles);
        } else {
            allFiles.push(name);
        }
    }
    return allFiles;
}

function generateManifest() {
    const imgDir = path.join(__dirname, '..', 'public', 'img');
    const files = getFiles(imgDir);
    const manifest = {};

    files.forEach(file => {
        const relPath = path.relative(path.join(__dirname, '..', 'public'), file);
        const stats = fs.statSync(file);
        const hash = crypto.createHash('md5').update(fs.readFileSync(file)).digest('hex');

        manifest[relPath] = {
            storage: 'github',
            path: '/' + relPath,
            size: stats.size,
            hash: hash,
            refCount: 1 // Default to 1 for initial migration
        };
    });

    fs.writeFileSync(path.join(__dirname, '..', 'content', 'uploads.manifest.json'), JSON.stringify(manifest, null, 2));
    console.log('Manifest created: content/uploads.manifest.json');
}

generateManifest();
