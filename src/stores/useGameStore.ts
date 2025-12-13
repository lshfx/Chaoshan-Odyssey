import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import {
  gameData,
  type Character,
  type POI,
  type Seal,
  type Clue,
  type Item,
} from '../mock/gameData'
import { IMG_HOST } from '@/config/constants'

// NPC进度管理
interface NPCProgress {
  [npcId: string]: string // npcId -> nodeId
}

// [NEW] Define Stat Types
export type StatType = 'courage' | 'clue' | 'intimacy'

export const useGameStore = defineStore('game', () => {
  // ============ State ============
  const currentCity = ref('jieyang')
  const currentUser = ref<Character | null>(null)

  // NPC进度状态
  const npcProgress = ref<NPCProgress>({})

  const inventory = ref<{
    seals: string[] // 印章ID列表
    clues: string[] // 线索ID列表
    items: string[] // 其他物品ID列表
  }>({
    seals: [],
    clues: [],
    items: [],
  })

  const missionStatus = ref<{
    currentPhase: string
    completedTasks: string[]
    unlockedPOIs: string[]
    currentObjective: string | null
    gameStarted: boolean
    gameCompleted: boolean
  }>({
    currentPhase: 'ice_breaking',
    completedTasks: [],
    unlockedPOIs: [],
    currentObjective: '选择角色，开始游戏',
    gameStarted: false,
    gameCompleted: false,
  })

  // 位置状态
  const userLocation = ref<{
    latitude: number
    longitude: number
  }>({
    latitude: 23.536, // 揭阳古城中心
    longitude: 116.356,
  })

  const targetLocation = ref<{
    latitude: number
    longitude: number
    name: string
  } | null>(null)

  // 剧情状态
  const storyStage = ref(0) // 当前剧情阶段，默认为0
  const unlockedPoiIds = ref<string[]>([]) // 当前已解锁的地点ID列表
  const completedPoiIds = ref<string[]>([]) // 当前已完成的地点ID列表
  const currentScript = ref<any[]>([]) // 当前正在播放的对话脚本
  const isDialogueVisible = ref(false) // 控制对话组件显示

  // --- Phase 6: Interactive Narrative State ---

  // 1. Player Hidden Stats
  const playerStats = ref({
    courage: 0, // 果敢度
    clue: 0, // 线索值
    intimacy: 0, // 亲密度
  })

  // 2. Story History (Choice IDs)
  const storyHistory = ref<string[]>([])

  // ============ Getters ============

  // 获取当前城市数据
  const currentCityData = computed(() => {
    return (
      gameData[currentCity.value as keyof typeof gameData] || gameData.jieyang
    )
  })

  // 获取当前城市的POI列表
  const currentCityPOIs = computed(() => {
    return currentCityData.value?.pois || []
  })

  // 获取可见的地图标记（基于剧情解锁的POI）
  const visibleMarkers = computed(() => {
    const allPois = currentCityData.value?.pois || []

    // ✅ 核心修复：这里必须从 missionStatus.value.unlockedPOIs 读取！
    // 之前的 unlockedPoiIds.value 是旧逻辑遗留的变量，导致新解锁的地点不显示
    const unlockedList = missionStatus.value.unlockedPOIs
    const completedList = completedPoiIds.value // 🎨 新增：获取已完成列表

    // 过滤出已解锁的POI
    const markers = allPois
      .filter((poi) => unlockedList.includes(poi.id))
      .map((poi, index) => {
        // 判断是否是当前导航目标
        const isTarget =
          targetLocation.value && poi.name === targetLocation.value.name
        const isCompleted = completedList.includes(poi.id) // 🎨 新增：判断是否已完成

        // 🎨 图标与尺寸逻辑
        let iconPath = '/static/markers/mission-marker.png' // 默认为任务图标(红)
        let width = 40
        let height = 40
        let zIndex = 5

        if (isCompleted) {
          // ✅ 已完成：变蓝，变小
          iconPath = '/static/markers/my-location.png'
          width = 24
          height = 24
          zIndex = 1 // 沉底
        } else {
          // 🚧 未完成：保持任务图标
          iconPath = '/static/markers/mission-marker.png'
          // 如果是当前追踪目标，可以稍微放大
          if (isTarget) {
            width = 48
            height = 48
            zIndex = 10
          }
        }

        return {
          id: 900000000 + index, // 唯一的数字 ID
          poiId: String(poi.id), // 原始字符串 ID
          latitude: poi.latitude,
          longitude: poi.longitude,
          iconPath,
          width,
          height,
          anchor: { x: 0.5, y: 1 },
          zIndex,
          // 气泡逻辑
          callout: {
            content: poi.name,
            color: '#FFFFFF',
            fontSize: 12,
            borderRadius: 6,
            // 🎨 已完成蓝底，进行中红底
            bgColor: isCompleted ? '#2196F3' : '#FF4444',
            padding: 8,
            // 目标点强制显示
            display: 'ALWAYS',
            boxShadow: '0 2px 6px rgba(0, 0, 0, 0.3)',
          },
        }
      })

    return markers
  })

  // 获取当前城市的角色列表
  const currentCityCharacters = computed(() => {
    return currentCityData.value?.characters || []
  })

  // 获取已解锁的POI
  const unlockedPOIs = computed(() => {
    return currentCityPOIs.value.filter((poi) =>
      missionStatus.value.unlockedPOIs.includes(poi.id)
    )
  })

  // 获取已收集的印章
  const collectedSeals = computed(() => {
    const seals = inventory.value.seals || []
    const allSeals = [...(currentCityData.value?.seals || [])]
    return seals
      .map((sealId) => {
        return allSeals.find((seal) => seal.id === sealId)
      })
      .filter(Boolean)
  })

  // 获取印章收集进度
  const sealProgress = computed(() => {
    const totalSeals = currentCityData.value?.seals?.length || 0
    const collected = inventory.value.seals?.length || 0
    return {
      current: collected,
      total: totalSeals,
      percentage:
        totalSeals > 0 ? Math.round((collected / totalSeals) * 100) : 0,
    }
  })

  // 检查是否可以拼合四章图案
  const canCombineFourSeals = computed(() => {
    const seals = inventory.value.seals || []
    const mainSeals = seals.filter((sealId) => !sealId.includes('laoye_baohao'))
    return mainSeals.length >= 4
  })

  // 检查是否可以获得老爷保号章
  const canGetFinalSeal = computed(() => {
    const seals = inventory.value.seals || []
    return canCombineFourSeals.value && !seals.includes('laoye_baohao_seal')
  })

  // ============ Actions ============

  // 初始化游戏
  const initGame = (selectedCharacter: Character) => {
    currentUser.value = selectedCharacter
    missionStatus.value.gameStarted = true
    missionStatus.value.currentObjective = `前往揭阳学宫寻找林文渊`

    // 解锁第一个POI（揭阳学宫）
    unlockPOI('jieyang_confucian_temple')

    // 添加初始关键道具
    addItem('item_badge') // 捕快腰牌 - 陈灵儿剧本关键信物
    addItem('item_father_notes') // 父亲的笔记 - 背景信息
    addItem('item_half_letter') // 半块侨批 - 剧情驱动道具

    console.log('游戏初始化完成:', {
      character: selectedCharacter.name,
      city: currentCity.value,
      initialItems: inventory.value.items,
    })
  }

  // 添加测试数据到背包
  const addTestInventory = () => {
    // 添加测试线索
    inventory.value.clues.push('clue_001', 'clue_002')

    // 添加测试道具
    inventory.value.items.push('item_001', 'item_003')

    console.log('测试背包数据已添加:', inventory.value)
  }

  // 切换城市
  const switchCity = (cityId: string) => {
    if (!gameData[cityId as keyof typeof gameData]) {
      console.error('城市不存在:', cityId)
      return false
    }

    const cityData = gameData[cityId as keyof typeof gameData]

    // 检查城市是否已解锁
    if (cityData.cityStatus === 'locked') {
      console.log('城市尚未解锁:', cityId)
      return false
    }

    currentCity.value = cityId

    // 重置该城市的进度
    missionStatus.value.unlockedPOIs = []
    missionStatus.value.completedTasks = []
    missionStatus.value.currentObjective = `选择角色，开始${
      cityData?.cityName || '未知城市'
    }的旅程`

    console.log('切换城市成功:', {
      from: currentCity.value,
      to: cityId,
      cityName: cityData.cityName,
    })

    return true
  }

  // 解锁POI
  const unlockPOI = (poiId: string) => {
    if (!missionStatus.value.unlockedPOIs.includes(poiId)) {
      missionStatus.value.unlockedPOIs.push(poiId)
      console.log('解锁POI:', poiId)

      // 更新当前目标
      const poi = currentCityPOIs.value.find((p) => p.id === poiId)
      if (poi) {
        missionStatus.value.currentObjective = `前往${poi.name}完成任务`

        // 关键修复：自动将新解锁的 POI 设置为导航目标
        setTargetLocation(poi.latitude, poi.longitude, poi.name)
        console.log('设置导航目标:', poi.name, poi.latitude, poi.longitude)
      }
    }
  }

  // 添加印章到背包
  const addSeal = (sealId: string) => {
    if (!inventory.value.seals.includes(sealId)) {
      inventory.value.seals.push(sealId)
      console.log('获得印章:', sealId)

      // 保存进度到本地存储
      saveProgress()

      // ❌ [修改] 注释掉自动导航！不要一拿印章就导航！
      // checkAndUnlockNextPOI()

      // 检查是否可以获得老爷保号章
      checkFinalSealAvailability()
    }
  }

  // 解锁印章 (新增的专用方法)
  const unlockSeal = (sealId: string) => {
    addSeal(sealId)
    uni.showToast({
      title: '获得新印章！',
      icon: 'success',
    })
  }

  // 检查是否可以获得最终印章
  const checkFinalSealAvailability = () => {
    if (
      canGetFinalSeal.value &&
      !inventory.value.seals.includes('laoye_baohao_seal')
    ) {
      // 可以获得老爷保号章
      setTimeout(() => {
        uni.showModal({
          title: '拼图完成！',
          content: '恭喜！您已收集到四枚主印章，可以激活老爷保号章了！',
          showCancel: false,
          confirmText: '获得老爷保号章',
          success: () => {
            unlockSeal('laoye_baohao_seal')
          },
        })
      }, 1000)
    }
  }

  // 添加线索到背包
  const addClue = (clueId: string) => {
    if (!inventory.value.clues.includes(clueId)) {
      inventory.value.clues.push(clueId)
      console.log('获得线索:', clueId)
    }
  }

  // 添加物品到背包
  const addItem = (itemId: string) => {
    if (!inventory.value.items.includes(itemId)) {
      inventory.value.items.push(itemId)
      console.log('[Store] 获得物品:', itemId)
    }
  }

  // 完成任务
  const completeTask = (taskId: string) => {
    if (!missionStatus.value.completedTasks.includes(taskId)) {
      missionStatus.value.completedTasks.push(taskId)
      console.log('完成任务:', taskId)
    }
  }

  // 更新当前目标
  const updateObjective = (objective: string) => {
    missionStatus.value.currentObjective = objective
    console.log('更新目标:', objective)
  }

  // 完成任务
  const completeMission = (poiId: string) => {
    console.log('完成任务:', poiId)

    // 1. 将POI加入已完成列表
    if (!completedPoiIds.value.includes(poiId)) {
      completedPoiIds.value.push(poiId)
      console.log(
        'POI已完成:',
        poiId,
        '已完成总数:',
        completedPoiIds.value.length
      )
    }

    // 2. 解锁下一个剧情阶段
    storyStage.value += 1
    console.log('剧情阶段推进到:', storyStage.value)

    // 3. 🚨 [核心修复] 只调用新的智能导航系统，避免状态竞争
    // checkAndUnlockNextPOI 会处理解锁和导航逻辑
    checkAndUnlockNextPOI()

    // 4. 保存进度
    saveProgress()

    // 5. 显示完成提示
    const poi = getPOIById(poiId)
    if (poi) {
      console.log('恭喜完成:', poi.name)
    }
  }

  // 解锁下一个POI
  const unlockNextPOI = (currentPoiId: string) => {
    const allPOIs = currentCityPOIs.value
    const currentIndex = allPOIs.findIndex((poi) => poi.id === currentPoiId)

    if (currentIndex !== -1 && currentIndex < allPOIs.length - 1) {
      const nextPOI = allPOIs[currentIndex + 1]
      if (nextPOI && !unlockedPoiIds.value.includes(nextPOI.id)) {
        unlockedPoiIds.value.push(nextPOI.id)
        console.log('解锁下一个POI:', nextPOI.name)

        // 自动设置为目标位置
        setTargetLocation(nextPOI.latitude, nextPOI.longitude, nextPOI.name)
      }
    } else if (currentIndex === allPOIs.length - 1) {
      // 所有POI都已完成
      missionStatus.value.gameCompleted = true
      clearTargetLocation() // 清除导航目标
      console.log('恭喜！所有任务已完成！')
    }
  }

  // 更新已解锁POI列表
  const updateUnlockedPOIs = (completedPoiId: string) => {
    const currentPoiIndex = unlockedPoiIds.value.indexOf(completedPoiId)
    if (currentPoiIndex !== -1) {
      unlockedPoiIds.value.splice(currentPoiIndex, 1)
      console.log('从解锁列表移除已完成POI:', completedPoiId)
    }
  }

  const checkAndUnlockNextPOI = () => {
    const character = currentUser.value
    const collectedSealsCount = inventory.value.seals.length

    if (!character || !character.routeOrder) return

    // --- 1. 常规路线阶段 (Route Order) ---
    const nextIndex = collectedSealsCount
    if (nextIndex < character.routeOrder.length) {
      const nextPOIId = character.routeOrder[nextIndex]

      // 确保nextPOIId存在
      if (!nextPOIId) return

      const poi = getPOIById(nextPOIId)

      if (poi) {
        // A. 解锁逻辑 (仅首次执行)
        if (!missionStatus.value.unlockedPOIs.includes(nextPOIId)) {
          console.log('🔓 首次解锁:', nextPOIId)
          missionStatus.value.unlockedPOIs.push(nextPOIId)
          saveProgress() // 🚨 必须立即保存！

          setTimeout(() => {
            uni.showToast({ title: `解锁新地点：${poi.name}`, icon: 'none' })
          }, 500)
        }

        // B. 导航逻辑 (🚨 核心修复：独立于解锁逻辑之外)
        // 只要是下一站，且还没完成，就强制刷新导航！
        if (!completedPoiIds.value.includes(nextPOIId)) {
          // 强制刷新 targetLocation，确保地图组件能画线
          setTargetLocation(poi.latitude, poi.longitude, poi.name)
        }
      }
    }

    // --- 2. 最终阶段：进贤门 (Jinxian Gate) ---
    else if (collectedSealsCount >= 4) {
      const gateId = 'jinxian_gate'
      const gatePOI = getPOIById(gateId)

      if (gatePOI) {
        // A. 首次解锁
        if (!missionStatus.value.unlockedPOIs.includes(gateId)) {
          console.log('🎯 首次解锁进贤门')
          missionStatus.value.unlockedPOIs.push(gateId)
          saveProgress() // 🚨 必须立即保存！

          setTargetLocation(gatePOI.latitude, gatePOI.longitude, gatePOI.name)

          setTimeout(() => {
            uni.showToast({
              title: '最终地点解锁：进贤门',
              icon: 'none',
              duration: 4000,
            })
          }, 500)
        }
        // B. 导航恢复 (防止丢失)
        else if (!completedPoiIds.value.includes(gateId)) {
          // 如果当前没有导航，或者导航没指向进贤门，强制指过去
          if (
            !targetLocation.value ||
            targetLocation.value.name !== gatePOI.name
          ) {
            console.log('🔄 恢复进贤门导航')
            setTargetLocation(gatePOI.latitude, gatePOI.longitude, gatePOI.name)
          }
        }
      }
    }
  }

  // 保存游戏进度
  const saveProgress = () => {
    try {
      const gameData = {
        currentCity: currentCity.value,
        currentUser: currentUser.value,
        inventory: inventory.value,
        missionStatus: missionStatus.value,
        // 🔥 核心修复：保存 storyStage 和 unlockedPoiIds
        storyStage: storyStage.value,
        unlockedPoiIds: unlockedPoiIds.value, // 直接保存数组
        completedPoiIds: completedPoiIds.value,
        playerStats: playerStats.value,
        storyHistory: storyHistory.value,
        npcProgress: npcProgress.value,
      }
      uni.setStorageSync('chaoshan_odyssey_progress', gameData)
      console.log('✅ 游戏进度已保存', {
        storyStage: storyStage.value,
        unlockedPoiCount: unlockedPoiIds.value.length,
      })
    } catch (error) {
      console.error('❌ 保存进度失败:', error)
    }
  }

  // 加载游戏进度
  const loadProgress = (): boolean => {
    try {
      const savedData = uni.getStorageSync('chaoshan_odyssey_progress')
      if (savedData) {
        // 🔥 核心修复：恢复所有关键状态
        currentCity.value = savedData.currentCity || 'jieyang'
        currentUser.value = savedData.currentUser || null
        inventory.value = savedData.inventory || {
          seals: [],
          clues: [],
          items: [],
        }
        // 🔥 [关键修复] 必须正确恢复任务状态，确保每个字段都被正确赋值
        const savedMissionStatus = savedData.missionStatus
        if (savedMissionStatus) {
          // 逐字段恢复，确保 Vue 的响应性
          missionStatus.value.currentPhase =
            savedMissionStatus.currentPhase || 'ice_breaking'
          missionStatus.value.completedTasks =
            savedMissionStatus.completedTasks || []
          missionStatus.value.unlockedPOIs =
            savedMissionStatus.unlockedPOIs || []
          missionStatus.value.currentObjective =
            savedMissionStatus.currentObjective || '选择角色，开始游戏'
          missionStatus.value.gameStarted =
            savedMissionStatus.gameStarted || false
          missionStatus.value.gameCompleted =
            savedMissionStatus.gameCompleted || false

          console.log('✅ 任务状态已恢复:', {
            gameStarted: missionStatus.value.gameStarted,
            currentPhase: missionStatus.value.currentPhase,
            unlockedPOIs: missionStatus.value.unlockedPOIs.length,
          })
        } else {
          // 没有存档的任务状态，使用默认值
          missionStatus.value = {
            currentPhase: 'ice_breaking',
            completedTasks: [],
            unlockedPOIs: [],
            currentObjective: '选择角色，开始游戏',
            gameStarted: false,
            gameCompleted: false,
          }
        }

        // 🔥 核心修复：恢复 storyStage（默认为0）
        storyStage.value = savedData.storyStage ?? 0

        // 🔥 核心修复：恢复 unlockedPoiIds（保持为数组）
        unlockedPoiIds.value = savedData.unlockedPoiIds || []

        // 恢复其他状态
        completedPoiIds.value = savedData.completedPoiIds || []
        playerStats.value = savedData.playerStats || {
          courage: 0,
          clue: 0,
          intimacy: 0,
        }
        storyHistory.value = savedData.storyHistory || []
        npcProgress.value = savedData.npcProgress || {}

        console.log('✅ 游戏进度已加载', {
          storyStage: storyStage.value,
          unlockedPoiCount: unlockedPoiIds.value.length,
          gameStarted: missionStatus.value.gameStarted,
          hasUser: !!currentUser.value,
        })

        // 🚨 [关键修复] 加载后重新触发导航计算
        // 解决刷新页面后导航丢失的问题
        if (currentUser.value && missionStatus.value.gameStarted) {
          setTimeout(() => {
            console.log('🔄 恢复导航状态...')
            checkAndUnlockNextPOI()
          }, 500)
        }

        // 返回加载成功
        return true
      }

      console.log('📝 未找到存档文件，返回false')
      return false
    } catch (error) {
      console.error('❌ 加载进度失败:', error)
      return false
    }
  }

  // 重置游戏
  const resetGame = () => {
    currentUser.value = null
    inventory.value = {
      seals: [],
      clues: [],
      items: [],
    }
    missionStatus.value = {
      currentPhase: 'ice_breaking',
      completedTasks: [],
      unlockedPOIs: [],
      currentObjective: '选择角色，开始游戏',
      gameStarted: false,
      gameCompleted: false,
    }

    // 清除本地存储
    try {
      uni.removeStorageSync('chaoshan_odyssey_progress')
    } catch (error) {
      console.error('清除进度失败:', error)
    }

    console.log('游戏已重置')
  }

  // 获取地图标记点
  const getMapMarkers = () => {
    return currentCityPOIs.value.map((poi) => {
      const isUnlocked = missionStatus.value.unlockedPOIs.includes(poi.id)
      const isCompleted = completedPoiIds.value.includes(poi.id) // ✅ 使用完成状态
      const isCurrentObjective = missionStatus.value.currentObjective?.includes(
        poi.name
      )

      return {
        id: poi.id,
        latitude: poi.latitude,
        longitude: poi.longitude,
        iconPath: isCurrentObjective
          ? '/static/markers/mission-marker.png' // 红色高亮（使用本地 PNG）
          : isCompleted
          ? '/static/markers/my-location.png' // 蓝色图标（使用本地 PNG）
          : isUnlocked
          ? '/static/markers/mission-marker.png' // 黄色状态（使用本地 PNG）
          : '/static/markers/my-location.png', // 灰色状态（使用本地 PNG） // 灰色未解锁（暂时复用）
        width: 30,
        height: 30,
        callout: {
          content: poi.name,
          display: 'ALWAYS',
          textAlign: 'center',
          fontSize: 12,
          borderRadius: 4,
          bgColor: isCurrentObjective
            ? '#ffebee'
            : isCompleted
            ? '#e3f2fd' // 蓝色背景（已完成）
            : isUnlocked
            ? '#fff8e1' // 黄色背景（已解锁）
            : '#f5f5f5', // 灰色背景（未解锁）
          padding: 4,
        },
      }
    })
  }

  // 获取POI详情
  const getPOIById = (poiId: string): POI | undefined => {
    return currentCityPOIs.value.find((poi) => poi.id === poiId)
  }

  // 获取印章详情
  const getSealById = (sealId: string): Seal | undefined => {
    const allSeals = [...currentCityData.value.seals]
    return allSeals.find((seal) => seal.id === sealId)
  }

  // 获取线索详情
  const getClueById = (clueId: string): Clue | undefined => {
    const allClues = [...currentCityData.value.clues]
    return allClues.find((clue) => clue.id === clueId)
  }

  // 获取道具详情
  const getItemById = (itemId: string): Item | undefined => {
    // 这里可以根据实际需求扩展道具数据结构
    const allItems = [...(currentCityData.value.items || [])]
    return allItems.find((item) => item.id === itemId)
  }

  // 更新用户位置
  const updateUserLocation = (latitude: number, longitude: number) => {
    userLocation.value = { latitude, longitude }
    console.log('用户位置更新:', { latitude, longitude })
  }

  // 设置目标位置
  const setTargetLocation = (
    latitude: number | string,
    longitude: number | string,
    name: string
  ) => {
    // 1. 强制类型转换
    const lat = Number(latitude)
    const lng = Number(longitude)

    if (isNaN(lat) || isNaN(lng)) {
      console.error('❌ 导航坐标无效:', latitude, longitude)
      return
    }

    // 2. 🚨 核心修复：先清空，强制触发 UI 移除旧线
    targetLocation.value = null

    // 3. 延迟设置新值，强制触发 UI 绘制新线
    setTimeout(() => {
      targetLocation.value = {
        latitude: lat,
        longitude: lng,
        name: String(name),
      }
      console.log('🧭 导航目标已重置并更新:', targetLocation.value)
    }, 100)
  }

  const clearTargetLocation = () => {
    targetLocation.value = null
    console.log('清除导航目标')
  }

  // 开始剧情
  const startStory = (characterId: string) => {
    storyStage.value = 1
    isDialogueVisible.value = true

    // 根据角色ID生成开场旁白脚本
    if (characterId === 'chen_linger') {
      // 陈灵儿开场旁白
      currentScript.value = [
        {
          id: 'intro_1',
          speakerType: 'narrator',
          name: '旁白',
          content: '百年前，揭阳侨商家族为守护文脉与资产，铸五枚印章为信物……',
        },
        {
          id: 'intro_2',
          speakerType: 'player',
          name: '陈灵儿',
          avatar: IMG_HOST + 'avatars/chen_linger.webp',
          content: '养母临终前告诉我，只要集齐印章，就能找到父母失踪的真相。',
        },
        {
          id: 'intro_3',
          speakerType: 'player',
          name: '陈灵儿',
          avatar: IMG_HOST + 'avatars/chen_linger.webp',
          content: '也就是在这里……揭阳学宫。那是他们最后出现的地方。',
        },
      ]
    } else {
      // 其他角色的默认剧情（后续扩展）
      currentScript.value = [
        {
          id: 'default_intro',
          speakerType: 'narrator',
          name: '旁白',
          content: '你来到了揭阳古城，开启了寻找印章的旅程……',
        },
      ]
    }

    console.log(
      '剧情开始，角色:',
      characterId,
      '脚本长度:',
      currentScript.value.length
    )
  }

  // 解锁地点
  const unlockLocation = (poiId: string) => {
    if (!unlockedPoiIds.value.includes(poiId)) {
      unlockedPoiIds.value.push(poiId)
      console.log('解锁地点:', poiId)

      // 自动设置为目标位置
      const poi = getPOIById(poiId)
      if (poi) {
        setTargetLocation(poi.latitude, poi.longitude, poi.name)

        // 显示提示
        uni.showToast({
          title: `已解锁：${poi.name}`,
          icon: 'success',
        })
      }
    }
  }

  // 处理对话结束
  const handleDialogueEnd = () => {
    isDialogueVisible.value = false

    // 如果是开场旁白结束（storyStage=1），解锁第一个地点
    if (storyStage.value === 1) {
      storyStage.value = 2
      unlockLocation('jieyang_confucian_temple') // 解锁揭阳学宫
    }

    console.log('对话结束，当前剧情阶段:', storyStage.value)
  }

  // --- Phase 6: Interactive Narrative Actions ---

  // Update Stats
  // Update Stats
  const updateStat = (type: StatType, value: number) => {
    if (Object.prototype.hasOwnProperty.call(playerStats.value, type)) {
      const key = type as keyof typeof playerStats.value
      const oldValue = playerStats.value[key]

      playerStats.value[key] += value

      const newValue = playerStats.value[key]

      // 📊 [监控] 实时打印数值变化
      console.log(
        `📊 [数值变更] ${type}: ${oldValue} ➡️ ${newValue} (变动: ${
          value > 0 ? '+' : ''
        }${value})`
      )
    }
  }

  // Record Choice
  const recordChoice = (choiceId: string) => {
    if (!storyHistory.value.includes(choiceId)) {
      storyHistory.value.push(choiceId)
      console.log(`[History] Recorded choice: ${choiceId}`)
    }
  }

  // Check Conditions (e.g., { courage: 1 } -> true if courage >= 1)
  // 核心判定系统 (Smart Check)
  const checkCondition = (
    conditions: Partial<typeof playerStats.value>
  ): boolean => {
    for (const key in conditions) {
      // 🕵️‍♀️ [Hotfix] 线索判定特权：直接查背包！
      // 解决"明明有线索却判定失败"的 Bug
      if (key === 'clue') {
        const requiredCount = conditions[key] || 0
        const actualCount = inventory.value.clues.length

        console.log(
          `[判定] 检查线索: 背包拥有 ${actualCount} / 需要 ${requiredCount}`
        )

        if (actualCount < requiredCount) {
          return false
        }
        continue // 线索达标，继续检查下一个属性
      }

      // 其他属性 (courage, intimacy) 继续查数值
      const k = key as keyof typeof playerStats.value
      const currentValue = playerStats.value[k]
      const requiredValue = conditions[k] || 0

      console.log(
        `[判定] 检查属性 ${key}: 当前 ${currentValue} / 需要 ${requiredValue}`
      )

      if (currentValue < requiredValue) {
        return false
      }
    }
    return true
  }

  // Reset State (For testing)
  const resetStoryState = () => {
    playerStats.value = { courage: 0, clue: 0, intimacy: 0 }
    storyHistory.value = []
  }

  // 结局判定系统
  // 结局判定系统
  const checkEnding = (): string => {
    const { courage, clue, intimacy } = playerStats.value
    const inventoryClues = inventory.value.clues.length // 真实背包线索数

    console.log('============== 🏁 结局判定报告 🏁 ==============')
    console.log(`💪 果敢值 (Courage): ${courage} (判定线: >=1)`)
    console.log(`❤️ 亲密值 (Intimacy): ${intimacy} (判定线: >=0)`)
    console.log(`🔍 线索值 (Stats):    ${clue} (判定线: >=2)`)
    console.log(`🎒 背包线索 (Real):   ${inventoryClues} (备用判定依据)`)
    console.log('==================================================')

    // 优先级 1: 悲剧结局
    if (intimacy < 0 || courage < 0) {
      console.log('❌ 判定结果: 悲剧结局 (属性过低)')
      return 'ending_bad'
    }

    // 优先级 2: 完美结局
    // 注意：建议同时参考 inventoryClues 以防数值未更新 Bug
    if ((clue >= 2 || inventoryClues >= 2) && courage >= 1) {
      console.log('🏆 判定结果: 完美结局 (条件达成)')
      return 'ending_perfect'
    }

    // 默认
    console.log('🛡️ 判定结果: 普通结局')
    return 'ending_normal'
  }

  // 任务状态检查（普通NPC任务用）
  const checkMissionStatus = (npcId: string): string => {
    console.log(`[任务状态检查] NPC: ${npcId}`)

    // 记录任务进度
    if (!missionStatus.value.completedTasks.includes(npcId)) {
      missionStatus.value.completedTasks.push(npcId)
      console.log(`[任务完成] ${npcId}`)
    }

    // 普通任务完成，返回成功状态
    return 'success'
  }

  // NPC进度管理方法
  const saveNPCProgress = (npcId: string, nodeId: string) => {
    // 更新内存状态
    npcProgress.value[npcId] = nodeId

    // 持久化到本地存储
    try {
      const savedProgress = uni.getStorageSync('chaoshan_npc_progress') || {}
      savedProgress[npcId] = nodeId
      uni.setStorageSync('chaoshan_npc_progress', savedProgress)
      console.log(`[NPC进度保存] ${npcId} -> ${nodeId}`)
    } catch (error) {
      console.error('保存NPC进度失败:', error)
    }
  }

  const getNPCProgress = (npcId: string): string | undefined => {
    // 从内存状态获取
    if (npcProgress.value[npcId]) {
      return npcProgress.value[npcId]
    }

    // 尝试从本地存储读取
    try {
      const savedProgress = uni.getStorageSync('chaoshan_npc_progress') || {}
      if (savedProgress[npcId]) {
        // 同步到内存状态
        npcProgress.value[npcId] = savedProgress[npcId]
        console.log(`[NPC进度读取] ${npcId} -> ${savedProgress[npcId]}`)
        return savedProgress[npcId]
      }
    } catch (error) {
      console.error('读取NPC进度失败:', error)
    }

    return undefined
  }

  // --- AVG侦探解谜核心逻辑 ---

  // 调查物品动作
  const inspectItem = (
    itemId: string
  ): { success: boolean; inspectText?: string; clueId?: string } => {
    // 从当前城市数据中查找物品
    const allItems = [...(currentCityData.value.items || [])]
    const item = allItems.find((item) => item.id === itemId)

    if (!item) {
      console.error(`[调查物品] 物品不存在: ${itemId}`)
      return { success: false }
    }

    if (!item.inspectable) {
      console.log(`[调查物品] 物品不可调查: ${itemId}`)
      return { success: false }
    }

    // 如果有关联线索，自动添加到背包
    if (item.relatedClueId) {
      addClue(item.relatedClueId)
      console.log(`[调查物品] 获得线索: ${item.relatedClueId}`)
    }

    console.log(`[调查物品] 调查完成: ${itemId}`)
    return {
      success: true,
      inspectText: item.inspectText,
      clueId: item.relatedClueId,
    }
  }

  // 验证举证动作
  const validatePresentation = (
    presentedItemId: string,
    requiredItemId: string
  ): boolean => {
    const isValid = presentedItemId === requiredItemId
    console.log(
      `[举证验证] ${presentedItemId} vs ${requiredItemId} = ${isValid}`
    )
    return isValid
  }

  // 计算与目标的距离（米）
  const getDistanceToTarget = computed(() => {
    if (!targetLocation.value) return 0

    const R = 6371000 // 地球半径（米）
    const lat1 = (userLocation.value.latitude * Math.PI) / 180
    const lat2 = (targetLocation.value.latitude * Math.PI) / 180
    const deltaLat =
      ((targetLocation.value.latitude - userLocation.value.latitude) *
        Math.PI) /
      180
    const deltaLon =
      ((targetLocation.value.longitude - userLocation.value.longitude) *
        Math.PI) /
      180

    const a =
      Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
      Math.cos(lat1) *
        Math.cos(lat2) *
        Math.sin(deltaLon / 2) *
        Math.sin(deltaLon / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

    return Math.round(R * c) // 返回米数
  })

  return {
    // State
    currentCity,
    currentUser,
    inventory,
    missionStatus,
    userLocation,
    targetLocation,
    storyStage,
    unlockedPoiIds,
    completedPoiIds,
    currentScript,
    isDialogueVisible,

    // [NEW] Interactive Narrative State
    playerStats,
    storyHistory,

    // Getters
    currentCityData,
    currentCityPOIs,
    currentCityCharacters,
    visibleMarkers,
    unlockedPOIs,
    collectedSeals,
    sealProgress,
    canCombineFourSeals,
    canGetFinalSeal,
    getDistanceToTarget,

    // Actions
    initGame,
    switchCity,
    unlockPOI,
    addSeal,
    unlockSeal, // 新增
    addClue,
    completeTask,
    updateObjective,
    completeMission, // 新增：任务完成逻辑
    unlockNextPOI, // 新增：解锁下一个POI
    updateUnlockedPOIs, // 新增：更新已解锁POI列表
    checkAndUnlockNextPOI,
    saveProgress, // 新增
    loadProgress, // 新增
    resetGame,
    getMapMarkers,
    getPOIById,
    getSealById,
    getClueById,
    getItemById,
    updateUserLocation,
    setTargetLocation,
    clearTargetLocation,
    startStory,
    unlockLocation,
    handleDialogueEnd,

    // [NEW] Interactive Narrative Actions
    updateStat,
    recordChoice,
    checkCondition,
    resetStoryState,
    checkEnding,
    checkMissionStatus,

    // NPC进度管理
    saveNPCProgress,
    getNPCProgress,

    // AVG侦探解谜核心逻辑
    inspectItem,
    validatePresentation,

    // 物品管理
    addItem,
  }
})
