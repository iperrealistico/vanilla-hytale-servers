const fs = require('fs');
const path = require('path');

function extractCSS() {
    const html = fs.readFileSync(path.join(__dirname, '..', 'legacy', 'index.html'), 'utf8');
    const styleMatch = html.match(/<style>([\s\S]*?)<\/style>/);
    if (styleMatch) {
        let css = styleMatch[1];
        // Fix relative paths if any
        css = css.replace(/url\(['"]?\/img\//g, "url('/img/");
        fs.writeFileSync(path.join(__dirname, '..', 'app', 'globals.css'), css);
        console.log('CSS extracted to app/globals.css');
    } else {
        console.error('No <style> tag found in index.html');
    }
}

extractCSS();
