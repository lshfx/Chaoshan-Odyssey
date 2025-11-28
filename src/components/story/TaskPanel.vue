<template>
  <view class="task-layer">
    <!-- 聚焦模式背景遮罩 -->
    <view class="focus-overlay"></view>

    <!-- 任务面板 -->
    <view class="task-panel">
      <!-- 任务描述 -->
      <view class="task-header">
        <text class="task-title">{{ getTaskTitle() }}</text>
      </view>

      <view class="task-description">
        <text class="description-text">{{ task.description }}</text>
      </view>

      <!-- 问题模式 - 显示选项 -->
      <view v-if="task.type === 'question' && task.options" class="task-options">
        <view
          v-for="(option, index) in task.options"
          :key="index"
          class="task-option"
          :style="{ 'animation-delay': `${index * 80}ms` }"
          @tap.stop="handleQuestionAnswer(option)"
        >
          {{ option }}
        </view>
      </view>

      <!-- 动作模式 - 显示单个按钮 -->
      <view v-else-if="task.type === 'action'" class="task-action">
        <view class="action-button" @tap.stop="handleActionTask">
          <text class="action-text">{{ getActionButtonText() }}</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
// 接口定义
interface Task {
  type: 'question' | 'action'
  description: string
  options?: string[] // 问题选项
  correctOption?: string | number // 正确答案（索引或值）
  actionText?: string // 动作按钮自定义文本
}

// Props 定义
interface Props {
  task: Task
}

const props = defineProps<Props>()

// Emits 定义
const emit = defineEmits<{
  complete: [success: boolean, result?: any]
}>()

// 方法
const getTaskTitle = () => {
  switch (props.task.type) {
    case 'question':
      return '❓ 回答问题'
    case 'action':
      return '🎯 执行动作'
    default:
      return '📋 任务'
  }
}

const getActionButtonText = () => {
  return props.task.actionText || '执行'
}

const handleQuestionAnswer = (selectedOption: string) => {
  let isCorrect = false

  if (props.task.correctOption !== undefined) {
    // 检查正确答案
    if (typeof props.task.correctOption === 'number') {
      // 正确答案是索引
      isCorrect = props.task.options?.[props.task.correctOption] === selectedOption
    } else {
      // 正确答案是值
      isCorrect = selectedOption === props.task.correctOption
    }
  }

  // 显示结果提示
  if (isCorrect) {
    uni.showToast({
      title: '✅ 回答正确！',
      icon: 'success',
      duration: 1500
    })
  } else {
    uni.showToast({
      title: '❌ 回答错误，再想想',
      icon: 'error',
      duration: 1500
    })
  }

  // 发出完成事件
  emit('complete', isCorrect, { selectedOption, isCorrect })
}

const handleActionTask = () => {
  // 动作任务默认成功
  uni.showToast({
    title: '✅ 动作完成！',
    icon: 'success',
    duration: 1500
  })

  emit('complete', true, { action: 'completed' })
}
</script>

<style lang="scss" scoped>
// 任务层 - 居中布局
.task-layer {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  z-index: 150; // 比选项层更高
  width: 85%;
  max-width: 650rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
}

// 聚焦模式背景遮罩
.focus-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  z-index: -1;
  backdrop-filter: blur(5rpx);
}

// 任务面板主体
.task-panel {
  width: 100%;
  background: linear-gradient(135deg, rgba(255, 252, 245, 0.95) 0%, rgba(250, 248, 240, 0.95) 100%);
  border-radius: 16rpx;
  box-shadow: 0 8rpx 32rpx rgba(0, 0, 0, 0.15);
  backdrop-filter: blur(10rpx);
  border: 3rpx solid #BFA46F;
  overflow: hidden;
  animation: taskSlideIn 0.4s ease-out;
}

