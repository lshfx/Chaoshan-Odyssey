<template>
  <view class="options-layer">
    <!-- 聚焦模式背景遮罩 -->
    <view class="focus-overlay"></view>

    <view
      v-for="(option, index) in options"
      :key="index"
      class="option-item"
      :style="{ 'animation-delay': `${index * 80}ms` }"
      @tap.stop="selectOption(option)"
    >
      {{ option.label }}
    </view>
  </view>
</template>

<script setup lang="ts">
// 接口定义
interface DialogueOption {
  label: string
  value: string
}

// Props 定义
interface Props {
  options: DialogueOption[]
}

defineProps<Props>()

// Emits 定义
const emit = defineEmits<{
  select: [option: DialogueOption]
}>()

// 方法
const selectOption = (option: DialogueOption) => {
  emit('select', option)
}
</script>

<style lang="scss" scoped>
// 选项层 - 居中顶部布局
.options-layer {
  position: absolute; // 绝对定位，相对于整个overlay
  left: 50%;
  transform: translateX(-50%); // 水平居中
  top: 30%; // 位于屏幕上三分之一处
  z-index: 100;
  width: 80%; // 固定相对宽度
  max-width: 600rpx; // 防止在平板上过宽
  display: flex;
  flex-direction: column; // 垂直排列
  align-items: center; // 居中对齐选项
}

// 聚焦模式背景遮罩
.focus-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.25); // 更淡的遮罩，不干扰视觉
  z-index: -1; // 在选项后面
  backdrop-filter: blur(2rpx);
}

.option-item {
  width: 100%; // 填满容器宽度
  background: rgba(255, 252, 245, 0.9); // 更透明的米纸色
  border: 2rpx solid #BFA46F; // 暖金色边框
  color: #333; // 深灰色文字
  padding: 24rpx 30rpx; // 适当的内边距
  border-radius: 8rpx; // 轻微圆角
  font-size: 28rpx;
  font-weight: 500;
  font-family: 'PingFang SC', 'Microsoft YaHei', sans-serif;
  text-align: center; // 文字居中对齐
  transition: all 0.3s ease;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.1); // 轻微阴影
  backdrop-filter: blur(8rpx);
  animation: fadeInDown 0.5s ease-out forwards;
  opacity: 0;
  transform: translateY(-20rpx); // 从上方滑入
  margin: 10rpx 0; // 按钮间距
  word-wrap: break-word; // 确保长文本正确换行
  word-break: break-all; // 处理长单词
  position: relative;

  // 移除装饰元素，简化设计
  &::after {
    display: none;
  }

  &::before {
    display: none;
  }

  &:active {
    background: #00897B; // 青色激活状态
    border-color: #00897B;
    color: white;
    transform: translateY(0) scale(0.98); // 轻微缩放
    box-shadow: 0 2rpx 8rpx rgba(0, 137, 123, 0.3);
  }
}

// 从上方淡入动画
@keyframes fadeInDown {
  from {
    opacity: 0;
    transform: translateY(-20rpx);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>