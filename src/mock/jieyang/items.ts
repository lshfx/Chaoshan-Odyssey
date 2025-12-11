import type { Seal, Clue, Item, GameFlow } from '../types'

export const seals: Seal[] = [
  {
    id: 'seal_one',
    name: '儒学文脉章',
    description: '从林文渊处获得的印章。',
    icon: '/static/seals/seal_one_icon.png',
    fullImage: '/static/seals/seal_one_full.png',
    culturalTheme: '揭阳学宫儒学文脉',
    holderNpcId: 'lin_wenyuan',
    puzzlePosition: { row: 0, col: 0 }, // 2x2拼图中的左上角
    canCombine: true,
    specialFeature: '与捕快腰牌纹路契合'
  },
  {
    id: 'seal_two',
    name: '青狮非遗章',
    description: '象征青狮文化的勇毅传承',
    icon: '/static/seals/seal_two_icon.png',
    fullImage: '/static/seals/seal_two_full.png',
    culturalTheme: '青狮非遗文化',
    holderNpcId: 'chen_shikui',
    puzzlePosition: { row: 0, col: 1 }, // 右上角
    canCombine: true,
    specialFeature: '拼合时会发光，可验证真伪'
  },
  {
    id: 'seal_three',
    name: '功夫茶韵章',
    description: '体现工夫茶的和敬清寂精神',
    icon: '/static/seals/seal_three_icon.png',
    fullImage: '/static/seals/seal_three_full.png',
    culturalTheme: '功夫茶韵文化',
    holderNpcId: 'su_chaweng',
    puzzlePosition: { row: 1, col: 0 }, // 左下角
    canCombine: true,
    specialFeature: '有胎记契合点'
  },
  {
    id: 'seal_four',
    name: '侨批信义章',
    description: '承载侨批的一纸千金信义精神',
    icon: '/static/seals/seal_four_icon.png',
    fullImage: '/static/seals/seal_four_full.png',
    culturalTheme: '侨批信义文化',
    holderNpcId: 'zheng_pike',
    puzzlePosition: { row: 1, col: 1 }, // 右下角
    canCombine: true,
    specialFeature: '与红头船模型契合验证'
  },
  // 伪造的印章
  {
    id: 'seal_three_fake',
    name: '功夫茶韵章（伪造）',
    description: '蔡福生交给你的印章，看起来很新。',
    icon: '/static/seals/seal_three_fake_icon.png',
    fullImage: '/static/seals/seal_three_fake_full.png',
    culturalTheme: '功夫茶韵文化（伪造）',
    holderNpcId: 'cai_fusheng',
    puzzlePosition: undefined, // 伪造品无拼图位置
    canCombine: false, // 伪造品不能拼接
    specialFeature: '侧面光滑无凹槽，可辨别真伪',
    inspectable: true,
    inspectText: '奇怪...这枚印章侧面非常光滑，没有任何拼接用的凹槽！这是个赝品！',
    relatedClueId: 'clue_fake_seal'
  },
  {
    id: 'laoye_baohao_seal',
    name: '老爷保号章',
    description: '潮汕民俗祈福的核心印章，可解锁终极秘密',
    icon: '/static/seals/laoye_baohao_icon.png',
    fullImage: '/static/seals/laoye_baohao_full.png',
    culturalTheme: '潮汕民俗文化',
    holderNpcId: 'li_chengshou',
    isFinalSeal: true,
    unlockRequirement: ['seal_one', 'seal_two', 'seal_three', 'seal_four'],
    specialFeature: '背面有祈福纹，需特定胎记激活'
  }
]

export const clues: Clue[] = [
  {
    id: 'clue_six_fingers',
    type: 'testimony',
    name: '六指传说',
    description: '林文渊提到，当年袭击父母的人左手有六指。',
    icon: '/static/clues/six-fingers.png',
    witness: '林文渊',
    location: 'jieyang_confucian_temple',
    relevance: 'plunderer_identification'
  },
  {
    id: 'clue_fake_seal',
    type: 'knowledge',
    name: '伪造的印章',
    description: '蔡福生给的印章无法拼接，证明他在撒谎。',
    icon: '/static/clues/fake-seal.png',
    source: '玩家调查发现',
    location: 'kungfu_tea_house',
    relevance: 'plunderer_identification'
  },
  {
    id: 'clue_lion_scar',
    type: 'testimony',
    name: '狮纹伤疤',
    description: '陈狮魁提到凶手手背上有狮纹伤疤。',
    icon: '/static/clues/lion-scar.png',
    witness: '陈狮魁',
    location: 'ancient_street',
    relevance: 'plunderer_identification'
  },
  {
    id: 'clue_badge_pattern',
    type: 'item',
    name: '腰牌纹路',
    description: '捕快腰牌背面有半个麒麟图案，可能与印章一相契合。',
    icon: '/static/clues/badge-pattern.png',
    source: '玩家调查发现',
    location: 'lama_palace',
    relevance: 'seal_verification'
  },
  {
    id: 'clue_seal_fragment_1',
    type: 'item',
    name: '印章断口',
    description: '印章一侧面有断裂的凹槽，似乎需要和其他印章拼接。',
    icon: '/static/items/item_seal_one.png', // 临时修复：使用已存在的图标
    source: '玩家调查发现',
    location: 'jieyang_confucian_temple',
    relevance: 'seal_combination'
  }
]

