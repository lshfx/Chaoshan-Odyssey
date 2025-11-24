<template>
  <view class="mystic-compass">
    <!-- 自定义导航栏 -->
    <CustomNavbar
      title="寻路罗盘"
      bgColor="#004D40"
      textColor="#FFD700"
      :showBack="true"
    />

    <!-- 顶部目标信息栏 -->
    <view class="target-header" @tap="showTargetSelector">
      <view class="target-info">
        <text class="target-label">当前目标</text>
        <text class="target-name">{{ targetName || '点击设置' }}</text>
      </view>
      <view class="target-actions">
        <view v-if="hasTarget" class="target-status">
          <view class="status-dot"></view>
          <text class="status-text">追踪中</text>
        </view>
        <view class="selector-icon">⚙</view>
      </view>
    </view>

    <!-- 罗盘容器 - 严格居中 -->
    <view class="compass-container">
      <!-- 外环 - 静态 -->
      <view class="compass-ring outer-ring"></view>

      <!-- 中环 - 随设备朝向旋转 -->
      <view
        class="compass-ring middle-ring"
        :style="{ transform: `rotate(${deviceHeading}deg)` }"
      ></view>

      <!-- 内环 - 静态装饰 -->
      <view class="compass-ring inner-ring"></view>

      <!-- 方位标记 - 静态 -->
      <view class="direction-markers">
        <view class="marker marker-n">北</view>
        <view class="marker marker-e">东</view>
        <view class="marker marker-s">南</view>
        <view class="marker marker-w">西</view>
      </view>

      <!-- 罗盘指针 - 始终可见 -->
      <view
        class="mystic-pointer"
        :class="{
          'pointer-active': hasTarget,
          'pointer-idle': !hasTarget,
          'pointer-searching': !hasTarget
        }"
        :style="{
          transform: `translate(-50%, -50%) rotate(${hasTarget ? pointerAngle : idleRotation}deg)`
        }"
      >
        <!-- 玉石光晕 -->
        <view class="jade-glow"></view>
        <!-- 金色箭头 -->
        <view class="golden-arrow">
          <view class="arrow-shaft"></view>
          <view class="arrow-head"></view>
        </view>
        <!-- 宝石核心 -->
        <view class="gem-core">
          <view class="inner-glow"></view>
          <view class="gem-center"></view>
        </view>
      </view>
    </view>

    <!-- 底部导航HUD - 精简版 -->
    <view class="navigation-hud">
      <!-- 距离显示 -->
      <view class="distance-display">
        <text class="distance-value">{{ formatDistance }}</text>
        <text class="distance-unit">米</text>
      </view>

      <!-- 模拟导航指令 -->
      <view class="navigation-instruction">
        <text class="instruction-text">{{ navigationInstruction }}</text>
      </view>

      <!-- 状态信息 -->
      <view class="status-info">
        <view class="info-item">
          <text class="info-label">方位角</text>
          <text class="info-value">{{ bearingToTarget }}°</text>
        </view>
        <view class="info-item">
          <text class="info-label">朝向</text>
          <text class="info-value">{{ deviceHeading }}°</text>
        </view>
        <view v-if="routeDuration > 0" class="info-item">
          <text class="info-label">预计</text>
          <text class="info-value">{{ Math.round(routeDuration / 60) }}分钟</text>
        </view>
        <view v-if="isLoadingRoute" class="info-item loading-indicator">
          <text class="info-label">状态</text>
          <text class="info-value">规划中</text>
        </view>
      </view>
    </view>

    <!-- 目标选择器 -->
    <view v-if="showTargetModal" class="target-selector-overlay" @tap="hideTargetSelector">
      <view class="target-selector" @tap.stop>
        <view class="selector-header">
          <text class="selector-title">选择目标位置</text>
          <view class="close-btn" @tap="hideTargetSelector">×</view>
        </view>

        <scroll-view class="poi-list" scroll-y="true">
          <view
            v-for="poi in availablePOIs"
            :key="poi.id"
            class="poi-item"
            :class="{ 'selected': isSelectedPOI(poi.id) }"
            @tap="selectTarget(poi)"
          >
            <view class="poi-info">
              <text class="poi-name">{{ poi.name }}</text>
              <text class="poi-distance">{{ calculateDistance(poi) }}米</text>
            </view>
            <view class="poi-icon">{{ (poi as any).icon || '📍' }}</view>
          </view>
        </scroll-view>
      </view>
    </view>

    <!-- 到达提示 -->
    <view v-if="showArrivalModal" class="arrival-overlay">
      <view class="arrival-modal">
        <view class="arrival-icon">📍</view>
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
import CustomNavbar from '@/components/CustomNavbar.vue'

