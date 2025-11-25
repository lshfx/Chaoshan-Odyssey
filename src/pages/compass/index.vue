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
    <view class="top-hud-card">
      <view class="hud-header">
        <view class="nav-icon">
          <text class="nav-symbol">{{ getNavigationSymbol() }}</text>
        </view>
        <view class="nav-info">
          <text class="nav-instruction">{{ currentNavigationInstruction }}</text>
          <text class="target-name">{{ targetName || '请设置导航目标' }}</text>
        </view>
        <view class="nav-actions">
          <view class="action-btn" @tap="showTargetSelector">
            <text class="action-icon">🎯</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 底部仪表盘 -->
    <view class="bottom-dashboard">
      <!-- 迷你罗盘 -->
      <view class="mini-compass-container">
        <!-- 刻度盘容器 (固定底盘) -->
        <view class="mini-dial">
          <view class="dial-ring"></view>

          <!-- 装饰性刻度线 -->
          <view class="dial-ticks">
            <!-- 主方向刻度线（粗） -->
            <view class="tick tick-major tick-top"></view>
            <view class="tick tick-major tick-right"></view>
            <view class="tick tick-major tick-bottom"></view>
            <view class="tick tick-major tick-left"></view>

            <!-- 次要刻度线（细） -->
            <view class="tick tick-minor tick-top-right"></view>
            <view class="tick tick-minor tick-bottom-right"></view>
            <view class="tick tick-minor tick-bottom-left"></view>
            <view class="tick tick-minor tick-top-left"></view>
          </view>
        </view>

        <!-- 指针容器 (兄弟节点，避免嵌套旋转叠加) -->
        <view
          class="mini-pointer"
          :style="{ transform: `translate(-50%, -50%) rotate(${pointerAngle}deg)` }"
        >
          <view class="pointer-arrow"></view>
          <view class="pointer-center"></view>
        </view>

        <text class="mini-compass-label">方位</text>
      </view>

      <!-- 数据面板 -->
      <view class="data-panel">
        <view class="data-item">
          <text class="data-label">距离</text>
          <text class="data-value">{{ formatDistance }}</text>
        </view>
        <view class="data-item">
          <text class="data-label">预计</text>
          <text class="data-value">{{ formatDuration }}</text>
        </view>
        <view class="data-item">
          <text class="data-label">时速</text>
          <text class="data-value">{{ currentSpeed }}</text>
        </view>
      </view>
    </view>

    <!-- 加载状态指示器 -->
    <view v-if="isLoadingRoute" class="loading-overlay">
      <view class="loading-content">
        <view class="loading-spinner"></view>
        <text class="loading-text">正在规划路线...</text>
      </view>
    </view>

    <!-- 目标选择器 -->
    <view v-if="showTargetModal" class="target-selector-overlay" @tap="hideTargetSelector">
      <view class="target-selector" @tap.stop>
        <view class="selector-header">
          <text class="selector-title">选择导航目标</text>
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
import CustomNavbar from '@/components/CustomNavbar.vue'

// 腾讯地图配置
const TENCENT_MAP_KEY = '5GWBZ-NZUCU-XEYVJ-GP2TW-IZRW5-6AFC7'

const gameStore = useGameStore()

// 地图状态
const mapScale = ref(16)
const isFollowingUser = ref(true)
const mapContext = ref<any>(null)

// 设备朝向数据
const deviceHeading = ref(0)
const pointerAngle = ref(0)
const compassTimer = ref<any>(null)

// 罗盘数据平滑处理
const rawHeading = ref(0) // 原始磁力计数据
const smoothHeading = ref(0) // 平滑后的显示数据
const lastUpdateTime = ref(0) // 节流控制
const compassUpdateInterval = 100 // 节流间隔：100ms

// 导航数据
const routeData = ref<any>(null)
const routePolyline = ref<any[]>([])
const userTrackPolyline = ref<any[]>([])
const currentNavigationInstruction = ref('')
const routeDistance = ref(0)
const routeDuration = ref(0)
const currentSpeed = ref('0 km/h')
const isLoadingRoute = ref(false)

