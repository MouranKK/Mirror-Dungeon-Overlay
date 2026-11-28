// R22：第 11–15 层“制约”（wiki：Mounting Adversities，名称用零协会汉化 Bufs_Mirror6/7）
// floor = 生效的楼层：打完上一层、进入这一层时选择。points = 制约分。
// advice：ok 建议选 / maybe 看情况 / avoid 尽量避开；team 里是对某支队伍的特别说明（覆盖默认）。
// 视频作者没有逐项讲制约，这里是根据 wiki 规则和队伍机制的 AI 总结。
window.MD_ADVERSITIES = {
  source: 'limbuscompany.wiki.gg/wiki/Mirror_Dungeon（Mounting Adversities）；中文名：零协会汉化',
  floors: {
    11: [
      { id: 'level', name: '等级强化', points: 1, rule: '全体敌方单位提升 3 级', advice: 'maybe', why: '敌人等级高了，拼点和伤害都更吃亏；只差 1 分，想稳就不选' },
      { id: 'frail', name: '衰弱', points: 1, rule: '全体友方体力上限 −10%', advice: 'ok', why: '影响小，便宜的 1 分', team: { pinkyVideo: ['avoid', '单通全靠良秀扛，体力上限少了更容易被磨死'] } },
      { id: 'fire1', name: '炎之烙印 I', points: 2, rule: '回合结束全队受到 5 点固定伤害，每回合 +3（最多 20）', advice: 'avoid', why: '11–15 层都是长战斗，固定伤害越叠越疼', team: { pinkyVideo: ['avoid', '单通最怕被磨血，绝对不选'] } },
      { id: 'infl1', name: '通货膨胀 I', points: 2, rule: '除了卖饰品，商店功能价格变 2 倍', advice: 'ok', why: '核心饰品在 10 层前已成型的话，影响很小；还要大量合成就别选' },
      { id: 'ego1', name: '自我干涉 I', points: 2, rule: '使用 E.G.O 消耗的资源变 2 倍', advice: 'maybe', why: '平时很少开 E.G.O 就可以选；靠 E.G.O 救场就别选' },
      { id: 'redis', name: '战力的再分配', points: 1, rule: '敌人阵亡后，下回合其余敌人获得 3 层攻击等级提升（每回合最多 3 次）', advice: 'maybe', why: '单个头目的战斗没影响；一群小怪时会越打越强' }
    ],
    12: [
      { id: 'level', name: '等级强化', points: 1, rule: '全体敌方单位提升 3 级', advice: 'maybe', why: '只差 1 分，想稳就不选' },
      { id: 'frail', name: '衰弱', points: 1, rule: '全体友方体力上限 −10%', advice: 'ok', why: '影响小', team: { pinkyVideo: ['avoid', '单通体力上限很重要'] } },
      { id: 'psy1', name: '精神错乱 I', points: 2, rule: '回合结束全队失去 3 点理智', advice: 'maybe', why: '理智低了拼点会变差；队伍回理智手段多就能选' },
      { id: 'nerve1', name: '神经加速 I', points: 2, rule: '全体敌方最小、最大速度 +1', advice: 'ok', why: '速度只多 1，影响较小' },
      { id: 'fatigue1', name: '理智枯竭 I', points: 3, rule: '战斗中友方理智无法恢复到 35 以上', advice: 'avoid', why: '理智上不去，拼点和很多技能的收益都会下降', team: { wedgeVideo: ['avoid', '楔子队很吃高理智拼点，最该避开'] } },
      { id: 'elation', name: '精神昂扬', points: 2, rule: '回合开始全体敌方恢复 20 点理智（全是减算硬币的敌人改为失去 15）', advice: 'maybe', why: '敌人拼点更强；队伍拼点占优时可以选' }
    ],
    13: [
      { id: 'level', name: '等级强化', points: 1, rule: '全体敌方单位提升 3 级', advice: 'maybe', why: '只差 1 分，想稳就不选' },
      { id: 'frail', name: '衰弱', points: 1, rule: '全体友方体力上限 −10%', advice: 'ok', why: '影响小', team: { pinkyVideo: ['avoid', '单通体力上限很重要'] } },
      { id: 'tremorbar', name: '震颤阻绝', points: 2, rule: '移除全体敌方的第一混乱阈值', advice: 'maybe', why: '打不出第一次混乱，靠混乱输出的队伍会变慢', team: { burnVideo: ['avoid', '烧震靠震颤爆发打混乱，直接削弱核心'], wedgeVideo: ['avoid', '呼震靠震颤打混乱，直接削弱核心'] } },
      { id: 'infl2', name: '通货膨胀 II', points: 3, rule: '除了卖饰品，商店功能价格变 3 倍（会取代 I）', advice: 'ok', why: '到 13 层基本不再大量购物时可以选' },
      { id: 'ego2', name: '自我干涉 II', points: 3, rule: '使用 E.G.O 消耗的资源变 3 倍（会取代 I）', advice: 'maybe', why: '不靠 E.G.O 就能选' },
      { id: 'shield', name: '生成护盾', points: 3, rule: '全体敌方获得 3000 护盾（集中战只给本体；回合结束不消失）', advice: 'avoid', why: '3000 护盾要打很久，战斗明显拉长' }
    ],
    14: [
      { id: 'level', name: '等级强化', points: 1, rule: '全体敌方单位提升 3 级', advice: 'maybe', why: '只差 1 分，想稳就不选' },
      { id: 'frail', name: '衰弱', points: 1, rule: '全体友方体力上限 −10%', advice: 'ok', why: '影响小', team: { pinkyVideo: ['avoid', '单通体力上限很重要'] } },
      { id: 'vital', name: '生命增幅', points: 2, rule: '全体敌方体力上限 +30%', advice: 'maybe', why: '战斗变长；输出足够就能选' },
      { id: 'brutal', name: '破坏力', points: 3, rule: '全体敌方加算硬币威力 +2，减算硬币威力 −2', advice: 'avoid', why: '敌人拼点大幅变强，最影响翻车率' },
      { id: 'fire2', name: '炎之烙印 II', points: 3, rule: '回合结束全队受到 10 点固定伤害，每回合 +5（最多 30，会取代 I）', advice: 'avoid', why: '长战斗里非常疼' },
      { id: 'fracture', name: '龟裂增殖', points: 3, rule: '敌人技能施加的烧伤、流血、震颤、破裂、沉沦变 2 倍', advice: 'maybe', why: '看本层敌人：敌人不怎么上异常状态就能选' }
    ],
    15: [
      { id: 'level', name: '等级强化', points: 1, rule: '全体敌方单位提升 3 级', advice: 'maybe', why: '只差 1 分，想稳就不选' },
      { id: 'frail', name: '衰弱', points: 1, rule: '全体友方体力上限 −10%', advice: 'ok', why: '影响小', team: { pinkyVideo: ['avoid', '单通体力上限很重要'] } },
      { id: 'psy2', name: '精神错乱 II', points: 3, rule: '回合结束全队失去 5 点理智（会取代 I）', advice: 'avoid', why: '最终层每回合掉 5 理智，拼点会越来越差' },
      { id: 'nerve2', name: '神经加速 II', points: 3, rule: '全体敌方最小、最大速度 +2', advice: 'maybe', why: '敌人更容易先手；队伍速度够就能选' },
      { id: 'fatigue2', name: '理智枯竭 II', points: 5, rule: '战斗中友方理智无法恢复到 30 以上（会取代 I）', advice: 'avoid', why: '分数最高但最伤，稳定通关不选' },
      { id: 'status', name: '异常状态施加（暂译）', points: 1, rule: '回合开始全体友方随机获得 5 点烧伤 / 流血 / 震颤 / 破裂 / 沉沦之一', advice: 'maybe', why: '只有 1 分，但每回合都会挨；想稳就不选' }
    ]
  }
};

