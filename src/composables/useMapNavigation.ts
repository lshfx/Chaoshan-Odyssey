import { ref, computed } from 'vue'
import { useGameStore } from '@/stores/useGameStore'

// 腾讯地图配置
const TENCENT_MAP_KEY = '5GWBZ-NZUCU-XEYVJ-GP2TW-IZRW5-6AFC7'

export interface MapLocation {
  latitude: number
  longitude: number
}

export interface POI {
  id: string
  name: string
  latitude: number
  longitude: number
  icon?: string
}

// 腾讯地图API响应接口
interface TencentMapResponse {
  status: number;
  message: string;
  result: RouteData;
}

export interface RouteData {
  routes: Array<{
    distance: number
    duration: number
    polyline: number[]
    steps: Array<{
      maneuver: string
      road_name: string
      distance?: number
    }>
  }>
}

export function useMapNavigation() {
  const gameStore = useGameStore()

  // 导航状态
  const routeData = ref<RouteData | null>(null)
  const routePolyline = ref<MapLocation[]>([])
  const userTrackPolyline = ref<MapLocation[]>([])
  const currentNavigationInstruction = ref('')
  const routeDistance = ref(0)
  const routeDuration = ref(0)
  const isLoadingRoute = ref(false)

  // 计算属性
  const hasTarget = computed(() => !!gameStore.targetLocation)
  const distanceToTarget = computed(() => gameStore.getDistanceToTarget)

  // 坐标解压算法 (前向差分)
  const unzipPolyline = (coors: number[]) => {
    let result: MapLocation[] = []

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

      if (response.statusCode === 200 && typeof response.data === 'object' && response.data !== null && 'status' in response.data && response.data.status === 0) {
        return (response.data as any).result as RouteData
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
  const parseNavigationInstructions = (route: RouteData) => {
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

  // 计算距离
  const calculateDistance = (poi: POI | MapLocation): number => {
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

  // 获取导航符号
  const getNavigationSymbol = (deviceHeading: number) => {
    if (!hasTarget.value) return '🧭'

    const distance = distanceToTarget.value
    if (distance < 10) return '🎯'
    if (distance < 50) return '📍'
    if (distance < 200) return '🚶'

    // HUD显示相对方位：目标在我的哪个方向
    const bearing = calculateBearing()
    const relativeAngle = ((bearing - deviceHeading) + 360) % 360

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

  // 格式化距离显示
  const formatDistance = computed(() => {
    if (!hasTarget.value) return '--'
    if (routeDistance.value > 0) {
      return `${Math.round(routeDistance.value)}m`
    }
    return `${distanceToTarget.value}m`
  })

  // 格式化时间显示
  const formatDuration = computed(() => {
    if (!hasTarget.value) return '--'

    // API 返回单位为分钟，直接使用
    const minutes = routeDuration.value

    if (minutes > 0) {
      if (minutes >= 60) {
        const hours = Math.floor(minutes / 60)
        const mins = Math.round(minutes % 60)
        return `${hours}小时${mins}分钟`
      }
      if (minutes < 1) {
        return '< 1分钟'
      }
      return `${Math.round(minutes)}分钟`
    }

    // 如果 API 尚未返回结果
    if (isLoadingRoute.value) return '计算中...'

    return '--'
  })

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

  // 清除导航数据
  const clearNavigationData = () => {
    routeData.value = null
    routePolyline.value = []
    userTrackPolyline.value = []
    currentNavigationInstruction.value = ''
    routeDistance.value = 0
    routeDuration.value = 0
  }

  return {
    // 状态
    routeData,
    routePolyline,
    userTrackPolyline,
    currentNavigationInstruction,
    routeDistance,
    routeDuration,
    isLoadingRoute,
    hasTarget,
    distanceToTarget,
    formatDistance,
    formatDuration,

    // 方法
    unzipPolyline,
    fetchWalkingRoute,
    parseNavigationInstructions,
    calculateBearing,
    calculateDistance,
    getNavigationSymbol,
    loadNavigationRoute,
    clearNavigationData
  }
}