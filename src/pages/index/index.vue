<template>
  <view class="home-page">
    <!-- 启动页 -->
    <view v-if="showStartScreen" class="start-screen">
      <image
        :src="imgHost + 'background/background_start.webp'"
        class="start-bg"
        mode="aspectFill"
      />
      <view class="start-btn-hotspot" @tap="handleStartJourney"></view>
    </view>

    <CustomNavbar
      v-if="!showStartScreen"
      ref="navbarRef"
      title="潮起东方"
      bgColor="#00897B"
      textColor="#FFFFFF"
      :showBack="false"
    />

    <map
      id="gameMap"
      class="game-map"
      :latitude="mapCenter.latitude"
      :longitude="mapCenter.longitude"
      :markers="mapMarkers"
      :polyline="mapPolylines"
      :scale="16"
      :enable-3D="false"
      :show-compass="false"
      :enable-overlooking="false"
      :enable-zoom="true"
      :enable-scroll="true"
      @markertap="onMarkerTap"
      @tap="onMapTap"
      v-if="!showStartScreen && missionStatus.gameStarted"
    />

    <view class="map-controls">
      <view class="map-btn compass-btn" @tap="goToCompass">
        <text class="map-icon">🧭</text>
      </view>
      <view class="map-btn inventory-btn" @tap="openInventory">
        <text class="map-icon">🎒</text>
      </view>
      <view class="map-btn test-btn" @tap="goToTest">
        <text class="map-icon">🎭</text>
      </view>
    </view>

    <view class="city-fab" @tap="showCitySelector">
      <text class="city-icon">📍</text>
      <text class="city-name">{{
        currentCityData?.cityName || '加载中...'
      }}</text>
      <text class="city-arrow">▼</text>
    </view>

    <view class="top-hud">
      <view v-if="currentUser" class="character-card">
        <image
          class="character-avatar"
          :src="currentUser?.avatar || imgHost + 'avatar-placeholder.webp'"
          mode="aspectFill"
        />
        <view class="character-info">
          <text class="character-name">{{
            currentUser?.name || '未知角色'
          }}</text>
          <text class="character-level">Lv.{{ currentUser?.level || 1 }}</text>
        </view>
      </view>
    </view>

    <view
      v-if="showCityModal"
      class="city-modal-overlay"
      @tap="hideCitySelector"
    >
      <view class="city-modal" @tap.stop>
        <view class="city-list">
          <view
            v-for="city in cities"
            :key="city?.cityId"
            class="city-item"
            @tap="selectCity(city?.cityId)"
          >
            <text>{{ city?.cityName }}</text>
          </view>
        </view>
      </view>
    </view>

    <view
      v-if="!showStartScreen && !missionStatus.gameStarted"
      class="character-select-modal"
    >
      <view class="character-carousel">
        <swiper
          :indicator-dots="true"
          :autoplay="false"
          @change="onCharacterChange"
        >
          <swiper-item
            v-for="(character, index) in directCharacters"
            :key="character?.id || index"
          >
            <view class="carousel-item-wrapper">
              <view class="card-container">
                <image
                  :src="
                    character?.avatar || imgHost + 'avatar-placeholder.webp'
                  "
                  mode="aspectFit"
                  class="card-avatar"
                />

                <view class="card-header">
                  <text class="card-name">{{
                    character?.name || '未知角色'
                  }}</text>
                </view>

                <view class="card-identity">
                  <text class="identity-main">{{
                    character?.surfaceIdentity || ''
                  }}</text>
                  <text class="identity-sub">{{
                    character?.tags?.join(' · ') || ''
                  }}</text>
                </view>

                <scroll-view scroll-y="true" class="card-story-scroll">
                  <text class="story-text">{{
                    character?.story || '暂无背景故事'
                  }}</text>
                </scroll-view>
              </view>
            </view>
          </swiper-item>
        </swiper>
      </view>

      <view class="character-actions">
        <button
          class="start-btn"
          @tap="startGame"
          :disabled="directCharacters.length === 0"
        >
          开启旅程
        </button>
      </view>
    </view>

    <InventoryModal
      v-model:visible="showInventoryModal"
      @close="showInventoryModal = false"
      @inspect="handleItemInspect"
    />

    <!-- 剧情对话组件 -->
    <StoryDialogue
      v-model:visible="gameStore.isDialogueVisible"
      :script="gameStore.currentScript"
      @dialogue-end="gameStore.handleDialogueEnd"
    />

    <!-- 开发环境位置控制器 -->
    <LocationController />
  </view>
