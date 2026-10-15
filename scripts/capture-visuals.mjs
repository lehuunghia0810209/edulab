import { chromium } from '@playwright/test';
import { mkdir } from 'node:fs/promises';

const destination = process.argv[2] || 'artifacts/after-5';
const baseURL = process.env.QA_URL || 'http://127.0.0.1:5187';
const sections = { hero: '#top', discovery: '#kham-pha-lab', nexus: '#nexus', explorer: '#bo-kham-pha', about: '#ve-edulab', timeline: '#cach-hoat-dong', ecosystem: '#he-sinh-thai', faq: '#faq', cta: '.final-cta-box', footer: '.site-footer' };
await mkdir(destination, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome' });
try {
  for (const [width, height] of [[1440, 900], [1920, 1080], [768, 1024], [390, 844], [320, 700]]) {
    if (process.env.QA_WIDTHS && !process.env.QA_WIDTHS.split(',').includes(String(width))) continue;
    const page = await browser.newPage({ viewport: { width, height }, reducedMotion: 'no-preference' });
    await page.goto(baseURL);
    await page.evaluate(() => document.fonts.ready);
    for (const [name, selector] of Object.entries(sections)) {
      const section = page.locator(selector);
      await section.scrollIntoViewIfNeeded();
      await page.waitForTimeout(name === 'hero' ? 2200 : 1000);
      await section.screenshot({ path: `${destination}/${width}-${name}.png`, style: name === 'hero' ? '' : '.site-header, .back-to-top, .skip-link, .scroll-progress { visibility: hidden !important; }' });
    }
    if (width === 1440 || width === 390) {
      await page.locator('#theme-toggle').click();
      for (const [name, selector] of Object.entries(sections)) {
        const section = page.locator(selector);
        await section.scrollIntoViewIfNeeded();
        await page.waitForTimeout(180);
        await section.screenshot({ path: `${destination}/${width}-${name}-light.png`, style: name === 'hero' ? '' : '.site-header, .back-to-top, .skip-link, .scroll-progress { visibility: hidden !important; }' });
      }
    }
    await page.close();
    console.log(`Captured ${width}px`);
  }
} finally {
  await browser.close();
}
