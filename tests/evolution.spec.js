import { test, expect } from '@playwright/test';

// V6 evolution: hero particle field, card tilt, press feedback and scroll storytelling.
const frameHash = page => page.locator('.hero-particles').evaluate(canvas => {
  const data = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data;
  let hash = 0;
  for (let i = 0; i < data.length; i += 97) hash = (hash * 31 + data[i]) | 0;
  return hash;
});

test('hero particles draw changing frames and pause off screen, in a hidden tab and under reduce', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/');
  const canvas = page.locator('.hero-particles');
  await expect(canvas).toHaveCount(1);
  await expect(canvas).toHaveClass(/is-running/);
  await expect(canvas).toHaveCSS('pointer-events', 'none');
  const first = await frameHash(page);
  await page.waitForTimeout(600);
  expect(await frameHash(page)).not.toBe(first);

  await page.locator('#exa').scrollIntoViewIfNeeded();
  await expect(canvas).not.toHaveClass(/is-running/);
  await page.evaluate(() => scrollTo(0, 0));
  await expect(canvas).toHaveClass(/is-running/);

  await page.evaluate(() => {
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => true });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await expect(canvas).not.toHaveClass(/is-running/);
  await page.evaluate(() => {
    delete document.hidden;
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await expect(canvas).toHaveClass(/is-running/);

  // The footer checkbox would scroll the hero away, so use the shared controller in place.
  const motion = action => page.evaluate(async name => (await import('/src/modules/motion-controller.js'))[name](), action);
  await motion('pauseMotion');
  await expect(canvas).not.toHaveClass(/is-running/);
  const still = await frameHash(page);
  await page.waitForTimeout(600);
  expect(await frameHash(page)).toBe(still);
  await motion('resumeMotion');
  await expect(canvas).toHaveClass(/is-running/);
});

test('a click on empty sky bursts particles while hero controls keep working', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/');
  await page.waitForTimeout(2300);
  await page.mouse.click(1120, 260);
  await page.locator('.planet-side-right').click();
  await expect(page.locator('#planet-title-text')).toHaveText('MARS');
});

test('Lab cards tilt toward the pointer, reset on leave and never change layout', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/');
  const card = page.locator('.lab-card[data-lab="mathlab"]');
  await card.scrollIntoViewIfNeeded();
  await page.waitForTimeout(1200);
  const layout = () => card.evaluate(element => [element.offsetLeft, element.offsetTop, element.offsetWidth, element.offsetHeight]);
  const before = await layout();
  const box = await card.boundingBox();
  await page.mouse.move(box.x + box.width * 0.85, box.y + box.height * 0.2, { steps: 5 });
  await expect.poll(() => card.evaluate(element => getComputedStyle(element).rotate)).not.toBe('0deg');
  expect(await layout()).toEqual(before);
  await page.mouse.move(5, 5, { steps: 3 });
  await expect.poll(() => card.evaluate(element => getComputedStyle(element).rotate)).toBe('0deg');
});

test('reduced motion: no tilt, no scroll-driven drift, no press effects, content complete', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await expect(page.locator('.hero-particles')).not.toHaveClass(/is-running/);
  const card = page.locator('.lab-card[data-lab="mathlab"]');
  await card.scrollIntoViewIfNeeded();
  const box = await card.boundingBox();
  await page.mouse.move(box.x + box.width * 0.85, box.y + box.height * 0.2, { steps: 5 });
  await page.waitForTimeout(300);
  expect(await card.evaluate(element => [getComputedStyle(element).rotate, getComputedStyle(element).translate])).toEqual(['none', 'none']);
  expect(await page.locator('.lab-artwork-box').first().evaluate(element => element.getAnimations().length)).toBe(0);
  await page.locator('.planet-primary-cta').click().catch(() => {});
  await card.locator('.btn').click({ trial: true });
  await page.locator('#faq .faq-trigger').nth(1).click();
  await expect(page.locator('.fx-ripple, .fx-orbit')).toHaveCount(0);
  await expect(page.locator('#faq-ans-2')).toBeVisible();
});

test('press feedback never blocks navigation and cleans up after itself', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/');
  await page.waitForTimeout(2300);
  await page.evaluate(() => {
    window.qaPrevented = [];
    document.addEventListener('click', event => window.qaPrevented.push(event.defaultPrevented));
  });
  await page.locator('.planet-primary-cta').click();
  await expect(page).toHaveURL(/#kham-pha-lab$/);
  expect(await page.evaluate(() => window.qaPrevented)).toEqual([false]);
  await page.locator('.planet-side-left').scrollIntoViewIfNeeded();
  await page.locator('.planet-side-left').click();
  await expect(page.locator('.fx-ripple, .fx-orbit')).toHaveCount(0, { timeout: 2000 });
});

test('fast scrolling never leaves headings or answers hidden', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/');
  await page.evaluate(() => scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(1500);
  for (const selector of ['#faq .section-title', '#faq .faq-item', '#exa .section-title', '.site-footer .footer-grid']) {
    const element = page.locator(selector).first();
    await element.scrollIntoViewIfNeeded();
    await expect(element).toHaveCSS('opacity', '1');
  }
  const contrast = await page.locator('#faq .section-title').evaluate(element => getComputedStyle(element).color);
  expect(contrast).not.toBe('rgba(0, 0, 0, 0)');
});

test('phones and touch screens keep the plain hero without the particle canvas', async ({ browser }) => {
  // Two full page loads, each waiting for `load` (the field would only appear after it),
  // and `load` includes the large CDN planet images.
  test.setTimeout(90000);
  for (const options of [{ viewport: { width: 390, height: 844 } }, { viewport: { width: 1024, height: 768 }, hasTouch: true, isMobile: true }]) {
    const context = await browser.newContext({ ...options, reducedMotion: 'no-preference' });
    const page = await context.newPage();
    await page.goto('/');
    await page.waitForLoadState('load');
    await page.waitForTimeout(2500);
    await expect(page.locator('.hero-particles')).toHaveCount(0);
    await expect(page.locator('.planet-primary-cta')).toBeVisible();
    await context.close();
  }
});