// 腾讯地图配置 - 请替换为实际的密钥
const TENCENT_MAP_KEY = '5GWBZ-NZUCU-XEYVJ-GP2TW-IZRW5-6AFC7' // 提醒：需要填入真实的腾讯地图API密钥

const gameStore = useGameStore()

// 罗盘数据
const deviceHeading = ref(0) // 设备朝向
const bearingToTarget = ref(0) // 到目标的方位角
const pointerAngle = ref(0) // 指针显示角度
const idleRotation = ref(0) // 空闲状态旋转角度
const compassTimer = ref<any>(null)
const idleTimer = ref<any>(null)

// 腾讯地图导航数据
const routeData = ref<any>(null) // 存储完整的路线数据
const currentInstruction = ref('') // 当前导航指令
const routeDistance = ref(0) // 路线总距离
const routeDuration = ref(0) // 预计步行时间
const isLoadingRoute = ref(false) // 是否正在加载路线

// 目标选择器
const showTargetModal = ref(false)

// 坐标解压算法 (前向差分)
const unzipPolyline = (coors: number[]) => {
  // coors 是一个一维数组 [lat1, lng1, dLat2, dLng2, ...]
  let result: any[] = []

  if (coors.length < 2) return result

  // 前两个是起始绝对坐标
  let prevLat = coors[0]
  let prevLng = coors[1]
  result.push({ latitude: prevLat, longitude: prevLng })

  for (let i = 2; i < coors.length; i += 2) {
    let dLat = coors[i]
    let dLng = coors[i + 1]
    // 前向差分并除以 1000000 还原
    prevLat = prevLat + dLat / 1000000
    prevLng = prevLng + dLng / 1000000
    result.push({ latitude: prevLat, longitude: prevLng })
  }
  return result
}

// 调用腾讯地图步行路线规划API
const fetchWalkingRoute = async (fromLat: number, fromLng: number, toLat: number, toLng: number) => {
  if (TENCENT_MAP_KEY === 'YOUR_KEY_HERE') {
    console.warn('腾讯地图API密钥未配置，使用模拟导航')
    return null
  }

  isLoadingRoute.value = true

  try {
    const url = `https://apis.map.qq.com/ws/direction/v1/walking/`
    const params = {
      from: `${fromLat},${fromLng}`,
      to: `${toLat},${toLng}`,
      key: TENCENT_MAP_KEY,
      output: 'json'
    }

    // 构建查询字符串
    const queryString = Object.entries(params)
      .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
      .join('&')

    const response = await uni.request({
      url: `${url}?${queryString}`,
      method: 'GET'
    })

    if (response.statusCode === 200 && typeof response.data === 'object' && response.data.status === 0) {
      return response.data.result
    } else {
      console.error('腾讯地图API调用失败:', response.data)
      return null
    }
  } catch (error) {
    console.error('获取路线失败:', error)
    return null
  } finally {
    isLoadingRoute.value = false
  }
}

