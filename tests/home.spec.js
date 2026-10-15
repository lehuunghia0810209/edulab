import { test, expect } from '@playwright/test';

test('desktop navigation and core controls', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/');
  const nav = page.locator('#primary-nav');
  await expect(nav).toBeVisible();
  await expect(nav).not.toHaveAttribute('inert');
  await expect(nav).toHaveAttribute('aria-hidden', 'false');
  await page.getByRole('link', { name: 'Về EduLab', exact: true }).first().click();
  await expect(page).toHaveURL(/#ve-edulab$/);
  await expect(page.locator('.nav-link[href="#ve-edulab"]')).toHaveClass(/is-active/);
  await page.getByRole('link', { name: 'Hệ sinh thái', exact: true }).first().focus();
  await expect(page.getByRole('link', { name: 'Hệ sinh thái', exact: true }).first()).toBeFocused();
  expect(errors).toEqual([]);
});

test('mobile navigation survives Escape and resize', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  const burger = page.locator('#burger-btn');
  const nav = page.locator('#primary-nav');
  await expect(nav).toHaveAttribute('inert');
  await burger.click();
  await expect(nav).not.toHaveAttribute('inert');
  await expect(burger).toHaveAttribute('aria-expanded', 'true');
  await expect(page.locator('main')).toHaveAttribute('inert');
  const menuBox = await nav.boundingBox();
  expect(menuBox.height).toBeGreaterThan(600);
  expect(await page.evaluate(() => document.elementFromPoint(200, 500)?.closest('#primary-nav') !== null)).toBe(true);
  await page.keyboard.press('Escape');
  await expect(burger).toBeFocused();
  await expect(nav).toHaveAttribute('inert');
  await expect(page.locator('main')).not.toHaveAttribute('inert');
  await burger.click();
  await page.locator('.nav-link[href="#faq"]').click();
  await expect(page).toHaveURL(/#faq$/);
  await expect(page.locator('body')).not.toHaveCSS('overflow', 'hidden');
  await page.setViewportSize({ width: 1440, height: 900 });
  await expect(nav).not.toHaveAttribute('inert');
  await expect(nav).toHaveAttribute('aria-hidden', 'false');
  await page.setViewportSize({ width: 1024, height: 768 });
  await expect(nav).toHaveAttribute('inert');
  await expect(burger).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(nav).toHaveAttribute('inert');
});

test('Nexus selection, reset, raycast and fallback controls', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  await page.locator('#nexus').scrollIntoViewIfNeeded();
  await expect(page.locator('.nexus-canvas')).toBeVisible();
  for (const [id, name] of [['chemlab', 'ChemLab'], ['physicslab', 'PhysicsLab'], ['itlab', 'ITLab']]) {
    await page.locator(`.nexus-node[data-lab="${id}"]`).click();
    await expect(page.locator('#nexus-hud-name')).toHaveText(name);
    await expect(page.locator('.nexus-node[aria-pressed="true"]')).toHaveCount(1);
  }
  await page.locator('#nexus-reset-btn').click();
  await expect(page.locator('#nexus-hud-name')).toHaveText('EduLab Knowledge Nexus');
  await page.locator('.nexus-canvas').scrollIntoViewIfNeeded();
  const box = await page.locator('.nexus-canvas').boundingBox();
  const [x, y] = (await page.locator('.nexus-node[data-lab="chemlab"]').getAttribute('data-canvas-point')).split(',').map(Number);
  await page.mouse.click(box.x + box.width * x, box.y + box.height * y);
  await expect(page.locator('#nexus-hud-name')).toHaveText('ChemLab');

  const fallback = await page.context().newPage();
  await fallback.addInitScript(() => { window.WebGLRenderingContext = undefined; });
  await fallback.goto('/');
  await expect(fallback.locator('.nexus-canvas')).toHaveCount(0);
  await fallback.locator('.nexus-node[data-lab="biolab"]').click();
  await expect(fallback.locator('#nexus-hud-name')).toHaveText('BioLab');
  await expect(fallback.locator('.nexus-ring-outer')).toHaveCSS('animation-play-state', 'running');
  await fallback.locator('#motion-toggle').click();
  await expect(fallback.locator('.nexus-ring-outer')).toHaveCSS('animation-play-state', 'paused');
  await fallback.locator('#motion-toggle').click();
  await fallback.locator('#faq').scrollIntoViewIfNeeded();
  await expect(fallback.locator('.nexus-ring-outer')).toHaveCSS('animation-play-state', 'paused');
  await fallback.close();
});

