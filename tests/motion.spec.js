import { test, expect } from '@playwright/test';
import { writeFile, mkdir } from 'node:fs/promises';

const samples = [
  ['chem', '.lab-card[data-lab="chemlab"] .molecule-drift'],
  ['physics', '.lab-card[data-lab="physicslab"] .pendulum'],
  ['math', '.lab-card[data-lab="mathlab"] .geometry-turn'],
  ['biology', '.lab-card[data-lab="biolab"] .dna-rung'],
  ['it', '.lab-card[data-lab="itlab"] .data-travel'],
  ['explorer', '.preview-visual-stage .orbit-electron'],
  ['about', '.philosophy-geo .motif-orbit'],
  ['timeline', '.journey-orbit'],
  ['ecosystem', '.network-flow'],
  ['faq', '#faq .motif-orbit'],
  ['cta', '.final-cta-box .motif-orbit'],
  ['footer', '.site-footer .motif-orbit'],
];
const read = element => {
  const s = getComputedStyle(element);
  const matrix = new DOMMatrix(s.transform);
  return [matrix.a, matrix.b, matrix.c, matrix.d, matrix.e, matrix.f, Number.parseFloat(s.strokeDashoffset) || 0];
};
const difference = (a,b) => Math.max(...a.map((value,index) => Math.abs(value-b[index])));

for (const width of [1440, 390]) {
  test(`ambient artwork visibly changes at 0, 2 and 5 seconds without input — ${width}px`, async ({ page }) => {
    test.setTimeout(140000);
    await page.setViewportSize({width,height:width===1440?900:844});
    await page.emulateMedia({reducedMotion:'no-preference'});
    await page.goto('/');
    await page.evaluate(() => document.fonts.ready);
    const results=[];
    for (const [name,selector] of samples) {
      const graphic=page.locator(selector).first();
      await graphic.evaluate(element => (element.closest('svg') || element.parentElement).scrollIntoView({block:'center',behavior:'instant'}));
      await page.mouse.move(0,0);
      await page.waitForTimeout(1200);
      const readArtwork = () => page.locator(selector).evaluateAll(elements => elements.flatMap(element => {
        const style = getComputedStyle(element);
        const matrix = new DOMMatrix(style.transform);
        return [matrix.a, matrix.b, matrix.c, matrix.d, matrix.e, matrix.f, Number.parseFloat(style.strokeDashoffset) || 0];
      }));
      const initial=await readArtwork();
      await page.waitForTimeout(2000);
      const after2=await readArtwork();
      await page.waitForTimeout(3000);
      const after5=await readArtwork();
      expect(difference(initial,after2), `${name}: 2s`).toBeGreaterThan(.04);
      expect(difference(initial,after5), `${name}: 5s`).toBeGreaterThan(.04);
      results.push({name,initial,after2,after5});
    }
    await mkdir('artifacts/motion-5',{recursive:true});
    await writeFile(`artifacts/motion-5/samples-${width}.json`,JSON.stringify(results,null,2));
  });
}

test('unified controller pauses, resumes, persists and never duplicates the Nexus loop', async ({ page }) => {
  const errors=[];
  page.on('pageerror', error => errors.push(error.message));
  await page.emulateMedia({reducedMotion:'no-preference'});
  await page.goto('/');
  const api=await page.evaluate(async()=>Object.keys(await import('/src/modules/motion-controller.js')));
  expect(api).toEqual(expect.arrayContaining(['pauseMotion','resumeMotion','toggleMotion','getMotionState']));
  const graphic=page.locator('.lab-card[data-lab="chemlab"] .molecule-drift');
  await graphic.evaluate(element => element.closest('.lab-card').scrollIntoView({block:'center',behavior:'instant'}));
  await expect(graphic).toHaveCSS('animation-play-state','running');
  await expect(page.locator('#motion-toggle')).toHaveText(/Tạm dừng chuyển động/);
  await page.locator('#motion-toggle').click();
  await expect(graphic).toHaveCSS('animation-play-state','paused');
  await expect(page.locator('html')).toHaveAttribute('data-motion','off');
  await expect(page.locator('#motion-toggle')).toHaveAttribute('title','Tiếp tục chuyển động trang trí');
  expect(await page.evaluate(()=>localStorage.getItem('edulab-motion'))).toBe('paused');
  expect(await page.locator('#kham-pha-lab').evaluate(section => section.getAnimations({subtree:true}).filter(animation => animation.effect?.target?.matches('.ambient')).every(animation => animation.playState === 'paused'))).toBe(true);
  const paused=await graphic.evaluate(read);
  await page.waitForTimeout(350);
  expect(await graphic.evaluate(read)).toEqual(paused);
  await page.locator('#motion-toggle').click();
  await expect(graphic).toHaveCSS('animation-play-state','running');
  expect(await page.evaluate(()=>localStorage.getItem('edulab-motion'))).toBe('running');
  await page.locator('#faq').scrollIntoViewIfNeeded();
  await expect(graphic).toHaveCSS('animation-play-state','paused');
  await graphic.evaluate(element => element.closest('.lab-card').scrollIntoView({block:'center',behavior:'instant'}));
  await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,get:()=>true});document.dispatchEvent(new Event('visibilitychange'));});
  await expect(graphic).toHaveCSS('animation-play-state','paused');
  await page.evaluate(()=>{delete document.hidden;document.dispatchEvent(new Event('visibilitychange'));});
  await expect(graphic).toHaveCSS('animation-play-state','running');

  await page.locator('#nexus-viewport').scrollIntoViewIfNeeded();
  await expect(page.locator('.nexus-canvas')).toBeVisible();
  const node=page.locator('.nexus-node[data-lab="mathlab"]');
  await page.waitForTimeout(500);
  const movingPoint=await node.getAttribute('data-canvas-point');
  await page.waitForTimeout(500);
  await expect(node).not.toHaveAttribute('data-canvas-point',movingPoint);
  for(let i=0;i<5;i++) {
    await page.locator('#motion-toggle').click();
    const stopped=await node.getAttribute('data-canvas-point');
    await page.waitForTimeout(250);
    await expect(node).toHaveAttribute('data-canvas-point',stopped);
    await page.locator('#motion-toggle').click();
    await page.waitForTimeout(250);
    await expect(node).not.toHaveAttribute('data-canvas-point',stopped);
    await expect(page.locator('.nexus-canvas')).toHaveCount(1);
  }
  await page.locator('.nexus-node[data-lab="mathlab"]').click();
  await expect(page.locator('#nexus-hud-name')).toHaveText('MathLab');
  await page.locator('#motion-toggle').click();
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-motion','off');
  await expect(page.locator('#motion-toggle')).toHaveText(/Tiếp tục chuyển động/);
  await page.locator('#motion-toggle').click();
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-motion','on');
  await page.setViewportSize({width:390,height:844});
  await page.locator('#motion-toggle').click();
  await expect(page.locator('#motion-toggle')).toHaveAttribute('aria-pressed','true');
  await page.locator('#motion-toggle').click();
  expect(errors).toEqual([]);
});

