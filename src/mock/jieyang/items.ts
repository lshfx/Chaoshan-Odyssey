import type { Seal, Clue, Item, GameFlow } from '../types'

export const seals: Seal[] = [
  {
    id: 'seal_one',
    name: '儒学文脉章',
    description: '代表揭阳学宫的儒学文化传承',
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
    id: 'clue_001',
    type: 'item',
    name: '伪造印章三',
    description: '这是一枚伪造的印章，无拼接凹槽，纹路模糊。在苏茶翁茶社发现，是识别掠夺者的重要线索。',
    icon: '/static/clues/fake-seal.png',
    location: 'kungfu_tea_house',
    relevance: 'plunderer_identification'
  },
  {
    id: 'clue_002',
    type: 'testimony',
    name: '陈皮味证言',
    description: '王市井的证词：蔡老板常买陈皮，称可入药。这个奇怪的习惯可能是掠夺者的特征之一。',
    icon: '/static/clues/testimony.png',
    witness: '王市井',
    location: 'ancient_street',
    relevance: 'plunderer_habit'
  },
  {
    id: 'clue_003',
    type: 'environment',
    name: '进贤门迷药残留',
    description: '在进贤门的鼓架处发现的迷药残留，与蔡福生口袋中的物品一致。这表明掠夺者使用了特殊的手段。',
    icon: '/static/clues/powder.png',
    location: 'jinxian_gate',
    relevance: 'plunderer_tools'
  },
  {
    id: 'clue_004',
    type: 'knowledge',
    name: '掠夺者特征',
    description: '根据郑月容父亲笔记记载：掠夺者左手六指，背部有狮纹伤疤，伪造的印章没有拼接凹槽。这些特征是识别他的关键。',
    icon: '/static/clues/notes.png',
    source: '郑月容父亲笔记',
    location: 'lama_palace',
    relevance: 'plunderer_identification'
  }
]

export const items: Item[] = [
  {
    id: 'item_001',
    name: '父亲的笔记',
    description: '父亲留下的珍贵笔记，记录了家族印章的秘密和掠夺者的线索。字里行间透露出深深的不安和担忧。',
    icon: '/static/items/father-notes.png',
    type: 'document'
  },
  {
    id: 'item_002',
    name: '捕快腰牌',
    description: '陈灵儿的身份凭证，背面刻有与印章一契合的纹路，是验证印章真伪的关键物品。',
    icon: '/static/items/badge.png',
    type: 'identity'
  },
  {
    id: 'item_003',
    name: '半块侨批',
    description: '养母临终前交给你的半块侨批，上面刻着"印章合，亲人归"，是寻找父母的重要线索。',
    icon: '/static/items/half-letter.png',
    type: 'heirloom'
  },
  {
    id: 'item_004',
    name: '南洋茶叶',
    description: '林景澄从南洋带回的特产茶叶，据说是与苏茶翁交流的特殊媒介，蕴含着家族的历史。',
    icon: '/static/items/tea.png',
    type: 'special'
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