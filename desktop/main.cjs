'use strict';
const { app, BrowserWindow, ipcMain, globalShortcut, Menu, Tray, nativeImage, shell, screen, protocol, net } = require('electron');
const crypto=require('node:crypto');
protocol.registerSchemesAsPrivileged([{scheme:'mirrorimg',privileges:{standard:true,secure:true,supportFetchAPI:true}}]);
const fs = require('node:fs');
const path = require('node:path');
// 开发/测试时用独立的用户数据目录，避免覆盖玩家自己的进度和窗口设置
if (process.env.MD_OVERLAY_PROFILE) app.setPath('userData', process.env.MD_OVERLAY_PROFILE);
let win;
let tray;
let saved;
let exitReady = false;
const defaults = { alwaysOnTop: true, opacity: 0.92, clickThrough: false, expanded: false, strip: false, width: 560, height: 250, compactLayoutVersion:15, x: null, y: null };

const CATALOG_URL='https://limcogito.com/md-gifts';
function catalogFile(){return path.join(app.getPath('userData'),'mirror-gifts-catalog.json')}
function catalogIconDir(){return path.join(app.getPath('userData'),'mirror-gifts-icons')}
function photoKey(url){return crypto.createHash('sha256').update(url).digest('hex').slice(0,24)}
function legalImageURL(url){
 try{const u=new URL(url);return u.protocol==='https:'&&['img.limcogito.com','s3.limcogito.com'].includes(u.hostname)}catch{return false}
}
function readCatalog(){try{const c=JSON.parse(fs.readFileSync(catalogFile(),'utf8'));return Array.isArray(c.items)?c:null}catch{return null}}
async function syncCatalog(){
 const inspector=new BrowserWindow({show:false,width:860,height:600,webPreferences:{sandbox:true,nodeIntegration:false,contextIsolation:true,webviewTag:false}});
 try{
  await Promise.race([inspector.loadURL(CATALOG_URL),new Promise((_,rej)=>setTimeout(()=>rej(Error('连接超时，原有图鉴仍可使用')),25000))]);
  let records=[];
  for(let attempt=0;attempt<12;attempt++){
   records=await inspector.webContents.executeJavaScript(`(() => {
    const rows=Array.from(document.querySelectorAll('tbody tr'));
    return rows.map(tr=>{
      const t=Array.from(tr.querySelectorAll('td'));
      if(t.length<5)return null;
      const txt=i=>(t[i]?.innerText||t[i]?.textContent||'').replace(/\\s+/g,' ').trim();
      const img=t[0]?.querySelector('img');
      const imageUrl=img?.getAttribute('data-src')||img?.getAttribute('src')||'';
      return {english:txt(0),tier:txt(1),cost:txt(2),keyword:txt(3),obtain:txt(4),imageUrl:imageUrl?new URL(imageUrl,location.href).href:''};
    }).filter(x=>x&&x.english);
   })()`);
   if(records.length>=450)break;
   await new Promise(res=>setTimeout(res,600));
  }
  records=records.filter(x=>x.english.length<130).map(x=>({...x,imageUrl:legalImageURL(x.imageUrl)?x.imageUrl:'',photoId:legalImageURL(x.imageUrl)?photoKey(x.imageUrl):''}));
  const unique=new Map(records.map(x=>[x.english.toLowerCase(),x]));
  records=[...unique.values()];
  if(records.length<450||records.length>550)throw Error('页面返回 '+records.length+' 条，未达到完整性校验标准；已保留旧版本');
  const output={version:2,syncedAt:new Date().toISOString(),expected:466,actual:records.length,items:records};
  fs.mkdirSync(path.dirname(catalogFile()),{recursive:true});
  const temp=catalogFile()+'.tmp';fs.writeFileSync(temp,JSON.stringify(output),'utf8');fs.renameSync(temp,catalogFile());
  return output;
 }finally{if(!inspector.isDestroyed())inspector.destroy()}
}
async function cacheCatalogIcons(){
 const cat=readCatalog();if(!cat)throw Error('请先同步完整图鉴');
 fs.mkdirSync(catalogIconDir(),{recursive:true});
 const items=cat.items.filter(x=>legalImageURL(x.imageUrl));
 let ok=0,failed=0,already=0;
 let cursor=0;
 const worker=async()=>{while(cursor<items.length){
   const rec=items[cursor++];const dest=path.join(catalogIconDir(),photoKey(rec.imageUrl)+'.img');
   if(fs.existsSync(dest)&&fs.statSync(dest).size>128){already++;continue;}
   try{
     const res=await net.fetch(rec.imageUrl,{signal:AbortSignal.timeout(12000)});
     if(!res.ok)throw Error('HTTP '+res.status);
     const mime=(res.headers.get('content-type')||'').toLowerCase();if(!mime.startsWith('image/'))throw Error('非图片响应');
     const b=Buffer.from(await res.arrayBuffer());if(b.length<128||b.length>2_000_000)throw Error('图片大小异常');
     fs.writeFileSync(dest,b);ok++;
   }catch(e){failed++}
 }};
 await Promise.all(Array.from({length:6},worker));
 return {total:items.length,newlyCached:ok,already,failed};
}

