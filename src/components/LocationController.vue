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
      <view class="minimize-btn" @tap="toggleController">−</view>
    </view>

    <!-- 当前位置显示 -->
    <view class="current-location">
      <text class="location-label">当前位置：</text>
      <text class="location-coords">
        {{ userLocation.latitude.toFixed(4) }}, {{ userLocation.longitude.toFixed(4) }}
      </text>
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

    <!-- 预设位置按钮 -->
    <view class="preset-locations">
      <view
        class="preset-btn"
        v-for="location in presetLocations"
        :key="location.id"
        @tap="moveToPreset(location)"
      >
        <text class="preset-icon">{{ location.icon }}</text>
        <text class="preset-name">{{ location.name }}</text>
      </view>
    </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useGameStore } from '@/stores/useGameStore'

const gameStore = useGameStore()
const userLocation = ref(gameStore.userLocation)
const isCollapsed = ref(true) // 默认收折状态

// 预设位置
const presetLocations = [
  {
    id: 'confucian_temple',
    name: '揭阳学宫',
    latitude: 23.5436,
    longitude: 116.3683,
    icon: '🏛️'
  },
  {
    id: 'jinxian_gate',
    name: '进贤门',
    latitude: 23.5360,
    longitude: 116.3560,
    icon: '🚪'
  },
  {
    id: 'lion_culture',
    name: '青狮文化区',
    latitude: 23.5338,
    longitude: 116.3715,
    icon: '🦁'
  },
  {
    id: 'kungfu_tea',
    name: '功夫茶馆',
    latitude: 23.5316,
    longitude: 116.3642,
    icon: '🍵'
  }
]

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
  gameStore.updateUserLocation(23.5360, 116.3560)
  userLocation.value = gameStore.userLocation
}

// 移动到预设位置
const moveToPreset = (location: any) => {
  gameStore.updateUserLocation(location.latitude, location.longitude)
  userLocation.value = gameStore.userLocation

  // 同时设置为目标位置，方便测试
  gameStore.setTargetLocation(location.latitude, location.longitude, location.name)

  uni.showToast({
    title: `已传送到${location.name}`,
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
    width: 320rpx;
    background: rgba(0, 0, 0, 0.85);
    border-radius: 16rpx;
    padding: 20rpx;
    backdrop-filter: blur(10rpx);
    border: 1rpx solid rgba(255, 255, 255, 0.1);
    animation: slideIn 0.3s ease;

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
        font-size: 24rpx;
        font-weight: bold;
      }

      .minimize-btn {
        width: 32rpx;
        height: 32rpx;
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
  }

      .current-location {
      margin-bottom: 20rpx;

      .location-label {
        color: #AAAAAA;
        font-size: 20rpx;
        display: block;
        margin-bottom: 5rpx;
      }

      .location-coords {
        color: #FFFFFF;
        font-size: 18rpx;
        font-family: monospace;
        display: block;
      }
    }

    .direction-controls {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 8rpx;
      margin-bottom: 20rpx;

      .direction-btn {
        width: 80rpx;
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

    .preset-locations {
      display: flex;
      flex-direction: column;
      gap: 8rpx;

      .preset-btn {
        background: rgba(255, 255, 255, 0.1);
        border: 1rpx solid rgba(255, 255, 255, 0.2);
        border-radius: 8rpx;
        padding: 12rpx 16rpx;
        display: flex;
        align-items: center;
        cursor: pointer;
        transition: all 0.2s ease;

        &:active {
          background: rgba(255, 255, 255, 0.2);
          transform: translateX(5rpx);
        }

        .preset-icon {
          font-size: 20rpx;
          margin-right: 12rpx;
          color: #FFFFFF;
        }

        .preset-name {
          color: #FFFFFF;
          font-size: 20rpx;
        }
      }
    }
  }
}
</style>