import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';

const url = process.env.QA_URL || 'http://127.0.0.1:4188';
const browser = await chromium.launch({ channel: 'chrome' });
const results = [];
try {
  for (const width of [1440, 390]) {
    const page = await browser.newPage({ viewport: { width, height: width === 1440 ? 900 : 844 }, reducedMotion: 'no-preference' });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.addInitScript(() => {
      window.qaPerformance = { lcpMs: null, cls: 0, interactions: [] };
      new PerformanceObserver(list => {
        for (const entry of list.getEntries()) window.qaPerformance.lcpMs = entry.startTime;
      }).observe({ type: 'largest-contentful-paint', buffered: true });
      new PerformanceObserver(list => {
        for (const entry of list.getEntries()) if (!entry.hadRecentInput) window.qaPerformance.cls += entry.value;
      }).observe({ type: 'layout-shift', buffered: true });
      new PerformanceObserver(list => {
        for (const entry of list.getEntries()) if (entry.interactionId) window.qaPerformance.interactions.push({ name: entry.name, durationMs: entry.duration });
      }).observe({ type: 'event', buffered: true, durationThreshold: 16 });
    });
    await page.goto(url);
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(3500);
    const hero = await page.evaluate(() => ({ ...window.qaPerformance, heroVideoPlaying: !!document.querySelector('video.is-playing'), webglLoadedAtHero: !!document.querySelector('.nexus-canvas') }));
    await page.locator('.planet-side-right').click();
    await page.locator('#nexus').scrollIntoViewIfNeeded();
    await page.locator('.nexus-canvas').waitFor();
    await page.waitForTimeout(1500);
    const frames = await page.evaluate(() => new Promise(resolve => {
      const times = []; let previous;
      function sample(time) {
        if (previous !== undefined) times.push(time - previous);
        previous = time;
        if (times.length < 300) requestAnimationFrame(sample); else resolve(times);
      }
      requestAnimationFrame(sample);
    }));
    assert.equal(frames.length, 300);
    await page.locator('.nexus-node[data-lab="physicslab"]').click();
    await page.locator('#lab-search-input').fill('tin hoc');
    await page.locator('#search-clear-btn').click();
    await page.locator('#faq-btn-2').click();
    await page.waitForTimeout(500);
    const metrics = await page.evaluate(() => window.qaPerformance);
    frames.sort((a, b) => a - b);
    results.push({ width, browser: browser.version(), mode: 'local production, no CPU/network throttle, desktop hardware, viewport emulation only', hero, ...metrics,
      frameIntervalMedianMs: frames[150], frameIntervalP95Ms: frames[285], sampledFrames: frames.length,
      longestObservedInteractionMs: Math.max(0, ...metrics.interactions.map(item => item.durationMs)),
      note: 'Event Timing samples are not field INP; zero means no event exceeded the observer threshold. rAF intervals are scheduling measurements, not hardware GPU benchmarks.', errors });
    await page.close();
  }
  await mkdir('artifacts/v5-refined/performance', { recursive: true });
  await writeFile('artifacts/v5-refined/performance/measurements.json', JSON.stringify(results, null, 2));
  console.log(JSON.stringify(results, null, 2));
} finally { await browser.close(); }