// 解析导航指令
const parseNavigationInstructions = (route: any) => {
  if (!route || !route.routes || route.routes.length === 0) {
    return ''
  }

  const currentRoute = route.routes[0]
  if (!currentRoute.steps || currentRoute.steps.length === 0) {
    return ''
  }

  // 获取当前步骤的指令（简化版本，实际应该基于用户位置判断）
  const firstStep = currentRoute.steps[0]

  let instruction = ''

  // 根据 maneuver 指令生成中文导航
  switch (firstStep.maneuver) {
    case '直行':
      instruction = `沿${firstStep.road_name || '道路'}直行`
      break
    case '左转':
      instruction = `在前方路口左转进入${firstStep.road_name || '道路'}`
      break
    case '右转':
      instruction = `在前方路口右转进入${firstStep.road_name || '道路'}`
      break
    case '掉头':
      instruction = `在前方掉头`
      break
    case '左转通过':
      instruction = `左转通过${firstStep.road_name || '路口'}`
      break
    case '右转通过':
      instruction = `右转通过${firstStep.road_name || '路口'}`
      break
    default:
      instruction = `沿${firstStep.road_name || '当前道路'}步行`
  }

  // 添加距离信息
  if (firstStep.distance) {
    const distance = Math.round(firstStep.distance)
    instruction += ` ${distance}米`
  }

  return instruction
}

// 加载导航路线
const loadNavigationRoute = async () => {
  if (!gameStore.userLocation || !gameStore.targetLocation) {
    routeData.value = null
    currentInstruction.value = ''
    return
  }

  const route = await fetchWalkingRoute(
    gameStore.userLocation.latitude,
    gameStore.userLocation.longitude,
    gameStore.targetLocation.latitude,
    gameStore.targetLocation.longitude
  )

  if (route) {
    routeData.value = route
    routeDistance.value = route.routes[0]?.distance || 0
    routeDuration.value = route.routes[0]?.duration || 0
    currentInstruction.value = parseNavigationInstructions(route)

    // 解压polyline坐标
    if (route.routes[0]?.polyline) {
      const decompressedPath = unzipPolyline(route.routes[0].polyline)
      console.log('解压后的路径坐标点数:', decompressedPath.length)
    }
  } else {
    routeData.value = null
    currentInstruction.value = '路线规划失败，请检查网络连接'
  }
}

// 计算属性
const hasTarget = computed(() => !!gameStore.targetLocation)
const targetName = computed(() => gameStore.targetLocation?.name || '')
const distanceToTarget = computed(() => gameStore.getDistanceToTarget)

const formatDistance = computed(() => {
  if (!hasTarget.value) return '--'
  // 优先使用API返回的路线距离，其次使用直线距离
  if (routeDistance.value > 0) {
    return Math.round(routeDistance.value)
  }
  return distanceToTarget.value
})

// 可用的POI列表
const availablePOIs = computed(() => {
  // 优先使用游戏数据中的POI
  const gamePOIs = gameStore.currentCityPOIs || []

  // 如果没有游戏数据，提供测试数据
  if (gamePOIs.length === 0) {
    return [
      {
        id: 'test_confucian',
        name: '揭阳学宫',
        latitude: 23.5436,
        longitude: 116.3683,
      } as any,
      {
        id: 'test_jinxian',
        name: '进贤门',
        latitude: 23.5360,
        longitude: 116.3560,
        icon: '🚪'
      } as any,
      {
        id: 'test_lion',
        name: '青狮文化区',
        latitude: 23.5338,
        longitude: 116.3715,
        icon: '🦁'
      } as any,
      {
        id: 'test_tea',
        name: '功夫茶馆',
        latitude: 23.5316,
        longitude: 116.3642,
        icon: '🍵'
      } as any,
      {
        id: 'test_qiaopi',
        name: '侨批博物馆',
        latitude: 23.5402,
        longitude: 116.3658,
        icon: '📜'
      } as any
    ]
  }

  return gamePOIs
})