// 轨迹记录 (简化版)
const trackTimer = ref<any>(null)

// UI状态
const showTargetModal = ref(false)
const showArrivalModal = ref(false)

// 地图中心点
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

  return { latitude: 23.5360, longitude: 116.3560 } // 揭阳市中心
})

// 地图标记
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

// 地图路线 (规划路线 + 用户轨迹)
const mapPolylines = computed(() => {
  const polylines = []

  // 规划的导航路线 (青色)
  if (routePolyline.value.length > 0) {
    polylines.push({
      points: routePolyline.value,
      color: '#00897B',
      width: 8,
      dottedLine: false,
      arrowLine: true,
      borderWidth: 2,
      borderColor: '#FFFFFF'
    })
  }

  // 用户实际轨迹 (金色虚线)
  if (userTrackPolyline.value.length > 1) {
    polylines.push({
      points: userTrackPolyline.value,
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

// 地图圆形区域 (可选的精度圆圈)
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

// 计算属性
const hasTarget = computed(() => !!gameStore.targetLocation)
const targetName = computed(() => gameStore.targetLocation?.name || '')
const distanceToTarget = computed(() => gameStore.getDistanceToTarget)

const formatDistance = computed(() => {
  if (!hasTarget.value) return '--'
  if (routeDistance.value > 0) {
    return `${Math.round(routeDistance.value)}m`
  }
  return `${distanceToTarget.value}m`
})

const formatDuration = computed(() => {
  if (!hasTarget.value) return '--'
  if (routeDuration.value > 0) {
    const minutes = Math.floor(routeDuration.value / 60)
    if (minutes > 60) {
      const hours = Math.floor(minutes / 60)
      return `${hours}h${minutes % 60}m`
    }
    return `${minutes}分钟`
  }
  return '计算中'
})

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
      } as any
    ]
  }

  return gamePOIs
})

// 坐标解压算法 (前向差分)
const unzipPolyline = (coors: number[]) => {
  let result: any[] = []

  if (coors.length < 2) return result

  let prevLat = coors[0]
  let prevLng = coors[1]
  result.push({ latitude: prevLat, longitude: prevLng })

  for (let i = 2; i < coors.length; i += 2) {
    let dLat = coors[i]
    let dLng = coors[i + 1]
    prevLat = prevLat + dLat / 1000000
    prevLng = prevLng + dLng / 1000000
    result.push({ latitude: prevLat, longitude: prevLng })
  }
  return result
}

// 腾讯地图步行路线规划API
const fetchWalkingRoute = async (fromLat: number, fromLng: number, toLat: number, toLng: number) => {
  if (TENCENT_MAP_KEY === 'YOUR_KEY_HERE') {
    console.warn('腾讯地图API密钥未配置，使用模拟导航')
    return null
  }

  try {
    const url = `https://apis.map.qq.com/ws/direction/v1/walking/`
    const params = {
      from: `${fromLat},${fromLng}`,
      to: `${toLat},${toLng}`,
      key: TENCENT_MAP_KEY,
      output: 'json'
    }

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
  }
}

// 解析导航指令
const parseNavigationInstructions = (route: any) => {
  if (!route || !route.routes || route.routes.length === 0) {
    return '请沿当前道路继续前行'
  }

  const currentRoute = route.routes[0]
  if (!currentRoute.steps || currentRoute.steps.length === 0) {
    return '请沿当前道路继续前行'
  }

  const firstStep = currentRoute.steps[0]

  switch (firstStep.maneuver) {
    case '直行':
      return `沿${firstStep.road_name || '道路'}直行 ${firstStep.distance ? Math.round(firstStep.distance) + '米' : ''}`
    case '左转':
      return `在前方路口左转进入${firstStep.road_name || '道路'} ${firstStep.distance ? Math.round(firstStep.distance) + '米' : ''}`
    case '右转':
      return `在前方路口右转进入${firstStep.road_name || '道路'} ${firstStep.distance ? Math.round(firstStep.distance) + '米' : ''}`
    case '掉头':
      return '在前方掉头'
    case '左转通过':
      return `左转通过${firstStep.road_name || '路口'}`
    case '右转通过':
      return `右转通过${firstStep.road_name || '路口'}`
    default:
      return `沿${firstStep.road_name || '当前道路'}步行 ${firstStep.distance ? Math.round(firstStep.distance) + '米' : ''}`
  }
}

