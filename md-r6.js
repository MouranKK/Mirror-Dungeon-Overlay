// R6: pure, explicitly heuristic decision helpers. Do not treat scores as game data.
window.MD_R6={
 canAppear(pack,f){
  if(!Number.isInteger(f)||f<1||f>15)return true;
  const a=pack?.audit;if(!a)return null;
  const t=String(a.floors||'');
  if(/所有楼层|any floor/i.test(t))return true;
  const ranges=[...t.matchAll(/(?:第)?\s*(\d+)\s*[–~-]\s*(\d+)\s*层/g)].map(m=>[+m[1],+m[2]]);
  for(const [lo,hi] of ranges)if(f>=lo&&f<=hi)return true;
  const singled=[...t.matchAll(/(?:第)\s*(\d+)\s*层/g)].map(m=>+m[1]);
  if(singled.includes(f))return true;
  if(ranges.length||singled.length)return false;
  return null;
 },
 // Broad cautions, not claimed boss tier rankings.
 caution(pack){const a=pack?.audit||{};const desc=String(a.battle||'');
  if(a.kind==='待核实')return '卡包资料未完全核对，无法自动评估危险';
  if(/三波|3波|长战|首领/.test(desc))return '多波首领战：核实理智、回复与拼点';
  return '战斗风险尚未逐回合量化，请结合本局状态';
 },
 judgePack({name,floor,team,missing=[],finished=false,already=false,kind='',safe=true,battle='',known=true}){
  let pts=50,details=[];
  if(missing.length){pts+=Math.min(3,missing.length)*13;details.push('缺少目标：'+missing.join('、'))}
  else if(already){pts-=26;details.push('核心目标已记录获得')}
  if(finished){pts-=20;details.push('本局已打过该包')}
  if(kind==='通关必得')details.push('通关固定奖励；无需寻找商店/事件');
  else if(kind==='限定池')details.push('限定池奖励不保证必出');
  if(floor>=11){
   if(/三波|3波|长战|首领/.test(battle))details.push('高层多波首领战：优先确保能打完');
   if(safe && /三波|3波|长战|首领/.test(battle))pts-=8;
   if(!known)details.push('机制待核，不进行风险排名');
  }
  return {points:pts,reason:details.join('；')||'根据实际候选与队伍选择；未核准的风险不计分'};
 },
 priceDecision(base,price,budget,reserve){
   if(price==null||budget==null)return {score:base,flag:'需输入实际售价与经费',balance:null};
   const left=budget-price;
   if(left<0)return {score:-500,flag:'当前经费不够',balance:left};
   const needsReserve=left<reserve;
   const discount=Math.min(18,Math.round(price/Math.max(1,budget)*24));
   return {score:base-discount-(needsReserve?16:0),flag:needsReserve?'购买后低于预留经费':'预算允许',balance:left};
 }
};