// R22：商店“实用”：不在本队核对表里、但新手买了也有用的通用饰品（AI 根据 wiki 效果整理）
// [名称, 分类, 一句话理由, 只对某些队伍（可省略）]
window.MD_USEFUL_GIFTS = [
  ['便携式急救包', '回血', '体力低于一半时自动回 25%，每场 1 次'],
  ['归途', '回血', '每场战斗开始全队回 12% 体力'],
  ['采血包', '回血', '打中敌人就回已损失体力的 12.5%'],
  ['偏见', '回血', '首回合给体力最低的人回 15%'],
  ['信念', '理智', '用加算硬币技能后，下回合理智回满'],
  ['特别合约', '增伤', '打混乱时额外扣敌人 33% 体力，配合震颤很好用'],
  ['卡蜜拉', '增伤', '非集中战开场扣全体敌人 20% 体力'],
  ['保密协议', '增伤', '每回合给一人增伤 10% 和大护盾'],
  ['异想狩猎', '增伤', '集中战（头目战）全队伤害强化'],
  ['缘分残片', '增伤', '拿到时全员提升 5 级'],
  ['强压的重担', '增伤', '只剩自己时每回合变强壮，单通专用', ['pinkyVideo']],
  ['金瓮', '经济', '战斗经费 +20%，前几层买最划算'],
  ['生存的里程标', '经济', '每过一个阶层头目多拿经费'],
  ['预约优惠券', '经济', '商店刷新便宜 30%'],
  ['翻新的商品', '经济', '商店强化便宜 30%'],
  ['特别目录', '经济', '战斗奖励卡多一张']
];
