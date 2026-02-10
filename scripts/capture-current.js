const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

async function capture() {
    const browser = await chromium.launch();
    const page = await browser.newPage();
    await page.setViewportSize({ width: 1280, height: 800 });

    const outputDir = path.join(__dirname, '..', 'tests', 'visual', 'current');
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    const port = 3001; // As per dev server
    await page.goto(`http://localhost:${port}/`);
    await page.waitForTimeout(2000); // Wait for GSAP animations
    await page.screenshot({ path: path.join(outputDir, 'home-it-dark.png'), fullPage: true });

    // Light mode
    await page.evaluate(() => {
        localStorage.setItem('theme', 'light');
        document.documentElement.setAttribute('data-theme', 'light');
    });
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(outputDir, 'home-it-light.png'), fullPage: true });

    // English version
    await page.goto(`http://localhost:${port}/en`);
    await page.evaluate(() => {
        localStorage.setItem('theme', 'dark');
        document.documentElement.setAttribute('data-theme', 'dark');
    });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(outputDir, 'home-en-dark.png'), fullPage: true });

    await browser.close();
    console.log('Screenshots captured in tests/visual/current');
}

capture().catch(console.error);
