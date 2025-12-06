<template>
  <!-- 任务面板容器 -->
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

  <!-- Pose Scanner 全屏界面 - 独立于 task-layer -->
  <view v-if="showPoseScanner" class="pose-scanner-overlay">
    <!-- 网格背景 -->
    <view class="grid-background">
      <view class="grid-lines"></view>
    </view>

    <!-- 扫描界面主体 -->
    <view class="scanner-content">
      <!-- 取景框 -->
      <view class="viewfinder">
        <!-- 四角装饰 -->
        <view class="corner top-left"></view>
        <view class="corner top-right"></view>
        <view class="corner bottom-left"></view>
        <view class="corner bottom-right"></view>

        <!-- 扫描线 -->
        <view v-if="scanStatus === 'scanning'" class="scan-line"></view>

        <!-- 分析数据显示 -->
        <view v-if="scanStatus === 'scanning'" class="analysis-data">
          <text
            v-for="(data, index) in analysisTexts"
            :key="index"
            class="data-text"
            :style="{
              left: data.x + '%',
              top: data.y + '%',
              animationDelay: data.delay + 'ms'
            }"
          >
            {{ data.text }}
          </text>
        </view>
      </view>

      <!-- 提示文案 -->
      <view class="scan-hint">
        <text v-if="scanStatus === 'idle'">{{ task.description }}</text>
        <text v-else-if="scanStatus === 'scanning'" class="scanning-text">正在采集动作数据...</text>
        <text v-else-if="scanStatus === 'success'" class="success-text">✅ 动作判定通过</text>
      </view>

      <!-- 操作按钮 -->
      <view v-if="scanStatus === 'idle'" class="scan-button-wrapper">
        <view class="scan-button" @tap="startScanning">
          <text class="scan-button-text">采集动作</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'