const settingsFile = () => path.join(app.getPath('userData'), 'overlay-window.json');
function readSettings() {
  try { const a=JSON.parse(fs.readFileSync(settingsFile(),'utf8')); return {...defaults,...a,...(a.compactLayoutVersion===15?{}:{width:560,height:250,expanded:false}),compactLayoutVersion:15,clickThrough:false}; } catch {return {...defaults};}
}
function persist() {
  if (!saved) return;
  try {fs.mkdirSync(path.dirname(settingsFile()), {recursive:true}); fs.writeFileSync(settingsFile(),JSON.stringify({...saved,clickThrough:false},null,2),'utf8');}catch(e){console.warn('Setting save failed:',e.message);}
}
function notify() {if (win && !win.isDestroyed()) win.webContents.send('overlay:window-state', {...saved});}
function setTop(v) {
  saved.alwaysOnTop=!!v;
  win.setAlwaysOnTop(saved.alwaysOnTop, 'floating');
  persist();notify();return {...saved};
}
function setAlpha(v) {
  const n=Number(v);if(!Number.isFinite(n))throw Error('Invalid opacity');
  saved.opacity=Math.min(1, Math.max(.35,n));
  win.setOpacity(saved.opacity);persist();notify();return {...saved};
}
function setPass(v) {
  saved.clickThrough=!!v;
  // Once enabled, all clicks pass to the game. Restore with Ctrl+Alt+F8 or tray icon.
  win.setIgnoreMouseEvents(saved.clickThrough,{forward:true});notify();return {...saved};
}
// R22：三档窗口：一条框（只有一行）/ 迷你条 / 展开
const STRIP_H=64;
// R37j：字号（小 1 / 中 1.2 / 大 1.4）——迷你条和展开的窗口跟着按比例变大，一条框不变
const zf=()=>[1,1.2,1.4].includes(Number(saved.zoom))?Number(saved.zoom):1;
function modeHeight(){const d=screen.getPrimaryDisplay().workArea.height;return saved.strip?STRIP_H:Math.min(d,saved.expanded?Math.round(600*zf()):Math.max(220,Number(saved.height)||250))}
function setZoom(z){z=Number(z);if(![1,1.2,1.4].includes(z))throw Error('Invalid zoom');if(z===zf()&&saved.zoom!==undefined)return {...saved};saved.zoom=z;
  if(!saved.strip&&win){if(win.isMaximized())win.unmaximize();const dw=screen.getPrimaryDisplay().workArea.width;
    if(!saved.expanded){saved.width=Math.round(560*z);saved.height=Math.round(250*z);}
    win.setSize(Math.min(dw,saved.expanded?Math.max(Math.round(560*z),win.getSize()[0]):saved.width),modeHeight(),true)}
  persist();notify();return {...saved}}
