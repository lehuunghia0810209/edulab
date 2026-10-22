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
  await fallback.locator('#reduce-motion-setting').check();
  await expect(fallback.locator('.nexus-ring-outer')).toHaveCSS('animation-play-state', 'paused');
  await fallback.locator('#reduce-motion-setting').uncheck();
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
  await page.route('**/assets/planet-*.webp', route => route.abort());
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
  for (const id of ['kham-pha-lab', 'nexus', 'bo-kham-pha', 'exa', 've-edulab', 'cach-hoat-dong', 'he-sinh-thai', 'faq']) {
    const section = page.locator('#' + id);
    await section.scrollIntoViewIfNeeded();
    await expect(section).toHaveClass(/is-visible/);
    await expect(section.locator('.motion-item').first()).toHaveCSS('opacity', '1');
  }
});

test('all hero media can fail without broken-image UI', async ({ page }) => {
  await page.route('https://d8j0ntlcm91z4.cloudfront.net/**', route => route.abort());
  await page.route('**/assets/planet-*.webp', route => route.abort());
  await page.goto('/');
  await expect(page.locator('.planet-hero')).toHaveClass(/has-poster-fallback/);
  await expect(page.locator('.planet-side.has-fallback')).toHaveCount(2);
  await page.locator('.planet-side-left').click();
  await expect(page.locator('.planet-title')).toHaveText('VENUS');
  await expect(page.locator('.planet-primary-cta')).toBeVisible();
});

test('Exa is a separate assessment platform with truthful unconfigured state', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  await expect(page.locator('.lab-card')).toHaveCount(5);
  await expect(page.locator('.nexus-node')).toHaveCount(5);
  await expect(page.locator('.eco-node-btn')).toHaveCount(5);
  await expect(page.locator('.exa-capabilities li')).toHaveCount(4);
  await expect(page.locator('.exa-eco-chips span')).toHaveCount(5);
  await page.locator('.nav-link[href="#exa"]').click();
  await expect(page).toHaveURL(/#exa$/);
  await expect(page.locator('.nav-link[href="#exa"]')).toHaveClass(/is-active/);
  const order = await page.locator('main > section').evaluateAll(sections => sections.map(section => section.id));
  expect(order.indexOf('exa')).toBe(order.indexOf('bo-kham-pha') + 1);
  const action = page.locator('#exa-action-slot button');
  await expect(action).toHaveText('Chưa cập nhật liên kết');
  await expect(page.locator('#exa-action-slot a')).toHaveCount(0);
  await action.click();
  await expect(page.locator('#status-toast')).toContainText('Exa');
  await expect(page.locator('#footer-exa-links button')).toContainText('Exa');
  await expect(page.locator('#footer-contact')).toBeHidden();
});

test('footer links resolve and the redundant final CTA is gone', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#nexus-heading')).toHaveText(/^Tri thức luôn\s*chuyển động\.$/);
  await expect(page.getByText('Hành trình khám phá bắt đầu từ đây')).toHaveCount(0);
  await expect(page.locator('.final-cta-box')).toHaveCount(0);
  const targets = await page.locator('a[href^="#"]').evaluateAll(links => links.map(link => link.getAttribute('href')));
  for (const hash of new Set(targets)) await expect(page.locator(hash), hash).toHaveCount(1);
  for (const title of ['Khám phá', 'Sản phẩm', 'Tìm hiểu']) await expect(page.locator('.footer-col-title', { hasText: title })).toHaveCount(1);
  for (const width of [1440, 768, 390, 320]) {
    await page.setViewportSize({ width, height: 900 });
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBe(0);
  }
});

