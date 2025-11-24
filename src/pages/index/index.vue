<template>
  <view class="home-page">
    <CustomNavbar ref="navbarRef" title="潮起东方" bgColor="#00897B" textColor="#FFFFFF" :showBack="false" />

    <map id="gameMap" class="game-map"
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
      @tap="onMapTap" />

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
      <text class="city-name">{{ currentCityData?.cityName || '加载中...' }}</text>
      <text class="city-arrow">▼</text>
    </view>

    <view class="top-hud">
      <view v-if="currentUser" class="character-card">
        <image class="character-avatar" :src="currentUser?.avatar || '/static/avatar-placeholder.png'"
          mode="aspectFill" />
        <view class="character-info">
          <text class="character-name">{{ currentUser?.name || '未知角色' }}</text>
          <text class="character-level">Lv.{{ currentUser?.level || 1 }}</text>
        </view>
      </view>
    </view>

    <view v-if="showCityModal" class="city-modal-overlay" @tap="hideCitySelector">
      <view class="city-modal" @tap.stop>
        <view class="city-list">
          <view v-for="city in cities" :key="city?.cityId" class="city-item" @tap="selectCity(city?.cityId)">
            <text>{{ city?.cityName }}</text>
          </view>
        </view>
      </view>
    </view>

    <view v-if="!missionStatus.gameStarted" class="character-select-modal">
      <view class="character-carousel">
        <swiper :indicator-dots="true" :autoplay="false" @change="onCharacterChange">
          <swiper-item v-for="(character, index) in directCharacters" :key="character?.id || index">
            <view class="carousel-item-wrapper">
              <view class="card-container">
                
                <image :src="character?.avatar || '/static/avatar-placeholder.png'" mode="aspectFit" class="card-avatar" />

                <view class="card-header">
                  <text class="card-name">{{ character?.name || '未知角色' }}</text>
                </view>

                <view class="card-identity">
                  <text class="identity-main">{{ character?.surfaceIdentity || '' }}</text>
                  <text class="identity-sub">{{ character?.tags?.join(' · ') || '' }}</text>
                </view>

                <scroll-view scroll-y="true" class="card-story-scroll">
                  <text class="story-text">{{ character?.story || '暂无背景故事' }}</text>
                </scroll-view>

              </view>
            </view>
          </swiper-item>
        </swiper>
      </view>

      <view class="character-actions">
        <button class="start-btn" @tap="startGame" :disabled="directCharacters.length === 0">
          开启旅程
        </button>
      </view>
    </view>

    <InventoryModal v-model:visible="showInventoryModal" @close="showInventoryModal = false" />

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
  import { computed, ref, watch } from 'vue'
  import { onLoad } from '@dcloudio/uni-app'
  import { useGameStore } from '../../stores/useGameStore'
  import { gameData } from '../../mock/gameData'
  import CustomNavbar from '@/components/CustomNavbar.vue'
  import InventoryModal from '@/components/InventoryModal.vue'
  import StoryDialogue from '@/components/StoryDialogue.vue'
  import LocationController from '@/components/LocationController.vue'

  const gameStore = useGameStore()
  const showCityModal = ref(false)
  const selectedCharacterIndex = ref(0)
  const showInventoryModal = ref(false)
  const navbarRef = ref(null)

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
    getMapMarkers
  } = gameStore

  const cities = computed(() => {
    return [gameStore.currentCityData, gameData.chaozhou, gameData.shantou]
  })

  const directCharacters = computed(() => {
    const city = gameStore.currentCity || 'jieyang'
    return gameData[city as keyof typeof gameData]?.characters || gameData.jieyang.characters || []
  })

  const mapCenter = computed(() => {
    return gameStore.userLocation || { latitude: 23.5360, longitude: 116.3560 }
  })

  const mapMarkers = computed(() => {
    // 获取基于剧情解锁的POI标记
    const unlockedMarkers = gameStore.visibleMarkers

    // 添加玩家位置标记 - 使用本地静态资源路径
    const playerMarker = {
      id: 999, // 数字ID，确保在所有其他标记之上
      latitude: gameStore.userLocation.latitude,
      longitude: gameStore.userLocation.longitude,
      iconPath: '/static/my-location.png', // 修复：使用本地静态资源路径
      width: 40, // 增大尺寸以确保可见性
      height: 40,
      anchor: { x: 0.5, y: 0.5 },
      zIndex: 999 // 确保在所有标记之上
    }

    // 添加调试日志
    console.log('Unlocked Markers:', unlockedMarkers)
    console.log('Player Marker:', playerMarker)
    console.log('User Location:', gameStore.userLocation)

    // 合并标记数组，玩家位置标记放在最后以确保显示在最上层
    return [...unlockedMarkers, playerMarker]
  })

  const mapPolylines = computed(() => {
    if (!gameStore.userLocation || !gameStore.targetLocation) return []
    return [{
      points: [
        { latitude: gameStore.userLocation.latitude, longitude: gameStore.userLocation.longitude },
        { latitude: gameStore.targetLocation.latitude, longitude: gameStore.targetLocation.longitude }
      ],
      color: '#00897B',
      width: 4,
      borderWidth: 2,
      borderColor: '#FFFFFF',
      dottedLine: true,
      arrowLine: true
    }]
  })

  const onMarkerTap = (e : any) => {
    const markerId = e.detail.markerId

    // 跳过玩家位置标记（ID: 999）
    if (markerId === 999) {
      console.log('点击了玩家位置标记，忽略')
      return
    }

    const poi = gameStore.getPOIById(markerId)

    if (!poi) {
      console.warn('未找到POI数据:', markerId)
      return
    }

    console.log('点击POI:', poi.name, 'ID:', poi.id)

    // 计算距离
    const distance = calculateDistance(
      gameStore.userLocation.latitude,
      gameStore.userLocation.longitude,
      poi.latitude,
      poi.longitude
    )

    console.log('距离POI:', distance, '米')

    // 开发环境调试特权：允许直接进入
    const isDevEnvironment = process.env.NODE_ENV === 'development' ||
                            uni.getSystemInfoSync().platform === 'devtools'

    if (isDevEnvironment) {
      console.log('开发环境：直接进入AR模式')
      enterARMode(poi)
      return
    }

    // 生产环境：距离校验（100米范围内）
    if (distance <= 100) {
      console.log('距离达标，进入AR模式')
      enterARMode(poi)
    } else {
      console.log('距离过远，无法进入')
      uni.showToast({
        title: `太远了，请走近一点（当前距离：${distance}米）`,
        icon: 'none',
        duration: 3000
      })
    }
  }

  const onMapTap = () => { }