function setMode(m) {
  if(!['strip','compact','expanded'].includes(m))throw Error('Invalid mode');
  saved.strip=m==='strip';saved.expanded=m==='expanded';
  // R23：切回迷你条 / 一条框时恢复标准尺寸，拖拽过的大小不再带过来
  if(win.isMaximized())win.unmaximize();
  if(!saved.expanded){saved.width=Math.round(560*zf());saved.height=Math.round(250*zf());}
  const w=saved.expanded?Math.max(Math.round(560*zf()),win.getSize()[0]):saved.strip?560:saved.width;
  win.setMinimumSize(310, saved.strip?STRIP_H:220);
  win.setSize(w, modeHeight(), true);
  persist();notify();return {...saved};
}
function setExpanded(v) {return setMode(v?'expanded':'compact')}
function setVisibility() {if(win.isVisible())win.hide();else{win.showInactive();notify();}}
function createWindow(){
  saved=readSettings();
  const display=screen.getPrimaryDisplay().workArea;
  const width=Math.max(310,Math.min(display.width,Number(saved.width)||560));
  const height=Math.min(display.height,modeHeight());
  const xx=Number.isFinite(saved.x)?saved.x:display.x+display.width-width-20;
  const yy=Number.isFinite(saved.y)?saved.y:display.y+90;
  win=new BrowserWindow({
    width, height, minWidth:310, minHeight:saved.strip?STRIP_H:220, x:xx, y:yy, frame:false, show:false,
    resizable:true, minimizable:true, skipTaskbar:false,
    alwaysOnTop:saved.alwaysOnTop, opacity:saved.opacity,
    backgroundColor:'#101b2b', autoHideMenuBar:true,
    webPreferences:{preload:path.join(__dirname,'preload.cjs'), contextIsolation:true, sandbox:true, nodeIntegration:false, webviewTag:false}
  });
  win.setMenuBarVisibility(false);
  win.setOpacity(saved.opacity);
  const logPath=path.join(app.getPath('userData'),'overlay-startup-errors.log');
  const logError=(where,error)=>{
    try {fs.appendFileSync(logPath,new Date().toISOString()+' ['+where+'] '+String(error).slice(0,2000)+'\n','utf8');}catch(_){}
    console.error(where,error);
  };
  const displayError=(message)=>{
    if(!win||win.isDestroyed())return;
    const safe=String(message).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
    const page='<!doctype html><html lang="zh-CN"><meta charset="utf-8"><body style="background:#101b2b;color:#f5e7d4;font:14px Microsoft Yahei,system-ui;padding:20px"><h3>镜牢攻略界面加载失败</h3><p>已记录错误，不能继续使用空白窗口。</p><pre style="white-space:pre-wrap;color:#e9b5ab">'+safe+'</pre><p>请重新完整解压ZIP，并打开 resources/app 文件夹核对 overlay.html。</p><p>日志：overlay-startup-errors.log（位于程序用户数据目录）</p></body></html>';
    win.loadURL('data:text/html;charset=utf-8,'+encodeURIComponent(page)).catch(e=>logError('fallback',e));
  };
  win.webContents.on('did-fail-load',(_ev,errorCode,errorDescription,validatedURL,isMainFrame)=>{
    logError('did-fail-load',errorCode+' '+errorDescription+' '+validatedURL);
    if(isMainFrame!==false && !validatedURL.startsWith('data:'))displayError(errorDescription);
  });
  win.webContents.on('render-process-gone',(_ev,details)=>logError('render-process-gone',JSON.stringify(details)));
  win.webContents.on('console-message',(_ev,level,message,_,sourceId)=>{
    if(level>=2)logError('renderer-console',message+' '+sourceId);
  });
  win.loadFile(path.join(__dirname,'web','overlay.html')).catch(error=>{
    logError('loadFile',error.stack||error.message||error);
    displayError(error.message||error);
  });
  win.webContents.on('did-finish-load',()=>{
    notify();
    win.webContents.executeJavaScript(`Boolean(document.querySelector('#app .toolbar') && document.querySelector('#team'))`)
      .then(loaded=>{if(!loaded && !win.webContents.getURL().startsWith('data:')){
        logError('renderer-dom','Main guide toolbar absent after document load');
        displayError('主攻略页面未正确载入（HTML 内容缺失）');
      }}).catch(error=>logError('renderer-check',error.message||error));
  });
  // 反馈：只允许打开写给作者邮箱的 mailto 链接
  const FEEDBACK_MAIL=/^mailto:3296233462bzr@gmail\.com(\?|$)/;
  win.webContents.setWindowOpenHandler(({url})=>{if(/^https:\/\//.test(url)||FEEDBACK_MAIL.test(url))shell.openExternal(url);return {action:'deny'};});
  win.webContents.on('will-navigate',(event,url)=>{if(!url.startsWith('file://')){event.preventDefault();if(/^https:\/\//.test(url)||FEEDBACK_MAIL.test(url))shell.openExternal(url)}});
  win.on('closed',()=>{win=null;app.quit();});
  let timer;
  win.on('resize',()=>{if(!win||!saved)return;clearTimeout(timer);timer=setTimeout(()=>{saved.width=win.getSize()[0];if(!saved.strip&&!saved.expanded)saved.height=win.getSize()[1];persist();},350);});
  win.on('move',()=>{if(!win||!saved)return;const [x,y]=win.getPosition();saved.x=x;saved.y=y;persist();});
  win.once('ready-to-show',()=>win.show());
}
function setupTray(){
  const ico=nativeImage.createFromPath(path.join(__dirname,'web','overlay-icon-192.png')).resize({width:16,height:16});
  tray=new Tray(ico);
  tray.setToolTip('镜牢指挥条 · Ctrl+Alt+F8 关闭/开启鼠标穿透');
  const getMenu=()=>Menu.buildFromTemplate([
    {label:'显示 / 隐藏悬浮栏 (Ctrl+Alt+F9)',click:setVisibility},
    {label:'鼠标穿透 (Ctrl+Alt+F8)',type:'checkbox',checked:!!saved.clickThrough,click:()=>setPass(!saved.clickThrough)},
    {label:'始终置顶',type:'checkbox',checked:!!saved.alwaysOnTop,click:()=>setTop(!saved.alwaysOnTop)},
    {label:'透明度 60%',click:()=>setAlpha(.6)},
    {label:'透明度 90%',click:()=>setAlpha(.9)},
    {label:'恢复完整可点击模式',click:()=>{setPass(false);setAlpha(1);win.show();win.focus()}},
    {type:'separator'},
    {label:'退出',click:()=>{exitReady=true;app.quit()}}
  ]);
  tray.on('right-click',()=>tray.popUpContextMenu(getMenu()));
  tray.on('click',()=>{if(saved.clickThrough)setPass(false);else win.show();});
  tray.setContextMenu(getMenu());
}
function register(){
  // Extra safety: click-through can't trap the user. Restore input without interacting with the window.
  const passOK=globalShortcut.register('Control+Alt+F8',()=>setPass(!saved.clickThrough));
  const visOK=globalShortcut.register('Control+Alt+F9',setVisibility);
  if(!passOK) console.warn('Ctrl+Alt+F8 already in use; tray menu remains available');
  if(!visOK) console.warn('Ctrl+Alt+F9 already in use; tray menu remains available');
}
const onlyThisWindow=(event)=>{if(!win||event.sender!==win.webContents)throw Error('Unauthorized window');};
app.whenReady().then(()=>{
  protocol.handle('mirrorimg',req=>{
    const match=new URL(req.url).pathname.match(/^\/([a-f0-9]{24})$/);
    if(!match)return new Response('bad image',{status:400});
    const p=path.join(catalogIconDir(),match[1]+'.img');
    try{
      const b=fs.readFileSync(p);
      const mime=b[0]===0x89&&b[1]===0x50?'image/png':b.toString('ascii',0,4)==='RIFF'?'image/webp':b[0]===0xff&&b[1]===0xd8?'image/jpeg':'image/avif';
      return new Response(b,{headers:{'content-type':mime,'cache-control':'public,max-age=86400'}});
    }catch{return new Response('not found',{status:404})}
  });
  ipcMain.handle('catalog:load',event=>{onlyThisWindow(event);return readCatalog()});
  ipcMain.handle('catalog:sync',async event=>{onlyThisWindow(event);return syncCatalog()});
  ipcMain.handle('catalog:cache',async event=>{onlyThisWindow(event);return cacheCatalogIcons()});

  if(!app.requestSingleInstanceLock()){app.quit();return;}
  createWindow();setupTray();register();
  ipcMain.handle('native:get',event=>{onlyThisWindow(event);return {...saved}});
  ipcMain.handle('native:set-top',(event,v)=>{onlyThisWindow(event);return setTop(v)});
  ipcMain.handle('native:set-opacity',(event,v)=>{onlyThisWindow(event);return setAlpha(v)});
  ipcMain.handle('native:set-pass',(event,v)=>{onlyThisWindow(event);return setPass(v)});
  ipcMain.handle('native:set-expanded',(event,v)=>{onlyThisWindow(event);return setExpanded(v)});
  ipcMain.handle('native:set-mode',(event,m)=>{onlyThisWindow(event);return setMode(m)});
  ipcMain.handle('native:set-zoom',(event,z)=>{onlyThisWindow(event);return setZoom(z)});
  ipcMain.handle('native:hide',event=>{onlyThisWindow(event);win.hide();return true});
  // 反馈截图：存到桌面，打开所在文件夹
  ipcMain.handle('native:shot',async event=>{onlyThisWindow(event);const img=await win.webContents.capturePage();const d=new Date(),p=n=>String(n).padStart(2,'0');const f=path.join(app.getPath('desktop'),`镜牢指挥条反馈截图_${d.getFullYear()}${p(d.getMonth()+1)}${p(d.getDate())}_${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}.png`);fs.writeFileSync(f,img.toPNG());shell.showItemInFolder(f);return path.basename(f)});
  ipcMain.handle('native:exit',event=>{onlyThisWindow(event);app.quit();return true});
  // R38：一键更新
  ipcMain.handle('upd:check',async event=>{onlyThisWindow(event);return updCheck()});
  ipcMain.handle('upd:apply',async event=>{onlyThisWindow(event);try{return {ok:true,...await updApply(p=>{if(win&&!win.isDestroyed())win.webContents.send('upd:progress',p)})}}catch(e){return {ok:false,error:String(e.message||e)}}});
  ipcMain.handle('upd:restart',event=>{onlyThisWindow(event);app.relaunch();app.exit(0);return true});
});

// ===== R38：一键更新——只下载 resources/app 里变了的文件（逐个核对 SHA256），全部下好再替换，然后重启 =====
// 检查地址固定：网页版服务器 + jsDelivr 镜像（国内比 GitHub 好连）；Electron 运行环境变了就提示下载完整包
const UPD_REPO='MouranKK/Mirror-Dungeon-Overlay';
const UPD_TEST=process.env.MD_UPDATE_BASE||''; // 只给开发测试用：指向本地服务器
const UPD_MANIFEST=UPD_TEST?[UPD_TEST+'desktop/manifest.json']:['https://mourankk.github.io/Mirror-Dungeon-Overlay/desktop/manifest.json',`https://cdn.jsdelivr.net/gh/${UPD_REPO}@gh-pages/desktop/manifest.json`,`https://fastly.jsdelivr.net/gh/${UPD_REPO}@gh-pages/desktop/manifest.json`];
const UPD_BASE=v=>UPD_TEST?[UPD_TEST]:[`https://cdn.jsdelivr.net/gh/${UPD_REPO}@desktop-${v}/`,`https://fastly.jsdelivr.net/gh/${UPD_REPO}@desktop-${v}/`,'https://mourankk.github.io/Mirror-Dungeon-Overlay/',`https://raw.githubusercontent.com/${UPD_REPO}/desktop-${v}/`];
const updNewer=(a,b)=>{const x=String(a||0).split('.').map(Number),y=String(b||0).split('.').map(Number);for(let i=0;i<Math.max(x.length,y.length);i++){const d=(x[i]||0)-(y[i]||0);if(d)return d>0}return false};
async function updGet(url,ms){const c=new AbortController(),t=setTimeout(()=>c.abort(),ms);try{const r=await net.fetch(url,{signal:c.signal});if(!r.ok)throw Error('HTTP '+r.status);return Buffer.from(await r.arrayBuffer())}finally{clearTimeout(t)}}
let updManifest=null;
async function updCheck(){
  const cur=JSON.parse(fs.readFileSync(path.join(app.getAppPath(),'package.json'),'utf8')).publicVersion;updManifest=null;
  for(const u of UPD_MANIFEST){try{const m=JSON.parse((await updGet(u+'?t='+Date.now(),10000)).toString('utf8'));if(m&&m.version&&m.files&&typeof m.files==='object'){updManifest=m;break}}catch{}}
  if(!updManifest)return {ok:false,current:cur};
  return {ok:true,current:cur,latest:updManifest.version,hasUpdate:updNewer(updManifest.version,cur),fullNeeded:updManifest.electron!==process.versions.electron,notes:Array.isArray(updManifest.notes)?updManifest.notes.slice(0,8):[]};
}
async function updApply(send){
  const m=updManifest;if(!m)throw Error('还没有检查更新');if(m.electron!==process.versions.electron)throw Error('这次要下载完整包');
  const dir=app.getAppPath(),sha=b=>crypto.createHash('sha256').update(b).digest('hex'),need=[];
  for(const [p,v] of Object.entries(m.files)){
    if(!Array.isArray(v)||!/^[0-9a-f]{64}$/.test(v[0])||/(^|[\\/])\.\.([\\/]|$)/.test(p)||path.isAbsolute(p))continue;
    const f=path.resolve(dir,p);if(!f.startsWith(path.resolve(dir)+path.sep))continue;
    let h='';try{h=sha(fs.readFileSync(f))}catch{}if(h!==v[0])need.push([p,f,v[0],Number(v[1])||0]);
  }
  const total=need.reduce((a,x)=>a+x[3],0),bases=UPD_BASE(m.version),staged=[];let got=0;
  try{
    for(const [i,[p,f,h]] of need.entries()){
      const rel=(p.startsWith('web/')?p.slice(4):'desktop/'+p).split('/').map(encodeURIComponent).join('/');let buf=null;
      for(const b of bases){try{const x=await updGet(b+rel,60000);if(sha(x)===h){buf=x;break}}catch{}}
      if(!buf)throw Error('下载失败：'+p);
      fs.mkdirSync(path.dirname(f),{recursive:true});fs.writeFileSync(f+'.mdnew',buf);staged.push(f);got+=buf.length;send({i:i+1,n:need.length,got,total});
    }
  }catch(e){for(const f of staged)fs.rmSync(f+'.mdnew',{force:true});throw e}
  for(const f of staged)fs.renameSync(f+'.mdnew',f); // 全部下好、核对过再一起替换
  return {count:need.length,bytes:got};
}
app.on('second-instance',()=>{if(win){setPass(false);win.show();win.focus();}});
app.on('will-quit',()=>globalShortcut.unregisterAll());
app.on('window-all-closed',()=>{if(process.platform!=='darwin')app.quit();});