test('Knowledge Galaxy fills its enlarged stage', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  await page.locator('#nexus').scrollIntoViewIfNeeded();
  await expect(page.locator('.nexus-canvas')).toBeVisible();
  const box = await page.locator('#nexus-viewport').boundingBox();
  expect(box.height).toBeGreaterThanOrEqual(700);
  // The core badge is sized from the fitted camera distance (108px here), so it detects both a shrunken and an overflowing system.
  const core = await page.locator('#nexus-viewport').evaluate(element => Number.parseFloat(element.style.getPropertyValue('--nexus-core-size')));
  expect(core).toBeGreaterThanOrEqual(98);
  expect(core).toBeLessThanOrEqual(120);
  const layout = await page.locator('#nexus-viewport').evaluate(element => ({
    points: [...element.querySelectorAll('.nexus-node')].map(node => node.dataset.canvasPoint.split(',').map(Number)),
    controlsTop: 1 - element.querySelector('.galaxy-controls').offsetHeight / element.clientHeight,
  }));
  const xs = layout.points.map(point => point[0]), ys = layout.points.map(point => point[1]);
  expect(Math.max(...xs) - Math.min(...xs)).toBeGreaterThan(.42);
  expect(Math.min(...xs)).toBeGreaterThan(.06);
  expect(Math.max(...xs)).toBeLessThan(.94);
  expect(Math.max(...ys)).toBeLessThan(layout.controlsTop);
});