test('Explorer search, categories, empty state and recovery', async ({ page }) => {
  await page.goto('/');
  const search = page.locator('#lab-search-input');
  await search.fill('tin hoc');
  await expect(page.locator('.explorer-tab-item')).toHaveCount(1);
  await expect(page.locator('#preview-title')).toHaveText('ITLab');
  await page.locator('#search-clear-btn').click();
  await expect(search).toBeFocused();
  await expect(page.locator('.explorer-tab-item')).toHaveCount(5);
  await search.fill('hoa hoc');
  await expect(page.locator('#preview-title')).toHaveText('ChemLab');
  await search.fill('');
  await page.locator('.filter-btn[data-filter="logic"]').click();
  await expect(page.locator('.filter-btn[data-filter="logic"]')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('.explorer-tab-item')).toHaveCount(2);
  await search.fill('khong co lab nay');
  await expect(page.locator('#explorer-empty')).toBeVisible();
  await expect(page.locator('#explorer-preview-panel')).toBeHidden();
  await page.locator('#reset-search-btn').click();
  await expect(page.locator('.explorer-tab-item')).toHaveCount(5);
  await expect(search).toBeFocused();
});

test('theme, FAQ, Lab URL states and toast', async ({ page }) => {
  await page.goto('/');
  await page.locator('#theme-toggle').click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await expect(page.locator('#theme-toggle')).toHaveAttribute('aria-label', 'Chuyển sang giao diện tối');
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await page.locator('#theme-toggle').click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  const faq = page.locator('#faq-btn-1');
  await faq.focus();
  await page.keyboard.press('Enter');
  await expect(faq).toHaveAttribute('aria-expanded', 'false');
  await page.keyboard.press('Enter');
  await expect(faq).toHaveAttribute('aria-expanded', 'true');
  await expect(page.locator('#faq-ans-1')).toBeVisible();
  for (const item of await page.locator('.faq-item').all()) {
    const trigger = item.locator('.faq-trigger');
    if (await trigger.getAttribute('aria-expanded') === 'true') continue;
    await trigger.click();
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');
    await trigger.click();
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
  }
  await expect(page.locator('.lab-card').first().locator('a')).toHaveAttribute('href', 'https://example.org/chem');
  await page.locator('.lab-card').nth(1).getByRole('button', { name: /Chưa cập nhật liên kết/ }).click();
  await expect(page.locator('#status-toast')).toContainText('PhysicsLab');
  await expect(page.locator('#status-toast')).toHaveCSS('pointer-events', 'none');
  await expect(page.locator('.lab-card')).toHaveCount(5);
});

test('Lab actions stay consistent across sections', async ({ page }) => {
  await page.goto('/');
  await page.locator('.nexus-node[data-lab="chemlab"]').click();
  await expect(page.locator('#nexus-hud-cta-slot a')).toHaveAttribute('href', 'https://example.org/chem');
  await page.locator('.nexus-node[data-lab="physicslab"]').click();
  await expect(page.locator('#nexus-hud-cta-slot button')).toContainText('Chưa cập nhật liên kết');
  await page.locator('#lab-search-input').fill('physicslab');
  await expect(page.locator('#preview-action-slot button')).toContainText('Chưa cập nhật liên kết');
  await page.locator('.eco-node-btn[data-eco-lab="physicslab"]').click();
  await expect(page.locator('#eco-detail-action button')).toContainText('Chưa cập nhật liên kết');
  await expect(page.locator('#footer-lab-links a').first()).toHaveAttribute('href', 'https://example.org/chem');
  await expect(page.locator('#footer-lab-links button').first()).toContainText('PhysicsLab');
});

test('ecosystem, footer navigation and back to top', async ({ page }) => {
  await page.goto('/');
  await page.locator('.eco-node-btn[data-eco-lab="physicslab"]').click();
  await expect(page.locator('#eco-detail-title')).toContainText('PhysicsLab');
  await expect(page.locator('.eco-node-btn[aria-pressed="true"]')).toHaveCount(1);
  await page.locator('.site-footer a[href="#faq"]').click();
  await expect(page).toHaveURL(/#faq$/);
  await page.locator('#back-to-top').click();
  await expect.poll(() => page.evaluate(() => scrollY)).toBeLessThan(20);
});

test('WebGL initialization failure keeps Nexus usable', async ({ page }) => {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function(type, ...args) {
      return type === 'webgl' || type === 'webgl2' ? null : original.call(this, type, ...args);
    };
  });
  await page.goto('/');
  await expect(page.locator('.nexus-viewport')).not.toHaveClass(/has-webgl/);
  await page.locator('.nexus-node[data-lab="mathlab"]').click();
  await expect(page.locator('#nexus-hud-name')).toHaveText('MathLab');
});

