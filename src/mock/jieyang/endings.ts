// src/mock/jieyang/endings.ts
import type { StoryEnding } from '../types'

// 使用数组结构，方便后续通过 filter(e => e.characterId === 'xxx') 查找某人的所有结局
export const storyEndings: StoryEnding[] = [
  // 🌟 结局一：完美结局 (云开月明)
  {
    id: 'chen_ending_perfect', // 建议加上人物前缀，防止ID冲突
    characterId: 'chen_linger', // ✅ 核心修复：绑定人物
    type: 'perfect',
    title: '云开月明',
    achievement: '家族守护者', // 对应 MD 中的称号
    description:
      '蔡福生被当场拿获，那一包还没来得及销毁的迷药和藏在暗格里的《护卫日志》完好无损。',
    background:
      '你翻开日志，看到父亲的笔迹：“吾儿，父母未死，隐于南洋。”三个月后，你辞去捕快之职，登上了去往南洋的红头船，与家人团聚。',
    conditions: {
      minCourage: 10,
      minClue: 5,
      // 这里对应 scriptNodes 中的逻辑，仅作记录，实际判定可能在组件内完成
      requiredFlags: ['knows_six_finger', 'knows_lion_scar'],
    },
    imageUrl: 'endings/chen_perfect.webp',
  },

  // 🛡️ 结局二：普通结局 (古城守夜人)
  {
    id: 'chen_ending_normal',
    characterId: 'chen_linger', // ✅ 绑定人物
    type: 'normal',
    title: '古城守夜人',
    achievement: '孤单的守望者',
    description:
      '蔡福生因伪造信物被捕入狱，但他死咬着不松口。因为缺乏关键证据，你无法得知父母的生死。',
    background:
      '你选择继续留在揭阳古城，做一名捕快，日夜守望着进贤门，期待有一天能等到那个或许永远不会回来的消息。',
    conditions: {
      minClue: 2,
      // 对应MD：策略B（言语周旋），证据链不完整
    },
    imageUrl: 'endings/chen_normal.webp',
  },

  // 🌧️ 结局三：悲剧结局 (雨夜孤影)
  {
    id: 'chen_ending_bad',
    characterId: 'chen_linger', // ✅ 绑定人物
    type: 'bad',
    title: '雨夜孤影',
    achievement: '迷途捕快',
    description:
      '火盆里的纸张化为灰烬。蔡福生狂笑着：“烧了！都烧了！你爹娘的消息，这辈子你也别想知道！”',
    background:
      '线索断了。你站在满地狼藉的侨批馆里，窗外下起了大雨，就像二十年前那个夜晚一样。你赢了局，却输了家。',
    conditions: {
      // 对应MD：策略C（犹豫不决）或 果敢度过低
      maxCourage: 0,
    },
    imageUrl: 'endings/chen_bad.webp',
  },

  // 🥚 隐藏结局 (南洋茶局)
  {
    id: 'chen_ending_hidden',
    characterId: 'chen_linger', // ✅ 绑定人物
    type: 'hidden',
    title: '南洋茶局',
    achievement: '大智若愚',
    description:
      '一句“老爷保号”唤醒了良知。蔡福生崩溃痛哭，主动交出了所有东西。你没有抓他，而是让他去南洋送信。',
    background:
      '多年后，你在揭阳开了一家茶馆，父母虽年迈但已归来，一家人围炉煮茶，听雨声。',
    conditions: {
      minIntimacy: 10,
      // 对应MD：全程不动武，且触发暗语
      requiredFlags: ['peaceful_resolution'],
    },
    imageUrl: 'endings/chen_hidden.webp',
  },
]

// 辅助函数：获取指定角色的结局列表
export const getEndingsByCharacter = (charId: string) => {
  return storyEndings.filter((ending) => ending.characterId === charId)
}

// 辅助函数：根据ID获取特定结局
export const getEndingById = (endingId: string) => {
  return storyEndings.find((ending) => ending.id === endingId)
}