// 真实导航指令
const navigationInstruction = computed(() => {
  if (!hasTarget.value) return '请先设置导航目标'

  // 如果正在加载路线
  if (isLoadingRoute.value) {
    return '正在规划路线...'
  }

  // 如果有真实的API导航数据，优先使用
  if (currentInstruction.value) {
    return currentInstruction.value
  }

  // 如果没有API密钥或API调用失败，回退到简单模拟
  if (TENCENT_MAP_KEY === 'YOUR_KEY_HERE') {
    return '请配置腾讯地图API密钥以获得真实导航'
  }

  // 基本回退指令
  const distance = distanceToTarget.value
  if (distance < 10) {
    return '目的地就在眼前！'
  } else if (distance < 50) {
    return '目标很近，请仔细观察周围环境'
  } else {
    return `目标在前方约${distance}米处`
  }
})

// 计算方位角
const calculateBearing = () => {
  if (!gameStore.userLocation || !gameStore.targetLocation) return 0

  const lat1 = gameStore.userLocation.latitude * Math.PI / 180
  const lon1 = gameStore.userLocation.longitude * Math.PI / 180
  const lat2 = gameStore.targetLocation.latitude * Math.PI / 180
  const lon2 = gameStore.targetLocation.longitude * Math.PI / 180

  const dLon = lon2 - lon1
  const y = Math.sin(dLon) * Math.cos(lat2)
  const x = Math.cos(lat1) * Math.sin(lat2) -
          Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon)

  let bearing = Math.atan2(y, x) * 180 / Math.PI
  bearing = (bearing + 360) % 360

  return bearing
}

// 启动空闲旋转动画
const startIdleRotation = () => {
  if (idleTimer.value) return

  idleTimer.value = setInterval(() => {
    idleRotation.value = (idleRotation.value + 1) % 360
  }, 50)
}

// 停止空闲旋转动画
const stopIdleRotation = () => {
  if (idleTimer.value) {
    clearInterval(idleTimer.value)
    idleTimer.value = null
  }
}

// 更新指针角度
const updatePointer = () => {
  bearingToTarget.value = calculateBearing()
  // 指针角度 = 目标方位角 - 设备朝向
  pointerAngle.value = bearingToTarget.value - deviceHeading.value

  // 根据是否有目标控制空闲动画
  if (hasTarget.value) {
    stopIdleRotation()
  } else {
    startIdleRotation()
  }
}

// 启动罗盘监听
const startCompass = () => {
  if (!uni.onCompassChange) {
    console.warn('设备不支持罗盘功能，使用模拟数据')
    simulateCompass()
    return
  }

  uni.onCompassChange((res) => {
    deviceHeading.value = Math.round(res.direction)
    updatePointer()
  })

  uni.startCompass({
    success: () => {
      console.log('罗盘启动成功')
    },
    fail: (err) => {
      console.error('罗盘启动失败:', err)
      simulateCompass()
    }
  })
}

// 模拟罗盘数据
const simulateCompass = () => {
  let angle = 0
  compassTimer.value = setInterval(() => {
    angle = (angle + 2) % 360
    deviceHeading.value = angle
    updatePointer()
  }, 100)
}

// 停止罗盘监听
const stopCompass = () => {
  if (compassTimer.value) {
    clearInterval(compassTimer.value)
    compassTimer.value = null
  }

  if (idleTimer.value) {
    clearInterval(idleTimer.value)
    idleTimer.value = null
  }

  if (uni.stopCompass) {
    uni.stopCompass()
  }

  if (uni.offCompassChange) {
    uni.offCompassChange()
  }
}

// 到达提示
const showArrivalModal = ref(false)

const closeArrivalModal = () => {
  showArrivalModal.value = false
  gameStore.targetLocation = null
}

// 目标选择器功能
const showTargetSelector = () => {
  showTargetModal.value = true
}

const hideTargetSelector = () => {
  showTargetModal.value = false
}

