import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { gameData, type Character, type POI, type Seal, type Clue, type Item } from '../mock/gameData'

export const useGameStore = defineStore('game', () => {
  // ============ State ============
  const currentCity = ref('jieyang')
  const currentUser = ref<Character | null>(null)
  const inventory = ref<{
    seals: string[]  // 印章ID列表
    clues: string[]  // 线索ID列表
    items: string[]  // 其他物品ID列表
  }>({
    seals: [],
    clues: [],
    items: []
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
    gameCompleted: false
  })

  // 位置状态
  const userLocation = ref<{
    latitude: number
    longitude: number
  }>({
    latitude: 23.5360,  // 揭阳古城中心
    longitude: 116.3560
  })

  const targetLocation = ref<{
    latitude: number
    longitude: number
    name: string
  } | null>(null)

  // ============ Getters ============

  // 获取当前城市数据
  const currentCityData = computed(() => {
    return gameData[currentCity.value as keyof typeof gameData] || gameData.jieyang
  })

  // 获取当前城市的POI列表
  const currentCityPOIs = computed(() => {
    return currentCityData.value?.pois || []
  })

  // 获取当前城市的角色列表
  const currentCityCharacters = computed(() => {
    return currentCityData.value?.characters || []
  })

  // 获取已解锁的POI
  const unlockedPOIs = computed(() => {
    return currentCityPOIs.value.filter(poi =>
      missionStatus.value.unlockedPOIs.includes(poi.id)
    )
  })

  // 获取已收集的印章
  const collectedSeals = computed(() => {
    const seals = inventory.value.seals || []
    const allSeals = [...(currentCityData.value?.seals || [])]
    return seals.map(sealId => {
      return allSeals.find(seal => seal.id === sealId)
    }).filter(Boolean)
  })

  // 获取印章收集进度
  const sealProgress = computed(() => {
    const totalSeals = currentCityData.value?.seals?.length || 0
    const collected = inventory.value.seals?.length || 0
    return {
      current: collected,
      total: totalSeals,
      percentage: totalSeals > 0 ? Math.round((collected / totalSeals) * 100) : 0
    }
  })

  // 检查是否可以拼合四章图案
  const canCombineFourSeals = computed(() => {
    const seals = inventory.value.seals || []
    const mainSeals = seals.filter(sealId =>
      !sealId.includes('laoye_baohao')
    )
    return mainSeals.length >= 4
  })

  // 检查是否可以获得老爷保号章
  const canGetFinalSeal = computed(() => {
    const seals = inventory.value.seals || []
    return canCombineFourSeals.value &&
           !seals.includes('laoye_baohao_seal')
  })

  // ============ Actions ============

  // 初始化游戏
  const initGame = (selectedCharacter: Character) => {
    currentUser.value = selectedCharacter
    missionStatus.value.gameStarted = true
    missionStatus.value.currentObjective = `前往揭阳学宫寻找林文渊`

    // 解锁第一个POI（揭阳学宫）
    unlockPOI('jieyang_confucian_temple')

    // 添加测试数据到背包
    addTestInventory()

    console.log('游戏初始化完成:', {
      character: selectedCharacter.name,
      city: currentCity.value
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
    missionStatus.value.currentObjective = `选择角色，开始${cityData?.cityName || '未知城市'}的旅程`

    console.log('切换城市成功:', {
      from: currentCity.value,
      to: cityId,
      cityName: cityData.cityName
    })

    return true
  }

  // 解锁POI
  const unlockPOI = (poiId: string) => {
    if (!missionStatus.value.unlockedPOIs.includes(poiId)) {
      missionStatus.value.unlockedPOIs.push(poiId)
      console.log('解锁POI:', poiId)

      // 更新当前目标
      const poi = currentCityPOIs.value.find(p => p.id === poiId)
      if (poi) {
        missionStatus.value.currentObjective = `前往${poi.name}完成任务`
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

      // 检查是否需要解锁新的POI
      checkAndUnlockNextPOI()

      // 检查是否可以获得老爷保号章
      checkFinalSealAvailability()
    }
  }

  // 解锁印章 (新增的专用方法)
  const unlockSeal = (sealId: string) => {
    addSeal(sealId)
    uni.showToast({
      title: '获得新印章！',
      icon: 'success'
    })
  }

  // 检查是否可以获得最终印章
  const checkFinalSealAvailability = () => {
    if (canGetFinalSeal.value && !inventory.value.seals.includes('laoye_baohao_seal')) {
      // 可以获得老爷保号章
      setTimeout(() => {
        uni.showModal({
          title: '拼图完成！',
          content: '恭喜！您已收集到四枚主印章，可以激活老爷保号章了！',
          showCancel: false,
          confirmText: '获得老爷保号章',
          success: () => {
            unlockSeal('laoye_baohao_seal')
          }
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

  // 检查并解锁下一个POI
  const checkAndUnlockNextPOI = () => {
    const allPOIs = currentCityPOIs.value
    const unlockedPOIs = missionStatus.value.unlockedPOIs
    const collectedSealsCount = inventory.value.seals.length

    // 根据印章数量解锁新的POI
    if (collectedSealsCount >= 1 && !unlockedPOIs.includes('kungfu_tea_house')) {
      unlockPOI('kungfu_tea_house')
    }
    if (collectedSealsCount >= 2 && !unlockedPOIs.includes('lion_culture_area')) {
      unlockPOI('lion_culture_area')
    }
    if (collectedSealsCount >= 3 && !unlockedPOIs.includes('qiaopi_museum')) {
      unlockPOI('qiaopi_museum')
    }
    if (collectedSealsCount >= 4 && !unlockedPOIs.includes('jinxian_gate')) {
      unlockPOI('jinxian_gate')
    }
  }

  // 保存游戏进度
  const saveProgress = () => {
    try {
      const gameData = {
        currentCity: currentCity.value,
        currentUser: currentUser.value,
        inventory: inventory.value,
        missionStatus: missionStatus.value
      }
      uni.setStorageSync('chaoshan_odyssey_progress', gameData)
      console.log('游戏进度已保存')
    } catch (error) {
      console.error('保存进度失败:', error)
    }
  }

  // 加载游戏进度
  const loadProgress = () => {
    try {
      const savedData = uni.getStorageSync('chaoshan_odyssey_progress')
      if (savedData) {
        currentCity.value = savedData.currentCity || 'jieyang'
        currentUser.value = savedData.currentUser || null
        inventory.value = savedData.inventory || {
          seals: [],
          clues: [],
          items: []
        }
        missionStatus.value = savedData.missionStatus || {
          currentPhase: 'ice_breaking',
          completedTasks: [],
          unlockedPOIs: [],
          currentObjective: '选择角色，开始游戏',
          gameStarted: false,
          gameCompleted: false
        }
        console.log('游戏进度已加载')
      }
    } catch (error) {
      console.error('加载进度失败:', error)
    }
  }

  // 重置游戏
  const resetGame = () => {
    currentUser.value = null
    inventory.value = {
      seals: [],
      clues: [],
      items: []
    }
    missionStatus.value = {
      currentPhase: 'ice_breaking',
      completedTasks: [],
      unlockedPOIs: [],
      currentObjective: '选择角色，开始游戏',
      gameStarted: false,
      gameCompleted: false
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
    return currentCityPOIs.value.map(poi => {
      const isUnlocked = missionStatus.value.unlockedPOIs.includes(poi.id)
      const isCurrentObjective = missionStatus.value.currentObjective?.includes(poi.name)

      return {
        id: poi.id,
        latitude: poi.latitude,
        longitude: poi.longitude,
        iconPath: isCurrentObjective
          ? '/static/map-marker-active.png'  // 红色高亮
          : isUnlocked
            ? '/static/map-marker-unlocked.png'  // 蓝色已解锁
            : '/static/map-marker-locked.png',   // 灰色未解锁
        width: 30,
        height: 30,
        callout: {
          content: poi.name,
          display: 'ALWAYS',
          textAlign: 'center',
          fontSize: 12,
          borderRadius: 4,
          bgColor: isCurrentObjective ? '#ffebee' : '#f5f5f5',
          padding: 4
        }
      }
    })
  }

  // 获取POI详情
  const getPOIById = (poiId: string): POI | undefined => {
    return currentCityPOIs.value.find(poi => poi.id === poiId)
  }

  // 获取印章详情
  const getSealById = (sealId: string): Seal | undefined => {
    const allSeals = [...currentCityData.value.seals]
    return allSeals.find(seal => seal.id === sealId)
  }

  // 获取线索详情
  const getClueById = (clueId: string): Clue | undefined => {
    const allClues = [...currentCityData.value.clues]
    return allClues.find(clue => clue.id === clueId)
  }

  // 获取道具详情
  const getItemById = (itemId: string): Item | undefined => {
    // 这里可以根据实际需求扩展道具数据结构
    const allItems = [...(currentCityData.value.items || [])]
    return allItems.find(item => item.id === itemId)
  }

  // 更新用户位置
  const updateUserLocation = (latitude: number, longitude: number) => {
    userLocation.value = { latitude, longitude }
    console.log('用户位置更新:', { latitude, longitude })
  }

  // 设置目标位置
  const setTargetLocation = (latitude: number, longitude: number, name: string) => {
    targetLocation.value = { latitude, longitude, name }
    console.log('目标位置设置:', { latitude, longitude, name })
  }

  // 计算与目标的距离（米）
  const getDistanceToTarget = computed(() => {
    if (!targetLocation.value) return 0

    const R = 6371000 // 地球半径（米）
    const lat1 = userLocation.value.latitude * Math.PI / 180
    const lat2 = targetLocation.value.latitude * Math.PI / 180
    const deltaLat = (targetLocation.value.latitude - userLocation.value.latitude) * Math.PI / 180
    const deltaLon = (targetLocation.value.longitude - userLocation.value.longitude) * Math.PI / 180

    const a = Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
              Math.cos(lat1) * Math.cos(lat2) *
              Math.sin(deltaLon / 2) * Math.sin(deltaLon / 2)
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

    // Getters
    currentCityData,
    currentCityPOIs,
    currentCityCharacters,
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
    setTargetLocation
  }
})