// 滑入动画
@keyframes taskSlideIn {
  from {
    opacity: 0;
    transform: translateY(-30rpx) scale(0.9);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

// 任务标题区域
.task-header {
  background: linear-gradient(135deg, #BFA46F 0%, #A68B5B 100%);
  padding: 20rpx 30rpx;
  text-align: center;
  border-bottom: 2rpx solid rgba(191, 164, 111, 0.3);
}

.task-title {
  font-size: 32rpx;
  font-weight: bold;
  color: white;
  text-shadow: 0 2rpx 4rpx rgba(0, 0, 0, 0.3);
  font-family: 'PingFang SC', 'Microsoft YaHei', sans-serif;
}

// 任务描述区域
.task-description {
  padding: 30rpx;
  text-align: center;
  border-bottom: 1rpx solid rgba(191, 164, 111, 0.2);
}

.description-text {
  font-size: 28rpx;
  line-height: 1.6;
  color: #333;
  font-weight: 500;
}

// 问题选项区域
.task-options {
  padding: 20rpx;
  display: flex;
  flex-direction: column;
  gap: 15rpx;
}

.task-option {
  background: rgba(255, 255, 255, 0.8);
  border: 2rpx solid #BFA46F;
  color: #333;
  padding: 20rpx 25rpx;
  border-radius: 12rpx;
  font-size: 26rpx;
  font-weight: 500;
  text-align: center;
  transition: all 0.3s ease;
  box-shadow: 0 3rpx 10rpx rgba(0, 0, 0, 0.1);
  animation: optionFadeIn 0.5s ease-out forwards;
  opacity: 0;
  transform: translateY(-10rpx);
  cursor: pointer;
  position: relative;

  &::after {
    content: '';
    position: absolute;
    left: 15rpx;
    top: 50%;
    transform: translateY(-50%);
    width: 8rpx;
    height: 8rpx;
    background: #BFA46F;
    border-radius: 50%;
  }

  &:active {
    background: #00897B;
    border-color: #00897B;
    color: white;
    transform: translateY(0) scale(0.98);
    box-shadow: 0 2rpx 8rpx rgba(0, 137, 123, 0.3);

    &::after {
      background: white;
    }
  }
}

// 动作按钮区域
.task-action {
  padding: 20rpx;
  display: flex;
  justify-content: center;
}

.action-button {
  background: linear-gradient(135deg, #00897B 0%, #00695C 100%);
  border: none;
  color: white;
  padding: 25rpx 50rpx;
  border-radius: 25rpx;
  font-size: 30rpx;
  font-weight: bold;
  text-align: center;
  transition: all 0.3s ease;
  box-shadow: 0 6rpx 20rpx rgba(0, 137, 123, 0.4);
  cursor: pointer;
  animation: actionPulse 2s ease-in-out infinite;
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
    transition: left 0.6s ease;
  }

  &:active {
    transform: scale(0.95);
    box-shadow: 0 3rpx 12rpx rgba(0, 137, 123, 0.6);

    &::before {
      left: 100%;
    }
  }
}

.action-text {
  position: relative;
  z-index: 1;
  text-shadow: 0 2rpx 4rpx rgba(0, 0, 0, 0.3);
}

// 选项淡入动画
@keyframes optionFadeIn {
  from {
    opacity: 0;
    transform: translateY(-10rpx);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

// 动作按钮脉冲动画
@keyframes actionPulse {
  0%, 100% {
    box-shadow: 0 6rpx 20rpx rgba(0, 137, 123, 0.4);
  }
  50% {
    box-shadow: 0 8rpx 25rpx rgba(0, 137, 123, 0.6);
  }
}

// 小屏幕适配
@media screen and (max-width: 750rpx) {
  .task-layer {
    width: 90%;
  }

  .task-title {
    font-size: 28rpx;
  }

  .description-text {
    font-size: 26rpx;
  }

  .task-option {
    font-size: 24rpx;
    padding: 18rpx 22rpx;
  }

  .action-text {
    font-size: 28rpx;
  }
}
</style>