// 计算到POI的距离
const calculateDistance = (poi: any) => {
  if (!gameStore.userLocation) return 0

  const R = 6371000 // 地球半径（米）
  const lat1 = gameStore.userLocation.latitude * Math.PI / 180
  const lon1 = gameStore.userLocation.longitude * Math.PI / 180
  const lat2 = poi.latitude * Math.PI / 180
  const lon2 = poi.longitude * Math.PI / 180

  const deltaLat = lat2 - lat1
  const deltaLon = lon2 - lon1

  const a = Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
            Math.cos(lat1) * Math.cos(lat2) *
            Math.sin(deltaLon / 2) * Math.sin(deltaLon / 2)

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return Math.round(R * c)
}

// 检查POI是否被选中
const isSelectedPOI = (poiId: string) => {
  return (gameStore.targetLocation as any)?.id === poiId
}

// 选择目标
const selectTarget = async (poi: any) => {
  gameStore.setTargetLocation(poi.latitude, poi.longitude, poi.name)
  hideTargetSelector()

  uni.showToast({
    title: `已设置目标：${poi.name}`,
    icon: 'success'
  })

  // 加载导航路线
  await loadNavigationRoute()
}

// 监听目标变化
watch(() => gameStore.targetLocation, async () => {
  updatePointer()
  // 当目标变化时，重新加载路线
  await loadNavigationRoute()
})

// 监听用户位置变化，重新加载路线
watch(() => gameStore.userLocation, async () => {
  if (hasTarget.value) {
    updatePointer()
    await loadNavigationRoute()
  }
})

// 监听距离变化
watch(() => distanceToTarget.value, (newDistance, oldDistance) => {
  if (hasTarget.value && newDistance < 10 && oldDistance >= 10 && !showArrivalModal.value) {
    showArrivalModal.value = true
    uni.vibrateShort({
      type: 'heavy'
    })
  }
})

onMounted(() => {
  updatePointer()
  startCompass()
})

onUnmounted(() => {
  stopCompass()
})
</script>

<style lang="scss" scoped>
.mystic-compass {
  position: relative;
  width: 100vw;
  height: 100vh;
  background: linear-gradient(180deg, #004D40 0%, #00695C 100%);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

// 顶部目标信息栏 - 安全定位和层级
.target-header {
  position: absolute;
  top: calc(var(--status-bar-height) + 44px + 30rpx);
  left: 30rpx;
  right: 30rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(10rpx);
  border-radius: 16rpx;
  padding: 20rpx 30rpx;
  border: 1rpx solid rgba(255, 215, 0, 0.2);
  z-index: 100;
  cursor: pointer;

  .target-info {
    .target-label {
      color: #888;
      font-size: 22rpx;
      display: block;
      margin-bottom: 4rpx;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    }

    .target-name {
      color: #FFD700;
      font-size: 32rpx;
      font-weight: 600;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    }
  }

  .target-actions {
    display: flex;
    align-items: center;
    gap: 16rpx;

    .target-status {
      display: flex;
      align-items: center;
      gap: 8rpx;

      .status-dot {
        width: 12rpx;
        height: 12rpx;
        border-radius: 50%;
        background: #4CAF50;
        animation: statusPulse 2s infinite;
      }

      .status-text {
        color: #4CAF50;
        font-size: 24rpx;
        font-family: 'SimSun', 'STSong', serif;
      }
    }

    .selector-icon {
      font-size: 28rpx;
      color: #D4AF37;
      opacity: 0.8;
      font-weight: bold;
    }
  }
}

@keyframes statusPulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}

// 罗盘容器 - 精确居中适配
.compass-container {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%); // 完全居中，与头部位置调整保持平衡
  width: min(550rpx, 80vw); // 响应式宽度，小屏设备自动缩小
  height: min(550rpx, 80vw); // 保持方形，响应式高度
  max-width: 550rpx;
  max-height: 550rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

// 同心圆环 - 玉石与金色调，响应式适配
.compass-ring {
  position: absolute;
  border-radius: 50%;
  transition: transform 0.2s linear;

  &.outer-ring {
    width: 100%;
    height: 100%;
    border: 3rpx solid #D4AF37;
    opacity: 0.4;
    box-shadow: 0 0 30rpx rgba(212, 175, 55, 0.3);
  }

  &.middle-ring {
    width: 82%;
    height: 82%;
    border: 2rpx dashed #00897B;
    opacity: 0.7;
  }

  &.inner-ring {
    width: 64%;
    height: 64%;
    border: 1rpx solid #D4AF37;
    opacity: 0.5;
  }
}

// 方位标记 - 中文字符
.direction-markers {
  position: absolute;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;

  .marker {
    position: absolute;
    color: #D4AF37;
    font-size: 32rpx;
    font-weight: bold;
    font-family: 'SimSun', 'STSong', serif;
    text-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.5);

    &.marker-n {
      top: 20rpx;
      left: 50%;
      transform: translateX(-50%);
    }

    &.marker-e {
      right: 20rpx;
      top: 50%;
      transform: translateY(-50%);
    }

    &.marker-s {
      bottom: 20rpx;
      left: 50%;
      transform: translateX(-50%);
    }

    &.marker-w {
      left: 20rpx;
      top: 50%;
      transform: translateY(-50%);
    }
  }
}

