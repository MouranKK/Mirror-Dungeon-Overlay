(()=>{'use strict';
// Standalone mini companion. Intentionally NOT synchronized to the legacy guide's floor key:
// previously a failed gift render left the old floor body visible after the header advanced.
const $=id=>document.getElementById(id);
const KEY='md-gamebar-overlay-v1';
const STAGES=['packs','map','gifts','shop','trial'];
const names={packs:'卡包',map:'地图',gifts:'饰品',shop:'商店',trial:'层末'};
const STORE=window.MD_OVERLAY_STORE||{};
const VIDEO=window.VIDEO_GUIDES||{};
const AUDIT=window.GIFT_AUDIT||{};
const KNOW=window.MD_OVERLAY_KNOWLEDGE||{gifts:[],packs:{},sources:{}};
const VIS=window.MD_VISUALS;
const BOSSES=window.MD_OVERLAY_BOSSES||{hidden:[],extreme:[],intro:{}};
const META=Object.fromEntries((KNOW.gifts||[]).map(x=>[x.name,x]));
const PACKAGE_INFO=KNOW.packs||{};
const escapeHTML=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let state={team:'burnVideo',floor:0,stage:'packs',expanded:false,full:false,opacity:94,packChoice:{}};
let filterCategory='全部',filterSearch='';
try{const saved=JSON.parse(localStorage.getItem(KEY)||'{}');state={...state,...saved};}catch{}
if(!['burnVideo','wedgeVideo'].includes(state.team))state.team='burnVideo';
if(!Number.isInteger(state.floor)||state.floor<0||state.floor>15)state.floor=0;
if(!STAGES.includes(state.stage))state.stage='packs';
if(!state.packChoice||typeof state.packChoice!=='object')state.packChoice={};
let refStack=[];let currentRef=null;
function persist(){try{localStorage.setItem(KEY,JSON.stringify(state));}catch{}}
const A2ZH={
 'Emergency Investigator Badge':'紧急授予型搜查官徽章',
 'Hot ‘n Juicy Drumstick':'火热多汁琵琶腿',
 'Pocket Watch - Type L':'L型怀表',
 'Pocket Watch - Type E':'E型怀表',
 'Pocket Watch - Type Y':'Y型怀表',
 'Pocket Watch - Type P':'P型怀表',
 'Haunted Shoes':'鬼附鞋','Frozen Cries':'冰封的哀嚎','Hoarfrost Footprint':'霜冻足迹',
 'Spicebush Branch':'山茶花枝','Ragged Umbrella':'破旧的雨伞','Broken Glasses':'破碎的眼镜',
 'Unmailed Letter':'未寄出的信','Spicebush, Glasses, and Mailed Letter':'山茶花、眼镜和送达的信'
};
const ALIAS={
 '鸡腿肉':'火热多汁琵琶腿','火热多汁琵琶腿（俗称鸡腿肉）':'火热多汁琵琶腿',
 '震颤怀表':'L型怀表','时间杀人时间专属怀表':'L型怀表','怀表':'L型怀表',
 '搜查官徽章':'紧急授予型搜查官徽章','影织斗笠':'影织斗笠','迎击斗笠':'影织斗笠',
 '白领巾':'白色领巾','黑帽':'黑色三角帽','鸡酱':'探戈鸡酱料',
 '金色瓮':'金色瓮','声望卡':'声望卡'
};
const EXTRAS={
 '鬼附鞋':['Haunted Shoes',''],
 '冰封的哀嚎':['Frozen Cries',''],
 '霜冻足迹':['Hoarfrost Footprint',''],
 '归乡':['Homeward',''],
 '灰色大衣':['Grey Coat',''],
 '未孵化的火种':['Unhatched Embers',''],
 '尖锐的针与线':['Sharp Needle & Thread',''],
 '山茶花枝':['Spicebush Branch',''],
 '破旧的雨伞':['Ragged Umbrella',''],
 '破碎的眼镜':['Broken Glasses',''],
 '未寄出的信':['Unmailed Letter',''],
 '山茶花、眼镜和送达的信':['Spicebush, Glasses, and Mailed Letter','']
};
const DESCR={
 '翼形蜡烛':['三黎明编队的重点饰品，强化黎明相关机制。','解放的暴怒'],
 '奉纳的雪茄':['拇指队阵营饰品，强调至少三名拇指实际上场。','教材'],
 '白色领巾':['楔子奥提斯连携启动所需的胜机支持。','黎明后贯穿而来'],
 '黑色三角帽':['楔子呼震专属，配合震颤引爆与拍手啪啪。','黎明后贯穿而来'],
 'L型怀表':['震颤队关键怀表，改善特定技能的威力与伤害。','时间杀人时间复刻／固定合成'],
 'P型怀表':['震颤关键词怀表，拼点及特殊触发效果。','时间杀人时间复刻／固定合成'],
 '震颤耦合':['震颤合成饰品，要求相应关键词人数才能完整发挥。','固定合成'],
 '探戈鸡酱料':['第2层地狱鸡优先争取的泛用高性价比饰品。','地狱鸡'],
 '火热多汁琵琶腿':['早期伤害补强，出自地狱鸡相关内容。','地狱鸡'],
 '声望卡':['购买E.G.O饰品时降低Cost消耗，越早入手越有经济收益。','起始饰品观测／商店'],
 '归乡':['进战时为出战单位回复生命，提高高层容错。','泛用商店／对应掉落'],
 '灰色大衣':['符合攻击重量／属性条件时提供回血及输出加成。','泛用收益'],
 '霜冻足迹':['沉沦辅助饰品，有利于降低敌方拼点压力；非烧震必备。','固定合成'],
 '齿轮碎片':['是可能获取的E.G.O饰品，不能把它当固定合成的成品。','由子弹画下的句点'],
 '镇魂':['烧伤高阶合成目标，凑齐材料后才建议投入。','固定合成'],
 '福袋':['呼吸法拼点强化，生效条件与出战关键词人数有关。','固定合成'],
 '山茶花枝':['花信两阶段合成的前置材料。','落花'],
 '破碎的眼镜':['特殊拼点效果及花信材料。','无改变者'],
 '未寄出的信':['山茶花后续组合的中间产物。','固定合成'],
 '紧急授予型搜查官徽章':['救命效果依赖指定出战顺位；请核实出战次序。','时间杀人时间复刻'],
 '拍手啪啪':['与黑色三角帽的震颤联动可强化高层伤害。','血腥味'],
 '精细分类的药材':['楔子连携追击补强，效果依赖具体身份与技能。','黎明后贯穿而来'],
 '银色表壳':['怀表固定配方素材，先保留。','时间杀人时间复刻'],
 '褪色表壳':['怀表固定配方素材，先保留。','时间杀人时间复刻'],
 '蚀刻的钟针':['怀表固定配方素材，先保留。','时间杀人时间复刻'],
 '生锈的钟针':['怀表固定配方素材，先保留。','时间杀人时间复刻']
};
const RANK={
 burnVideo:[['翼形蜡烛','核心'],['奉纳的雪茄','核心'],['L型怀表','核心'],['震颤耦合','合成'],['探戈鸡酱料','早期'],['声望卡','经济'],['归乡','恢复'],['紧急授予型搜查官徽章','保命'],['灰色大衣','条件回复'],['火热多汁琵琶腿','早期'],['镇魂','烧伤'],['霜冻足迹','可选']],
 wedgeVideo:[['白色领巾','核心'],['黑色三角帽','核心'],['L型怀表','核心'],['拍手啪啪','连携'],['福袋','合成'],['震颤耦合','合成'],['探戈鸡酱料','早期'],['归乡','恢复'],['紧急授予型搜查官徽章','保命'],['声望卡','经济'],['精细分类的药材','配套'],['霜冻足迹','可选']]
};
const EXTRA_RECIPES={
 '霜冻足迹':[['鬼附鞋','冰封的哀嚎']],
 '未寄出的信':[['破旧的雨伞','破碎的眼镜']],
 '山茶花、眼镜和送达的信':[['山茶花枝','未寄出的信']]
};
function canonical(n){return ALIAS[n]||n}
function english(n){n=canonical(n);if(META[n]?.english)return META[n].english;return Object.entries(A2ZH).find(([,v])=>v===n)?.[0]||Object.entries(AUDIT.zh||{}).find(([,v])=>v===n)?.[0]||EXTRAS[n]?.[0]||''}
function icon(n){n=canonical(n);return VIS.src('gift',n)}
function packIcon(n){return VIS.src('pack',n)}
function link(n){return `<button type="button" class="textLink" data-item="${escapeHTML(canonical(n))}">${escapeHTML(n)}</button>`}
function info(n){return META[canonical(n)]||{};}
function smallMeta(n){const x=info(n);return `${x.category||'属性待核对'} · ${x.tierVerified?x.tier+'级':'未匹配'}`;}
function giftImage(n){const url=icon(n);return url?`<img src="${escapeHTML(url)}" alt="${escapeHTML(n)}图片卡片；用户可自行导入游戏截图" loading="lazy" onerror="this.style.visibility='hidden'">`:''}
function getRecipes(n){n=canonical(n);const en=english(n);const found=[];for(const arr of (AUDIT.recipes?.[en]||[]))if(Array.isArray(arr))found.push(arr.map(z=>A2ZH[z]||AUDIT.zh?.[z]||z));return [...found,...(EXTRA_RECIPES[n]||[])];}
function source(){return STORE[state.team]?.[state.floor]||null}
function activePack(){const d=source();if(!d)return '';const c=state.packChoice[state.team+':'+state.floor];return c||d.packs?.[0]||'';}
function packGuide(){return PACKAGE_INFO[activePack()]||null;}
function activeGifts(){const pg=packGuide();return pg?.gifts?.length?pg.gifts:source()?.gifts||[];}
function selectPack(n){if(!n)return;state.packChoice[state.team+':'+state.floor]=n;state.stage='map';state.expanded=true;update();}
function video(){return VIDEO[state.team]||{packs:{},floors:[]}}
function setAlpha(x){state.opacity=Math.max(65,Math.min(100,Number(x)||94));document.documentElement.style.setProperty('--alpha',String(state.opacity/100));$('opacity').value=String(state.opacity);}
function summary(){
 const d=source(),v=video(),i=state.floor,stage=state.stage;
 if(i===0){
   const burn=state.team==='burnVideo';
   return {label:'开局 · 直接照做',cmd:burn?'三黎明＋三拇指':'三楔子＋黎明／呼震补位',sub:burn?'先选震颤起手饰品；优先认识翼形蜡烛':'起手呼吸／震颤；优先白色领巾',image:icon(burn?'翼形蜡烛':'白色领巾')};
 }
 if(!d)return {label:'数据缺失',cmd:'本层没有可靠资料',sub:'请切换回完整攻略查看',image:''};
 if(stage==='packs')return {label:`第 ${i} 层 · 选卡包`,cmd:`当前：${activePack()||'先选卡包'}`,sub:'点击展开选择实际进入的卡包；会联动整层路线',image:packIcon(activePack())};
 if(stage==='map')return {label:`第 ${i} 层 · 走地图`,cmd:packGuide()?.priorityNode||d.map||d.goal,sub:activePack()+' · '+(packGuide()?.goal||d.goal||''),image:packIcon(activePack())};
 if(stage==='gifts')return {label:`第 ${i} 层 · 找饰品`,cmd:`优先：${activeGifts()[0]||'按实际卡包查找'}`,sub:activePack()+' · '+(activeGifts()||[]).slice(1,3).join(' · '),image:icon(activeGifts()[0])};
 if(stage==='shop')return {label:`第 ${i} 层 · 商店`,cmd:packGuide()?.shop||d.shop?.[0]||'先找核心饰品',sub:activePack()+' · 需要时展开买卖与合成',image:icon(activeGifts()[0])};
 if(stage==='trial')return {label:`第 ${i} 层 · 层末`,cmd:i===15?'最终层：通关结算':i===10?'先选择 11–15 层制约目标':state.floor>=11&&state.full?'全制约：按游戏当前可选项加满':'试炼：优先敌方加血／防御',sub:state.floor>=11?`当前：${state.full?'全制约挑战':'普通通关，不加额外制约'}`:'尽量避开敌方硬币威力、拼点威力',image:''};
 return {label:'指令',cmd:d.goal,sub:'',image:''};
}
function update(){
 const s=summary();
 $('team').value=state.team;$('floor').value=String(state.floor);
 $('prev').disabled=state.floor===0;$('next').disabled=state.floor===15;
 $('smallLabel').textContent=s.label;$('command').textContent=s.cmd;$('subline').textContent=s.sub;
 $('heroImg').src=s.image||'./overlay-icon-192.png';$('heroImg').alt=s.image?`${s.cmd}图片`:'镜牢指挥条标志';
 document.querySelectorAll('[data-stage]').forEach(x=>x.classList.toggle('active',x.dataset.stage===state.stage));
 $('sheet').hidden=!state.expanded||!!currentRef;
 $('expand').textContent=state.expanded?'▴':'▾';
 $('expand').setAttribute('aria-expanded',String(state.expanded));
 if(state.expanded&&!currentRef)renderSheet();
 $('reference').hidden=!currentRef;
 setAlpha(state.opacity);persist();
 document.title=`镜牢指挥条 · ${state.floor?'第'+state.floor+'层':'开局'}`;
}
function packCard(n,idx){const src=packIcon(n),chosen=activePack()===n;return `<button type="button" data-pack="${escapeHTML(n)}" class="visual packChoice${chosen?' chosen':''}${src?'':' noimg'}">${src?`<img src="${escapeHTML(src)}" alt="${escapeHTML(n)}卡包封面" loading="lazy">`:''}<b>${escapeHTML(n)}</b><em>${chosen?'✓ 当前路线':idx===0?'★ 视频首选':`备选 ${idx}`}</em></button>`}
function giftCard(n){return `<button type="button" class="visual${VIS.custom('gift',canonical(n))?' userPicture':''}" data-item="${escapeHTML(canonical(n))}">${giftImage(n)}<b>${escapeHTML(n)}</b><em>${escapeHTML(smallMeta(n))}</em><small>${VIS.custom('gift',canonical(n))?'✓ 本地图':'原创示意图'} · 查看效果/配方</small></button>`}
function renderSheet(){
 const d=source(),floor=state.floor,stage=state.stage;
 const burn=state.team==='burnVideo';
 $('sheetTitle').textContent=floor===0?'开局准备':`${floor} 层 · ${names[stage]}`;
 let html='';
 if(floor===0){
   const team=burn?'黎明格里高尔、浮士德、辛克莱＋拇指罗佳、希斯克利夫、默尔索':'楔子奥提斯、唐吉诃德、辛克莱＋两黎明及呼吸／震颤补位';
   html=`<div class="panelCard"><b>① 编队</b><p>${escapeHTML(team)}</p></div><div class="panelCard"><b>② 起始饰品</b><p>${burn?'优先震颤起手（也可选烧伤）；重点关注声望卡、翼形蜡烛。':'优先呼吸法起手（缺震颤则选震颤），找白色领巾与黑色三角帽。'}</p><div class="visualList">${(burn?['声望卡','翼形蜡烛']:['声望卡','四叶草']).map(giftCard).join('')}</div></div><div class="panelCard"><b>③ 进入镜牢</b><p>进入困难模式，按楼层顺序查看攻略。星光加护清单已从此小窗移除。</p></div>`;
 }else if(!d)html='<div class="panelCard">当前楼层数据缺失，避免显示上一层错误攻略。</div>';
 else if(stage==='packs')html=`<div class="panelCard"><b>点击你在游戏中实际选中的卡包</b><div class="visualList">${(d.packs||[]).map(packCard).join('')}</div><p>一旦点击备用路线，地图、饰品与商店会全部切换，不再沿用原首选的目标。</p><p>其他卡包：<select id="packOther"><option value="">从其他卡包中挑选</option>${Object.keys(PACKAGE_INFO).sort().map(x=>`<option value="${escapeHTML(x)}" ${x===activePack()?'selected':''}>${escapeHTML(x)}</option>`).join('')}</select></p><p class="minor">图像为原创识别卡；需要游戏原图可在下方单独导入自己的截图。</p><button type="button" data-choose-pack="1">📷 给当前卡包添加我的截图</button></div><div class="panelCard"><b>当前：${escapeHTML(activePack())}</b><p>${escapeHTML(packGuide()?.goal||d.goal)}</p></div>`;
 else if(stage==='map'){const pg=packGuide();html=`<div class="panelCard"><b>当前路线：${escapeHTML(activePack())}</b><p>${escapeHTML(pg?.layout||'具体节点按实际地图判断')}</p><p class="recommend">优先路线：${escapeHTML(pg?.priorityNode||d.map)}</p></div><div class="panelCard"><b>① 事件（?）怎么走</b><p>${escapeHTML(pg?.event||'事件目标和选项尚未核实，请以游戏实物为准。')}</p></div><div class="panelCard"><b>② 战斗走不走</b><p>${escapeHTML(pg?.combat||'有确定的目标战斗时再走，优先保证队伍健康。')}</p></div><div class="panelCard"><b>③ 为什么走这里</b><p>${escapeHTML(pg?.goal||d.goal)}</p></div><div class="panelCard"><b>不要误选</b><p>${escapeHTML(pg?.warning||d.avoid||'不保证随机饰品必出。')}</p></div>${pg?.reference?`<div class="panelCard"><a class="sourceLink" href="${escapeHTML(pg.reference)}" target="_blank" rel="noopener">Wiki：查看此卡包详细节点 ↗</a></div>`:''}${floor>=11?`<div class="panelCard"><b>高层首领注意事项</b><p>神秘？可能变成独立隐藏BOSS，并非普通探索事件。优先保通关。</p><button type="button" data-open="bosses">☠ 查看隐藏首领／困难卡包打法</button></div>`:''}`;}
 else if(stage==='gifts')html=`<div class="panelCard"><b>${escapeHTML(activePack())}：优先找这些饰品</b><div class="visualList">${activeGifts().map(giftCard).join('')}</div><p>每张卡片标注属性与等级；尚未核实的标“等级未匹配”，不能据此搜索错误等级。</p></div><div class="panelCard"><b>掉落怎么判断</b><p>${escapeHTML(packGuide()?.event||d.avoid||'可能来自事件／商店／层末奖励；并非指定节点必出。')}</p><p>${escapeHTML(packGuide()?.warning||'')}</p></div>`;
 else if(stage==='shop')html=`<div class="panelCard"><b>${escapeHTML(activePack())}：本层商店</b><p>${linkify(escapeHTML(packGuide()?.shop||d.shop?.[0]||'买实际有用的饰品'))}</p></div><div class="panelCard"><b>本包先找</b><div class="visualList">${activeGifts().slice(0,5).map(giftCard).join('')}</div></div><div class="panelCard"><b>固定操作</b><ol><li>先保留本包专属和未来配方材料。</li><li>已齐合成材料 → 固定合成；不齐跳过。</li><li>购买当前能触发的关键词及通用保命饰品。</li><li>最后才强化确定会使用的成品；合成材料暂时不强化。</li></ol><button type="button" data-open="recipes">⚗ 打开配方表</button></div>`;
 else if(stage==='trial'){
   const txt=floor===15?'最后一层结算，不必再给下一层准备试炼。':floor<10?'优先敌方体力／防御类低风险选项；避免敌方硬币威力、拼点威力及过多攻击等级。':floor===10?'进入极限平行叠加前，选择本趟第11–15层的目标。':state.full?'全制约挑战：本层在游戏界面尽量选择全部可选的额外制约；实际效果累积，优先确保能打赢战斗。':'普通通关：不要额外叠加自选制约；层末试炼依旧优先对敌方攻势影响最小的条目。';
   html=`<div class="panelCard"><b>层末奖励／试炼</b><p>${escapeHTML(txt)}</p></div>`;
   if(floor>=11)html+=`<div class="panelCard"><b>突然出现特殊「？」隐藏首领</b><p>满制约通关无需击败隐藏BOSS；11–12层有强力回复才考虑挑战；14–15层默认跳过。</p><button type="button" data-open="bosses">☠ 查看四种隐藏首领的打法／危险技能</button></div>`;
   if(floor>=10)html+=`<div class="panelCard"><b>11–15 层挑战模式</b><div class="modeBtns"><button type="button" data-mode="safe" class="${state.full?'':'chosen'}">普通通关<br>不选额外制约</button><button type="button" data-mode="all" class="${state.full?'chosen':''}">全制约挑战<br>每层尽量选满</button></div><p class="minor">此处设置仅改变提示。游戏内仍须在11–15层逐层操作，不能一键代选。</p></div>`;
 }
 $('sheetBody').innerHTML=html;
}
function linkify(s){const words=['翼形蜡烛','奉纳的雪茄','白色领巾','黑色三角帽','震颤耦合','霜冻足迹','红领带','镇魂','福袋','归乡','灰色大衣','声望卡','探戈鸡酱料','银色表壳','褪色表壳','蚀刻的钟针','生锈的钟针','齿轮碎片','L型怀表','P型怀表','破碎的眼镜','山茶花枝','拍手啪啪'];for(const n of words.sort((a,b)=>b.length-a.length))s=s.split(n).join(`@@${n}@@`);return s.replace(/@@(.+?)@@/g,(_,n)=>link(n));}
function reference(title,kind,item){refStack.push(currentRef);currentRef={title,kind,item};state.expanded=false;$('extras').hidden=true;renderReference();update();}
function backReference(){currentRef=refStack.pop()||null;renderReference();update();}
function rankResults(){const q=filterSearch.trim().toLowerCase();return (KNOW.gifts||[]).filter(x=>(filterCategory==='全部'||x.category===filterCategory)&&(!q||[x.name,x.english,x.category].some(v=>(v||'').toLowerCase().includes(q)))).sort((a,b)=>({S:0,A:1,B:2}[a.grade]??3)-({S:0,A:1,B:2}[b.grade]??3)).map((x,i)=>`<button type="button" data-item="${escapeHTML(x.name)}" class="listRow">${giftImage(x.name)||'<span class="rankNoImg">◈</span>'}<span class="copy"><b>${i+1}. ${escapeHTML(x.name)} <span class="rank">${x.grade}</span></b><small>${escapeHTML(x.category)} · ${x.tierVerified?escapeHTML(x.tier)+'级':'未匹配'} · ${escapeHTML(x.source)}</small><small>${escapeHTML(x.description)}</small></span><span class="arrow">›</span></button>`).join('')||'<p class="minor">没有匹配条目，请尝试其他关键词或分类。</p>';}
function renderReference(){if(!currentRef)return;const r=currentRef;$('refTitle').textContent=r.title;let html='';
 if(r.kind==='images'){
   html=`<div class="panelCard"><b>图片管理 · 公开版</b><p>已保存 ${VIS.count()} 张个人图片。程序附带的卡片均为原创示意图，不是游戏图标。你可以用自己的截图替换，它们只保存在当前电脑，不会上传到 GitHub 或网络。</p><p>批量导入：文件名请用“饰品中文名.png / 英文名.png / 卡包中文名.png”。也可在某件饰品详情页单独导入，名字不必匹配。</p><button type="button" data-batch-images="1">📂 从文件夹批量匹配图片</button><button type="button" data-clear-images="1">清除我导入的图片</button><p class="minor">仅支持 PNG/JPEG/WebP，每张≤8MB；名称不匹配的文件会跳过。请使用你有权自行保存和使用的图片。</p></div>`;
 }
 if(r.kind==='rank'){
   const categories=['全部','通用','烧伤','震颤','呼吸法','流血','破裂','沉沦','充能','斩击','打击','突刺'];
   html=`<div class="panelCard"><p>已核对 ${KNOW.tierAudit?.verified||0}/${KNOW.gifts.length} 件饰品的游戏等级；其余名称无法可靠匹配，已单独警示。按综合实战价值评级；“Wiki等级”是游戏稀有度，不等于评级。这里的 S/A/B 不是 Wiki 官方排名。</p><div class="catChoices">${categories.map(c=>`<button type="button" data-cat="${c}" class="${filterCategory===c?'chosen':''}">${c}</button>`).join('')}</div><input type="search" id="giftSearch" value="${escapeHTML(filterSearch)}" placeholder="搜索中文或英文名称"><p class="minor">S：优先检查 · A：强力/条件优秀 · B：材料/特定队伍。无法核实的图标和等级不会伪造。</p></div><div id="rankResults">${rankResults()}</div><div class="panelCard"><a class="sourceLink" href="${escapeHTML(KNOW.sources?.tierIndex||'https://limcogito.com/md-gifts')}" target="_blank" rel="noopener">查完整 Wiki 数据库（含全部已收录饰品） ↗</a></div>`;
 }
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
  html=(url?`<img class="refImg" src="${escapeHTML(url)}" alt="${escapeHTML(name)}饰品图片">`:'')+
     `<div class="panelCard"><b>${escapeHTML(name)}</b><p>类型：<b>${escapeHTML(md.category||'属性待核对')}</b> · Wiki等级：<b>${md.tierVerified?escapeHTML(md.tier)+'级':'未匹配到可靠条目'}</b> · 实战评级：<b>${escapeHTML(md.grade||'未评级')}</b></p><p class="refText">${escapeHTML(md.description||desc[0]||'当前效果以游戏内说明为准。')}</p><p class="refSub">获取：${escapeHTML(md.source||desc[1]||'按当前路线对应卡包或商店查找')}</p>${md.condition?`<p>生效条件：${escapeHTML(md.condition)}</p>`:''}${md.gameKeyword?`<p>游戏内关键词：${escapeHTML(md.gameKeyword)}</p>`:''}${md.verificationNote?`<p class="warning">校验提醒：${escapeHTML(md.verificationNote)}</p>`:''}<p class="minor">${VIS.custom('gift',name)?'正在显示你本机导入的图片':'当前是原创示意卡，不是游戏内原图'}</p><button type="button" data-choose-gift="${escapeHTML(name)}">📷 为此饰品导入我的截图</button> <a class="sourceLink" target="_blank" rel="noopener" href="${escapeHTML(VIS.wikiLink(name))}">在 Wiki 查看原始图标 ↗</a></div>`;
  if(recs.length)html+=recs.map(parts=>`<div class="panelCard"><b>固定合成公式</b><div class="visualList">${parts.map(giftCard).join('<span>＋</span>')}<span>→</span>${giftCard(name)}</div><p>${escapeHTML(parts.join(' ＋ '))} → ${escapeHTML(name)}</p><p class="minor">到商店 → 合成 → 放入这些材料。材料未齐时不要盲合。</p></div>`).join('');
  else html+='<div class="panelCard"><b>固定合成</b><p>没有已核对的专属固定配方；不要把随机合成当成获取保证。</p></div>';
  const partOf=[];
  for(const [target,rs] of Object.entries({...EXTRA_RECIPES,...Object.fromEntries(Object.entries(AUDIT.recipes||{}).map(([en,ps])=>[A2ZH[en]||AUDIT.zh?.[en]||en,ps.map(row=>row.map(z=>A2ZH[z]||AUDIT.zh?.[z]||z))]))}))if(rs.some(row=>row.includes(name)))partOf.push(target);
  if(partOf.length)html+=`<div class="panelCard"><b>可以作为以下配方的材料</b><p>${partOf.map(link).join('、')}</p></div>`;
 }
 $('refBody').innerHTML=html;
}
function jump(f){state.floor=Math.max(0,Math.min(15,f));state.expanded=false;currentRef=null;refStack=[];$('extras').hidden=true;update();}
function changeTeam(t){if(!STORE[t])return;state.team=t;state.floor=0;state.expanded=false;currentRef=null;refStack=[];update();}
$('floor').innerHTML=Array.from({length:16},(_,i)=>`<option value="${i}">${i===0?'开局':i+' 层'}</option>`).join('');
$('prev').onclick=()=>jump(state.floor-1);$('next').onclick=()=>jump(state.floor+1);
$('floor').onchange=()=>jump(Number($('floor').value));$('team').onchange=()=>changeTeam($('team').value);
$('expand').onclick=()=>{state.expanded=!state.expanded;$('extras').hidden=true;update();};
$('summary').addEventListener('click',e=>{if(e.target.closest('button'))return;state.expanded=!state.expanded;update()});
$('closeSheet').onclick=()=>{state.expanded=false;update()};
document.querySelectorAll('[data-stage]').forEach(b=>b.onclick=()=>{state.stage=b.dataset.stage;currentRef=null;refStack=[];update()});
$('settings').onclick=()=>{$('extras').hidden=!$('extras').hidden;state.expanded=false;update()};
$('openImages').onclick=()=>reference('🖼 图片管理','images');
$('openRank').onclick=()=>reference('★ 饰品优先表','rank');
$('openRecipes').onclick=()=>reference('⚗ 固定合成配方','recipes');
$('openBoss').onclick=()=>reference('☠ BOSS 与特殊？节点攻略','bosses');
$('openFull').onclick=()=>window.open('https://github.com/MouranKK/Mirror-Dungeon-Overlay','_blank','noopener');
$('opacity').oninput=e=>{setAlpha(e.target.value);persist()};
$('backRef').onclick=backReference;$('closeRef').onclick=()=>{currentRef=null;refStack=[];update()};
async function chooseFile(type,name){
 const input=document.createElement('input');input.type='file';input.accept='image/png,image/jpeg,image/webp';
 input.onchange=async()=>{const f=input.files?.[0];if(!f)return;try{await VIS.save(type,name,f);update();if(currentRef)renderReference();}catch(e){window.alert('图片导入失败：'+e.message)}};
 input.click();
}
async function chooseBatch(){
 const input=document.createElement('input');input.type='file';input.accept='image/png,image/jpeg,image/webp';input.multiple=true;
 input.onchange=async()=>{const f=input.files;if(!f?.length)return;const r=await VIS.batch(f);window.alert(`已匹配 ${r.success} 张；跳过 ${r.skipped} 张；失败 ${r.failed} 张`);update();if(currentRef)renderReference()};input.click();
}
function delegated(e){const importPack=e.target.closest('[data-choose-pack]');if(importPack){chooseFile('pack',activePack());return;}const importGift=e.target.closest('[data-choose-gift]');if(importGift){chooseFile('gift',canonical(importGift.dataset.chooseGift));return;}const images=e.target.closest('[data-batch-images]');if(images){chooseBatch();return;}const clear=e.target.closest('[data-clear-images]');if(clear){if(window.confirm('清除当前电脑上导入的全部图片？'))VIS.removeAll().then(()=>{update();renderReference()}).catch(e=>window.alert(e.message));return;}const boss=e.target.closest('[data-boss]');if(boss){reference('☠ 隐藏首领','boss',boss.dataset.boss);return;}const hard=e.target.closest('[data-hardboss]');if(hard){reference('⚔ 高难主题包','hardboss',hard.dataset.hardboss);return;}const pk=e.target.closest('[data-pack]');if(pk){selectPack(pk.dataset.pack);return;}const cat=e.target.closest('[data-cat]');if(cat){filterCategory=cat.dataset.cat;renderReference();return;}const el=e.target.closest('[data-item]');if(el){reference(canonical(el.dataset.item),'gift',el.dataset.item);return;}const open=e.target.closest('[data-open]');if(open?.dataset.open==='recipes'){reference('⚗ 固定合成配方','recipes');return;}if(open?.dataset.open==='bosses'){reference('☠ BOSS 与特殊？节点攻略','bosses');return;}const mode=e.target.closest('[data-mode]');if(mode){state.full=mode.dataset.mode==='all';update();}}
$('sheetBody').addEventListener('click',delegated);$('refBody').addEventListener('click',delegated);
$('sheetBody').addEventListener('change',e=>{if(e.target?.id==='packOther'&&e.target.value)selectPack(e.target.value);});
$('refBody').addEventListener('input',e=>{if(e.target?.id==='giftSearch'){filterSearch=e.target.value;const el=$('rankResults');if(el)el.innerHTML=rankResults();}});
window.addEventListener('keydown',e=>{if(e.key==='Escape'){if(currentRef)backReference();else if(state.expanded){state.expanded=false;update()}}if(e.altKey&&e.key==='ArrowRight'){e.preventDefault();jump(state.floor+1)}if(e.altKey&&e.key==='ArrowLeft'){e.preventDefault();jump(state.floor-1)}});
// In case an individual gift image or description has changed, only the body is rebuilt after all data has loaded.
update();
VIS.ready.then(()=>{update();if(currentRef)renderReference()});
// No service worker in the reviewed, offline-first native source package.
})();