</template>

<script setup lang="ts">
import { computed, ref, watch, nextTick, getCurrentInstance } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { useGameStore } from '../../stores/useGameStore'
import { gameData } from '../../mock/gameData'
import type { ScriptNode } from '../../mock/types'
import { IMG_HOST } from '@/config/constants'
import CustomNavbar from '@/components/CustomNavbar.vue'
import InventoryModal from '@/components/InventoryModal.vue'
import StoryDialogue from '@/components/StoryDialogue.vue'
import LocationController from '@/components/LocationController.vue'

const gameStore = useGameStore()

// 获取当前实例以访问全局属性
const instance = getCurrentInstance()
const proxy = instance?.proxy as any

// 计算$imgHost的响应式引用
const imgHost = computed(() => proxy?.$imgHost || IMG_HOST)

const showStartScreen = ref(true) // 启动页显示状态，默认为true
const showCityModal = ref(false)
const selectedCharacterIndex = ref(0)
const showInventoryModal = ref(false)
const navbarRef = ref(null)

// 页面加载时读取存档
onLoad(() => {
  console.log('🏠 首页加载，尝试读取存档...')
  gameStore.loadProgress()
})

const getSafeSelectedIndex = () => {
  const characters = directCharacters.value || []
  const maxIndex = Math.max(0, characters.length - 1)
  return Math.min(Math.max(selectedCharacterIndex.value || 0, 0), maxIndex)
}

const {
  currentCity,
  currentUser,
  missionStatus,
  currentCityData,
  getMapMarkers,
} = gameStore

const cities = computed(() => {
  return [gameStore.currentCityData, gameData.chaozhou, gameData.shantou]
})

const directCharacters = computed(() => {
  const city = gameStore.currentCity || 'jieyang'
  return (
    gameData[city as keyof typeof gameData]?.characters ||
    gameData.jieyang.characters ||
    []
  )
})

const mapCenter = computed(() => {
  return gameStore.userLocation || { latitude: 23.536, longitude: 116.356 }
})

const mapMarkers = computed(() => {
  // 获取基于剧情解锁的POI标记（已经包含正确的ID映射）
  const unlockedMarkers = gameStore.visibleMarkers

  // 添加玩家位置标记 - 使用本地静态资源路径
  const playerMarker = {
    id: 999, // 数字ID，确保在所有其他标记之上
    latitude: gameStore.userLocation.latitude,
    longitude: gameStore.userLocation.longitude,
    iconPath: '/static/markers/my-location.png', // 玩家位置专用图标（蓝色）
    width: 45, // 稍微增大以与任务点区分
    height: 45,
    anchor: { x: 0.5, y: 0.5 },
    zIndex: 999, // 确保在所有标记之上
    // 添加简单的标识气泡
    callout: {
      content: '我的位置', // 清晰标识这是玩家位置
      color: '#FFFFFF', // 白色文字
      fontSize: 11, // 稍小的字体
      borderRadius: 4,
      bgColor: '#2196F3', // 蓝色背景，与玩家标记颜色一致
      padding: 4,
      display: 'ALWAYS',
    },
  }

  // 添加调试日志
  console.log(
    'POI标记（含ID映射）:',
    unlockedMarkers.map((m) => ({
      id: m.id,
      poiId: m.poiId,
      name: m.callout?.content,
    }))
  )
  console.log('玩家位置标记:', playerMarker)
  console.log('用户位置:', gameStore.userLocation)

  // 合并标记数组，玩家位置标记放在最后以确保显示在最上层
  return [...unlockedMarkers, playerMarker]
})

const mapPolylines = computed(() => {
  if (!gameStore.userLocation || !gameStore.targetLocation) return []
  return [
    {
      points: [
        {
          latitude: gameStore.userLocation.latitude,
          longitude: gameStore.userLocation.longitude,
        },
        {
          latitude: gameStore.targetLocation.latitude,
          longitude: gameStore.targetLocation.longitude,
        },
      ],
      color: '#00897B',
      width: 4,
      borderWidth: 2,
      borderColor: '#FFFFFF',
      dottedLine: true,
      arrowLine: true,
    },
  ]
})

