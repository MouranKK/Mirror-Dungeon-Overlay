'use strict';
const {ipcRenderer}=require('electron');
function installControls(){
  if(document.getElementById('mirror-native-controls'))return;
  const css=document.createElement('style');
  css.textContent=`
  #mirror-native-controls{height:32px;position:relative;z-index:10000;display:flex;align-items:center;gap:4px;padding:2px 5px;background:#1c2c42;border-bottom:1px solid #4b6581;color:#f4e1b6;font:12px system-ui,-apple-system,sans-serif;-webkit-app-region:drag;user-select:none}
  #mirror-native-controls .native-logo{flex:1;min-width:24px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-weight:700}
  #mirror-native-controls button,#mirror-native-controls input{color:#ecf1f8;-webkit-app-region:no-drag}
  #mirror-native-controls button{padding:4px 7px;background:#293d53;border:1px solid #54728c;border-radius:6px;cursor:pointer;font-size:12px}
  #mirror-native-controls button.on{background:#73552b;border-color:#fbd89d;color:#ffe6b0}
  #mirror-native-controls input{width:53px;height:14px;accent-color:#efd092}
  #mirror-native-controls .native-opacity{font:10px system-ui;color:#c3d1e1;min-width:26px}
  #mirror-native-warning{display:none;background:#503d20;color:#fff0cc;font-size:10px;padding:3px 7px}
  body{margin:0!important;}
  `;
  document.head.appendChild(css);
  const el=document.createElement('div');el.id='mirror-native-controls';
  el.innerHTML=`<span class="native-logo" title="按住此处可拖动窗口">◈ 镜牢指挥条</span><button id="native-top" title="始终置顶">📌</button><span class="native-opacity" id="native-opacity-label">92%</span><input id="native-opacity-slider" type="range" min="35" max="100" value="92" title="窗口整体透明度"><button id="native-size" title="切换迷你与展开窗口">▣</button><button id="native-pass" title="穿透后按 Ctrl+Alt+F8 恢复点击">穿透</button><button id="native-hide" title="隐藏窗口（Ctrl+Alt+F9 恢复）">–</button><button id="native-close" title="退出程序">×</button>`;
  document.body.prepend(el);
  const warning=document.createElement('div');warning.id='mirror-native-warning';warning.textContent='已开启鼠标穿透 · Ctrl+Alt+F8 恢复点击 · 托盘图标也可关闭';el.after(warning);
  const g=id=>document.getElementById(id);
  function sync(v){
    if(!v)return;
    g('native-top').classList.toggle('on',v.alwaysOnTop);
    g('native-pass').classList.toggle('on',v.clickThrough);
    g('native-opacity-slider').value=Math.round(v.opacity*100);
    g('native-opacity-label').textContent=Math.round(v.opacity*100)+'%';
    g('native-size').classList.toggle('on',v.expanded);
    warning.style.display=v.clickThrough?'block':'none';
  }
  g('native-top').onclick=()=>ipcRenderer.invoke('native:get').then(v=>ipcRenderer.invoke('native:set-top',!v.alwaysOnTop)).then(sync);
  g('native-pass').onclick=()=>ipcRenderer.invoke('native:set-pass',true).then(sync);
  g('native-opacity-slider').oninput=event=>{const value=event.target.value;g('native-opacity-label').textContent=value+'%';ipcRenderer.invoke('native:set-opacity',Number(value)/100).then(sync);};
  g('native-size').onclick=()=>ipcRenderer.invoke('native:get').then(v=>ipcRenderer.invoke('native:set-expanded',!v.expanded)).then(sync);
  g('native-hide').onclick=()=>ipcRenderer.invoke('native:hide');
  g('native-close').onclick=()=>ipcRenderer.invoke('native:exit');
  ipcRenderer.on('overlay:window-state',(_e,settings)=>sync(settings));
  ipcRenderer.invoke('native:get').then(sync);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',installControls,{once:true});else installControls();
