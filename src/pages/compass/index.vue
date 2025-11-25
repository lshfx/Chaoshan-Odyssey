<template>
  <view class="map-navigation">
    <!-- 自定义导航栏 -->
    <CustomNavbar
      title="实时导航"
      bgColor="#004D40"
      textColor="#FFD700"
      :showBack="true"
    />

    <!-- 全屏地图 -->
    <map
      id="navigationMap"
      class="navigation-map"
      :latitude="mapCenter.latitude"
      :longitude="mapCenter.longitude"
      :scale="mapScale"
      :show-location="true"
      :enable-traffic="false"
      :enable-3D="true"
      :enable-overlooking="true"
      :enable-zoom="true"
      :enable-scroll="true"
      :enable-rotate="false"
      :markers="mapMarkers"
      :polyline="mapPolylines"
      :circles="mapCircles"
      @markertap="onMarkerTap"
      @regionchange="onMapRegionChange"
    >
      <!-- 地图图层控件 -->
      <cover-view class="map-controls">
        <!-- 跟随模式切换按钮 -->
        <cover-view
          class="control-btn follow-btn"
          :class="{ active: isFollowingUser }"
          @tap="toggleFollowMode"
        >
          <cover-view class="control-icon">{{ isFollowingUser ? '🧭' : '🗺️' }}</cover-view>
        </cover-view>

        <!-- 重置视角按钮 -->
        <cover-view
          class="control-btn reset-btn"
          @tap="resetMapView"
        >
          <cover-view class="control-icon">📍</cover-view>
        </cover-view>
      </cover-view>
    </map>

    <!-- 顶部导航HUD卡片 -->
    <NavHud
      :symbol="navigationSymbol"
      :instruction="navigationInstruction"
      :target-name="targetName"
      @tap-selector="showTargetSelector"
    />

    <!-- 底部仪表盘 -->
    <CompassDashboard
      :device-heading="deviceHeading"
      :pointer-angle="pointerAngle"
      :distance="formatDistance"
      :duration="formatDuration"
      :speed="currentSpeed"
    />

    <!-- 加载状态指示器 -->
    <view v-if="isLoadingRoute" class="loading-overlay">
      <view class="loading-content">
        <view class="loading-spinner"></view>
        <text class="loading-text">正在规划路线...</text>
      </view>
    </view>

    <!-- 目标选择器 -->
    <TargetSelector
      v-model:visible="showTargetModal"
      :pois="availablePOIs"
      :current-id="currentTargetId"
      @select="handleSelectTarget"
    />

    <!-- 到达提示 -->
    <view v-if="showArrivalModal" class="arrival-overlay">
      <view class="arrival-modal">
        <view class="arrival-icon">🎉</view>
        <text class="arrival-title">已到达目的地</text>
        <text class="arrival-subtitle">{{ targetName }}</text>
        <button class="arrival-btn" @tap="closeArrivalModal">确认</button>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useGameStore } from '@/stores/useGameStore'
import { gameData } from '@/mock/gameData'
import CustomNavbar from '@/components/CustomNavbar.vue'
import NavHud from '@/components/compass/NavHud.vue'
import CompassDashboard from '@/components/compass/CompassDashboard.vue'
import TargetSelector from '@/components/compass/TargetSelector.vue'
import { useMapNavigation } from '@/composables/useMapNavigation'

const gameStore = useGameStore()
const navigation = useMapNavigation()

// 地图状态
const mapScale = ref(16)
const isFollowingUser = ref(true)
const mapContext = ref<any>(null)

// 设备朝向数据
const deviceHeading = ref(0)
const pointerAngle = ref(0)
const compassTimer = ref<any>(null)

// 罗盘数据平滑处理
const rawHeading = ref(0)
const smoothHeading = ref(0)
const lastUpdateTime = ref(0)
const compassUpdateInterval = 100

// UI状态
const showTargetModal = ref(false)
const showArrivalModal = ref(false)
const currentSpeed = ref('0 km/h')

// 轨迹记录
const trackTimer = ref<any>(null)

// 计算属性
const mapCenter = computed(() => {
  if (isFollowingUser.value && gameStore.userLocation) {
    return {
      latitude: gameStore.userLocation.latitude,
      longitude: gameStore.userLocation.longitude
    }
  }

  if (gameStore.userLocation) {
    return gameStore.userLocation
  }

  return { latitude: 23.5360, longitude: 116.3560 }
})