test('WebGL context loss retains fallback and restores the scene', async ({ page }) => {
  await page.goto('/');
  await page.locator('#nexus').scrollIntoViewIfNeeded();
  const canvas = page.locator('.nexus-canvas');
  await expect(canvas).toBeVisible();
  const oldCanvas = await canvas.elementHandle();
  await oldCanvas.evaluate(element => element.dispatchEvent(new Event('webglcontextlost', { cancelable: true })));
  await expect(page.locator('.nexus-viewport')).not.toHaveClass(/has-webgl/);
  await page.locator('.nexus-node[data-lab="itlab"]').click();
  await expect(page.locator('#nexus-hud-name')).toHaveText('ITLab');
  await oldCanvas.evaluate(element => element.dispatchEvent(new Event('webglcontextrestored')));
  await expect(page.locator('.nexus-canvas')).toBeVisible();
  await expect(page.locator('.nexus-viewport')).toHaveClass(/has-webgl/);
});

test('reduced motion, responsive widths and screenshots', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  for (const [width, height] of [[320, 700], [360, 780], [375, 812], [390, 844], [430, 932], [580, 900], [768, 1024], [1024, 768], [1280, 800], [1440, 900], [1920, 1080], [2560, 1440], [1024, 600], [390, 560]]) {
    await page.setViewportSize({ width, height });
    await page.goto('/');
    await expect(page.locator('.planet-title')).toBeVisible();
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
    if ([320, 390, 768, 1024, 1440, 1920].includes(width)) {
      await page.screenshot({ path: `artifacts/home-${width}.png`, fullPage: true });
    }
    if ([320, 390, 768, 1024, 1440, 1920].includes(width)) {
      await page.locator('.planet-hero').screenshot({ path: `artifacts/hero-${width}-${height}.png` });
    }
  }
  await page.locator('.nexus-node[data-lab="mathlab"]').click();
  await expect(page.locator('#nexus-hud-name')).toHaveText('MathLab');
  await expect(page.locator('.planet-sky video').first()).toHaveJSProperty('paused', true);
});

test('normal motion visual states', async ({ page }) => {
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: width === 1440 ? 900 : 844 });
    await page.goto('/');
    for (const section of await page.locator('.reveal-section').all()) {
      await section.scrollIntoViewIfNeeded();
    }
    await page.locator('#top').scrollIntoViewIfNeeded();
    await page.waitForTimeout(2200);
    await page.screenshot({ path: `artifacts/normal-${width}.png`, fullPage: true });
    await page.locator('.planet-hero').screenshot({ path: `artifacts/hero-normal-${width}.png` });
    await page.locator('.nexus-node[data-lab="physicslab"]').click();
    await page.locator('.nexus-stage').screenshot({ path: `artifacts/nexus-selected-${width}.png` });
    if (width === 390) {
      await page.locator('#burger-btn').click();
      await page.waitForTimeout(300);
      expect(await page.evaluate(() => document.elementFromPoint(200, 500)?.closest('#primary-nav') !== null)).toBe(true);
      await page.screenshot({ path: 'artifacts/mobile-menu.png' });
    } else {
      await page.locator('#theme-toggle').click();
      await page.waitForTimeout(300);
      await page.screenshot({ path: 'artifacts/light-hero.png' });
    }
  }
});

