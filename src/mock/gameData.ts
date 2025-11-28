// 游戏核心数据结构定义
// 支持多城市架构：揭阳、潮州、汕头

import type { CityData } from './types'
import { jieyang } from './jieyang'

// 导出类型定义（保持向后兼容）
export * from './types'

// 游戏数据主对象（结构保持与原版完全一致）
export const gameData = {
  // 揭阳篇数据
  jieyang,

  // 潮州篇数据（预留空结构）
  chaozhou: {
    cityId: 'chaozhou',
    cityName: '潮州',
    cityStatus: 'locked', // locked, unlocked, completed
    description: '千年古城，瓷都茶乡',
    characters: [],
    npcs: [],
    pois: [],
    seals: [],
    gameFlow: {
      phases: [],
      victoryConditions: {
        goodGuys: { name: '', requirements: [] },
        plunderer: { name: '', requirements: [] },
        draw: { name: '', requirements: [] }
      }
    },
    clues: []
  } as CityData,

  // 汕头篇数据（预留空结构）
  shantou: {
    cityId: 'shantou',
    cityName: '汕头',
    cityStatus: 'locked', // locked, unlocked, completed
    description: '百载商埠，海丝门户',
    characters: [],
    npcs: [],
    pois: [],
    seals: [],
    gameFlow: {
      phases: [],
      victoryConditions: {
        goodGuys: { name: '', requirements: [] },
        plunderer: { name: '', requirements: [] },
        draw: { name: '', requirements: [] }
      }
    },
    clues: []
  } as CityData
}

// 导出整个数据对象作为默认导出
export default gameData