// Each centre comes from different rendered pixels: the badge's CSS border, the WebGL core dash ring and the WebGL ITLab orbit.
async function measureGalaxyCentres(page, scale) {
  const viewport = page.locator('#nexus-viewport');
  const nodes = await viewport.evaluate(element => [...element.querySelectorAll('.nexus-node')].map(node => {
    const [x, y] = node.dataset.canvasPoint.split(',').map(Number);
    return [x * element.clientWidth, y * element.clientHeight + 12];
  }));
  const png = await page.screenshot({ clip: await viewport.boundingBox() });
  return page.evaluate(async ({ data, scale, nodes }) => {
    const image = new Image();
    image.src = 'data:image/png;base64,' + data;
    await image.decode();
    const canvas = document.createElement('canvas');
    canvas.width = image.width;
    canvas.height = image.height;
    const context = canvas.getContext('2d');
    context.drawImage(image, 0, 0);
    const px = context.getImageData(0, 0, canvas.width, canvas.height).data;
    const bg = [0, 1, 2].map(channel => { const values = []; for (let i = channel; i < px.length; i += 388) values.push(px[i]); values.sort((a, b) => a - b); return values[values.length >> 1]; });
    const select = test => { const out = []; for (let y = 0; y < canvas.height; y++) for (let x = 0; x < canvas.width; x++) { const i = (y * canvas.width + x) * 4; if (test(px[i] - bg[0], px[i + 1] - bg[1], px[i + 2] - bg[2], px[i])) out.push([x / scale, y / scale]); } return out; };
    const solve = (matrix, vector) => {
      const a = matrix.map((row, i) => [...row, vector[i]]), n = vector.length;
      for (let i = 0; i < n; i++) { for (let k = i + 1; k < n; k++) { const f = a[k][i] / a[i][i]; for (let j = i; j <= n; j++) a[k][j] -= f * a[i][j]; } }
      const x = Array(n).fill(0);
      for (let i = n - 1; i >= 0; i--) { let s = a[i][n]; for (let j = i + 1; j < n; j++) s -= a[i][j] * x[j]; x[i] = s / a[i][i]; }
      return x;
    };
    const leastSquares = (rows, rhs) => { const n = rows[0].length, m = Array.from({ length: n }, () => Array(n).fill(0)), v = Array(n).fill(0); rows.forEach((row, k) => { for (let i = 0; i < n; i++) { v[i] += row[i] * rhs[k]; for (let j = 0; j < n; j++) m[i][j] += row[i] * row[j]; } }); return solve(m, v); };
    const circle = points => { const [d, e] = leastSquares(points.map(([x, y]) => [x, y, 1]), points.map(([x, y]) => -(x * x + y * y))); return [-d / 2, -e / 2]; };
    const ellipse = (points, origin) => {
      let keep = points, result;
      for (const tolerance of [25, 10, 5, 3]) {
        const q = keep.map(([x, y]) => [x - origin[0], y - origin[1]]);
        const [a, b, c, d, e] = leastSquares(q.map(([x, y]) => [x * x, x * y, y * y, x, y]), q.map(() => 1));
        const [u, v] = solve([[2 * a, b], [b, 2 * c]], [-d, -e]);
        const k = a * u * u + b * u * v + c * v * v + d * u + e * v;
        result = { centre: [u + origin[0], v + origin[1]], rx: Math.sqrt(Math.abs((1 - k) / a)), ry: Math.sqrt(Math.abs((1 - k) / c)) };
        keep = keep.filter(([x, y]) => Math.abs(Math.hypot((x - result.centre[0]) / result.rx, (y - result.centre[1]) / result.ry) - 1) * Math.min(result.rx, result.ry) < tolerance);
      }
      return result;
    };
    const teal = select((dr, dg, db) => dg > 35 && dg > dr + 15 && db > dr + 10);
    const ring = (start, inner, outer) => {
      let centre = start;
      for (let pass = 0; pass < 4; pass++) {
        const sectors = Array.from({ length: 48 }, () => []);
        teal.forEach(([x, y]) => { const d = Math.hypot(x - centre[0], y - centre[1]); if (d > inner && d < outer) sectors[Math.floor((Math.atan2(y - centre[1], x - centre[0]) + Math.PI) / (2 * Math.PI) * 48) % 48].push([x, y, d]); });
        const picks = sectors.filter(list => list.length).map(list => list.sort((a, b) => a[2] - b[2])[list.length >> 1]);
        const median = picks.map(p => p[2]).sort((a, b) => a - b)[picks.length >> 1];
        centre = circle(picks.filter(p => Math.abs(p[2] - median) < 4).map(([x, y]) => [x, y]));
      }
      return centre;
    };
    const purple = select((dr, dg, db, r) => dr > 25 && dr > dg + 4 && db > dg + 8 && r < 230).filter(([x, y]) => nodes.every(([nx, ny]) => Math.hypot(x - nx, y - ny) > 38));
    const start = [purple.reduce((s, p) => s + p[0], 0) / purple.length, purple.reduce((s, p) => s + p[1], 0) / purple.length];
    const orbit = ellipse(purple, start);
    const unit = orbit.rx / 3.65;
    const white = select((dr, dg, db, r) => r > 235 && dr + bg[0] > 235 && dg + bg[1] > 235 && db + bg[2] > 235);
    const disc = [white.reduce((s, p) => s + p[0], 0) / white.length, white.reduce((s, p) => s + p[1], 0) / white.length];
    return { badge: ring(disc, .5 * unit, .66 * unit), core: ring(orbit.centre, .88 * unit, 1.03 * unit), orbit: orbit.centre };
  }, { data: png.toString('base64'), scale, nodes });
}

test('Knowledge Galaxy core, badge and orbits share one rendered centre', async ({ browser }) => {
  for (const deviceScaleFactor of [1, 1.25]) {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor });
    const page = await context.newPage();
    await page.goto('/');
    await page.locator('#nexus-viewport').scrollIntoViewIfNeeded();
    await expect(page.locator('.nexus-canvas')).toBeVisible();
    await page.evaluate(() => { document.querySelector('.site-header').style.visibility = 'hidden'; });
    await page.waitForTimeout(800);
    const sizes = await page.evaluate(() => [document.querySelector('.nexus-canvas'), document.querySelector('#nexus-viewport')].map(element => Math.round(element.getBoundingClientRect().width)));
    expect(sizes[0], `canvas CSS width at DPR ${deviceScaleFactor}`).toBe(sizes[1]);
    const { badge, core, orbit } = await measureGalaxyCentres(page, deviceScaleFactor);
    for (const [name, centre] of [['core rings', core], ['ITLab orbit', orbit]]) {
      expect(Math.hypot(centre[0] - badge[0], centre[1] - badge[1]), `${name} vs badge at DPR ${deviceScaleFactor}`).toBeLessThanOrEqual(3);
    }
    await context.close();
  }
});
