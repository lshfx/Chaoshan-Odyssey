<template>
  <view class="navbar-container">
    <!-- 导航栏占位符 - 为固定定位的导航栏留出空间 -->
    <view
      v-if="isFixed"
      class="navbar-spacer"
      :style="{ height: totalHeight + 'px' }"
    ></view>

    <!-- 固定定位的导航栏 -->
    <view class="custom-navbar" :class="{ 'fixed-navbar': isFixed }">
      <!-- 状态栏占位符 -->
      <view class="status-bar" :style="{ height: statusBarHeight + 'px' }"></view>

      <!-- 导航栏内容区 -->
      <view class="nav-content" :style="{ backgroundColor: bgColor }">
        <!-- 左侧插槽 (返回按钮等) -->
        <view class="nav-left">
          <slot name="left">
            <view v-if="showBack" class="back-btn" @tap="goBack">
              <text class="back-icon">‹</text>
            </view>
          </slot>
        </view>

        <!-- 标题区域 -->
        <view class="nav-title">
          <text class="title-text" :style="{ color: textColor }">{{ title }}</text>
        </view>

        <!-- 右侧插槽 (搜索图标等) -->
        <view class="nav-right">
          <slot name="right"></slot>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'

// Props 定义
interface Props {
  title?: string
  bgColor?: string
  textColor?: string
  showBack?: boolean
  isFixed?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  title: '',
  bgColor: 'transparent',
  textColor: '#fff',
  showBack: true,
  isFixed: true
})

// 响应式数据
const statusBarHeight = ref(0)
const navbarHeight = ref(0)

// 计算属性
const totalHeight = computed(() => {
  return statusBarHeight.value + 44 // 44px 标准导航栏高度
})

const effectiveBgColor = computed(() => {
  return props.bgColor === 'transparent' ? 'rgba(0, 0, 0, 0)' : props.bgColor
})

// 方法
const getSystemInfo = () => {
  try {
    const systemInfo = uni.getSystemInfoSync()
    statusBarHeight.value = systemInfo.statusBarHeight || 0
    // UniApp 导航栏标准高度为 44px
    navbarHeight.value = statusBarHeight.value + 44

    console.log('System info:', {
      statusBarHeight: statusBarHeight.value,
      navbarHeight: navbarHeight.value
    })
  } catch (error) {
    console.error('获取系统信息失败:', error)
    // 设置默认值
    statusBarHeight.value = 44 // iOS 状态栏高度
    navbarHeight.value = 88 // 44 + 44
  }
}

const goBack = () => {
  uni.navigateBack({
    delta: 1
  })
}

onMounted(() => {
  getSystemInfo()
})

// 暴露给父组件
defineExpose({
  statusBarHeight,
  navbarHeight,
  totalHeight
})
</script>

<style lang="scss" scoped>
.navbar-container {
  width: 100%;
}

.navbar-spacer {
  width: 100%;
  background: transparent;
}

.custom-navbar {
  width: 100%;

  &.fixed-navbar {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    z-index: 999;
  }
}

.status-bar {
  width: 100%;
  background: v-bind(effectiveBgColor);
  position: relative;
  z-index: 1;
}

.nav-content {
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20rpx;
  position: relative;
  z-index: 1;

  // 添加微妙的边框
  &::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 1rpx;
    background: rgba(255, 255, 255, 0.1);
  }
}

.nav-left,
.nav-right {
  min-width: 80rpx;
  height: 44px;
  display: flex;
  align-items: center;
}

.nav-left {
  justify-content: flex-start;
}

.nav-right {
  justify-content: flex-end;
}

.nav-title {
  flex: 1;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 20rpx;
}

.title-text {
  font-size: 36rpx;
  font-weight: 600;
  font-family: 'PingFang SC', 'Microsoft YaHei', sans-serif;
  text-align: center;
  // 添加文字阴影增强可读性
  text-shadow: 0 1rpx 3rpx rgba(0, 0, 0, 0.1);
}

.back-btn {
  width: 60rpx;
  height: 60rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.2s ease;

  &:active {
    background: rgba(255, 255, 255, 0.1);
    transform: scale(0.95);
  }
}

.back-icon {
  font-size: 48rpx;
  color: v-bind(textColor);
  font-weight: bold;
  line-height: 1;
}

// 右侧插槽内容样式
:deep(.right-slot-content) {
  width: 60rpx;
  height: 60rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.2s ease;
  color: v-bind(textColor);
  font-size: 32rpx;

  &:active {
    background: rgba(255, 255, 255, 0.1);
    transform: scale(0.95);
  }
}
</style>