test('reduced motion defaults to pause but explicit Resume remains available', async ({ page }) => {
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.goto('/');
  await page.evaluate(()=>localStorage.removeItem('edulab-motion'));
  await page.reload();
  const toggle=page.locator('#motion-toggle');
  const graphic=page.locator('.lab-card[data-lab="chemlab"] .molecule-drift');
  await graphic.evaluate(element => element.closest('.lab-card').scrollIntoView({block:'center',behavior:'instant'}));
  await expect(toggle).toBeEnabled();
  await expect(toggle).toHaveText(/Tiếp tục chuyển động/);
  await expect(graphic).toHaveCSS('animation-play-state','paused');
  await toggle.click();
  await expect(toggle).toHaveText(/Tạm dừng chuyển động/);
  await expect(graphic).toHaveCSS('animation-play-state','running');
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-motion','on');
});

test('Nexus renders distinct frames and maintains one canvas through pause and selection', async ({ page }) => {
  await page.emulateMedia({reducedMotion:'no-preference'});
  await page.goto('/');
  await page.locator('#nexus-viewport').scrollIntoViewIfNeeded();
  const canvas=page.locator('.nexus-canvas');
  await expect(canvas).toBeVisible();
  await page.waitForTimeout(1800);
  const a=await canvas.screenshot();
  await page.waitForTimeout(2000);
  const b=await canvas.screenshot();
  expect(a.equals(b)).toBe(false);
  await page.locator('.nexus-node[data-lab="itlab"]').click();
  await expect(page.locator('#nexus-hud-name')).toHaveText('ITLab');
  await page.locator('#nexus-reset-btn').click();
  for(let i=0;i<4;i++)await page.locator('#motion-toggle').click();
  await expect(canvas).toHaveCount(1);
  const point=await page.locator('.nexus-node[data-lab="itlab"]').getAttribute('data-canvas-point');
  await page.waitForTimeout(500);
  await expect(page.locator('.nexus-node[data-lab="itlab"]')).not.toHaveAttribute('data-canvas-point',point);
});

test('Explorer retains the selected DOM control and focus; ecosystem reset works', async ({ page }) => {
  await page.goto('/');
  const button=page.locator('.explorer-tab-item[data-lab="physicslab"]');
  const handle=await button.elementHandle();
  await button.click();
  expect(await handle.evaluate(element=>element.isConnected&&element===document.activeElement)).toBe(true);
  await expect(page.locator('#preview-title')).toHaveText('PhysicsLab');
  await page.locator('#lab-search-input').fill('tin hoc');
  await page.locator('#search-clear-btn').click();
  expect(await page.locator('.explorer-tab-item').evaluateAll(buttons => buttons.map(button => button.dataset.lab))).toEqual(['chemlab','physicslab','mathlab','biolab','itlab']);
  await page.locator('.eco-node-btn[data-eco-lab="biolab"]').click();
  await expect(page.locator('[data-connection="biolab"]')).toHaveClass(/is-active/);
  await page.locator('#eco-reset-btn').click();
  await expect(page.locator('.eco-node-btn[aria-pressed="true"]')).toHaveCount(0);
  await expect(page.locator('#eco-detail-title')).toHaveText('Năm lĩnh vực. Một điểm khởi đầu.');
});