// 接口定义
interface Task {
  type: 'question' | 'action'
  description: string
  options?: string[] // 问题选项
  correctOption?: string | number // 正确答案（索引或值）
  actionText?: string // 动作按钮自定义文本
  actionType?: string // 动作类型，如 'pose_simulation'
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

// 响应式状态
const showPoseScanner = ref(false)
const scanStatus = ref<'idle' | 'scanning' | 'success'>('idle')

// 分析数据文本
const analysisTexts = reactive([
  { text: 'Bone logic: OK', x: 15, y: 25, delay: 0 },
  { text: 'Angle: 87°', x: 75, y: 35, delay: 200 },
  { text: 'Position: Locked', x: 20, y: 65, delay: 400 },
  { text: 'Balance: 92%', x: 80, y: 70, delay: 600 },
  { text: 'Center: Stable', x: 50, y: 45, delay: 800 },
  { text: 'Posture: Matched', x: 25, y: 80, delay: 1000 },
  { text: 'Depth: 1.2m', x: 70, y: 20, delay: 1200 },
  { text: 'Sync: 98%', x: 35, y: 55, delay: 1400 }
])

// 方法
const getTaskTitle = () => {
  switch (props.task.type) {
    case 'question':
      return '❓ 回答问题'
    case 'action':
      return props.task.actionType === 'pose_simulation' ? '🤖 姿势采集' : '🎯 执行动作'
    default:
      return '📋 任务'
  }
}

const getActionButtonText = () => {
  if (props.task.actionType === 'pose_simulation') {
    return '开始采集'
  }
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
  // 检查是否是姿势采集任务
  if (props.task.actionType === 'pose_simulation') {
    showPoseScanner.value = true
    scanStatus.value = 'idle'
  } else {
    // 普通动作任务默认成功
    uni.showToast({
      title: '✅ 动作完成！',
      icon: 'success',
      duration: 1500
    })

    emit('complete', true, { action: 'completed' })
  }
}

const startScanning = () => {
  scanStatus.value = 'scanning'

  // 2.5秒后进入成功状态
  setTimeout(() => {
    scanStatus.value = 'success'

    // 1.5秒后完成并关闭
    setTimeout(() => {
      showPoseScanner.value = false
      emit('complete', true, { action: 'pose_captured' })
    }, 1500)
  }, 2500)
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

// Pose Scanner 样式 - 强制全屏
.pose-scanner-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  width: 100vw;
  height: 100vh;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background: rgba(0, 20, 10, 0.95);
  animation: scannerFadeIn 0.4s ease-out;
}

// 扫描器淡入动画
@keyframes scannerFadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

// 网格背景 - 全屏覆盖
.grid-background {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  overflow: hidden;
  opacity: 0.15;
  pointer-events: none;
}

.grid-lines {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-image:
    linear-gradient(rgba(0, 255, 136, 0.3) 1px, transparent 1px),
    linear-gradient(90deg, rgba(0, 255, 136, 0.3) 1px, transparent 1px);
  background-size: 50rpx 50rpx;
  animation: gridMove 20s linear infinite;
}

@keyframes gridMove {
  0% {
    transform: translate(0, 0);
  }
  100% {
    transform: translate(50rpx, 50rpx);
  }
}

// 扫描界面主体 - 居中布局
.scanner-content {
  position: relative;
  z-index: 10;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
}

// 取景框 - 增大尺寸
.viewfinder {
  position: relative;
  width: 600rpx;
  height: 600rpx;
  display: flex;
  justify-content: center;
  align-items: center;
}

// 四角装饰
.corner {
  position: absolute;
  width: 80rpx;
  height: 80rpx;
  border: 4rpx solid #00ff88;

  &.top-left {
    top: 0;
    left: 0;
    border-right: none;
    border-bottom: none;
  }

  &.top-right {
    top: 0;
    right: 0;
    border-left: none;
    border-bottom: none;
  }

  &.bottom-left {
    bottom: 0;
    left: 0;
    border-right: none;
    border-top: none;
  }

  &.bottom-right {
    bottom: 0;
    right: 0;
    border-left: none;
    border-top: none;
  }
}

// 扫描线
.scan-line {
  position: absolute;
  left: 0;
  right: 0;
  height: 4rpx;
  background: linear-gradient(90deg, transparent, #00ff88, transparent);
  animation: scanLine 2.5s ease-in-out infinite;
  box-shadow: 0 0 20rpx 10rpx rgba(0, 255, 136, 0.6);
}

@keyframes scanLine {
  0%, 100% {
    top: 0;
  }
  50% {
    top: 100%;
  }
}

// 分析数据
.analysis-data {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
}

.data-text {
  position: absolute;
  font-size: 22rpx;
  color: #00ff88;
  font-family: 'Consolas', 'Monaco', monospace;
  opacity: 0;
  animation: dataFlicker 0.5s ease-out forwards;
  text-shadow: 0 0 10rpx rgba(0, 255, 136, 0.8);
}

@keyframes dataFlicker {
  0% {
    opacity: 0;
    transform: scale(0.8);
  }
  50% {
    opacity: 1;
    transform: scale(1.1);
  }
  100% {
    opacity: 0.7;
    transform: scale(1);
  }
}

// 提示文案 - 优化位置和样式
.scan-hint {
  text-align: center;
  max-width: 700rpx;
  margin: 50rpx 0;
  padding: 0 40rpx;

  text {
    font-size: 36rpx;
    font-weight: 600;
    color: #ffffff;
    text-shadow: 0 2rpx 15rpx rgba(0, 0, 0, 0.8);
    line-height: 1.6;
  }

  .scanning-text {
    color: #00ff88;
    animation: textPulse 1s ease-in-out infinite;
    text-shadow: 0 0 20rpx rgba(0, 255, 136, 0.6);
  }

  .success-text {
    color: #ffd700;
    font-size: 42rpx;
    font-weight: bold;
    animation: successGlow 0.5s ease-out;
    text-shadow: 0 0 25rpx rgba(255, 215, 0, 0.6);
  }
}

@keyframes textPulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
}

@keyframes successGlow {
  0% {
    transform: scale(0.8);
    opacity: 0;
  }
  50% {
    transform: scale(1.1);
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

// 采集按钮区域 - 优化间距
.scan-button-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: 80rpx;
}

.scan-button {
  width: 200rpx;
  height: 200rpx;
  border-radius: 50%;
  background: linear-gradient(135deg, #00ff88 0%, #00cc6a 100%);
  display: flex;
  justify-content: center;
  align-items: center;
  box-shadow: 0 10rpx 40rpx rgba(0, 255, 136, 0.6);
  cursor: pointer;
  transition: all 0.3s ease;
  animation: buttonBreathe 2s ease-in-out infinite;

  &:active {
    transform: scale(0.95);
    box-shadow: 0 5rpx 20rpx rgba(0, 255, 136, 0.8);
  }
}

@keyframes buttonBreathe {
  0%, 100% {
    box-shadow: 0 10rpx 40rpx rgba(0, 255, 136, 0.6);
    transform: scale(1);
  }
  50% {
    box-shadow: 0 15rpx 50rpx rgba(0, 255, 136, 0.9);
    transform: scale(1.05);
  }
}

.scan-button-text {
  font-size: 34rpx;
  font-weight: bold;
  color: rgba(0, 20, 10, 0.95);
  text-shadow: 0 2rpx 4rpx rgba(0, 0, 0, 0.3);
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>