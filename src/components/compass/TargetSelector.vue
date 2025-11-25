<template>
  <view v-if="visible" class="target-selector-overlay" @tap="handleOverlayTap">
    <view class="target-selector" @tap.stop>
      <view class="selector-header">
        <text class="selector-title">选择导航目标</text>
        <view class="close-btn" @tap="handleClose">×</view>
      </view>

      <scroll-view class="poi-list" scroll-y="true">
        <view
          v-for="poi in pois"
          :key="poi.id"
          class="poi-item"
          :class="{ 'selected': poi.id === currentId }"
          @tap="handleSelect(poi)"
        >
          <view class="poi-info">
            <text class="poi-name">{{ poi.name }}</text>
            <text class="poi-distance">{{ calculateDistance(poi) }}米</text>
          </view>
          <view class="poi-icon">{{ poi.icon || '📍' }}</view>
        </view>
      </scroll-view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { useGameStore } from '@/stores/useGameStore'

interface POI {
  id: string
  name: string
  latitude: number
  longitude: number
  icon?: string
}

interface Props {
  visible: boolean
  pois: POI[]
  currentId?: string
}

interface Emits {
  (e: 'update:visible', value: boolean): void
  (e: 'select', poi: POI): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const gameStore = useGameStore()

const handleOverlayTap = () => {
  emit('update:visible', false)
}

const handleClose = () => {
  emit('update:visible', false)
}

const handleSelect = (poi: POI) => {
  emit('select', poi)
  emit('update:visible', false)
}

const calculateDistance = (poi: POI): number => {
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
</script>

<style lang="scss" scoped>
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
  width: 100%;
  box-sizing: border-box;

  .selector-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 30px;
    box-sizing: border-box;

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
    width: 100%;
    max-height: 60vh;
    padding: 0 30rpx; // 给左右留出空隙，不要贴边
    overflow-y: auto;
    box-sizing: border-box;

    .poi-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 24rpx 32rpx; // 增加卡片内部呼吸感
      border-radius: 16px;
      margin-bottom: 16rpx;
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
        min-width: 0; // 关键：防止文本溢出撑开容器
        margin-right: 20rpx;

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
        flex-shrink: 0; // 关键：图标永不缩小
        font-size: 36rpx;
        width: 40rpx;
        text-align: center;
        margin-left: 20rpx; // 跟文字保持距离
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
</style>