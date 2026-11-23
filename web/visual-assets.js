(function(){'use strict';
const C=window.MD_ARTWORK_CATALOG||{giftArt:{},packArt:{},englishByGift:{}};
const DB='mirror-dungeon-personal-images-v1',STORE='pics',cache=new Map();
let db=null,readyResolve;
const ready=new Promise(res=>{readyResolve=res});
const safeName=n=>String(n||'').normalize('NFC').trim();
function key(type,name){return type+':'+safeName(name)}
function original(type,name){const f=(type==='gift'?C.giftArt:C.packArt)?.[safeName(name)];return f?'./artwork/'+f:'./overlay-icon-192.png'}
function src(type,name){return cache.get(key(type,name))?.src||original(type,name)}
function custom(type,name){return cache.has(key(type,name))}
function wikiLink(name){let en=C.englishByGift?.[safeName(name)]||safeName(name);return 'https://limbuscompany.wiki.gg/wiki/Special:Redirect/file/'+encodeURIComponent(en.replace(/ /g,'_')+'_Gift.png')}
function normal(s){return String(s).normalize('NFC').toLowerCase().replace(/\.(jpg|jpeg|png|webp)$/,'').replace(/[\s\-_()（）\[\]]/g,'')}
const match=new Map();
for(const type of ['gift','pack'])for(const name of Object.keys(type==='gift'?C.giftArt:C.packArt)){
  match.set(normal(name),{type,name});match.set(normal(type+name),{type,name});
  if(type==='gift'&&C.englishByGift?.[name]){match.set(normal(C.englishByGift[name]),{type,name});match.set(normal('gift'+C.englishByGift[name]),{type,name});}
}
function lookup(filename){return match.get(normal(filename))||null}
function init(){
 try{
  if(!('indexedDB' in window))throw Error('IndexedDB unavailable');
  const r=indexedDB.open(DB,1);
  r.onupgradeneeded=()=>{if(!r.result.objectStoreNames.contains(STORE))r.result.createObjectStore(STORE,{keyPath:'key'})};
  r.onerror=()=>readyResolve();
  r.onsuccess=()=>{
   db=r.result;
   try{const tx=db.transaction(STORE,'readonly');const req=tx.objectStore(STORE).getAll();req.onsuccess=()=>{for(const x of req.result)if(x&&x.key&&x.src)cache.set(x.key,x);readyResolve()};req.onerror=()=>readyResolve();}catch{readyResolve();}
  };
 }catch{readyResolve()}
}
function readFile(f){return new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(r.result);r.onerror=()=>reject(Error('图片读取失败'));r.readAsDataURL(f)})}
async function save(type,name,file){
 if(!['image/png','image/jpeg','image/webp'].includes(file?.type))throw Error('仅支持 PNG、JPEG、WebP');
 if(file.size>8*1024*1024)throw Error('单张图片不能超过 8MB');
 await ready;
 const val={key:key(type,name),src:await readFile(file),type,name};
 if(!db)throw Error('本机图片存储不可用');
 await new Promise((resolve,reject)=>{const tx=db.transaction(STORE,'readwrite');tx.objectStore(STORE).put(val);tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error||Error('保存失败'))});
 cache.set(val.key,val);return name;
}
async function batch(files){
 let success=0,skipped=0,failed=0;
 for(const f of Array.from(files||[]).slice(0,500)){
  const x=lookup(f.name);
  if(!x){skipped++;continue}
  try{await save(x.type,x.name,f);success++}catch{failed++}
 }
 return {success,skipped,failed};
}
async function removeAll(){await ready;if(db)await new Promise((resolve,reject)=>{const tx=db.transaction(STORE,'readwrite');tx.objectStore(STORE).clear();tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error)});cache.clear()}
function count(){return cache.size}
init();window.MD_VISUALS={ready,src,original,custom,wikiLink,save,batch,removeAll,lookup,count};
})();