// 处理对话结束
// const handleDialogueEnd = () => {
// 	console.log('AR对话结束')
// 	gameStore.isDialogueVisible = false // 关灯

// 	// 如果是拿到了印章的结束，应该触发任务完成
// 	if (currentNPC.value && currentNPC.value.sealId) {
// 		const hasSeal = gameStore.inventory.seals.includes(currentNPC.value.sealId)
// 		if (hasSeal) {
// 			// 任务完成了，可以退出了
// 			uni.showToast({ title: '探索完成', icon: 'success' })
// 			setTimeout(() => uni.navigateBack(), 1500)
// 			return
// 		}
// 	}

// 	// 如果是没拿印章的中途退出（比如稍后再来），也退
// 	uni.navigateBack()
// }

const onMarkerTap = (e: any) => {
  const markerId = e.detail.markerId
  console.log('点击标记ID:', markerId, '类型:', typeof markerId)

  // 跳过玩家位置标记（ID: 999）
  if (markerId === 999) {
    console.log('点击了玩家位置标记，忽略')
    return
  }

  // 获取当前解锁的POI标记
  const unlockedMarkers = gameStore.visibleMarkers
  console.log(
    '当前解锁的标记:',
    unlockedMarkers.map((m) => ({ id: m.id, poiId: m.poiId }))
  )

  // 在标记数组中查找匹配的标记（通过数字ID）
  const clickedMarker = unlockedMarkers.find((marker) => marker.id === markerId)

  if (!clickedMarker) {
    console.error('未找到匹配的地图标记:', markerId)
    console.error(
      '可用标记ID:',
      unlockedMarkers.map((m) => m.id)
    )

    uni.showToast({
      title: '错误：未找到对应的POI标记',
      icon: 'error',
      duration: 2000,
    })
    return
  }

  // 使用marker中的poiId查找POI数据
  const poiId = clickedMarker.poiId
  console.log('找到对应的poiId:', poiId)

  if (!poiId) {
    console.error('标记缺少poiId属性:', clickedMarker)
    uni.showToast({
      title: '错误：标记数据不完整',
      icon: 'error',
      duration: 2000,
    })
    return
  }

  const targetPoi = gameStore.getPOIById(poiId)

  if (!targetPoi) {
    console.error('使用poiId未找到POI数据:', poiId)
    console.error(
      '可用的POI ID列表:',
      unlockedMarkers.map((m) => m.poiId)
    )

    uni.showToast({
      title: `错误：未找到POI数据 ${poiId}`,
      icon: 'error',
      duration: 2000,
    })
    return
  }

  console.log(
    '点击POI:',
    targetPoi.name,
    'ID:',
    targetPoi.id,
    '类型:',
    typeof targetPoi.id
  )

  // 计算距离
  const distance = calculateDistance(
    gameStore.userLocation.latitude,
    gameStore.userLocation.longitude,
    targetPoi.latitude,
    targetPoi.longitude
  )

  console.log('距离POI:', distance, '米')

  // 开发环境调试特权：允许直接进入
  const isDevEnvironment = uni.getSystemInfoSync().platform === 'devtools'

  if (isDevEnvironment) {
    console.log('开发环境：直接进入AR模式')
    enterARMode(targetPoi)
    return
  }

  // 生产环境：距离校验（100米范围内）
  if (distance <= 100) {
    console.log('距离达标，进入AR模式')
    enterARMode(targetPoi)
  } else {
    console.log('距离过远，无法进入')
    uni.showToast({
      title: `太远了，请走近一点（当前距离：${distance}米）`,
      icon: 'none',
      duration: 3000,
    })
  }
}

const onMapTap = () => {}

// 计算两点之间的距离（米）
const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371000 // 地球半径（米）
  const lat1Rad = (lat1 * Math.PI) / 180
  const lat2Rad = (lat2 * Math.PI) / 180
  const deltaLatRad = ((lat2 - lat1) * Math.PI) / 180
  const deltaLonRad = ((lon2 - lon1) * Math.PI) / 180

  const a =
    Math.sin(deltaLatRad / 2) * Math.sin(deltaLatRad / 2) +
    Math.cos(lat1Rad) *
      Math.cos(lat2Rad) *
      Math.sin(deltaLonRad / 2) *
      Math.sin(deltaLonRad / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

  return Math.round(R * c) // 返回米数（四舍五入）
}

