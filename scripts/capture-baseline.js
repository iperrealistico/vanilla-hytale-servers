const { chromium } = require('playwright');
const http = require('http');
const fs = require('fs');
const path = require('path');

async function capture() {
    const server = http.createServer((req, res) => {
        let filePath = path.join(__dirname, '..', 'legacy', req.url === '/' ? 'index.html' : req.url);
        if (!fs.existsSync(filePath)) {
            res.writeHead(404);
            res.end();
            return;
        }
        const ext = path.extname(filePath);
        const contentTypes = {
            '.html': 'text/html',
            '.css': 'text/css',
            '.js': 'text/javascript',
            '.png': 'image/png',
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.svg': 'image/svg+xml',
            '.ico': 'image/x-icon'
        };
        res.writeHead(200, { 'Content-Type': contentTypes[ext] || 'application/octet-stream' });
        fs.createReadStream(filePath).pipe(res);
    });

    const port = 3333;
    server.listen(port, async () => {
        console.log(`Baseline server running at http://localhost:${port}`);

        const browser = await chromium.launch();
        const context = await browser.newContext({
            viewport: { width: 1280, height: 800 }
        });
        const page = await context.newPage();

        // Create directory
        const baselineDir = path.join(__dirname, '..', 'tests', 'visual', 'baseline');
        if (!fs.existsSync(baselineDir)) {
            fs.mkdirSync(baselineDir, { recursive: true });
        }

        // Capture Home (index.html)
        console.log('Capturing index.html...');
        await page.goto(`http://localhost:${port}/`);
        // Wait for animations/fonts
        await page.waitForTimeout(2000);
        await page.screenshot({ path: path.join(baselineDir, 'home-it.png'), fullPage: true });

        // Capture index.html in light mode if toggle exists
        console.log('Capturing index.html in light mode...');
        await page.evaluate(() => {
            document.documentElement.setAttribute('data-theme', 'light');
        });
        await page.waitForTimeout(500);
        await page.screenshot({ path: path.join(baselineDir, 'home-it-light.png'), fullPage: true });

        await browser.close();
        server.close();
        console.log('Baseline capture complete.');
        process.exit(0);
    });
}

capture().catch(err => {
    console.error(err);
    process.exit(1);
});