// 获取导航符号
const getNavigationSymbol = () => {
  if (!hasTarget.value) return '🧭'

  const distance = distanceToTarget.value
  if (distance < 10) return '🎯'
  if (distance < 50) return '📍'
  if (distance < 200) return '🚶'

  // HUD显示相对方位：目标在我的哪个方向
  const bearing = calculateBearing()
  const relativeAngle = ((bearing - deviceHeading.value) + 360) % 360

  // 0度代表"正前方"
  if (relativeAngle >= 337.5 || relativeAngle < 22.5) return '⬆️' // 正前方
  if (relativeAngle >= 22.5 && relativeAngle < 67.5) return '↗️' // 右前方
  if (relativeAngle >= 67.5 && relativeAngle < 112.5) return '➡️' // 正右方
  if (relativeAngle >= 112.5 && relativeAngle < 157.5) return '↘️' // 右后方
  if (relativeAngle >= 157.5 && relativeAngle < 202.5) return '⬇️' // 正后方
  if (relativeAngle >= 202.5 && relativeAngle < 247.5) return '↙️' // 左后方
  if (relativeAngle >= 247.5 && relativeAngle < 292.5) return '⬅️' // 正左方
  return '↖️' // 左前方
}

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

// 罗盘数据平滑处理函数
const smoothCompassData = (targetHeading: number) => {
  // 解决 0度 <-> 360度 旋转突变问题
  let adjustedTarget = targetHeading
  const currentDisplay = smoothHeading.value

  if (Math.abs(adjustedTarget - currentDisplay) > 180) {
    if (adjustedTarget > currentDisplay) {
      adjustedTarget -= 360
    } else {
      adjustedTarget += 360
    }
  }

  // 线性插值 (Lerp factor = 0.15)
  const lerpFactor = 0.15
  smoothHeading.value += (adjustedTarget - smoothHeading.value) * lerpFactor

  // 归一化到 0-360 范围
  return (smoothHeading.value + 360) % 360
}

// 节流更新UI
const throttledUpdateUI = () => {
  const now = Date.now()
  if (now - lastUpdateTime.value >= compassUpdateInterval) {
    lastUpdateTime.value = now

    // 应用平滑数据到UI显示
    deviceHeading.value = Math.round(smoothHeading.value)

    // 更新指针角度
    updatePointer()
  }
}

// 更新指针角度 - 雷达模式算法
const updatePointer = () => {
  if (hasTarget.value) {
    const bearing = calculateBearing()
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

  // 先停止现有罗盘监听，避免重复启动错误
  uni.stopCompass({
    complete: () => {
      console.log('已停止现有罗盘监听')
      // 延迟启动，确保完全停止
      setTimeout(() => {
        startCompassListening()
      }, 200)
    }
  })
}

// 实际启动罗盘监听的函数
const startCompassListening = () => {
  uni.onCompassChange((res) => {
    // 获取原始磁力计数据
    const newRawHeading = Math.round(res.direction)
    rawHeading.value = newRawHeading

    // 应用平滑处理
    const smoothedValue = smoothCompassData(newRawHeading)

    // 节流更新UI
    throttledUpdateUI()
  })

  uni.startCompass({
    success: () => {
      console.log('罗盘启动成功，启用平滑处理')
    },
    fail: (err) => {
      console.error('罗盘启动失败:', err)
      // 如果已经启动，直接监听
      if (err.errMsg?.includes('has enable')) {
        console.log('罗盘已经启动，开始监听变化')
      } else {
        simulateCompass()
      }
    }
  })
}

// 模拟罗盘数据
const simulateCompass = () => {
  let angle = 0
  compassTimer.value = setInterval(() => {
    angle = (angle + 2) % 360
    rawHeading.value = angle

    // 对模拟数据也应用平滑处理
    const smoothedValue = smoothCompassData(angle)

    // 节流更新UI
    throttledUpdateUI()
  }, 50) // 模拟器高频数据，用于测试平滑效果
}

// 停止罗盘监听
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
      // 直接将当前坐标 push 到 userTrackPolyline
      userTrackPolyline.value.push({
        latitude: gameStore.userLocation.latitude,
        longitude: gameStore.userLocation.longitude
      })

      // 限制轨迹点数量，避免过多数据
      if (userTrackPolyline.value.length > 200) {
        userTrackPolyline.value.shift()
      }

      console.log('记录轨迹点:', {
        lat: gameStore.userLocation.latitude,
        lng: gameStore.userLocation.longitude,
        totalPoints: userTrackPolyline.value.length
      })
    }
  }, 3000) // 每3秒记录一次，减少频率
}

