<template>
  <view class="ending-overlay" @tap.stop>
    <!-- 深色半透明遮罩 -->
    <view class="ending-mask" />

    <!-- 结局卡片容器 -->
    <view class="ending-card">
      <!-- 结局图片 -->
      <image
        v-if="ending.imageUrl"
        :src="ending.imageUrl"
        class="ending-image"
        mode="aspectFill"
      />

      <!-- 内容区域 -->
      <view class="ending-content">
        <!-- 结局标题 -->
        <view class="ending-title-wrapper">
          <text class="ending-title">{{ ending.title }}</text>
        </view>

        <!-- 成就奖章区域 -->
        <view class="achievement-section">
          <view class="achievement-icon">🏆</view>
          <text class="achievement-text">解锁成就：{{ ending.achievement }}</text>
        </view>

        <!-- 结局描述 -->
        <view class="description-section">
          <text class="description-text">{{ ending.description }}</text>
        </view>

        <!-- 详细背景故事（如果存在） -->
        <view v-if="ending.background" class="background-section">
          <text class="background-text">{{ ending.background }}</text>
        </view>
      </view>

      <!-- 底部按钮 -->
      <view class="action-section">
        <button class="complete-button" @tap="handleComplete">
          完成剧情
        </button>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import type { StoryEnding } from '@/mock/types'

// Props 定义
interface Props {
  ending: StoryEnding
}

const props = defineProps<Props>()

// Emits 定义
const emit = defineEmits<{
  close: []
}>()

// 方法
const handleComplete = () => {
  emit('close')
}
</script>

<style lang="scss" scoped>
// 全屏覆盖容器
.ending-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1500; // 确保在所有内容之上
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 60rpx;
}

// 深色半透明遮罩
.ending-mask {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.85);
  backdrop-filter: blur(15rpx);
}

// 结局卡片容器
.ending-card {
  position: relative;
  width: 100%;
  max-width: 680rpx;
  background: linear-gradient(135deg, #2a1810 0%, #1a0f08 100%);
  border-radius: 32rpx;
  overflow: hidden;
  box-shadow:
    0 20rpx 60rpx rgba(0, 0, 0, 0.8),
    0 0 0 2rpx rgba(218, 165, 32, 0.3),
    inset 0 0 40rpx rgba(218, 165, 32, 0.1);
  animation: cardSlideIn 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
}

// 卡片入场动画
@keyframes cardSlideIn {
  0% {
    opacity: 0;
    transform: scale(0.8) translateY(100rpx);
  }
  100% {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

// 结局图片
.ending-image {
  width: 100%;
  height: 360rpx;
  object-fit: cover;
  border-bottom: 2rpx solid rgba(218, 165, 32, 0.4);
}

// 内容区域
.ending-content {
  padding: 60rpx 50rpx 40rpx;
}

// 结局标题区域
.ending-title-wrapper {
  margin-bottom: 40rpx;
  text-align: center;
}

.ending-title {
  font-size: 48rpx;
  font-weight: 700;
  color: #daa520; // 金色
  text-shadow:
    0 2rpx 8rpx rgba(0, 0, 0, 0.6),
    0 0 20rpx rgba(218, 165, 32, 0.3);
  letter-spacing: 4rpx;
  font-family: 'KaiTi', 'STKaiti', '楷体', serif; // 楷体字体，更古典
}

// 成就奖章区域
.achievement-section {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 40rpx;
  padding: 20rpx 30rpx;
  background: linear-gradient(135deg, rgba(218, 165, 32, 0.15) 0%, rgba(255, 215, 0, 0.05) 100%);
  border: 1rpx solid rgba(218, 165, 32, 0.3);
  border-radius: 50rpx;
}

.achievement-icon {
  font-size: 32rpx;
  margin-right: 16rpx;
}

.achievement-text {
  font-size: 28rpx;
  color: #daa520;
  font-weight: 600;
  letter-spacing: 2rpx;
}

// 描述区域
.description-section {
  margin-bottom: 30rpx;
}

.description-text {
  font-size: 30rpx;
  color: #e8d5b7; // 米色
  line-height: 1.8;
  text-align: center;
  font-weight: 500;
}

// 详细背景故事区域
.background-section {
  padding: 25rpx;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 20rpx;
  border-left: 4rpx solid rgba(218, 165, 32, 0.5);
}

.background-text {
  font-size: 26rpx;
  color: #c4b5a0; // 浅棕色
  line-height: 1.7;
  font-style: italic;
}

// 操作按钮区域
.action-section {
  padding: 30rpx 50rpx 50rpx;
}

.complete-button {
  width: 100%;
  height: 88rpx;
  background: linear-gradient(135deg, #d4af37 0%, #b8941f 100%);
  border: none;
  border-radius: 44rpx;
  color: #1a0f08;
  font-size: 32rpx;
  font-weight: 700;
  letter-spacing: 4rpx;
  box-shadow:
    0 8rpx 24rpx rgba(212, 175, 55, 0.4),
    inset 0 1rpx 0 rgba(255, 255, 255, 0.2);
  transition: all 0.3s ease;

  &:active {
    transform: scale(0.96);
    box-shadow:
      0 4rpx 16rpx rgba(212, 175, 55, 0.3),
      inset 0 1rpx 0 rgba(255, 255, 255, 0.1);
  }

  &::after {
    border: none; // 移除小程序默认边框
  }
}

// 响应式设计 - 小屏幕适配
@media (max-width: 750rpx) {
  .ending-overlay {
    padding: 40rpx;
  }

  .ending-card {
    max-width: 100%;
  }

  .ending-content {
    padding: 40rpx 30rpx 30rpx;
  }

  .ending-title {
    font-size: 40rpx;
  }

  .action-section {
    padding: 20rpx 30rpx 30rpx;
  }
}
</style>