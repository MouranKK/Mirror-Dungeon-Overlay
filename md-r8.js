// R8 verified combat mechanics and transparent, conservative high-floor comparisons.
// Enemy pages describe the base form unless marked otherwise. No fabricated guaranteed turns.
window.MD_R8_DATA={"version":"MD8-2026-11-23","disclaimer":"危险倾向是辅助取舍，不是官方难度排名；具体高层变体以游戏内技能面板为准。","bosses":{"血腥味":{"confidence":"敌人基础机制已核实；MD8 加强版仍需现场确认","difficulty":3,"stress":["hp","sp","clash"],"structure":"3 波无头鱼，固定布局","moments":[{"wave":"第 1–3 波 · 无头鱼","name":"血囊 Blood Sac / 血炮 Blood Cannon","see":"留意无头鱼的血囊层数、血炮技能与当前尾部是否完好。尾部破坏后技能循环也会变化。","do":"优先用强技能处理危险拼点；决定是否破部位时先看本回合技能，不能固定认定某一回合必出血炮。","source":"https://limbuscompany.wiki.gg/wiki/Headless_Ichthys/Enemy","basis":"敌人基础技能与血囊循环"},{"wave":"第 1–3 波 · 无头鱼","name":"液囊 Fluid Sac / 破躯干","see":"血囊阶段可转为液囊阶段；躯干受破坏及液囊叠层会影响后续行动与回复。","do":"检查当前液囊层数、部位状态和敌人技能图标，再考虑集火或压制。三波之间保留回血与理智资源。","source":"https://limbuscompany.wiki.gg/wiki/Headless_Ichthys/Enemy","basis":"敌人基础被动和部位描述"}],"checklist":["本波血囊与尾部状态已查看","危险技能已分配拼点／防御","下一波所需 HP／SP 已检查"]},"紫色编码":{"confidence":"波次数量已核实；敌人技能以具体 K 公司单位为准","difficulty":4,"stress":["hp","sp","burst","clash"],"structure":"3 波 K 公司安保，每波 12 人","moments":[{"wave":"第 1–3 波 · K 公司安保","name":"HP Bullets（HP 子弹）与持续回复","see":"不同 K 公司安保存在 HP 子弹、回复类防御技能或被动。不能把半血目标视为必定下回合死亡。","do":"观察当波具体单位的回复／防御提示；优先集中伤害完成击杀，尽量避免分散输出让敌人反复回血。","source":"https://limbuscompany.wiki.gg/wiki/K_Corp._Security","basis":"敌人家族基础机制；非逐波完整名单"}],"checklist":["确认当前波敌人是否有回复","重点威胁已集火","下一波的 E.G.O 与理智资源已保留"]},"身负重担者们":{"confidence":"三波首领与基础技能机制已核实；高层变体有调整可能","difficulty":5,"stress":["hp","sp","clash","burst"],"structure":"终末日历 → 蒸汽运输机 → 香辣爸爸邦奇","moments":[{"wave":"第 1 波 · 终末日历","name":"泥偶献祭（Sacrifice）","see":"敌人基础机制中存在献祭事件：可由被打倒的日历泥偶代替罪人献祭。","do":"进入献祭阶段时先查看场上泥偶与提示，不要直接让罪人承受代价；基础事件中牺牲罪人会损失 20 HP 和 15 SP。","source":"https://limbuscompany.wiki.gg/wiki/Doomsday_Calendar/Enemy","basis":"基础敌人阶段事件；MD8 实际触发形式待核"},{"wave":"第 2 波 · 蒸汽运输机","name":"躯干破坏 / Accumulated Past（累积过去）","see":"基础机制中躯干被破坏会清空「累积过去」，抗性随后改变；躯干破坏也不会立即终止正在使用的技能。","do":"先看躯干与喷射器的破坏状态，再选择攻击部位；不能因为部位破坏就忽视当回合未结束的攻击。","source":"https://limbuscompany.wiki.gg/wiki/Steam_Transport_Machine/Enemy","basis":"基础敌人部位和被动"},{"wave":"第 3 波 · 香辣爸爸邦奇","name":"鸡桶部位 / 流血与震颤","see":"香辣爸爸邦奇具有身体和鸡桶部位，部分攻击会附加流血或震颤。","do":"重点检查鸡桶部位和危险命中效果；在当前制约有负面状态翻倍时尤其注意被命中造成的叠层。","source":"https://limbuscompany.wiki.gg/wiki/Papa_Bongy/Enemy","basis":"基础敌人部位及 Spiced-up 技能效果"}],"checklist":["本波部位与机制已确认","危险技能已处理","准备下一波资源后再收尾"]},"插翅虎":{"confidence":"雷横基础猎物机制已核实；镜牢变体以技能卡为准","difficulty":4,"stress":["clash","sp","hp"],"structure":"雷横首领战","moments":[{"wave":"雷横 · 猎物标记","name":"Prey（猎物）与攻击 / 防御选择","see":"被标记为「猎物」的单位可能在与雷横拼点时受到显著减益；雷横针对猎物使用特定技能时有更高威力／伤害并可能转为不可破坏硬币。","do":"确认被标记单位当前装备的是攻击还是防御技能；相关基础机制明确指出装备防御技能可避开目标攻击的强化触发，必要时优先防御。","source":"https://limbuscompany.wiki.gg/wiki/Lei_Heng/Enemy","basis":"雷横敌人基本技能和猎物状态"}],"checklist":["已确认猎物目标是谁","猎物单位已选择合适防御／拼点","雷横危险技能与不可破坏硬币已检查"]},"仲春夜之梦2":{"confidence":"只核实首领身份与固定卡包；没有可靠技能级行动表","difficulty":null,"stress":["clash"],"structure":"可米与「维吉利乌斯？」首领战","moments":[{"wave":"首领战 · 可米与维吉利乌斯？","name":"战斗技能需以当前界面判断","see":"已确认镜牢对应首领组合，未核实这一版本每回合的全部技能和特殊变体。","do":"先观察攻击重量、技能对象和无法拼赢的技能，再决定是否手操；不提供未经核实的固定回合指令。","source":"https://limbuscompany.wiki.gg/wiki/Kkomi_and_Vergilius%3F","basis":"对应首领已证实，逐回合资料不足"}],"checklist":["已核对首领当前技能","关键成员生存有保障"]},"精灵童话":{"difficulty":null,"stress":[],"confidence":"战斗技能尚未逐项核实","structure":"卡包固定奖励已核实，具体机制暂缺"},"永劫的枷锁":{"difficulty":null,"stress":[],"confidence":"战斗技能尚未逐项核实","structure":"卡包固定奖励已核实，具体机制暂缺"},"去·海·边·激·蟹":{"difficulty":null,"stress":[],"confidence":"战斗技能尚未逐项核实","structure":"敌人和奖励条件待进一步核实"}}};
window.MD_R8={
 boss(name){return window.MD_R8_DATA.bosses[name]||null},
 pressure(history,floor){
  const active=new Set();
  for(let f=11;f<=Math.min(15,floor);f++)for(const k of history?.[String(f)]||[])active.add(k);
  const has=(a,b)=>active.has(b)||active.has(a);
  return {
   hp:has('brand1','brand2')||active.has('status2x')||active.has('frail'),
   sp:has('spcap1','spcap2')||has('spdrop1','spdrop2'),
   clash:active.has('coin')||active.has('enemysp')||active.has('speed2')||active.has('lvl'),
   burst:active.has('shield')||active.has('hp30'),
   stagger:active.has('stagger'),
   ego:has('ego1','ego2'),
   shop:has('inflation1','inflation2')
  };
 },
 judge(name,{floor=12,flags={},history={},team='burnVideo',safe=true}={}){
   if(floor<11)return {known:false,label:'常规层，无高层风险比较',penalty:0,reason:'只在11–15层参与危险提示'};
   const d=this.boss(name);
   if(!d||d.difficulty==null){return {known:false,label:'机制待核',penalty:safe?10:0,reason:(d?.confidence||'尚无已核实的具体战斗技能')+'；不能认定它比其他包安全'};}
   let risk=d.difficulty;
   const pressure=this.pressure(history,floor),causes=[];
   // Each item below is a human advisory rule, NOT empirical gameplay damage or boss difficulty.
   for(const f of d.stress||[]){
     if(flags[f]){risk+=2;causes.push(({hp:'本局缺回复',sp:'本局理智吃紧',clash:'本局拼点吃紧',burst:'缺持续输出'})[f]||'本局不利条件');}
     if(pressure[f]){risk+=1;causes.push(({hp:'已选扣血/减最大HP制约',sp:'已选理智制约',clash:'已选拼点制约',burst:'已选敌人耐久制约'})[f]||'高层制约叠加');}
   }
   // Tremor-focused teams lose their stagger window if first stagger threshold is removed.
   if(pressure.stagger && (team==='burnVideo'||team==='wedgeVideo')){risk+=1;causes.push('震颤混乱窗口受制约影响')}
   const label=risk>=8?'当前负担高':risk>=5?'需要准备':'需现场核对（不代表低风险）';
   return {known:true,label,penalty:safe?Math.min(32,Math.max(0,risk-2)*4):Math.min(12,Math.max(0,risk-3)*2),risk,reason:causes.length?[...new Set(causes)].join('、'):'依据已核实的首领结构和已记录状态估计；不保证容易通关'};
 },
};