// 停止轨迹记录
const stopTrackRecording = () => {
  if (trackTimer.value) {
    clearInterval(trackTimer.value)
    trackTimer.value = null
  }
}

// 加载导航路线
const loadNavigationRoute = async () => {
  if (!gameStore.userLocation || !gameStore.targetLocation) {
    routeData.value = null
    routePolyline.value = []
    currentNavigationInstruction.value = ''
    return
  }

  isLoadingRoute.value = true

  try {
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
      currentNavigationInstruction.value = parseNavigationInstructions(route)

      // 解压polyline坐标
      if (route.routes[0]?.polyline) {
        routePolyline.value = unzipPolyline(route.routes[0].polyline)
        console.log('解压后的路径坐标点数:', routePolyline.value.length)
      }
    } else {
      routeData.value = null
      routePolyline.value = []
      currentNavigationInstruction.value = '路线规划失败，请检查网络连接'
    }
  } finally {
    isLoadingRoute.value = false
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
  // 当用户手动拖动地图时，关闭跟随模式
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

const hideTargetSelector = () => {
  showTargetModal.value = false
}

const calculateDistance = (poi: any) => {
  if (!gameStore.userLocation) return 0

  const R = 6371000
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

const isSelectedPOI = (poiId: string) => {
  return (gameStore.targetLocation as any)?.id === poiId
}

const selectTarget = async (poi: any) => {
  gameStore.setTargetLocation(poi.latitude, poi.longitude, poi.name)
  hideTargetModal.value = false

  uni.showToast({
    title: `已设置目标：${poi.name}`,
    icon: 'success'
  })

  // 清空之前的轨迹
  userTrackPolyline.value = []

  // 加载新的导航路线
  await loadNavigationRoute()
}

const hideTargetModal = () => {
  showTargetModal.value = false
}

const closeArrivalModal = () => {
  showArrivalModal.value = false
  gameStore.targetLocation = null
  routeData.value = null
  routePolyline.value = []
  userTrackPolyline.value = []
}

// 监听目标变化
watch(() => gameStore.targetLocation, async () => {
  updatePointer()
  await loadNavigationRoute()
})

// 监听用户位置变化
watch(() => gameStore.userLocation, async () => {
  if (hasTarget.value) {
    updatePointer()
    await loadNavigationRoute()
  }

  if (isFollowingUser.value && mapContext.value) {
    mapContext.value.moveToLocation()
  }
})

// 监听距离变化，检测到达
watch(() => distanceToTarget.value, (newDistance, oldDistance) => {
  if (hasTarget.value && newDistance < 10 && oldDistance >= 10 && !showArrivalModal.value) {
    showArrivalModal.value = true
    uni.vibrateShort({
      type: 'heavy'
    })

    console.log('到达目的地，总轨迹点数:', userTrackPolyline.value.length)
  }
})

onMounted(() => {
  // 获取地图上下文
  mapContext.value = uni.createMapContext('navigationMap')

  // 初始化平滑处理状态
  smoothHeading.value = deviceHeading.value
  lastUpdateTime.value = Date.now()

  updatePointer()
  startCompass()
  startTrackRecording()

  // 简化初始化日志（只输出一次）
  console.log('🧭 雷达导航系统启动 - 固定底盘，0°=正前方')
  console.log(`📍 初始状态: 朝向=${deviceHeading.value}°, 指针=${pointerAngle.value}°`)

  // 初始加载路线
  if (hasTarget.value) {
    loadNavigationRoute()
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

// 全屏地图
.navigation-map {
  width: 100%;
  height: 100%;
}

// 地图控制按钮
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

// 顶部HUD卡片
.top-hud-card {
  position: absolute;
  top: calc(var(--status-bar-height) + 44px + 20px);
  left: 20px;
  right: 20px;
  background: rgba(0, 77, 64, 0.85);
  backdrop-filter: blur(15px);
  border-radius: 16px;
  border: 2px solid rgba(255, 215, 0, 0.4);
  padding: 16px 20px;
  z-index: 100;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);

  .hud-header {
    display: flex;
    align-items: center;
    gap: 12px;

    .nav-icon {
      width: 50px;
      height: 50px;
      background: rgba(255, 215, 0, 0.15);
      border: 2px solid rgba(255, 215, 0, 0.6);
      border-radius: 25px;
      display: flex;
      align-items: center;
      justify-content: center;

      .nav-symbol {
        font-size: 28px;
      }
    }

    .nav-info {
      flex: 1;

      .nav-instruction {
        display: block;
        color: #FFFFFF;
        font-size: 16px;
        font-weight: 600;
        margin-bottom: 4px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      }

      .target-name {
        display: block;
        color: rgba(255, 215, 0, 0.8);
        font-size: 14px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      }
    }

    .nav-actions {
      .action-btn {
        width: 40px;
        height: 40px;
        background: rgba(255, 215, 0, 0.2);
        border: 1px solid rgba(255, 215, 0, 0.4);
        border-radius: 20px;
        display: flex;
        align-items: center;
        justify-content: center;

        .action-icon {
          font-size: 18px;
        }
      }
    }
  }
}

// 底部仪表盘
.bottom-dashboard {
  position: absolute;
  bottom: 20px;
  bottom: calc(20px + env(safe-area-inset-bottom));
  left: 20px;
  right: 20px;
  display: flex;
  gap: 20px;
  z-index: 100;

  // 迷你罗盘
  .mini-compass-container {
    width: 100px;
    height: 100px;
    background: rgba(0, 50, 50, 0.9);
    backdrop-filter: blur(15px);
    border: 2px solid rgba(255, 215, 0, 0.6);
    border-radius: 50px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    position: relative;

    // 刻度盘容器 (固定底盘)
    .mini-dial {
      position: absolute;
      top: 50%;
      left: 50%;
      width: 70px;
      height: 70px;
      transform: translate(-50%, -50%);

      .dial-ring {
        position: absolute;
        width: 100%;
        height: 100%;
        border: 2px solid rgba(255, 215, 0, 0.4);
        border-radius: 50%;
      }

      // 装饰性刻度线容器
      .dial-ticks {
        position: absolute;
        width: 100%;
        height: 100%;

        .tick {
          position: absolute;
          border-radius: 1px;

          // 主方向刻度线（更粗更亮）
          &.tick-major {
            background: #FFD700;
            box-shadow: 0 0 6px rgba(255, 215, 0, 0.6);

            &.tick-top {
              top: 0;
              left: 50%;
              transform: translateX(-50%);
              width: 4px;
              height: 12px;
              box-shadow: 0 0 8px rgba(255, 215, 0, 0.8);
            }

            &.tick-right {
              top: 50%;
              right: 0;
              transform: translateY(-50%);
              width: 10px;
              height: 3px;
            }

            &.tick-bottom {
              bottom: 0;
              left: 50%;
              transform: translateX(-50%);
              width: 4px;
              height: 12px;
            }

            &.tick-left {
              top: 50%;
              left: 0;
              transform: translateY(-50%);
              width: 10px;
              height: 3px;
            }
          }

          // 次要刻度线（细，对角方向）
          &.tick-minor {
            background: rgba(255, 215, 0, 0.4);

            &.tick-top-right {
              top: 8px;
              right: 8px;
              width: 6px;
              height: 2px;
              transform: rotate(45deg);
            }

            &.tick-bottom-right {
              bottom: 8px;
              right: 8px;
              width: 6px;
              height: 2px;
              transform: rotate(-45deg);
            }

            &.tick-bottom-left {
              bottom: 8px;
              left: 8px;
              width: 6px;
              height: 2px;
              transform: rotate(45deg);
            }

            &.tick-top-left {
              top: 8px;
              left: 8px;
              width: 6px;
              height: 2px;
              transform: rotate(-45deg);
            }
          }
        }
      }
    }

    // 指针容器 (兄弟节点)
    .mini-pointer {
      position: absolute;
      top: 50%;
      left: 50%;
      width: 35px;
      height: 35px;
      transform: translate(-50%, -50%);
      transition: transform 0.2s linear;

      .pointer-arrow {
        position: absolute;
        top: 0;
        left: 50%;
        width: 0;
        height: 0;
        transform: translateX(-50%);
        border-left: 4px solid transparent;
        border-right: 4px solid transparent;
        border-bottom: 20px solid #FF6B6B;
        filter: drop-shadow(0 2px 4px rgba(255, 107, 107, 0.3));
      }

      .pointer-center {
        position: absolute;
        top: 50%;
        left: 50%;
        width: 8px;
        height: 8px;
        background: radial-gradient(circle, #FFD700 0%, #FF6B6B 100%);
        border-radius: 50%;
        transform: translate(-50%, -50%);
        box-shadow: 0 0 8px rgba(255, 215, 0, 0.4);
      }
    }

    .mini-compass-label {
      color: rgba(255, 215, 0, 0.8);
      font-size: 10px;
      font-family: 'SimSun', 'STSong', serif;
      margin-top: 2px;
    }
  }

  // 数据面板
  .data-panel {
    flex: 1;
    background: rgba(0, 50, 50, 0.9);
    backdrop-filter: blur(15px);
    border: 2px solid rgba(255, 215, 0, 0.6);
    border-radius: 16px;
    padding: 16px 20px;
    display: flex;
    align-items: center;
    justify-content: space-around;

    .data-item {
      text-align: center;

      .data-label {
        display: block;
        color: rgba(255, 215, 0, 0.7);
        font-size: 12px;
        margin-bottom: 4px;
        font-family: 'SimSun', 'STSong', serif;
      }

      .data-value {
        display: block;
        color: #FFD700;
        font-size: 18px;
        font-weight: bold;
        font-family: 'SimSun', 'STSong', serif;
      }
    }
  }
}

// 加载状态
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
  backdrop-filter: blur(10px);
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
  padding-bottom: env(safe-area-inset-bottom);
  animation: slideUp 0.3s ease;

  .selector-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 30px;

    .selector-title {
      color: #FFD700;
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
      color: #FFD700;
      font-size: 32rpx;
    }
  }

  .poi-list {
    max-height: 60vh;
    padding: 20px;
    overflow-y: auto;

    .poi-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 20px;
      border-radius: 16px;
      margin-bottom: 10px;
      background: rgba(0, 0, 0, 0.3);
      border: 1px solid rgba(212, 175, 55, 0.2);
      width: 100%;
      box-sizing: border-box;

      &.selected {
        background: rgba(212, 175, 55, 0.2);
        border-color: #FFD700;
      }

      .poi-info {
        flex: 1;
        min-width: 0; // 允许内容收缩
        margin-right: 12px;

        .poi-name {
          color: #FFD700;
          font-size: 28rpx;
          font-weight: bold;
          display: block;
          margin-bottom: 4px;
          font-family: 'SimSun', 'STSong', serif;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .poi-distance {
          color: rgba(212, 175, 55, 0.7);
          font-size: 22rpx;
          font-family: 'SimSun', 'STSong', serif;
        }
      }

      .poi-icon {
        font-size: 32rpx;
        flex-shrink: 0; // 防止图标被压缩
        margin-left: 8px;
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