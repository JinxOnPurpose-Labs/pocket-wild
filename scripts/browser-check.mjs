// Optional external test tooling, never shipped to the game or installed here.
import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
import fs from 'node:fs/promises';
const {chromium}=await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE).href);
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH});
const url=process.env.DEMO_URL||'http://127.0.0.1:4177/';
const output=process.env.EVIDENCE_DIR||'/tmp/pocket-wild-check';await fs.mkdir(output,{recursive:true});
const KEY='pocket-wild:world:v1',results=[];
async function run(name,fn){await fn();results.push(name);console.log('PASS',name);}
try{
 for(const mobile of [false,true]){
  const context=await browser.newContext(mobile?{viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:1}:{viewport:{width:1440,height:1100}});
  const page=await context.newPage(),errors=[],requests=[];page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>requests.push({url:r.url(),type:r.resourceType()}));
  await page.clock.install();await page.goto(url);await page.locator('#population-total').filter({hasText:'10 neighbours'}).waitFor();await page.clock.pauseAt(await page.evaluate(()=>Date.now()+1000));await page.clock.runFor(300);
  const save=async()=>{await page.locator('#save').click();return page.evaluate(k=>JSON.parse(localStorage.getItem(k)).world,KEY);};
  await run(`${mobile?'mobile':'desktop'} render and layout`,async()=>{assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);assert.ok(await page.locator('#world').isVisible());assert.equal(await page.evaluate(()=>getComputedStyle(document.documentElement).colorScheme),'dark');assert.equal(await page.evaluate(()=>getComputedStyle(document.body).color),'rgb(230, 236, 231)');assert.equal(await page.locator('.local-badge a').getAttribute('href'),'https://jinx.xanderxx.xyz/');await page.screenshot({path:`${output}/${mobile?'mobile':'desktop'}.png`,fullPage:true});});
  await page.locator('#pause').click();
  await run('paused world does not advance',async()=>{const a=await save();await page.clock.runFor(2000);assert.equal((await save()).time,a.time);});
  await run(`${mobile?'touch':'pointer drag'} painting and inspection`,async()=>{
   await page.locator('[data-tool="water"]').click();await page.locator('#world').scrollIntoViewIfNeeded();const box=await page.locator('#world').boundingBox();const x=box.x+box.width*.15,y=box.y+box.height*.2;
   if(mobile)await page.touchscreen.tap(x,y);else{await page.mouse.move(x,y);await page.mouse.down();await page.mouse.move(x+box.width*.1,y,{steps:5});await page.mouse.up();}
   const w=await save();assert.ok(w.cells[5*48+7].water>.6);await page.locator('[data-tool="inspect"]').click();await page.locator('#world').scrollIntoViewIfNeeded();const ib=await page.locator('#world').boundingBox();if(mobile)await page.touchscreen.tap(ib.x+ib.width*.15,ib.y+ib.height*.2);else await page.mouse.click(ib.x+ib.width*.15,ib.y+ib.height*.2);assert.match(await page.locator('#inspection').textContent(),/pond/);
  });
  if(!mobile)await run('keyboard tools, cursor and apply',async()=>{await page.locator('#world').focus();await page.keyboard.press('5');const a=await save();await page.locator('#world').focus();await page.keyboard.press('ArrowRight');await page.keyboard.press('Space');const b=await save();assert.equal(b.creatures.length,a.creatures.length+1);await page.keyboard.press('i');assert.equal(await page.locator('[data-tool="inspect"]').getAttribute('aria-pressed'),'true');});
  await run('save reload, no offline catch-up',async()=>{const a=await save();await page.reload();await page.locator('#save-status').filter({hasText:'No offline time'}).waitFor();const raw=await page.evaluate(k=>JSON.parse(localStorage.getItem(k)).world,KEY);assert.deepEqual(raw,a);await page.locator('#pause').click();assert.ok(Math.abs((await save()).time-a.time)<1);});
  await run('weather and speed controls',async()=>{await page.locator('#weather').selectOption('rain');assert.equal((await save()).weather,'rain');await page.locator('[data-speed="4"]').click();assert.equal(await page.locator('[data-speed="4"]').getAttribute('aria-pressed'),'true');await page.locator('#pause').click();const a=await save();await page.clock.runFor(1000);const b=await save();assert.ok(b.time-a.time>3.5&&b.time-a.time<4.5, 'speed delta '+(b.time-a.time));await page.locator('#pause').click();});
  await run('hidden-tab transition suspends simulation',async()=>{await page.locator('#pause').click();const a=await save();await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,value:true});document.dispatchEvent(new Event('visibilitychange'));});await page.clock.runFor(60000);const b=await save();assert.equal(b.time,a.time);await page.evaluate(()=>{delete document.hidden;document.dispatchEvent(new Event('visibilitychange'));});await page.clock.runFor(200);assert.ok((await save()).time-a.time<1);await page.locator('#pause').click();});
  await run('corrupt storage is preserved, explicit recovery only',async()=>{await page.evaluate(k=>localStorage.setItem(k,'{broken'),KEY);await page.reload();await page.locator('#save-status.bad').waitFor();await page.clock.runFor(15000);assert.equal(await page.evaluate(k=>localStorage.getItem(k),KEY),'{broken');page.once('dialog',d=>d.accept());await save();assert.equal(await page.locator('#save-status').getAttribute('class'),'');});
  await run('new empty world and starter reset',async()=>{page.once('dialog',d=>d.accept());await page.locator('#new-empty').click();let w=await save();assert.equal(w.creatures.length,0);assert.equal(w.cells.filter(c=>c.plant).length,0);page.once('dialog',d=>d.accept());await page.locator('#new-starter').click();assert.equal((await save()).creatures.length,10);});
  await run('no errors or gameplay network',async()=>{assert.deepEqual(errors,[]);const allowed=new Set(['document','script','stylesheet','image']);assert.deepEqual(requests.filter(r=>!(allowed.has(r.type)||(r.type==='other'&&r.url===new URL('icon.svg',url).href))||!r.url.startsWith(new URL(url).origin)),[]);const before=requests.length;await page.clock.runFor(10000);assert.equal(requests.length,before);});
  await context.close();
 }
 const context=await browser.newContext();await context.addInitScript(()=>{Storage.prototype.setItem=()=>{throw new DOMException('Blocked','SecurityError');};});const page=await context.newPage();await page.goto(url);await page.locator('#save').click();assert.match(await page.locator('#save-status').textContent(),/blocked or full/);results.push('blocked storage degrades to unsaved play');await context.close();
 await fs.writeFile(`${output}/browser-results.json`,JSON.stringify({url,results,physicalDeviceTested:false,backgroundTest:'controlled document.hidden visibilitychange with elapsed browser clock; no physical OS background claim'},null,2));
}finally{await browser.close();}
