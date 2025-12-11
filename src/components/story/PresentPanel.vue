<template>
  <view class="present-panel-container">
    <!-- 核心交互按钮：律动的圆形 -->
    <view class="present-btn-circle" @tap.stop="handlePresent">
      <text class="icon">🖐️</text>
      <text class="label">出示</text>
    </view>

    <!-- 提示横幅：国风卷轴 -->
    <view v-if="hint" class="hint-banner">
      <text class="hint-text">{{ hint }}</text>
    </view>
  </view>
</template>

<script setup lang="ts">
interface Props {
  hint?: string
}

const props = withDefaults(defineProps<Props>(), {
  hint: ''
})

const emit = defineEmits<{
  present: []
}>()

const handlePresent = () => {
  console.log('[举证面板] 用户点击出示证物')
  emit('present')
}
</script>

<style lang="scss" scoped>
/* 主容器：屏幕绝对居中 */
.present-panel-container {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 2000; /* 确保极高层级 */
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

/* 核心按钮：律动的圆环 */
.present-btn-circle {
  width: 180rpx;
  height: 180rpx;
  border-radius: 50%;
  background: rgba(30, 30, 30, 0.85);
  border: 4rpx solid rgba(212, 175, 55, 0.6); /* 暗金色 */
  box-shadow: 0 0 30rpx rgba(212, 175, 55, 0.3);
  backdrop-filter: blur(10rpx);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  animation: pulse-glow 2s infinite ease-in-out;
  transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);

  &:active {
    transform: scale(0.9);
    background: rgba(50, 50, 50, 0.95);
    box-shadow: 0 0 10rpx rgba(212, 175, 55, 0.5);
  }
}

.icon {
  font-size: 70rpx;
  margin-bottom: 8rpx;
  filter: drop-shadow(0 2rpx 4rpx rgba(0, 0, 0, 0.5));
}

.label {
  font-size: 24rpx;
  color: #D4AF37;
  font-weight: bold;
  letter-spacing: 4rpx;
  text-shadow: 0 2rpx 4rpx rgba(0, 0, 0, 0.8);
}

/* 提示横幅：国风卷轴效果 */
.hint-banner {
  margin-top: 40rpx;
  background: linear-gradient(90deg,
    transparent 0%,
    rgba(0, 0, 0, 0.8) 20%,
    rgba(0, 0, 0, 0.8) 80%,
    transparent 100%
  );
  padding: 12rpx 50rpx;
  border-top: 1rpx solid rgba(212, 175, 55, 0.3);
  border-bottom: 1rpx solid rgba(212, 175, 55, 0.3);
  position: relative;

  /* 装饰性边角 */
  &::before,
  &::after {
    content: '';
    position: absolute;
    top: 0;
    bottom: 0;
    width: 20rpx;
    background: linear-gradient(45deg,
      transparent 30%,
      rgba(212, 175, 55, 0.4) 50%,
      transparent 70%
    );
  }

  &::before {
    left: 0;
    transform: rotate(-180deg);
  }

  &::after {
    right: 0;
  }
}

.hint-text {
  color: #E0E0E0;
  font-size: 26rpx;
  font-family: 'SimSun', 'STSong', serif; /* 宋体，增强国风感 */
  text-align: center;
  text-shadow: 0 2rpx 4rpx rgba(0, 0, 0, 0.8);
  line-height: 1.6;
  letter-spacing: 1rpx;
}

/* 律动光晕动画 */
@keyframes pulse-glow {
  0% {
    box-shadow:
      0 0 20rpx rgba(212, 175, 55, 0.4),
      0 0 0 0 rgba(212, 175, 55, 0.4);
  }
  50% {
    box-shadow:
      0 0 40rpx rgba(212, 175, 55, 0.6),
      0 0 0 20rpx rgba(212, 175, 55, 0.1);
  }
  100% {
    box-shadow:
      0 0 20rpx rgba(212, 175, 55, 0.4),
      0 0 0 0 rgba(212, 175, 55, 0);
  }
}

/* 悬浮感微动画 */
.present-btn-circle {
  animation: pulse-glow 2s infinite ease-in-out,
             subtle-float 4s infinite ease-in-out;
}

@keyframes subtle-float {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10rpx);
  }
}
</style>