// 进入AR模式
const enterARMode = (poi: any) => {
  console.log('准备进入AR模式，POI:', poi.name)

  // 🔥 核心修复：直接从 POI 数据中获取 npcId，不再使用 switch 硬编码！
  // 这样能确保与 pois.ts / gameData.ts 中的定义完全一致
  const npcId = poi.npcId || 'lin_wenyuan' // 如果没配，才用林文渊兜底

  // 构建路由参数
  const url = `/pages/ar/index?npcId=${npcId}&poiId=${poi.id}`

  console.log('跳转到AR页面:', url)

  // 显示进入提示
  uni.showToast({
    title: `正在进入${poi.name}`,
    icon: 'loading',
    duration: 1000,
  })

  // 延迟跳转，让用户看到提示
  setTimeout(() => {
    uni.navigateTo({
      url: url,
      success: () => {
        console.log('成功跳转到AR页面')
      },
      fail: (err) => {
        console.error('跳转到AR页面失败:', err)
        uni.showToast({
          title: '进入AR页面失败',
          icon: 'none',
        })
      },
    })
  }, 1000)
}
const checkArrival = () => {
  if (gameStore.targetLocation && gameStore.getDistanceToTarget < 50) {
    uni.showModal({
      title: '🎯 已到达目的地！',
      content: `成功到达${gameStore.targetLocation.name}`,
      showCancel: false,
      confirmText: '确认',
      success: () => {
        gameStore.targetLocation = null
      },
    })
  }
}

const showCitySelector = () => {
  showCityModal.value = true
}
const hideCitySelector = () => {
  showCityModal.value = false
}
const selectCity = (cityId: string) => {
  if (gameStore.switchCity(cityId)) {
    uni.showToast({ title: '已切换', icon: 'success' })
  } else {
    uni.showToast({ title: '未解锁', icon: 'none' })
  }
  hideCitySelector()
}
const openInventory = () => {
  showInventoryModal.value = true
}
const goToCompass = () => {
  uni.navigateTo({ url: '/pages/compass/index' })
}
const goToTest = () => {
  uni.navigateTo({ url: '/pages/test/test' })
}

// 处理物品调查
const handleItemInspect = (itemId: string) => {
  console.log('[地图页] 玩家调查物品:', itemId)

  // 关闭背包弹窗
  showInventoryModal.value = false

  // 调用 Store 的 inspectItem 方法
  const result = gameStore.inspectItem(itemId)

  if (result.success) {
    // 构造内心独白脚本
    let inspectText = result.inspectText

    // ✅ [兜底逻辑] 如果 Store 返回的文本为空，根据 itemId 提供默认文本
    if (!inspectText) {
      switch (itemId) {
        case 'item_seal_one':
          inspectText =
            '印章侧面有一道细微的裂痕，似乎是某种机关。这个发现很重要！'
          break
        case 'item_seal_three_fake':
          inspectText =
            '这印章做工过于光滑，没有任何岁月痕迹，像是个赝品。蔡福生在欺骗我！'
          break
        case 'item_seal_two':
          inspectText = '青狮印章的纹路十分精美，蕴含着浓厚的潮汕文化底蕴。'
          break
        default:
          inspectText = '仔细查看这件物品，似乎隐藏着某种秘密...'
      }
    }

    const inspectNode: ScriptNode = {
      id: 'inspect_' + itemId,
      type: 'normal',
      speaker: '陈灵儿',
      avatar: IMG_HOST + 'avatars/chen_linger.webp',
      content: inspectText,
    }

    console.log('播放调查独白:', inspectNode.content)

    // 重置脚本数组，确保组件能监听到变化
    gameStore.currentScript = []

    // 使用 nextTick 确保在下一个 DOM 更新周期执行
    nextTick(() => {
      // 播放调查结果作为内心独白
      gameStore.currentScript = [inspectNode]
      gameStore.isDialogueVisible = true
    })
  } else {
    // 物品不可调查
    uni.showToast({
      title: '这件物品似乎没什么特别的',
      icon: 'none',
      duration: 2000,
    })
  }
}
const onCharacterChange = (e: any) => {
  const newIndex = e.detail?.current
  if (typeof newIndex === 'number') selectedCharacterIndex.value = newIndex
}
// 处理启动页点击
const handleStartJourney = () => {
  // 🔥 核心修复：优先信任 missionStatus.gameStarted 状态
  // 1. 尝试读档
  const loadSuccess = gameStore.loadProgress()

  console.log('🎮 启动游戏，存档状态:', {
    loadSuccess,
    gameStarted: gameStore.missionStatus.gameStarted,
    storyStage: gameStore.storyStage,
    hasUser: !!gameStore.currentUser,
    currentUser: gameStore.currentUser?.name,
  })

  // 2. 判断：读档成功 且 游戏确实已开始
  if (loadSuccess && gameStore.missionStatus.gameStarted) {
    // 老玩家归来，直接进入游戏界面
    console.log('✅ 老玩家归来，直接进入地图')
    showStartScreen.value = false // 隐藏启动页
    showCityModal.value = false // 确保不弹窗
    // missionStatus.gameStarted = true 会自动隐藏人物选择框
  } else {
    // 新游戏，前往选人
    console.log('🎬 新游戏，前往选人')

    // 不要在这里调用 initGame，等用户在模态框里选完人点击"开始"后再 init
    showStartScreen.value = false // 隐藏启动页
    // 注意：这里不需要设置 showCityModal.value = true，因为我们用的是人物选择模态框
    // missionStatus.gameStarted = false 会自动显示人物选择框
  }
}

