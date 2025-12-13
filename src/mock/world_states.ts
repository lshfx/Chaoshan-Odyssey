/**
 * 世界状态配置文件
 *
 * 该文件定义了不同角色在特定条件下的世界状态覆写规则。
 * 通过配置化的方式管理动态 NPC 替换、环境变化等逻辑，
 * 替代原本硬编码在页面组件中的条件判断。
 */

import type { CharacterWorldState } from './types'

/**
 * 世界状态配置表
 *
 * 每个角色可以定义多个覆写规则（overrides），
 * 当满足条件时，相应的 POI 会映射到不同的 NPC，
 * 并且可能伴随环境变化（背景图片、音乐等）。
 */
export const worldStates: Record<string, CharacterWorldState> = {
  // 陈灵儿的角色专属世界状态配置
  chen_linger: {
    characterId: 'chen_linger',
    overrides: [
      {
        id: 'chen_linger_finale',
        condition: {
          // 需要收集的印章条件
          requiredSeals: ['seal_one', 'seal_two'],
          // 可以扩展其他条件，如等级要求、特定标记等
          // requiredLevel: 10,
          // requiredFlags: ['chen_linger_story_complete']
        },
        // POI 映射：在特定条件下，某些地点的 NPC 会被替换
        poiMapping: {
          // 当陈灵儿收集到指定印章后，
          // 在进贤门（jinxian_gate）遇到的 NPC 将是蔡福盛（cai_fusheng）
          // 替代了原本的李城守（li_chengshou）
          jinxian_gate: 'cai_fusheng',
        },
        // 环境变化（可选）
        environmentChanges: {
          // 可以在触发特定剧情时更换背景图片或音乐
          // bgImage: 'backgrounds/chen_linger_finale.webp',
          // bgm: 'audio/chen_linger_finale.mp3'
        },
      },
    ],
  },

  // 可以在此添加其他角色的世界状态配置
  // 例如：
  // li_wencheng: {
  //   characterId: 'li_wencheng',
  //   overrides: [
  //     {
  //       id: 'li_wencheng_investigation',
  //       condition: {
  //         requiredSeals: ['seal_three'],
  //         requiredLevel: 8
  //       },
  //       poiMapping: {
  //         shuang_lu_temple: 'mysterious_scholar'
  //       }
  //     }
  //   ]
  // }
}

/**
 * 获取指定角色的世界状态
 *
 * @param characterId 角色ID
 * @returns 角色的世界状态配置，如果不存在则返回 undefined
 */
export function getCharacterWorldState(
  characterId: string
): CharacterWorldState | undefined {
  return worldStates[characterId]
}

/**
 * 检查是否满足世界状态覆写条件
 *
 * @param condition 覆写条件
 * @param userInventory 用户物品清单（印章等）
 * @param userLevel 用户等级
 * @param userFlags 用户标记
 * @returns 是否满足条件
 */
export function checkOverrideCondition(
  condition: import('./types').OverrideCondition,
  userInventory: string[] = [],
  userLevel: number = 0,
  userFlags: string[] = []
): boolean {
  // 检查印章条件
  if (condition.requiredSeals) {
    const hasAllSeals = condition.requiredSeals.every((sealId) =>
      userInventory.includes(sealId)
    )
    if (!hasAllSeals) return false
  }

  // 检查等级条件
  if (condition.requiredLevel && userLevel < condition.requiredLevel) {
    return false
  }

  // 检查标记条件
  if (condition.requiredFlags) {
    const hasAllFlags = condition.requiredFlags.every((flag) =>
      userFlags.includes(flag)
    )
    if (!hasAllFlags) return false
  }

  return true
}

/**
 * 根据当前状态解析 NPC ID
 *
 * @param poiId POI ID
 * @param defaultNpcId 默认 NPC ID
 * @param characterId 当前角色 ID
 * @param userInventory 用户物品清单
 * @param userLevel 用户等级
 * @param userFlags 用户标记
 * @returns 解析后的 NPC ID
 */
export function resolveNpcId(
  poiId: string,
  defaultNpcId: string,
  characterId?: string,
  userInventory: string[] = [],
  userLevel: number = 0,
  userFlags: string[] = []
): string {
  // 如果没有角色 ID，直接返回默认 NPC
  if (!characterId) {
    return defaultNpcId
  }

  // 获取角色的世界状态
  const worldState = getCharacterWorldState(characterId)
  if (!worldState) {
    return defaultNpcId
  }

  // 检查每个覆写规则
  for (const override of worldState.overrides) {
    if (
      checkOverrideCondition(
        override.condition,
        userInventory,
        userLevel,
        userFlags
      )
    ) {
      // 检查是否有针对该 POI 的映射
      const mappedNpcId = override.poiMapping[poiId]
      if (mappedNpcId) {
        return mappedNpcId
      }
    }
  }

  // 如果没有满足任何覆写条件，返回默认 NPC
  return defaultNpcId
}
