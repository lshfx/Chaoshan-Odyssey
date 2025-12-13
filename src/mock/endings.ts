// 🎭 故事结局数据字典
// 从 index.vue 中抽离，避免组件内硬编码

import type { StoryEnding } from './types'

export const storyEndings: Record<string, StoryEnding> = {
  ending_perfect: {
    id: 'ending_perfect',
    characterId: 'chen_linger',
    type: 'perfect',
    title: '完美结局：真相大白',
    achievement: '真相守护者',
    description:
      '成功揭露了蔡福生的真面目，找回了失落的《护卫日志》。百年的冤案终于昭雪，揭阳古城的文脉得以完整传承。',
    background:
      '经过一番智斗，陈灵儿不仅保护了珍贵的印章，更重要的是还原了历史的真相。蔡福生的阴谋被彻底粉碎，而那本记录着家族荣耀与责任的《护卫日志》重见天日。揭阳的文脉得以完整传承，你的名字将永远铭记在这座古城的历史中。',
    imageUrl: 'endings/perfect.webp',
    musicUrl: 'audio/ending_perfect.mp3',
    conditions: {
      minCourage: 1,
      minClue: 2,
      minIntimacy: 0,
    },
  },
  ending_normal: {
    id: 'ending_normal',
    characterId: 'chen_linger',
    type: 'normal',
    title: '普通结局：虽胜犹憾',
    achievement: '古城守夜人',
    description:
      '蔡福生被捕，但《护卫日志》下落不明。虽然守护了印章，但当年的真相可能永远埋藏在了历史的尘埃中。',
    background:
      '虽然成功阻止了蔡福生的恶行，但那本承载着真相的《护卫日志》在混乱中被焚毁。你守护了揭阳的文化遗产，却失去了揭开全部真相的机会。或许，有些故事注定要带着遗憾继续书写。你成为了这座古城新的守夜人，默默守护着那些不为人知的秘密。',
    imageUrl: 'endings/normal.webp',
    musicUrl: 'audio/ending_normal.mp3',
    conditions: {
      minCourage: 0,
      minClue: 0,
      minIntimacy: 0,
    },
  },
  ending_good: {
    id: 'ending_good',
    characterId: 'chen_linger',
    type: 'perfect',
    title: '良好结局：正义得彰',
    achievement: '正义执行者',
    description:
      '成功揭露蔡福生，虽然部分证据丢失，但主要目标达成。真相虽不完整，但正义得到伸张。',
    background:
      '经过一番努力，你成功揭开了蔡福生的真面目，让他为自己的行为付出了代价。虽然一些关键证据在追捕过程中遗失，但重要的真相已经水落石出。你不仅守护了揭阳的文化遗产，也为父母找到了迟来的正义。这个结局或许不够完美，但已经是你在当时条件下能争取到的最好结果。',
    imageUrl: 'endings/good.webp',
    musicUrl: 'audio/ending_good.mp3',
    conditions: {
      minCourage: 1,
      minClue: 1,
      minIntimacy: 1,
    },
  },
  ending_bad: {
    id: 'ending_bad',
    characterId: 'chen_linger',
    type: 'bad',
    title: '悲剧结局：线索断绝',
    achievement: '雨夜孤影',
    description:
      '关键证据被毁，唯一的线索化为灰烬。你虽然得到了印章，但心中的谜团将永远无法解开。',
    background:
      '在那个雨夜，眼看着蔡福生将《护卫日志》投入烈火，所有的线索都化为灰烬。虽然你成功保护了印章的安全，但那个困扰你多年的谜团却永远失去了答案。从此，每当雨夜降临，你都会独自站在揭阳古城的屋檐下，凝望着那片埋葬真相的废墟，心中留下永远的遗憾。',
    imageUrl: 'endings/bad.webp',
    musicUrl: 'audio/ending_bad.mp3',
    conditions: {
      minCourage: -1,
      minClue: 0,
      minIntimacy: -1,
    },
  },
}