const startGame = () => {
  const characters = directCharacters.value || []
  if (!characters || characters.length === 0) return

  const char = characters[getSafeSelectedIndex()]

  if (char && char.name) {
    // 🚨 重要：这里的逻辑已经简化，因为老玩家的判断已经在 handleStartJourney 中完成了
    // 能执行到这里的，都是新玩家或者需要重新开始的玩家

    console.log('🆕 开始新游戏，角色:', char.name)

    // 初始化游戏 (会设置当前角色和 gameStarted = true)
    gameStore.initGame(char)

    // 显示新旅程提示
    uni.showToast({
      title: `开启新旅程: ${char.name}`,
      icon: 'none',
      duration: 1500,
    })

    // 延迟显示开场剧情，确保UI已经渲染完成
    setTimeout(() => {
      // 再次检查，防止在异步过程中状态发生变化
      if (gameStore.storyStage <= 1) {
        gameStore.startStory(char.id)
      }
    }, 1500)
  }
}

watch(
  () => gameStore.getDistanceToTarget,
  (newDistance, oldDistance) => {
    if (newDistance < 50 && (oldDistance === undefined || oldDistance >= 50))
      checkArrival()
  },
  { immediate: true }
)
</script>

<style lang="scss" scoped>
.home-page {
  position: relative;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  padding-bottom: 100rpx;
  box-sizing: border-box;
}

.game-map {
  width: 100%;
  height: 100%;
}

.city-fab {
  position: absolute;
  left: 30rpx;
  top: calc(var(--status-bar-height) + 44px + 80rpx);
  z-index: 90;
  background: rgba(255, 255, 255, 0.95);
  border: 1rpx solid #e0d3b8;
  border-radius: 32rpx;
  padding: 16rpx 24rpx;
  display: flex;
  align-items: center;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(10rpx);

  .city-icon {
    font-size: 28rpx;
    margin-right: 8rpx;
    color: #333;
  }

  .city-name {
    font-size: 28rpx;
    color: #333;
    font-weight: 500;
    margin-right: 8rpx;
  }

  .city-arrow {
    font-size: 20rpx;
    color: #666;
    opacity: 0.7;
  }
}

.top-hud {
  position: absolute;
  top: calc(var(--status-bar-height) + 44px);
  right: 0;
  display: flex;
  justify-content: flex-end;
  padding: 30rpx;
  pointer-events: none;
  z-index: 10;

  .character-card {
    pointer-events: auto;
    background: rgba(255, 255, 255, 0.9);
    padding: 10rpx 20rpx;
    border-radius: 30rpx;
    display: flex;
    align-items: center;
  }
}

