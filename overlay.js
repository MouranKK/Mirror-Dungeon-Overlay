(()=>{'use strict';
// Standalone mini companion. Intentionally NOT synchronized to the legacy guide's floor key:
// previously a failed gift render left the old floor body visible after the header advanced.
const $=id=>document.getElementById(id);
const KEY='md-gamebar-overlay-r12';
const STAGES=['packs','map','gifts','shop','trial','track','tips'];
const names={packs:'卡包',map:'地图',gifts:'饰品',shop:'商店',trial:'制约',track:'本局',tips:'攻略补充'};
const STORE=window.MD_OVERLAY_STORE||{};
const VIDEO=window.VIDEO_GUIDES||{};
const AUDIT=window.GIFT_AUDIT||{};
const KNOW=window.MD_OVERLAY_KNOWLEDGE||{gifts:[],packs:{},sources:{}};
const IMAGE_CATALOG=window.MD_IMAGE_CATALOG||{gifts:{},packs:{}};
const BOSSES=window.MD_OVERLAY_BOSSES||{hidden:[],extreme:[],intro:{}};
const SMART=window.MD_SMART_SHOP||[];
const SMART_MAP=new Map(SMART.map(g=>[g.name,g]));
const R6=window.MD_R6;
const R7=window.MD_R7;
const R7DATA=window.MD_R7_DATA;
const R8=window.MD_R8;
const R9=window.MD_R9_GUIDES||{sources:{},cards:[]};
const EXTERNAL_RAW=window.MD_EXTERNAL_GIFTS||[];
let CATALOG_LOADED=null;let CATALOG_STATUS='';let CATALOG_BUSY=false;
const EXT_KEYWORDS={'burn':'烧伤','bleed':'流血','tremor':'震颤','rupture':'破裂','sinking':'沉沦','poise':'呼吸法','charge':'充能','slash':'斩击','blunt':'打击','pierce':'突刺','—':'通用'};
const EXT_ZH={
 'Darkflame Smoking Pipe':'黑焰烟斗','CQC Manual':'近身格斗术教材',
 'Shadow Bamboo Hat':'影织斗笠','Blood-red Mane':'血红鬃毛',
 'Searing Brass':'灼热的铜管','Jolly Plushie':'快乐的毛绒玩偶',
 'Shadow Monster':'影子怪物','Special Contract':'特别合约',
 'Barbed Lasso':'荆棘套索','Crushed Memory':'粉碎的记忆',
 'Mid-range K Corp. Ampule':'量产型K公司安瓿',
 'The Unchosen':'未被选中之人',
 "Kkomi\'s Mini-Gift":"可米的小小礼物",
 'Carefully-selected Medicinal Herbs':'精心分类的药材'
};
// R18：资料库（零协会汉化 + wiki.gg）提供中文名和效果，查不到时才用上面的手写表
const KB_LOOKUP=window.MD_KB_LOOKUP||(()=>null);
const zhOf=en=>KB_LOOKUP(en)?.cn||EXT_ZH[en]||AUDIT.zh?.[en]||'';
const NO_EFFECT='已整理名称、稀有度、关键词与获取来源；详细游戏效果仍需逐条核实，请以游戏内说明为准。';
let EXTERNAL_GIFTS=EXTERNAL_RAW.map(g=>({
  ...g,zh:zhOf(g.english),category:EXT_KEYWORDS[g.keyword]||'通用', grade:'未评级',
  tierVerified:g.tier!=='0'&&g.tier!=='—', external:true, kbEffect:Boolean(KB_LOOKUP(g.english)?.effect),
  description:KB_LOOKUP(g.english)?.effect||NO_EFFECT,
  source:'Limcogito：'+(g.obtain==='None'?'未列出专属卡包':g.obtain)
}));
let ALL_GIFTS=[...(KNOW.gifts||[]),...EXTERNAL_GIFTS];
const imageKey=url=>{
 // SHA-256 image IDs come from the bridge via verified catalog. Prefer browser remote icons unless cached key exists.
 return ''; // replaced by the sync image map below when cached files have been created
};
function catalogMerge(data){
 if(!Array.isArray(data?.items)||data.items.length<450)return false;
 const previous=new Map(EXTERNAL_RAW.map(x=>[x.english.toLowerCase(),x]));
 EXTERNAL_GIFTS=data.items.map(g=>{
  const old=previous.get(g.english.toLowerCase())||{};
  const keyword=({Burn:'burn',Bleed:'bleed',Tremor:'tremor',Rupture:'rupture',Sinking:'sinking',Poise:'poise',Charge:'charge',Slash:'slash',Pierce:'pierce',Blunt:'blunt'})[g.keyword]||g.keyword?.toLowerCase()||'—';
  const kb=KB_LOOKUP(g.english);
  return {...old,english:g.english,name:g.english,zh:zhOf(g.english)||old.zh||'',description:kb?.effect||old.description||NO_EFFECT,kbEffect:Boolean(kb?.effect),tier:g.tier||old.tier,cost:(Number(g.cost)||old.cost||null),keyword,category:EXT_KEYWORDS[keyword]||'通用',obtain:g.obtain||old.obtain||'',source:'https://limcogito.com/md-gifts',imageUrl:g.imageUrl||'',photoId:g.photoId||'',external:true,tierVerified:g.tier!=='0',grade:'未评级'};
 });
 ALL_GIFTS=[...(KNOW.gifts||[]),...EXTERNAL_GIFTS];CATALOG_LOADED=data;
 return true;
}
async function syncCatalogUI(kind){
 if(!window.MD_CATALOG||CATALOG_BUSY)return;
 CATALOG_BUSY=true;
 CATALOG_STATUS=kind==='cache'?'正在缓存图片…':'正在核对完整图鉴…';
 if(currentRef?.kind==='rank')renderReference();
 try{
  if(kind==='cache'){
   const result=await window.MD_CATALOG.cache();
   CATALOG_STATUS=`图片缓存：新保存 ${result.newlyCached}，已存在 ${result.already}，失败 ${result.failed} / ${result.total}`;
  }else{
   const data=await window.MD_CATALOG.sync();
   if(!catalogMerge(data))throw Error('同步结果不足 450 件，未覆盖原有数据');
   CATALOG_STATUS=`已核对 ${data.actual} 件，更新时间：${data.syncedAt.slice(0,10)}`;
  }
 }catch(err){CATALOG_STATUS='无法完成：'+String(err?.message||err)+'。现有图鉴保持可用';}
 finally{CATALOG_BUSY=false;if(currentRef?.kind==='rank')renderReference();}
}
window.addEventListener('DOMContentLoaded',()=>{
 if(!window.MD_CATALOG)return;
 window.MD_CATALOG.load().then(data=>{
  if(catalogMerge(data)){CATALOG_STATUS=`已加载 ${data.actual} 件已保存图鉴（${data.syncedAt.slice(0,10)}）`;if(currentRef?.kind==='rank')renderReference();}
 }).catch(()=>{});
});
const META=Object.fromEntries(ALL_GIFTS.map(x=>[x.name,x]));
const PACKAGE_INFO=KNOW.packs||{};
const escapeHTML=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const LINEUPS=window.MD_BURN_LINEUPS;
// R19：三支队伍。pinkyVideo = 小指良（蜘蛛巢之刃 良秀）伪单通
const TEAM_IDS=['burnVideo','wedgeVideo','pinkyVideo',...Object.keys(window.MD_SOLO_TEAMS||{})];
const TEAM_SHORT={burnVideo:'烧震',wedgeVideo:'楔子呼震',pinkyVideo:'小指良单通',...Object.fromEntries(Object.entries(window.MD_SOLO_TEAMS||{}).map(([k,v])=>[k,v.short]))};
const isPinky=()=>state.team==='pinkyVideo';
// R24：五个单通队伍（solo-teams.js）。SOLO() 返回当前队伍的资料，不是这五队时为 null
const SOLO=()=>(window.MD_SOLO_TEAMS||{})[state.team]||null;
const teamScore=g=>state.team==='burnVideo'?g.burn:state.team==='pinkyVideo'?(g.pinky??g.burn):SOLO()?({S:95,A:80}[(window.MD_TEAM_PICKS?.[state.team]?.S||[]).includes(g.name)?'S':(window.MD_TEAM_PICKS?.[state.team]?.A||[]).includes(g.name)?'A':'']||g.burn||50):g.wedge;
const BURN_SKILLS=window.MD_BURN_SKILLS;
let state={burnLineup:'dawn',burnLead:'',burnObservedCandle:false,burnOpening:'normal',burnLetter:false,team:'burnVideo',floor:0,stage:'packs',expanded:true,full:false,opacity:94,packChoice:{},ownedGifts:{burnVideo:[],wedgeVideo:[],pinkyVideo:[]},completedPacks:{burnVideo:[],wedgeVideo:[],pinkyVideo:[]}};
let filterCategory='全部',filterSearch='',filterOrigin='全部';
let shopSearch='';let shopCategory='all';
try{let saved=JSON.parse(localStorage.getItem(KEY)||'{}');if(window.MD_MIGRATE_SAVED)saved=window.MD_MIGRATE_SAVED(saved);state={...state,...saved};}catch{}
if(!TEAM_IDS.includes(state.team))state.team='burnVideo';
if(!Number.isInteger(state.floor)||state.floor<0||state.floor>15)state.floor=0;
if(!STAGES.includes(state.stage))state.stage='packs';
if(!state.packChoice||typeof state.packChoice!=='object')state.packChoice={};
for(const k of TEAM_IDS){if(!Array.isArray(state.ownedGifts?.[k])){state.ownedGifts=state.ownedGifts||{};state.ownedGifts[k]=[];}if(!Array.isArray(state.completedPacks?.[k])){state.completedPacks=state.completedPacks||{};state.completedPacks[k]=[];}}
if(!state.shopOffers||typeof state.shopOffers!=='object')state.shopOffers={};
for(const t of TEAM_IDS){
 if(!state.shopOffers[t]||typeof state.shopOffers[t]!=='object'||Array.isArray(state.shopOffers[t]))state.shopOffers[t]={};
}
if(!state.packOffers||typeof state.packOffers!=='object')state.packOffers={};
for(const t of TEAM_IDS)if(!state.packOffers[t]||typeof state.packOffers[t]!=='object'||Array.isArray(state.packOffers[t]))state.packOffers[t]={};
if(!state.shopPrices||typeof state.shopPrices!=='object')state.shopPrices={};
if(!state.shopWallet||typeof state.shopWallet!=='object')state.shopWallet={};
if(!state.shopReserve||typeof state.shopReserve!=='object')state.shopReserve={};
if(!['safe','gifts'].includes(state.packPriority))state.packPriority='safe';
if(!state.shopFlags||typeof state.shopFlags!=='object')state.shopFlags={};
state.shopFlags={fast:false,wide:false,crit:false,cross:false,poise:false,...state.shopFlags};
function offers(){const a=state.shopOffers[state.team];return Array.isArray(a[state.floor])?a[state.floor]:(a[state.floor]=[])}
function setOffers(v){state.shopOffers[state.team][state.floor]=v}
function packOffers(){const a=state.packOffers[state.team];return Array.isArray(a[state.floor])?a[state.floor]:(a[state.floor]=[])}
function setPackOffers(v){state.packOffers[state.team][state.floor]=v}
function numOrNull(v){if(v==null||String(v).trim()==='')return null;const x=Number(v);return Number.isFinite(x)&&x>=0?x:null}
function priceKey(n){return state.team+':'+state.floor+':'+n}
function walletKey(){return state.team+':'+state.floor}
function wallet(){return numOrNull(state.shopWallet[walletKey()])}
function reserve(){return numOrNull(state.shopReserve[walletKey()])||0}
function priceOf(n){return numOrNull(state.shopPrices[priceKey(n)])}

if(!state.r7Flags||typeof state.r7Flags!=='object')state.r7Flags={};
state.r7Flags={hp:false,sp:false,ego:false,shop:false,stagger:false,burst:false,clash:false,...state.r7Flags};
if(!state.r7History||typeof state.r7History!=='object')state.r7History={};
for(const t of TEAM_IDS)if(!state.r7History[t]||typeof state.r7History[t]!=='object')state.r7History[t]={};
if(!state.r9Pinned||typeof state.r9Pinned!=='object')state.r9Pinned={};
if(!state.r9Expanded||typeof state.r9Expanded!=='object')state.r9Expanded={};
if(!state.r9Filter||!['relevant','team','shop','fusion','extreme','packs','achievement','star'].includes(state.r9Filter))state.r9Filter='relevant';
if(!state.r8BossChecks||typeof state.r8BossChecks!=='object')state.r8BossChecks={};
for(const t of TEAM_IDS)if(!state.r8BossChecks[t]||typeof state.r8BossChecks[t]!=='object')state.r8BossChecks[t]={};
if(!['safe','balanced','all'].includes(state.r7Goal))state.r7Goal=state.full?'all':'safe';
function r7Chosen(f){const obj=state.r7History[state.team];const k=String(f);if(!Array.isArray(obj[k]))obj[k]=[];return obj[k]}
function riskMode(){return state.r7Goal}
if(!['balanced','clash','survival','damage','economy','material'].includes(state.shopFocus))state.shopFocus='balanced';

if(!Object.hasOwn(LINEUPS,state.burnLineup))state.burnLineup='dawn';
function lineup(){return LINEUPS[state.burnLineup];}
function burnLead(){return lineup().leads.includes(state.burnLead)?state.burnLead:lineup().leads[0];}
function needsCandle(){return lineup().candle&&!state.burnObservedCandle&&!(state.ownedGifts?.burnVideo||[]).includes('翼形蜡烛');}
// 本局手动打勾的结果，仅改变本地显示和推荐，不自动读取游戏内存。
const CORE_GOALS={
 burnVideo:['探戈鸡酱料','奉纳的雪茄','翼形蜡烛','怀表：Type E','怀表：Type Y','山茶花枝','破碎的眼镜','未寄出的信','红领带','贵宾卡','血红鬃毛','未孵化的火种','灰色大衣'],
 wedgeVideo:['探戈鸡酱料','白色领巾','黑色三角帽','精心分类的药材','折断的枪尖','拍手啪啪！','影织斗笠','怀表：Type E','怀表：Type Y','贵宾卡','未孵化的火种','福袋'],
 pinkyVideo:['赤红纠缠的蜘蛛巢','火热多汁琵琶腿','探戈鸡酱料','灰色星座的加护','枷锁','影织斗笠','骑士的自尊','紧急授予型搜查官徽章','量产型K公司安瓿','燃烧的命运','为了指挥官','贵宾卡']
};
const PACK_TARGETS={
 burnVideo:{'地狱鸡':['探戈鸡酱料'],'教材':['奉纳的雪茄'],'盛火时节':['翼形蜡烛'],'解放的暴怒':['翼形蜡烛'],'时间杀人时间复刻':['怀表：Type E','怀表：Type Y'],'落花':['山茶花枝'],'无改变者':['破碎的眼镜'],'由子弹画下的句点':['黑焰烟斗','齿轮碎片'],'3号线':['未孵化的火种'],'信仰与侵蚀':['血红鬃毛'],'血腥味':['拍手啪啪！']},
 wedgeVideo:{'地狱鸡':['探戈鸡酱料'],'自黎明后贯穿而来':['白色领巾','黑色三角帽','精心分类的药材'],'时间杀人时间复刻':['怀表：Type E','怀表：Type Y','紧急授予型搜查官徽章'],'深夜清扫复刻':['影织斗笠'],'3号线':['未孵化的火种'],'血腥味':['拍手啪啪！'],'由子弹画下的句点':['齿轮碎片']},
 pinkyVideo:{'信仰与侵蚀':['血红鬃毛'],'地狱鸡':['火热多汁琵琶腿','探戈鸡酱料'],'落花':['山茶花枝'],'由子弹画下的句点':['黑焰烟斗','齿轮碎片'],'憎恶与绝望':['灰色星座的加护'],'2号线':['枷锁'],'教材':['赤红纠缠的蜘蛛巢','红领带'],'无改变者':['破碎的眼镜'],'LCB定期体检复刻':['试验提取：红艳煞','点火手套','重燃火花塞','余火'],'深夜清扫复刻':['影织斗笠'],'自黎明后贯穿而来':['黑色三角帽','精心分类的药材','空洞的自尊'],'经验记忆':['白瓷砚滴','菖蒲剑','粉碎的木制刑具','无纹的刀镡'],'时间杀人时间复刻':['紧急授予型搜查官徽章'],'紫色编码':['量产型K公司安瓿'],'3号线':['未孵化的火种'],'身负重担者们':['燃烧的命运'],'拉·曼却领之主':['家人的怨恨'],'插翅虎':['为了指挥官'],'仲春夜之梦2':['可米的小小礼物']}
};
function got(n){return (state.ownedGifts[state.team]||[]).includes(canonical(n));}
function finished(n){return (state.completedPacks[state.team]||[]).includes(n);}
function toggleGift(n){n=canonical(n);const arr=state.ownedGifts[state.team];const i=arr.indexOf(n);if(i<0)arr.push(n);else arr.splice(i,1);if(currentRef)renderReference();update();}
function togglePack(n){if(state.team==='burnVideo'&&!state.packChoice['route-v2:'+packKey()])state.packChoice['route-v2:'+packKey()]=n;else if(state.team!=='burnVideo'&&!state.packChoice[packKey()])state.packChoice[packKey()]=n;const arr=state.completedPacks[state.team];const i=arr.indexOf(n);if(i<0)arr.push(n);else arr.splice(i,1);update();}
function floorAllowed(n){return R6.canAppear(PACKAGE_INFO[n],state.floor)}
function candidateNames(){return [...new Set([...Object.keys(PACKAGE_INFO),...Object.keys(video().packs||{})])].sort((a,b)=>a.localeCompare(b,'zh'))}
function packTargets(n){let a=(PACK_TARGETS[state.team]||{})[n]||[];
 if(isPinky()&&n==='教材'&&(state.r12Prediction||[]).includes('赤红纠缠的蜘蛛巢'))return a.filter(x=>x!=='赤红纠缠的蜘蛛巢');
 if(state.team==='burnVideo'){
  if((n==='盛火时节'||n==='解放的暴怒')&&!lineup().candle)return [];
  if(n==='教材'&&!lineup().cigar)return [];
  if(n==='落花'&&!state.burnLetter)return [];
  if(n==='无改变者'&&!state.burnLetter)return [];
 }
 return a;
}
function packStatus(n){if(finished(n))return {code:'done',label:'✓ 已打过（可改选）'};
 const targets=packTargets(n);
 if(targets.length&&targets.every(got))return {code:'down',label:'核心目标已获得'};
 if(targets.length){const need=targets.filter(x=>!got(x));return {code:'need',label:'缺：'+need.join(' / ')};}
 return {code:'neutral',label:'候选 · 看难度／实际奖励'};
}
function packScore(n,index){
 if(floorAllowed(n)===false)return -9999;
 const t=packTargets(n),missing=t.filter(x=>!got(x)),p=PACKAGE_INFO[n]||{};
 const base=R6.judgePack({name:n,floor:state.floor,team:state.team,missing,finished:finished(n),already:!!t.length&&!missing.length,kind:p.audit?.kind||'',safe:state.packPriority==='safe',battle:p.audit?.battle||'',known:!!p.audit}).points;
 const danger=R8.judge(n,{floor:state.floor,flags:state.r7Flags,history:state.r7History[state.team],team:state.team,safe:state.packPriority==='safe'});
 return base-danger.penalty-index*.1;
}
function trackButtons(names){return `<div class="trackGrid">${names.map(n=>`<button type="button" class="trackBtn" data-owned-gift="${escapeHTML(n)}" aria-pressed="${got(n)}"><span class="glyph">${got(n)?'✓':'□'}</span><span>${escapeHTML(n)}</span></button>`).join('')}</div>`;}
function targetSummary(n){const t=packTargets(n);if(!t.length)return '<p class="minor">本包暂无确认的专属目标清单；按实际奖励决定。</p>';
 const remaining=t.filter(x=>!got(x));return `<p class="statusBar">${remaining.length?'本局仍缺：'+escapeHTML(remaining.join('、')):'已记录取得本包的主要目标；可考虑其他路线。'}</p>${trackButtons(t)}`;
}
function fusionProgress(){const want=state.team==='burnVideo'?['制式服装-六协会','镇魂','怀表：Type E','怀表：Type Y']:isPinky()?['本国剑谱','制式服装-六协会','山茶花、眼镜和送达的信']:SOLO()?[...SOLO().fusion]:['福袋','怀表：Type E','怀表：Type Y'];
 let blocks=[];
 for(const target of want){const recipes=getRecipes(target);if(!recipes.length)continue;const arr=recipes[0],missing=arr.filter(n=>!got(n));blocks.push(`<div class="panelCard"><b>${escapeHTML(target)}</b><p>${arr.map(n=>got(n)?'✓ '+escapeHTML(n):'□ '+escapeHTML(n)).join(' ＋ ')}</p><p class="${missing.length?'minor':'statusBar'}">${missing.length?'还缺：'+escapeHTML(missing.join('、')):'材料已记录齐全；请在游戏内核实后固定合成。'}</p>${trackButtons(arr)}</div>`);}
 return blocks.join('')||'<div class="panelCard">没有已核实材料表，建议打开固定合成核对。</div>';
}

const SHOP_TYPES={all:'全部',core:'本队核心',clash:'拼点',survival:'回复保命',damage:'伤害',economy:'经济',cross:'跨体系',material:'合成材料'};
const SHOP_FOCUS={balanced:'综合',clash:'缺拼点',survival:'缺续航',damage:'补输出',economy:'攒经费',material:'合成规划'};
function shopName(n){return SMART_MAP.get(n)?.name||n}
function fusionPurchaseHint(name){
 const targets=state.team==='burnVideo'?['镇魂','制式服装-六协会','怀表：Type E','怀表：Type Y']:isPinky()?['本国剑谱','制式服装-六协会','山茶花、眼镜和送达的信']:SOLO()?[...SOLO().fusion]:['福袋','怀表：Type E','怀表：Type Y','震颤耦合'];
 const notes=[];
 for(const result of targets){if(got(result))continue;
  for(const recipe of getRecipes(result)){
   if(recipe.includes(name)){
    const missing=recipe.filter(n=>!got(n));
    if(missing.length===1&&missing[0]===name)notes.push(result+'仅缺此材料');
    else notes.push(result+'尚缺 '+missing.length+' 种材料');
    break;
   }
  }
 }
 return notes.slice(0,2);
}
function shopScore(g){
 const burn=state.team==='burnVideo';let x=teamScore(g);
 const f=state.floor||1;const focus=state.shopFocus;
 if(g.clearOnly)return {score:-9999,status:'卡包通关奖励',note:g.why};
 if(got(g.name))return {score:-999,status:'已拥有',note:'本局已记录获得，不应重复购买。'};
 if(g.group===focus)x+=24;
 if(f<=5&&g.group==='economy')x+=18;
 if(f>=11&&g.group==='economy')x-=43;
 if(f>=11&&g.group==='survival')x+=14;
 if(f>=11&&g.group==='clash')x+=9;
 const warnings=[];
 if(g.trigger==='wide'&&!state.shopFlags.wide){x-=42;warnings.push('尚未确认有多攻击容量/忧郁技能触发');}
 if(g.trigger==='fast'&&!state.shopFlags.fast){x-=28;warnings.push('只有速度领先才能发挥主要拼点收益');}
 if(g.trigger==='crit'&&!state.shopFlags.crit){x-=29;warnings.push('当前未确认稳定暴击');}
 if(g.trigger==='poise'&&!state.shopFlags.poise){x-=26;warnings.push('未确认稳定呼吸法来源');}
 if(g.trigger==='burn'&&!burn){x-=45;warnings.push('当前不是烧伤主体系');}
 if(g.trigger==='dawn'&&(!burn||!lineup().candle)){x-=80;warnings.push('需三黎明上场');}
 if(g.trigger==='thumb'&&(!burn||!lineup().cigar)){x-=80;warnings.push('需三拇指上场');}
 if(g.trigger==='wedge'&&burn){x-=80;warnings.push('不是楔子主轴');}
 if(g.group==='cross'&&!state.shopFlags.cross&&['黑檀胸针','荆棘套索','破碎罗盘'].includes(g.name))warnings.push('属于状态启动件，须配合后续利用饰品');
 if(g.group==='material'&&focus!=='material')x-=15;
 const recipeHints=fusionPurchaseHint(g.name);
 if(recipeHints.length){warnings.push('合成进度：'+recipeHints.join('；'));if(recipeHints.some(x=>x.includes('仅缺此材料')))x+=16;}
 if(g.group==='material'&&!recipeHints.length&&!getRecipes(g.name).length)warnings.push('尚无与当前合成目标匹配的已核对配方');
 if(g.special)warnings.push('通常涉及指定卡包/合成，不能假定普通商店必定出售');
 const pc=R6.priceDecision(x,priceOf(g.name),wallet(),reserve());
 if(pc.flag==='当前经费不够')warnings.push('现有经费不足，不建议刷新购买');
 else if(pc.flag==='购买后低于预留经费')warnings.push('购买后低于预留经费，优先核对合成目标');
 else if(pc.flag==='需输入实际售价与经费')warnings.push('尚未比较售价与预算');
 return {score:pc.score,status:pc.score<=-400?'买不起':pc.score>=85?'高优先':pc.score>=60?'推荐':pc.score>=37?'按需':pc.score>=18?'低优先':'跳过',note:warnings.join('；'),balance:pc.balance};
}
function shopSorted(){return SMART.map(g=>({...g,decision:shopScore(g)})).sort((a,b)=>b.decision.score-a.decision.score)}
function shopQuickPick(){let q=shopSearch.trim().toLowerCase();return shopSorted().filter(g=>!g.clearOnly&&!offers().includes(g.name)&&((q&&[g.name,g.en,g.why].some(v=>String(v).toLowerCase().includes(q)))||(!q&&!g.special))).slice(0,12)}
function shopPickHtml(){const a=shopQuickPick();return a.length?a.map(g=>`<button type="button" class="shopPick" data-shop-add="${escapeHTML(g.name)}">＋ ${escapeHTML(g.name)} <span>${escapeHTML(g.decision.status)}</span></button>`).join(''):'<p class="minor">暂无匹配；可尝试英文名。这份是精选清单，不代表全部饰品。</p>'}
function shopFlagsHtml(){const opts=[['fast','有速度优势'],['wide','能触发大衣／大容量'],['crit','能够稳定暴击'],['poise','稳定呼吸法'],['cross','有跨体系启动条件']];return `<div class="shopFlags">${opts.map(([id,label])=>`<label><input type="checkbox" data-shop-flag="${id}" ${state.shopFlags[id]?'checked':''}>${label}</label>`).join('')}</div>`}
function shopFocusHtml(){return `<div class="shopTabs">${Object.entries(SHOP_FOCUS).map(([id,label])=>`<button type="button" data-shop-focus="${id}" class="${state.shopFocus===id?'chosen':''}">${label}</button>`).join('')}</div>`}
function shopOfferCards(){const picked=offers();if(!picked.length)return '<p class="minor">还没选商品。可在下方搜索，把游戏里实际出现的饰品加入对比。</p>';
 const arr=picked.map(n=>SMART_MAP.get(n)).filter(Boolean).map(g=>({...g,decision:shopScore(g)})).sort((a,b)=>b.decision.score-a.decision.score);
 return arr.map((g,i)=>`<div class="shopOffer"><div class="shopOfferHead"><span class="shopOrder">${i+1}</span>${icon(g.name)?`<span class="shopThumb">${giftImage(g.name)}</span>`:""}<b>${escapeHTML(g.name)}</b><span class="shopStatus">${g.decision.status}</span></div><small>${escapeHTML(SHOP_TYPES[g.group]||g.group)} · ${escapeHTML(g.en)}${g.clearOnly?' · 通关奖励（不可购买）':g.special?' · 特殊来源':''}</small><p>${escapeHTML(g.why)}</p>${g.decision.note?`<p class="shopWarn">${escapeHTML(g.decision.note)}</p>`:''}<div class="r6Price"><label>实际售价 <input type="number" min="0" step="1" data-shop-price="${escapeHTML(g.name)}" value="${escapeHTML(state.shopPrices[priceKey(g.name)]??'')}" placeholder="填价格"></label>${g.decision.balance!==null?`<span>购买后余 ${g.decision.balance}经费</span>`:'<span>录入价格后算预算</span>'}</div><div class="shopActions"><button type="button" data-shop-bought="${escapeHTML(g.name)}">${got(g.name)?'✓ 已获得（撤销）':'✓ 买了／拿到了'}</button><button type="button" data-item="${escapeHTML(g.name)}">详情</button><button type="button" data-shop-remove="${escapeHTML(g.name)}">移除候选</button></div></div>`).join('');
}
// R10: opinionated, compact glanceable list. No form, pricing table or giant gift encyclopedia.
const R10_PICK={
 general:['贵宾卡','金瓮','归途','贪婪之锤','特别合约','灰色大衣','锐利的针与线'],
 burn:['翼形蜡烛','奉纳的雪茄','探戈鸡酱料','枷锁','镇魂'],
 wedge:['白色领巾','黑色三角帽','探戈鸡酱料','枷锁','福袋'],
 pinky:['赤红纠缠的蜘蛛巢','探戈鸡酱料','影织斗笠','枷锁','紧急授予型搜查官徽章']
};
function r10Tag(g){
 if(got(g.name))return {kind:'owned',label:'✓ 已有'};
 if(g.clearOnly)return {kind:'notshop',label:'通关奖励'};
 if(g.special||g.group==='material'||g.name==='枷锁')return {kind:'special',label:'卡包／合成'};
 if(g.trigger==='wide'&&!state.shopFlags.wide)return {kind:'conditional',label:'需要触发'};
 if(g.trigger==='crit'&&!state.shopFlags.crit)return {kind:'conditional',label:'稳定暴击'};
 if(g.trigger==='poise'&&!state.shopFlags.poise&&state.team==='burnVideo')return {kind:'conditional',label:'需要呼吸'};
 if(g.trigger==='fast'&&!state.shopFlags.fast)return {kind:'conditional',label:'速度优势'};
 return {kind:'buy',label:'留意购买'};
}
function r10ShopCards(names,max){return names.filter(n=>SMART_MAP.has(n)).slice(0,max).map(n=>{
 const g=SMART_MAP.get(n),tag=r10Tag(g);const hint=tag.kind==='special'||tag.kind==='notshop'?'不是普通商店必售 · 按卡包／合成取得':tag.kind==='conditional'?'满足条件再考虑，不必强求':'实际刷出且价格合适时考虑';
 return `<div class="r10GiftRow"><span class="r10GiftIcon">${giftImage(n)}</span><div class="r10GiftInfo"><div class="r10GiftHead"><b>${escapeHTML(n)}</b><small class="r10Tag ${tag.kind}">${escapeHTML(tag.label)}</small></div><p>${escapeHTML(g.why)}</p><small class="r10GiftHint">${escapeHTML(hint)}</small></div><button type="button" class="r10Got" data-owned-gift="${escapeHTML(n)}" title="${got(n)?'取消已拥有':'记为已拿到'}" aria-pressed="${got(n)}">${got(n)?'✓':'○'}</button></div>`;
 }).join('');}
// R11 image-first reference: the user's three MD8 ranking charts, with original positions retained.
const R11_CATEGORIES={general:'通用体系（General）',keywordless:'无关键词（Keywordless）',optional:'条件适用（Optional）'};
const R11_RANKS={recommend:'优先争取',good:'有就不错',low:'低优先级'};
let r11Category='general',r11Rank='recommend',r11Tier='3';
function r11TierList(){return `<div class="r11Filters">${Object.entries(R11_CATEGORIES).map(([k,v])=>`<button type="button" data-r11-category="${k}" class="${r11Category===k?'chosen':''}">${escapeHTML(v)}</button>`).join('')}</div><div class="r11Filters">${Object.entries(R11_RANKS).map(([k,v])=>`<button type="button" data-r11-rank="${k}" class="${r11Rank===k?'chosen':''}">${escapeHTML(v)}</button>`).join('')}</div><div class="r11Filters r11Tiers">${[['1','I'],['2','II'],['3','III'],['4','IV'],['extra','EX']].map(([k,v])=>`<button type="button" data-r11-tier="${k}" class="${r11Tier===k?'chosen':''}">${v}</button>`).join('')}</div>`;}
function r11Chart(){const src=`./assets/tier-guide/${r11Category}-${r11Rank}-${r11Tier}.webp`;
 return `<div class="panelCard r11Panel"><b>★ 饰品优先级 · 图示速查</b><p>按你提供的 MD8 图表：<b>Recommend ＞ Good to have ＞ Low Priority</b>。按分类、稀有度快速定位图标。</p>${r11TierList()}<div class="r11Image"><img src="${src}" alt="${escapeHTML(R11_CATEGORIES[r11Category])} · ${escapeHTML(R11_RANKS[r11Rank])} · ${r11Tier}级饰品图标"></div><small class="minor">${escapeHTML(R11_CATEGORIES[r11Category])} · ${escapeHTML(R11_RANKS[r11Rank])} · ${r11Tier==='extra'?'EX':r11Tier+'级'}。原图按位置裁切，不重新猜测图标名称；不代表这些饰品一定会在普通商店出售。</small><p class="r11Attribution">制表：ActualAubrey（Steam，2026-10-19 更新） · <a class="sourceLink" href="https://steamcommunity.com/sharedfiles/filedetails/?id=3616067063" target="_blank" rel="noopener">原攻略与说明 ↗</a></p></div>`;
}
function r11Summary(){return `<div class="panelCard r11Summary"><b>★ 图示榜单 · 快速判断</b><p><strong>优先争取</strong> ＞ <strong>有就拿</strong> ＞ 低优先级；先判断是否可触发，再决定是否花钱。</p><div class="r11Tips"><p><b>高层保命：</b>枷锁（Bridle）；<b>通用成长：</b>缘分碎片（Piece of Relationship）。</p><p><b>有速度优势：</b>探戈鸡酱料；<b>有强群攻 E.G.O：</b>锐利的针与线。</p><p><b>有忧郁／多攻击容量技能：</b>灰色大衣可考虑；不满足触发条件就不要硬买。</p></div><button type="button" data-r11-open="1">查看三类饰品图示排行 ›</button><small class="minor">图表评的是饰品价值，不是普通商店货架。限定包奖励与合成品不能靠盲刷商店获取。</small></div>`;}
function r10QuickShop(){
 const early=state.floor<=5, late=state.floor>=11,burn=state.team==='burnVideo';
 const first=early?['贵宾卡','金瓮','归途','贪婪之锤']:late?['归途','特别合约','灰色大衣','锐利的针与线']:['贵宾卡','金瓮','归途','贪婪之锤'];
 const secondary=late?['锐利的针与线','特别合约','明镜止水']:['灰色大衣','锐利的针与线','特别合约'];
 const targets=burn?R10_PICK.burn:isPinky()?R10_PICK.pinky:SOLO()?(window.MD_TEAM_PICKS[state.team].S||[]).slice(0,5):R10_PICK.wedge;
 const conditional=burn?secondary:late?['锐利的针与线','灰色大衣','明镜止水']:secondary;
 return `<div class="panelCard r10ShopIntro"><div class="r10ShopTitle"><b>🛒 商店速看 · ${TEAM_SHORT[state.team]||''} · 第 ${state.floor||'开局'} 层</b></div><p>不用填价格和挑商品：优先看列表，游戏里刷到再决定。✓ 可记本局已有。<b>列表并不保证普通商店会出售。</b></p></div>
 ${r11Summary()}
 <div class="panelCard r10ShopGroup"><b>① 实用优先 · 见到再买</b><div>${r10ShopCards(first,3)}</div></div>
 <div class="panelCard r10ShopGroup"><b>② 满足条件再拿</b><div>${r10ShopCards(conditional,2)}</div></div>
 <div class="panelCard r10ShopGroup"><b>③ 本队核心 · 卡包／合成</b><p class="minor">这里是本队目标，不等于普通商店商品。</p><div>${r10ShopCards(targets,2)}</div></div>
 <div class="r10More"><button type="button" data-r10-advanced="1">查看高级商店对比（可选）</button><button type="button" data-open-shop-guide="1">查看更多推荐饰品</button></div>`;
}
function advancedShopWidget(){return `<div class="panelCard"><b>🛒 商店：只比较眼前出现的饰品</b><p>选出商店中实际看见的商品，再根据当前阵容、楼层及需求排序。手动勾选，不读取游戏画面。<b>不是固定 T0 排行榜。</b></p><div class="shopFocusTitle">你现在最缺什么？</div>${shopFocusHtml()}${shopFlagsHtml()}<div class="r6Wallet"><label>当前经费<input type="number" id="shopWallet" inputmode="numeric" min="0" placeholder="手动输入" value="${escapeHTML(state.shopWallet[walletKey()]??'')}"></label><label>预留经费<input type="number" id="shopReserve" inputmode="numeric" min="0" placeholder="0" value="${escapeHTML(state.shopReserve[walletKey()]??'')}"></label></div><div class="shopCompare"><div class="r6Row"><b>第 ${state.floor||'开局'} 层实际商店（${offers().length}）</b><button type="button" data-shop-clear="1">清空本层</button></div>${shopOfferCards()}</div><div class="shopSearch"><label>添加商店里实际出现的商品</label><input id="shopGiftSearch" type="search" value="${escapeHTML(shopSearch)}" placeholder="输入中文或英文名，例如 金瓮"><div id="shopSuggestions">${shopPickHtml()}</div></div><p class="minor">售价与经费均由你按游戏内实际数值填写；未填时只按实用性排序。切换楼层会自动切换本层候选，不再把上一层商品当成现货。</p><button type="button" data-open-shop-guide="1" class="chipButton">查看通用／跨体系实用清单 ›</button></div>`}
function shopWidget(){return r10QuickShop();}
function shopGuideList(){const all=shopSorted().filter(g=>(shopCategory==='all'||g.group===shopCategory||(shopCategory==='core'&&g.group==='core')));return all.map(g=>`<div class="shopGuideRow">${icon(g.name)?`<span class="shopThumb">${giftImage(g.name)}</span>`:""}<b>${escapeHTML(g.name)}</b><span class="shopStatus">${g.decision.status}</span><small>${escapeHTML(g.en)} · ${escapeHTML(SHOP_TYPES[g.group])}${g.clearOnly?' · 通关自动奖励（不可购买）':g.special?' · 限定/合成':''}</small><p>${escapeHTML(g.why)}</p>${g.decision.note?`<p class="shopWarn">${escapeHTML(g.decision.note)}</p>`:''}<div class="shopActions">${g.clearOnly?'<span class="minor">仅可打包获得</span>':`<button type="button" data-shop-add="${escapeHTML(g.name)}">＋ 加入商店对比</button>`}<button type="button" data-shop-bought="${escapeHTML(g.name)}">${got(g.name)?'✓ 已有':'记为已得'}</button><button type="button" data-item="${escapeHTML(g.name)}">详情</button></div></div>`).join('');}
function shopGuidePanel(){return `<div class="panelCard"><b>★ 全体系实用饰品 · 精选 ${SMART.length} 件</b><p>根据烧震／楔子呼震的触发条件、楼层及当前需求调整优先级。通用收益和跨体系配合也参与判断，只有能利用的效果才值得买。</p>${shopFocusHtml()}${shopFlagsHtml()}<div class="shopTabs">${Object.entries(SHOP_TYPES).map(([k,v])=>`<button type="button" data-shop-category="${k}" class="${shopCategory===k?'chosen':''}">${v}</button>`).join('')}</div><p class="minor">名单同时包含少数卡包奖励／合成目标，它们不属于普通商店购买对象。评分是规则性建议，游戏内效果优先。</p></div><div id="shopGuideRows">${shopGuideList()}</div><div class="panelCard"><b>推荐依据</b><p>参考攻略、通用饰品联动与游戏内触发说明；按队伍状态计算而非盲目使用固定 T0。</p><p><a class="sourceLink" href="https://limbus.eldritchtools.com/universal" target="_blank" rel="noopener">通用／跨体系参考 ↗</a></p><p><a class="sourceLink" href="https://steamcommunity.com/sharedfiles/filedetails/?id=3616067063" target="_blank" rel="noopener">MD8 实用礼物建议 ↗</a></p></div>`}
function shopRepaint(){if(currentRef?.kind==='shopGuide')renderReference();update()}
function runTracker(){const core=CORE_GOALS[state.team]||[];
 const done=core.filter(got).length;
 const selected=activePack();
 const hist=state.completedPacks[state.team]||[];
 return `<div class="panelCard"><div class="trackSummary"><b>本局进度 · ${done}/${core.length} 项核心目标</b><span class="minor">${escapeHTML(TEAM_SHORT[state.team]||'')} · 第${state.floor||0}层</span></div><p>自己勾选已经拿到的饰品；关闭软件后会保存在这台电脑上。游戏里不一定能获得全部目标。</p></div>
 <div class="panelCard"><b>本趟重要饰品</b>${trackButtons(core)}</div>
 <div class="panelCard"><b>当前卡包：${escapeHTML(selected||'尚未选择')}</b><p>${selected?escapeHTML(packStatus(selected).label):'先在「卡包」选择实际出现的卡包'}</p>${selected?`<button type="button" data-finish-pack="${escapeHTML(selected)}" class="chipButton ${finished(selected)?'done':''}">${finished(selected)?'✓ 已记为通关（再点撤销）':'✓ 本包打完了'}</button>`:''}<p class="minor">已完成卡包：${hist.length?escapeHTML(hist.join('、')):'暂无'}</p></div>
 <div class="panelCard"><b>常用固定合成缺口</b><p>仅依据你手动标记的材料；不代表实际已拥有。</p></div>${fusionProgress()}
 <div class="panelCard"><b>新的一趟</b><p>只清空本队已拿饰品和已打卡包，不删除攻略与另一队记录。</p><button type="button" data-reset-run="1" class="resetRun">清空本队本局记录…</button></div>`;
}

let refStack=[];let currentRef=null;
function persist(){try{localStorage.setItem(KEY,JSON.stringify(state));}catch{}}
const A2ZH={
 'Emergency Investigator Badge':'紧急授予型搜查官徽章',
 'Hot ‘n Juicy Drumstick':'火热多汁琵琶腿',
 'Pocket Watch - Type L':'怀表：Type L',
 'Pocket Watch - Type E':'怀表：Type E',
 'Pocket Watch - Type Y':'怀表：Type Y',
 'Pocket Watch - Type P':'怀表：Type P',
 'Haunted Shoes':'鬼附鞋','Frozen Cries':'冰封的哀嚎','Hoarfrost Footprint':'霜冻足迹',
 'Spicebush Branch':'山茶花枝','Ragged Umbrella':'破损的雨伞','Broken Glasses':'破碎的眼镜',
 'Unmailed Letter':'未寄出的信','Spicebush, Glasses, and Mailed Letter':'山茶花、眼镜和送达的信'
};
const ALIAS={
 '鸡腿肉':'火热多汁琵琶腿','火热多汁琵琶腿（俗称鸡腿肉）':'火热多汁琵琶腿',
 '震颤怀表':'怀表：Type L','时间杀人时间专属怀表':'怀表：Type L','怀表':'怀表：Type L',
 '紧急授予型搜查官徽章':'紧急授予型搜查官徽章','影织斗笠':'影织斗笠','迎击斗笠':'影织斗笠',
 '白领巾':'白色领巾','黑帽':'黑色三角帽','鸡酱':'探戈鸡酱料',
 '金瓮':'金瓮','贵宾卡':'贵宾卡'
};
const EXTRAS={
 '鬼附鞋':['Haunted Shoes','https://static.wixstatic.com/media/37d006_1f78acf9ee674bbcae2b3127985afa4f~mv2.png'],
 '冰封的哀嚎':['Frozen Cries','https://static.wixstatic.com/media/37d006_90d831b983104bc281d007b6ead01258~mv2.png'],
 '霜冻足迹':['Hoarfrost Footprint','https://static.wixstatic.com/media/37d006_c3308ac372694edd817a49b850bf7cac~mv2.png'],
 '归途':['Homeward','https://static.wixstatic.com/media/37d006_d54893f7faf14a7e8a639306a0e10402~mv2.png'],
 '灰色大衣':['Grey Coat','https://static.wixstatic.com/media/37d006_54c673cb4a404f46be44947ec98faec4~mv2.png'],
 '未孵化的火种':['Unhatched Embers','https://static.wixstatic.com/media/37d006_a0100585fa75448687d5b0da3c68ca2f~mv2.png'],
 '锐利的针与线':['Sharp Needle & Thread','https://static.wixstatic.com/media/37d006_ecc9594bac7f4ea2ad5a8950334610fe~mv2.png'],
 '山茶花枝':['Spicebush Branch','https://static.wixstatic.com/media/37d006_fa21befa4617449c96c366074dd962ec~mv2.png'],
 '破损的雨伞':['Ragged Umbrella','https://static.wixstatic.com/media/37d006_76a16399cd9f4fa08046bbf095b643f7~mv2.png'],
 '破碎的眼镜':['Broken Glasses','https://static.wixstatic.com/media/37d006_36f32d3ab35b418d97a545d4a0094d95~mv2.png'],
 '未寄出的信':['Unmailed Letter','https://static.wixstatic.com/media/37d006_f0d3de01d1844aa1af45452150848d9a~mv2.png'],
 '山茶花、眼镜和送达的信':['Spicebush, Glasses, and Mailed Letter','https://static.wixstatic.com/media/37d006_64892e9a92ac425ab7179fd441b12426~mv2.png']
};
const DESCR={
 '翼形蜡烛':['三黎明编队的重点饰品，强化黎明相关机制。','解放的暴怒'],
 '奉纳的雪茄':['拇指队阵营饰品，强调至少三名拇指实际上场。','教材'],
 '白色领巾':['楔子奥提斯连携启动所需的胜机支持。','自黎明后贯穿而来'],
 '黑色三角帽':['楔子呼震专属，配合震颤引爆与拍手啪啪。','自黎明后贯穿而来'],
 '怀表：Type L':['震颤队关键怀表，改善特定技能的威力与伤害。','时间杀人时间复刻／固定合成'],
 '怀表：Type P':['震颤关键词怀表，拼点及特殊触发效果。','时间杀人时间复刻／固定合成'],
 '震颤耦合':['震颤合成饰品，要求相应关键词人数才能完整发挥。','固定合成'],
 '探戈鸡酱料':['第2层地狱鸡优先争取的泛用高性价比饰品。','地狱鸡'],
 '火热多汁琵琶腿':['早期伤害补强，出自地狱鸡相关内容。','地狱鸡'],
 '贵宾卡':['购买E.G.O饰品时降低经费消耗，越早入手越有经济收益。','起始饰品观测／商店'],
 '归途':['进战时为出战单位回复生命，提高高层容错。','泛用商店／对应掉落'],
 '灰色大衣':['符合攻击重量／属性条件时提供回血及输出加成。','泛用收益'],
 '霜冻足迹':['沉沦辅助饰品，有利于降低敌方拼点压力；非烧震必备。','固定合成'],
 '齿轮碎片':['是可能获取的E.G.O饰品，不能把它当固定合成的成品。','由子弹画下的句点'],
 '镇魂':['烧伤高阶合成目标，凑齐材料后才建议投入。','固定合成'],
 '福袋':['呼吸法拼点强化，生效条件与出战关键词人数有关。','固定合成'],
 '山茶花枝':['花信两阶段合成的前置材料。','落花'],
 '破碎的眼镜':['特殊拼点效果及花信材料。','无改变者'],
 '未寄出的信':['山茶花后续组合的中间产物。','固定合成'],
 '紧急授予型搜查官徽章':['救命效果依赖指定出战顺位；请核实出战次序。','时间杀人时间复刻'],
 '拍手啪啪！':['与黑色三角帽的震颤联动可强化高层伤害。','血腥味'],
 '精心分类的药材':['楔子连携追击补强，效果依赖具体身份与技能。','自黎明后贯穿而来'],
 '银色的表壳':['怀表固定配方素材，先保留。','时间杀人时间复刻'],
 '褪色的表壳':['怀表固定配方素材，先保留。','时间杀人时间复刻'],
 '蚀刻的指针':['怀表固定配方素材，先保留。','时间杀人时间复刻'],
 '锈蚀的指针':['怀表固定配方素材，先保留。','时间杀人时间复刻']
};
const RANK={
 burnVideo:[['翼形蜡烛','核心'],['奉纳的雪茄','核心'],['怀表：Type E','核心'],['怀表：Type Y','核心'],['震颤耦合','合成'],['探戈鸡酱料','早期'],['贵宾卡','经济'],['归途','恢复'],['紧急授予型搜查官徽章','保命'],['灰色大衣','条件回复'],['火热多汁琵琶腿','早期'],['镇魂','烧伤'],['霜冻足迹','可选']],
 pinkyVideo:[['赤红纠缠的蜘蛛巢','核心'],['影织斗笠','核心'],['骑士的自尊','核心'],['量产型K公司安瓿','高层'],['燃烧的命运','高层'],['探戈鸡酱料','早期'],['火热多汁琵琶腿','早期'],['灰色星座的加护','生存'],['枷锁','生存'],['紧急授予型搜查官徽章','保命'],['贵宾卡','经济'],['为了指挥官','高层']],
 wedgeVideo:[['白色领巾','核心'],['黑色三角帽','核心'],['怀表：Type E','核心'],['怀表：Type Y','核心'],['拍手啪啪！','连携'],['福袋','合成'],['震颤耦合','合成'],['探戈鸡酱料','早期'],['归途','恢复'],['紧急授予型搜查官徽章','保命'],['贵宾卡','经济'],['精心分类的药材','配套'],['霜冻足迹','可选']]
};
const EXTRA_RECIPES={
 '怀表：Type E':[['银色的表壳','锈蚀的指针']],
 '怀表：Type Y':[['褪色的表壳','蚀刻的指针']],
 '霜冻足迹':[['鬼附鞋','冰封的哀嚎']],
 '未寄出的信':[['破损的雨伞','破碎的眼镜']],
 '山茶花、眼镜和送达的信':[['山茶花枝','未寄出的信']]
};
function canonical(n){const a=({'怀表：Type E':'怀表：Type E','怀表：Type Y':'怀表：Type Y','地狱蝶之梦':'地狱蝶之梦','破碎罗盘':'破碎罗盘'})[n]||ALIAS[n]||n;const local=(KNOW.gifts||[]).find(g=>g.english&&g.english.toLowerCase()===String(a).toLowerCase());return local?.name||({'科米的小小礼物':'可米的小小礼物'})[a]||a}
function english(n){n=canonical(n);if(META[n]?.english)return META[n].english;return Object.entries(A2ZH).find(([,v])=>v===n)?.[0]||Object.entries(AUDIT.zh||{}).find(([,v])=>v===n)?.[0]||EXTRAS[n]?.[0]||window.MD_KB_EN?.[n]||''}
function originIcon(n){n=canonical(n);const en=english(n);return META[n]?.image||EXTRAS[n]?.[1]||(AUDIT.img||{})[en]||META[n]?.wikiImage||IMAGE_CATALOG.gifts?.[n]?.remote||''}
function imageLocalFor(n){const m=META[canonical(n)];const zh=m?.external?m.zh:'';const path=IMAGE_CATALOG.gifts?.[zh]?.cache||'';return path.startsWith('./assets/gifts/')?path:''}
// R18：资料库里有 wiki.gg 核实过的图片地址，优先于旧的猜测地址
function kbImg(n){const en=english(n);return (en&&KB_LOOKUP(en)?.img)||''}
const packKeyNorm=s=>String(s||'').replace(/[\s·]/g,'');const KB_PACK_IMG=Object.fromEntries(Object.entries(window.MD_KB_PACKS||{}).map(([k,v])=>[packKeyNorm(k),v]));
function kbPackImg(n){return KB_PACK_IMG[packKeyNorm(n)]||''}
function wikiGiftImg(n){return window.MD_WIKI_IMG?.gifts?.[n]||''}
function icon(n){n=canonical(n);const c=IMAGE_CATALOG.gifts?.[n];return wikiGiftImg(n)||kbImg(n)||(c?.cache?.startsWith('./assets/')?c.cache:'')||imageLocalFor(n)||originIcon(n)||c?.remote||(english(n)?'https://limbuscompany.wiki.gg/wiki/Special:FilePath/'+encodeURIComponent(english(n).replaceAll(' ','_')+'_Gift.png'):'')}
function packOrigin(n){return (window.MD_WIKI_PACK_IMG?.(n))||kbPackImg(n)||video().packs?.[n]||IMAGE_CATALOG.packs?.[n]?.original||IMAGE_CATALOG.packs?.[n]?.remote||''}
function packIcon(n){return (window.MD_WIKI_PACK_IMG?.(n))||IMAGE_CATALOG.packs?.[n]?.cache||packOrigin(n)}
window.MD_IMAGE_RETRY=(el)=>{const backup=el.dataset.backup||'';if(!el.dataset.retried&&backup&&backup!==el.src){el.dataset.retried='1';el.src=backup;return}el.onerror=null;const span=document.createElement('span');span.className='r13Missing';span.textContent='缺图';span.title=(el.alt||'')+'：原图未缓存或网址不可访问';el.replaceWith(span)};
function link(n){return `<button type="button" class="textLink" data-item="${escapeHTML(canonical(n))}">${escapeHTML(n)}</button>`}
function info(n){return META[canonical(n)]||{};}
function smallMeta(n){const x=info(n);return `${x.category||'属性待核对'} · ${x.tierVerified?x.tier+'级':'未匹配'}`;}
function giftImage(n){const url=icon(n),fallback=kbImg(n)||originIcon(n);return url?`<img src="${escapeHTML(url)}" data-backup="${escapeHTML(fallback)}" alt="${escapeHTML(n)}游戏饰品图片" loading="lazy" onerror="window.MD_IMAGE_RETRY(this)">`:'<span class="r13Missing" title="未确认独立游戏饰品图片">缺图</span>'}
function getRecipes(n){n=canonical(n);const en=english(n);const found=[];for(const arr of (AUDIT.recipes?.[en]||[]))if(Array.isArray(arr))found.push(arr.map(z=>A2ZH[z]||AUDIT.zh?.[z]||z));return [...found,...(EXTRA_RECIPES[n]||[])];}
function source(){return STORE[state.team]?.[state.floor]||null}
function packKey(){
 return (state.team==='burnVideo'?[state.team,state.burnLineup,state.burnOpening,state.burnObservedCandle,state.burnLetter].join(':'):state.team)+':'+state.floor;
}
const CANDLE_PACKS=['解放的暴怒','盛火时节'];
const BURN_ROUTES=window.MD_BURN_ROUTES;
function burnPlan(){
 const flower=state.burnLetter&&state.burnOpening!=='branch'&&!(state.r12Prediction||[]).includes('山茶花枝');
 const first={shoes:'无法去爱',cries:'自动工厂'}[state.burnOpening]||'信仰与侵蚀';
 const early=[first,'地狱鸡',flower?'落花':'由子弹画下的句点',flower?'由子弹画下的句点':'憎恶与绝望'];
 const middle=[
   '2号线',
   ...(needsCandle()?['盛火时节']:[]),
   '教材','LCB定期体检复刻',
   ...(state.burnLineup==='thumb'?['琥珀色的黄昏']:[]),
   ...(state.burnLetter?['无改变者']:[]),
   ...(state.burnLineup==='fallback'?['自黎明后贯穿而来']:[]),
   '深夜清扫复刻','经验记忆','20区的奇迹复刻'
 ];
 return [...early,...middle.slice(0,5),'时间杀人时间复刻',
   '插翅虎','身负重担者们','仲春夜之梦2','血腥味','永劫的枷锁'];
}
function burnRecommendation(){
 const pack=burnPlan()[state.floor-1];
 const reasons={
   '信仰与侵蚀':'拿血红鬃毛；若看到优质经济礼物，也可换经济包。',
   '2号线':'优先枷锁。',
   '盛火时节':'三黎明缺翼形蜡烛；也可换解放的暴怒。',
   '教材':'三拇指优先雪茄；不足三拇指时按通用收益和红领带选。',
   'LCB定期体检复刻':'拿四件烧伤礼物。',
   '琥珀色的黄昏':'亡命之徒 8 人档路线，先确认子弹技能条件。',
   '时间杀人时间复刻':'优先完成E型和Y型双表。'
 };
 return [pack,reasons[pack]||BURN_ROUTES[pack]?.goal||'按本包目标补强。'];
}
function burnRecommendationText(){
 const [pack,detail]=burnRecommendation();
 return pack?pack+' · '+detail:detail;
}
function packCandidates(){
 const featured=state.team==='burnVideo'?burnRecommendation()[0]:'';
 const packs=[...new Set([...(featured?[featured]:[]),...(source()?.packs||[])])];
 const allowed=packs.filter(name=>floorAllowed(name)!==false);
 // Never let the old fixed video floor order silently override the current opening's route.
 // Only demote a planned pack if all team-specific goals have already been recorded as obtained.
 const plannedComplete=featured&&packTargets(featured).length>0&&packTargets(featured).every(got);
 const ranked=allowed.map((name,index)=>({name,index})).sort((a,b)=>packScore(b.name,b.index)-packScore(a.name,a.index)).map(x=>x.name);
 if(featured&&allowed.includes(featured)&&!plannedComplete&&!finished(featured))return [featured,...ranked.filter(n=>n!==featured)];
 return ranked;
}
function activePack(){
 if(state.team==='burnVideo'){const chosen=state.packChoice['route-v2:'+packKey()];return chosen&&floorAllowed(chosen)!==false?chosen:packCandidates()[0]||'';}
 return state.packChoice[packKey()]||(state.team==='burnVideo'&&state.burnLineup==='dawn'?state.packChoice['burnVideo:'+state.floor]:'')||(state.team==='burnVideo'?'':packCandidates()[0]||'');
}
function packGuide(){
 const pack=activePack(), guide=PACKAGE_INFO[pack];
 if(state.team!=='burnVideo')return guide||null;
 if(pack==='琥珀色的黄昏')return {goal:lineup().amber,shop:'先检查阵容能触发的子弹相关礼物，再分配经费。'};
 if(CANDLE_PACKS.includes(pack)&&!needsCandle())return {
   ...guide, goal:lineup().candle?'已观测翼形蜡烛，可省这个包位。':'两黎明阵容可省这个包位。',
   priorityNode:'已进入时按地图选择安全路线。', event:'按当前可见奖励选择。',
   combat:'选择能稳打的战斗。', shop:'优先当前可用的回复、烧伤或震颤饰品。', gifts:[],warning:''
 };
 if(pack==='教材'&&!lineup().cigar)return {
   ...guide, goal:'优先检查红领带、灼热之锤；雪茄仅有通用收益。',
   priorityNode:'优先适用的本包专属奖励。',shop:'按当前阵容的触发条件购买。',gifts:guide.gifts.filter(x=>x!=='奉纳的雪茄'),
   warning:'当前补位阵容达不到三拇指条件。'
 };
 if(pack==='憎恶与绝望')return {
   ...guide,goal:'为攻略里的「翅膀」考虑此包。已观测到翅膀时可考虑换包。',
   shop:'从当前可见礼物中选能生效的增益。',gifts:[]
 };
 const route=BURN_ROUTES[pack];
 if(!route)return guide||null;
 return {...guide,...route, ...(pack==='插翅虎'?{goal:route.goal+' 当前一号位：'+burnLead()+'。'}:{})};
}
function packComparison(){
 const picked=packOffers(),pool=candidateNames().filter(n=>floorAllowed(n)!==false);
 const ordered=picked.map(n=>({name:n,score:packScore(n,0)})).sort((a,b)=>b.score-a.score);
 return `<div class="panelCard r6Hero"><b>◈ 本层实际出现的卡包 · 最多 5 个</b><p>先录入游戏里实际刷出的候选，才会给出本层优先顺序；没有录入时，下方仅是攻略路线参考。</p><div class="r6Choices">${picked.map(n=>`<button type="button" data-remove-pack-offer="${escapeHTML(n)}">${escapeHTML(n)} ×</button>`).join('')||'<small>未记录实际候选</small>'}</div><label class="r6Field">添加候选卡包 <select id="packCandidateAdd"><option value="">选择实际看见的卡包…</option>${pool.filter(n=>!picked.includes(n)).map(n=>`<option value="${escapeHTML(n)}">${escapeHTML(n)}${floorAllowed(n)===null?'（楼层待核）':''}</option>`).join('')}</select></label><div class="r6Toggle"><button data-pack-priority="safe" class="${state.packPriority==='safe'?'chosen':''}">稳妥通关</button><button data-pack-priority="gifts" class="${state.packPriority==='gifts'?'chosen':''}">补齐目标饰品</button></div>${state.floor>=11?`<p class="r8Context">高层比较参考你在「制约」页记录的风险选项；风险提示来自可核实的敌人机制，尚未核实的包将标记「机制待核」，绝不视作低风险。</p>`:''}${ordered.length?`<div class="r6Compare">${ordered.map((c,i)=>{const a=PACKAGE_INFO[c.name]?.audit||{},t=packTargets(c.name),missing=t.filter(g=>!got(g)),r=R6.judgePack({name:c.name,floor:state.floor,team:state.team,missing,finished:finished(c.name),already:!!t.length&&!missing.length,kind:a.kind,safe:state.packPriority==='safe',battle:a.battle,known:!!a.kind});return `<div class="r6Result"><b>${i+1}. ${escapeHTML(c.name)}</b><span>${Math.round(c.score)} 参考分</span><p>${escapeHTML(r.reason)}</p>${state.floor>=11?(()=>{const x=R8.judge(c.name,{floor:state.floor,flags:state.r7Flags,history:state.r7History[state.team],team:state.team,safe:state.packPriority==='safe'});return `<p class="r8Danger ${x.known?'':'r8Unknown'}"><b>战斗风险：${escapeHTML(x.label)}</b> · ${escapeHTML(x.reason)}</p>`})():''}<button type="button" data-pack="${escapeHTML(c.name)}">选择此包 ›</button></div>`}).join('')}</div><p class="minor">参考分是透明的取舍规则，并非游戏强度或 BOSS 官方危险评分；敌方技能与制约仍需现场确认。</p>`:''}</div>`;
}
function verifiedPackPanel(){
 const a=PACKAGE_INFO[activePack()]?.audit;if(!a)return '';
 const source=escapeHTML(a.source||'');
 const label=a.kind==='通关必得'?'通关自动获得':a.kind==='无已确认固定礼物'?'未列出固定通关饰品':a.kind==='待核实'?'奖励未充分核实':'卡包限定池（并非全部保底）';
 return `<div class="panelCard"><b>✓ 卡包资料核对 · ${escapeHTML(label)}</b><p>${escapeHTML(a.floors)}${a.battle?' · '+escapeHTML(a.battle):''}</p><p>${escapeHTML(a.notes)}</p><details><summary>查看该包完整限定饰品／通关奖励（${a.pool?.length||0}）</summary><p>${escapeHTML((a.pool||[]).join('、')||'未确认具体固定饰品')}</p><p class="minor">英文名称用于避免未经确认的中文译名；限定池不代表每一件在本趟必得。</p></details><p><a class="sourceLink" href="${source}" target="_blank" rel="noopener">查看卡包数据与获取规则 ↗</a></p></div>`;
}
function activeGifts(){
 const guide=packGuide();
 return state.team==='burnVideo'?(guide?.gifts||[]):(guide?.audit?(guide.gifts||[]):guide?.gifts?.length?guide.gifts:source()?.gifts||[]);
}
function routeText(field,fallback){
 if(state.team==='burnVideo'&&!activePack())return field==='goal'?source()?.goal:'先选本层实际卡包';
 const guide=packGuide();
 if(guide?.[field])return guide[field];
 if(state.team!=='burnVideo')return fallback;
 return field==='shop'?'检查当前商店，先补能触发的体系礼物或回复。':'按游戏内当前卡包的节点和奖励选择。';
}
function selectPack(n){if(!n||floorAllowed(n)===false)return;state.packChoice[(state.team==='burnVideo'?'route-v2:':'')+packKey()]=n;state.stage='map';state.expanded=true;update();}
function video(){return VIDEO[state.team]||{packs:{},floors:[]}}
function setAlpha(x){state.opacity=Math.max(65,Math.min(100,Number(x)||94));document.documentElement.style.setProperty('--alpha',String(state.opacity/100));$('opacity').value=String(state.opacity);}
function summary(){
 const d=source(),v=video(),i=state.floor,stage=state.stage;
 if(i===0){
   if(stage==='shop')return {label:'开局 · 商店助手',cmd:'筛选值得买的通用与体系饰品',sub:'手动添加眼前商品；可以提前规划',image:icon('贵宾卡')};
   const burn=state.team==='burnVideo';
   if(burn)return {label:'开局 · 选择阵容',cmd:lineup().label,sub:'一号位 '+burnLead()+' · 展开查看配队与观测',image:icon(needsCandle()?'翼形蜡烛':'奉纳的雪茄')};
   return {label:'开局 · 直接照做',cmd:'三楔子＋黎明／呼震补位',sub:'起手呼吸／震颤；优先白色领巾',image:icon('白色领巾')};
 }
 if(!d)return {label:'数据缺失',cmd:'本层没有可靠资料',sub:'请切换回完整攻略查看',image:''};
 if(stage==='packs')return {label:`第 ${i} 层 · 选卡包`,cmd:activePack()?('当前：'+activePack()):'选择实际刷出的卡包',sub:packOffers().length?'已录入 '+packOffers().length+' 个实际候选 · 点击比较':'尚未录入实际候选；当前仅是预设路线',image:packIcon(activePack())||''};
 if(stage==='tips')return {label:`第 ${i} 层 · 实战攻略补充`,cmd:'已整理 '+R9.cards.length+' 条可执行要点',sub:'按队伍、楼层及需求筛选，点击查看依据',image:icon('枷锁')};
 if(stage==='track')return {label:`第 ${i} 层 · 本局记录`,cmd:`已记 ${CORE_GOALS[state.team].filter(got).length} 件重点饰品`,sub:'勾选自己实际获得的饰品；手动记录卡包是否打过',image:icon(CORE_GOALS[state.team].find(x=>!got(x))||CORE_GOALS[state.team][0])};
 if(stage==='map')return {label:`第 ${i} 层 · 走地图`,cmd:routeText('priorityNode',d.map||d.goal),sub:activePack()+' · '+routeText('goal',d.goal),image:packIcon(activePack())||''};
 if(stage==='gifts')return {label:`第 ${i} 层 · 找饰品`,cmd:`优先：${activeGifts()[0]||'按实际卡包查找'}`,sub:activePack()+' · '+(activeGifts()||[]).slice(1,3).join(' · '),image:icon(activeGifts()[0])};
 if(stage==='shop')return {label:`第 ${i} 层 · 商店`,cmd:routeText('shop',d.shop?.[0]||'先找核心饰品'),sub:activePack()+' · 需要时展开买卖与合成',image:icon(activeGifts()[0])};
 if(stage==='trial')return {label:`第 ${i} 层 · 制约`,cmd:i===15?'最终层：通关结算':i===10?'先选择 11–15 层制约目标':state.floor>=11?'已记录制约 '+R7.total(state.r7History?.[state.team]||{})+' 分':'层末试炼：谨慎选择',sub:state.floor>=11?'点击查看本层实际可选词条及风险':'优先避免直接提高敌方拼点强度',image:''};
 return {label:'指令',cmd:d.goal,sub:'',image:''};
}
function update(){
 const s=summary();
 $('team').value=state.team;$('floor').value=String(state.floor);
 $('prev').disabled=state.floor===0;$('next').disabled=state.floor===15;
 $('smallLabel').textContent=s.label;$('command').textContent=s.cmd;$('subline').textContent=s.sub;
 $('heroImg').onerror=()=>{const el=$('heroImg');const entry=[...Object.values(IMAGE_CATALOG.gifts||{}),...Object.values(IMAGE_CATALOG.packs||{})].find(x=>x.cache===s.image);const a=entry?.remote||(state.stage==='packs'||state.stage==='map'?packOrigin(activePack()):originIcon(activeGifts()?.[0]||'')); if(a&&el.src!==a&&!el.dataset.retried){el.dataset.retried='1';el.src=a}else{el.onerror=null;el.src='./overlay-icon-192.png'}}; $('heroImg').dataset.retried=''; $('heroImg').src=s.image||'./overlay-icon-192.png';$('heroImg').alt=s.image?`${s.cmd}图片`:'镜牢指挥条标志';
 document.querySelectorAll('[data-stage]').forEach(x=>x.classList.toggle('active',x.dataset.stage===state.stage));
 $('sheet').hidden=!state.expanded||!!currentRef;
 $('expand').textContent=state.expanded?'▴':'▾';
 $('expand').setAttribute('aria-expanded',String(state.expanded));
 if(state.expanded&&!currentRef)renderSheet();
 $('reference').hidden=!currentRef;
 setAlpha(state.opacity);persist();
 document.title=`镜牢指挥条（测试版 1.05） · ${state.floor?'第'+state.floor+'层':'开局'}`;
}
function packCard(n,idx){const src=packIcon(n),fallback=packOrigin(n),chosen=activePack()===n,st=packStatus(n);return `<button type="button" data-pack="${escapeHTML(n)}" class="visual packChoice${chosen?' chosen':''}${src?'':' noimg'}">${src?`<img src="${escapeHTML(src)}" data-backup="${escapeHTML(fallback)}" alt="${escapeHTML(n)}卡包封面" loading="lazy" onerror="window.MD_IMAGE_RETRY(this)">`:''}<b>${escapeHTML(n)}</b><em>${chosen?'✓ 当前计划':`候选 ${idx+1}`}</em><small class="packTag ${st.code}">${escapeHTML(st.label)}</small></button>`}
function giftCard(n){return `<button type="button" class="visual${icon(n)?'':' noimg'}" data-item="${escapeHTML(canonical(n))}">${giftImage(n)}<b>${escapeHTML(n)}${got(n)?' ✓':''}</b><em>${escapeHTML(smallMeta(n))}</em><small>查看图标/效果/配方</small></button>`}
function burnSetup(){
 const current=lineup();
 const choices=Object.entries(LINEUPS).map(([id,x])=>`<button type="button" data-lineup="${id}" class="${state.burnLineup===id?'chosen':''}" aria-pressed="${state.burnLineup===id}">${x.label}</button>`).join('');
 const leads=current.leads.map(name=>`<option${name===burnLead()?' selected':''}>${name}</option>`).join('');
 const route=burnPlan().map((pack,i)=>`<li><button type="button" data-route-floor="${i+1}" class="r10RouteLink" title="跳转到第 ${i+1} 层">${escapeHTML(pack)}${state.floor===i+1?' · 当前层':''}</button></li>`).join('');
 const skills=current.skills.map(name=>`<li><b>${name}</b> ${BURN_SKILLS[name][state.burnLetter?1:0]}</li>`).join('');
 return `<div class="panelCard"><b>选择出战阵容</b><div class="modeBtns">${choices}</div><p>${current.members}</p><label>一号位 <select id="burnLead">${leads}</select></label><p class="minor">六人编队可让一号位吃双槽。补位阵容的一号位按实际人格调整。</p></div>
 <div class="panelCard"><b>本趟饰品路线</b><p>${current.plan}</p><p>${current.amber}</p></div>
 <div class="panelCard"><b>起手和观测</b><p>15 牢前建议点满星光。烧伤或震颤都可起手。</p><p><label>开局观测 <select id="burnOpening">${[['normal','常规／经济'],['branch','已观测山茶花枝'],['shoes','鬼附鞋 · 计划做霜冻足迹'],['cries','冰封的哀嚎 · 计划做霜冻足迹']].map(([id,label])=>`<option value="${id}" ${state.burnOpening===id?'selected':''}>${label}</option>`).join('')}</select></label></p><p>优先考虑观测黑卡。也可以观测针线、花信材料或翅膀。霜冻足迹在无沉沦时优先级较低。</p>${current.candle?`<label><input id="burnObservedCandle" type="checkbox" ${state.burnObservedCandle?'checked':''}> 已观测翼形蜡烛</label>`:''}</div>
 <div class="panelCard r10Route"><b>第 1–15 层 · 当前开局对应路线</b><p class="r10RouteNotice">✓ 更改开局观测、编队、蜡烛和花信规划后自动更新整张表。此表是推荐目标，不代表必定刷新；已手选的本层卡包不被强制覆盖。</p><ol>${route}</ol></div>
 <div class="panelCard"><b>技能替换</b><p><label><input id="burnLetter" type="checkbox" ${state.burnLetter?'checked':''}> 规划合成花信</label></p><p>花信只覆盖出战前三位。以下花信方案只给计划受益的人格使用，其他人格按常规方案调整。</p><ul>${skills}</ul><p class="minor">数字依次为一、二、三技能保留张数。雷横默和拇指辛的决意判定待核对游戏技能说明。</p></div>`;
}
function burnFloorPlan(){
 const current=lineup();
 if(state.floor>=11)return `<div class="panelCard"><b>高层选包</b><p>${source().goal}</p><p>11–15 层按实际刷包选择。13–15 层可用软包收尾。</p></div>`;
 const goals=[needsCandle()?'缺蜡烛时考虑解放的暴怒或盛火时节':current.candle?'已观测蜡烛，可省包位':'两黎明可跳过蜡烛'];
 if(current.cigar)goals.push('教材留意奉纳的雪茄');
 if(state.burnLetter)goals.push('落花留意花枝，无改变者留意眼镜；花信只给出战前三位');
 return `<div class="panelCard"><b>${current.label} · 本趟目标</b><p>${goals.join('。')}。</p><p>${current.amber}</p><p class="minor">楼层候选供查阅，请按本趟实际刷出的卡包选择。</p></div>`;
}
function r8BossKey(name){return state.floor+'|'+name;}
function r8BossChecked(name){const k=r8BossKey(name);const a=state.r8BossChecks[state.team];if(!Array.isArray(a[k]))a[k]=[];return a[k]}
function bossWaveAssistant(name){
 const d=R7.getBoss(name), b=R8.boss(name);
 if(!d&&!b)return `<div class="panelCard r7Boss"><b>⚔ ${escapeHTML(name||'当前卡包')}：战斗资料待核</b><p>此包尚无足够可靠的敌人机制资料，不能据此认定为简单包。</p>${verifiedPackPanel()}</div>`;
 const waveHtml=d?`<p><strong>奖励：</strong>${escapeHTML(d.reward)} · ${escapeHTML(d.rewardKind)}</p><div class="r7Waves">${d.waves.map((w,i)=>`<div><b>${d.waves.length===1?'首领':`第 ${i+1} 波`}</b><span>${escapeHTML(w)}</span></div>`).join('')}</div>`:'';
 const risk=R8.judge(name,{floor:state.floor,flags:state.r7Flags,history:state.r7History[state.team],team:state.team,safe:state.packPriority==='safe'});
 const mechanics=b?.moments?.length?`<h4>危险技能与应对</h4>${b.moments.map(m=>`<div class="r8Mechanic"><b>${escapeHTML(m.wave)} · ${escapeHTML(m.name)}</b><p><strong>看到：</strong>${escapeHTML(m.see)}</p><p><strong>操作：</strong>${escapeHTML(m.do)}</p><small>${escapeHTML(m.basis)} · <a href="${escapeHTML(m.source)}" target="_blank" rel="noopener">查证技能 ↗</a></small></div>`).join('')}`:'<p>缺少可核实的技能级机制；请查看当前首领的技能说明。</p>';
 const checks=(b?.checklist||[]),done=r8BossChecked(name);
 const track=checks.length?`<h4>本波作战检查（手动记录）</h4><div class="r8BossChecks">${checks.map((x,i)=>`<label><input type="checkbox" data-r8-boss-check="${i}" data-r8-boss-name="${escapeHTML(name)}" ${done.includes(i)?'checked':''}> ${escapeHTML(x)}</label>`).join('')}</div><button type="button" data-r8-boss-clear="${escapeHTML(name)}">重置本包检查</button>`:'';
 return `<div class="panelCard r7Boss r8Boss"><b>⚔ ${escapeHTML(name)} · 战斗处理</b>${waveHtml}<p class="r8Danger ${risk.known?'':'r8Unknown'}">${escapeHTML(risk.label)} · ${escapeHTML(risk.reason)}</p>${mechanics}${track}<p class="r7Caveat">资料范围：${escapeHTML(b?.confidence||d?.confirmed||'资料不完整')}。这里只列有出处的机制，无法保证该镜牢变体完全一致；不提供虚构的固定回合指令。</p>${d?.source?`<a href="${escapeHTML(d.source)}" target="_blank" rel="noopener" class="sourceLink">卡包与奖励来源 ↗</a>`:''}</div>`;
}
function r7Board(){
 const f=state.floor;
 if(f<11){return `<div class="panelCard"><b>◈ 11–15 层制约助手</b><p>第 10 层通关后选择继续极限模式。进入第 11 层起，可逐层记录游戏实际选择的制约。</p><p>不要求为打满15层选择全部额外制约；挑战高分成就时再结合队伍状况决定。</p><a class="sourceLink" href="${escapeHTML(R7DATA.source)}" target="_blank" rel="noopener">核对 MD8 逐层词条 ↗</a></div>`}
 const flags=state.r7Flags,history=state.r7History[state.team],chosen=r7Chosen(f);
 const items=R7.byFloor(f).map(x=>({...x,r:R7.assess(x,flags,state.team)})).sort((a,b)=>a.r.value-b.r.value||a.points-b.points);
 const total=R7.total(history),fpoints=items.filter(x=>chosen.includes(x.id)).reduce((a,x)=>a+x.points,0);
 const ordered=items.filter(x=>!chosen.includes(x.id));
 const flagsMap=[['hp','缺少可靠回血'],['sp','依赖高理智／理智恢复'],['ego','依赖频繁使用 E.G.O'],['shop','还需要合成／强化／刷新商店'],['stagger','依赖震颤混乱窗口'],['burst','缺少持续输出'],['clash','当前拼点或速度吃紧']];
 return `<div class="panelCard r7Hero"><b>◈ 第 ${f} 层 · 进入本层时选择的制约</b><p>这里显示的是现行 MD8 词条数值。勾选代表你<b>已在游戏中实际选择</b>，不会自动选取；风险顺序是辅助判断，并非官方难度排名。</p><div class="r7Modes">${[['safe','保通关'],['balanced','兼顾分数'],['all','全制约']].map(([id,n])=>`<button type="button" data-r7-mode="${id}" class="${riskMode()===id?'chosen':''}">${n}</button>`).join('')}</div><p class="r7Score">本层已记录：<strong>${fpoints} 分</strong>　·　11–15 层累计已记录：<strong>${total} 分</strong></p>${riskMode()==='safe'?'<p>保通关：不必为了分数硬选额外制约。优先保证能通关。</p>':riskMode()==='all'?'<p>全制约：需要在游戏中逐个核对并选择；此页仅记录和提示叠加风险。</p>':'<p>兼顾分数：先比较相对可控的词条；不能只按点数忽略后续累计的负面效果。</p>'}<div class="r7Flags"><b>本局真实状态（手动确认）</b>${flagsMap.map(([id,label])=>`<label><input type="checkbox" data-r7-flag="${id}" ${flags[id]?'checked':''}> ${label}</label>`).join('')}</div><div class="r7Top"><b>本层可选制约 · 按风险提示排序</b><small>共 ${items.length} 条，含两项重复出现的通用制约</small></div>${items.map(x=>`<div class="r7Item ${chosen.includes(x.id)?'r7Selected':''}"><label><input type="checkbox" data-r7-choice="${x.id}" ${chosen.includes(x.id)?'checked':''}><span><b>${escapeHTML(x.name)}</b> <small>${escapeHTML(x.original)}</small></span></label><div class="r7Meta"><span>+${x.points} 分</span><em class="${x.r.value>=6?'r7High':x.r.value>=4?'r7Mid':'r7Low'}">${x.r.band}</em>${chosen.includes(x.id)?'<strong>已记录</strong>':''}</div><p>${escapeHTML(x.rule)}</p><p class="r7Tip">${escapeHTML(x.tip)}</p></div>`).join('')}<p class="r7Caveat">已选项是按楼层保存的；I/II 词条有覆盖规则，记分是已选点数总和，不代表多个版本会同时叠加。最终数值以游戏当层面板为准。</p><a class="sourceLink" href="${escapeHTML(R7DATA.source)}" target="_blank" rel="noopener">日文 MD8 制约详细表 ↗</a></div>`;
}

// R9 sources stay independent from the creator's fixed route text.
const R9_FILTERS=[['relevant','当前适用'],['team','配队连携'],['shop','商店通用'],['fusion','固定合成'],['extreme','高层通关'],['packs','卡包获取'],['achievement','成就'],['star','★ 收藏']];
function r9TeamOK(g){return g.team==='all'||(state.team==='burnVideo'?g.team==='burn':isPinky()?g.team==='pinky':SOLO()?false:g.team==='wedge');}
function r9FloorOK(g){return state.floor===0?g.floors[0]<=2:state.floor>=g.floors[0]&&state.floor<=g.floors[1];}
function r9Matches(g){return r9TeamOK(g)&&r9FloorOK(g);}
function r9Source(g){return R9.sources[g.source]||null;}
function r9Listed(){
 const list=R9.cards.filter(g=>{
   if(state.r9Filter==='star')return state.r9Pinned[g.id]===true;
   if(state.r9Filter==='relevant')return r9Matches(g);
   return g.kind===state.r9Filter;
 });
 return list.sort((a,b)=>(Number(!!state.r9Pinned[b.id])-Number(!!state.r9Pinned[a.id]))||(Number(r9Matches(b))-Number(r9Matches(a)))||a.title.localeCompare(b.title,'zh-CN'));
}
function r9Card(g,small=false){
 const on=state.r9Expanded[g.id]===true,src=r9Source(g),suit=r9Matches(g);
 return `<div class="r9Guide ${suit?'r9Relevant':'r9NotRelevant'}" data-r9-card="${escapeHTML(g.id)}"><div class="r9Head"><div><span class="r9Kind">${escapeHTML(({team:'配队/连携',shop:'商店',fusion:'合成',extreme:'高层',packs:'选包',achievement:'成就'})[g.kind]||g.kind)}</span><small>${escapeHTML(g.basis)}${suit?' · 适合当前设置':' · 非当前场景'}</small></div><button type="button" data-r9-pin="${escapeHTML(g.id)}" title="收藏攻略" aria-label="收藏攻略">${state.r9Pinned[g.id]?'★':'☆'}</button></div><b>${escapeHTML(g.title)}</b><p class="r9Action">${escapeHTML(g.action)}</p>${!small?`<p class="r9When">使用场景：${escapeHTML(g.when)}</p>`:''}<div class="r9Foot"><a class="sourceLink" href="${escapeHTML(src?.url||'https://limbuscompany.wiki.gg/wiki/Mirror_of_Sisyphe')}" target="_blank" rel="noopener">核对出处：${escapeHTML((src?.title||g.source).slice(0,48))} ↗</a>${small?'':`<button type="button" data-r9-expand="${escapeHTML(g.id)}">${on?'收起说明':'查看更多'}</button>`}</div>${on&&!small?`<div class="r9Expand"><b>注意边界：</b>${escapeHTML(g.limits)}<br><b>参考时间：</b>${escapeHTML(src?.date||'')}</div>`:''}</div>`;
}
function r9Board(){
 const filtered=r9Listed();
 return `<div class="panelCard r9Intro"><b>📖 实战攻略补充 · ${R9.cards.length} 条</b><p>新增作者实战、通用商店、固定合成、高层制约与成就路线。只给你需要做的动作，原有锈町Rusty路线不被覆盖。</p><p class="minor">「作者实战」不是官方机制；「本工具推论」也不会冒充原作者结论。资料不适合当前队伍／楼层时会标注。</p><div class="r9Filters">${R9_FILTERS.map(([k,n])=>`<button type="button" data-r9-filter="${k}" class="${state.r9Filter===k?'chosen':''}">${n}</button>`).join('')}</div><p class="minor">当前 ${TEAM_SHORT[state.team]||''} · ${state.floor||'开局'}层 · 显示 ${filtered.length} 条（完整收录 ${R9.cards.length} 条）</p></div>${filtered.length?filtered.map(x=>r9Card(x)).join(''):'<div class="panelCard">当前没有匹配条目。可以切换分类，或收藏常看的攻略。</div>'}<div class="panelCard"><b>原文索引</b><p>每条卡片都附有可打开的原始资料页面；本页不是整篇攻略的复制，也不替代游戏实际技能面板。</p>${Object.values(R9.sources).map(s=>`<p><a class="sourceLink" href="${escapeHTML(s.url)}" target="_blank" rel="noopener">${escapeHTML(s.title)} ↗</a></p>`).join('')}</div>`;
}
function r9Context(stage){
 const kind=stage==='shop'?'shop':stage==='trial'?'extreme':'packs';
 const matched=R9.cards.filter(g=>g.kind===kind&&r9Matches(g));
 if(!matched.length)return '';
 const card=matched.sort((a,b)=>Number(!!state.r9Pinned[b.id])-Number(!!state.r9Pinned[a.id]))[0];
 return `<div class="r9Compact"><b>📖 同类攻略提醒：</b> ${escapeHTML(card.title)}<p>${escapeHTML(card.action)}</p><button type="button" data-r9-jump="${kind}">阅读更多同类攻略 ›</button></div>`;
}
function renderSheet(){
 const d=source(),floor=state.floor,stage=state.stage;
 const burn=state.team==='burnVideo';
 $('sheetTitle').textContent=stage==='tips'?'实战攻略补充':floor===0?'开局准备':`${floor} 层 · ${names[stage]}`;
 let html='';
 if(stage==='tips'){html=r9Board();}
 else if(stage==='track'){html=runTracker();}
 else if(floor===0&&stage==='shop'){html=shopWidget();}
 else if(floor===0&&burn){
   html=burnSetup();
 }else if(floor===0){
   const team=burn?'黎明格里高尔、浮士德、辛克莱＋拇指罗佳、希斯克利夫、默尔索':'楔子奥提斯、唐吉诃德、辛克莱＋两黎明及呼吸／震颤补位';
   html=`<div class="panelCard"><b>① 编队</b><p>${escapeHTML(team)}</p></div><div class="panelCard"><b>② 起始饰品</b><p>${burn?'优先震颤起手（也可选烧伤）；重点关注贵宾卡、翼形蜡烛。':'优先呼吸法起手（缺震颤则选震颤），找白色领巾与黑色三角帽。'}</p><div class="visualList">${(burn?['贵宾卡','翼形蜡烛']:['贵宾卡','四叶草']).map(giftCard).join('')}</div></div><div class="panelCard"><b>③ 进入镜牢</b><p>进入困难模式，按楼层顺序查看攻略。星光加护清单已从此小窗移除。</p></div>`;
 }else if(!d)html='<div class="panelCard">当前楼层数据缺失，避免显示上一层错误攻略。</div>';
 else if(burn&&!activePack()&&stage!=='packs'&&stage!=='trial')html='<div class="panelCard"><b>先在「卡包」选择本层实际进入的包</b></div>';
 else if(stage==='packs')html=`${packComparison()}${burn?`<div class="panelCard"><b>${lineup().label} · 原稿预设路线</b><p>${escapeHTML(burnRecommendationText())}</p><p class="minor">下方按本局已拿饰品、已打卡包重新排序；最终以实际候选为准。</p></div>`:''}<div class="panelCard"><b>点击你在游戏中实际选中的卡包</b><div class="visualList">${packCandidates().map(packCard).join('')}</div><p>按已勾选的饰品和已打过的卡包调整顺序；只列可能候选，不代表游戏一定刷新。高层危险机制仍需现场确认，已核对的奖励与条件参与推荐。</p><p><button type="button" data-go-track="1" class="chipButton">✓ 去「本局」记录已拿饰品</button></p><p>其他卡包：<select id="packOther"><option value="">从其他卡包中挑选</option>${candidateNames().filter(n=>floorAllowed(n)!==false).map(x=>`<option value="${escapeHTML(x)}" ${x===activePack()?'selected':''}>${escapeHTML(x)}${floorAllowed(x)===null?'（楼层待核）':''}</option>`).join('')}</select></p></div><div class="panelCard"><b>当前：${escapeHTML(activePack()||'请选择')}</b><p>${escapeHTML(activePack()?routeText('goal',d.goal):d.goal)}</p>${activePack()?targetSummary(activePack()):''}</div>${verifiedPackPanel()}${floor>=11&&activePack()?bossWaveAssistant(activePack()):''}`;
 else if(stage==='map'){const pg=packGuide();html=`<div class="panelCard"><b>当前路线：${escapeHTML(activePack())}</b><p>${escapeHTML(pg?.layout||'具体节点按实际地图判断')}</p><p class="recommend">优先路线：${escapeHTML(routeText('priorityNode',d.map))}</p></div><div class="panelCard"><b>① 事件（?）怎么走</b><p>${escapeHTML(pg?.event||'事件目标和选项尚未核实，请以游戏实物为准。')}</p></div><div class="panelCard"><b>② 战斗走不走</b><p>${escapeHTML(pg?.combat||'有确定的目标战斗时再走，优先保证队伍健康。')}</p></div><div class="panelCard"><b>③ 为什么走这里</b><p>${escapeHTML(routeText('goal',d.goal))}</p></div><div class="panelCard"><b>不要误选</b><p>${escapeHTML(pg?.warning||d.avoid||'不保证随机饰品必出。')}</p></div>${pg?.reference?`<div class="panelCard"><a class="sourceLink" href="${escapeHTML(pg.reference)}" target="_blank" rel="noopener">Wiki：查看此卡包详细节点 ↗</a></div>`:''}${verifiedPackPanel()}${floor>=11?bossWaveAssistant(activePack()):''}${floor>=11?`<div class="panelCard"><b>高层首领注意事项</b><p>神秘？可能变成独立隐藏BOSS，并非普通探索事件。优先保通关。</p><button type="button" data-open="bosses">☠ 查看隐藏首领／困难卡包打法</button></div>`:''}`;}
 else if(stage==='gifts')html=`<div class="panelCard"><b>${escapeHTML(activePack())}：优先找这些饰品</b><div class="visualList">${activeGifts().map(giftCard).join('')||'<p>请查看当前卡包的实际奖励。</p>'}</div><p>点击卡片查看效果；拿到饰品后在下方打勾，下次选包时会记住。</p>${targetSummary(activePack())}</div>${verifiedPackPanel()}<div class="panelCard"><b>掉落怎么判断</b><p>${escapeHTML(packGuide()?.event||d.avoid||'可能来自事件／商店／层末奖励；并非指定节点必出。')}</p><p>${escapeHTML(packGuide()?.warning||'')}</p></div>`;
 else if(stage==='shop')html=shopWidget();
 else if(stage==='trial'){
   html=r7Board();
   if(floor>=11)html+=`<div class="panelCard"><b>隐藏首领：需自行决定是否进入</b><p>极限模式非商店、非关底节点有机会出现可选隐藏 BOSS。风险很高；不应把它当作必打关底战。</p><button type="button" data-open="bosses">☠ 查看已收录的隐藏 BOSS 应对</button></div>`;
   if(floor>=11&&activePack())html+=bossWaveAssistant(activePack());
 }

 if(floor>0&&['packs','trial'].includes(stage))html+=r9Context(stage);
 if(burn&&floor>0&&stage==='packs')html+=burnFloorPlan();
 $('sheetBody').innerHTML=html;
}
function linkify(s){const words=['翼形蜡烛','奉纳的雪茄','白色领巾','黑色三角帽','震颤耦合','霜冻足迹','红领带','镇魂','福袋','归途','灰色大衣','贵宾卡','探戈鸡酱料','银色的表壳','褪色的表壳','蚀刻的指针','锈蚀的指针','齿轮碎片','怀表：Type L','怀表：Type P','破碎的眼镜','山茶花枝','拍手啪啪！'];for(const n of words.sort((a,b)=>b.length-a.length))s=s.split(n).join(`@@${n}@@`);return s.replace(/@@(.+?)@@/g,(_,n)=>link(n));}
function reference(title,kind,item){refStack.push(currentRef);currentRef={title,kind,item};state.expanded=false;$('extras').hidden=true;renderReference();update();}
function backReference(){currentRef=refStack.pop()||null;if(!currentRef)state.expanded=true;renderReference();update();}
function rankResults(){
 const q=filterSearch.trim().toLowerCase();
 const arr=ALL_GIFTS.filter(x=>(filterCategory==='全部'||x.category===filterCategory)
   &&(filterOrigin==='全部'||(filterOrigin==='原攻略'&&!x.external)||(filterOrigin==='完整图鉴'&&x.external)
      ||(filterOrigin==='缺本地图'&&!icon(x.name)?.startsWith('./assets/gifts/')))
   &&(!q||[x.name,x.english,x.zh,x.category,x.keyword,x.source,x.obtain].some(v=>(v||'').toLowerCase().includes(q))))
   .sort((a,b)=>{if(a.external!==b.external)return a.external?1:-1;return ({S:0,A:1,B:2}[a.grade]??3)-({S:0,A:1,B:2}[b.grade]??3)||a.name.localeCompare(b.name)});
 return arr.map((x,i)=>`<button type="button" data-item="${escapeHTML(x.name)}" class="listRow">${x.external?(x.imageUrl&&/^https:\/\/img\.limcogito\.com\//.test(x.imageUrl)?`<img class="giftIcon" loading="lazy" src="${escapeHTML(x.photoId?'mirrorimg://gift/'+x.photoId:x.imageUrl)}" data-remote="${escapeHTML(x.imageUrl)}" onerror="if(this.dataset.remote&&this.src!==this.dataset.remote){this.src=this.dataset.remote}else{this.onerror=null;this.style.display='none'}" alt="">`:(imageLocalFor(x.name)?giftImage(x.name):'<span class="rankNoImg">无图</span>')):giftImage(x.name)}<span class="copy"><b>${escapeHTML(x.external&&x.zh?x.zh:x.name)} <span class="rank">${x.external?'资料条目':x.grade}</span></b>${x.external&&x.zh?`<small>${escapeHTML(x.english)}</small>`:''}<small>${escapeHTML(x.category)} · ${x.tierVerified?escapeHTML(x.tier)+'级':'待核实'} ${x.external?'· 数据库参考价格 '+(x.cost??'?'):''}</small><small>${escapeHTML(x.external?'获取：'+x.obtain:x.source)}</small></span><span class="arrow">›</span></button>`).join('')||'<p class="minor">没有匹配条目，请换个英文名称、中文名或筛选条件。</p>';
}
function renderReference(){if(!currentRef)return;const r=currentRef;$('refTitle').textContent=r.title;let html='';
 if(r.kind==='credits'){
   html=`<div class="panelCard creditDetail">
     <div class="creditsHeading"><span class="creditsSymbol" aria-hidden="true">✦</span><span><b>攻略来源与制作署名</b><small>镜牢指挥条 · 免费玩家辅助工具</small></span></div>
     <strong>原攻略作者</strong><p>本工具的镜牢楼层路线及主要打法，依据 B 站 UP 主 <b>锈町Rusty</b> 的视频攻略整理；部分补充信息参考游戏内描述与公开资料。</p>
     <p><a href="https://space.bilibili.com/163533494" target="_blank" rel="noopener noreferrer">↗ 查看 B 站：锈町Rusty</a></p>
     <p>UP 主粉丝交流群：<b>1104632860</b></p>
   </div>
   <div class="panelCard creditDetail">
     <strong>软件制作与维护</strong>
     <p>镜牢指挥条：<b>MouranKK</b>（AI 辅助开发）</p>
     <p>问题反馈 / 改进建议：</p>
     <p>在锈町Rusty 的 B 站视频评论区或 UP 主粉丝交流群里留言即可（请注明“镜牢指挥条”）。</p>
     <p class="creditMuted">欢迎反馈攻略错误、使用问题和功能建议。分享本工具时请保留原攻略来源及软件署名。</p>
   </div>
   <div class="panelCard creditDetail">
     <strong>使用说明</strong>
     <p>本工具免费提供，仅作镜牢攻略查阅参考，不隶属于《Limbus Company》游戏官方或视频作者本人。</p>
     <p class="creditMuted">本程序通过手动选择队伍、楼层显示提示；不读取游戏内存、不自动扫描画面。攻略可能随版本更新而变化，请以游戏实际内容为准。</p>
   </div>`;
 }
 if(r.kind==='rank'){
   const categories=['全部','通用','烧伤','震颤','呼吸法','流血','破裂','沉沦','充能','斩击','打击','突刺'];
   const origins=['全部','原攻略','完整图鉴','缺本地图'];
   html=`<div class="panelCard"><b>镜牢饰品图鉴：${CATALOG_LOADED?.actual||EXTERNAL_GIFTS.length} 件资料条目 · ${KNOW.gifts.length} 件攻略精选</b><p>${CATALOG_LOADED?'已保存核对后的名称、等级、关键词、获取来源与图片链接。':'当前为内置资料快照；点击下方按钮核对完整清单。'} 中文名称和完整效果仍需逐件与游戏文本校对，不以猜测内容代替。</p><p><button type="button" data-catalog-action="sync" ${CATALOG_BUSY?'disabled':''}>↻ 更新完整图鉴</button> <button type="button" data-catalog-action="cache" ${CATALOG_BUSY?'disabled':''}>⬇ 保存图片到本机</button></p><p class="minor">${escapeHTML(CATALOG_STATUS)}</p><div class="catChoices">${origins.map(c=>`<button type="button" data-origin="${c}" class="${filterOrigin===c?'chosen':''}">${c}</button>`).join('')}</div><div class="catChoices">${categories.map(c=>`<button type="button" data-cat="${c}" class="${filterCategory===c?'chosen':''}">${c}</button>`).join('')}</div><input type="search" id="giftSearch" value="${escapeHTML(filterSearch)}" placeholder="搜中文、英文、卡包名"><p class="minor">攻略精选的 S/A/B 是实战评价，不代表稀有度；完整图鉴条目不擅自评级。图片只会采用真实的已核对链接。<b>加载失败不会替换为错误图片。</b></p></div><div id="rankResults">${rankResults()}</div><div class="panelCard"><a class="sourceLink" href="https://limcogito.com/md-gifts" target="_blank" rel="noopener noreferrer">↗ 查看 466 件资料目录</a><p class="minor">资料核验：Limcogito、Limbus Company Wiki。不同版本可能增删饰品，游戏内描述优先。</p></div>`;
 }
 if(r.kind==='shopGuide'){html=shopGuidePanel();}
 if(r.kind==='shopAdvanced'){html=advancedShopWidget();}
 if(r.kind==='r11Chart'){html=r11Chart();}
 if(r.kind==='recipes'){
   const recipes={...EXTRA_RECIPES};for(const [en,rs] of Object.entries(AUDIT.recipes||{})){
    const n=A2ZH[en]||AUDIT.zh?.[en]||en;
    if(!recipes[n])recipes[n]=rs.map(x=>x.map(y=>A2ZH[y]||AUDIT.zh?.[y]||y));
   }
   html='<div class="panelCard"><p>下列是固定合成材料。点成品进入大图，再逐个查看材料。</p></div>'+Object.entries(recipes).map(([n,rs])=>`<button type="button" data-item="${escapeHTML(n)}" class="listRow">${giftImage(n)||'<span>⚗</span>'}<span class="copy"><b>${escapeHTML(n)}</b><small>${escapeHTML(rs[0]?.join(' + ')||'')}</small></span><span class="arrow">›</span></button>`).join('');
 }
 if(r.kind==='bosses'){
  const meta=BOSSES.intro||{};
  html=`<div class="panelCard"><b>${escapeHTML(meta.title||'隐藏BOSS')}</b><p class="warning">${escapeHTML(meta.important||'高层优先保通关')}</p><p>${escapeHTML(meta.spawn||'')}</p><p>${escapeHTML(meta.reward||'')}</p><p>${escapeHTML(meta.rule||'')}</p><p class="minor">${escapeHTML(meta.affinity||'')}</p></div>`;
  html+='<div class="panelCard"><b>四位隐藏首领（点开查看）</b></div>'+(BOSSES.hidden||[]).map(b=>`<button type="button" data-boss="${escapeHTML(b.id)}" class="listRow bossRow"><span class="rankNoImg">☠</span><span class="copy"><b>${escapeHTML(b.name)} · ${escapeHTML(b.rating)}</b><small>${escapeHTML(b.danger)}</small><small>${escapeHTML(b.gift)}</small></span><span class="arrow">›</span></button>`).join('');
  html+='<div class="panelCard"><b>高难主题包（11–15层）</b></div>'+(BOSSES.extreme||[]).map((b,i)=>`<button type="button" data-hardboss="${i}" class="listRow"><span class="rankNoImg">⚔</span><span class="copy"><b>${escapeHTML(b.name)}</b><small>${escapeHTML(b.risk)} · ${escapeHTML(b.why)}</small></span><span class="arrow">›</span></button>`).join('');
  html+=`<div class="panelCard"><p class="minor">${escapeHTML(BOSSES.disclaimer||'')}</p><a class="sourceLink" href="${escapeHTML(KNOW.sources?.bossWiki||'https://limbuscompany.wiki.gg/wiki/Mirror_Dungeon')}" target="_blank" rel="noopener">Wiki：隐藏BOSS系统总览 ↗</a></div>`;
 }
 if(r.kind==='boss'||r.kind==='hardboss'){
  const b=r.kind==='boss'? (BOSSES.hidden||[]).find(x=>x.id===r.item) :(BOSSES.extreme||[])[Number(r.item)];
  if(!b){html='<div class="panelCard">缺少对应首领资料</div>';}else{
   html=`<div class="panelCard"><b>${escapeHTML(b.name)} ${b.rating?'· '+escapeHTML(b.rating):''}</b><p>${escapeHTML(b.en||'')}</p>${b.gift?`<p>击败专属饰品：${escapeHTML(b.gift)}</p>`:''}<p class="warning">${escapeHTML(b.danger||b.why||'')}</p></div><div class="panelCard"><b>实战行动</b><ol>${(b.actions||b.tactics||[]).map(a=>`<li>${escapeHTML(a)}</li>`).join('')}</ol></div><div class="panelCard"><a class="sourceLink" href="${escapeHTML(b.source)}" target="_blank" rel="noopener">Wiki 敌人／卡包机制 ↗</a>${b.source2?`<br><a class="sourceLink" href="${escapeHTML(b.source2)}" target="_blank" rel="noopener">社区实战讨论 ↗</a>`:''}<p class="minor">不同制约和队伍可能改变打法，先看游戏内本回合技能。</p></div>`;
  }
 }
 if(r.kind==='gift'){
  const name=canonical(r.item),url=icon(name),desc=DESCR[name]||[],recs=getRecipes(name),md=info(name);
  const remote=Boolean(md.external);
  html=(((remote&&md.imageUrl&&/^https:\/\/img\.limcogito\.com\//.test(md.imageUrl))||url&&(!remote||imageLocalFor(name)))?`<img class="refImg" src="${escapeHTML(remote&&md.photoId?'mirrorimg://gift/'+md.photoId:remote&&md.imageUrl?md.imageUrl:url)}" data-backup="${escapeHTML(remote&&md.imageUrl?md.imageUrl:originIcon(name))}" alt="${escapeHTML(name)}饰品图片" onerror="window.MD_IMAGE_RETRY(this)">`:'')+
     `<div class="panelCard"><b>${escapeHTML(remote&&md.zh?md.zh:name)}</b>${remote&&md.zh?`<p>${escapeHTML(md.english)}</p>`:''}<p>类型：<b>${escapeHTML(md.category||(r21Kb(name)?(r21Kb(name).keyword||'无体系')+' · '+r21Kb(name).type:'属性待核对'))}</b> · Wiki等级：<b>${md.tierVerified?escapeHTML(md.tier)+'级':r21Kb(name)?.tier?escapeHTML(r21Kb(name).tier)+'级':'未匹配到可靠条目'}</b> · 本队评级：<b>${escapeHTML(({S:'推荐',A:'实用',B:'普通'})[teamGrade(name)]||'作者没有专门提到')}</b></p><p class="refText">${escapeHTML(md.description||desc[0]||r21Kb(name)?.effect?.split(' / ').join('；')||'当前效果以游戏内说明为准。')}</p><p class="refSub">获取：${escapeHTML(md.source||desc[1]||(r21Kb(name)?r21Src(name):'')||'按当前路线对应卡包或商店查找')}</p>${remote?`<p><b>资料库信息</b> · 参考价格：${md.cost??'未记录'}经费· 原文关键词：${escapeHTML(md.keyword)}${md.kbEffect?' · 效果来自零协会汉化 / wiki 资料库':' · 仅已核对基础元数据，未核对具体效果与图片'}</p>`:''}${md.condition?`<p>生效条件：${escapeHTML(md.condition)}</p>`:''}${md.gameKeyword?`<p>游戏内关键词：${escapeHTML(md.gameKeyword)}</p>`:''}${md.verificationNote?`<p class="warning">校验提醒：${escapeHTML(md.verificationNote)}</p>`:''}<a class="sourceLink" target="_blank" rel="noopener" href="${remote?'https://limcogito.com/md-gifts':'https://limbuscompany.wiki.gg/wiki/List_of_E.G.O_Gifts'}">${remote?'查看饰品资料 ↗':'对照 Wiki 礼物表 ↗'}</a></div>`;
  html+=r21ObtainCard(name);html+=`<div class="panelCard"><b>本局记录</b><p>仅勾选真实拿到的饰品，不自动读取游戏。</p>${trackButtons([name])}</div>`;
  if(recs.length)html+=recs.map(parts=>`<div class="panelCard"><b>固定合成公式</b><div class="visualList">${parts.map(giftCard).join('<span>＋</span>')}<span>→</span>${giftCard(name)}</div><p>${escapeHTML(parts.join(' ＋ '))} → ${escapeHTML(name)}</p><p class="minor">到商店 → 合成 → 放入这些材料。材料未齐时不要盲合。</p></div>`).join('');
  else html+='<div class="panelCard"><b>固定合成</b><p>没有已核对的专属固定配方；不要把随机合成当成获取保证。</p></div>';
  const partOf=[];
  for(const [target,rs] of Object.entries({...EXTRA_RECIPES,...Object.fromEntries(Object.entries(AUDIT.recipes||{}).map(([en,ps])=>[A2ZH[en]||AUDIT.zh?.[en]||en,ps.map(row=>row.map(z=>A2ZH[z]||AUDIT.zh?.[z]||z))]))}))if(rs.some(row=>row.includes(name)))partOf.push(target);
  if(partOf.length)html+=`<div class="panelCard"><b>可以作为以下配方的材料</b><p>${partOf.map(link).join('、')}</p></div>`;
 }
 $('refBody').innerHTML=html;
}
function jump(f){state.floor=Math.max(0,Math.min(15,f));/* Preserve user-selected expanded/collapsed state on floor navigation. */currentRef=null;refStack=[];$('extras').hidden=true;update();}
function changeTeam(t){if(!STORE[t])return;state.team=t;state.floor=0;/* Keep the user's expanded/collapsed preference. */currentRef=null;refStack=[];update();}
$('floor').innerHTML=Array.from({length:16},(_,i)=>`<option value="${i}">${i===0?'开局':i+' 层'}</option>`).join('');
$('prev').onclick=()=>jump(state.floor-1);$('next').onclick=()=>jump(state.floor+1);
$('floor').onchange=()=>jump(Number($('floor').value));$('team').onchange=()=>changeTeam($('team').value);
$('expand').onclick=()=>{state.expanded=!state.expanded;$('extras').hidden=true;update();};
$('summary').addEventListener('click',e=>{if(e.target.closest('button'))return;state.expanded=!state.expanded;update()});
$('closeSheet').onclick=()=>{state.expanded=false;update()};
document.querySelectorAll('[data-stage]').forEach(b=>b.onclick=()=>{state.stage=b.dataset.stage;state.expanded=true;currentRef=null;refStack=[];update()});
$('settings').onclick=()=>{$('extras').hidden=!$('extras').hidden;state.expanded=false;update()};
$('openRank').onclick=()=>{filterOrigin='原攻略';reference('★ 饰品优先表','rank');};
$('openR9Guides').onclick=()=>{state.stage='tips';state.expanded=true;$('extras').hidden=true;currentRef=null;refStack=[];update();};
$('openSmartShop').onclick=()=>{shopCategory='all';reference('🛒 全体系实用推荐','shopGuide');};
$('openLibrary').onclick=()=>{filterOrigin='全部';filterCategory='全部';filterSearch='';reference('▦ 扩充饰品图鉴','rank');};
$('openRecipes').onclick=()=>reference('⚗ 固定合成配方','recipes');
$('openBoss').onclick=()=>reference('☠ BOSS 与特殊？节点攻略','bosses');

$('openCredits').onclick=()=>reference('✦ 署名 / 来源 / 反馈','credits');
$('openCreditsFooter').onclick=()=>reference('✦ 署名 / 来源 / 反馈','credits');
$('opacity').oninput=e=>{setAlpha(e.target.value);persist()};
$('backRef').onclick=backReference;$('closeRef').onclick=()=>{currentRef=null;refStack=[];state.expanded=true;update()};
function delegated(e){
 const goto9=e.target.closest('[data-r9-jump]');if(goto9){state.stage='tips';state.r9Filter=goto9.dataset.r9Jump;state.expanded=true;update();return;}
 const filter9=e.target.closest('[data-r9-filter]');if(filter9){state.r9Filter=filter9.dataset.r9Filter;update();return;}
 const pin9=e.target.closest('[data-r9-pin]');if(pin9){const k=pin9.dataset.r9Pin;state.r9Pinned[k]=!state.r9Pinned[k];update();return;}
 const expand9=e.target.closest('[data-r9-expand]');if(expand9){const k=expand9.dataset.r9Expand;state.r9Expanded[k]=!state.r9Expanded[k];update();return;}
 const reset8=e.target.closest('[data-r8-boss-clear]');if(reset8){state.r8BossChecks[state.team][r8BossKey(reset8.dataset.r8BossClear)]=[];update();return;}
 const mode7=e.target.closest('[data-r7-mode]');if(mode7){state.r7Goal=mode7.dataset.r7Mode;state.full=state.r7Goal==='all';update();return;}
 const delPack=e.target.closest('[data-remove-pack-offer]');if(delPack){setPackOffers(packOffers().filter(x=>x!==delPack.dataset.removePackOffer));update();return;}
 const priority=e.target.closest('[data-pack-priority]');if(priority){state.packPriority=priority.dataset.packPriority;update();return;}
 const clearShop=e.target.closest('[data-shop-clear]');if(clearShop){setOffers([]);update();return;}
 const add=e.target.closest('[data-shop-add]');if(add){let a=offers();if(!SMART_MAP.get(add.dataset.shopAdd)?.clearOnly&&!a.includes(add.dataset.shopAdd)&&a.length<10)a.push(add.dataset.shopAdd);shopRepaint();return;}
 const remove=e.target.closest('[data-shop-remove]');if(remove){setOffers(offers().filter(x=>x!==remove.dataset.shopRemove));shopRepaint();return;}
 const bought=e.target.closest('[data-shop-bought]');if(bought){toggleGift(bought.dataset.shopBought);shopRepaint();return;}
 const focus=e.target.closest('[data-shop-focus]');if(focus){state.shopFocus=focus.dataset.shopFocus;shopRepaint();return;}
 const catSmart=e.target.closest('[data-shop-category]');if(catSmart){shopCategory=catSmart.dataset.shopCategory;renderReference();return;}
 const chartOpen=e.target.closest('[data-r11-open]');if(chartOpen){reference('★ 饰品图示排行榜','r11Chart');return;}
 const chartCat=e.target.closest('[data-r11-category]');if(chartCat){r11Category=chartCat.dataset.r11Category;renderReference();return;}
 const chartRank=e.target.closest('[data-r11-rank]');if(chartRank){r11Rank=chartRank.dataset.r11Rank;renderReference();return;}
 const chartTier=e.target.closest('[data-r11-tier]');if(chartTier){r11Tier=chartTier.dataset.r11Tier;renderReference();return;}
 const adv=e.target.closest('[data-r10-advanced]');if(adv){reference('高级商店对比（可选）','shopAdvanced');return;}
 const shopOpen=e.target.closest('[data-open-shop-guide]');if(shopOpen){shopCategory='all';reference('🛒 全体系实用推荐','shopGuide');return;}
 const act=e.target.closest('[data-catalog-action]');if(act){syncCatalogUI(act.dataset.catalogAction);return;}const own=e.target.closest('[data-owned-gift]');if(own){toggleGift(own.dataset.ownedGift);return;}const finish=e.target.closest('[data-finish-pack]');if(finish){togglePack(finish.dataset.finishPack);return;}const goTrack=e.target.closest('[data-go-track]');if(goTrack){state.stage='track';update();return;}const reset=e.target.closest('[data-reset-run]');if(reset){if(confirm('清空当前队伍本局的饰品和卡包记录？')){state.ownedGifts[state.team]=[];state.completedPacks[state.team]=[];state.shopOffers[state.team]={};state.packOffers[state.team]={};state.r7History[state.team]={};state.r8BossChecks[state.team]={};update();}return;}const floor=e.target.closest('[data-route-floor]');if(floor){state.stage='packs';jump(Number(floor.dataset.routeFloor));state.expanded=true;update();return;}const choice=e.target.closest('[data-lineup]');if(choice){state.burnLineup=choice.dataset.lineup;update();return;}const boss=e.target.closest('[data-boss]');if(boss){reference('☠ 隐藏首领','boss',boss.dataset.boss);return;}const hard=e.target.closest('[data-hardboss]');if(hard){reference('⚔ 高难主题包','hardboss',hard.dataset.hardboss);return;}const pk=e.target.closest('[data-pack]');if(pk){selectPack(pk.dataset.pack);return;}const cat=e.target.closest('[data-cat]');if(cat){filterCategory=cat.dataset.cat;renderReference();return;}const org=e.target.closest('[data-origin]');if(org){filterOrigin=org.dataset.origin;renderReference();return;}const el=e.target.closest('[data-item]');if(el){reference(canonical(el.dataset.item),'gift',el.dataset.item);return;}const open=e.target.closest('[data-open]');if(open?.dataset.open==='recipes'){reference('⚗ 固定合成配方','recipes');return;}if(open?.dataset.open==='bosses'){reference('☠ BOSS 与特殊？节点攻略','bosses');return;}const mode=e.target.closest('[data-mode]');if(mode){state.full=mode.dataset.mode==='all';update();}}
$('sheetBody').addEventListener('click',delegated);$('refBody').addEventListener('click',delegated);
$('sheetBody').addEventListener('input',e=>{if(e.target.id==='shopGiftSearch'){shopSearch=e.target.value;const list=$('shopSuggestions');if(list)list.innerHTML=shopPickHtml();}});
$('sheetBody').addEventListener('change',e=>{
 if(e.target.matches('[data-r8-boss-check]')){const name=e.target.dataset.r8BossName,idx=Number(e.target.dataset.r8BossCheck),a=r8BossChecked(name),i=a.indexOf(idx);if(e.target.checked&&i<0)a.push(idx);if(!e.target.checked&&i>=0)a.splice(i,1);update();return;}
 if(e.target.matches('[data-r7-flag]')){state.r7Flags[e.target.dataset.r7Flag]=e.target.checked;update();return;}
 if(e.target.matches('[data-r7-choice]')){const a=r7Chosen(state.floor),k=e.target.dataset.r7Choice,i=a.indexOf(k);if(e.target.checked&&i<0)a.push(k);if(!e.target.checked&&i>=0)a.splice(i,1);update();return;}
 if(e.target.id==='packCandidateAdd'){
  const n=e.target.value;if(n&&floorAllowed(n)!==false&&!packOffers().includes(n)&&packOffers().length<5){packOffers().push(n);}update();return;
 }
 if(e.target.id==='shopWallet'){state.shopWallet[walletKey()]=e.target.value;update();return;}
 if(e.target.id==='shopReserve'){state.shopReserve[walletKey()]=e.target.value;update();return;}
 if(e.target.matches('[data-shop-price]')){state.shopPrices[priceKey(e.target.dataset.shopPrice)]=e.target.value;update();return;}
 if(e.target.matches('[data-shop-flag]')){state.shopFlags[e.target.dataset.shopFlag]=e.target.checked;shopRepaint();return;}const {id,value,checked}=e.target;
 if(id==='packOther'&&value)selectPack(value);
 if(id==='burnOpening'){state.burnOpening=value;if(value==='branch')state.burnLetter=true;update();}
 if(id==='burnLead'){state.burnLead=value;update();}
 if(id==='burnObservedCandle'){state.burnObservedCandle=checked;update();}
 if(id==='burnLetter'){state.burnLetter=checked;update();}});
$('refBody').addEventListener('change',e=>{if(e.target.matches('[data-shop-flag]')){state.shopFlags[e.target.dataset.shopFlag]=e.target.checked;shopRepaint();}});
$('refBody').addEventListener('input',e=>{if(e.target?.id==='giftSearch'){filterSearch=e.target.value;const el=$('rankResults');if(el)el.innerHTML=rankResults();}});
window.addEventListener('keydown',e=>{if(e.key==='Escape'){if(currentRef)backReference();else if(state.expanded){state.expanded=false;update()}}if(e.altKey&&e.key==='ArrowRight'){e.preventDefault();jump(state.floor+1)}if(e.altKey&&e.key==='ArrowLeft'){e.preventDefault();jump(state.floor-1)}});
// R12: two-page workflow. R11 reference data remains available in context.
const r12GiftOptions=['可用之处已尽，郁积的憎恶','赤红纠缠的蜘蛛巢','紧急授予型搜查官徽章','精神屏蔽力场','红领带','贵宾卡','锐利的针与线','翼形蜡烛','鬼附鞋','冰封的哀嚎','山茶花枝','破碎的眼镜','灰色星座的加护','未寄出的信','探戈鸡酱料','翻新的商品','红色流苏'];
const R37_OLD_OPTS={burnVideo:['贵宾卡','锐利的针与线','翼形蜡烛','可用之处已尽，郁积的憎恶','鬼附鞋','冰封的哀嚎','山茶花枝','破碎的眼镜','未寄出的信','红色流苏'],wedgeVideo:['贵宾卡','锐利的针与线','可用之处已尽，郁积的憎恶','鬼附鞋','冰封的哀嚎','山茶花枝','破碎的眼镜','未寄出的信'],pinkyVideo:['赤红纠缠的蜘蛛巢','贵宾卡','紧急授予型搜查官徽章','灰色星座的加护','山茶花枝','破碎的眼镜','红领带','红色流苏','血红鬃毛','冰封的哀嚎','金瓮','翻新的商品','预约优惠券']}; /* R37：老三队只列作者视频里说到的观测 */
function r12OptsFor(team){return window.MD_SOLO_TEAMS?.[team]?window.MD_SOLO_TEAMS[team].predict.options:R37_OLD_OPTS[team]||r12GiftOptions}
const r12Defaults=()=>SOLO()?[...SOLO().predict.defaults]:isPinky()?['赤红纠缠的蜘蛛巢','贵宾卡','紧急授予型搜查官徽章']:state.team==='burnVideo'&&lineup().candle?['贵宾卡','翼形蜡烛','锐利的针与线']:['贵宾卡','锐利的针与线','可用之处已尽，郁积的憎恶']; /* R36t：默认＝作者推荐的最佳三件观测 */
if(!Array.isArray(state.r12Prediction))state.r12Prediction=r12Defaults();
state.r12Initial=state.r12Initial||'震颤';state.r12Grace=state.r12Grace||'max';const r12Stars=[['起始之星',10,'起始经费与刷新'],['层积星云',10,'经费运营'],['星际旅行',20,'卡包刷新与等级'],['倾落的流星雨',20,'起始经费与饰品'],['双星商店',30,'商店与战斗经费'],['卫星商店',30,'关键词刷新'],['星云的宠爱',40,'等级成长'],['星芒的引导',40,'速度与拼点'],['偶然的彗星',50,'合成与饰品'],['全面的可能性',60,'初始饰品与残影']];if(!Array.isArray(state.r12StarLevels))state.r12StarLevels=r12Stars.map(()=>3);state.r12Wedge=state.r12Wedge||'seven';state.r12Goal=state.r12Goal||'stable';
function r12Sync(){const a=state.r12Prediction;state.burnObservedCandle=a.includes('翼形蜡烛');state.burnOpening=a.includes('鬼附鞋')&&!a.includes('冰封的哀嚎')?'shoes':a.includes('冰封的哀嚎')&&!a.includes('鬼附鞋')?'cries':a.includes('山茶花枝')?'branch':'normal';state.burnLetter=a.includes('山茶花枝')||a.includes('破碎的眼镜')||a.includes('未寄出的信');state.packPriority=state.r12Goal==='stable'?'safe':'gifts';}
r12Sync();
const oldGot=got;got=n=>state.r12Prediction.includes(canonical(n))||oldGot(n);
const oldKey=packKey;packKey=()=>[oldKey(),state.r12Wedge,state.r12Initial,state.r12Grace,...state.r12StarLevels,state.r12Goal,...state.r12Prediction].join('|');
const oldBurnPlan=burnPlan;
// 小指良伪单通的预设路线（按视频总结的分层推荐 + 开局观测调整）
function pinkyPlan(){const a=state.r12Prediction||[],letter=a.includes('山茶花枝')||a.includes('破碎的眼镜'),needFlower=letter&&!a.includes('山茶花枝');
 // R23：5–10层只有6个位置，按作者优先级挑：先保证还没预测的 S 级饰品的包，再走信 / 剑谱路线，最后是 A 级包；挑完按楼层顺序排，时杀复刻放最后
 const want=[...(a.includes('紧急授予型搜查官徽章')?[]:['时间杀人时间复刻']),'2号线','深夜清扫复刻','自黎明后贯穿而来',...(a.includes('赤红纠缠的蜘蛛巢')&&a.includes('红领带')?[]:['教材']),/* 证据 09-061：只观测蜘蛛巢，教材里还有红领带 */...(letter?['无改变者']:[]),...(a.includes('红色流苏')?['经验记忆']:[]),'LCB定期体检复刻','经验记忆','20区的奇迹复刻','肉斩骨断复刻'];
 const chosen=[...new Set(want)].slice(0,6),order=['教材','2号线','无改变者','LCB定期体检复刻','深夜清扫复刻','自黎明后贯穿而来','经验记忆','20区的奇迹复刻','肉斩骨断复刻','时间杀人时间复刻'];
 const middle=order.filter(n=>chosen.includes(n));
 return ['信仰与侵蚀','地狱鸡',needFlower?'落花':'由子弹画下的句点','憎恶与绝望',...middle,'紫色编码','身负重担者们','拉·曼却领之主','插翅虎','仲春夜之梦2'];}
// R20：路线目标。稳定通关＝难包往后、11层起少打高危包、13层起走软柿子；优先饰品成型＝必去专属饰品多的包、11–12层打紫色编码
const R20_HARD_MID=['WARP快车谋杀案复刻','20区的奇迹复刻'];
const R20_SOFT=['插翅虎','仲春夜之梦2','血腥味','精灵童话','永劫的枷锁','去·海·边·激·蟹'];
function r20Goal(plan){plan=[...plan];const stable=state.r12Goal!=='gifts';
 let mid=plan.slice(4,10),late=plan.slice(10,15);
 const tk=mid.indexOf('时间杀人时间复刻');const pinTk=tk===5;
 let core=pinTk?mid.slice(0,5):mid;
 if(stable){core=[...core.filter(n=>!R20_HARD_MID.includes(n)),...core.filter(n=>R20_HARD_MID.includes(n))];
  const keep=late.filter(n=>n!=='紫色编码'&&!R20_SOFT.includes(n)).slice(0,2);
  const soft=[...late.filter(n=>R20_SOFT.includes(n)),...R20_SOFT.filter(n=>!late.includes(n))];
  late=[...new Set([...keep,...soft])].slice(0,5);if(SOLO()&&plan.slice(10).includes('紫色编码'))late=['紫色编码',...late.filter(n=>n!=='紫色编码')].slice(0,5);}
 else{if(!core.includes('自黎明后贯穿而来')&&!(pinTk?[...core,'时间杀人时间复刻']:core).includes('自黎明后贯穿而来')){const i=core.findIndex(n=>R20_HARD_MID.includes(n)||n==='1号线');core[i>=0?i:core.length-1]='自黎明后贯穿而来';}
  const burnLike=state.team==='burnVideo'||isPinky();late=[...new Set(['紫色编码',...(burnLike?['身负重担者们']:[]),...late])].slice(0,5);}
 mid=pinTk?[...core,'时间杀人时间复刻']:core;
 return [...plan.slice(0,4),...mid,...late];}
function r12Plan(){const b=state.team==='burnVideo',a=state.r12Prediction;
 const first=state.burnOpening==='shoes'?'无法去爱':state.burnOpening==='cries'?'自动工厂':'信仰与侵蚀';
 const flower=state.burnLetter&&!a.includes('山茶花枝'),glasses=state.burnLetter&&!a.includes('破碎的眼镜');
 let preferred=b?oldBurnPlan():isPinky()?pinkyPlan():SOLO()?soloPlan():[first,'地狱鸡',flower?'落花':'由子弹画下的句点',flower?'由子弹画下的句点':'憎恶与绝望','自黎明后贯穿而来','2号线','深夜清扫复刻',glasses?'3号线':'20区的奇迹复刻',glasses?'无改变者':'3号线','时间杀人时间复刻','紫色编码','仲春夜之梦2','血腥味','精灵童话','永劫的枷锁'];
 if(!b&&!isPinky()&&!SOLO()&&state.r12Wedge==='six'&&!glasses){preferred[7]='3号线';preferred[8]='20区的奇迹复刻';}if(!isPinky()&&!SOLO()){if(!b&&preferred[3]==='2号线')preferred[5]='深夜清扫复刻';if(!b&&preferred[5]===preferred[6])preferred[6]='1号线';if(state.r12Goal==='gifts'&&state.r12StarLevels[8]>=2){if(b)preferred[7]='自黎明后贯穿而来';else if(glasses)preferred[7]='无改变者';}}if(b&&glasses&&!preferred.includes('无改变者'))preferred[8]='无改变者';
 preferred=r23Reroute(r20Goal(preferred));
 const used=new Set(),out=[],carry=[];
 for(let f=1;f<=15;f++){const base=STORE[state.team][f]?.packs||[], pool=[...new Set([...carry,preferred[f-1],...base].filter(Boolean))].filter(n=>R6.canAppear(PACKAGE_INFO[n],f)!==false);const actual=state.packChoice[(b?'route-v2:':'')+(()=>{const sf=state.floor;state.floor=f;const k=packKey();state.floor=sf;return k})()];
 const valid=pool.filter(n=>!used.has(n)&&!finished(n)&&!r23Wasted(n)&&(n!=='时间杀人时间复刻'||f>=10));const pick=actual&&R6.canAppear(PACKAGE_INFO[actual],f)!==false?actual:valid[0]||pool.find(n=>n!=='时间杀人时间复刻'||f>=10)||'';out.push(pick);if(pick)used.add(pick);
  // 这一层没走预设包（被手动替换或暂时不能出现）→ 预设包顺延到后面的楼层
  const want=preferred[f-1];if(want&&want!==pick&&!used.has(want)&&!carry.includes(want))carry.push(want);
  const ci=carry.indexOf(pick);if(ci>=0)carry.splice(ci,1);}
 return out;
}
const oldCandidates=packCandidates;packCandidates=()=>{if(!state.floor)return [];const first=r12Plan()[state.floor-1];return [...new Set([first,...oldCandidates()].filter(Boolean))].filter(n=>floorAllowed(n)!==false)};
const oldActive=activePack;activePack=()=>{if(!state.floor)return '';const chosen=state.packChoice[(state.team==='burnVideo'?'route-v2:':'')+packKey()];return chosen&&floorAllowed(chosen)!==false?chosen:packCandidates()[0]||''};
const oldGuide=packGuide;packGuide=()=>{const p=activePack();if(isPinky()){const d=source();if(d&&d.packs?.[0]===p)return {...(PACKAGE_INFO[p]||{}),...(BURN_ROUTES[p]||{}),goal:d.goal,warning:d.avoid};}if(p==='时间杀人时间复刻'){return {...PACKAGE_INFO[p],...BURN_ROUTES[p],goal:'作者省流图：时杀复刻建议放在5–10层最后、发育完全时再去，一次买齐更多震颤专属；怀表推荐 Type E 与 Type Y（反着合）；Type P＋Type L（同色合）也能用，只是要求敌人比我方快，牢内加速后触发不稳，作者本次不优先。紧急授予型搜查官徽章看到必拿。'}}if(p==='无法去爱'||p==='自动工厂'){const g=PACKAGE_INFO[p]||{},r=BURN_ROUTES[p]||{};return {...g,...r};}return oldGuide()};
function r12Select(id,items,value){return `<select id="${id}">${items.map(([k,n])=>`<option value="${escapeHTML(k)}" ${k===value?'selected':''}>${escapeHTML(n)}</option>`).join('')}</select>`}
function r12Gift(n,rank,why=''){return `<div class="r12row"><button class="r12gift" data-item="${escapeHTML(n)}">${giftImage(n)}<span><b>${escapeHTML(n)}</b><small>${escapeHTML(why)}</small></span></button><span class="r12rank">${rank}</span><button data-owned-gift="${escapeHTML(n)}" ${state.r12Prediction.includes(n)?'disabled':''} aria-pressed="${got(n)}">${got(n)?'✓':'＋'}</button></div>`}
function r12Route(){return `<div class="r12floors">${r12Plan().map((n,i)=>`<button data-route-floor="${i+1}" class="${state.floor===i+1?'chosen':''}">${i+1}F <span>${escapeHTML(n||'待核实')}</span></button>`).join('')}</div>`}
function r20InitHint(){const k=state.r12Initial;const t={'呼吸法':'选呼吸开局：开局送的烟斗先别急着用，等拿到雾化吸入器这类能叠呼吸的饰品再拿烟斗。','烧伤':'选烧伤开局：商店“本队推荐”里烧伤饰品会排在前面。','流血':'选流血开局：商店“本队推荐”里流血饰品会排在前面；地狱鸡可定向刷流血找脏污的针与线。','破裂':'选破裂开局：单通通用的选择，商店里破裂饰品排在前面。','震颤':'选震颤开局：商店里震颤饰品排在前面。','充能':'选充能开局：商店里充能饰品排在前面。','沉沦':'选沉沦开局：商店里沉沦饰品排在前面。','斩击':'选斩击开局：商店里斩击饰品排在前面。','打击':'选打击开局：商店里打击饰品排在前面。','突刺':'选突刺开局：商店里突刺饰品排在前面。'}[k];return t?`<span class="r20hint">${escapeHTML(t)}</span><br>`:''}
// R20：小指良开局页的机制、技能替换和 EGO（锈町Rusty 视频字幕）
function r20PinkyNotes(){return `<details class="r20notes"><summary>小指良机制（点开）</summary><p><b>地魁星刀：</b>每个在场的蜘蛛巢队友在第一场战斗给5层，但每回合最多拿25层，所以第一回合放不出大招；第二回合靠三技能叠层，回合结束一定能到50层。</p><p><b>50层：</b>回合结束追击“空间斩·原”（算三技能，攻击容量5，能吃大衣回血），并移除她唯一的混乱线；下一回合出现强化大招“空间斩·残”。</p></details>`}
function r21VarKey(){return state.team==='burnVideo'?state.burnLineup:state.team==='wedgeVideo'?(state.r12Wedge==='six'?'six':'seven'):(state.r20Pinky==='few'?'few':'full')}
function r21VariantSelect(){if(state.team==='burnVideo')return r12Select('r12Lineup',Object.entries(LINEUPS).map(([k,v])=>[k,v.label]),state.burnLineup);if(state.team==='wedgeVideo')return r12Select('r12Wedge',[['seven','7人 · 3楔子+2黎明+2呼吸'],['six','6人 · 3楔子+LCCB良秀+呼吸+震颤']],state.r12Wedge==='six'?'six':'seven');return r12Select('r20Pinky',[['full','蜘蛛巢人格充足 · 送掉队友'],['few','蜘蛛巢人格不足 · 真单通']],state.r20Pinky==='few'?'few':'full')}
function r21VarKey(){return state.team==='burnVideo'?state.burnLineup:state.team==='wedgeVideo'?(state.r12Wedge==='six'?'six':'seven'):(state.r20Pinky==='few'?'few':'full')}
function r21VariantSelect(){if(state.team==='burnVideo')return r12Select('r12Lineup',Object.entries(LINEUPS).map(([k,v])=>[k,v.label]),state.burnLineup);if(state.team==='wedgeVideo')return r12Select('r12Wedge',[['seven','7人 · 3楔子+2黎明+2呼吸'],['six','6人 · 3楔子+LCCB良秀+呼吸+震颤']],state.r12Wedge==='six'?'six':'seven');return r12Select('r20Pinky',[['full','蜘蛛巢人格充足 · 送掉队友'],['few','蜘蛛巢人格不足 · 真单通']],state.r20Pinky==='few'?'few':'full')}
function r21VarKey(){return state.team==='burnVideo'?state.burnLineup:state.team==='wedgeVideo'?(state.r12Wedge==='six'?'six':'seven'):(state.r20Pinky==='few'?'few':'full')}
function r21VariantSelect(){if(state.team==='burnVideo')return r12Select('r12Lineup',Object.entries(LINEUPS).map(([k,v])=>[k,v.label]),state.burnLineup);if(state.team==='wedgeVideo')return r12Select('r12Wedge',[['seven','7人 · 3楔子+2黎明+2呼吸'],['six','6人 · 3楔子+LCCB良秀+呼吸+震颤']],state.r12Wedge==='six'?'six':'seven');return r12Select('r20Pinky',[['full','蜘蛛巢人格充足 · 送掉队友'],['few','蜘蛛巢人格不足 · 真单通']],state.r20Pinky==='few'?'few':'full')}
function r20Lineup(){const L=(window.MD_TEAM_LINEUPS||{})[state.team];if(!L)return '';const V=L.variants[r21VarKey()]||Object.values(L.variants)[0];const img=w=>(window.MD_IDENTITY_IMG||{})[w]||'';
 const card=([k,tag])=>{const m=L.ids[k];if(!m)return '';return `<div class="r20id" title="${escapeHTML(m.cn)}">${img(m.wiki)?`<img src="${escapeHTML(img(m.wiki))}" alt="${escapeHTML(m.cn)}">`:'<span class="r13Missing">缺图</span>'}<b>${escapeHTML(m.nick||m.cn.split(' ').pop())}</b>${tag?`<small>${escapeHTML(tag)}</small>`:''}</div>`};
 const extra=(V.extra||[]).map(t=>`<div class="r20id r21extra"><span class="r21q">＋</span><b>${escapeHTML(t)}</b></div>`).join('');
 return `<div class="r20lineup"><b>推荐人格 <small>按顺位；缺核心人格就不建议玩这队</small></b><div class="r20ids">${V.members.map(card).join('')}${extra}</div><p class="minor">${escapeHTML(V.order)}</p><details><summary>技能替换 / EGO（作者推荐）</summary>${L.skills.map(([w,t])=>`<p><b>${escapeHTML(w)}：</b>${escapeHTML(t)}</p>`).join('')}<p><b>EGO</b></p>${L.ego.map(e=>`<p>· ${escapeHTML(e)}</p>`).join('')}</details></div>`}
// 玩法页签：这队怎么玩（来自攻略）
function r21Play(){const L=(window.MD_TEAM_LINEUPS||{})[state.team]||{};return `<div class="panelCard r21play"><b>玩法 · ${escapeHTML(TEAM_SHORT[state.team]||'')}</b>${L.need?`<p class="r20hint">${escapeHTML(L.need)}</p>`:''}${(L.play||[]).map(p=>`<p>· ${escapeHTML(p)}</p>`).join('')}<p class="minor">攻略来源：B站UP主 锈町Rusty · 测试版：AI 根据视频整理，不保证完全正确，请以原视频为准。</p></div>`}
function r12Setup(){const b=state.team==='burnVideo';return `<div class="panelCard"><b>① 阵容</b><p class="r20goal">${r12Select('r12Goal',[['stable','稳定通关'],['gifts','优先饰品成型']],state.r12Goal)} <small>${state.r12Goal==='gifts'?'必去专属饰品多的包；11–12层打紫色编码':'难包往后；13层起走软柿子包'}</small></p><p>${r21VariantSelect()}</p>${r20Lineup()}${b?`<label>一号位 ${r12Select('burnLead',lineup().leads.map(x=>[x,x]),burnLead())}</label>`:''}</div><div class="panelCard"><b>星光 / 初始关键词</b><p>${r12Select('r12Grace',[['max','全部点满（作者推荐）'],['partial','星光不够，自己挑']],state.r12Grace)}</p><p>已选 ${r12Stars.reduce((sum,x,i)=>sum+x[1]*state.r12StarLevels[i],0)} / 930 星光（观测另算）</p><details ${state.r12Grace==='partial'?'open':''}><summary>逐项设置</summary>${r12Stars.map(([n,c,d],i)=>`<div class="r12row"><span style="flex:1">${n}<small> · ${d}</small></span>${r12Select('r12Star'+i,[[0,'不选'],[1,'基础 '+c],[2,'+ '+2*c],[3,'++ '+3*c]].map(([k,v])=>[String(k),v]),String(state.r12StarLevels[i]))}</div>`).join('')}</details><label>初始关键词 ${r12Select('r12Initial',(SOLO()?SOLO().initial:isPinky()?['烧伤','流血','呼吸法','破裂','震颤']:b?['烧伤','震颤']:['呼吸法','震颤']).map(x=>[x,x]),state.r12Initial)}</label><p class="minor">${r20InitHint()}${b?'作者说烧伤或震颤都行':SOLO()?(SOLO().initialNote||'按本队体系：'+SOLO().initial.join('、')).replace(/。$/,''):isPinky()?'作者说按人格选烧伤、流血、呼吸法都行，也可以选单通常用的破裂、震颤':'作者说呼吸法或震颤都行'}。<a href="https://limbuscompany.wiki.gg/wiki/Mirror_of_Sisyphe" target="_blank">星光详细说明 ↗</a></p></div><div class="panelCard"><b>开局观测 · 最多三件</b>${r36PredHint()}${[0,1,2].map(i=>`<div class="r12row">${state.r12Prediction[i]?giftImage(state.r12Prediction[i]):''}${r12Select('r12Pred'+i,[['','不选'],...[...new Set([...r12OptsFor(state.team),...(state.r12Prediction[i]?[state.r12Prediction[i]]:[])])].filter(n=>n===state.r12Prediction[i]||!state.r12Prediction.includes(n)).map(n=>[n,r37Tag(n)])],state.r12Prediction[i]||'')}</div>`).join('')}<button data-r12-default="1">恢复作者推荐</button>${state.r12Prediction.includes('翼形蜡烛')&&(!b||!lineup().candle)?'<p class="minor">注意：当前阵容未确认满足三黎明条件，蜡烛不是推荐默认项。</p>':''}</div><div class="panelCard"><b>完整 15 层预设</b><p class="minor">原视频整理路线 + 条件推导；随机刷包不保证。切换配置会重新规划。星光与初始关键词主要影响运营，非每项变化都必然改变选包。</p>${r12Route()}</div><button class="r12start" data-r12-start="1">开始镜牢 → 第 1 层</button>`}
function r12Trials(){const f=state.floor;if(f<=10){return `<p class="minor">层末普通强化：以下为按机制推导的相对风险排序，并非确认每层出现的词条。以实际数值和组合为准。</p>${['防御等级 / 防护','生命值 / 伤害减免','攻击伤害提升','攻击等级提升','拼点 / 基础 / 最终威力提升','硬币威力提升'].map((n,i)=>`<div class="r12trial"><b>${i+1}. ${n}</b><small>${i<2?'优先比较':i<4?'谨慎': '尽量避免'}${i===5?' · 多硬币敌人尤其危险':''}</small></div>`).join('')}`};return R7.byFloor(f).map(x=>({...x,r:R7.assess(x,{stagger:true,sp:state.team==='wedgeVideo'},state.team)})).sort((a,b)=>a.r.value-b.r.value||a.points-b.points).map((x,i)=>`<div class="r12trial"><b>${i+1}. ${escapeHTML(x.name)} · ${x.points}分</b><small>${escapeHTML(x.r.band+' · '+x.rule)}</small></div>`).join('')+'<p class="minor">不必为稳定通关强行全制约；排序为建议。</p>'}
function r12Shop(){const b=state.team==='burnVideo',f=state.floor;const list=SMART.filter(g=>!g.clearOnly&&!g.special&&!got(g.name)).map(g=>({g,v:teamScore(g)+(g.group==='economy'?(f<=5?18:f>=11?-45:0):0)+(g.group==='survival'&&f>=11?14:0)})).sort((a,b)=>b.v-a.v).filter(x=>x.v>=45).slice(0,8);return list.map(({g,v},i)=>r12Gift(g.name,i<3?'S':i<6?'A':'B',g.why)).join('')+`<details><summary>原攻略商店图示排名</summary>${['general-recommend-1','general-recommend-2','general-recommend-3','general-recommend-4'].map(x=>`<img class="r12chart" src="./assets/tier-guide/${x}.webp" alt="攻略排行图">`).join('')}</details>`}
renderSheet=()=>{const f=state.floor; $('sheetTitle').textContent=f?'第 '+f+' 层 · 实战指挥':'开局准备';if(!f){$('sheetBody').innerHTML=r12Setup();return;}const d=source(),p=activePack(),pg=packGuide()||{},targets=[...new Set([...packTargets(p),...activeGifts()])];$('sheetBody').innerHTML=`<div class="panelCard"><b>01 · 卡包首选 / 备选</b><div class="visualList">${packCandidates().slice(0,3).map(packCard).join('')}</div><p>${escapeHTML(pg.goal||d?.goal||'按实际候选选择')}</p><details><summary>其他实际卡包 / 全15层路线</summary>${r12Select('packOther',[['','选择实际出现的其他卡包'],...candidateNames().filter(n=>floorAllowed(n)!==false).map(n=>[n,n])],'')}${r12Route()}</details></div><div class="panelCard"><b>02 · 本层目标饰品</b>${targets.length?targets.map((n,i)=>r12Gift(n,got(n)?'✓':i===0?'S':'A',got(n)?'已获得': '点击查看效果、来源与配方')).join(''):'<p>暂无核实的固定目标。</p>'}<p class="minor">限定池非保底；以实际事件或商店为准。</p></div><div class="panelCard"><b>03 · 商店购买排名</b>${pg.shop?`<p>${escapeHTML(pg.shop)}</p>`:''}${r12Shop()}</div><div class="panelCard"><b>04 · ${f<=10?'敌方强化':'高层制约'}</b>${r12Trials()}</div><div class="panelCard"><b>05 · 事件 / 战斗</b>${[pg.priorityNode,pg.event,pg.combat,pg.warning].filter(Boolean).map(x=>`<p>${escapeHTML(x)}</p>`).join('')||'<p>按实际地图与技能判断。</p>'}<details><summary>更多实战依据</summary>${verifiedPackPanel()}${r9Context('packs')}<button data-open="bosses">BOSS 攻略</button></details></div><button class="r12start" data-r12-next="1" ${f===15?'disabled':''}>${f===15?'已到最终层':'下一层 →'}</button>`};
const oldUpdate=update;update=()=>{state.stage='packs';oldUpdate();$('phases').hidden=true;};
const oldChange=changeTeam;changeTeam=t=>{if(t!==state.team){state.team=t;state.r12Prediction=r12Defaults();state.r12Initial=SOLO()?SOLO().initial[0]:t==='burnVideo'?'烧伤':t==='wedgeVideo'?'呼吸法':'震颤';r12Sync();}oldChange(t);state.expanded=true;update()};$('team').onchange=()=>changeTeam($('team').value);
const r12Replan=()=>{state.packChoice={};r12Sync();state.expanded=true;update()};
$('sheetBody').addEventListener('change',e=>{const id=e.target.id,v=e.target.value;if(id==='r12Team'){changeTeam(v);return;}if(id==='r12Lineup'){state.burnLineup=v;state.r12Prediction=r12Defaults();}else if(id==='r12Wedge')state.r12Wedge=v;else if(id==='r20Pinky')state.r20Pinky=v;else if(id==='r12Goal')state.r12Goal=v;else if(id==='r12Initial')state.r12Initial=v;else if(id==='r12Grace'){state.r12Grace=v;state.r12StarLevels=r12Stars.map((x,i)=>v==='max'?3:([2,6,7,8].includes(i)?3:1));}else if(/^r12Star[0-9]$/.test(id)){state.r12StarLevels[+id.slice(7)]=Number(v);state.r12Grace=state.r12StarLevels.every(x=>x===3)?'max':'partial';}else if(/^r12Pred[0-2]$/.test(id)){state.r12Prediction[+id.slice(-1)]=v;}else return;r12Replan()});
$('sheetBody').addEventListener('click',e=>{if(e.target.closest('[data-r12-default]')){state.r12Prediction=r12Defaults();r12Replan()}if(e.target.closest('[data-r12-start]')){state.ownedGifts[state.team]=[];state.completedPacks[state.team]=[];state.packChoice={};jump(1)}if(e.target.closest('[data-r12-next]'))jump(state.floor+1)});
$('extras').querySelectorAll('button').forEach(b=>{if(!['openCredits'].includes(b.id))b.hidden=true});$('extras').querySelectorAll('label,.caption').forEach(x=>x.hidden=true);
$('phases').style.display='none';document.querySelector('.foot').innerHTML='非实时读取游戏 · <button id="r12credits">攻略来源与署名</button>'; $('r12credits').onclick=()=>reference('署名 / 来源 / 反馈','credits');


const r13Cats=['','本队推荐','通用','呼吸法','烧伤','震颤','流血','破裂','沉沦','充能','斩击','突刺','打击'];
let r13Cat='',r13Page='floor';
const r13Grade={S:'推荐',A:'实用',B:'普通'};
// R19：分档来自各队视频作者的原话（team-picks.js），不再用 Steam 社区通用榜
const TEAM_PICKS=window.MD_TEAM_PICKS||{};
const r13KbCat=k=>({'呼吸':'呼吸法'})[k]||k||'通用';
const r13Pool=(()=>{const m=new Map((KNOW.gifts||[]).filter(g=>!g.isStatusNotGift).map(g=>[g.name,g]));
 for(const t of Object.values(TEAM_PICKS))for(const n of [...t.S,...t.A])if(!m.has(n)){const en=window.MD_KB_EN?.[n],kb=en&&KB_LOOKUP(en);if(kb)m.set(n,{name:n,english:en,category:r13KbCat(kb.keyword),tier:kb.tier,source:kb.recipe?'固定合成：'+kb.recipe:kb.packs?'卡包：'+kb.packs.replace(/；/g,'、'):'通用饰品：战斗奖励、商店、随机合成都可能出现'})}
 return [...m.values()]})();
function teamGrade(n){const p=TEAM_PICKS[state.team];if(!p)return '';if(p.S.includes(n))return 'S';if(p.A.includes(n))return 'A';const g=r13Pool.find(x=>x.name===n);return g&&p.keywords.includes(g.category)?'B':''}
function r13Tier(g){const en=g.english||window.MD_KB_EN?.[g.name];const t=(en&&KB_LOOKUP(en)?.tier)||g.tier||'';return t?t+'级':''}
// Separate purchase recommendations from theme-pack and fusion targets. Existing editorial grades, not official tiers.
function r13Availability(g){const src=g.source||'';if(/通关后|固定合成|稀有获取/.test(src)&&!/池|商店/.test(src))return '合成/限定';if(/商店|普通|泛用池|呼吸池|烧伤池|震颤池|流血池|破裂池|沉沦池|充能池/.test(src))return /固定合成|事件|合成|掉落/.test(src)?'商店/其他':'商店/池';return '限定/待核实'}
function r13Tile(n,extra=''){n=canonical(n);const name=escapeHTML(n),pred=state.r12Prediction.includes(n);return `<div class="r16tile"><button class="r13tile" data-owned-gift="${name}" ${pred?'disabled':''} aria-pressed="${got(n)}" title="${name} · 点击记录">${giftImage(n)}<span>${name}${got(n)?' ✓':''}</span>${extra?`<small>${escapeHTML(extra)}</small>`:''}</button><button class="r16info" data-item="${name}" title="效果、来源、配方">详情</button></div>`}
function r20KwFirst(list){const k=state.r12Initial;return [...list].sort((a,b)=>Number(b.category===k)-Number(a.category===k))}
function r20PackGifts(p){const m=window.MD_KB_PACK_GIFTS||{};if(m[p])return m[p];const k=Object.keys(m).find(x=>packKeyNorm(x)===packKeyNorm(p));return k?m[k]:[]}
function r20FloorShop(){if(!state.floor)return '';const p=activePack();const rank=n=>({S:0,A:1,B:2})[teamGrade(n)]??3;const tag=n=>({S:'推荐',A:'实用',B:'普通'})[teamGrade(n)]||'';
 const ex=r20PackGifts(p).filter(n=>teamGrade(n)&&!got(n)).sort((a,b)=>rank(a)-rank(b)).slice(0,6);
 const general=r13List('本队推荐').filter(g=>g.grade!=='B'&&r13Availability(g).startsWith('商店')&&!got(g.name)&&!ex.includes(g.name)).sort((a,b)=>rank(a.name)-rank(b.name)).map(g=>g.name).slice(0,4);
 return `<section class="r20floorshop"><h3>本层卡包专属 <small>${escapeHTML(p||'')}</small></h3>${ex.length?`<div class="r13tiles">${ex.map(n=>r21Tile(n,tag(n),p,true)).join('')}</div>`:'<p class="minor">这个卡包没有本队用得上的专属饰品</p>'}${general.length?`<h3>通用推荐 <small>不限卡包，任何一层的商店都可能刷到</small></h3><div class="r13tiles">${general.map(n=>r21Tile(n,tag(n),p,true)).join('')}</div>`:''}</section>`}
// R21：饰品的等级 / 属性 / 获取方式（资料库：wiki 卡包页面的问号事件 + 通用规则）
function r21Kb(n){const en=english(n);return (en&&KB_LOOKUP(en))||null}
function r21Meta(n){const k=r21Kb(n);if(!k)return '';return [k.tier?k.tier+'级':'',k.keyword||'无体系'].filter(Boolean).join(' · ')}
function r21Src(n,p){const k=r21Kb(n);if(!k)return '';const ev=(k.obtain||[]).filter(o=>!p||packKeyNorm(o.pack)===packKeyNorm(p));
 if(ev.length){const o=ev.find(o=>o.when!=='fail')||ev[0];return '问号事件'+(o.check?' · '+o.check+'检定':'')}
 if(k.recipe)return '固定合成';if(p&&r20PackGifts(p).includes(n))return '本包商店 / 通关可选';if(k.type==='通用')return '战斗奖励 / 商店';
 return k.packs?'限定：'+k.packs.split('；')[0]:''}
function r21Tile(n,extra,p,short){n=canonical(n);const name=escapeHTML(n),pred=state.r12Prediction.includes(n),meta=r21Meta(n),src=short?r21Src(n,p).split(' · ')[0]:r21Src(n,p);return `<div class="r16tile"><button class="r13tile" data-owned-gift="${name}" ${pred?'disabled':''} aria-pressed="${got(n)}" title="${name} · 点击记录">${giftImage(n)}<span>${name}${got(n)?' ✓':''}</span>${extra?`<small>${escapeHTML(extra)}</small>`:''}${meta?`<small class="r21meta">${escapeHTML(meta)}</small>`:''}${src?`<small class="r21src">${escapeHTML(src)}</small>`:''}</button><button class="r16info" data-item="${name}" title="效果、来源、配方">详情</button></div>`}
function r21ObtainCard(n){const k=r21Kb(n);if(!k)return '';
 const rows=(k.obtain||[]).map(o=>`<p>· <b>${escapeHTML(o.pack)}</b> 问号事件「${escapeHTML(o.event)}」选项${escapeHTML(o.option)}：${o.check?escapeHTML(o.check)+'检定'+(o.when==='fail'?'失败也能拿到':'成功获得'):'直接获得'}${o.deadly?'（⚠ 检定失败会让检定的人格阵亡）':''}</p>`);
 const extra=[];if(k.recipe)extra.push('固定合成：'+k.recipe);
 if(k.type==='通用')extra.push('通用饰品：战斗后的奖励卡、任意商店、随机合成都可能出现');
 else if(k.packs)extra.push('卡包专属（'+k.packs.replace(/；/g,'、')+'）：走到这个卡包的楼层时，商店可能刷到；也可能在卡包下方可选（通关奖励）里；随机合成可能出本层卡包专属');
 return `<div class="panelCard"><b>获取方式</b>${rows.join('')}${extra.map(t=>`<p>· ${escapeHTML(t)}</p>`).join('')}<p class="minor">问号事件来自 wiki 卡包页面；其余为 wiki 通用规则和视频作者的说法。</p></div>`}
// 商店：关键词按钮（先选关键词再列推荐，页面更薄）
function r21Chips(){const ks=[...(TEAM_PICKS[state.team]?.keywords||[]),'通用','本队推荐'];return `<div class="r21chips">${ks.map(c=>`<button data-r21-cat="${escapeHTML(c)}" class="${r13Cat===c?'on':''}">${c==='本队推荐'?'全部推荐':escapeHTML(c)}</button>`).join('')}</div>`}
function r13List(cat){const pool=r13Pool.map(g=>({...g,grade:teamGrade(g.name)}));return cat==='本队推荐'?pool.filter(g=>g.grade):pool.filter(g=>g.category===cat)}
function r13Shop(){if(!r13Cat)return `<div class="r13shophead"><b>商店 · ${escapeHTML(TEAM_SHORT[state.team]||'')}</b></div>${r21Chips()}${r20FloorShop()}<p class="minor">点上面的关键词，只看这个体系里本队用得上的饰品；再点一次回到本层。</p>`;const list=r13List(r13Cat);const buyable=g=>r13Availability(g).startsWith('商店');return `<div class="r13shophead"><button data-r13-page="floor">‹ 本层</button><b>商店 · ${escapeHTML(TEAM_SHORT[state.team]||'')}</b>${r12Select('r13Cat',r13Cats.map(x=>[x,x||'选择关键词']),r13Cat)}</div>${r21Chips()}<div class="r13rankgrid">${['S','A','B'].map(grade=>{const a=r20KwFirst(list.filter(g=>g.grade===grade)).sort((x,y)=>(buyable(x)?0:1)-(buyable(y)?0:1));return `<section class="r13rankcol"><h3>${r13Grade[grade]} <small>${a.length}</small></h3><div class="r13tiles">${a.map(g=>r13Tile(g.name,[r13Tier(g),buyable(g)?'':'限定'].filter(Boolean).join(' · '))).join('')||'<small>无</small>'}</div></section>`}).join('')}</div><small class="minor">AI 根据视频总结</small>`}
function r13Short(s,max=80){return escapeHTML(String(s||'').slice(0,max))+(String(s||'').length>max?'…':'')}
function r13Trials(){const f=state.floor;if(f<=10)return `<div class="r13line good">优先：防御等级 / 防护 / 减伤</div><div class="r13line caution">谨慎：伤害 / 攻击等级</div><div class="r13line bad">避免：拼点 / 最终 / 硬币威力</div>`;const a=R7.byFloor(f).map(x=>({...x,r:R7.assess(x,{stagger:true,sp:state.team==='wedgeVideo'},state.team)})).sort((a,b)=>a.r.value-b.r.value||a.points-b.points);return `<div class="r13line good">优先：${r13Short(a.slice(0,2).map(x=>x.name).join('、'),48)||'待核实'}</div><div class="r13line bad">谨慎：${r13Short(a.slice(-2).map(x=>x.name).join('、'),48)||'待核实'}</div>`}
const r13OldSheet=renderSheet;
renderSheet=()=>{const f=state.floor;document.body.classList.toggle('r13run',!!f);document.body.classList.toggle('r13shop',!!f&&r13Page==='shop');if(!f){r13OldSheet();return} $('sheetTitle').textContent='第 '+f+' 层 · 实战指挥';if(r13Page==='shop'){$('sheetBody').innerHTML=r13Shop();return;}const d=source(),p=activePack(),pg=packGuide()||{},targets=[...new Set([...packTargets(p),...activeGifts()].map(canonical))];const shopCats=SOLO()?[...SOLO().keywords,'通用']:state.team==='wedgeVideo'?['呼吸法','震颤','通用']:['烧伤','震颤','通用'];const shop=shopCats.flatMap(c=>r13List(c).filter(g=>g.grade==='S'&&r13Availability(g).startsWith('商店')&&!got(g.name)).slice(0,c==='通用'?2:1)).slice(0,4);const notes=[pg.priorityNode,pg.event,pg.combat,pg.warning,pg.goal||d?.goal].filter(Boolean);$('sheetBody').innerHTML=`<div class="r13grid"><section class="r13cell"><header>卡包 <button data-r13-detail="route">全路线 ›</button></header><div class="r13packs">${packCandidates().slice(0,3).map(packCard).join('')}</div></section><section class="r13cell"><header>目标饰品 <button data-r13-detail="gifts">全部 ${targets.length} ›</button></header><div class="r13tiles">${targets.slice(0,4).map(n=>r13Tile(n)).join('')||'<small>暂无固定目标</small>'}</div></section><section class="r13cell"><header>商店 <button data-r13-page="shop">三档排行 ›</button></header><div class="r13tiles">${shop.map(g=>r13Tile(g.name)).join('')||'<small>查看体系排行榜</small>'}</div></section><section class="r13cell"><header>${f<=10?'敌方强化':'高层制约'} <button data-r13-detail="trials">完整 ›</button></header>${r13Trials()}</section></div><section class="r13note"><b>本层提醒：</b><span>${r13Short(notes[0]||'按实际地图及技能判断',100)}</span><button data-r13-detail="notes">详情 ›</button></section>`};
const r13RenderRef=renderReference;renderReference=()=>{if(currentRef?.kind!=='r13detail'){r13RenderRef();return}const k=currentRef.item,p=activePack(),pg=packGuide()||{},d=source();$('refTitle').textContent=currentRef.title;const targets=[...new Set([...packTargets(p),...activeGifts()].map(canonical))];$('refBody').innerHTML=k==='settings'?'<div class="panelCard"><button data-route-floor="0">返回开局配置</button> <button id="r13source">攻略来源与署名</button><p>置顶、透明度、鼠标穿透及窗口大小由原生顶部控制条管理。</p></div>':k==='route'?`${r12Select('packOther',[['','选择实际出现的其他卡包'],...candidateNames().filter(n=>floorAllowed(n)!==false).map(n=>[n,n])],'')}${r12Route()}`:k==='gifts'?targets.map((n,i)=>r12Gift(n,i===0?'S':'A','点击查看来源与配方')).join('')||'暂无固定目标':k==='trials'?r12Trials():`<div class="panelCard">${[pg.priorityNode,pg.event,pg.combat,pg.warning,pg.goal||d?.goal,pg.shop].filter(Boolean).map(x=>`<p>${escapeHTML(x)}</p>`).join('')}${verifiedPackPanel()}${r9Context('packs')}<button data-open="bosses">BOSS 攻略</button></div>`};
$('refBody').addEventListener('click',e=>{if(e.target.id==='r13source')reference('署名 / 来源 / 反馈','credits')});
$('refBody').addEventListener('change',e=>{if(e.target.id==='packOther'&&e.target.value){currentRef=null;refStack=[];selectPack(e.target.value)}});
$('sheetBody').addEventListener('click',e=>{const c=e.target.closest('[data-r21-cat]');if(c){r13Cat=r13Cat===c.dataset.r21Cat?'':c.dataset.r21Cat;update();return}});
$('sheetBody').addEventListener('click',e=>{const b=e.target.closest('[data-r13-page]');if(b){r13Page=b.dataset.r13Page;if(r13Page==='shop')r13Cat='';update();return}const d=e.target.closest('[data-r13-detail]');if(d){const k=d.dataset.r13Detail;reference(({route:'全部15层路线',gifts:'本层全部目标饰品',trials:'强化 / 制约完整排名',notes:'本层详细攻略'})[k],'r13detail',k)}});
$('sheetBody').addEventListener('change',e=>{if(e.target.id==='r13Cat'){r13Cat=e.target.value;update()}});
$('settings').onclick=()=>{reference('设置 / 开局','r13detail','settings')};
const r13Jump=jump;jump=f=>{r13Page='floor';state.expanded=true;r13Jump(f)};
const r13Update=update;update=()=>{r13Update();document.body.classList.toggle('r13run',!!state.floor);document.body.classList.toggle('r13compact',!!state.floor&&!currentRef&&state.expanded);if(state.floor&&!currentRef&&state.expanded)$('sheet').hidden=false;};


// R14: one full-width stage at a time, with native horizontal scrolling.
const r14Names=['卡包','饰品 / 路线','商店','收集核对'];
let r14Index=0,r14LastFloor=-1,r14LastTeam='',r14Wheel=0,r14Pending=null,r14PendingTimer=0;
function r14Nav(i,smooth=true){const rail=$('r14Rail');if(!rail)return;r14Index=Math.max(0,Math.min(rail.children.length-1,i));/* R23：滑动动画途中不要把页签改回中间值，滑到目标页（或 1.2 秒后）才恢复跟随 */r14Pending=smooth?r14Index:null;clearTimeout(r14PendingTimer);if(smooth)r14PendingTimer=setTimeout(()=>{r14Pending=null},1200);rail.scrollTo({left:r14Index*rail.clientWidth,behavior:smooth?'smooth':'instant'});r14SyncNav();}
function r14SyncNav(){document.querySelectorAll('[data-r14-tab]').forEach(b=>{const on=Number(b.dataset.r14Tab)===r14Index;b.classList.toggle('chosen',on);b.setAttribute('aria-current',on?'page':'false')});const l=$('r14Left'),r=$('r14Right');if(l)l.disabled=r14Index===0;if(r)r.disabled=r14Index===($('r14Rail')?.children.length||1)-1;}

const r16Key=()=>[state.team,state.team==='burnVideo'?state.burnLineup:state.r12Wedge,state.r12Initial,state.r12Goal,...state.r12Prediction,...state.r12StarLevels].join('|');
state.r16Plans=state.r16Plans||{};state.r16Visited=state.r16Visited||{};if(!state.r17Migrated){state.r16Plans={};state.r17Migrated=true;}
function r16Baseline(){const plan=r12Plan(), dates={};plan.forEach((p,i)=>packTargets(p).forEach(n=>{n=canonical(n);if(!(n in dates))dates[n]=i+1}));state.r12Prediction.filter(Boolean).forEach(n=>dates[canonical(n)]=0);return {plan,dates};}
function r16Ensure(){if(!state.r16Plans[r16Key()])state.r16Plans[r16Key()]=r16Baseline();if(!state.r16Visited[r16Key()])state.r16Visited[r16Key()]={};}
// R17: explicitly graded targets; do not count every random pack reward as mandatory.
const r17Common={
 '地狱鸡':[['探戈鸡酱料','S'],['锐利的针与线','A'],['脏污的针与线','A']],
 '由子弹画下的句点':[['黑焰烟斗','A'],['齿轮碎片','A'],['默示契约更新','B']],
 '2号线':[['枷锁','A'],['节拍器','A']],
 '憎恶与绝望':[['灰色星座的加护','A']],
 '时间杀人时间复刻':[['怀表：Type E','S'],['怀表：Type Y','S'],['紧急授予型搜查官徽章','S'],['怀表：Type L','A'],['怀表：Type P','A']],
 '深夜清扫复刻':[['影织斗笠','S'],['镌刻的异文','A'],['异文符咒','A']],
 '20区的奇迹复刻':[['快乐的毛绒玩偶','A'],['礼物','B'],['影子怪物','B']],
 '3号线':[['未孵化的火种','A']], '紫色编码':[['量产型K公司安瓿','B']], '仲春夜之梦2':[['可米的小小礼物','B']], '1号线':[['虚假的光相','A'],['蛇蜕','A']]
};
function r17Targets(p){const b=state.team==='burnVideo';let rows=[...(r17Common[p]||[])];const add=(n,g)=>rows.push([n,g]);
 if(p==='地狱鸡')add('火热多汁琵琶腿',b?'S':'B');
 if(p==='由子弹画下的句点'&&b)add('近身格斗术教材','A');
 if(p==='自黎明后贯穿而来'&&isPinky()){add('黑色三角帽','A');add('精心分类的药材','A');add('空洞的自尊','S');}
 else if(p==='自黎明后贯穿而来'){if(b){add('榜样','A');add('黑色三角帽','A');add('精心分类的药材','A');add('骑士的自尊','B')}else{add('白色领巾','S');add('黑色三角帽','S');add('精心分类的药材','S');add('折断的枪尖','A');add('身体适应用装置','A');add('榜样','B')}}
 if(b&&p==='教材'){add('奉纳的雪茄',lineup().cigar?'S':'B');add('制式服装-六协会','A');add('灼热之锤','A')}
 if(b&&['盛火时节','解放的暴怒'].includes(p)){if(lineup().candle)add('翼形蜡烛','S');add('灼热的铜管','B')}
 if((b||isPinky())&&p==='LCB定期体检复刻')for(const n of ['试验提取：红艳煞','点火手套','重燃火花塞','余火'])add(n,'A');
 if((b||isPinky())&&p==='身负重担者们')add('燃烧的命运',isPinky()?'S':'A');if((b||isPinky())&&p==='插翅虎')add('为了指挥官','S');if(isPinky()&&p==='紫色编码')add('量产型K公司安瓿','S');if(isPinky()&&p==='拉·曼却领之主')add('家人的怨恨','A');if(isPinky()&&p==='深夜清扫复刻')add('影织斗笠','S');if(isPinky()&&p==='地狱鸡'){add('探戈鸡酱料','S');add('火热多汁琵琶腿','S')}if(isPinky()&&p==='憎恶与绝望')add('灰色星座的加护','S');
 if(p==='血腥味')add('拍手啪啪！',!b?'A':'B');
 if(p==='经验记忆'&&(b||isPinky())){for(const n of ['白瓷砚滴','菖蒲剑','粉碎的木制刑具','无纹的刀镡'])add(n,'A');if(state.r12Prediction.includes('红色流苏'))add('本国剑谱','B')}
 if(p==='琥珀色的黄昏'&&b&&state.burnLineup==='thumb')add('亡命之徒','B');
 if(p==='信仰与侵蚀')add('血红鬃毛','B');
 if(['无法去爱','自动工厂'].includes(p)&&['shoes','cries'].includes(state.burnOpening))add('霜冻足迹','B');
 if(state.burnLetter&&['落花','无改变者'].includes(p))add('山茶花、眼镜和送达的信','B');
 return rows.map(([n,g])=>[canonical(n),g]);}
function r17Goals(){r16Ensure();const plan=[...state.r16Plans[r16Key()].plan],seen=state.r16Visited[r16Key()];for(const [f,p] of Object.entries(seen))plan[+f-1]=p; if(state.floor)plan[state.floor-1]=activePack();const m=new Map();const add=(n,g,f)=>{n=canonical(n);const old=m.get(n);if(old){if(g<old.g)old.g=g;old.f=Math.min(old.f,f)}else m.set(n,{n,g,f})};plan.forEach((p,i)=>r17Targets(p).forEach(([n,g])=>add(n,g,i+1)));
 const b=state.team==='burnVideo';const fixed=SOLO()?soloChecklist():isPinky()?[['火热多汁琵琶腿',2],['探戈鸡酱料',2],['灰色星座的加护',4],['影织斗笠',7],['骑士的自尊',8],['紧急授予型搜查官徽章',10],['量产型K公司安瓿',11],['燃烧的命运',12]]:b?[['火热多汁琵琶腿',2],['探戈鸡酱料',2],['怀表：Type E',7],['怀表：Type Y',7],['紧急授予型搜查官徽章',7],...(lineup().candle?[['翼形蜡烛',7]]:[]),...(lineup().cigar?[['奉纳的雪茄',7]]:[])]:[['探戈鸡酱料',2],['白色领巾',7],['黑色三角帽',7],['精心分类的药材',7],['怀表：Type E',10],['怀表：Type Y',10],['紧急授予型搜查官徽章',10],['福袋',10],['震颤耦合',10]];
 for(const [n,f] of fixed){const k=canonical(n);if(m.has(k))m.get(k).g='S';else add(k,'S',f)}
 if(!b&&!isPinky()&&!SOLO()&&plan.includes('血腥味'))add('拍手啪啪！','A',plan.indexOf('血腥味')+1);
 if(!b&&!isPinky()&&!SOLO()){add('雾化吸入器','A',5);add('水中月','B',10)}
 state.r12Prediction.filter(Boolean).forEach(n=>{const k=canonical(n);if(m.has(k))m.get(k).f=0;else add(k,'B',0)});return [...m.values()];}
function r17Met(n,seen=new Set()){n=canonical(n);if(got(n))return true;if(seen.has(n))return false;seen.add(n);const products=['怀表：Type E','怀表：Type Y','怀表：Type L','怀表：Type P','制式服装-六协会','霜冻足迹','未寄出的信','山茶花、眼镜和送达的信','福袋','震颤耦合'];return products.some(p=>p!==n&&got(p)&&getRecipes(p).some(r=>r.map(canonical).includes(n)));}
function r16Checklist(){const goals=r17Goals(),core=goals.filter(x=>x.g==='S'),due=core.filter(x=>x.f<=state.floor),missing=due.filter(x=>!r17Met(x.n));return `<div class="r16checkhead"><b>核心 ${core.filter(x=>r17Met(x.n)).length}/${core.length} · 到期 ${due.filter(x=>r17Met(x.n)).length}/${due.length}</b><button data-r12-next="1" ${state.floor===15?'disabled':''}>${state.floor===15?'最终层':'下一层 →'}</button></div>${r17TrialLine()}${['S','A','B'].map((g,i)=>{const rows=goals.filter(x=>x.g===g).sort((a,b)=>Number(r17Met(a.n))-Number(r17Met(b.n))||a.f-b.f);return `<details ${g==='S'?'open':''}><summary>${['核心目标','推荐补强','条件 / 可选'][i]} ${rows.filter(x=>r17Met(x.n)).length}/${rows.length}</summary><div class="r16checkgrid">${rows.map(x=>r13Tile(x.n,got(x.n)?'已获得':r17Met(x.n)?'已用于合成':x.f<=state.floor?'待补 · '+x.f+'F':'计划 '+x.f+'F')).join('')}</div></details>`}).join('')}<p class="minor">${isPinky()||SOLO()?'AI 根据锈町Rusty 视频截图与字幕总结':'锈町Rusty 视频字幕整理'}；计划楼层为工具推导。点击成品即可满足已核实的配方材料，不自动读取游戏。</p>`}
function r17TrialLine(){return `<div class="r17trialline" title="机制推导排序，须结合数值及附加效果">强化：①防御 ②生命 ③伤害 ④攻等 ⑤拼点/基础/最终 ⑥硬币</div>${state.floor>=11?`<details><summary>高层制约排名</summary>${r12Trials()}</details>`:''}`}
function r16RouteAdvice(p,pg,targets){const audit=PACKAGE_INFO[p]?.audit||{},missing=targets.filter(n=>!got(n));let advice='按可见地图选择；专属池不等于问号奖励。',reason='尚未核实本包具体问号优先级。',events=[];if(audit.kind==='通关必得'){advice='战斗 / 通关优先';reason='本包固定通关奖励，不必专门寻找问号。'}else if(p==='地狱鸡'){advice=missing.includes('探戈鸡酱料')?'问号优先':'核心鸡酱已取得，战斗与其他目标优先';reason='Wiki：该包问号有75%概率生成两种专属事件之一。';events=[state.team==='burnVideo'?'炸鸡对决：原攻略选1，目标火热多汁琵琶腿；按游戏实际选项核对。':'炸鸡对决：鸡肉可作合成材料，不是楔子必拿。','鸡群的激情探戈：原攻略选2，目标探戈鸡酱料。'];}else if(p==='无法去爱'||p==='自动工厂'){advice='先核对目标饰品的获取方式';reason='目标为'+(p==='无法去爱'?'冰封的哀嚎':'鬼附鞋')+'，未核实具体事件选项，不保证问号掉落。';}else if(pg.priorityNode&&!/从本局实际候选|按地图|实际卡包/.test(pg.priorityNode)){advice=pg.priorityNode;reason='原攻略建议；以实际节点为准。';}else if(missing.length){advice='优先能取得缺失目标的节点';reason='缺：'+missing.join('、')+'。限定奖励可能来自战斗、事件或结算，勿盲走问号。';}else if(targets.length){advice='核心目标已齐：优先安全战斗 / 经费';reason='推导建议，按实际地图调整。';}if(pg.event&&p!=='地狱鸡')events.push(pg.event);return `<details class="r16route"><summary><b>${escapeHTML(advice)}</b></summary><p>${escapeHTML(reason)}</p>${events.map(n=>`<p>${escapeHTML(n)}</p>`).join('')}<details><summary>事件 / 奖励来源与战斗提示</summary>${[pg.combat,pg.warning,pg.shop].filter(Boolean).map(n=>`<p>${escapeHTML(n)}</p>`).join('')}${verifiedPackPanel()}<a href="https://www.limbuscompany.tools/mirror-dungeon" target="_blank">卡包事件目录 ↗</a> <button data-open="bosses">BOSS攻略</button></details></details>`}
const r16Toggle=toggleGift;toggleGift=n=>{if(!state.r12Prediction.includes(canonical(n)))r16Toggle(n)};
const r16SelectPack=selectPack;selectPack=n=>{r16Ensure();if(n&&floorAllowed(n)!==false)state.r16Visited[r16Key()][state.floor]=n;r16SelectPack(n)};
$('sheetBody').addEventListener('click',e=>{if(e.target.closest('[data-r12-start]')){state.r16Plans[r16Key()]=r16Baseline();state.r16Visited[r16Key()]={};update()}});

const r14PreviousSheet=renderSheet;
renderSheet=()=>{const f=state.floor;if(!f){if(r14LastFloor!==0)r14Index=0;r14LastFloor=0;r14LastTeam=state.team;const tmp=document.createElement('div');tmp.innerHTML=r12Setup();const cards=[...tmp.querySelectorAll(':scope > .panelCard')];cards[3].append(tmp.querySelector('[data-r12-start]'));r15Rail(['阵容','玩法','星光 / 初始','预测','饰品','完整路线'],[cards[0].outerHTML,r21Play(),cards[1].outerHTML,cards[2].outerHTML,r27GiftsPage(),cards[3].outerHTML]);return;}
 if(f!==r14LastFloor||state.team!==r14LastTeam){r14Index=0;r13Cat='';}r14LastFloor=f;r14LastTeam=state.team;
 document.body.classList.add('r14run');document.body.classList.remove('r13shop');
 const d=source(),p=activePack(),pg=packGuide()||{},targets=[...new Set([...r17Targets(p).map(x=>x[0]),...packTargets(p),...activeGifts()].map(canonical))].filter(n=>!(state.team==='wedgeVideo'&&n==='翼形蜡烛'));
 const notes=[pg.priorityNode,pg.event,pg.combat,pg.warning,pg.goal||d?.goal].filter(Boolean);
 const panels=[`<div class="r14packrow">${packCandidates().slice(0,3).map(packCard).join('')}</div><p class="r14note">${escapeHTML(pg.goal||d?.goal||'按实际候选选择')}</p><button data-r13-detail="route">其他卡包 / 全15层路线 ›</button>`,
 r16RouteAdvice(p,pg,targets)+`<div class="r14giftgrid">${targets.map((n,i)=>r21Tile(n,got(n)?'已获得':i===0?'优先':'目标',p)).join('')||'<p>暂无已核实的固定目标</p>'}</div>`,
 r13Shop().replace('<button data-r13-page="floor">‹ 本层</button>',''),r16Checklist()];
 r15Rail(r14Names,panels);
};
function r15Rail(names,panels){
 document.body.classList.add('r14run');
 $('sheetBody').innerHTML=`<nav class="r14nav" aria-label="攻略阶段"><button id="r14Left" aria-label="上一页">‹</button>${names.map((n,i)=>`<button data-r14-tab="${i}">${n}</button>`).join('')}<button id="r14Right" aria-label="下一页">›</button></nav><div id="r14Rail" class="r14rail" tabindex="0" aria-label="左右滚动查看各阶段">${panels.map((html,i)=>`<section class="r14page" aria-label="${names[i]}">${html}</section>`).join('')}</div>`;
 const rail=$('r14Rail');r14Nav(r14Index,false);rail.addEventListener('scroll',()=>{if(!rail.clientWidth)return;if(r14Pending!==null){if(Math.abs(rail.scrollLeft-r14Pending*rail.clientWidth)<2){r14Pending=null;clearTimeout(r14PendingTimer)}return}r14Index=Math.max(0,Math.min(rail.children.length-1,Math.round(rail.scrollLeft/rail.clientWidth)));r14SyncNav()},{passive:true});
 rail.addEventListener('wheel',e=>{if(e.ctrlKey||e.target.closest('select,input'))return;const pane=rail.children[r14Index];if(!pane)return;if(Math.abs(e.deltaX)>Math.abs(e.deltaY))return; // native trackpad horizontal scroll
 // Vertical content stays readable: scroll it first; at the edge, wheel advances a page.
 if(!e.shiftKey&&pane.scrollHeight>pane.clientHeight+2&&((e.deltaY>0&&pane.scrollTop+pane.clientHeight<pane.scrollHeight-2)||(e.deltaY<0&&pane.scrollTop>2)))return;
 e.preventDefault();const now=Date.now();if(now-r14Wheel<350||Math.abs(e.deltaY)<1)return;r14Wheel=now;r14Nav(r14Index+Math.sign(e.deltaY));},{passive:false});
 rail.addEventListener('keydown',e=>{if(e.target!==rail)return;if(e.key==='ArrowRight'||e.key==='ArrowLeft'){e.preventDefault();r14Nav(r14Index+(e.key==='ArrowRight'?1:-1))}});
};
$('sheetBody').addEventListener('click',e=>{const t=e.target.closest('[data-r14-tab]');if(t)r14Nav(+t.dataset.r14Tab);else if(e.target.closest('#r14Left'))r14Nav(r14Index-1);else if(e.target.closest('#r14Right'))r14Nav(r14Index+1);});
const r14Update=update;update=()=>{if(!currentRef)state.expanded=true;r14Update();document.body.classList.toggle('r14run',!currentRef);document.body.classList.remove('r13compact','r13shop');};
window.addEventListener('resize',()=>{if($('r14Rail'))r14Nav(r14Index,false)});
// ===== R22：新开一局、三档窗口（一条框）、合成材料、制约页签、商店“实用”、收集核对不跳走、卡片变矮 =====
state.r22Adv=state.r22Adv||{};
const ADV=window.MD_ADVERSITIES||{floors:{}},USEFUL=window.MD_USEFUL_GIFTS||[];
const r22Latin=s=>/[A-Za-z]{3}/.test(String(s||''));
// 资料库里少数来源还是英文：显示时换成中文
const R22_SRC_ZH={'T Corp. Time Prepayment Apparatus':'T公司时间预付装置（隐藏头目）','Audio Logs of That Day':'那一日的录音（隐藏头目）','Defeat a Hidden Boss during Mirror of Names and Spiders':'击败隐藏头目','The Knight of Despair':'绝望的骑士（头目）','Have You Become Strong':'你变强了吗'};
const r22KbRaw=r21Kb;r21Kb=n=>{const k=r22KbRaw(n);if(!k||!k.packs||!r22Latin(k.packs))return k;return {...k,packs:k.packs.split('；').map(x=>R22_SRC_ZH[x]||x).join('；')}};
// 饰品卡片：横排（左图标，右边两行字），高度约为原来一半
function r22Tile(n,o={}){n=canonical(n);const name=escapeHTML(n),pred=state.r12Prediction.includes(n),meta=r21Meta(n),src=o.note||(o.short?r21Src(n,o.p).split(' · ')[0].split('：')[0]:r21Src(n,o.p));const line1=[o.tag,meta].filter(Boolean).join(' · ');
 return `<div class="r16tile r22tile"><button class="r13tile" data-owned-gift="${name}" ${pred?'disabled':''} aria-pressed="${got(n)}" title="${name} · 点击记录已获得">${giftImage(n)}<span class="r22txt"><b>${name}${got(n)?' ✓':''}</b>${line1?`<small class="r21meta">${escapeHTML(line1)}</small>`:''}${src?`<small class="r21src">${escapeHTML(src)}</small>`:''}</span></button><button class="r16info" data-item="${name}" title="效果、获取方式、合成材料">详情</button></div>`}
r13Tile=(n,extra='')=>r22Tile(n,{tag:String(extra||'').split(' · ').filter(t=>t&&!/级$/.test(t)).join(' · ')});
r21Tile=(n,extra,p,short)=>r22Tile(n,{tag:extra,p,short});
// 合成：写出材料
function r22Parts(n){const k=r21Kb(n);if(k&&k.recipe)return [k.recipe.split(/[＋+]/).map(s=>s.trim()).filter(Boolean)];return getRecipes(n).map(r=>r.map(canonical))}
const r22OldSrc=r21Src;r21Src=(n,p)=>{const s=r22OldSrc(n,p);if(s==='固定合成'){const r=r22Parts(n)[0];return r&&r.length?'合成：'+r.join('＋'):s}return s};
function r22HowLine(n){const k=r21Kb(n);if(!k)return '获取方式未收录';const ev=(k.obtain||[]).find(o=>o.when!=='fail')||(k.obtain||[])[0];
 if(ev){const ps=[...new Set((k.obtain||[]).filter(o=>o.when!=='fail').map(o=>o.pack.replace(/ 复刻$/,'')))];return `${ps.slice(0,2).join('、')}（含复刻）的问号事件${ev.check?'（'+ev.check+'检定）':''}`.replace(/（含复刻）/,(k.obtain||[]).some(o=>/复刻$/.test(o.pack))?'（含复刻）':'')}if(k.recipe)return '也要合成：'+k.recipe;if(k.type==='通用')return '通用：战斗奖励 / 任意商店 / 随机合成';if(k.packs)return '卡包专属：'+k.packs.split('；')[0]+'（本包商店、通关可选）';return '获取方式未收录'}
function r22PartRows(n,depth,seen){const rs=r22Parts(n);if(!rs.length||depth>2)return '';return rs.map((r,i)=>`<div class="r22recipe" style="margin-left:${(depth-1)*14}px">${rs.length>1?`<small>配方 ${i+1}</small>`:''}${r.map(m=>{const meta=r21Meta(m);const sub=!seen.has(m)&&depth<2?r22PartRows(m,depth+1,new Set([...seen,m])):'';return `<button class="r22ing" data-item="${escapeHTML(m)}">${giftImage(m)}<span><b>${escapeHTML(m)}${got(m)?' ✓':''}</b><small>${escapeHTML(meta||'等级未收录')}</small><small class="r21src">${escapeHTML(r22HowLine(m))}</small></span></button>${sub}`}).join('')}</div>`).join('')}
r21ObtainCard=n=>{n=canonical(n);const k=r21Kb(n);const rs=r22Parts(n);if(!k&&!rs.length)return '';
 const rows=((k&&k.obtain)||[]).map(o=>`<p>· <b>${escapeHTML(o.pack)}</b> ${r22Latin(o.event)?'的问号事件':'问号事件「'+escapeHTML(o.event)+'」'}，选项${escapeHTML(o.option)}：${o.check?escapeHTML(o.check)+'检定'+(o.when==='fail'?'失败也能拿到':'成功获得'):'直接获得'}${o.deadly?'（⚠ 检定失败会让检定的人格阵亡）':''}</p>`);
 const extra=[];if(k&&k.type==='通用')extra.push('通用饰品：战斗后的奖励卡、任意商店、随机合成都可能出现');
 else if(k&&k.packs)extra.push('卡包专属（'+k.packs.replace(/；/g,'、')+'）：走到这个卡包的楼层时，商店可能刷到；也可能在通关可选奖励里');
 const recipe=rs.length?`<p><b>合成材料</b>（在商店的“合成”里放入下面的饰品）</p>${r22PartRows(n,1,new Set([n]))}`:'';
 return `<div class="panelCard"><b>获取方式</b>${rows.join('')}${extra.map(t=>`<p>· ${escapeHTML(t)}</p>`).join('')}${recipe}<p class="minor">问号事件来自 wiki 卡包页面；其余为 wiki 通用规则和视频作者的说法。</p></div>`};
// 商店：“实用”——不在核对表里，但新手买了也有用的通用饰品
function r22Useful(){const rows=USEFUL.filter(([n,,,teams])=>(!teams||teams.includes(state.team))&&!['S','A'].includes(teamGrade(canonical(n))));
 return ['回血','理智','增伤','经济'].map(c=>{const a=rows.filter(r=>r[1]===c);if(!a.length)return '';return `<h3>${c}${c==='经济'&&state.floor>=8?' <small>后期再买不太划算</small>':''}</h3><div class="r13tiles">${a.map(([n,,why])=>r22Tile(n,{tag:got(canonical(n))?'已获得':'',note:why})).join('')}</div>`}).join('')}
r21Chips=()=>{const ks=[...(TEAM_PICKS[state.team]?.keywords||[]),'通用','实用','本队推荐'];return `<div class="r21chips">${ks.map(c=>`<button data-r21-cat="${escapeHTML(c)}" class="${r13Cat===c?'on':''}" ${c==='实用'?'title="不在核对表里，但回血、回理智、增伤、省钱的通用饰品"':''}>${c==='本队推荐'?'全部推荐':escapeHTML(c)}</button>`).join('')}</div>`};
const r22OldShop=r13Shop;r13Shop=()=>{if(r13Cat==='实用')return `<div class="r13shophead"><b>商店 · ${escapeHTML(TEAM_SHORT[state.team]||'')} · 实用</b></div>${r21Chips()}<section class="r20floorshop">${r22Useful()}</section><small class="minor">AI 总结（依据 wiki 效果）</small>`;return r22OldShop().split('AI 根据视频总结').join('AI 总结')};
// 制约（第 11–15 层）
function r22AdvList(f){return (ADV.floors[f]||[]).map(x=>{const t=x.team&&x.team[state.team];return {...x,adv:t?t[0]:x.advice,why:t?t[1]:x.why}})}
function r22AdvTotal(){const s=state.r22Adv[state.team]||{};let n=0;for(const f of [11,12,13,14,15])for(const x of ADV.floors[f]||[])if(s[f+':'+x.id])n+=x.points;return n}
function r22AdvPanel(){const f=state.floor,list=r22AdvList(f),s=state.r22Adv[state.team]||{};const order={ok:0,maybe:1,avoid:2},label={ok:'建议选',maybe:'看情况',avoid:'尽量避开'};
 const okPts=list.filter(x=>x.adv==='ok').reduce((a,x)=>a+x.points,0);
 return `<div class="r22adv"><div class="r22advhead"><b>第${f}层制约</b><small>第${f-1}层打完、进入本层时选 · 绿色合计 ${okPts} 分 · 全程已勾 ${r22AdvTotal()}/60 分</small></div>${[...list].sort((a,b)=>order[a.adv]-order[b.adv]).map(x=>`<label class="r22advrow adv-${x.adv}" title="${escapeHTML(x.rule)}"><input type="checkbox" data-r22-adv="${f}:${x.id}" ${s[f+':'+x.id]?'checked':''}><span><b>${escapeHTML(x.name)} <i>+${x.points}分 · ${label[x.adv]}</i></b><small>${escapeHTML(x.rule)}</small><small class="why">${escapeHTML(x.why)}</small></span></label>`).join('')}<p class="minor">${state.r12Goal==='gifts'?'':'目标是稳定通关：只选绿色，或者一个都不选。'}成就需要全程至少 50 分。勾选只是帮你记分。AI 总结（依据 wiki 规则，视频作者没有逐项讲）</p></div>`}
r17TrialLine=()=>`<div class="r17trialline" title="机制推导排序，须结合数值及附加效果">强化：①防御 ②生命 ③伤害 ④攻等 ⑤拼点/基础/最终 ⑥硬币</div>${state.floor>=11?'<p class="minor">高层制约：看「制约」页签</p>':''}`;
// 页签：11–15 层加“制约”；重画时保留每页的滚动位置和展开状态（收集核对里点饰品不再跳回顶部）
const r22Rail=r15Rail;let r22RailKey='';
r15Rail=(names,panels)=>{if(state.floor>=11&&names===r14Names){names=[...names,'制约'];panels=[...panels,r22AdvPanel()]}
 const key=state.team+'|'+state.floor+'|'+names.join(),old=$('r14Rail');let keep=null;
 if(old&&key===r22RailKey)keep=[...old.children].map(p=>({top:p.scrollTop,open:[...p.querySelectorAll('details')].map(d=>d.open)}));
 r22RailKey=key;r22Rail(names,panels);
 if(keep)[...$('r14Rail').children].forEach((p,i)=>{const k=keep[i];if(!k)return;p.querySelectorAll('details').forEach((d,j)=>{if(j<k.open.length)d.open=k.open[j]});p.scrollTop=k.top})};
$('sheetBody').addEventListener('change',e=>{const a=e.target.closest('[data-r22-adv]');if(!a)return;const s=state.r22Adv[state.team]=state.r22Adv[state.team]||{};if(a.checked)s[a.dataset.r22Adv]=1;else delete s[a.dataset.r22Adv];persist();update()});
// 新开一局
function r22NewRun(){if(!confirm('新开一局：清空「'+(TEAM_SHORT[state.team]||'')+'」的已获得饰品、卡包记录、商店记录、手动换过的路线和制约勾选？\n队伍、配队方案、路线目标和窗口设置会保留。'))return;
 const t=state.team;state.ownedGifts[t]=[];state.completedPacks[t]=[];if(state.shopOffers)state.shopOffers[t]={};if(state.packOffers)state.packOffers[t]={};if(state.r7History)state.r7History[t]={};if(state.r8BossChecks)state.r8BossChecks[t]={};
 state.packChoice={};state.r22Adv[t]={};state.r16Plans[r16Key()]=r16Baseline();state.r16Visited[r16Key()]={};r13Cat='';persist();jump(0)}
document.addEventListener('click',e=>{if(e.target.closest('[data-r22-newrun]')){e.preventDefault();r22NewRun()}});
const r22OldSetup=r12Setup;r12Setup=()=>r22OldSetup().replace('<div class="panelCard"><b>① 阵容</b>','<div class="panelCard"><b>① 阵容</b> <button class="r22newrun" data-r22-newrun="1" title="清空本队的饰品、卡包、商店、路线记录">↻ 新开一局</button>');
const r22OldRef=renderReference;renderReference=()=>{r22OldRef();if(currentRef?.kind==='r13detail'&&currentRef.item==='settings'){const c=$('refBody').querySelector('.panelCard');if(c)c.insertAdjacentHTML('afterbegin','<button class="r22newrun" data-r22-newrun="1">↻ 新开一局（清空本队记录）</button> ')}};
// 工具栏：一条框信息、队伍选择框收成小标签
(()=>{if(!document.querySelector('.toolbar'))return;
 $('team').insertAdjacentHTML('afterend','<button type="button" id="r22team" title="切换队伍"></button>');
 $('next').insertAdjacentHTML('afterend','<span id="r22strip" title="按住拖动窗口"></span><button type="button" id="r22unstrip" title="恢复迷你条">▾</button>');
 $('r22team').onclick=()=>{document.body.classList.add('r22teamOpen');$('team').focus()};
 $('team').addEventListener('change',()=>document.body.classList.remove('r22teamOpen'));
 $('team').addEventListener('blur',()=>setTimeout(()=>document.body.classList.remove('r22teamOpen'),150));
 $('r22unstrip').onclick=()=>window.MD_WINDOW?.setMode('compact');})();
function r22StripPaint(){const el=$('r22strip');if(!el)return;if(!state.floor){el.innerHTML='<b>开局准备 · 点 ▾ 展开</b>';return}
 const p=activePack(),src=p&&packIcon(p),goal=p?r17Targets(p).map(x=>x[0]).find(n=>!got(n)):'';
 el.innerHTML=`${src?`<img src="${escapeHTML(src)}" alt="">`:''}<b>${escapeHTML(p||'未选卡包')}</b>${goal?`<span class="r22stripgift" title="本层目标：${escapeHTML(goal)}">${giftImage(goal)}<span><small>${escapeHTML(goal)}</small><small class="r22stripsrc">${escapeHTML(r21Src(goal,p)||'')}</small></span></span>`:''}`}
const r22Update=update;update=()=>{r22Update();document.body.classList.toggle('r22run',state.floor>0);const tc=$('r22team');if(tc)tc.textContent=(TEAM_SHORT[state.team]||'队伍')+' ▾';r22StripPaint()};
// ===== R23：精简模式、窗口设置收进 ⋯ =====
// 小指良某些楼层借用了烧震的卡包说明，换成本队说明
const r23OldGuide=packGuide;packGuide=()=>{const g=r23OldGuide();if(isPinky()&&g&&/烧震|呼震|楔子/.test(g.goal||'')){const d=source();return {...g,goal:d?.goal||'按实际候选选择'}}return g};
// 精简：隐藏“缺：”、说明句、路线说明、饰品获取方式
function r23Lean(){document.body.classList.toggle('r23lean',!!state.r23Lean);const b=$('r23lean');if(b){b.classList.toggle('on',!!state.r23Lean);b.title=state.r23Lean?'精简已开：点一下显示缺什么、说明和获取方式':'精简：隐藏缺什么、说明句和获取方式'}}
(()=>{if(!$('settings'))return;
 $('settings').insertAdjacentHTML('beforebegin','<button type="button" id="r23lean">简</button>');
 $('r23lean').onclick=()=>{state.r23Lean=!state.r23Lean;persist();r23Lean()};r23Lean();})();
// ⋯ 里的窗口设置（置顶、透明度、穿透）
function r23WinCard(v){if(!v)return '';const pct=Math.round((v.opacity||.92)*100);
 return `<div class="panelCard r23win"><b>窗口</b><div class="r23winrow"><button type="button" data-r23-top="1" class="${v.alwaysOnTop?'on':''}">📌 始终置顶${v.alwaysOnTop?'：开':'：关'}</button><button type="button" data-r23-pass="1" title="穿透后按 Ctrl+Alt+F8 恢复点击">穿透（点不到窗口）</button></div><label class="r23winrow">透明度 <input type="range" min="35" max="100" value="${pct}" data-r23-alpha="1"> <span>${pct}%</span></label><p class="minor">▁ 缩成一条 · ▣ 迷你 / 展开（都会回到标准大小）· – 隐藏（Ctrl+Alt+F9 恢复）</p></div>`}
const r23OldRef=renderReference;renderReference=()=>{r23OldRef();if(currentRef?.kind==='r13detail'&&currentRef.item==='settings'&&window.MD_WINDOW?.get){window.MD_WINDOW.get().then(v=>{const body=$('refBody');if(!body||body.querySelector('.r23win'))return;const c=body.querySelector('.panelCard');const h=r23WinCard(v);if(c)c.insertAdjacentHTML('beforebegin',h);else body.insertAdjacentHTML('afterbegin',h)})}};
document.addEventListener('click',e=>{const W=window.MD_WINDOW;if(!W?.get)return;
 if(e.target.closest('[data-r23-top]')){W.get().then(v=>W.setTop(!v.alwaysOnTop)).then(v=>{const b=document.querySelector('[data-r23-top]');if(b&&v){b.classList.toggle('on',v.alwaysOnTop);b.textContent='📌 始终置顶'+(v.alwaysOnTop?'：开':'：关')}})}
 else if(e.target.closest('[data-r23-pass]'))W.setPass();});
document.addEventListener('input',e=>{const r=e.target.closest?.('[data-r23-alpha]');if(!r||!window.MD_WINDOW?.setOpacity)return;r.nextElementSibling.textContent=r.value+'%';window.MD_WINDOW.setOpacity(Number(r.value)/100)});
// 换层条（方案 B 细版）：‹ 上一层 | 第 N 层 / 15 | 下一层 ›；一条框里仍用工具栏的 ‹ 楼层 ›
(()=>{const tb=document.querySelector('#app .toolbar');if(!tb||$('r23floors'))return;
 let opts='';for(let n=0;n<=15;n++)opts+='<option value="'+n+'">'+(n?'第 '+n+' 层 / 15':'开局准备')+'</option>';
 tb.insertAdjacentHTML('afterend','<nav id="r23floors" aria-label="换层"><button type="button" id="r23prev">‹ 上一层</button><select id="r23floor" aria-label="跳到楼层">'+opts+'</select><button type="button" id="r23next">下一层 ›</button></nav>');
 $('r23prev').onclick=()=>jump(state.floor-1);$('r23next').onclick=()=>jump(state.floor+1);$('r23floor').onchange=e=>jump(Number(e.target.value));})();
function r23FloorsPaint(){if(!$('r23floors'))return;$('r23floor').value=String(state.floor);$('r23prev').disabled=state.floor<=0;$('r23next').disabled=state.floor>=15}
const r23Update=update;update=()=>{r23Update();r23FloorsPaint()};
// R23：小指良的“不用特意找”、开局经济备选、阵营 / 顺位提醒（数据在 team-picks.js 的 skip / economy / notes）
function r23Skip(){const p=TEAM_PICKS[state.team];if(!p?.skip?.length)return '';return `<details class="r23skip"><summary>不用特意找（作者原话 / 随缘）</summary><div class="r13tiles">${p.skip.map(([n,why])=>r22Tile(n,{tag:'不用特意找',note:why})).join('')}</div></details>`}
const r23OldShop=r13Shop;r13Shop=()=>{const h=r23OldShop();const s=r23Skip();if(!s)return h;const i=h.lastIndexOf('<small class="minor">');return i>0?h.slice(0,i)+s+h.slice(i):h+s};
const r23OldObtain=r21ObtainCard;r21ObtainCard=n=>{const h=r23OldObtain(n);const c=canonical(n),p=TEAM_PICKS[state.team]||{};const note=p.notes?.[c],skip=(p.skip||[]).find(x=>x[0]===c);if(!note&&!skip)return h;
 return h+`<div class="panelCard r23note"><b>${escapeHTML(TEAM_SHORT[state.team]||'本队')}提醒</b>${skip?`<p>· 不用特意找：${escapeHTML(skip[1])}</p>`:''}${note?`<p>· ${escapeHTML(note)}</p>`:''}<p class="minor">按 wiki 效果和作者截图整理。</p></div>`};
const r23OldSetup=r12Setup;r12Setup=()=>{const h=r23OldSetup();const p=TEAM_PICKS[state.team];if(!p?.economy?.length)return h;
 return h+`<div class="panelCard r23econ"><b>开局观测 · 经济备选</b><div class="r13tiles">${p.economy.map(([n,why])=>r22Tile(n,{tag:got(canonical(n))?'已获得':'',note:why})).join('')}</div></div>`};
// 小指良：卡包页在说明句下面再显示本层的路线提示（map 字段，例如无改变者、软柿子列表）
function r23PinkyMap(){if(!(isPinky()||SOLO())||!state.floor)return;const d=source();const n=document.querySelector('.r14page .r14note');if(!d?.map||!n||n.parentElement.querySelector('.r23map'))return;const risk=/阵亡|100%体力/.test(d.avoid||'')?`<p class="r23risk">⚠ ${escapeHTML(d.avoid)}</p>`:'';n.insertAdjacentHTML('afterend',`<p class="r14note r23map">${escapeHTML(d.map)}</p>${risk}`)}
const r23Update2=update;update=()=>{r23Update2();r23PinkyMap()};
// 修正：经济备选放进“预测”页里，不再多出一个没有页签的第 6 页
r12Setup=(()=>{const prev=r23OldSetup;return ()=>{const h=prev();const p=TEAM_PICKS[state.team];if(!p?.economy?.length)return h;const t=document.createElement('div');t.innerHTML=h;const card=[...t.querySelectorAll(':scope > .panelCard')].find(c=>c.querySelector('b')?.textContent.includes('预测'));if(!card)return h;
 card.insertAdjacentHTML('beforeend',`<div class="r23econ"><b>开局观测 · 经济备选</b><div class="r13tiles">${p.economy.map(([n,why])=>r22Tile(n,{tag:got(canonical(n))?'已获得':'',note:why})).join('')}</div></div>`);return t.innerHTML}})();
// 修正：点队伍标签后标签自己藏起来，直接弹出队伍选择框，不会同时出现两个
(()=>{const chip=$('r22team'),sel=$('team');if(!chip||!sel)return;chip.onclick=()=>{document.body.classList.add('r22teamOpen');sel.focus();try{sel.showPicker()}catch{}};})();
// R23：预测（开局观测）通用规则——一个卡包里本队要的关键饰品如果都已经预测了，这个包就不再占路线位置，换成这一层的备选包。
// 关键饰品 = 作者 S/A 推荐 + 各层目标饰品 + 合成饰品的材料（最多三层），减去“不用特意找”。卡包归属来自 wiki 资料库。
var r23KeyCache={};
function r23Keys(team){if(r23KeyCache[team])return r23KeyCache[team];const K=window.MD_KB_GIFTS||{},EN=window.MD_KB_EN||{},p=TEAM_PICKS[team]||{};
 const skip=new Set((p.skip||[]).map(x=>x[0]));const keys=new Set([...(p.S||[]),...(p.A||[])]);(STORE[team]||[]).forEach(f=>f&&(f.gifts||[]).forEach(g=>keys.add(canonical(g))));
 const kb=n=>K[EN[n]];const add=(n,d)=>{if(d>3)return;const r=kb(n)?.recipe;if(r)r.split('＋').forEach(x=>{x=x.trim();if(x&&!keys.has(x)){keys.add(x);add(x,d+1)}})};[...keys].forEach(n=>add(n,1));
 const map={};for(const g of keys){if(skip.has(g))continue;const ps=kb(g)?.packs;if(!ps)continue;ps.split('；').map(x=>x.replace(/\s/g,'')).filter(Boolean).forEach(x=>(map[x]=map[x]||new Set()).add(g))}
 // 只能在某个卡包里合成的饰品（wiki 卡包页的合成栏）：未寄出的信 = 破损的雨伞＋破碎的眼镜，在无改变者合成
 for(const [g,pk] of [['未寄出的信','无改变者']])if(keys.has(g)&&!skip.has(g))(map[pk]=map[pk]||new Set()).add(g);
 return r23KeyCache[team]=map}
function r23Wasted(n,pred){const m=r23Keys(state.team)[n];if(!m||!m.size)return false;const a=pred||state.r12Prediction||[];return [...m].every(g=>a.includes(g))}
function r23Reroute(plan){const out=[...plan];for(let i=0;i<out.length;i++){const n=out[i],f=i+1;if(!n||!r23Wasted(n))continue;
  const near=[f,f+1,f-1,f+2,f+3].flatMap(x=>STORE[state.team]?.[x]?.packs||[]);
  const alt=near.find(x=>x!==n&&!out.includes(x)&&!r23Wasted(x)&&R6.canAppear(PACKAGE_INFO[x],f)!==false&&(x!=='时间杀人时间复刻'||f>=10));if(alt)out[i]=alt}
 return out}
// 给自动测试用：算某队在某组预测下的路线（不改动实际存档）
window.MD_ROUTE_CHECK=Object.freeze({plan:(team,pred)=>{const keep={team:state.team,pred:state.r12Prediction,choice:state.packChoice,floor:state.floor};try{state.team=team;state.r12Prediction=[...pred];state.packChoice={};return r12Plan()}finally{state.team=keep.team;state.r12Prediction=keep.pred;state.packChoice=keep.choice;state.floor=keep.floor}},
 keys:team=>Object.fromEntries(Object.entries(r23Keys(team)).map(([k,v])=>[k,[...v]])),tier:team=>({S:[...(TEAM_PICKS[team]?.S||[])],A:[...(TEAM_PICKS[team]?.A||[])]}),options:team=>[...r12OptsFor(team||state.team)]});
// ===== R24：五个单通队伍（数据：solo-teams.js）=====
// 路线：前4层按作者省流图（被预测“用不着”的包换成同层备选）；5–10层从“必去 → 可选”里按优先级挑6个，再按楼层顺序排（时杀复刻放最后）；11–15层先值得去的包，再软柿子
function soloPlan(){const t=SOLO(),a=state.r12Prediction||[],waste=n=>r23Wasted(n,a);
 const first=t.first.map((p,i)=>waste(p)?(t.alts[i+1]||[]).find(x=>!waste(x))||p:p);
 const cand=[...new Set([...t.mid.must,...t.mid.optional])].filter(n=>!waste(n)&&!t.avoid.includes(n)&&!first.includes(n));
 // 呼吸法二选一（作者：不思观望要有呼破支援，否则去重新开园的拉·曼却领）：只留排在前面的那个
 const pair=['不思观望','重新开园的拉·曼却领'],firstOf=cand.find(n=>pair.includes(n));for(const n of pair)if(n!==firstOf){const i=cand.indexOf(n);if(i>=0)cand.splice(i,1)}
 const six=cand.slice(0,6),mid=t.mid.order.filter(n=>six.includes(n));
 const late=[...t.late,...t.soft].filter(n=>!waste(n)&&!t.avoid.includes(n)&&!mid.includes(n));
 return [...first,...mid,...[...new Set(late)]].slice(0,15)}
// 收集核对：本队 S 级饰品按路线里所在的楼层；合成成品放在材料都到手的那一层
function soloChecklist(){const t=SOLO(),plan=r12Plan(),S=window.MD_TEAM_PICKS[state.team]?.S||[],out=[],at=n=>{for(let i=0;i<plan.length;i++)if(t.packGifts(plan[i]).some(x=>x[0]===n))return i+1;return 0};
 for(const n of S){const f=at(n);if(f)out.push([n,f])}
 for(const n of t.fusion){const r=r22Parts(n)[0]||[];const fs=r.map(x=>(state.r12Prediction||[]).includes(canonical(x))||r21Kb(canonical(x))?.type==='通用'?1:at(canonical(x)));if(r.length&&fs.every(Boolean))out.push([n,Math.max(...fs)])}
 return out}
// 卡包里的本队目标（详情、缺什么、商店“本层卡包专属”都用这个）
const r24OldTargets=r17Targets;r17Targets=p=>{const t=SOLO();if(!t)return r24OldTargets(p);return t.packGifts(p).map(([n,g])=>[n,g])};
// 阵容方案：单通队只有一种
const r24OldVarKey=r21VarKey;r21VarKey=()=>SOLO()?'full':r24OldVarKey();
const r24OldVarSel=r21VariantSelect;r21VariantSelect=()=>SOLO()?(SOLO().kind==='组队'?'<small class="minor">组队：按下面的阵容编入</small>':'<small class="minor">单通：核心人格1号位单独上场</small>'):r24OldVarSel();
// 卡包说明跟着实际走的包变：本队对这个包的说明、风险
const r24OldGuide=packGuide;packGuide=()=>{const t=SOLO();if(!t)return r24OldGuide();const p=activePack();const base=PACKAGE_INFO[p]||{};return {...base,name:p,goal:t.packNoteOf(p)||base.goal||'按实际候选选择',warning:t.packs[p]?.risk||'',gifts:t.packGifts(p).filter(x=>x[1]!=='B').map(x=>x[0]),audit:base.audit}};
// 卡包页：说明句下面显示本层路线提示和风险（跟着实际卡包）
const r24OldPinkyMap=r23PinkyMap;r23PinkyMap=()=>{const t=SOLO();if(!t)return r24OldPinkyMap();if(!state.floor)return;const d=source(),n=document.querySelector('.r14page .r14note');if(!n||n.parentElement.querySelector('.r23map'))return;const p=activePack(),risk=t.packs[p]?.risk||'';
 n.insertAdjacentHTML('afterend',`${d?.map?`<p class="r14note r23map">${escapeHTML(d.map)}</p>`:''}${risk?`<p class="r23risk">⚠ ${escapeHTML(risk)}</p>`:''}`)};
// 表格类数据补上五队
for(const [id,t] of Object.entries(window.MD_SOLO_TEAMS||{})){const pk=window.MD_TEAM_PICKS[id]||{S:[],A:[]};
 if(!CORE_GOALS[id])CORE_GOALS[id]=[...pk.S];
 if(!PACK_TARGETS[id])PACK_TARGETS[id]=Object.fromEntries([...t.used].map(p=>[p,t.packGifts(p).filter(x=>x[1]!=='B').map(x=>x[0])]).filter(x=>x[1].length));
 if(!RANK[id])RANK[id]=pk.S.map(n=>[n,'核心'])}
// 开局页：8 支队伍的头像卡片（之后各层用顶栏小标签切换）
function r24TeamImgs(id){const L=window.MD_TEAM_LINEUPS?.[id],IMG=window.MD_IDENTITY_IMG||{};const pick={burnVideo:['dawnFaust','thumbRodion'],wedgeVideo:['wedgeOutis','dawnGregor'],pinkyVideo:['blade']}[id]||window.MD_SOLO_TEAMS?.[id]?.cardIds||['core'];return pick.map(k=>L?.ids?.[k]).filter(Boolean).map(m=>({src:IMG[m.wiki],alt:m.cn}))}
function r24TeamCards(){const kind=id=>window.MD_SOLO_TEAMS?.[id]?(window.MD_SOLO_TEAMS[id].kind||'单通'):id==='pinkyVideo'?'伪单通':'组队';const name=id=>window.MD_SOLO_TEAMS?.[id]?.card||{burnVideo:'烧震',wedgeVideo:'呼震',pinkyVideo:'小指良'}[id]||TEAM_SHORT[id];
 const D=window.MD_SOLO_TEAMS||{},order=[...TEAM_IDS].sort((a,b)=>(kind(a)==='组队'?0:1)-(kind(b)==='组队'?0:1));return `<div class="r24teams" role="radiogroup" aria-label="选择队伍">${order.map(id=>{const imgs=r24TeamImgs(id);return `<button type="button" class="r24team${id===state.team?' on':''}" data-r24-team="${id}" role="radio" aria-checked="${id===state.team}" title="${escapeHTML(TEAM_SHORT[id]||id)}"><span class="r24imgs n${imgs.length}">${imgs.map(m=>m.src?`<img src="${escapeHTML(m.src)}" alt="${escapeHTML(m.alt)}">`:'').join('')}</span><span class="r24txt"><b>${escapeHTML(name(id))}</b><small>${kind(id)}</small></span></button>`}).join('')}</div>`}
const r24OldSetup=r12Setup;r12Setup=()=>{const h=r24OldSetup();const i=h.indexOf('<div class="panelCard"><b>① 阵容</b>');if(i<0)return h;const j=h.indexOf('</b>',i)+4;return h.slice(0,j)+r24TeamCards()+h.slice(j)};
document.addEventListener('click',e=>{const b=e.target.closest('[data-r24-team]');if(!b)return;const id=b.dataset.r24Team;if(!TEAM_IDS.includes(id)||id===state.team)return;const sel=$('team');if(sel){sel.value=id;sel.dispatchEvent(new Event('change',{bubbles:true}))}});
// 顶栏队伍下拉框补上五队（按组队 / 单通分组）
(()=>{const sel=$('team');if(!sel||sel.querySelector('optgroup'))return;const cur=sel.value;const g=(label,ids)=>`<optgroup label="${label}">${ids.map(id=>`<option value="${id}">${escapeHTML({burnVideo:'拇指×黎明·烧震',wedgeVideo:'楔子×黎明·呼震',pinkyVideo:'小指良·伪单通'}[id]||TEAM_SHORT[id])}</option>`).join('')}</optgroup>`;
 const D=window.MD_SOLO_TEAMS||{},dk=Object.keys(D);sel.innerHTML=g('组队',['burnVideo','wedgeVideo',...dk.filter(k=>D[k].kind==='组队')])+g('单通 / 伪单通',['pinkyVideo',...dk.filter(k=>D[k].kind!=='组队')]);sel.value=TEAM_IDS.includes(state.team)?state.team:cur})();
// 自动测试：八支队伍、各队自己的预测列表
if(window.MD_ROUTE_CHECK){const R=window.MD_ROUTE_CHECK;window.MD_ROUTE_CHECK=Object.freeze({...R,teams:()=>[...TEAM_IDS],options:team=>team&&window.MD_SOLO_TEAMS?.[team]?[...window.MD_SOLO_TEAMS[team].predict.options]:R.options(team)})}
// ===== R25：烧震 / 呼震按作者路线省流图补充的卡包说明（同一部视频的截图核对）=====
const R25_NOTES={
 burnVideo:{'憎恶与绝望':'作者：3–4层限定包都不好跳过；翅膀（可用之处已尽，郁积的憎恶）到包建议拿，已观测翅膀则整包收益降低、可以不去。','盛火时节':'三黎明拿翼形蜡烛：盛火时节或解放的暴怒都行，可开局观测省位；灼热的铜管不重要。','解放的暴怒':'三黎明拿翼形蜡烛：盛火时节或解放的暴怒都行，可开局观测省位；灼热的铜管不重要。','琥珀色的黄昏':'八枪才去：没有五子弹建议直接不去；有五子弹实际也可以不去；专门组八枪要去。','肉斩骨断复刻':'可以开局观测饰品省下这个包（不拿花信的情况下）。','深夜清扫复刻':'作者：群体加减伤。','时间杀人时间复刻':'作者：建议最后走（发育到第10层再去）。','2号线':'作者：5（4）–10层个人建议必去。'},
 wedgeVideo:{'憎恶与绝望':'作者：可观测饰品省下位置；3–4层限定包都有收益。','伏行深渊':'作者：收益比较神秘，斟酌前往。鲸心＋守镇鱼叉可合万恶之终结（后台编入三位裴廓德号才激活）。','时间杀人时间复刻':'作者：建议晚点走（第10层发育较全再去），双表 Type E / Type Y。','自黎明后贯穿而来':'作者：个人建议必去（白色领巾、精心分类的药材、黑色三角帽）。','2号线':'作者：个人建议必去。','精灵童话':'风险：有强制回合结束，主C不一定每回合都能开满防御。','不思观望':'作者：这个体系实在没什么卡包好去，镜中花 / 水中月可以补暴击增伤（十二人效果达不到不算）。'}
};
const r25OldGuide=packGuide;packGuide=()=>{const g=r25OldGuide();const n=R25_NOTES[state.team]?.[activePack()];if(!n||!g)return g;return {...g,goal:[g.goal,n].filter(Boolean).join(' ')}};
// R26：阵容标题加来源
const r26OldSetup=r12Setup;r12Setup=()=>r26OldSetup().replace('<b>① 阵容</b>','<b>① 阵容</b><small class="r26src">（来源：B站UP主 锈町Rusty · 测试版，不保证完全正确）</small>');
// ===== R26：关键支援（阵容页）——符合条件的人格带头像，点一下标记“我有”，数量够了才推荐对应卡包 =====
if(!Array.isArray(state.r26Box))state.r26Box=[];
const R26_LABEL={sinking:'沉沦人格',poiseRupture:'呼吸 / 破裂人格'};
function r26Count(key){const L=window.MD_SUPPORT_IDS?.[key]||[];return L.filter(([w])=>state.r26Box.includes(w)).length}
function r26Card(){const t=SOLO();if(!t?.support?.length)return '';const IMG=window.MD_IDENTITY_IMG||{};
 return `<div class="r26sup"><b>关键支援</b><small class="minor"> 点头像标记“我有”，所有队伍共用</small>${t.support.map(s=>{const L=window.MD_SUPPORT_IDS?.[s.key]||[],have=r26Count(s.key),ok=have>=s.need;
  return `<p class="r26need ${ok?'ok':''}">${escapeHTML(R26_LABEL[s.key])}：已标记 <b>${have}</b> / 建议 ${s.need}　<small>${escapeHTML(s.why)}</small></p><details${state.r26Open===s.key?' open':''} data-r26-det="${s.key}"><summary>符合条件的人格（${L.length}）</summary><div class="r26grid">${L.map(([w,cn])=>{const on=state.r26Box.includes(w);return `<button type="button" class="r26id${on?' on':''}" data-r26-id="${escapeHTML(w)}" title="${escapeHTML(cn)}">${IMG[w]?`<img src="${escapeHTML(IMG[w])}" alt="">`:'<span class="r26noimg">?</span>'}<small>${escapeHTML(cn)}</small>${on?'<i>✓</i>':''}</button>`}).join('')}</div></details>`}).join('')}<p class="minor">名单按 wiki 人格分类；条件按饰品效果（乌云 / 镜中花 / 水中月）。</p></div>`}
const r26SupSetup=r12Setup;r12Setup=()=>{const h=r26SupSetup();const c=r26Card();if(!c)return h;const i=h.indexOf('<div class="panelCard"><b>② '),j=i>0?h.lastIndexOf('</div>',i-1):-1;return j>0?h.slice(0,j)+c+h.slice(j):h};
document.addEventListener('click',e=>{const b=e.target.closest('[data-r26-id]');if(!b)return;const w=b.dataset.r26Id,i=state.r26Box.indexOf(w);if(i<0)state.r26Box.push(w);else state.r26Box.splice(i,1);state.r26Open=b.closest('[data-r26-det]')?.dataset.r26Det||'';persist();update()});
// 标记过“我有”之后：呼破人数不够就把不思观望换成重新开园的拉·曼却领（没标记时保持作者默认）
const r26OldSolo=soloPlan;soloPlan=()=>{const p=r26OldSolo(),t=SOLO();const s=t?.support?.find(x=>x.key==='poiseRupture');if(!s||!state.r26Box.length)return p;const ok=r26Count('poiseRupture')>=s.need;const i=p.indexOf(ok?'重新开园的拉·曼却领':'不思观望');if(i>=4&&i<10){const alt=ok?'不思观望':'重新开园的拉·曼却领';if(!p.includes(alt))p[i]=alt}return p};
// 玩法页附原视频链接（B站，点击用系统浏览器打开）
const R26_VIDEO={burnVideo:['BV1VRsx6ZEnX','15牢最新拇指黎明烧伤震颤体系队'],wedgeVideo:['BV1duWk6zE5M','15牢最新瓦夜楔子事务所呼吸震颤体系队'],pinkyVideo:['BV1Mty9zfEXo','15牢最新小指良（蜘蛛巢之刃良秀）单通配队']};
function r26Video(){const t=SOLO();const v=t?[t.video,TEAM_SHORT[state.team]]:R26_VIDEO[state.team];if(!v||!/^BV[0-9A-Za-z]{10}$/.test(v[0]))return '';return `<p class="r26video">原视频：<a href="https://www.bilibili.com/video/${v[0]}" target="_blank" rel="noopener">${escapeHTML(v[1])}（B站 锈町Rusty）↗</a></p>`}
const r26OldPlay=r21Play;r21Play=()=>{const h=r26OldPlay();const v=r26Video();if(!v)return h;const i=h.lastIndexOf('</div>');return i>0?h.slice(0,i)+v+h.slice(i):h+v};
// ===== R26b：标记的支援人格显示在 1 号位旁边；完整路线里选“有 / 无不思观望配队” =====
if(!state.r26NS||typeof state.r26NS!=='object')state.r26NS={};
const R26_TAG={sinking:'支援 · 沉沦',poiseRupture:'支援 · 呼破'};
const r26OldLineup=r20Lineup;r20Lineup=()=>{const h=r26OldLineup(),t=SOLO();if(!t?.support?.length||!state.r26Box.length)return h;const IMG=window.MD_IDENTITY_IMG||{},seen=new Set(),cards=[];
 for(const s of t.support)for(const [w,cn] of (window.MD_SUPPORT_IDS?.[s.key]||[]))if(state.r26Box.includes(w)&&!seen.has(w)){seen.add(w);cards.push(`<div class="r20id r26pick" title="${escapeHTML(cn)}">${IMG[w]?`<img src="${escapeHTML(IMG[w])}" alt="${escapeHTML(cn)}">`:''}<b>${escapeHTML(cn.split(' ').slice(-1)[0])}</b><small>${R26_TAG[s.key]}</small></div>`)}
 if(!cards.length)return h;const k=h.indexOf('<div class="r20id r21extra">');const html=cards.slice(0,11).join('');return k>0?h.slice(0,k)+html+h.slice(k):h};
// 完整路线：只有需要呼破支援的队伍显示
function r26NSMode(){return state.r26NS[state.team]||'auto'}
function r26NSBox(){const t=SOLO(),s=t?.support?.find(x=>x.key==='poiseRupture');if(!s)return '';const m=r26NSMode(),have=r26Count('poiseRupture');
 const b=(v,l)=>`<button type="button" data-r26-ns="${v}" class="${m===v?'on':''}">${l}</button>`;
 return `<div class="r26ns"><b>5–10层呼吸法卡包</b><div class="r26nsrow">${b('yes','去不思观望（呼破够 '+s.need+' 人）')}${b('no','去血魔包（重新开园的拉·曼却领）')}${b('auto','自动（看我在阵容页标的支援，现在 '+have+' 人）')}</div></div>`}
const r26NSSetup=r12Setup;r12Setup=()=>{const h=r26NSSetup(),x=r26NSBox();if(!x)return h;const a='<b>完整 15 层预设</b>';const i=h.indexOf(a);return i>0?h.slice(0,i+a.length)+x+h.slice(i+a.length):h};
document.addEventListener('click',e=>{const b=e.target.closest('[data-r26-ns]');if(!b)return;state.r26NS[state.team]=b.dataset.r26Ns;persist();update()});
const r26NSOldSolo=soloPlan;soloPlan=()=>{const m=SOLO()?.support?.some(x=>x.key==='poiseRupture')?r26NSMode():'auto';if(m==='auto')return r26NSOldSolo();
 const keep=state.r26Box;state.r26Box=[];let p;try{p=r26NSOldSolo()}finally{state.r26Box=keep}
 const want=m==='yes'?'不思观望':'重新开园的拉·曼却领',other=m==='yes'?'重新开园的拉·曼却领':'不思观望';const i=p.indexOf(other);if(i>=4&&i<10&&!p.includes(want))p[i]=want;return p};
// ===== R27：新手引导——第一次打开自动弹出，一步高亮一个按钮；顶栏“?”可以重看 =====
const R27_STEPS=[
 {sel:'#r27-none',title:'测试版声明',text:'这是测试版：攻略内容是 AI 根据B站UP主 锈町Rusty 的视频整理的，不保证完全正确，请以原视频为准。发现错误欢迎反馈！',go:()=>{r27Floor(0);r27Tab(0)}},
 {sel:'.r24team.on',title:'选队伍',text:'这一排卡片是 10 支队伍，先点你要打的那一支。组队排在前面，单通 / 伪单通在后面。下面是推荐人格和关键支援。',go:()=>{r27Floor(0);r27Tab(0)}},
 {sel:'[data-r14-tab="1"]',title:'玩法',text:'这一页是这队怎么玩：核心机制、技能怎么换、带什么 EGO，最下面有原视频链接。',go:()=>{r27Floor(0);r27Tab(1)}},
 {sel:'[data-r14-tab="2"]',title:'星光 / 初始',text:'开局点哪些星光（15牢建议全部点满）、初始关键词选什么。',go:()=>{r27Floor(0);r27Tab(2)}},
 {sel:'[data-r14-tab="3"]',title:'预测饰品',text:'开局观测了哪些饰品就在这里选上，后面的路线会跟着变（已经有的饰品，就不再专门去拿它的卡包）。',go:()=>{r27Floor(0);r27Tab(3)}},
 {sel:'[data-r14-tab="4"]',title:'这局要收集的饰品',text:'按你的队伍和预测，列出这局要收集的核心饰品、推荐补强和条件 / 可选，每个写了在第几层、怎么拿。',go:()=>{r27Floor(0);r27Tab(4)}},
 {sel:'[data-r14-tab="5"]',title:'完整路线',text:'按你的队伍和预测排好的 15 层卡包，打之前先看一遍。最下面“开始镜牢”进入第 1 层。',go:()=>{r27Floor(0);r27Tab(5)}},
 {sel:'#r23floors',title:'换层',text:'进了镜牢以后，每打完一层点“下一层 ›”。点中间的楼层可以直接跳到任意一层。',go:()=>{r27Floor(1);r27Tab(0)}},
 {sel:'.r14page .packChoice.chosen',title:'这一层走哪个卡包',text:'标着“当前计划”的是推荐卡包；下面写了要拿什么、有什么风险。游戏里刷出别的包，点它就会换路线。',go:()=>{r27Floor(1);r27Tab(0)}},
 {sel:'.r14nav',title:'饰品 / 商店',text:'“饰品 / 路线”：这层要拿哪些饰品、怎么拿；“商店”：买什么；“收集核对”：拿到饰品点一下记录。',go:()=>{r27Floor(1)}},
 {sel:['#r23lean','#settings','#mdWinBtns'],title:'右上角按钮',text:'简：隐藏说明文字；⋯：置顶、透明度、鼠标穿透、新开一局，还能调字号和反馈问题（截图、发邮件给作者）；▁：缩成一条；▣：迷你 / 展开。祝打牢顺利！',go:()=>{}}
];
function r27Floor(n){if(state.floor!==n)jump(n)}
function r27Tab(i){const b=document.querySelector(`[data-r14-tab="${i}"]`);if(b&&!b.classList.contains('chosen'))b.click()}
let r27I=-1,r27Back=null;
function r27Close(){r27I=-1;document.getElementById('r27tour')?.remove();state.r27TourDone=true;persist();if(r27Back!=null){const f=r27Back;r27Back=null;r27Floor(f)}}
function r27Show(i){const s=R27_STEPS[i];if(!s)return r27Close();r27I=i;s.go();
 setTimeout(()=>{if(r27I!==i)return;const els=(Array.isArray(s.sel)?s.sel:[s.sel]).map(q=>document.querySelector(q)).filter(Boolean);const el=els[0];let box=document.getElementById('r27tour');if(!box){box=document.createElement('div');box.id='r27tour';document.body.appendChild(box)}
  const rs=els.map(e=>e.getBoundingClientRect());const r=rs.length?(()=>{const l=Math.min(...rs.map(x=>x.left)),t=Math.min(...rs.map(x=>x.top)),R=Math.max(...rs.map(x=>x.right)),B=Math.max(...rs.map(x=>x.bottom));return {left:l,top:t,width:R-l,height:B-t}})():{left:innerWidth/2-40,top:innerHeight/2-20,width:80,height:40},pad=3;
  const spot=`left:${Math.max(0,r.left-pad)}px;top:${Math.max(0,r.top-pad)}px;width:${Math.min(innerWidth,r.width+pad*2)}px;height:${Math.min(innerHeight,r.height+pad*2)}px`;
  const fitBelow=r.top+r.height+140<innerHeight,fitAbove=r.top>140,side=!fitBelow&&!fitAbove&&r.left+r.width+292<innerWidth;
  const tipTop=side?Math.max(4,Math.min(innerHeight-140,r.top)):fitBelow||!fitAbove?Math.min(innerHeight-140,r.top+r.height+8):Math.max(4,r.top-138);
  const tipLeft=side?r.left+r.width+10:Math.max(6,Math.min(innerWidth-286,r.left+r.width/2-140));
  box.innerHTML=`<div class="r27spot" style="${spot}"></div><div class="r27tip" style="top:${tipTop}px;left:${tipLeft}px"><b>${i+1} / ${R27_STEPS.length} · ${escapeHTML(s.title)}</b><p>${escapeHTML(s.text)}</p><div class="r27row"><button type="button" data-r27="skip">跳过引导</button>${i?'<button type="button" data-r27="prev">‹ 上一步</button>':''}<button type="button" data-r27="next" class="r27next">${i===R27_STEPS.length-1?'完成':'下一步 ›'}</button></div></div>`},380)}
function r27Start(){if(document.documentElement.classList.contains('mdStrip'))return;r27Back=state.floor;r27Show(0)}
document.addEventListener('click',e=>{const b=e.target.closest('[data-r27]');if(b){e.stopPropagation();const a=b.dataset.r27;if(a==='skip')r27Close();else if(a==='prev')r27Show(r27I-1);else r27Show(r27I+1);return}
},true);
document.addEventListener('keydown',e=>{if(r27I<0)return;if(e.key==='Escape')r27Close();else if(e.key==='ArrowRight'||e.key==='Enter')r27Show(r27I+1);else if(e.key==='ArrowLeft'&&r27I>0)r27Show(r27I-1)});
window.addEventListener('resize',()=>{if(r27I>=0)r27Show(r27I)});
// 给自动测试用：关掉引导
window.MD_TOUR=Object.freeze({start:()=>r27Start(),close:()=>r27Close(),done:()=>!!state.r27TourDone});
if(!state.r27TourDone)setTimeout(()=>{if(!state.r27TourDone&&r27I<0)r27Start()},900);
// R27b：“符合条件的人格”默认展开（玩家自己收起才记住）；点推荐人格里的“＋”跳到名单
if(!state.r26Fold||typeof state.r26Fold!=='object')state.r26Fold={};
const r27FoldCard=r26Card;r26Card=()=>r27FoldCard().replace(/<details(?: open)? data-r26-det="(\w+)">/g,(m,k)=>`<details${state.r26Fold[k]?'':' open'} data-r26-det="${k}">`);
document.addEventListener('toggle',e=>{const d=e.target;if(!d?.matches?.('[data-r26-det]'))return;state.r26Fold[d.dataset.r26Det]=!d.open;persist()},true);
const r27PlusLineup=r20Lineup;r20Lineup=()=>{const h=r27PlusLineup();if(!SOLO()?.support?.length)return h;return h.replace('<div class="r20id r21extra">','<div class="r20id r21extra r27plus" data-r27-plus="1" role="button" tabindex="0" title="点一下，到下面选你有的支援人格">').replace('其余位置：支援人格（不上场，只给后台被动）','其余位置：支援人格（点这里选）')};
document.addEventListener('click',e=>{if(!e.target.closest('[data-r27-plus]'))return;const d=document.querySelector('.r14page [data-r26-det]');if(!d)return;d.open=true;d.scrollIntoView({behavior:'smooth',block:'start'})});
// R27c：开局准备的“饰品”页签——这局要收集的饰品（同收集核对），核心 / 推荐 / 条件全部展开
function r27GiftsPage(){return '<div class="panelCard r27gifts"><b>这局要收集的饰品</b><p class="minor">按你的队伍和预测算出来的；进牢后在“收集核对”页签记录拿到的饰品。</p>'+r16Checklist().replace(/<details(?![^>]*open)/g,'<details open')+'</div>'}
// ===== R28：饰品颜色评级、计时器、卡包问号事件 =====
// 颜色：红 = 必须有（没有可以考虑重开）；蓝 = 最好有（作者 S 级）；绿 = 一般（作者 A 级）
const R28_RED={_all:['探戈鸡酱料'],burnVideo:['火热多汁琵琶腿'],pinkyVideo:['火热多汁琵琶腿']};
function r28Rate(n){n=canonical(n);const p=TEAM_PICKS[state.team]||{};if([...R28_RED._all,...(R28_RED[state.team]||[])].includes(n))return 'red';if((p.S||[]).includes(n))return 'blue';if((p.A||[]).includes(n))return 'green';return ''}
const R28_LABEL={red:'必须有',blue:'最好有',green:'一般'};
const r28OldTile=r22Tile;r22Tile=(n,o={})=>{const h=r28OldTile(n,o),r=r28Rate(n);if(!r)return h;return h.replace('class="r16tile r22tile','class="r16tile r22tile r28-'+r)};
function r28Legend(){return '<p class="r28legend"><i class="r28dot r28-red">必须有</i>没有可以考虑重开 <i class="r28dot r28-blue">最好有</i> <i class="r28dot r28-green">一般</i></p>'}

// 卡包问号事件：每个选项要过什么检定、给什么饰品（数据：pack-events.js，来自 wiki 卡包页面）
const R28_EV=window.MD_PACK_EVENTS||{};
function r28EvOf(p){const k=String(p||'').replace(/\s/g,'');return R28_EV[p]||Object.entries(R28_EV).find(([n])=>n.replace(/\s/g,'')===k)?.[1]||null}
function r28EvHTML(p){const ev=r28EvOf(p);if(!ev?.length)return '';
 const gift=n=>{const r=r28Rate(n);return `<button type="button" class="r28gift${r?' r28-'+r:''}" data-item="${escapeHTML(n)}" title="点开看效果">${giftImage(n)}<span><b>${escapeHTML(n)}</b><small>${escapeHTML(r21Meta(n)||'')}</small></span></button>`};
 return `<details class="r28ev"${state.r28EvOpen?' open':''}><summary>本包问号事件（${ev.length}）· 选哪个选项给什么</summary>${ev.map((e,i)=>{const opts=e.opts||e;const head=e.title?escapeHTML(e.title):'事件（选项：'+opts.filter(o=>o.zh).map(o=>'「'+escapeHTML(o.zh)+'」').join(' ')+'）';return `<div class="r28evone"><b>${head}</b>${opts.map(o=>`<div class="r28opt${o.deadly?' r28deadly':''}"><span class="r28n">${o.zh?'「'+escapeHTML(o.zh)+'」':'选项'+o.n}</span><span class="r28what">${o.sins.length?escapeHTML(o.sins.join('+'))+'检定 → ':''}${escapeHTML(o.what)}${o.deadly?' <em>⚠ 失败会失去全部体力</em>':''}${o.combat?' <em>失败进入战斗</em>':''}</span>${o.gifts.length?`<span class="r28gifts">${o.gifts.map(gift).join('')}</span>`:''}</div>`).join('')}</div>`}).join('')}<p class="minor">来源：wiki 卡包页面，事件和选项文字是游戏里的中文（零协会汉化）；“随机 1 件某关键词饰品”是从该关键词的饰品里随机给。</p></details>`}
function r28EvPaint(){if(!state.floor)return;const pg=document.querySelectorAll('.r14page')[1];if(!pg||pg.querySelector('.r28ev'))return;const h=r28EvHTML(activePack());const lg='';
 const grid=pg.querySelector('.r14giftgrid');if(grid)grid.insertAdjacentHTML('beforebegin',lg);else pg.insertAdjacentHTML('afterbegin',lg);if(h)pg.insertAdjacentHTML('beforeend',h)}
document.addEventListener('toggle',e=>{if(e.target?.matches?.('.r28ev')){state.r28EvOpen=e.target.open;persist()}},true);

// 计时器：⋯ 里打开后显示在顶栏空白处；点数字开始 / 暂停，↺ 清零；关掉程序再打开会接着算
if(!state.r28Timer||typeof state.r28Timer!=='object')state.r28Timer={show:false,base:0,start:null};
const r28T=state.r28Timer;
function r28Elapsed(){return r28T.base+(r28T.start?Date.now()-r28T.start:0)}
function r28Fmt(ms){const s=Math.floor(ms/1000),h=Math.floor(s/3600),m=Math.floor(s%3600/60),x=s%60;return (h?h+':'+String(m).padStart(2,'0'):String(m).padStart(2,'0'))+':'+String(x).padStart(2,'0')}
function r28TPaint(){const el=$('r28timer');if(!el)return;el.hidden=!r28T.show;el.classList.toggle('run',!!r28T.start);el.querySelector('b').textContent=r28Fmt(r28Elapsed());el.querySelector('[data-r28t="go"]').textContent=r28T.start?'⏸':'▶'}
(()=>{const l=$('r23lean');if(l&&!$('r28timer'))l.insertAdjacentHTML('beforebegin','<span id="r28timer" hidden title="计时器：点 ▶ 开始，⏸ 暂停，↺ 清零"><button type="button" data-r28t="go">▶</button><b>00:00</b><button type="button" data-r28t="reset" title="清零">↺</button></span>');r28TPaint();setInterval(r28TPaint,1000)})();
document.addEventListener('click',e=>{const b=e.target.closest('[data-r28t]');if(!b)return;const a=b.dataset.r28t;
 if(a==='go'){if(r28T.start){r28T.base+=Date.now()-r28T.start;r28T.start=null}else r28T.start=Date.now()}
 else if(a==='reset'){r28T.base=0;r28T.start=null}
 else if(a==='show'){r28T.show=!r28T.show;b.textContent='⏱ 计时器：'+(r28T.show?'显示':'隐藏')}
 persist();r28TPaint()});
const r28OldRef=renderReference;renderReference=()=>{r28OldRef();if(currentRef?.kind==='r13detail'&&currentRef.item==='settings'){const body=$('refBody');if(body&&!body.querySelector('.r28tcard'))body.insertAdjacentHTML('afterbegin',`<div class="panelCard r28tcard"><b>计时器</b> <button type="button" data-r28t="show">⏱ 计时器：${r28T.show?'显示':'隐藏'}</button><p class="minor">显示后在顶栏：点 ▶ 开始、⏸ 暂停、↺ 清零。</p></div>`)}};
const r28Update=update;update=()=>{r28Update();r28EvPaint();r28TPaint()};
// ===== R29：商店重做——只放这一层商店真正买得到的；按全部关键词分；组合、四级合成、换技能、通用思路 =====
const R29=window.MD_SHOP_GUIDE||{picks:{},combos:{},tips:[],keywords:[],sources:{}};
const R29_KB=window.MD_KB_GIFTS||{},R29_EN=window.MD_KB_EN||{};
const r29G=n=>R29_KB[R29_EN[canonical(n)]]||R29_KB[R29_EN[n]];
const r29Kw=g=>g?.keyword?(g.keyword==='呼吸'?'呼吸':g.keyword):'无体系';
const r29NoSp=s=>String(s||'').replace(/\s/g,'');
// 能不能在商店买：通用、不用合成 → 任何商店；卡包限定、不用合成 → 只有那个卡包这一层的商店
function r29Buy(n,pack){const g=r29G(n);if(!g||g.recipe)return '';if(g.type==='通用')return 'any';if(g.type==='卡包限定'&&pack&&String(g.packs||'').split('；').some(p=>r29NoSp(p)===r29NoSp(pack)))return 'pack';return ''}
function r29TeamKw(){const k=(TEAM_PICKS[state.team]?.keywords||[]).map(x=>x==='呼吸法'?'呼吸':x).filter(x=>R29.keywords.includes(x));return k.length?k:['无体系']}
if(!state.r29Cat||typeof state.r29Cat!=='object')state.r29Cat={};
function r29Cat(){const c=state.r29Cat[state.team];return c||r29TeamKw()[0]}
function r29Rank(n){const r=r28Rate(n);return {red:0,blue:1,green:2}[r]??3}
function r29Tiles(list,note){return `<div class="r13tiles">${list.map(([n,why])=>r22Tile(n,{note:why||note})).join('')}</div>`}
function r29PackOnly(p){const all=Object.values(R29_KB).filter(g=>g.type==='卡包限定'&&!g.recipe&&String(g.packs||'').split('；').some(x=>r29NoSp(x)===r29NoSp(p)));return all.map(g=>g.cn).sort((a,b)=>r29Rank(a)-r29Rank(b))}
function r29Fusions(cat){const rows=Object.values(R29_KB).filter(g=>g.recipe&&(g.tier==='IV'||g.tier==='V')&&r29Kw(g)===cat&&(g.type==='通用'||[...(TEAM_PICKS[state.team]?.S||[]),...(TEAM_PICKS[state.team]?.A||[])].includes(g.cn)));
 return rows.map(g=>{const mats=g.recipe.split('＋').map(m=>m.trim());const lab=m=>{const x=r29G(m);if(!x)return '？';if(x.type==='通用'&&!x.recipe)return '商店';if(x.recipe)return '合成';return x.packs?'卡包：'+x.packs.split('；')[0]:'其他'};const allShop=mats.every(m=>lab(m)==='商店');
  return `<div class="r29fu${allShop?' shop':''}"><div class="r29fuhead">${giftImage(g.cn)}<b>${escapeHTML(g.cn)}</b><small>${escapeHTML(g.tier+'级 · '+r29Kw(g))}${allShop?' · 材料商店都能买':''}</small><button type="button" class="r16info" data-item="${escapeHTML(g.cn)}">详情</button></div><div class="r29mats">${mats.map(m=>`<span class="r29mat" data-item="${escapeHTML(m)}">${giftImage(m)}<span>${escapeHTML(m)}<small>${escapeHTML(lab(m))}</small></span></span>`).join('<i>＋</i>')}</div></div>`}).join('')}
function r29Skills(){const L=window.MD_TEAM_LINEUPS?.[state.team];if(!L?.skills?.length)return '<p class="minor">这队作者没有单独讲换技能。</p>';
 return `<div class="r29sk">${L.skills.map(([w,t])=>`<p><b>${escapeHTML(w)}</b>${escapeHTML(t)}</p>`).join('')}</div><p class="minor">商店里可以花经费换技能；三位数字是一、二、三技能在 6 个技能位里各放几个（例如 105 = 一技能1个、二技能0个、三技能5个）。来源：作者视频。</p>`}
function r29Tips(){return `<ul class="r29tips">${R29.tips.map(t=>`<li>${escapeHTML(t)}</li>`).join('')}</ul><p class="minor">信息来自贴吧。</p>`}
r13Shop=()=>{const p=activePack(),cat=r29Cat(),teamKw=r29TeamKw();
 const chips=[...teamKw,...R29.keywords.filter(k=>!teamKw.includes(k)),'换技能','通用思路'];
 const head=`<div class="r13shophead"><b>商店 · ${escapeHTML(TEAM_SHORT[state.team]||'')} · 第 ${state.floor} 层</b></div><div class="r21chips r29chips">${chips.map(c=>`<button type="button" data-r29-cat="${escapeHTML(c)}" class="${c===cat?'on':''}${teamKw.includes(c)?' team':''}">${escapeHTML(c)}</button>`).join('')}</div>`;
 const own=r29PackOnly(p);
 const ownTop=own.filter(n=>r28Rate(n)),ownRest=own.filter(n=>!r28Rate(n));
 const packSec=own.length?`<section class="r29sec"><b>本层卡包专属 <small>${escapeHTML(p)}：只有这一层的商店会刷</small></b>${ownTop.length?r29Tiles(ownTop.map(n=>[n,'本层商店'])):'<p class="minor">本包没有本队推荐的饰品。</p>'}${ownRest.length?`<details><summary><small>其他本包饰品（${ownRest.length}）</small></summary>${r29Tiles(ownRest.map(n=>[n,'本层商店']))}</details>`:''}</section>`:'';
 if(cat==='换技能')return head+`<section class="r29sec"><b>换技能 <small>作者推荐</small></b>${r29Skills()}</section>`+packSec;
 if(cat==='通用思路')return head+`<section class="r29sec"><b>通用买饰品思路</b>${r29Tips()}</section>`+packSec;
 const pk=TEAM_PICKS[state.team]||{S:[],A:[]};
 const author=[...pk.S,...pk.A].filter(n=>r29Buy(n,p)==='any'&&r29Kw(r29G(n))===cat).map(n=>[n,'锈町Rusty 本队推荐']);
 const JPL=(window.MD_SHOP_JP||{})[cat]||[],jpOf=n=>JPL.find(x=>x[0]===n),R29_BO={'最优先':0,'优先':1,'有更好':2,'没有也行':3};
 const tb=Object.fromEntries((R29.picks[cat]||[]).map(([n,why])=>[n,why]));
 const commNames=[...new Set([...JPL.filter(x=>x[1]!=='没有也行'&&r29Buy(x[0],p)==='any').map(x=>x[0]),...Object.keys(tb)])].filter(n=>!author.some(a=>a[0]===n));
 const comm=commNames.map(n=>{const j=jpOf(n);return [n,[j?j[1]+(j[2]?' · 建议强化到'+j[2]:''):'',tb[n]||''].filter(Boolean).join(' · '),j?R29_BO[j[1]]:1]});
 const useful=cat==='无体系'?(window.MD_USEFUL_GIFTS||[]).filter(([n])=>r29Buy(n,p)==='any'&&!author.some(a=>a[0]===n)&&!comm.some(a=>a[0]===n)).map(([n,c,why])=>[n,c+'：'+why]):[];
 const rec=[...author.map(x=>[...x,-1]),...comm,...useful.map(x=>[...x,2])].sort((a,b)=>((got(a[0])?1:0)-(got(b[0])?1:0))||(a[2]-b[2])||(r29Rank(a[0])-r29Rank(b[0]))); /* 已拿到的放最后（用户 2026-11-28） */
 const shown=new Set(rec.map(x=>canonical(x[0])));
 const rest=Object.values(R29_KB).filter(g=>g.type==='通用'&&!g.recipe&&r29Kw(g)===cat&&!shown.has(g.cn)).sort((a,b)=>(b.tier||'').length-(a.tier||'').length||String(b.tier).localeCompare(String(a.tier)));
 const combos=(R29.combos[cat]||[]);const fus=r29Fusions(cat);
 return head+packSec
  +`<section class="r29sec"><b>${escapeHTML(cat)} · 推荐 <small>任何商店都可能刷到</small></b>${rec.length?r29Tiles(rec):'<p class="minor">暂时没有推荐，见下面“其他能买的”。</p>'}</section>`
  +(combos.length?`<section class="r29sec"><b>组合</b>${combos.map(c=>`<p class="r29combo">${escapeHTML(c)}</p>`).join('')}</section>`:'')
  +(fus?`<details class="r29sec r29fus"${state.r29FusOpen?' open':''}><summary><b>四级合成（${escapeHTML(cat)}）</b> <small>商店里“合成”放入材料</small></summary>${fus}</details>`:'')
  +(rest.length?`<details class="r29sec"><summary><b>其他能买的${escapeHTML(cat)}饰品（${rest.length}）</b></summary>${r29Tiles(rest.map(g=>[g.cn,'']))}</details>`:'')
  +`<p class="minor">只列商店买得到的：要合成的、别的卡包专属、事件 / 通关奖励在“饰品 / 路线”和“收集核对”里。信息来自作者视频、贴吧和日服攻略 wiki。</p>`};
document.addEventListener('click',e=>{const b=e.target.closest('[data-r29-cat]');if(!b)return;state.r29Cat[state.team]=b.dataset.r29Cat;persist();update()});
document.addEventListener('click',e=>{const m=e.target.closest('.r29mat[data-item]');if(m&&!e.target.closest('button')){const b=document.createElement('button');b.dataset.item=m.dataset.item;b.hidden=true;m.appendChild(b);b.click();b.remove()}});
document.addEventListener('toggle',e=>{if(e.target?.matches?.('.r29fus')){state.r29FusOpen=e.target.open;persist()}},true);
// ===== R32：通用问号事件搜索（很多卡包的问号是从通用事件池随机出的）=====
const R32_EV=window.MD_EVENTS||[];
function r32Box(hasOwn){return `<div class="r32ev"><b>${hasOwn?'遇到其他问号事件？':'这个包的问号是从通用事件里随机出的'}</b><input type="search" class="r32q" placeholder="输入游戏里选项的几个字，例如：环形垫圈" aria-label="搜索问号事件"><div class="r32res"></div></div>`}
function r32Find(q){q=String(q||'').replace(/\s/g,'');if(q.length<2)return [];return R32_EV.filter(e=>e.o.some(([m,d])=>(m+d).replace(/\s/g,'').includes(q))).slice(0,6)}
function r32Res(q){const r=r32Find(q);if(String(q||'').trim().length<2)return '';if(!r.length)return '<p class="minor">没找到，换几个字试试。</p>';
 return r.map(e=>`<div class="r32one">${e.o.map(([m,d])=>`<p><span class="r32m">「${escapeHTML(m)}」</span>${d?' → '+escapeHTML(d):' → 没有特别效果'}</p>`).join('')}</div>`).join('')+(r.length===6?'<p class="minor">只显示前 6 个，多输入几个字缩小范围。</p>':'')}
document.addEventListener('input',e=>{const i=e.target.closest?.('.r32q');if(!i)return;state.r32Q=i.value;i.parentElement.querySelector('.r32res').innerHTML=r32Res(i.value)});
function r32Paint(){if(!state.floor)return;const pg=document.querySelectorAll('.r14page')[1];if(!pg||pg.querySelector('.r32ev'))return;pg.insertAdjacentHTML('beforeend',r32Box(!!pg.querySelector('.r28ev')));const i=pg.querySelector('.r32q');if(state.r32Q){i.value=state.r32Q;pg.querySelector('.r32res').innerHTML=r32Res(state.r32Q)}}
const r32Update=update;update=()=>{r32Update();r32Paint()};
// ===== R36：队伍自带的“预测改路线”规则（solo-teams.js 的 routeRules，按作者原话）=====
// when 里的饰品都预测了、unless 里的一个都没预测 → 规则生效。
// skip：这个卡包算“不用去”（换成同层备选）；mid：5–10层一定排进这个卡包；first：直接改前4层某一层的卡包；needSkip4：只有第4层的包已经因为预测不用去时才改（不丢核心饰品）
let r36Hit=(r,a)=>(r.when||[]).every(g=>a.includes(g))&&!(r.unless||[]).some(g=>a.includes(g));
const r36OldWasted=r23Wasted;r23Wasted=(n,pred)=>{const t=SOLO(),a=pred||state.r12Prediction||[];if(t?.routeRules?.some(r=>r.skip===n&&r36Hit(r,a)))return true;return r36OldWasted(n,pred)};
const r36OldSolo=soloPlan;soloPlan=()=>{const t=SOLO(),a=state.r12Prediction||[],rules=(t?.routeRules||[]).filter(r=>r36Hit(r,a)&&(r.first||r.mid)&&(!r.needSkip4||r36LetterYes()||r23Wasted(t.first[3],a)));if(!rules.length)return r36OldSolo();
 const keep={first:t.first,mid:t.mid};try{
  const first=[...t.first];for(const r of rules)for(const [f,p] of Object.entries(r.first||{}))first[f-1]=p;
  const add=rules.map(r=>r.mid).filter(n=>n&&!t.mid.must.includes(n));
  t.first=first;t.mid={...t.mid,must:[...t.mid.must,...add]};
  return r36OldSolo()}finally{t.first=keep.first;t.mid=keep.mid}};
// ===== R36b：队伍自带的选择——阵容版本（阵容页下拉）＋完整路线页的“本队选择”（solo-teams.js 的 variants / choices）=====
if(!state.r36||typeof state.r36!=='object')state.r36={};
const r36Get=k=>{const t=SOLO(),c=state.r36[state.team]||{};if(k==='lineup')return t?.variants&&(k in c)&&(c[k]==='full'||t.variants[c[k]])?c[k]:'full';const ch=t?.choices?.find(x=>x.key===k);if(!ch)return null;return ch.opts.some(o=>o[0]===c[k])?c[k]:ch.opts[0][0]};
const r36Set=(k,v)=>{(state.r36[state.team]=state.r36[state.team]||{})[k]=v;delete r23KeyCache[state.team];persist()};
// 送达的信：“按预测”＝选了山茶花枝或眼镜就算吃
const r36Letter=()=>{const v=r36Get('letter');if(v!=='auto')return v;const a=state.r12Prediction||[];return a.includes('山茶花枝')||a.includes('破碎的眼镜')?'yes':'no'};
// 阵容版本
const r36OldVarKey=r21VarKey;r21VarKey=()=>SOLO()?.variants?r36Get('lineup'):r36OldVarKey();
const r36OldVarSel=r21VariantSelect;r21VariantSelect=()=>{const t=SOLO();if(!t?.variants)return r36OldVarSel();return r12Select('r36lineup',[['full',t.variantLabel||'作者推荐'],...Object.entries(t.variants).map(([k,v])=>[k,v.label])],r36Get('lineup'))};
document.addEventListener('change',e=>{if(e.target.id!=='r36lineup')return;r36Set('lineup',e.target.value);update()});
// 完整路线页的选择按钮
function r36Box(){const t=SOLO();if(!t?.choices)return '';const a=state.r12Prediction||[];
 const rows=t.choices.map(ch=>{const cur=r36Get(ch.key);return `<div class="r26nsrow"><small>${escapeHTML(ch.label)}</small>${ch.opts.map(([v,l])=>`<button type="button" data-r36="${ch.key}:${v}" class="${cur===v?'on':''}">${escapeHTML(l)}</button>`).join('')}</div>${ch.effect?`<p class="minor r36eff">${escapeHTML(ch.effect)}</p>`:''}`}).join('');
 const hint=r36Get('letter')==='yes'&&!a.includes('山茶花枝')&&!a.includes('破碎的眼镜')&&t.choiceText?.letterHint?`<p class="minor">${escapeHTML(t.choiceText.letterHint)}</p>`:'';
 return `<div class="r26ns r36box">${rows}${hint}</div>`}
const r36OldSetup=r12Setup;r12Setup=()=>{let h=r36OldSetup();const x=r36Box();if(!x)return h;const a='<b>完整 15 层预设</b>';const i=h.indexOf(a);if(i>0)h=h.slice(0,i+a.length)+x+h.slice(i+a.length);
 if(r36Get('f1')==='econ')h=h.replace(/(data-route-floor="1"[^>]*>1F <span>)[^<]*(<\/span>)/,'$1经济饰品卡包（看下方可选）$2');return h};
document.addEventListener('click',e=>{const b=e.target.closest('[data-r36]');if(!b)return;const [k,v]=b.dataset.r36.split(':');r36Set(k,v);r12Replan()});
// 送达的信“不吃”：和花信有关的改路线规则不生效（规则里写了 letter:true）
// 送达的信：选“不吃”→花信规则都不生效；选“吃满”→不看 when，只要还缺山茶花枝就去落花、缺眼镜就去无改变者
const r36LetterYes=()=>!!SOLO()?.choices?.some(c=>c.key==='letter')&&r36Letter()==='yes'&&r36Get('letter')==='yes';
const r36OldHit=r36Hit;r36Hit=(r,a)=>{if(!r.letter||!SOLO()?.choices?.some(c=>c.key==='letter'))return r36OldHit(r,a);const L=r36Letter();if(L==='no')return false;if(r36Get('letter')==='yes')return !(r.unless||[]).some(g=>a.includes(g));return r36OldHit(r,a)};
// 第1层选“经济饰品卡包”：第1层的卡包说明换成作者的经济方案
for(const t of Object.values(window.MD_SOLO_TEAMS||{})){if(!t.choices)continue;
 const oldNote=t.packNoteOf;t.packNoteOf=p=>t===SOLO()&&r36Get('f1')==='econ'&&(t.alts[1]||[]).concat(t.first[0]).includes(p)?t.choiceText.econ:oldNote(p);
 // 合成目标、S 级、技能说明跟着选择变
 const base=[...t.fusion],all=new Set(Object.values(t.fusionBy||{}).flatMap(o=>Object.values(o).flat()));
 Object.defineProperty(t,'fusion',{configurable:true,get(){if(t!==SOLO())return base;const pick=Object.entries(t.fusionBy||{}).flatMap(([k,o])=>o[k==='letter'?r36Letter():r36Get(k)]||[]);return [...base.filter(n=>!all.has(n)),...pick]}});
 const id=Object.keys(window.MD_SOLO_TEAMS).find(k=>window.MD_SOLO_TEAMS[k]===t),P=window.MD_TEAM_PICKS[id],baseS=[...P.S],watches=Object.values(t.fusionBy?.watch||{}).flat();
 if(watches.length)Object.defineProperty(P,'S',{configurable:true,enumerable:true,get(){if(t!==SOLO())return baseS;const w=t.fusionBy.watch[r36Get('watch')]||[];return [...baseS.filter(n=>!watches.includes(n)),...w]}});
 const L=window.MD_TEAM_LINEUPS[id],baseSk=L.skills;if(t.skillsBy)Object.defineProperty(L,'skills',{configurable:true,enumerable:true,get(){return t===SOLO()?(t.skillsBy[r36Letter()]||baseSk):baseSk}})}
// ===== R36c：路线检查也要先按预测同步“花信 / 第1层 / 蜡烛”等状态（实际界面在 r12Replan 里会做），否则烧震、呼震测不出预测的影响 =====
if(window.MD_ROUTE_CHECK){const R=window.MD_ROUTE_CHECK;window.MD_ROUTE_CHECK=Object.freeze({...R,plan:(team,pred)=>{const keys=['burnLetter','burnOpening','burnObservedCandle','packPriority','team','r12Prediction'],keep=Object.fromEntries(keys.map(k=>[k,state[k]]));try{state.team=team;state.r12Prediction=[...pred];r12Sync();return R.plan(team,pred)}finally{for(const k of keys)state[k]=keep[k]}},keep:team=>[...(window.MD_SOLO_TEAMS?.[team]?.keepPacks||[])]})}
// ===== R36d：旧写法的三队（烧震 / 呼震 / 小指良）也按作者原话加“观测了就跳包”规则 =====
// 呼震 00:13:37：观测翅膀“可以省下三四层的卡包”
// alt：跳过后这一层改走的包（作者在3–4层列的）；fill：alt 原来所在楼层补上的包
const R36_OLD_RULES={wedgeVideo:[{skip:'憎恶与绝望',when:['可用之处已尽，郁积的憎恶'],alt:'2号线',fill:['1号线','3号线']}]};
const r36OldReroute=r23Reroute;r23Reroute=plan=>{const a=state.r12Prediction||[];let p=[...plan];for(const r of (R36_OLD_RULES[state.team]||[])){if(!r.alt||!r36Hit(r,a))continue;const i=p.indexOf(r.skip);if(i<0||i>3)continue;const j=p.indexOf(r.alt);p[i]=r.alt;if(j>i){const fill=[].concat(r.fill).find(x=>!p.includes(x)&&!r23Wasted(x,a));if(fill)p[j]=fill}}return r36OldReroute(p)};
const r36OldWasted2=r23Wasted;r23Wasted=(n,pred)=>{const a=pred||state.r12Prediction||[];if((R36_OLD_RULES[state.team]||[]).some(r=>r.skip===n&&r36Hit(r,a)))return true;return r36OldWasted2(n,pred)};
// ===== R36e：前4层出现重复卡包（同层备选都用过或不用去）时，第4层改走2号线，5–10层空出的位置按本队顺序补下一个包 =====
const r36OldSolo2=soloPlan;soloPlan=()=>{const t=SOLO(),a=state.r12Prediction||[],p=r36OldSolo2();if(!t)return p;const waste=n=>r23Wasted(n,a);
 for(let i=0;i<4;i++){if(p.indexOf(p[i])===i)continue;const alt=(t.alts[i+1]||[]).find(x=>!p.includes(x)&&!waste(x)&&(i>=3||x!=='2号线'));
  if(alt){p[i]=alt;continue}if(i<3)continue;const j=p.indexOf('2号线');p[i]='2号线';
  if(j>i){const next=t.mid.order.find(x=>!p.includes(x)&&!waste(x)&&!t.avoid.includes(x)&&x!=='时间杀人时间复刻');if(next)p[j]=next}}
 return p};
// 烧震（视频 00:11:20、00:15:29、省流图 28:00）：观测翅膀“整包收益降低，可不前往”憎恶包；观测翼形蜡烛就不用去盛火时节
R36_OLD_RULES.burnVideo=[{skip:'憎恶与绝望',when:['可用之处已尽，郁积的憎恶'],alt:'2号线',fill:['深夜清扫复刻','经验记忆','20区的奇迹复刻']},{skip:'盛火时节',when:['翼形蜡烛']}];
// ===== R36f：keepPacks——作者说观测后仍推荐去的卡包，预测不会把它算成“不用去”（证据包 2026-11-27）=====
const r36OldWasted3=r23Wasted;r23Wasted=(n,pred)=>SOLO()?.keepPacks?.includes(n)?false:r36OldWasted3(n,pred);
// 小指良（证据 09-061，视频 00:21:35）：只观测蜘蛛巢时教材里还有红领带要拿；观测了红领带才可以省教材
const R36_OLD_KEEP={pinkyVideo:[{pack:'教材',unless:['红领带']}]};
const r36OldWasted4=r23Wasted;r23Wasted=(n,pred)=>{const a=pred||state.r12Prediction||[];if((R36_OLD_KEEP[state.team]||[]).some(k=>k.pack===n&&!k.unless.some(g=>a.includes(g))))return false;return r36OldWasted4(n,pred)};
// ===== R36g：存档里的十项恩惠等级缺项时补齐（缺项会显示“已选 NaN / 930 星光”）=====
if(!Array.isArray(state.r12StarLevels)||state.r12StarLevels.length!==r12Stars.length||state.r12StarLevels.some(x=>typeof x!=='number'))state.r12StarLevels=r12Stars.map((x,i)=>state.r12Grace==='partial'?([2,6,7,8].includes(i)?3:1):3);
// ===== R36j：choiceMid——某个选择决定5–10层候选（第1队“主轴：环指 / 红派”，字幕 88–102、456–520）=====
const r36OldSolo3=soloPlan;soloPlan=()=>{const t=SOLO();if(!t?.choiceMid)return r36OldSolo3();let mid=null;for(const [k,o] of Object.entries(t.choiceMid)){const v=r36Get(k);if(o[v])mid=o[v]}if(!mid)return r36OldSolo3();const keep=t.mid;try{t.mid={...t.mid,...mid};return r36OldSolo3()}finally{t.mid=keep}};
// ===== R36l：预测页下面直接显示按预测算出的15层路线，因为预测改变的楼层标蓝；去掉“开局观测 · 经济备选”（用户选方案 A）=====
const r36OldSetup2=r12Setup;r12Setup=()=>{const h=r36OldSetup2(),t=document.createElement('div');t.innerHTML=h;t.querySelectorAll('.r23econ').forEach(e=>e.remove());
 const card=[...t.querySelectorAll(':scope > .panelCard')].find(c=>c.querySelector('b')?.textContent.includes('开局观测'));
 if(card){const plan=r12Plan();let base=plan;
  // 对照：作者推荐方案＝推荐的三件观测＋本队选择都用默认
  if(window.MD_ROUTE_CHECK){const keepCh=state.r36[state.team];state.r36[state.team]={};try{base=window.MD_ROUTE_CHECK.plan(state.team,r12Defaults());if(SOLO()?.choices?.some(c=>c.key==='f1')&&r36Get('f1')==='econ')base=['经济卡包',...base.slice(1)]}finally{if(keepCh)state.r36[state.team]=keepCh;else delete state.r36[state.team]}}
  // 第1层选了经济方案：格子里直接写“经济卡包”（具体哪个包要进牢看）
  const show=plan.slice();if(SOLO()?.choices?.some(c=>c.key==='f1')&&r36Get('f1')==='econ')show[0]='经济卡包';
  const n=show.filter((p,i)=>p!==base[i]).length;
  card.insertAdjacentHTML('beforeend',`<div class="r36predroute"><b>15 层路线</b>${n?'<small>蓝色是和作者推荐方案相比变了的楼层</small>':''}<div class="r12floors">${show.map((p,i)=>`<button type="button" data-route-floor="${i+1}" class="${p!==base[i]?'r36chg':''}">${i+1}F <span>${escapeHTML(p||'待核实')}</span></button>`).join('')}</div></div>`)}
 return t.innerHTML};
// ===== R36m：可选项默认收起（用户选方案 A）：完整路线页“本队选择 / 呼吸法卡包”收成一行，阵容页的阵容版本收成一行，点“改 / 换”展开 =====
let r36FoldOpen={route:false,lineup:false,star:false};
document.addEventListener('toggle',e=>{const d=e.target;if(d?.classList?.contains('r36fold'))r36FoldOpen[d.dataset.fold]=d.open},true);
const r36ShortLabel=t=>t.replace(/（.*?）/g,'').replace(/\(.*?\)/g,'').replace(/[：:].*$/,'').trim();
const r36OldSetup3=r12Setup;r12Setup=()=>{const h=r36OldSetup3(),t=document.createElement('div');t.innerHTML=h;
 const boxes=[...t.querySelectorAll('.r36box, .r26ns')];
 if(boxes.length){const picks=boxes.flatMap(b=>[...b.querySelectorAll('button.on')].map(x=>(b.classList.contains('r36box')?'':'呼吸法卡包')+r36ShortLabel(x.textContent)));const d=document.createElement('details');d.className='r36fold';d.dataset.fold='route';if(r36FoldOpen.route)d.open=true;
  d.innerHTML=`<summary><span>本队选择：${escapeHTML(picks.join(' · ')||'作者推荐')}</span><u>改</u></summary>`;boxes[0].before(d);boxes.forEach(b=>d.append(b))}
 const sel=t.querySelector('#r36lineup, #r12Lineup, #r12Wedge, #r20Pinky');
 if(sel){const p=sel.closest('p')||sel;const cur=sel.querySelector('option[selected]')||sel.options[0];const d=document.createElement('details');d.className='r36fold';d.dataset.fold='lineup';if(r36FoldOpen.lineup)d.open=true;
  d.innerHTML=`<summary><span>阵容：${escapeHTML(cur?.textContent||'')}</span><u>换</u></summary>`;p.before(d);d.append(p)}
 return t.innerHTML};
// ===== R36o：“预测”和“完整路线”合成一页“预测 / 路线”（用户要求）：预测 → 本队选择（收起一行）→ 15层路线（变化标蓝）→ 开始镜牢；去掉第6个页签 =====
const r36OldRender=renderSheet;renderSheet=()=>{if(state.floor)return r36OldRender();
 if(r14LastFloor!==0)r14Index=0;r14LastFloor=0;r14LastTeam=state.team;
 const tmp=document.createElement('div');tmp.innerHTML=r12Setup();const cards=[...tmp.querySelectorAll(':scope > .panelCard')];
 const pred=cards.find(c=>c.querySelector('b')?.textContent.includes('开局观测'))||cards[2],route=cards.find(c=>c.textContent.includes('完整 15 层预设'))||cards[3];
 const fold=route?.querySelector('details.r36fold'),pr=pred.querySelector('.r36predroute');
 if(fold){pr?pr.before(fold):pred.append(fold)}
 const start=tmp.querySelector('[data-r12-start]');if(start)pred.append(start);
 const star=cards[1];if(star){const head=star.querySelector(':scope > b');if(head)head.remove();const grace=star.querySelector('#r12Grace'),init=star.querySelector('#r12Initial');
  const gtxt=r36ShortLabel(grace?.querySelector('option[selected]')?.textContent||grace?.options[0]?.textContent||'全部点满'),itxt=init?.querySelector('option[selected]')?.textContent||init?.options[0]?.textContent||'';
  const d=document.createElement('details');d.className='r36fold';d.dataset.fold='star';if(r36FoldOpen.star)d.open=true;d.innerHTML='<summary><span>星光：'+escapeHTML(gtxt)+' · 初始关键词：'+escapeHTML(itxt)+'</span><u>改</u></summary>';
  const box=document.createElement('div');box.className='r36starbox';box.innerHTML=star.innerHTML;d.append(box);pred.prepend(d)}
 r15Rail(['阵容','玩法','开局 / 路线','饰品'],[cards[0].outerHTML,r21Play(),pred.outerHTML,r27GiftsPage()])};
{for(const sel of ['[data-r14-tab="5"]','[data-r14-tab="2"]']){const i=R27_STEPS.findIndex(s=>s.sel===sel);if(i>=0)R27_STEPS.splice(i,1)}
 const p=R27_STEPS.find(s=>s.sel==='[data-r14-tab="3"]');if(p){p.sel='[data-r14-tab="2"]';p.title='开局 / 路线';p.text='进镜牢前看这一页：星光、初始关键词、开局观测都填好了作者推荐的，照着做就行。下面是 15 层路线，最下面“开始镜牢”进入第 1 层。';p.go=()=>{r27Floor(0);r27Tab(2)}}
 const g=R27_STEPS.find(s=>s.sel==='[data-r14-tab="4"]');if(g){g.sel='[data-r14-tab="3"]';g.go=()=>{r27Floor(0);r27Tab(3)}}}
// ===== R36r：开局观测的提示句（按本队作者推荐的观测生成）=====
function r36PredHint(){const d=(typeof r12Defaults==='function'?r12Defaults():[]).filter(Boolean);const extra=d.filter(n=>n!=='贵宾卡');
 return '<p class="minor">'+escapeHTML('已经填好作者推荐的三件：'+d.join('、')+'。照着观测就行；换了别的，下面的路线会跟着变。')+'</p>'}
// ===== R36t：玩法 / 阵容说明里的 **重点** 加粗 =====
const r36Hl=h=>String(h).replace(/\*\*(.+?)\*\*/g,'<b class="r36hl">$1</b>');
{const oldPlay=r21Play;r21Play=()=>r36Hl(oldPlay());const oldLu=r20Lineup;r20Lineup=()=>r36Hl(oldLu())}
// ===== R37：开局观测下拉加短标注（改路线 / 省钱 / 记为已拿）=====
const R37_ECON=new Set(['贵宾卡','宅邸模型八音盒','金瓮','翻新的商品','预约优惠券']);let r37Cache={k:'',m:{}};
function r37Tags(){const C=window.MD_ROUTE_CHECK,team=state.team;if(!C)return {};const def=r12Defaults(),k=team+'|'+def.join()+'|'+JSON.stringify(state.r36?.[team]||{});if(r37Cache.k===k)return r37Cache.m;const m={};
 for(const o of r12OptsFor(team)){let ch=false;for(let i=0;i<3&&!ch;i++){const b=def.filter((_,j)=>j!==i).filter(x=>x!==o),p0=C.plan(team,b),p1=C.plan(team,[...b,o]);ch=p1.some((x,j)=>x!==p0[j])}
  m[o]=ch?'改路线':R37_ECON.has(o)?'省钱':'记为已拿'}
 r37Cache={k,m};return m}
function r37Tag(n){const t=r37Tags()[n];return t?`${n} · ${t}`:n}
// ===== R37b：routeRules 里带 fusion 的规则生效时，这件变成合成目标、从“不用拿”里去掉（霜冻足迹）=====
for(const t of Object.values(window.MD_SOLO_TEAMS||{})){const fr=(t.routeRules||[]).filter(r=>r.fusion);if(!fr.length)continue;
 const hit=()=>t===SOLO()?fr.filter(r=>r36Hit(r,state.r12Prediction||[])).map(r=>r.fusion):[];
 const d=Object.getOwnPropertyDescriptor(t,'fusion'),getF=d.get?()=>d.get.call(t):()=>d.value;
 Object.defineProperty(t,'fusion',{configurable:true,enumerable:true,get(){const f=getF(),h=hit();return [...f,...h.filter(n=>!f.includes(n))]}});
 const sk=t.skip||[];Object.defineProperty(t,'skip',{configurable:true,enumerable:true,get(){const h=hit();return sk.filter(([n])=>!h.includes(n))}})}
// ===== R37c：choices 里的 skipOff——选了某个选项时，这些饰品不再算“不用拿”（红神血充环指：主环指时心动力宝石另论）=====
for(const t of Object.values(window.MD_SOLO_TEAMS||{})){const cs=(t.choices||[]).filter(c=>c.skipOff);if(!cs.length)continue;
 const d=Object.getOwnPropertyDescriptor(t,'skip'),getS=d?.get?()=>d.get.call(t):()=>d?.value||[];
 Object.defineProperty(t,'skip',{configurable:true,enumerable:true,get(){const s=getS();if(t!==SOLO())return s;const off=cs.flatMap(c=>c.skipOff[r36Get(c.key)]||[]);return s.filter(([n])=>!off.includes(n))}})}
// ===== R37d：“⋯”里加字号（小 / 中 / 大，默认中）和反馈问题（截图、写邮件、复制邮箱）=====
const R37_FONT={s:['小',1],m:['中',1.2],l:['大',1.4]},R37_MAIL='3296233462bzr@gmail.com';
const r37FontDef=()=>window.MD_WINDOW?'m':'s'; /* 网页 / 手机版默认小（手机样式本来就放大了） */
function r37FontApply(){const z=(R37_FONT[state.r37Font]||R37_FONT[r37FontDef()])[1];document.documentElement.style.zoom=z===1?'':String(z);window.MD_WINDOW?.setZoom?.(z)?.catch?.(()=>{})} /* R37j：窗口跟着字号变大 */
r37FontApply();
function r37Copy(t){const a=document.createElement('textarea');a.value=t;document.body.appendChild(a);a.select();let ok=false;try{ok=document.execCommand('copy')}catch(e){}a.remove();if(!ok&&navigator.clipboard)navigator.clipboard.writeText(t).catch(()=>{});return true}
function r37Mail(){const v=(document.title.match(/测试版 ([0-9.]+)/)||[])[1]||'',t=SOLO()?.short||document.querySelector('select option:checked')?.textContent||state.team,f=state.floor?`第${state.floor}层`:'开局';
 const subject=`镜牢指挥条反馈（测试版 ${v} · ${t} · ${f}）`,body='哪里不对 / 想要什么：\n\n\n（截图请在邮件里添加附件）';
 const a=document.createElement('a');a.href=`mailto:${R37_MAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;document.body.appendChild(a);a.click();a.remove()}
const r37OldRef=renderReference;renderReference=()=>{r37OldRef();if(currentRef?.kind==='r13detail'&&currentRef.item==='settings'){const body=$('refBody');if(body&&!body.querySelector('.r37font')){const cur=state.r37Font||r37FontDef();
 const shot=window.MD_WINDOW?.shot?'<button type="button" data-r37fb="shot">保存当前截图到桌面</button>':'';
 const h=`<div class="panelCard r37font"><b>字号</b> ${Object.entries(R37_FONT).map(([k,[l]])=>`<button type="button" data-r37font="${k}" class="${cur===k?'on':''}">${l}</button>`).join('')}</div>`+
  `<div class="panelCard r37fb"><b>反馈问题</b><p class="minor">发到作者邮箱 ${R37_MAIL}，截图请在邮件里添加附件。</p><div class="r37fbbtns">${shot}<button type="button" data-r37fb="mail">写邮件</button><button type="button" data-r37fb="copy">复制邮箱地址</button></div><p class="minor r37fbmsg" hidden></p></div>`;
 const tc=body.querySelector('.r28tcard');if(tc)tc.insertAdjacentHTML('afterend',h);else body.insertAdjacentHTML('afterbegin',h)}}};
document.addEventListener('click',async e=>{const f=e.target.closest('[data-r37font]');if(f){state.r37Font=f.dataset.r37font;r37FontApply();persist();f.parentElement.querySelectorAll('[data-r37font]').forEach(b=>b.classList.toggle('on',b===f));return}
 const b=e.target.closest('[data-r37fb]');if(!b)return;const msg=b.closest('.r37fb')?.querySelector('.r37fbmsg'),say=t=>{if(msg){msg.hidden=false;msg.textContent=t}};
 if(b.dataset.r37fb==='copy'){r37Copy(R37_MAIL);say('已复制：'+R37_MAIL)}
 else if(b.dataset.r37fb==='mail'){r37Mail();say('已打开邮件程序；没反应的话，用“复制邮箱地址”自己发。')}
 else if(b.dataset.r37fb==='shot'){backReference();await new Promise(r=>setTimeout(r,400));try{const n=await window.MD_WINDOW.shot();alert('截图已保存到桌面：'+n)}catch(err){alert('截图没保存成功，可以用 Win+Shift+S 自己截。')}}});
// ===== R37h：11–15 层卡包排序表（方案 C）——计划包 → 有缺的饰品 → 作者说值得去 → 软柿子 → 其他；打过的划掉；可选“点我刷出来的 3 个” =====
function r37LateRank(){const f=state.floor,t=SOLO(),plan=r12Plan(),soft=(t?.soft||window.MD_SOLO_SOFT||[]),late=t?.late||[],avoid=t?.avoid||[];
 const done=new Set([...plan.slice(0,f-1),...(state.completedPacks[state.team]||[])]);
 const pool=candidateNames().filter(n=>floorAllowed(n)!==false);
 const rows=pool.map(n=>{if(done.has(n)&&n!==plan[f-1])return {n,done:true,tier:99,why:'打过了'};
  const miss=packTargets(n).filter(x=>!got(x)),later=plan.indexOf(n,f);
  if(n===plan[f-1])return {n,tier:0,why:'计划'+(miss.length?' · 拿'+miss.slice(0,2).join('、'):'')};
  if(avoid.includes(n))return {n,tier:9,why:'作者说别去'};
  if(miss.length)return {n,tier:1,why:'拿'+miss.slice(0,2).join('、')+(later>=0?`（本来计划第${later+1}层）`:'')};
  if(later>=0)return {n,tier:1.5,why:`本来计划第${later+1}层`};
  if(late.includes(n))return {n,tier:2,why:'作者说值得去'};
  if(soft.includes(n))return {n,tier:3,why:'软柿子，好打'};
  return {n,tier:5,why:''}});
 const si=n=>{const i=soft.indexOf(n);return i<0?99:i};return rows.sort((a,b)=>a.tier-b.tier||si(a.n)-si(b.n))}
const r37Row=(r,i,mark)=>`<button type="button" class="r37late${r.done?' r37done':''}" ${r.done?'disabled':`data-pack="${escapeHTML(r.n)}"`}><span class="r37no">${mark||(r.done?'':i+1)}</span><span><b>${escapeHTML(r.n)}</b>${r.why?`<small>${escapeHTML(r.why)}</small>`:''}</span></button>`;
function r37LateBox(){if(!state.floor||state.floor<11)return '';const all=r37LateRank(),live=all.filter(r=>!r.done),done=all.filter(r=>r.done),seen=packOffers();
 const pick=seen.length?`<div class="r37seen"><p class="minor">你点的 ${seen.length} 个，按顺序选：</p>${live.filter(r=>seen.includes(r.n)).map((r,i)=>r37Row(r,i,'①②③④⑤'[i])).join('')}</div>`:'';
 const chips=state.r37SeenOpen?`<div class="r37chips">${live.map(r=>`<button type="button" data-r37seen="${escapeHTML(r.n)}" class="${seen.includes(r.n)?'on':''}">${escapeHTML(r.n)}</button>`).join('')}${seen.length?'<button type="button" data-r37seen="">清空</button>':''}</div>`:'';
 return `<div class="r37lateBox"><b>第 ${state.floor} 层：从上往下选</b><small>刷出来的包里，选排在最前面的</small>${live.slice(0,3).map((r,i)=>r37Row(r,i)).join('')}${live.length>3||done.length?`<details><summary>还有 ${live.length-3>0?live.length-3:0} 个${done.length?`，打过的 ${done.length} 个`:''}</summary>${live.slice(3).map((r,i)=>r37Row(r,i+3)).join('')}${done.map(r=>r37Row(r)).join('')}</details>`:''}<button type="button" class="r37seenbtn" data-r37seenopen="1">${state.r37SeenOpen?'收起':'点我刷出来的 3 个 ›'}</button>${chips}${pick}</div>`}
const r37OldSheet=renderSheet;renderSheet=()=>{r37OldSheet();const box=r37LateBox();if(!box)return;const note=document.querySelector('#sheetBody .r14note');if(note&&!document.querySelector('.r37lateBox'))note.insertAdjacentHTML('afterend',box)};
document.addEventListener('click',e=>{const o=e.target.closest('[data-r37seenopen]');if(o){state.r37SeenOpen=!state.r37SeenOpen;persist();update();return}
 const s=e.target.closest('[data-r37seen]');if(!s)return;const a=packOffers(),n=s.dataset.r37seen;if(!n)a.length=0;else{const i=a.indexOf(n);if(i>=0)a.splice(i,1);else{a.push(n);if(a.length>3)a.shift()}}persist();update()});
// ===== R37i：卡包资料没写楼层（或写“所有楼层”，如 2号线）时，用资料库卡包表的 15 牢楼层（pack-floors.js）判断能不能出现——信仰与侵蚀只在第 1 层 =====
{const old=R6.canAppear.bind(R6);R6.canAppear=(pack,f)=>{const v=old(pack,f);if(!Number.isInteger(f)||(v!==null&&!/所有楼层/.test(String(pack?.audit?.floors||''))))return v;
 const F=window.MD_PACK_FLOORS?.[String(pack?.name||'').replace(/\s+/g,'')];if(!F)return v;return F.length?f>=F[0]&&f<=F[1]:false}}
// ===== R37k：卡包说明等文字里的 **重点** 显示成加粗（页面渲染后统一处理；下拉选项里只去掉星号）=====
function r37Bold(root){if(!root)return;const w=document.createTreeWalker(root,NodeFilter.SHOW_TEXT,{acceptNode:n=>n.nodeValue.includes('**')&&!n.parentElement?.closest('script,style,textarea')?NodeFilter.FILTER_ACCEPT:NodeFilter.FILTER_REJECT});const list=[];while(w.nextNode())list.push(w.currentNode);
 for(const n of list){const p=n.parentElement;if(p?.closest('option,select')){n.nodeValue=n.nodeValue.replace(/\*\*/g,'');continue}
  const parts=n.nodeValue.split('**');if(parts.length<3){n.nodeValue=n.nodeValue.replace(/\*\*/g,'');continue}
  const f=document.createDocumentFragment();parts.forEach((t,i)=>{if(!t)return;if(i%2){const b=document.createElement('b');b.className='r36hl';b.textContent=t;f.appendChild(b)}else f.appendChild(document.createTextNode(t))});n.replaceWith(f)}
 root.querySelectorAll?.('[title*="**"]').forEach(e=>e.title=e.title.replace(/\*\*/g,''))}
{const oldU=update;update=(...a)=>{const r=oldU(...a);r37Bold(document.body);return r};const oldR=renderReference;renderReference=(...a)=>{const r=oldR(...a);r37Bold($('refBody'));return r}}
// ===== R37m：烧震 / 呼震 / 小指良的卡包说明也改成短句、重点加粗（只换说法，不改内容）=====
const R37_OLD_PLAIN={
 burnVideo:{
  '信仰与侵蚀':'拿**血红鬃毛**（留至少一种色欲或暴怒攻击技能）。',
  '当斩之物':'用**通用斩击**饰品过渡，看实际可选奖励拿。',
  '无法去爱':'**只在要合霜冻足迹、已有鬼附鞋时**来补冰封的哀嚎。',
  '自动工厂':'**只在要合霜冻足迹、已有冰封的哀嚎时**来补鬼附鞋。',
  '地狱鸡':'离开前拿**鸡腿＋鸡酱**；没鸡酱可以重开。',
  '落花':'想做花信、**缺山茶花枝**才来，先看卡包下方可选。',
  '由子弹画下的句点':'优先**黑焰烟斗**，再补齿轮碎片和近身格斗术教材。',
  '无改变者':'想做花信、**缺眼镜**才来，先看卡包下方可选。',
  '憎恶与绝望':'**翅膀**（可用之处已尽，郁积的憎恶）到包建议拿；**观测了翅膀可以不去**。3–4层限定包都不好跳过。',
  '2号线':'作者：**建议必去**。看到可选**枷锁**就进，节拍器顺手。',
  '教材':'三拇指队先奉纳**雪茄**；**红领带**可以拿去合成。',
  'LCB定期体检复刻':'先确认**余火、再点火装置**和灼烧类专属；火种是3号线的，不在这里。',
  '盛火时节':'三黎明**缺翼形蜡烛**才来，和解放的暴怒二选一（观测了能省）。灼热的铜管不重要。',
  '解放的暴怒':'三黎明**缺翼形蜡烛**才来，和盛火时节二选一（观测了能省）。第4层不刷。',
  '琥珀色的黄昏':'**只有组八枪才去**；没有五子弹就别来。',
  '肉斩骨断复刻':'不走花信时，**开局观测饰品**就能省掉。',
  '时间杀人时间复刻':'**最后走**（第10层发育好再去），震颤专属一次买齐。**至少合出双表**（Type E＋Type Y，反着合）；**徽章看到必拿**。',
  '深夜清扫复刻':'进包先拿**影织斗笠**（群体加减伤）。',
  '经验记忆':'6 件限定，**按主力技能属性和阵营条件**选。',
  '自黎明后贯穿而来':'拿**黑色三角帽**、追击药材、榜样；领巾和枪尖优先级低。',
  '20区的奇迹复刻':'可选：主要拿**快乐的毛绒玩偶**，礼物和影子怪物随缘。',
  '3号线':'**未孵化的火种**尽量 12 层前拿；火种也能合成。',
  '紫色编码':'保命可选，**11–12层打**；通关送量产型K公司安瓿。',
  '身负重担者们':'通关送**燃烧的命运**（烧伤最大威力+30）。尽量 11–12 层，13 层后风险高。',
  '插翅虎':'通关送**为了指挥官**：只有一号位受益（暴怒共鸣、弹药技能）。',
  '仲春夜之梦2':'通关送**可米的小小礼物**；备用糖果不吃会叠饥饿。',
  '永劫的枷锁':'**软柿子**，难度低，可以收尾。',
  '血腥味':'**软柿子**：通关送拍手啪啪！（黑色三角帽能联动）。',
  '精灵童话':'**软柿子**，但敌人血厚、打得久。',
  '去·海·边·激·蟹':'怪多，**有群攻 EGO 才稳**；没有就选别的软柿子。',
  '进入某座图书馆的某本藏书':'**软柿子**：看开局小怪动作再决定打法。'
 },
 wedgeVideo:{
  '信仰与侵蚀':'拿**血红鬃毛**。',
  '当斩之物':'补一件**通用斩击**饰品。',
  '无法去爱':'想合**霜冻足迹**才来（拿冰封的哀嚎）。这次不特别推荐。',
  '自动工厂':'想合**霜冻足迹**才来（拿鬼附鞋）。这次不特别推荐。',
  '地狱鸡':'先拿**探戈鸡酱料**；针线随缘。',
  '落花':'走花信、**缺山茶花枝**才来。',
  '无改变者':'走花信、**缺眼镜**才来。',
  '由子弹画下的句点':'拿**黑焰烟斗**和齿轮碎片；近身格斗术教材也在这包。',
  '憎恶与绝望':'3–4层限定包都有收益；**观测了饰品**能省掉。',
  '伏行深渊':'作者：**收益神秘，斟酌**。鲸心＋守镇鱼叉合万恶之终结（要后台三位裴廓德号）。',
  '2号线':'作者：**建议必去**。先看**枷锁**适不适合，节拍器备选。',
  '自黎明后贯穿而来':'作者：**建议必去**——**白色领巾**、精心分类的药材、**黑色三角帽**。',
  '1号线':'两件限定，**看阵容能不能触发**再拿。',
  '深夜清扫复刻':'**影织斗笠**要看人格 / 速度条件，不是谁都必拿。',
  '3号线':'**未孵化的火种**，5–10层遇到可以提前打。',
  '20区的奇迹复刻':'按缺口拿：**呼吸、经济或合成材料**。',
  '不思观望':'作者：这体系没什么包好去，**镜中花 / 水中月**能补暴击增伤（十二人效果达不到不算）。',
  '时间杀人时间复刻':'**晚点走**（第10层发育好再去），**双表 Type E＋Type Y**（反着合）；**徽章看到必拿**。',
  '仲春夜之梦2':'通关送**可米的小小礼物**。',
  '血腥味':'**软柿子**：通关送拍手啪啪！（黑色三角帽能联动）。',
  '精灵童话':'通关送**再来一杯！**。注意**强制回合结束**，主C不一定每回合开满防御。',
  '永劫的枷锁':'**软柿子**，难度低。',
  '插翅虎':'通关送**为了指挥官**：只有一号位受益。'
 }
};
// 小指良：说明是按楼层写的（含同层其他包），按楼层换
const R37_PINKY_PLAIN={
 1:{goal:'**信仰与侵蚀拿血红鬃毛**（小指良三技能是暴怒），但小怪难缠；也能去当斩之物补斩击。**不建议专门合霜冻足迹**；也可以走可选里有经济饰品的节点。',map:'冰封的哀嚎靠受击上沉沦，**闪避型的小指良收益打折**。'},
 2:{goal:'离开前**必须有鸡腿和探戈鸡酱料**（没鸡酱可以重开），最好再有两种针线。',map:'炸鸡对决能白拿两件：留**鸡腿**和激情探戈相关的。'},
 3:{goal:'落花只在第3层刷新，**观测山茶花枝**能省掉它。想做花信就走**落花**拿山茶花枝（之后基本必走无改变者）；否则走**由子弹画下的句点**拿黑焰烟斗和齿轮碎片。',map:'**黑焰烟斗**无条件给守备两层强壮，齿轮碎片泛用。'},
 4:{goal:'作者**建议去憎恶与绝望**：**灰色星座的加护必拿**；“盾牌”对单通帮助大；未被选中之人看到也拿。',map:'第4层能刷的包都能按观测省下的位置选，目标是**拿够专属饰品**。整包质量高，不建议跳过。'},
 5:{goal:'三拇指队先奉纳**雪茄**；**红领带**可以拿去合成。',map:'走了落花就安排**无改变者**拿眼镜和未寄出的信（合花信）；无改变者、教材都能**开局观测**省掉。1号线（虚假的光相、蛇蜕）通用可选。'},
 6:{goal:'先看**枷锁**适不适合，节拍器备选。',map:'**霍恩海姆反伤很强**，生存够了再去。'},
 7:{goal:'**深夜清扫复刻必拿影织斗笠**（小指良速度快，加伤减伤基本吃满）；镌刻的异文、异文符咒也推荐。作者省流图里它是“可去”。',map:'登场类饰品要挨打才划算，**闪避型的小指良不一定吃得到**。'},
 8:{goal:'**影织斗笠**要看人格 / 速度条件，不是谁都必拿。',map:'**空洞的自尊**只扣攻击技能的理智，小指良靠闪避和守备也能撑过 6 场。'},
 9:{goal:'**经验记忆**：三件斩击饰品（菖蒲剑、粉碎的木制刑具、无纹的刀镡）和**白瓷砚滴**都拿；观测了红色流苏就能在这合**本国剑谱**。肉斩骨断复刻可以靠观测红色流苏省掉。20区：**毛绒玩偶从下方可选拿**，礼物袋也值得拿。',map:'关底**林庆业是流血系**，比较可怕：手动闪避，速战速决。'},
 10:{goal:'6 件限定，**按主力技能属性和阵营条件**选。',map:'W列车可拿生物发电电池、心脏反应模块，血液结晶能对付大量流血的头目；**别合四级充能饰品**。W列车**不是必去**，怪偏难。'},
 11:{goal:'通关送**燃烧的命运**（烧伤最大威力+30）。',map:'3号线的火种也能这时拿，**别拖到13层以后**。'},
 12:{goal:'**家人的怨恨**：流血攻击后回血、强壮。',map:'后面的蒸汽运输机和凤老爹没什么要注意的。'},
 13:{goal:'通关送**为了指挥官**：只有一号位受益。',map:'求稳的话**13–14层就能开始打软柿子**（列表见第15层）。'},
 14:{goal:'通关送**可米的小小礼物**。',map:'按实际候选选**熟悉的低风险包**。'},
 15:{goal:'**软柿子**：血腥味很好打。',map:'作者列的**软柿子**：血腥味（很好打）、永劫的枷锁（难度很低）、去·海·边·激·蟹（有群攻 EGO 简单很多）、精灵童话（打得久）、进入某座图书馆的某本藏书（凹开局让小怪挂机）；插翅虎、仲春夜之梦2 也能最后打。'}
};
// 小指良 5、6、8、10–15 层的说明跟着所选卡包走
const R37_PINKY_PACK={...R37_OLD_PLAIN.burnVideo,'2号线':'先看**枷锁**适不适合，节拍器备选。','深夜清扫复刻':'**影织斗笠**要看人格 / 速度条件，不是谁都必拿。','拉·曼却领之主':'**家人的怨恨**：流血攻击后回血、强壮。','即刻处刑时间':'**中指规矩**：打击硬币威力+1。','血腥味':'**软柿子**，很好打。'};
{const oldG=packGuide;packGuide=()=>{const g=oldG();if(!g)return g;const t=state.team;
 if(isPinky()){if([1,2,3,4,7,9].includes(state.floor)){const v=R37_PINKY_PLAIN[state.floor];return v?{...g,goal:v.goal}:g}const v=R37_PINKY_PACK[activePack()];return v?{...g,goal:v}:g}
 const v=R37_OLD_PLAIN[t]?.[activePack()];return v?{...g,goal:v}:g};
 const oldS=source;source=()=>{const d=oldS();if(!d||!isPinky())return d;const v=R37_PINKY_PLAIN[state.floor];return v?{...d,goal:[1,2,3,4,7,9].includes(state.floor)?v.goal:d.goal,map:v.map}:d}}
// ===== R38：一键更新——打开几秒后自动检查；有新版在顶栏下面显示一条，点“一键更新”下载变了的文件，好了就重启 =====
const R38_PAN='https://github.com/MouranKK/Mirror-Dungeon-Overlay/releases/latest'; /* 下载页用 GitHub（百度网盘不一定及时更新） */
let r38State={phase:'idle',info:null,msg:''},r38Hide=false;
function r38Bar(){let el=document.getElementById('r38upd');const tb=document.querySelector('header.toolbar');
 const s=r38State,i=s.info;let h='';
 if(!r38Hide&&i?.hasUpdate){
  if(i.fullNeeded)h=`<b>有新版本 ${escapeHTML(i.latest)}</b> 这次要下载完整包：<button type="button" data-r38="pan">打开下载页</button><button type="button" data-r38="later">以后再说</button>`;
  else if(s.phase==='busy')h=`<b>正在更新…</b> ${escapeHTML(s.msg)}`;
  else if(s.phase==='done')h=`<b>更新好了</b>，正在重启…`;
  else if(s.phase==='fail')h=`<b>更新没成功</b>：${escapeHTML(s.msg)} <button type="button" data-r38="go">再试一次</button><button type="button" data-r38="pan">去下载页下载</button><button type="button" data-r38="later">关掉</button>`;
  else h=`<b>有新版本 ${escapeHTML(i.latest)}</b>（现在 ${escapeHTML(i.current)}）${i.notes?.length?`<small>${escapeHTML(i.notes.slice(0,2).join('；'))}</small>`:''}<button type="button" data-r38="go">一键更新</button><button type="button" data-r38="later">以后再说</button>`}
 if(!h){el?.remove();return}
 if(!el){el=document.createElement('div');el.id='r38upd';(tb||document.body.firstElementChild).insertAdjacentElement('afterend',el)}
 el.innerHTML=h}
async function r38Check(manual){if(!window.MD_UPDATE)return null;r38Hide=false;try{r38State.info=await window.MD_UPDATE.check()}catch{r38State.info=null}r38Bar();const c=document.querySelector('.r38card small');if(c){const i=r38State.info;c.textContent=!i?.ok?'连不上更新服务器，稍后再试。':i.hasUpdate?`有新版本 ${i.latest}，看顶上那一条。`:`已经是最新版（${i.current}）。`}return r38State.info}
async function r38Go(){r38State.phase='busy';r38State.msg='正在下载…';r38Bar();
 window.MD_UPDATE.onProgress(p=>{r38State.msg=`下载 ${p.i}/${p.n} 个文件 · ${(p.got/1048576).toFixed(1)}/${(Math.max(p.total,p.got)/1048576).toFixed(1)} MB`;r38Bar()});
 const r=await window.MD_UPDATE.apply();
 if(r?.ok){r38State.phase='done';r38Bar();setTimeout(()=>window.MD_UPDATE.restart(),1200)}
 else{r38State.phase='fail';r38State.msg=/下载失败/.test(r?.error||'')?'网络连不上下载服务器':/EPERM|EACCES|EBUSY/.test(r?.error||'')?'程序文件夹不能写入（放在了受保护的位置？把整个文件夹挪到桌面再试）':(r?.error||'未知原因');r38Bar()}}
document.addEventListener('click',e=>{const b=e.target.closest('[data-r38]');if(!b)return;const a=b.dataset.r38;
 if(a==='go')r38Go();else if(a==='later'){r38Hide=true;r38Bar()}else if(a==='pan')window.open(R38_PAN);else if(a==='code'){r37Copy('1234');b.textContent='已复制'}else if(a==='check'){b.textContent='检查中…';r38Check(true).then(()=>{b.textContent='检查更新'})}});
{const oldR=renderReference;renderReference=(...a)=>{const r=oldR(...a);if(window.MD_UPDATE&&currentRef?.kind==='r13detail'&&currentRef.item==='settings'){const body=$('refBody');if(body&&!body.querySelector('.r38card')){const v=(document.title.match(/测试版 ([0-9.]+)/)||[])[1]||'';body.insertAdjacentHTML('beforeend',`<div class="panelCard r38card"><b>更新</b> 现在是 ${escapeHTML(v)} <button type="button" data-r38="check">检查更新</button><br><small class="minor"></small></div>`)}}return r}}
if(window.MD_UPDATE)setTimeout(()=>r38Check(false),6000);
// R14 initialization.
update();
if('serviceWorker' in navigator && location.protocol==='https:')window.addEventListener('load',()=>navigator.serviceWorker.register('./overlay-sw.js').catch(()=>{}));
})();