// 神秘指针 - 响应式尺寸
.mystic-pointer {
  position: absolute;
  top: 50%;
  left: 50%;
  width: min(350rpx, 60vw); // 响应式宽度
  height: min(80rpx, 14vw);  // 响应式高度
  transform-origin: center;
  transition: transform 0.2s linear;
  z-index: 100;

  &.pointer-idle {
    opacity: 0.6;
  }

  &.pointer-active {
    opacity: 1;
  }

  &.pointer-searching {
    animation: slowSpin 10s linear infinite;
    opacity: 0.7;
  }
}

@keyframes slowSpin {
  from {
    transform: translate(-50%, -50%) rotate(0deg);
  }
  to {
    transform: translate(-50%, -50%) rotate(360deg);
  }
}

// 玉石光晕
.jade-glow {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 320rpx;
  height: 60rpx;
  background: linear-gradient(90deg,
    transparent 0%,
    rgba(212, 175, 55, 0.2) 20%,
    rgba(0, 137, 123, 0.3) 50%,
    rgba(212, 175, 55, 0.2) 80%,
    transparent 100%);
  filter: blur(10rpx);
  animation: jadePulse 2s infinite;
}

@keyframes jadePulse {
  0%, 100% { opacity: 0.5; }
  50% { opacity: 0.9; }
}

// 金色箭头 - 响应式设计
.golden-arrow {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 80%;
  height: 62.5%; // 保持比例

  .arrow-shaft {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 79%;
    height: 36%;
    background: linear-gradient(90deg,
      transparent 0%,
      rgba(212, 175, 55, 0.7) 20%,
      #D4AF37 40%,
      #FFD700 60%,
      #D4AF37 80%,
      transparent 100%);
    border-radius: 50%;
    box-shadow: 0 0 3vw rgba(212, 175, 55, 0.5);
  }

  .arrow-head {
    position: absolute;
    top: 50%;
    right: 8.5%;
    transform: translateY(-50%);
    width: 0;
    height: 0;
    border-left: 7% solid #D4AF37;
    border-top: 36% solid transparent;
    border-bottom: 36% solid transparent;
    filter: drop-shadow(0 0 3vw rgba(212, 175, 55, 0.8));
  }
}