.map-controls {
  position: absolute;
  right: 40rpx;
  top: calc(var(--status-bar-height) + 44px + 80rpx);
  z-index: 90;
  display: flex;
  flex-direction: column;
  gap: 20rpx;
  pointer-events: none;

  .map-btn {
    pointer-events: auto;
    width: 100rpx;
    height: 100rpx;
    background: linear-gradient(
      135deg,
      rgba(0, 137, 123, 0.9) 0%,
      rgba(0, 105, 92, 0.9) 100%
    );
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 8rpx 20rpx rgba(0, 137, 123, 0.3);
    border: 3rpx solid rgba(255, 255, 255, 0.2);

    &.compass-btn {
      background: linear-gradient(135deg, #9c27b0 0%, #7b1fa2 100%);
    }

    &.inventory-btn {
      background: linear-gradient(135deg, #ff9800 0%, #e65100 100%);
    }

    .map-icon {
      font-size: 40rpx;
      color: #ffffff;
      text-shadow: 0 2rpx 4rpx rgba(0, 0, 0, 0.2);
    }
  }
}

/* Character Modal Styles */
.character-select-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  z-index: 100;
  display: flex;
  flex-direction: column;
  height: 100vh;

  .character-carousel {
    flex: 1;
    padding-top: calc(var(--status-bar-height) + 44px);
    height: 0;

    swiper {
      height: 100%;
      width: 100%;
    }

    .carousel-item-wrapper {
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .card-container {
      width: 85%;
      height: 85%;
      max-height: 1100rpx;
      background: rgba(255, 255, 255, 0.95);
      border-radius: 30rpx;
      padding: 40rpx;
      box-shadow: 0 10rpx 30rpx rgba(0, 0, 0, 0.2);
      display: flex;
      flex-direction: column;
      box-sizing: border-box;

      .card-avatar {
        width: 160rpx;
        height: 160rpx;
        margin: 0 auto 30rpx auto;
        border-radius: 20rpx;
        border: 4rpx solid #e74c3c;
        flex-shrink: 0;
      }

      .card-header {
        text-align: center;
        margin-bottom: 20rpx;
        flex-shrink: 0;

        .card-name {
          font-size: 40rpx;
          font-weight: bold;
          color: #333;
        }
      }

      .card-identity {
        background: #fff5f5;
        padding: 20rpx;
        border-radius: 16rpx;
        margin-bottom: 30rpx;
        text-align: center;
        flex-shrink: 0;

        .identity-main {
          font-size: 28rpx;
          color: #e74c3c;
          font-weight: bold;
          display: block;
        }

        .identity-sub {
          font-size: 24rpx;
          color: #e74c3c;
          opacity: 0.8;
          margin-top: 8rpx;
          display: block;
        }
      }

      .card-story-scroll {
        flex: 1;
        overflow: hidden;

        .story-text {
          font-size: 28rpx;
          color: #555;
          line-height: 1.8;
          text-align: justify;
          white-space: pre-wrap;
        }
      }
    }
  }

  .character-actions {
    flex-shrink: 0;
    padding: 40rpx;
    padding-bottom: calc(40rpx + env(safe-area-inset-bottom));

    .start-btn {
      width: 100%;
      height: 90rpx;
      background: #e74c3c;
      color: #fff;
      border-radius: 45rpx;
      font-size: 32rpx;
      font-weight: bold;
    }
  }
}

/* Modal Overlay */
.city-modal-overlay {
  position: fixed;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 200;
  display: flex;
  align-items: center;
  justify-content: center;

  .city-modal {
    background: #fff;
    width: 500rpx;
    border-radius: 20rpx;
    padding: 20rpx;

    .city-item {
      padding: 30rpx;
      border-bottom: 1px solid #eee;
      text-align: center;
    }
  }
}

/* 启动页样式 */
.start-screen {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 9999;
  background-color: #f4e4cc; /* 配合图片的复古底色 */
}

.start-bg {
  width: 100%;
  height: 100%;
  display: block;
}

/* 点击热区：覆盖在图片原本的按钮位置上 */
.start-btn-hotspot {
  position: absolute;
  /* 📉 下调至 4%：根据截图反馈，原位置太高，需大幅下移 */
  bottom: 4%;
  left: 50%;
  transform: translateX(-50%);
  /* 📐 增大至 340rpx：确保覆盖放大镜主体及手柄 */
  width: 340rpx;
  height: 340rpx;
  border-radius: 50%;

  /* 🔴 调试中：保留红色背景以便确认，对齐后改为 transparent */
  background: rgba(255, 0, 0, 0.3);
  z-index: 10000;

  &:active {
    background: rgba(255, 0, 0, 0.5);
  }
}
</style>