const mapMarkers = computed(() => {
  const markers = []

  // 用户位置标记
  if (gameStore.userLocation) {
    markers.push({
      id: 'user_location',
      latitude: gameStore.userLocation.latitude,
      longitude: gameStore.userLocation.longitude,
      iconPath: '/static/my-location.png',
      width: 30,
      height: 30,
      anchor: { x: 0.5, y: 0.5 },
      zIndex: 1000
    })
  }

  // 目标位置标记
  if (gameStore.targetLocation) {
    markers.push({
      id: 'target_location',
      latitude: gameStore.targetLocation.latitude,
      longitude: gameStore.targetLocation.longitude,
      iconPath: '/static/markers/mission-marker.png',
      width: 35,
      height: 35,
      anchor: { x: 0.5, y: 0.5 },
      callout: {
        content: gameStore.targetLocation.name || '目的地',
        color: '#FFFFFF',
        fontSize: 14,
        borderRadius: 6,
        bgColor: '#FF4444',
        padding: 6,
        display: 'ALWAYS'
      }
    })
  }

  return markers
})

const mapPolylines = computed(() => {
  const polylines = []

  // 规划的导航路线 (青色)
  if (navigation.routePolyline.value.length > 0) {
    polylines.push({
      points: navigation.routePolyline.value,
      color: '#00897B',
      width: 8,
      dottedLine: false,
      arrowLine: true,
      borderWidth: 2,
      borderColor: '#FFFFFF'
    })
  }

  // 用户实际轨迹 (金色虚线)
  if (navigation.userTrackPolyline.value.length > 1) {
    polylines.push({
      points: navigation.userTrackPolyline.value,
      color: '#FFD700',
      width: 4,
      dottedLine: true,
      arrowLine: false,
      borderWidth: 1,
      borderColor: '#FFA500'
    })
  }

  return polylines
})

const mapCircles = computed(() => {
  const circles = []

  // GPS精度圆圈
  if (gameStore.userLocation) {
    circles.push({
      latitude: gameStore.userLocation.latitude,
      longitude: gameStore.userLocation.longitude,
      radius: 20,
      fillColor: 'rgba(0, 137, 123, 0.1)',
      strokeColor: 'rgba(0, 137, 123, 0.3)',
      strokeWidth: 2
    })
  }

  return circles
})

const targetName = computed(() => gameStore.targetLocation?.name || '')
const currentTargetId = computed(() => (gameStore.targetLocation as any)?.id)

// 导航相关计算属性
const navigationSymbol = computed(() => navigation.getNavigationSymbol(deviceHeading.value))
const navigationInstruction = computed(() => navigation.currentNavigationInstruction.value)

// 可用的POI列表
const availablePOIs = computed(() => {
  const gamePOIs = gameStore.currentCityPOIs || []

  if (gamePOIs.length === 0) {
    return [
      {
        id: 'test_confucian',
        name: '揭阳学宫',
        latitude: 23.5436,
        longitude: 116.3683,
      },
      {
        id: 'test_jinxian',
        name: '进贤门',
        latitude: 23.5360,
        longitude: 116.3560,
        icon: '🚪'
      },
      {
        id: 'test_lion',
        name: '青狮文化区',
        latitude: 23.5338,
        longitude: 116.3715,
        icon: '🦁'
      },
      {
        id: 'test_tea',
        name: '功夫茶馆',
        latitude: 23.5316,
        longitude: 116.3642,
        icon: '🍵'
      }
    ]
  }

  return gamePOIs
})

// 罗盘数据平滑处理
const smoothCompassData = (targetHeading: number) => {
  let adjustedTarget = targetHeading
  const currentDisplay = smoothHeading.value

  if (Math.abs(adjustedTarget - currentDisplay) > 180) {
    if (adjustedTarget > currentDisplay) {
      adjustedTarget -= 360
    } else {
      adjustedTarget += 360
    }
  }

  const lerpFactor = 0.15
  smoothHeading.value += (adjustedTarget - smoothHeading.value) * lerpFactor

  return (smoothHeading.value + 360) % 360
}

const throttledUpdateUI = () => {
  const now = Date.now()
  if (now - lastUpdateTime.value >= compassUpdateInterval) {
    lastUpdateTime.value = now
    deviceHeading.value = Math.round(smoothHeading.value)
    updatePointer()
  }
}