test('planet switcher is reversible and keeps labels, artwork and media in sync', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  const hero = page.locator('.planet-hero');
  const left = hero.locator('.planet-side-left');
  const right = hero.locator('.planet-side-right');
  const assertState = async (featured, leftPlanet, rightPlanet) => {
    await expect(hero).toHaveAttribute('data-featured', featured);
    await expect(hero.locator('.planet-title')).toHaveText(featured.toUpperCase());
    await expect(left).toHaveAttribute('data-planet', leftPlanet);
    await expect(right).toHaveAttribute('data-planet', rightPlanet);
    await expect(left.locator('img.is-shown')).toHaveAttribute('data-planet', leftPlanet);
    await expect(right.locator('img.is-shown')).toHaveAttribute('data-planet', rightPlanet);
    await expect(hero.locator('.planet-poster.is-active')).toHaveAttribute('data-planet', featured);
    await expect(hero.locator('#planet-left-label')).toHaveText(leftPlanet.toUpperCase());
    await expect(hero.locator('#planet-right-label')).toHaveText(rightPlanet.toUpperCase());
    expect(await page.evaluate(() => scrollX)).toBe(0);
    expect(await hero.evaluate(element => element.scrollLeft)).toBe(0);
    expect(await hero.locator('video').evaluateAll(elements => elements.filter(video => !video.paused).length)).toBeLessThanOrEqual(1);
  };
  await assertState('earth', 'venus', 'mars');
  await expect(hero.locator('video[src]')).toHaveCount(1);
  await page.waitForTimeout(2200);
  await hero.screenshot({ path: 'artifacts/planet-earth.png' });
  await right.click();
  await assertState('mars', 'earth', 'venus');
  await page.waitForTimeout(700);
  await hero.screenshot({ path: 'artifacts/planet-mars.png' });
  await left.click();
  await assertState('earth', 'venus', 'mars');
  await left.click();
  await assertState('venus', 'earth', 'mars');
  await page.waitForTimeout(700);
  await hero.screenshot({ path: 'artifacts/planet-venus.png' });
  await right.click();
  await assertState('mars', 'earth', 'venus');
  await right.click();
  await assertState('venus', 'earth', 'mars');
  await left.click();
  await assertState('earth', 'venus', 'mars');
  expect(await hero.locator('video.is-playing').count()).toBeLessThanOrEqual(1);
  await page.setViewportSize({ width: 390, height: 844 });
  await right.focus();
  await page.keyboard.press('Enter');
  await assertState('mars', 'earth', 'venus');
  await page.waitForTimeout(700);
  await hero.screenshot({ path: 'artifacts/planet-mobile-mars.png' });
  await page.setViewportSize({ width: 320, height: 700 });
  await left.click();
  await assertState('earth', 'venus', 'mars');
});

test('planet poster and controls survive video failure and reduced motion', async ({ page }) => {
  await page.route('**/*hf_20260827_202133_*.png', route => route.fulfill({contentType:'image/svg+xml',body:'<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32"><rect width="32" height="32" fill="#173b43"/></svg>'}));
  await page.route('**/*.mp4', route => route.abort());
  await page.goto('/');
  await page.getByRole('button', { name: 'Khám phá Sao Kim' }).click();
  await expect(page.locator('.planet-poster.is-active')).toHaveAttribute('data-planet', 'venus');
  await expect(page.locator('.planet-poster.is-active')).toHaveCSS('opacity', '1');
  await expect(page.locator('.planet-title')).toHaveText('VENUS');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(page.locator('.planet-sky video').first()).toHaveJSProperty('paused', true);
  await expect(page.locator('.planet-primary-cta')).toBeVisible();
  await page.locator('.planet-primary-cta').click();
  await expect(page).toHaveURL(/#kham-pha-lab$/);
  await page.goto('/');
  await page.locator('.planet-scroll').click();
  await expect(page).toHaveURL(/#kham-pha-lab$/);
});

test('rapid planet switching settles on the last requested state', async ({ page }) => {
  await page.goto('/');
  const hero = page.locator('.planet-hero');
  await hero.locator('.planet-side-right').click();
  await hero.locator('.planet-side-right').click();
  await hero.locator('.planet-side-left').click();
  await hero.locator('.planet-side-right').click();
  await expect(hero).toHaveAttribute('data-featured', 'mars');
  await expect(hero.locator('.planet-poster.is-active')).toHaveCount(1);
  expect(await hero.locator('video').evaluateAll(videos => videos.filter(video => !video.paused).length)).toBeLessThanOrEqual(1);
});

test('poster failure activates the geometric hero fallback', async ({ page }) => {
  await page.route('**/*hf_20260827_202133_*.png', route => route.abort());
  await page.goto('/');
  await expect(page.locator('.planet-hero')).toHaveClass(/has-poster-fallback/);
  await expect(page.locator('.planet-poster[data-planet="earth"]')).toHaveClass(/is-broken/);
  await expect(page.locator('.planet-primary-cta')).toBeVisible();
});

test('cutout failure activates recognizable side planet fallbacks', async ({ page }) => {
  await page.route(/.*hf_20260827_2020(05|12|18)_.*\.png/, route => route.abort());
  await page.goto('/');
  await expect(page.locator('.planet-side.has-fallback')).toHaveCount(2);
  await page.locator('.planet-side-right').click();
  await expect(page.locator('.planet-title')).toHaveText('MARS');
  await expect(page.locator('.planet-side.has-fallback')).toHaveCount(2);
});

test('core Lab content and configured links work without JavaScript', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto('/');
  await expect(page.locator('.lab-card')).toHaveCount(5);
  await expect(page.locator('.lab-card').first().getByRole('link')).toHaveAttribute('href', 'https://example.org/chem');
  await expect(page.locator('#footer-lab-links').getByRole('link')).toHaveAttribute('href', 'https://example.org/chem');
  await expect(page.locator('.no-js-note')).toBeVisible();
  await context.close();
});

test('Explorer selection produces observable motion feedback', async ({ page }) => {
  await page.goto('/');
  await page.locator('#bo-kham-pha').scrollIntoViewIfNeeded();
  await page.locator('.explorer-tab-item[data-lab="itlab"]').click();
  await expect(page.locator('#preview-title')).toHaveText('ITLab');
  expect(await page.locator('#explorer-preview-panel').evaluate(panel => panel.getAnimations().length)).toBeGreaterThan(0);
});

test('timeline exposes scroll-linked progress', async ({ page }) => {
  await page.goto('/');
  const timeline = page.locator('.steps-timeline');
  await timeline.scrollIntoViewIfNeeded();
  await expect.poll(() => timeline.evaluate(element => Number.parseFloat(getComputedStyle(element).getPropertyValue('--timeline-progress')))).toBeGreaterThan(0.2);
});

test('planet and ecosystem controls support keyboard activation', async ({ page }) => {
  await page.goto('/');
  const planet = page.getByRole('button', { name: 'Khám phá Sao Hỏa' });
  await planet.focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('.planet-title')).toHaveText('MARS');
  const eco = page.locator('.eco-node-btn[data-eco-lab="biolab"]');
  await eco.focus();
  await page.keyboard.press('Space');
  await expect(page.locator('#eco-detail-title')).toContainText('BioLab');
});