// 计算两点之间的距离（米）
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371000 // 地球半径（米）
  const lat1Rad = lat1 * Math.PI / 180
  const lat2Rad = lat2 * Math.PI / 180
  const deltaLatRad = (lat2 - lat1) * Math.PI / 180
  const deltaLonRad = (lon2 - lon1) * Math.PI / 180

  const a = Math.sin(deltaLatRad / 2) * Math.sin(deltaLatRad / 2) +
            Math.cos(lat1Rad) * Math.cos(lat2Rad) *
            Math.sin(deltaLonRad / 2) * Math.sin(deltaLonRad / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

  return Math.round(R * c) // 返回米数（四舍五入）
}

// 进入AR模式
const enterARMode = (poi: any) => {
  console.log('准备进入AR模式，POI:', poi.name)

  // 获取该POI对应的NPC ID（这里使用默认逻辑，后续可根据POI类型分配不同NPC）
  let npcId = 'lin_wenyuan' // 默认NPC

  // 根据POI ID分配对应的NPC（可根据游戏设计调整）
  switch (poi.id) {
    case 'jieyang_confucian_temple':
      npcId = 'lin_wenyuan' // 林文渊守护学宫
      break
    case 'kungfu_tea_house':
      npcId = 'chen_linger' // 陈灵儿精通茶艺
      break
    case 'lion_culture_area':
      npcId = 'lion_master' // 舞狮大师
      break
    case 'qiaopi_museum':
      npcId = 'wang_xiaohong' // 王小红管理侨批
      break
    case 'jinxian_gate':
      npcId = 'old_seal_keeper' // 老印章守护者
      break
    default:
      npcId = 'lin_wenyuan' // 默认NPC
  }

  // 构建路由参数
  const url = `/pages/ar/index?npcId=${npcId}&poiId=${poi.id}`

  console.log('跳转到AR页面:', url)

  // 显示进入提示
  uni.showToast({
    title: `正在进入${poi.name}`,
    icon: 'loading',
    duration: 1000
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
          icon: 'none'
        })
      }
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
        success: () => { gameStore.targetLocation = null }
      })
    }
  }

  const showCitySelector = () => { showCityModal.value = true }
  const hideCitySelector = () => { showCityModal.value = false }
  const selectCity = (cityId : string) => {
    if (gameStore.switchCity(cityId)) {
      uni.showToast({ title: '已切换', icon: 'success' })
    } else {
      uni.showToast({ title: '未解锁', icon: 'none' })
    }
    hideCitySelector()
  }
  const openInventory = () => { showInventoryModal.value = true }
  const goToCompass = () => { uni.navigateTo({ url: '/pages/compass/index' }) }
  const goToTest = () => { uni.navigateTo({ url: '/pages/test/test' }) }
  const onCharacterChange = (e : any) => {
    const newIndex = e.detail?.current
    if (typeof newIndex === 'number') selectedCharacterIndex.value = newIndex
  }
  const startGame = () => {
    const characters = directCharacters.value || []
    if (!characters || characters.length === 0) return

    const char = characters[getSafeSelectedIndex()]

    if (char && char.name) {
      // 1. 先关闭模态框，进入游戏状态
      gameStore.initGame(char)
      uni.showToast({ title: `进入: ${char.name}`, icon: 'none' })

      // 2. 延迟启动剧情，让地图先露出来
      setTimeout(() => {
        gameStore.startStory(char.id)
      }, 800)
    }
  }

  watch(() => gameStore.getDistanceToTarget, (newDistance, oldDistance) => {
    if (newDistance < 50 && (oldDistance === undefined || oldDistance >= 50)) checkArrival()
  }, { immediate: true })
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
    border: 1rpx solid #E0D3B8;
    border-radius: 32rpx;
    padding: 16rpx 24rpx;
    display: flex;
    align-items: center;
    box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.1);
    backdrop-filter: blur(10rpx);

    .city-icon { font-size: 28rpx; margin-right: 8rpx; color: #333; }
    .city-name { font-size: 28rpx; color: #333; font-weight: 500; margin-right: 8rpx; }
    .city-arrow { font-size: 20rpx; color: #666; opacity: 0.7; }
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
      background: linear-gradient(135deg, rgba(0, 137, 123, 0.9) 0%, rgba(0, 105, 92, 0.9) 100%);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 8rpx 20rpx rgba(0, 137, 123, 0.3);
      border: 3rpx solid rgba(255, 255, 255, 0.2);

      &.compass-btn { background: linear-gradient(135deg, #9c27b0 0%, #7b1fa2 100%); }
      &.inventory-btn { background: linear-gradient(135deg, #ff9800 0%, #e65100 100%); }
      
      .map-icon { font-size: 40rpx; color: #FFFFFF; text-shadow: 0 2rpx 4rpx rgba(0, 0, 0, 0.2); }
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
        background: rgba(255,255,255,0.95);
        border-radius: 30rpx;
        padding: 40rpx;
        box-shadow: 0 10rpx 30rpx rgba(0,0,0,0.2);
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
          .card-name { font-size: 40rpx; font-weight: bold; color: #333; }
        }

        .card-identity {
          background: #fff5f5;
          padding: 20rpx;
          border-radius: 16rpx;
          margin-bottom: 30rpx;
          text-align: center;
          flex-shrink: 0;

          .identity-main { font-size: 28rpx; color: #e74c3c; font-weight: bold; display: block; }
          .identity-sub { font-size: 24rpx; color: #e74c3c; opacity: 0.8; margin-top: 8rpx; display: block; }
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
    top: 0; bottom: 0; left: 0; right: 0;
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
</style>