// 更新指针角度 - 雷达模式算法
const updatePointer = () => {
  if (navigation.hasTarget.value) {
    const bearing = navigation.calculateBearing()
    // 雷达模式：指针显示目标相对于用户正前方的角度
    // 0° = 正前方，90° = 正右方，180° = 正后方，270° = 正左方
    const relativeAngle = ((bearing - deviceHeading.value) + 360) % 360
    pointerAngle.value = relativeAngle
  } else {
    // 无目标时指针归零（指向用户正前方）
    pointerAngle.value = 0
  }
}

// 启动罗盘监听
const startCompass = () => {
  if (!uni.onCompassChange) {
    console.warn('设备不支持罗盘功能，使用模拟数据')
    simulateCompass()
    return
  }

  uni.stopCompass({
    complete: () => {
      console.log('已停止现有罗盘监听')
      setTimeout(() => {
        startCompassListening()
      }, 200)
    }
  })
}

const startCompassListening = () => {
  uni.onCompassChange((res) => {
    const newRawHeading = Math.round(res.direction)
    rawHeading.value = newRawHeading

    const smoothedValue = smoothCompassData(newRawHeading)
    throttledUpdateUI()
  })

  uni.startCompass({
    success: () => {
      console.log('罗盘启动成功，启用平滑处理')
    },
    fail: (err) => {
      console.error('罗盘启动失败:', err)
      if (err.errMsg?.includes('has enable')) {
        console.log('罗盘已经启动，开始监听变化')
      } else {
        simulateCompass()
      }
    }
  })
}

const simulateCompass = () => {
  let angle = 0
  compassTimer.value = setInterval(() => {
    angle = (angle + 2) % 360
    rawHeading.value = angle

    const smoothedValue = smoothCompassData(angle)
    throttledUpdateUI()
  }, 50)
}

const stopCompass = () => {
  if (compassTimer.value) {
    clearInterval(compassTimer.value)
    compassTimer.value = null
  }

  if (uni.stopCompass) {
    uni.stopCompass()
  }

  if (uni.offCompassChange) {
    uni.offCompassChange()
  }
}

// 简化的轨迹记录
const startTrackRecording = () => {
  trackTimer.value = setInterval(() => {
    if (gameStore.userLocation) {
      navigation.userTrackPolyline.value.push({
        latitude: gameStore.userLocation.latitude,
        longitude: gameStore.userLocation.longitude
      })

      if (navigation.userTrackPolyline.value.length > 200) {
        navigation.userTrackPolyline.value.shift()
      }
    }
  }, 3000)
}

const stopTrackRecording = () => {
  if (trackTimer.value) {
    clearInterval(trackTimer.value)
    trackTimer.value = null
  }
}

// 地图控制函数
const toggleFollowMode = () => {
  isFollowingUser.value = !isFollowingUser.value
  if (isFollowingUser.value && mapContext.value) {
    mapContext.value.moveToLocation()
  }
}

const resetMapView = () => {
  if (gameStore.userLocation && gameStore.targetLocation) {
    if (mapContext.value) {
      const lat = (gameStore.userLocation.latitude + gameStore.targetLocation.latitude) / 2
      const lng = (gameStore.userLocation.longitude + gameStore.targetLocation.longitude) / 2
      mapContext.value.moveToLocation({
        latitude: lat,
        longitude: lng
      })
    }
  } else if (gameStore.userLocation && mapContext.value) {
    mapContext.value.moveToLocation()
  }
}

const onMapRegionChange = (e: any) => {
  if (e.type === 'end') {
    isFollowingUser.value = false
  }
}

const onMarkerTap = (e: any) => {
  const markerId = e.detail.markerId
  console.log('点击了标记:', markerId)
}

// 目标选择器功能
const showTargetSelector = () => {
  showTargetModal.value = true
}

const handleSelectTarget = async (poi: any) => {
  // 设置全局目标
  gameStore.setTargetLocation(poi.latitude, poi.longitude, poi.name)

  // 用户反馈
  uni.showToast({
    title: `目标已锁定：${poi.name}`,
    icon: 'none',
    duration: 2000
  })

  // 重置导航状态
  navigation.userTrackPolyline.value = []

  // 开始规划新路线
  await navigation.loadNavigationRoute()
}