// 宝石核心 - 响应式尺寸
.gem-core {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);

  .inner-glow {
    width: min(45rpx, 8vw);
    height: min(45rpx, 8vw);
    border-radius: 50%;
    background: radial-gradient(circle at center,
      rgba(0, 255, 200, 0.3) 0%,
      rgba(212, 175, 55, 0.5) 40%,
      transparent 100%);
    animation: gemGlow 1.5s infinite;
  }

  .gem-center {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: min(20rpx, 3.5vw);
    height: min(20rpx, 3.5vw);
    border-radius: 50%;
    background: radial-gradient(circle at center, #00FFC8 0%, #D4AF37 100%);
    box-shadow: 0 0 min(25rpx, 4.5vw) rgba(0, 255, 200, 0.8);
  }
}

@keyframes gemGlow {
  0%, 100% { transform: scale(1); opacity: 0.7; }
  50% { transform: scale(1.4); opacity: 1; }
}

// 底部导航HUD - 精简优雅版，避免重叠
.navigation-hud {
  position: absolute;
  bottom: 50rpx;
  bottom: calc(50rpx + env(safe-area-inset-bottom));
  left: 50%;
  transform: translateX(-50%);
  width: 85%;
  max-width: 650rpx;
  max-height: 35vh;
  background: rgba(0, 50, 50, 0.6);
  backdrop-filter: blur(20rpx);
  border-radius: 16rpx;
  padding: 20rpx;
  padding-bottom: calc(20rpx + env(safe-area-inset-bottom));
  border: 1rpx solid rgba(212, 175, 55, 0.4);
  text-align: center;
  overflow: hidden;

  .distance-display {
    margin-bottom: 16rpx;

    .distance-value {
      color: #D4AF37;
      font-size: 48rpx;
      font-weight: 700;
      text-shadow: 0 0 15rpx rgba(212, 175, 55, 0.4);
      font-family: 'SimSun', 'STSong', serif;
    }

    .distance-unit {
      color: #D4AF37;
      font-size: 22rpx;
      font-weight: 500;
      margin-left: 6rpx;
      font-family: 'SimSun', 'STSong', serif;
    }
  }

  .navigation-instruction {
    margin-bottom: 16rpx;
    padding: 12rpx 16rpx;
    background: rgba(212, 175, 55, 0.1);
    border-radius: 8rpx;
    border: 1rpx solid rgba(212, 175, 55, 0.3);
    max-height: 8vh;
    overflow-y: auto;

    .instruction-text {
      color: #D4AF37;
      font-size: 24rpx;
      line-height: 1.3;
      font-family: 'SimSun', 'STSong', serif;
      word-wrap: break-word;
    }
  }

  .status-info {
    display: flex;
    justify-content: space-around;
    border-top: 1rpx solid rgba(212, 175, 55, 0.3);
    padding-top: 16rpx;

    .info-item {
      text-align: center;

      .info-label {
        color: rgba(212, 175, 55, 0.7);
        font-size: 20rpx;
        display: block;
        margin-bottom: 4rpx;
        font-family: 'SimSun', 'STSong', serif;
      }

      .info-value {
        color: #D4AF37;
        font-size: 28rpx;
        font-weight: 600;
        font-family: 'SimSun', 'STSong', serif;
      }

      &.loading-indicator {
        .info-value {
          color: #FF9800;
          animation: loadingPulse 1s infinite;
        }
      }
    }
  }
}

@keyframes loadingPulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

// 到达提示
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
  backdrop-filter: blur(10rpx);
}

