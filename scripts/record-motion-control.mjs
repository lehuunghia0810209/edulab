import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';

const destination = 'artifacts/motion-control-repair';
const url = process.env.QA_URL || 'http://127.0.0.1:5188';
await mkdir(destination, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome' });
const context = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  reducedMotion: 'no-preference',
  recordVideo: { dir: destination, size: { width: 1440, height: 900 } },
});
const page = await context.newPage();
const errors = [];
page.on('pageerror', error => errors.push(error.message));

const inspect = label => page.evaluate(label => {
  const ambient = [...document.querySelectorAll('.ambient')].flatMap(element => element.getAnimations());
  const videos = [...document.querySelectorAll('video')];
  return {
    label,
    rootState: document.documentElement.dataset.motion,
    preference: localStorage.getItem('edulab-motion'),
    buttonState: document.querySelector('#motion-toggle')?.dataset.state,
    ambientPlayStates: ambient.reduce((states, animation) => {
      states[animation.playState] = (states[animation.playState] || 0) + 1;
      return states;
    }, {}),
    playingVideos: videos.filter(video => !video.paused).length,
    nexusPoint: document.querySelector('.nexus-node[data-lab="chemlab"]')?.dataset.canvasPoint || null,
    canvasCount: document.querySelectorAll('.nexus-canvas').length,
  };
}, label);

const evidence = [];
try {
  await page.goto(url);
  await page.evaluate(() => localStorage.removeItem('edulab-motion'));
  await page.reload();
  await page.waitForTimeout(3000);
  evidence.push(await inspect('hero-running'));
  await page.locator('#motion-toggle').click();
  await page.waitForTimeout(1800);
  evidence.push(await inspect('hero-paused'));
  await page.locator('#motion-toggle').click();
  await page.waitForTimeout(1800);
  evidence.push(await inspect('hero-resumed'));
  await page.locator('#kham-pha-lab').scrollIntoViewIfNeeded();
  await page.waitForTimeout(2200);
  evidence.push(await inspect('discovery-running'));
  await page.screenshot({ path: `${destination}/discovery-running.png` });
  await page.locator('#motion-toggle').click();
  await page.waitForTimeout(2200);
  evidence.push(await inspect('discovery-paused'));
  await page.screenshot({ path: `${destination}/discovery-paused.png` });
  await page.locator('#motion-toggle').click();
  await page.waitForTimeout(2200);
  evidence.push(await inspect('discovery-resumed'));

  await page.locator('#nexus-viewport').scrollIntoViewIfNeeded();
  await page.locator('.nexus-canvas').waitFor();
  await page.waitForTimeout(2500);
  evidence.push(await inspect('nexus-running'));
  await page.screenshot({ path: `${destination}/nexus-running.png` });
  await page.locator('#motion-toggle').click();
  await page.waitForTimeout(2500);
  evidence.push(await inspect('nexus-paused'));
  await page.screenshot({ path: `${destination}/nexus-paused.png` });
  await page.locator('#motion-toggle').click();
  await page.waitForTimeout(2500);
  evidence.push(await inspect('nexus-resumed'));
  await page.screenshot({ path: `${destination}/nexus-resumed.png` });

  const video = page.video();
  await context.close();
  await video.saveAs(`${destination}/pause-resume-proof.webm`);
  await video.delete();
  await writeFile(`${destination}/runtime-evidence.json`, JSON.stringify({ errors, evidence }, null, 2));
} finally {
  await browser.close();
}
