<template>
  <!-- 收折状态：悬浮按钮 -->
  <view v-if="isCollapsed" class="location-controller collapsed">
    <view class="floating-btn" @tap="toggleController">
      <text class="floating-icon">🕹️</text>
    </view>
  </view>

  <!-- 展开状态：完整控制面板 -->
  <view v-else class="location-controller expanded">
    <view class="controller-header">
      <text class="controller-title">位置控制器</text>
      <view class="close-btn" @tap="toggleController">×</view>
    </view>

    <!-- 当前位置显示 -->
    <view class="current-location">
      <text class="location-label">当前位置：</text>
      <text class="location-coords">
        {{ userLocation.latitude.toFixed(4) }}, {{ userLocation.longitude.toFixed(4) }}
      </text>
    </view>

    <!-- 城市信息 -->
    <view class="city-info">
      <text class="city-name">{{ currentCityData.cityName }} ({{ currentPois.length }}个地点)</text>
    </view>

    <!-- 方向控制按钮 -->
    <view class="direction-controls">
      <view></view>
      <view class="direction-btn up-btn" @tap="moveLocation(0, 1)">↑</view>
      <view></view>

      <view class="direction-btn left-btn" @tap="moveLocation(-1, 0)">←</view>
      <view class="direction-btn center-btn" @tap="moveToCenter">⊙</view>
      <view class="direction-btn right-btn" @tap="moveLocation(1, 0)">→</view>

      <view></view>
      <view class="direction-btn down-btn" @tap="moveLocation(0, -1)">↓</view>
      <view></view>
    </view>

    <!-- 动态POI传送按钮 -->
    <view class="poi-section">
      <text class="section-title">快速传送</text>
      <scroll-view class="poi-list" scroll-y="true">
        <view
          class="poi-btn"
          v-for="poi in currentPois"
          :key="poi.id"
          @tap="teleportToPOI(poi)"
        >
          <view class="poi-info">
            <text class="poi-name">{{ poi.name }}</text>
            <text class="poi-desc">{{ poi.description || '快速传送' }}</text>
          </view>
          <text class="poi-arrow">→</text>
        </view>

        <!-- 无数据提示 -->
        <view v-if="currentPois.length === 0" class="no-pois-tip">
          <text class="tip-text">当前城市暂无可用地点</text>
        </view>
      </scroll-view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useGameStore } from '@/stores/useGameStore'
import { gameData } from '@/mock/gameData'

const gameStore = useGameStore()
const userLocation = ref(gameStore.userLocation)
const isCollapsed = ref(true) // 默认收折状态

// 引入游戏数据
// 获取当前城市数据
const currentCityData = computed(() => {
  const cityId = gameStore.currentCity
  return gameData[cityId as keyof typeof gameData] || gameData.jieyang
})

// 计算当前城市的POI列表
const currentPois = computed(() => {
  const cityId = gameStore.currentCity
  const cityData = gameData[cityId as keyof typeof gameData]

  if (!cityData || !cityData.pois) {
    return []
  }

  return cityData.pois.filter(poi => poi.latitude && poi.longitude)
})

// 移动位置（微调）
const moveLocation = (deltaLng: number, deltaLat: number) => {
  const stepSize = 0.0001 // 约11米的经纬度步长
  const newLat = userLocation.value.latitude + deltaLat * stepSize
  const newLng = userLocation.value.longitude + deltaLng * stepSize

  gameStore.updateUserLocation(newLat, newLng)
  userLocation.value = gameStore.userLocation
}

// 移动到中心
const moveToCenter = () => {
  // 使用当前城市的第一个POI作为中心点，如果没有则使用默认坐标
  const defaultCenter = {
    latitude: 23.5360,
    longitude: 116.3560
  }

  if (currentPois.value.length > 0) {
    const firstPoi = currentPois.value[0]
    gameStore.updateUserLocation(firstPoi.latitude, firstPoi.longitude)
  } else {
    gameStore.updateUserLocation(defaultCenter.latitude, defaultCenter.longitude)
  }

  userLocation.value = gameStore.userLocation
}

// 传送到指定POI
const teleportToPOI = (poi: any) => {
  if (!poi || !poi.latitude || !poi.longitude) {
    uni.showToast({
      title: '该地点无法传送',
      icon: 'none'
    })
    return
  }

  gameStore.updateUserLocation(poi.latitude, poi.longitude)
  userLocation.value = gameStore.userLocation

  // 设置为目标位置
  gameStore.setTargetLocation(poi.latitude, poi.longitude, poi.name)

  uni.showToast({
    title: `已传送到${poi.name}`,
    icon: 'success'
  })
}

// 显示/隐藏控制器
const toggleController = () => {
  isCollapsed.value = !isCollapsed.value
}
</script>

