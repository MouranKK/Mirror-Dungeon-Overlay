(function(){
'use strict';
// Corrected from exact named wiki.gg image files (Special:Redirect/file/<English>_Gift.png).
const img = {"Wing-shaped Waxen Candle":"","Tributary Cigar":"","White Cravat":"","Black Tricorne":"","Hot ‘n Juicy Drumstick":"","Tango Marinade":"","Emergency Investigator Badge":"","Searing Hammer":"","Red Necktie":"","Prestige Card":"","Soothe the Dead":"","Clappity Clap!":"","Carefully-selected Medicinal Herbs":"","Broken Spearhead":"","Lucky Pouch":"","Moon in the Water":"","Shadow Bamboo Hat":"","Silver Watch Case":"","Faded Watch Case":"","Etched Clock Hands":"","Rusted Clock Hands":"","Pocket Watch - Type L":"","Pocket Watch - Type E":"","Pocket Watch - Type Y":"","Pocket Watch - Type P":"","Ornamental Horseshoe":"","Four-leaf Clover":"","Reminiscence":"","Nixie Divergence":"","Bell of Truth":"","Interlocked Cogs":"","Coupled Oscillation":"","Ashes to Ashes":"","Dust to Dust":"","Secret Cookbook":"","Polarization":"","Lowest Star":"","Uniform - Liu Assoc.":"","Melted Paraffin":"","Decamillennial Stewpot":"","Gear Shrapnel":"","Pendant of Nostalgia":"","Recollection of a Certain Day":""};
const zh = {"Wing-shaped Waxen Candle":"翼形蜡烛","Tributary Cigar":"奉纳的雪茄","White Cravat":"白色领巾","Black Tricorne":"黑色三角帽","Hot ‘n Juicy Drumstick":"火热多汁琵琶腿","Tango Marinade":"探戈鸡酱料","Emergency Investigator Badge":"搜查官徽章","Searing Hammer":"灼热击锤","Red Necktie":"红领带","Prestige Card":"声望卡","Soothe the Dead":"镇魂","Clappity Clap!":"拍手啪啪","Carefully-selected Medicinal Herbs":"精细分类的药材","Broken Spearhead":"折断的枪尖","Lucky Pouch":"福袋","Moon in the Water":"水中月","Shadow Bamboo Hat":"影织斗笠","Silver Watch Case":"银色表壳","Faded Watch Case":"褪色表壳","Etched Clock Hands":"蚀刻的钟针","Rusted Clock Hands":"生锈的钟针","Pocket Watch - Type L":"L型怀表","Pocket Watch - Type E":"E型怀表","Pocket Watch - Type Y":"Y型怀表","Pocket Watch - Type P":"P型怀表","Ornamental Horseshoe":"马蹄铁饰物","Four-leaf Clover":"四叶草","Reminiscence":"追忆","Nixie Divergence":"尼克西分歧","Bell of Truth":"真理之钟","Interlocked Cogs":"咬合的齿轮","Coupled Oscillation":"震颤耦合","Ashes to Ashes":"灰归灰","Dust to Dust":"土归土","Secret Cookbook":"秘密食谱","Polarization":"偏振光","Lowest Star":"最低之星","Uniform - Liu Assoc.":"六协会大衣","Melted Paraffin":"熔化的石蜡","Decamillennial Stewpot":"万年炖锅","Gear Shrapnel":"齿轮碎片","Pendant of Nostalgia":"怀旧吊坠","Recollection of a Certain Day":"某日的记忆"};
const directRecipes = {"Soothe the Dead":[["Ashes to Ashes","Dust to Dust","Secret Cookbook"]],"Secret Cookbook":[["Melted Paraffin","Decamillennial Stewpot"]],"Uniform - Liu Assoc.":[["Lowest Star","Polarization","Red Necktie"]],"Lucky Pouch":[["Ornamental Horseshoe","Four-leaf Clover","Reminiscence"]],"Reminiscence":[["Pendant of Nostalgia","Recollection of a Certain Day"]],"Coupled Oscillation":[["Nixie Divergence","Interlocked Cogs","Bell of Truth"]],"Pocket Watch - Type L":[["Silver Watch Case","Etched Clock Hands"]],"Pocket Watch - Type E":[["Silver Watch Case","Rusted Clock Hands"]],"Pocket Watch - Type Y":[["Faded Watch Case","Etched Clock Hands"]],"Pocket Watch - Type P":[["Faded Watch Case","Rusted Clock Hands"]]};
const aliases = {"袖珍怀表系／时间杀人时间专属饰品":"Pocket Watch - Type L","时间杀人时间专属怀表":"Pocket Watch - Type L","红领带":"Red Necktie","拍手啪啪":"Clappity Clap!","灼热击锤":"Searing Hammer","搜查官徽章":"Emergency Investigator Badge","火热多汁琵琶腿（俗称鸡腿肉）":"Hot ‘n Juicy Drumstick","白色领巾":"White Cravat","黑色三角帽":"Black Tricorne","精细分类的药材":"Carefully-selected Medicinal Herbs","迎击斗笠":"Shadow Bamboo Hat","福袋":"Lucky Pouch","水中月":"Moon in the Water","折断的枪尖":"Broken Spearhead","奉纳的雪茄":"Tributary Cigar","翼形蜡烛":"Wing-shaped Waxen Candle","镇魂":"Soothe the Dead","声望卡":"Prestige Card","探戈鸡酱料":"Tango Marinade","齿轮碎片":"Gear Shrapnel","震颤耦合":"Coupled Oscillation"};
const watchVariants=['Pocket Watch - Type L','Pocket Watch - Type E','Pocket Watch - Type Y','Pocket Watch - Type P'];
const out = {};
for(const [target,arr] of Object.entries(directRecipes))out[target]=arr.map(mats=>({out:target,mats}));
function forItem(x){
  let en=aliases[x.name]||x.en||'';
  if(!img[en] && img[x.en])en=x.en;
  const steps=[];
  if(x.name.includes('怀表') && (x.name.includes('专属') || x.name.includes('L／E／Y／P'))){
    for(const k of watchVariants)steps.push(...(out[k]||[]));
  }else if(out[en])steps.push(...out[en]);
  // Ingredient cards: show the verified result they can be used to make, not a fake recipe for the ingredient.
  const usedIn=[];
  for(const [result,rows] of Object.entries(out)) if(rows.some(r=>r.mats.includes(en)))usedIn.push(result);
  if(en==='Soothe the Dead')steps.push(...out['Secret Cookbook']);
  if(en==='Lucky Pouch')steps.push(...out['Reminiscence']);
  if(en==='Red Necktie')steps.push(...out['Uniform - Liu Assoc.']);
  return {en,zh:zh[en]||x.name,img:img[en]||'',recipes:steps,usedIn,verified:!!img[en]};
}
// The named-source icons fix old inexact mappings in the separate burn gallery as well.
if(window.BURN_DATA && Array.isArray(window.BURN_DATA.gifts)){
  for(const g of window.BURN_DATA.gifts){if(img[g.en]) {g.img=img[g.en];delete g.imageStatus;delete g.imageNote;} }
}
// Normalize the two video route checklists. Preserve stable IDs for existing progress.
if(window.MIRROR_OPS?.data){
  for(const [mode,list] of Object.entries(window.MIRROR_OPS.data)){
    for(const x of list){const a=forItem(x);if(a.verified){x.en=a.en;x.auditName=a.zh;
      if(x.name==='迎击斗笠')x.name='影织斗笠';
      if(x.name==='幸运袋')x.name='福袋';
      if(x.name.includes('专属怀表')||x.name.startsWith('袖珍怀表系')){x.name='震颤怀表（L／E／Y／P）';x.en='Pocket Watch - Type L';}
    }}
    const isBurn=mode==='burnVideo';
    if(!list.some(g=>g.en==='Coupled Oscillation'))list.push({id:mode+'-coupled',name:'震颤耦合',en:'Coupled Oscillation',tier:'合成核心',where:'固定合成：尼克西分歧 + 咬合的齿轮 + 真理之钟',why:'5名可施加震颤的人格可触发。材料齐时按固定公式合成；不建议随机乱合。',pack:''});
    if(isBurn&&!list.some(g=>g.en==='Uniform - Liu Assoc.'))list.push({id:mode+'-liu',name:'六协会大衣',en:'Uniform - Liu Assoc.',tier:'可选合成',where:'最低之星 + 极化 + 红领带',why:'红领带是配方材料；如果已取得三个零件可考虑合成，非必需。',pack:''});
  }
}
window.GIFT_AUDIT={img,zh,recipes:directRecipes,forItem,source:'https://limbuscompany.wiki.gg/wiki/List_of_E.G.O_Gifts/Fusion'};
})();