test('page supports 200 percent pinch zoom and equivalent layout reflow', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  const client = await page.context().newCDPSession(page);
  await client.send('Emulation.setPageScaleFactor', { pageScaleFactor: 2 });
  await expect(page.locator('.planet-primary-cta')).toBeVisible();
  await page.locator('#kham-pha-lab').scrollIntoViewIfNeeded();
  await expect(page.locator('.lab-card').first()).toBeVisible();
  await client.send('Emulation.setPageScaleFactor', { pageScaleFactor: 1 });
  // 1440px at 200% browser zoom has a 720 CSS pixel layout viewport.
  await page.setViewportSize({ width: 720, height: 450 });
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
  await expect(page.locator('#burger-btn')).toBeVisible();
  await page.locator('#lab-search-input').fill('tin hoc');
  await expect(page.locator('#preview-title')).toHaveText('ITLab');
});

test('every Lab keeps artwork, status and one safe action', async ({ page }) => {
  await page.goto('/');
  for (const card of await page.locator('.lab-card').all()) {
    await expect(card.locator('.lab-artwork-box svg')).toHaveCount(1);
    await expect(card.locator('.lab-status-pill')).toBeVisible();
    await expect(card.locator('.lab-card-footer').locator('a, button')).toHaveCount(1);
  }
});

test('major sections resolve their individual reveal states', async ({ page }) => {
  await page.goto('/');
  for (const id of ['kham-pha-lab', 'nexus', 'bo-kham-pha', 've-edulab', 'cach-hoat-dong', 'he-sinh-thai', 'faq']) {
    const section = page.locator('#' + id);
    await section.scrollIntoViewIfNeeded();
    await expect(section).toHaveClass(/is-visible/);
    await expect(section.locator('.motion-item').first()).toHaveCSS('opacity', '1');
  }
});

test('all remote hero media can fail without broken-image UI', async ({ page }) => {
  await page.route('https://d8j0ntlcm91z4.cloudfront.net/**', route => route.abort());
  await page.goto('/');
  await expect(page.locator('.planet-hero')).toHaveClass(/has-poster-fallback/);
  await expect(page.locator('.planet-side.has-fallback')).toHaveCount(2);
  await page.locator('.planet-side-left').click();
  await expect(page.locator('.planet-title')).toHaveText('VENUS');
  await expect(page.locator('.planet-primary-cta')).toBeVisible();
});