<style lang="scss" scoped>
.location-controller {
  z-index: 100;

  // 收折状态：悬浮按钮
  &.collapsed {
    position: fixed;
    left: 20px;
    bottom: 100px;

    .floating-btn {
      width: 80rpx;
      height: 80rpx;
      background: rgba(0, 0, 0, 0.85);
      border-radius: 50%;
      backdrop-filter: blur(10rpx);
      border: 1rpx solid rgba(255, 255, 255, 0.1);
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.3s ease;
      box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.3);

      &:active {
        transform: scale(0.9);
        background: rgba(0, 0, 0, 0.95);
      }

      .floating-icon {
        font-size: 32rpx;
        color: #FFFFFF;
      }
    }
  }

  // 展开状态：完整控制面板
  &.expanded {
    position: fixed;
    left: 30rpx;
    bottom: 200rpx; // 为tabbar留出空间
    width: 350rpx;
    max-height: 60vh;
    background: rgba(0, 0, 0, 0.9);
    border-radius: 16rpx;
    padding: 20rpx;
    backdrop-filter: blur(10rpx);
    border: 1rpx solid rgba(255, 255, 255, 0.1);
    animation: slideIn 0.3s ease;
    overflow: hidden;

    @keyframes slideIn {
      from {
        opacity: 0;
        transform: translateY(20rpx);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .controller-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 15rpx;

      .controller-title {
        color: #FFFFFF;
        font-size: 28rpx;
        font-weight: bold;
      }

      .close-btn {
        width: 36rpx;
        height: 36rpx;
        background: rgba(255, 255, 255, 0.2);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #FFFFFF;
        font-size: 24rpx;
        font-weight: bold;
        cursor: pointer;
        transition: all 0.2s ease;

        &:active {
          background: rgba(255, 255, 255, 0.3);
          transform: scale(0.9);
        }
      }
    }

    .current-location {
      margin-bottom: 15rpx;
      padding-bottom: 15rpx;
      border-bottom: 1rpx solid rgba(255, 255, 255, 0.1);

      .location-label {
        color: #AAAAAA;
        font-size: 22rpx;
        display: block;
        margin-bottom: 5rpx;
      }

      .location-coords {
        color: #FFFFFF;
        font-size: 20rpx;
        font-family: monospace;
        display: block;
      }
    }

    .city-info {
      margin-bottom: 20rpx;

      .city-name {
        color: #00897B;
        font-size: 24rpx;
        font-weight: 500;
        display: block;
      }
    }

    .direction-controls {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 8rpx;
      margin-bottom: 20rpx;

      .direction-btn {
        width: 90rpx;
        height: 60rpx;
        background: rgba(255, 255, 255, 0.1);
        border: 1rpx solid rgba(255, 255, 255, 0.2);
        border-radius: 8rpx;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #FFFFFF;
        font-size: 24rpx;
        cursor: pointer;
        transition: all 0.2s ease;

        &:active {
          background: rgba(255, 255, 255, 0.2);
          transform: scale(0.95);
        }

        &.center-btn {
          background: rgba(0, 137, 123, 0.6);
          border-color: #00897B;
          font-size: 20rpx;

          &:active {
            background: rgba(0, 137, 123, 0.8);
          }
        }
      }
    }

    .poi-section {
      flex: 1;
      overflow: hidden;

      .section-title {
        color: #FFFFFF;
        font-size: 24rpx;
        font-weight: bold;
        margin-bottom: 10rpx;
        display: block;
      }

      .poi-list {
        max-height: 200rpx;
        overflow-y: auto;

        .poi-btn {
          background: rgba(255, 255, 255, 0.1);
          border: 1rpx solid rgba(255, 255, 255, 0.2);
          border-radius: 8rpx;
          padding: 15rpx;
          margin-bottom: 8rpx;
          display: flex;
          align-items: center;
          justify-content: space-between;
          cursor: pointer;
          transition: all 0.2s ease;

          &:active {
            background: rgba(255, 255, 255, 0.2);
            transform: translateX(5rpx);
          }

          .poi-info {
            flex: 1;

            .poi-name {
              color: #FFFFFF;
              font-size: 24rpx;
              font-weight: 500;
              display: block;
              margin-bottom: 4rpx;
            }

            .poi-desc {
              color: #CCCCCC;
              font-size: 20rpx;
              display: block;
              overflow: hidden;
              text-overflow: ellipsis;
              white-space: nowrap;
            }
          }

          .poi-arrow {
            color: #00897B;
            font-size: 24rpx;
            font-weight: bold;
            margin-left: 15rpx;
          }
        }

        .no-pois-tip {
          text-align: center;
          padding: 30rpx 20rpx;

          .tip-text {
            color: #CCCCCC;
            font-size: 22rpx;
            display: block;
          }
        }
      }
    }
  }
}

/* 滚动条样式 */
.poi-list::-webkit-scrollbar {
  width: 6rpx;
}

.poi-list::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 3rpx;
}

.poi-list::-webkit-scrollbar-thumb {
  background: rgba(0, 137, 123, 0.6);
  border-radius: 3rpx;
}
</style>