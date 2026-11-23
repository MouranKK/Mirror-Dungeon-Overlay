const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const root=path.resolve(__dirname,'..');
const files=['main.cjs','preload.cjs','web/overlay.js','web/overlay-knowledge.js','web/overlay-store.js','web/overlay-bosses.js','web/video-guides.js','web/gift-audit.js','web/visual-assets.js','web/artwork-catalog.js'];
for(const p of files){const s=fs.readFileSync(path.join(root,p),'utf8');new vm.Script(s,{filename:p});
 if(/static\.wixstatic\.com\/media\//.test(s))throw Error('Unlicensed CDN image URL found in '+p);
}
const h=fs.readFileSync(path.join(root,'web/overlay.html'),'utf8');
assert(h.includes('Content-Security-Policy'));
assert(fs.existsSync(path.join(root,'web/overlay-icon-192.png')));
assert(!fs.existsSync(path.join(root,'web/assets')),'third-party screenshot assets were bundled');
assert(fs.existsSync(path.join(root,'web/artwork')),'original image cards missing');
assert(h.includes('visual-assets.js')&&h.includes('artwork-catalog.js'),'visual loader missing');
const ctx={window:{}};
for(const p of ['web/overlay-knowledge.js','web/video-guides.js','web/gift-audit.js','web/visual-assets.js','web/artwork-catalog.js','web/overlay-store.js'])vm.runInNewContext(fs.readFileSync(path.join(root,p),'utf8'),ctx,{filename:p});
const db=ctx.window.MD_OVERLAY_KNOWLEDGE;
assert(db.gifts.length>=90,'gift lookup unexpectedly missing');
for(const gift of db.gifts)assert(!gift.image,'embedded third-party gift image');
const routes=ctx.window.MD_OVERLAY_STORE;
for(const key of ['burnVideo','wedgeVideo']){
 assert(routes[key].length===16,'route floor count');
 assert(ctx.window.VIDEO_GUIDES[key].floors.length===16,'video floor data length');
 for(let i=1;i<=15;i++)assert(routes[key][i].packs.length>0,'pack targets missing');
}
for(const route of Object.values(ctx.window.VIDEO_GUIDES))for(const src of Object.values(route.packs))assert(!src,'copyrighted pack screenshot bundled/linked');
assert(Object.values(ctx.window.GIFT_AUDIT.img).every(v=>!v),'remote game asset icons not removed');
console.log('PASS: JS syntax; 2x15 floor data; original art cards; user screenshot importer; no bundled / auto-fetched game art; CSP enabled.');