.arrival-modal {
  background: linear-gradient(135deg, #004D40 0%, #00695C 100%);
  border-radius: 24rpx;
  padding: 60rpx;
  text-align: center;
  border: 2rpx solid #D4AF37;
  box-shadow: 0 0 50rpx rgba(212, 175, 55, 0.4);
  animation: modalAppear 0.4s ease;

  .arrival-icon {
    font-size: 80rpx;
    margin-bottom: 30rpx;
    display: block;
    animation: iconBounce 0.6s ease;
  }

  .arrival-title {
    color: #D4AF37;
    font-size: 36rpx;
    font-weight: 700;
    display: block;
    margin-bottom: 15rpx;
    font-family: 'SimSun', 'STSong', serif;
  }

  .arrival-subtitle {
    color: #D4AF37;
    font-size: 28rpx;
    opacity: 0.8;
    display: block;
    margin-bottom: 40rpx;
    font-family: 'SimSun', 'STSong', serif;
  }

  .arrival-btn {
    background: linear-gradient(135deg, #D4AF37 0%, #00897B 100%);
    color: #004D40;
    border: none;
    border-radius: 25rpx;
    padding: 20rpx 60rpx;
    font-size: 28rpx;
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

// 目标选择器
.target-selector-overlay {
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
  backdrop-filter: blur(10rpx);
}

.target-selector {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  max-height: 70vh;
  background: linear-gradient(180deg, #004D40 0%, #00695C 100%);
  border-radius: 24rpx 24rpx 0 0;
  padding: 0;
  padding-bottom: env(safe-area-inset-bottom); // 适配iPhone X+的Home Indicator
  animation: slideUp 0.3s ease;

  .selector-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 30rpx;
    border-bottom: 1rpx solid rgba(212, 175, 55, 0.3);

    .selector-title {
      color: #D4AF37;
      font-size: 32rpx;
      font-weight: bold;
      font-family: 'SimSun', 'STSong', serif;
    }

    .close-btn {
      width: 50rpx;
      height: 50rpx;
      border-radius: 50%;
      background: rgba(212, 175, 55, 0.2);
      display: flex;
      align-items: center;
      justify-content: center;
      color: #D4AF37;
      font-size: 32rpx;
      cursor: pointer;

      &:active {
        background: rgba(212, 175, 55, 0.3);
      }
    }
  }

  .poi-list {
    max-height: 60vh;
    padding: 20rpx;

    .poi-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 20rpx 30rpx;
      border-radius: 16rpx;
      margin-bottom: 10rpx;
      background: rgba(0, 0, 0, 0.3);
      border: 1rpx solid rgba(212, 175, 55, 0.2);
      cursor: pointer;
      transition: all 0.2s ease;

      &:active {
        background: rgba(212, 175, 55, 0.1);
        transform: translateX(10rpx);
      }

      &.selected {
        background: rgba(212, 175, 55, 0.2);
        border-color: #D4AF37;
      }

      .poi-info {
        flex: 1;

        .poi-name {
          color: #D4AF37;
          font-size: 28rpx;
          font-weight: bold;
          display: block;
          margin-bottom: 4rpx;
          font-family: 'SimSun', 'STSong', serif;
        }

        .poi-distance {
          color: rgba(212, 175, 55, 0.7);
          font-size: 22rpx;
          font-family: 'SimSun', 'STSong', serif;
        }
      }

      .poi-icon {
        font-size: 32rpx;
        margin-left: 20rpx;
      }
    }
  }
}

@keyframes slideUp {
  from {
    transform: translateY(100%);
  }
  to {
    transform: translateY(0);
  }
}

// 响应式媒体查询
@media screen and (max-width: 375px) {
  // iPhone SE 等小屏设备
  .target-header {
    padding: 16rpx 24rpx;

    .target-name {
      font-size: 28rpx;
    }
  }

  .navigation-hud {
    width: 90%;
    padding: 16rpx;

    .distance-value {
      font-size: 42rpx;
    }

    .instruction-text {
      font-size: 22rpx;
    }

    .info-value {
      font-size: 24rpx;
    }
  }
}

@media screen and (min-width: 768px) {
  // 大屏设备优化
  .compass-container {
    width: 500rpx;
    height: 500rpx;
  }

  .navigation-hud {
    max-width: 600rpx;
  }
}

// 超宽屏优化
@media screen and (min-width: 1024px) {
  .mystic-compass {
    max-width: 750rpx;
    margin: 0 auto;
  }
}
</style>