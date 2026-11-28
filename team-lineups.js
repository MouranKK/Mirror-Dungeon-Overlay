// 各队推荐人格、配队方案、玩法、技能替换与 EGO（来源：B站UP主 锈町Rusty 的视频原稿 / 字幕，AI 整理）
// ids：人格资料（wiki = limbuscompany.wiki.gg 页面标题，用来找头像）
// variants：配队方案，members = [人格键, 标注]；extra = 头像以外还要补的人
// play：“玩法”页签的简单说明；字幕里听不清的内容不写进来。
window.MD_TEAM_LINEUPS = {
 burnVideo: {
  ids: {
   dawnFaust: { cn: '黎明事务所 收尾人 浮士德', nick: '黎明浮', wiki: 'Dawn Office Fixer Faust' },
   dawnSinclair: { cn: '黎明事务所 收尾人 辛克莱', nick: '黎明辛（菲辛）', wiki: 'Dawn Office Fixer Sinclair' },
   dawnGregor: { cn: '黎明事务所 代表 格里高尔', nick: '黎明虫', wiki: 'Dawn Office Rep Gregor' },
   thumbRodion: { cn: '蜘蛛巢 拇指 父辈 罗佳', nick: '拇指罗', wiki: 'The House of Spiders: The Thumb Nursefather Rodion' },
   thumbHeath: { cn: '蜘蛛巢 拇指 子辈 希斯克利夫', nick: '拇指夫', wiki: 'The House of Spiders: The Thumb Apprentice Heathcliff' },
   leiHeng: { cn: '拇指 东部 指挥官IIII 默尔索', nick: '雷横默', wiki: 'The Thumb East Capo IIII Meursault' },
   thumbSinclair: { cn: '拇指 东部 士兵II 辛克莱', nick: '拇指辛', wiki: 'The Thumb East Soldato II Sinclair' }
  },
  variants: {
   dawn: { order: '1号位：黎明浮士德、黎明辛克莱、拇指罗佳都可以。送达的信只对前三位生效。',
    members: [['dawnFaust', '1号位候选'], ['dawnSinclair', '1号位候选'], ['thumbRodion', '1号位候选'], ['dawnGregor', ''], ['thumbHeath', ''], ['leiHeng', '']] },
   thumb: { order: '1号位直接放拇指罗佳（吃到的加成最多）。拇指辛替换黎明辛：能凑8名弹药人格，但吃不到翼形蜡烛。',
    members: [['thumbRodion', '1号位'], ['thumbHeath', ''], ['leiHeng', ''], ['thumbSinclair', '替换黎明辛'], ['dawnFaust', ''], ['dawnGregor', '']] },
   fallback: { order: '没有拇指母子：三黎明 + 雷横默，再补一名烧伤和一名震颤人格。雪茄只吃通用效果。',
    members: [['dawnFaust', '1号位候选'], ['dawnSinclair', '1号位候选'], ['dawnGregor', ''], ['leiHeng', '']], extra: ['烧伤人格 ×1', '震颤人格 ×1（如楔子奥提斯、黑派）'] }
  },
  need: '核心是“拇指母子”（蜘蛛巢 拇指 父辈 罗佳 + 拇指 子辈 希斯克利夫）和黎明事务所三人。上赛季人格本赛季不能兑换。',
  play: [
   '核心：3拇指＋3黎明。三名黎明事务所人格拿到翼形蜡烛后，黎明辛也算烧伤震颤双体系；三名拇指人格触发奉纳的雪茄。',
   '烧伤、震颤的体系饰品都要前场各5人以上才激活。',
   '整队没有强回复：遇到终末日历这种一直磨血的怪要速战速决。',
   '3+3 只吃得到亡命之徒的5人档，不必去琥珀色的黄昏；4+2（拇指辛）能凑8名弹药人格，但吃不到翼形蜡烛。两种都能玩。',
   '路线核心：第2层地狱鸡拿火热多汁琵琶腿和探戈鸡酱料（没鸡酱料可考虑重开）；5–10层必去2号线、教材、LCB定期体检复刻，时间杀人时间复刻放最后；翼形蜡烛在解放的暴怒或盛火时节，也可以开局观测省一个包位。'
  ],
  skills: [
   ['黎明浮', '三技能全换不丢烧伤震颤。不吃山茶花：105 或 006；想吃山茶花：015 或 114'],
   ['黎明辛', '一技能忧郁（回复），二技能群攻多留几个。不吃送达的信：105 / 114 / 123 / 132 / 141；吃送达的信：114 / 123 / 132 / 141。后期多换三技能'],
   ['黎明虫', '二技能傲慢（可吃玩偶类加成）。吃山茶花：015；不吃：015 或 006'],
   ['拇指罗', '一技能傲慢。不吃花信：105 或 006；吃山茶花+送达的信：015 或 114'],
   ['拇指夫', '有追击机制，015；不吃决意/山茶：006'],
   ['雷横默', '想吃决意或送达的信：114；不吃：006'],
   ['拇指辛', '想吃送达的信：114；不吃：006']
  ],
  ego: ['出伤：浮士德、默尔索的“空洞”，希斯克利夫的“拘束”，辛克莱的“和声”', '拼点/生存：浮士德的“凯尔希”，老牌回复“液袋”，辛克莱五破“一生炖菜”', '小加伤被动：罗佳的“镜反射触觉”“步入晚霞”', '不带 EGO 也能通关；多容量 EGO 能吃大衣的即时回血']
 },
 wedgeVideo: {
  ids: {
   wedgeOutis: { cn: '楔子事务所 代表 奥提斯', nick: '楔子奥', wiki: 'Wedge Office Rep Outis' },
   wedgeDon: { cn: '楔子事务所 收尾人 堂吉诃德', nick: '楔子唐', wiki: 'Wedge Office Fixer Don Quixote' },
   wedgeSinclair: { cn: '楔子事务所 收尾人 辛克莱', nick: '楔子辛', wiki: 'Wedge Office Fixer Sinclair' },
   dawnGregor: { cn: '黎明事务所 代表 格里高尔', nick: '黎明虫', wiki: 'Dawn Office Rep Gregor' },
   dawnFaust: { cn: '黎明事务所 收尾人 浮士德', nick: '黎明浮', wiki: 'Dawn Office Fixer Faust' },
   lccbRyoshu: { cn: 'LCCB 系长 良秀', nick: 'LCCB良秀', wiki: 'LCCB Assistant Manager Ryōshū' }
  },
  variants: {
   seven: { order: '楔子奥提斯放1号位（主C）。7人能玩到楔子 × 黎明的连携。',
    members: [['wedgeOutis', '1号位 · 主C'], ['wedgeDon', ''], ['wedgeSinclair', ''], ['dawnGregor', '连携'], ['dawnFaust', '连携']], extra: ['呼吸人格 ×2（凑齐呼吸5人）'] },
   six: { order: '楔子奥提斯放1号位，6人能吃双槽、拼点和总伤更高，但玩不到连携（连携不是必须的）。',
    members: [['wedgeOutis', '1号位 · 主C'], ['wedgeDon', ''], ['wedgeSinclair', ''], ['lccbRyoshu', '呼吸震颤双体系']], extra: ['呼吸人格 ×1', '震颤人格 ×1'] }
  },
  need: '核心是楔子事务所三人（奥提斯、堂吉诃德、辛克莱）。',
  play: [
   '核心：楔子事务所三人都是呼吸震颤双体系，再补人凑齐前场呼吸、震颤各5人激活体系饰品。',
      '黎明事务所两人是为了和楔子的连携，不是必需：震颤位换成裁缝罗、黑派、拇指人格等都可以（黑派堂套盾最强，但位置被楔子堂占了）。呼吸位有啥用啥。作者：312、411 按自己的人格灵活选。',
   '特点：拼点高、加伤不足，总伤偏低；楔子奥提斯靠追击和连携输出，动画长、不能跳过。',
   '白色领巾：开局给楔子奥提斯20层胜机，但第一回合最多20层，到不了强化三技能追击要的25层；追击后回收一半胜机，之后基本能循环。',
   '楔子奥提斯的三技能只有1枚硬币，高层（负面硬币制约）拼点不稳，别全程开自动。',
   '黑色三角帽＋血腥味的拍手啪啪：额外震颤引爆，最多约35%加伤——拿到黑帽就去血腥味。',
   '加伤不够可以去不思观望拿水中月（后台多编入呼吸或破裂人格）；时间杀人时间复刻等发育完全（第10层左右）再去。'
  ],
  skills: [
   ['楔子奥', '三技能只有1枚硬币，高层拼点不稳。道中可多留二技能（三技能动画长、不能跳过），到高层再多换三技能。想吃送达的信：114 / 123 / 132'],
   ['楔子唐 / 楔子辛', '两人有“同颜色技能连续攻击”的机制：一人保留什么颜色，另一人也保留同颜色。不吃送达的信：006；吃送达的信：114'],
   ['LCCB良秀', '三技能能吃呼吸、破裂、震颤三个体系，全换三技能没问题（006）；想吃冰矛留一技能（105）；吃送达的信：114']
  ],
  ego: ['续航：辛克莱五破“一生炖菜”，浮士德的“凯尔希”或“液袋”', '输出：辛克莱的“和声”，堂吉诃德的“魔法少女”，希斯克利夫的“拘束”', '整体有啥用啥，不带也能通关']
 },
 pinkyVideo: {
  ids: {
   blade: { cn: '蜘蛛巢之刃 良秀', nick: '小指良', wiki: 'Blade of the House of Spiders Ryōshū' },
   rodion: { cn: '蜘蛛巢 拇指 父辈 罗佳', nick: '', wiki: 'The House of Spiders: The Thumb Nursefather Rodion' },
   heath: { cn: '蜘蛛巢 拇指 子辈 希斯克利夫', nick: '', wiki: 'The House of Spiders: The Thumb Apprentice Heathcliff' },
   outis: { cn: '蜘蛛巢 中指 父辈 奥提斯', nick: '', wiki: 'The House of Spiders: The Middle Nursefather Outis' },
   ishmael: { cn: '蜘蛛巢 中指 子辈 以实玛利', nick: '', wiki: 'The House of Spiders: The Middle Apprentice Ishmael' },
   honglu: { cn: '蜘蛛巢 环指 父辈 鸿璐', nick: '', wiki: 'The House of Spiders: The Ring Nursefather Hong Lu' },
   faust: { cn: '蜘蛛巢 环指 子辈 浮士德', nick: '', wiki: 'The House of Spiders: The Ring Apprentice Faust' },
   yisang: { cn: '蜘蛛巢 食指 父辈 李箱', nick: '', wiki: 'The House of Spiders: The Index Nursefather Yi Sang' },
   sinclair: { cn: '蜘蛛巢 小指 子辈 辛克莱', nick: '', wiki: 'The House of Spiders: The Pinky Apprentice Sinclair' }
  },
  variants: {
   full: { order: '小指良放1号位，其余位置编入蜘蛛巢人格，战斗中让他们全部阵亡。',
    members: [['blade', '1号位 · 必须'], ['rodion', '送掉'], ['heath', '送掉'], ['outis', '送掉'], ['ishmael', '送掉'], ['honglu', '送掉'], ['faust', '送掉'], ['yisang', '送掉'], ['sinclair', '送掉']] },
   few: { order: '蜘蛛巢人格很少：小指良当普通真单通玩，地魁星刀叠层、减伤和输出都会打折；作者提到也可以改吃水中月等常规单通加成。',
    members: [['blade', '1号位 · 必须']], extra: ['有几个蜘蛛巢人格就编几个（送掉）'] }
  },
  need: '核心是蜘蛛巢之刃 良秀（小指良）。完整体需要其余蜘蛛巢人格一起编入再送掉；上赛季人格本赛季不能兑换。',
  play: [
   '开局观测赤红纠缠的蜘蛛巢：队友阵亡后过关不会复活；只剩小指良时获得【撕裂而出之蝶】（加伤、混乱和护盾相关加成）。作者建议把后排蜘蛛巢人格全部送掉。',
   '小指良常驻高减伤、闪避守备、能移除混乱条和自锁血，下限高、上限高，很稳。',
   '地魁星刀：每个在场的蜘蛛巢队友在第一场战斗给5层，但每回合最多拿25层，所以第一回合放不出大招；第二回合靠三技能叠层，回合结束一定能到50层。',
   '50层：回合结束追击“空间斩·原”（算三技能，攻击容量5，能吃大衣回血），并移除她唯一的混乱线；下一回合出现强化大招“空间斩·残”。',
   '路线：第2层地狱鸡必拿鸡腿肉和探戈鸡酱料；憎恶与绝望拿灰色星座的加护和盾牌；深夜清扫复刻拿影织斗笠；自黎明后贯穿而来碰空洞的自尊（变成骑士的自尊）；11–13层前处理紫色编码、身负重担者们。'
  ],
  skills: [
   ['小指良', '三技能有额外群攻、点数和动画都好，多换三技能。二技能傲慢（可吃玩偶类加成），有两个不同斩击技能还能吃决意。不吃送达的信：015 或 006；要吃满送达的信：105 或 114。单通建议保留一个傲慢技能（二技能）应对马蒂亚斯这类反击怪']
  ],
  ego: ['上赛季配套“3000大世界”：同时吃三个体系加成，输出和点数都好', '五破“终末火柴之光”：多容量，能吃大衣回血', '注意：同为 WAW 的“轻蔑”容量是1，吃不到大衣', '不带 EGO 也能通关']
 }
};
