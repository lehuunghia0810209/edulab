import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';

const destination='artifacts/motion-5';
const url=process.env.QA_URL||'http://127.0.0.1:5188';
await mkdir(destination,{recursive:true});
const browser=await chromium.launch({channel:'chrome'});
const scenes=[['hero','#top'],['discovery','.lab-card[data-lab="chemlab"]'],['nexus','#nexus-viewport'],['explorer','#explorer-preview-panel'],['ecosystem','.eco-hub-wrap']];
const evidence=[];
try {
  for(const [name,selector] of scenes) {
    const context=await browser.newContext({viewport:{width:1440,height:900},reducedMotion:'no-preference',recordVideo:{dir:destination,size:{width:1440,height:900}}});
    const page=await context.newPage();
    const errors=[];
    page.on('pageerror',error=>errors.push(error.message));
    await page.goto(url);
    await page.evaluate(()=>document.fonts.ready);
    await page.locator(selector).evaluate(element=>element.scrollIntoView({block:'center',behavior:'instant'}));
    await page.mouse.move(0,0);
    await page.waitForTimeout(1800);
    for(const [time,delay] of [[0,0],[2,2000],[5,3000],[8,3000]]) {
      if(delay)await page.waitForTimeout(delay);
      await page.screenshot({path:`${destination}/${name}-t${time}.png`});
    }
    const video=page.video();
    await context.close();
    await video.saveAs(`${destination}/${name}-motion.webm`);
    evidence.push({name,stationaryObservationSeconds:8,errors});
    console.log(`Recorded ${name}: 8 seconds without input; runtime errors: ${errors.length}`);
  }
  const context=await browser.newContext({viewport:{width:1440,height:900},reducedMotion:'no-preference',recordVideo:{dir:destination,size:{width:1440,height:900}}});
  const page=await context.newPage();
  await page.goto(url);
  await page.waitForTimeout(2000);
  await page.locator('.planet-side-left').click();
  await page.waitForTimeout(1800);
  await page.locator('.planet-side-right').click();
  for(const selector of ['#kham-pha-lab','#nexus-viewport','#bo-kham-pha','#ve-edulab','#cach-hoat-dong','#he-sinh-thai','#faq','.final-cta-box','.site-footer']) {
    await page.locator(selector).evaluate(element=>element.scrollIntoView({block:'center',behavior:'smooth'}));
    await page.waitForTimeout(2200);
    if(selector==='#nexus-viewport')await page.locator('.nexus-node[data-lab="physicslab"]').click();
    if(selector==='#bo-kham-pha')await page.locator('.explorer-tab-item[data-lab="itlab"]').click();
    if(selector==='#he-sinh-thai')await page.locator('.eco-node-btn[data-eco-lab="biolab"]').click();
    if(selector==='#faq')await page.locator('#faq-btn-2').click();
  }
  const video=page.video();
  await context.close();
  await video.saveAs(`${destination}/full-page-walkthrough.webm`);
  await writeFile(`${destination}/recordings.json`,JSON.stringify(evidence,null,2));
} finally {await browser.close();}