export const items: Item[] = [
  {
    id: 'item_badge',
    name: '捕快腰牌',
    description: '母亲留下的遗物，背面刻有特殊纹路。',
    icon: '/static/items/badge.png',
    type: 'identity',
    inspectable: true,
    inspectText: '腰牌背面的纹路磨损严重，但依稀能辨认出是半个麒麟图案。',
    relatedClueId: 'clue_badge_pattern'
  },
  {
    id: 'item_father_notes',
    name: '父亲的笔记',
    description: '父亲留下的珍贵笔记，记录了家族印章的秘密和掠夺者的线索。',
    icon: '/static/items/father-notes.png',
    type: 'document'
  },
  {
    id: 'item_half_letter',
    name: '半块侨批',
    description: '养母临终前交给你的半块侨批，上面刻着"印章合，亲人归"。',
    icon: '/static/items/half-letter.png',
    type: 'heirloom'
  },
  {
    id: 'item_tea',
    name: '南洋茶叶',
    description: '林景澄从南洋带回的特产茶叶，据说是与苏茶翁交流的特殊媒介。',
    icon: '/static/items/tea.png',
    type: 'special'
  },
  // 🎒 新增：关键印章的实体道具版本
  {
    id: 'item_seal_one',
    name: '儒学文脉章(实物)',
    description: '从林文渊处获得的印章，沉甸甸的，侧面有奇怪的凹槽。',
    icon: '/static/seals/seal_one_icon.png', // 复用印章图标
    type: 'heirloom',
    inspectable: true,
    inspectText: '印章侧面有断裂的凹槽，似乎需要和其他印章拼接。这个发现很重要！',
    relatedClueId: 'clue_seal_fragment_1',
    // 标记为可出示的证物
    isEvidence: true,
    canPresent: ['lin_wenyuan', 'cai_fusheng'] // 可向相关NPC出示
  },
  {
    id: 'item_seal_three_fake',
    name: '伪造的印章',
    description: '蔡福生交给你的印章，表面看起来很精致，但感觉有些不对劲。',
    icon: '/static/seals/seal_three_fake_icon.png', // 复用伪造印章图标
    type: 'evidence',
    inspectable: true,
    inspectText: '奇怪...这枚印章侧面非常光滑，没有任何拼接用的凹槽！这是个赝品！蔡福生在欺骗我！',
    relatedClueId: 'clue_fake_seal',
    // 标记为关键证物
    isEvidence: true,
    canPresent: ['cai_fusheng', 'lin_wenyuan'] // 可向关键NPC出示
  }
]

export const gameFlow: GameFlow = {
  phases: [
    {
      id: 'ice_breaking',
      name: '破冰入场',
      duration: 30, // 分钟
      description: '玩家抽取身份，阅读背景，进行自我介绍'
    },
    {
      id: 'seal_competition',
      name: '印章争夺',
      duration: 120,
      description: '玩家与NPC互动完成任务，获取印章及线索'
    },
    {
      id: 'reasoning',
      name: '推理还原',
      duration: 60,
      description: '分享线索，拼合印章，讨论推理，找出掠夺者'
    },
    {
      id: 'ending',
      name: '结局演绎',
      duration: 30,
      description: '公布掠夺者身份，演绎结局，发放结局道具'
    }
  ],
  victoryConditions: {
    goodGuys: {
      name: '好人阵营胜利',
      requirements: ['收集5枚印章', '正确指认掠夺者', '成功拼合四章图案']
    },
    plunderer: {
      name: '掠夺者胜利',
      requirements: ['未被指认', '破坏至少2枚印章']
    },
    draw: {
      name: '平局',
      requirements: ['未集齐印章但指认掠夺者', '或集齐印章但指认错误/未拼合图案']
    }
  }
}