const closeArrivalModal = () => {
  showArrivalModal.value = false
  gameStore.targetLocation = null
  navigation.clearNavigationData()
}

// 监听器
watch(() => gameStore.targetLocation, async () => {
  updatePointer()
  await navigation.loadNavigationRoute()
})

watch(() => gameStore.userLocation, async () => {
  if (navigation.hasTarget.value) {
    updatePointer()
    await navigation.loadNavigationRoute()
  }

  if (isFollowingUser.value && mapContext.value) {
    mapContext.value.moveToLocation()
  }
})

watch(() => navigation.distanceToTarget.value, (newDistance, oldDistance) => {
  if (navigation.hasTarget.value && newDistance < 10 && oldDistance >= 10 && !showArrivalModal.value) {
    showArrivalModal.value = true
    uni.vibrateShort({
      type: 'heavy'
    })
  }
})

onMounted(() => {
  mapContext.value = uni.createMapContext('navigationMap')

  smoothHeading.value = deviceHeading.value
  lastUpdateTime.value = Date.now()

  updatePointer()
  startCompass()
  startTrackRecording()

  console.log('🧭 雷达导航系统启动 - 固定底盘，0°=正前方')

  if (navigation.hasTarget.value) {
    navigation.loadNavigationRoute()
  }
})

onUnmounted(() => {
  stopCompass()
  stopTrackRecording()
})
</script>

<style lang="scss" scoped>
.map-navigation {
  position: relative;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
}

.navigation-map {
  width: 100%;
  height: 100%;
}

.map-controls {
  position: absolute;
  top: calc(var(--status-bar-height) + 120px);
  right: 20px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  z-index: 100;
  pointer-events: none;

  .control-btn {
    width: 44px;
    height: 44px;
    background: rgba(0, 77, 64, 0.9);
    border: 2px solid rgba(255, 215, 0, 0.6);
    border-radius: 22px;
    display: flex;
    align-items: center;
    justify-content: center;
    backdrop-filter: blur(10px);
    pointer-events: auto;
    transition: all 0.3s ease;

    &.active {
      background: rgba(255, 215, 0, 0.9);
      border-color: #FFD700;
    }

    &:active {
      transform: scale(0.95);
    }

    .control-icon {
      font-size: 20px;
    }
  }
}

.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(10px);

  .loading-content {
    background: rgba(0, 77, 64, 0.95);
    border-radius: 16px;
    padding: 30px;
    text-align: center;
    border: 2px solid rgba(255, 215, 0, 0.6);

    .loading-spinner {
      width: 40px;
      height: 40px;
      border: 4px solid rgba(255, 215, 0, 0.2);
      border-top: 4px solid #FFD700;
      border-radius: 50%;
      margin: 0 auto 16px;
      animation: spin 1s linear infinite;
    }

    .loading-text {
      color: #FFD700;
      font-size: 16px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    }
  }
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.arrival-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(10px);
}

.arrival-modal {
  background: linear-gradient(135deg, #004D40 0%, #00695C 100%);
  border-radius: 24px;
  padding: 60px;
  text-align: center;
  border: 2px solid #FFD700;
  box-shadow: 0 0 50px rgba(212, 175, 55, 0.4);
  animation: modalAppear 0.4s ease;

  .arrival-icon {
    font-size: 80px;
    margin-bottom: 30px;
    display: block;
    animation: iconBounce 0.6s ease;
  }

  .arrival-title {
    color: #FFD700;
    font-size: 36px;
    font-weight: 700;
    display: block;
    margin-bottom: 15px;
    font-family: 'SimSun', 'STSong', serif;
  }

  .arrival-subtitle {
    color: #FFD700;
    font-size: 28px;
    opacity: 0.8;
    display: block;
    margin-bottom: 40px;
    font-family: 'SimSun', 'STSong', serif;
  }

  .arrival-btn {
    background: linear-gradient(135deg, #FFD700 0%, #00897B 100%);
    color: #004D40;
    border: none;
    border-radius: 25px;
    padding: 20px 60px;
    font-size: 28px;
    font-weight: 600;
    font-family: 'SimSun', 'STSong', serif;
  }
}

@keyframes modalAppear {
  from {
    opacity: 0;
    transform: scale(0.9);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes iconBounce {
  0% { transform: scale(0.3); }
  50% { transform: scale(1.2); }
  100% { transform: scale(1); }
}
</style>