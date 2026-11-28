'use strict';
const {ipcRenderer,contextBridge}=require('electron');
function installControls(){
  if(document.getElementById('mirror-native-controls'))return;
  const css=document.createElement('style');
  css.textContent=`
  #mirror-native-controls{height:24px;position:relative;z-index:10000;display:flex;align-items:center;gap:4px;padding:2px 5px;background:#1c2c42;border-bottom:1px solid #4b6581;color:#f4e1b6;font:12px system-ui,-apple-system,sans-serif;-webkit-app-region:drag;user-select:none}
  #mirror-native-controls .native-logo{flex:1;min-width:24px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-weight:700}
  #mirror-native-controls button,#mirror-native-controls input{color:#ecf1f8;-webkit-app-region:no-drag}
  #mirror-native-controls button{padding:1px 5px;background:#293d53;border:1px solid #54728c;border-radius:6px;cursor:pointer;font-size:12px}
  #mirror-native-controls button.on{background:#73552b;border-color:#fbd89d;color:#ffe6b0}
  #mirror-native-controls input{width:53px;height:14px;accent-color:#efd092}
  #mirror-native-controls .native-opacity{font:10px system-ui;color:#c3d1e1;min-width:26px}
  #mirror-native-warning{display:none;background:#503d20;color:#fff0cc;font-size:10px;padding:3px 7px}
  body{margin:0!important;}
  /* R23：窗口按钮并进页面工具栏，省掉一整行 */
  html.mdMerged #mirror-native-controls{display:none!important}
  #mdWinBtns{display:flex;gap:3px;flex:none;-webkit-app-region:no-drag}
  #mdWinBtns button{min-width:24px;padding:0 4px;background:#293d53;border:1px solid #54728c;border-radius:6px;color:#ecf1f8;cursor:pointer;font-size:12px;-webkit-app-region:no-drag}
  #mdWinBtns button.on{background:#73552b;border-color:#fbd89d;color:#ffe6b0}
  html.mdMerged #app .toolbar{-webkit-app-region:drag}
  html.mdMerged #app .toolbar button,html.mdMerged #app .toolbar select,html.mdMerged #app .toolbar input{-webkit-app-region:no-drag}
  html.mdStrip #mdWinBtns{display:none!important}
  html.mdMerged body{--r14native:0px!important}
  html.mdMerged body:has(#mirror-native-warning[style*="block"]){--r14native:20px!important}
  `;
  document.head.appendChild(css);
  const el=document.createElement('div');el.id='mirror-native-controls';
  el.innerHTML=`<span class="native-logo" title="按住此处可拖动窗口">◈ 镜牢指挥条</span><button id="native-top" title="始终置顶">📌</button><span class="native-opacity" id="native-opacity-label">92%</span><input id="native-opacity-slider" type="range" min="35" max="100" value="92" title="窗口整体透明度"><button id="native-strip" title="缩成一条：只剩楼层和当前卡包">▁</button><button id="native-size" title="切换迷你与展开窗口">▣</button><button id="native-pass" title="穿透后按 Ctrl+Alt+F8 恢复点击">穿透</button><button id="native-hide" title="隐藏窗口（Ctrl+Alt+F9 恢复）">–</button><button id="native-close" title="退出程序">×</button>`;
  document.body.prepend(el);
  const warning=document.createElement('div');warning.id='mirror-native-warning';warning.textContent='已开启鼠标穿透 · Ctrl+Alt+F8 恢复点击 · 托盘图标也可关闭';el.after(warning);
  const g=id=>document.getElementById(id);
  // R23：把 ▁ ▣ – × 挪到页面工具栏最右边；页面没载入时保留原来的标题栏
  const tb=document.querySelector('#app .toolbar');
  if(tb){const box=document.createElement('span');box.id='mdWinBtns';['native-strip','native-size','native-hide','native-close'].forEach(id=>box.appendChild(g(id)));tb.appendChild(box);document.documentElement.classList.add('mdMerged');}
  function sync(v){
    if(!v)return;
    g('native-top').classList.toggle('on',v.alwaysOnTop);
    g('native-pass').classList.toggle('on',v.clickThrough);
    g('native-opacity-slider').value=Math.round(v.opacity*100);
    g('native-opacity-label').textContent=Math.round(v.opacity*100)+'%';
    g('native-size').classList.toggle('on',v.expanded);
    warning.style.display=v.clickThrough&&!v.strip?'block':'none';
    el.style.display=v.strip?'none':'';
    document.documentElement.classList.toggle('mdStrip',!!v.strip);
    g('native-strip').classList.toggle('on',!!v.strip);
  }
  g('native-top').onclick=()=>ipcRenderer.invoke('native:get').then(v=>ipcRenderer.invoke('native:set-top',!v.alwaysOnTop)).then(sync);
  g('native-pass').onclick=()=>ipcRenderer.invoke('native:set-pass',true).then(sync);
  g('native-opacity-slider').oninput=event=>{const value=event.target.value;g('native-opacity-label').textContent=value+'%';ipcRenderer.invoke('native:set-opacity',Number(value)/100).then(sync);};
  g('native-size').onclick=()=>ipcRenderer.invoke('native:get').then(v=>ipcRenderer.invoke('native:set-expanded',!v.expanded)).then(sync);
  g('native-strip').onclick=()=>ipcRenderer.invoke('native:set-mode','strip').then(sync);
  g('native-hide').onclick=()=>ipcRenderer.invoke('native:hide');
  g('native-close').onclick=()=>ipcRenderer.invoke('native:exit');
  ipcRenderer.on('overlay:window-state',(_e,settings)=>sync(settings));
  ipcRenderer.invoke('native:get').then(sync);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',installControls,{once:true});else installControls();

// Rescue indicator when app window loaded with native controls but the guide UI failed.
document.addEventListener('DOMContentLoaded',()=>{
  setTimeout(()=>{
    if(document.querySelector('#app .toolbar'))return;
    if(document.getElementById('mirror-rescue-message'))return;
    const el=document.createElement('div');el.id='mirror-rescue-message';
    el.style.cssText='padding:14px;color:#ffdcb4;font:13px Microsoft Yahei,system-ui;background:#2a2530';
    el.textContent='主攻略界面没有载入。请关闭软件，重新完整解压此ZIP，并检查 resources/app/web/overlay.html 是否存在。';
    document.body.appendChild(el);
  },700);
},{once:true});

// The catalog bridge permits only fixed, pre-registered operations; no arbitrary URL, path or code is accepted.
// 窗口档位：只接受三个固定值
contextBridge.exposeInMainWorld('MD_WINDOW',Object.freeze({
 setMode:m=>['strip','compact','expanded'].includes(m)?ipcRenderer.invoke('native:set-mode',m):Promise.resolve(null),
 get:()=>ipcRenderer.invoke('native:get').then(v=>({alwaysOnTop:!!v.alwaysOnTop,opacity:Number(v.opacity)||.92,clickThrough:!!v.clickThrough,expanded:!!v.expanded,strip:!!v.strip})),
 setTop:v=>ipcRenderer.invoke('native:set-top',!!v),
 setOpacity:n=>ipcRenderer.invoke('native:set-opacity',Math.min(1,Math.max(.35,Number(n)||.92))),
 setPass:()=>ipcRenderer.invoke('native:set-pass',true),
 shot:()=>ipcRenderer.invoke('native:shot'),
 setZoom:z=>[1,1.2,1.4].includes(z)?ipcRenderer.invoke('native:set-zoom',z):Promise.resolve(null)
}));
// R38：一键更新（地址和文件都由主进程决定，网页只能触发这三个动作）
contextBridge.exposeInMainWorld('MD_UPDATE',Object.freeze({
 check:()=>ipcRenderer.invoke('upd:check'),
 apply:()=>ipcRenderer.invoke('upd:apply'),
 restart:()=>ipcRenderer.invoke('upd:restart'),
 onProgress:cb=>{ipcRenderer.removeAllListeners('upd:progress');ipcRenderer.on('upd:progress',(_e,p)=>cb({i:+p.i,n:+p.n,got:+p.got,total:+p.total}))}
}));
contextBridge.exposeInMainWorld('MD_CATALOG',Object.freeze({
 load:()=>ipcRenderer.invoke('catalog:load'),
 sync:()=>ipcRenderer.invoke('catalog:sync'),
 cache:()=>ipcRenderer.invoke('catalog:cache')
}));
