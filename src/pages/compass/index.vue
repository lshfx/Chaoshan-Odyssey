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
        <view class="mini-compass" :style="{ transform: `rotate(${deviceHeading}deg)` }">
          <view class="mini-ring"></view>
          <view class="mini-pointer" :style="{ transform: `rotate(${pointerAngle}deg)` }">
            <view class="mini-arrow"></view>
          </view>
          <view class="mini-directions">
            <text class="mini-dir mini-dir-n">N</text>
            <text class="mini-dir mini-dir-e">E</text>
            <text class="mini-dir mini-dir-s">S</text>
            <text class="mini-dir mini-dir-w">W</text>
          </view>
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

// 导航数据
const routeData = ref<any>(null)
const routePolyline = ref<any[]>([])
const userTrackPolyline = ref<any[]>([])
const currentNavigationInstruction = ref('')
const routeDistance = ref(0)
const routeDuration = ref(0)
const currentSpeed = ref('0 km/h')
const isLoadingRoute = ref(false)

// 轨迹记录 (用于腾讯绑路API)
const trackHistory = ref<Array<[number, number, number, number, number]>>([])
const trackTimer = ref<any>(null)
const snapRoadTimer = ref<any>(null)

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

  // 用户实际轨迹 (金色)
  if (userTrackPolyline.value.length > 1) {
    polylines.push({
      points: userTrackPolyline.value,
      color: '#FFD700',
      width: 4,
      dottedLine: false,
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

// 腾讯绑路API - 轨迹纠偏
const snapToRoad = async (track: Array<[number, number, number, number, number]>) => {
  if (track.length < 2) return null

  try {
    const url = 'https://apis.map.qq.com/ws/snaptoroads/v1/'
    const payload = {
      track: track,
      mode: 'walking',
      smoothing: 1
    }

    // 注意：实际环境中可能需要代理服务器来处理跨域
    const response = await uni.request({
      url: url,
      method: 'POST',
      data: payload,
      header: {
        'Content-Type': 'application/json'
      }
    })

    if (response.statusCode === 200 && typeof response.data === 'object' && response.data.status === 0) {
      return response.data.result
    } else {
      console.error('腾讯绑路API调用失败:', response.data)
      return null
    }
  } catch (error) {
    console.error('轨迹纠偏失败:', error)
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

  // 根据朝向判断方向
  const bearing = calculateBearing()
  const normalizedAngle = ((bearing - deviceHeading.value) + 360) % 360

  if (normalizedAngle >= 337.5 || normalizedAngle < 22.5) return '⬆️'
  if (normalizedAngle >= 22.5 && normalizedAngle < 67.5) return '↗️'
  if (normalizedAngle >= 67.5 && normalizedAngle < 112.5) return '➡️'
  if (normalizedAngle >= 112.5 && normalizedAngle < 157.5) return '↘️'
  if (normalizedAngle >= 157.5 && normalizedAngle < 202.5) return '⬇️'
  if (normalizedAngle >= 202.5 && normalizedAngle < 247.5) return '↙️'
  if (normalizedAngle >= 247.5 && normalizedAngle < 292.5) return '⬅️'
  return '↖️'
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

// 更新指针角度
const updatePointer = () => {
  if (hasTarget.value) {
    const bearing = calculateBearing()
    pointerAngle.value = bearing - deviceHeading.value
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

  if (uni.stopCompass) {
    uni.stopCompass()
  }

  if (uni.offCompassChange) {
    uni.offCompassChange()
  }
}

// 开始轨迹记录
const startTrackRecording = () => {
  trackTimer.value = setInterval(() => {
    if (gameStore.userLocation) {
      const now = Math.floor(Date.now() / 1000)
      const trackPoint: [number, number, number, number, number] = [
        now,
        gameStore.userLocation.longitude,
        gameStore.userLocation.latitude,
        0, // 速度，暂时设为0
        deviceHeading.value
      ]

      trackHistory.value.push(trackPoint)

      // 更新用户轨迹显示
      userTrackPolyline.value.push({
        latitude: gameStore.userLocation.latitude,
        longitude: gameStore.userLocation.longitude
      })

      // 限制轨迹点数量，避免过多数据
      if (trackHistory.value.length > 100) {
        trackHistory.value.shift()
      }
    }
  }, 5000) // 每5秒记录一次
}

// 调用绑路API处理轨迹
const processTrackWithSnapRoad = async () => {
  if (trackHistory.value.length >= 10) {
    const snapResult = await snapToRoad(trackHistory.value)
    if (snapResult && snapResult.track) {
      // 更新轨迹显示
      const smoothedPolyline = snapResult.track.map((point: any) => ({
        latitude: point.lat,
        longitude: point.lng
      }))

      // 替换原始轨迹为平滑后的轨迹
      userTrackPolyline.value = smoothedPolyline
      console.log('轨迹纠偏完成，处理了', snapResult.track.length, '个点')
    }

    // 清空历史记录，准备下一批
    trackHistory.value = []
  }
}

// 停止轨迹记录
const stopTrackRecording = () => {
  if (trackTimer.value) {
    clearInterval(trackTimer.value)
    trackTimer.value = null
  }

  if (snapRoadTimer.value) {
    clearInterval(snapRoadTimer.value)
    snapRoadTimer.value = null
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
  hideTargetModal.value()

  uni.showToast({
    title: `已设置目标：${poi.name}`,
    icon: 'success'
  })

  // 清空之前的轨迹
  trackHistory.value = []
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
  trackHistory.value = []
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

    // 到达时处理最后一次轨迹
    processTrackWithSnapRoad()
  }
})

// 监听器：处理绑路API
const setupSnapRoadProcessing = () => {
  snapRoadTimer.value = setInterval(() => {
    processTrackWithSnapRoad()
  }, 30000) // 每30秒处理一次轨迹
}

onMounted(() => {
  // 获取地图上下文
  mapContext.value = uni.createMapContext('navigationMap')

  updatePointer()
  startCompass()
  startTrackRecording()
  setupSnapRoadProcessing()

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

    .mini-compass {
      position: relative;
      width: 70px;
      height: 70px;
      transition: transform 0.2s linear;

      .mini-ring {
        position: absolute;
        width: 100%;
        height: 100%;
        border: 2px solid rgba(255, 215, 0, 0.4);
        border-radius: 50%;
      }

      .mini-pointer {
        position: absolute;
        top: 50%;
        left: 50%;
        width: 30px;
        height: 4px;
        background: linear-gradient(90deg, transparent 0%, #FFD700 50%, #FF6B6B 100%);
        transform-origin: 0 50%;
        transform: translate(-50%, -50%);
        border-radius: 2px;

        .mini-arrow {
          position: absolute;
          right: -4px;
          top: 50%;
          transform: translateY(-50%);
          width: 0;
          height: 0;
          border-left: 8px solid #FF6B6B;
          border-top: 6px solid transparent;
          border-bottom: 6px solid transparent;
        }
      }

      .mini-directions {
        position: absolute;
        width: 100%;
        height: 100%;

        .mini-dir {
          position: absolute;
          color: #FFD700;
          font-size: 10px;
          font-weight: bold;
          font-family: 'SimSun', 'STSong', serif;

          &.mini-dir-n {
            top: 2px;
            left: 50%;
            transform: translateX(-50%);
          }

          &.mini-dir-e {
            right: 2px;
            top: 50%;
            transform: translateY(-50%);
          }

          &.mini-dir-s {
            bottom: 2px;
            left: 50%;
            transform: translateX(-50%);
          }

          &.mini-dir-w {
            left: 2px;
            top: 50%;
            transform: translateY(-50%);
          }
        }
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

    .poi-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 20px 30px;
      border-radius: 16px;
      margin-bottom: 10px;
      background: rgba(0, 0, 0, 0.3);
      border: 1px solid rgba(212, 175, 55, 0.2);

      &.selected {
        background: rgba(212, 175, 55, 0.2);
        border-color: #FFD700;
      }

      .poi-info {
        flex: 1;

        .poi-name {
          color: #FFD700;
          font-size: 28rpx;
          font-weight: bold;
          display: block;
          margin-bottom: 4px;
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
        margin-left: 20px;
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