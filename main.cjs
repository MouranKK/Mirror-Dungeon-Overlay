'use strict';
const { app, BrowserWindow, ipcMain, globalShortcut, Menu, Tray, nativeImage, shell, screen } = require('electron');
const fs = require('node:fs');
const path = require('node:path');
const {pathToFileURL} = require('node:url');
const GUIDE_WEB = 'https://github.com/MouranKK/Mirror-Dungeon-Overlay';
const ALLOWED_EXTERNAL_HOSTS = new Set([
  'limbuscompany.wiki.gg','limbuscompany.huijiwiki.com','limcogito.com',
  'www.reddit.com','reddit.com','www.youtube.com','youtu.be','note.com',
  'forum.gamer.com.tw','github.com'
]);
function openReviewedLink(raw) {
  try {
    const url = new URL(raw);
    if(url.protocol !== 'https:' || url.username || url.password || !ALLOWED_EXTERNAL_HOSTS.has(url.hostname)) return false;
    shell.openExternal(url.href).catch(err=>console.warn('External link failed:',err.message));
    return true;
  } catch { return false; }
}

let win;
let tray;
let saved;
let exitReady = false;
const defaults = { alwaysOnTop: true, opacity: 0.92, clickThrough: false, expanded: false, width: 390, height: 206, x: null, y: null };
const settingsFile = () => path.join(app.getPath('userData'), 'overlay-window.json');
function readSettings() {
  try { const a=JSON.parse(fs.readFileSync(settingsFile(),'utf8')); return {...defaults,...a,clickThrough:false}; } catch {return {...defaults};}
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
function setExpanded(v) {
  saved.expanded=!!v;
  const [w,h]=win.getSize();
  win.setSize(w, saved.expanded?600:206, true);
  persist();notify();return {...saved};
}
function setVisibility() {if(win.isVisible())win.hide();else{win.showInactive();notify();}}
function createWindow(){
  saved=readSettings();
  const display=screen.getPrimaryDisplay().workArea;
  const width=Math.max(310,Math.min(700,Number(saved.width)||390));
  const height=saved.expanded?600:206;
  const xx=Number.isFinite(saved.x)?saved.x:display.x+display.width-width-20;
  const yy=Number.isFinite(saved.y)?saved.y:display.y+90;
  win=new BrowserWindow({
    width, height, x:xx, y:yy, frame:false, show:false,
    resizable:true, minimizable:true, skipTaskbar:false,
    alwaysOnTop:saved.alwaysOnTop, opacity:saved.opacity,
    backgroundColor:'#101b2b', autoHideMenuBar:true,
    webPreferences:{preload:path.join(__dirname,'preload.cjs'), contextIsolation:true, sandbox:true, nodeIntegration:false, webviewTag:false, webSecurity:true, devTools:false}
  });
  win.setMenuBarVisibility(false);
  win.setOpacity(saved.opacity);
  win.loadFile(path.join(__dirname,'web','overlay.html'));
  // Renderer remains offline: links are opened by the OS only after hostname review.
  win.webContents.session.setPermissionRequestHandler((_contents,_permission,callback)=>callback(false));
  win.webContents.session.setPermissionCheckHandler(()=>false);
  win.webContents.session.webRequest.onBeforeRequest({urls:['http://*/*','https://*/*']},(_details,callback)=>callback({cancel:true}));
  win.webContents.on('did-finish-load',()=>notify());
  win.webContents.setWindowOpenHandler(({url})=>{openReviewedLink(url);return {action:'deny'};});
  win.webContents.on('will-navigate',(event,url)=>{event.preventDefault();openReviewedLink(url)});
  win.on('closed',()=>{win=null;app.quit();});
  let timer;
  win.on('resize',()=>{if(!win||!saved)return;clearTimeout(timer);timer=setTimeout(()=>{saved.width=win.getSize()[0];saved.height=win.getSize()[1];persist();},350);});
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
    {label:'打开完整攻略网站',click:()=>openReviewedLink(GUIDE_WEB)},
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
const onlyThisWindow=(event)=>{
  const frame = event.senderFrame;
  if(!win || event.sender!==win.webContents || !frame || frame!==win.webContents.mainFrame || !frame.url.startsWith('file://') || !frame.url.endsWith('/web/overlay.html'))throw Error('Unauthorized frame');
};
app.whenReady().then(()=>{
  if(!app.requestSingleInstanceLock()){app.quit();return;}
  createWindow();setupTray();register();
  ipcMain.handle('native:get',event=>{onlyThisWindow(event);return {...saved}});
  ipcMain.handle('native:set-top',(event,v)=>{onlyThisWindow(event);return setTop(v)});
  ipcMain.handle('native:set-opacity',(event,v)=>{onlyThisWindow(event);return setAlpha(v)});
  ipcMain.handle('native:set-pass',(event,v)=>{onlyThisWindow(event);return setPass(v)});
  ipcMain.handle('native:set-expanded',(event,v)=>{onlyThisWindow(event);return setExpanded(v)});
  ipcMain.handle('native:hide',event=>{onlyThisWindow(event);win.hide();return true});
  ipcMain.handle('native:exit',event=>{onlyThisWindow(event);exitReady=true;app.quit();return true});
});
app.on('second-instance',()=>{if(win){setPass(false);win.show();win.focus();}});
app.on('will-quit',()=>globalShortcut.unregisterAll());
app.on('window-all-closed',()=>{if(process.platform!=='darwin')app.quit();});
