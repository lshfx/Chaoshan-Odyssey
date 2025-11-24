<template>
  <view v-if="visible" class="dialogue-overlay" @tap="onOverlayTap">
    <!-- 背景图片 -->
    <image
      v-if="bgImage"
      :src="bgImage"
      class="dialogue-background"
      mode="aspectFill"
    />

    <!-- 旁白模式：暗化背景 -->
    <view
      v-if="currentLine?.speakerType === 'narrator'"
      class="dialogue-overlay narrator-overlay"
    />

    <!-- 选项层 - 右侧浮动列表 -->
    <view
      v-if="currentLine?.options && currentLine.options.length > 0"
      class="options-layer"
    >
      <!-- 聚焦模式背景遮罩 -->
      <view class="focus-overlay"></view>

      <view
        v-for="(option, index) in currentLine.options"
        :key="index"
        class="option-item"
        :style="{ 'animation-delay': `${index * 80}ms` }"
        @tap.stop="selectOption(option)"
      >
        {{ option.label }}
      </view>
    </view>

    <!-- 底部固定容器 -->
    <view class="footer-wrapper">
      <!-- NPC 立绘 - 固定位置和尺寸 -->
      <image
        v-if="currentLine?.speakerType === 'npc' && currentLine?.avatar"
        :src="currentLine.avatar"
        class="avatar npc"
        mode="aspectFit"
      />

      <!-- Player 立绘 - 固定位置和尺寸 -->
      <image
        v-if="currentLine?.speakerType === 'player' && currentLine?.avatar"
        :src="currentLine.avatar"
        class="avatar player"
        mode="aspectFit"
      />

      <!-- 文本框面板 - 固定高度和位置 -->
      <view class="text-box-panel" :class="getPanelClass()">
        <!-- 说话者名字标签 -->
        <view v-if="currentLine?.speakerType !== 'narrator'" class="name-tag">
          {{ currentLine?.name }}
        </view>

        <!-- 对话文本内容 - 固定高度，可滚动 -->
        <scroll-view
          class="text-content"
          scroll-y="true"
          :show-scrollbar="false"
        >
          <text class="content-text">{{ displayedContent || currentLine?.content }}</text>
        </scroll-view>

        <!-- 继续提示 -->
        <view v-if="!currentLine?.options || currentLine.options.length === 0" class="continue-hint">
          <text class="hint-text">点击继续 ▶</text>
        </view>
      </view>
    </view>

    <!-- 快速跳过按钮 -->
    <view class="skip-button" @tap.stop="skipDialogue">
      <text class="skip-text">跳过 (SKIP)</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'

// 接口定义
interface DialogueOption {
  label: string
  value: string
}

interface DialogueLine {
  id: string
  speakerType: 'player' | 'npc' | 'narrator'
  name: string // 显示的名字，如 "林文渊" 或 "陈灵儿"
  avatar?: string // 立绘图片路径
  content: string // 对话内容
  options?: DialogueOption[] // (可选) 分支选项
}

// Props 定义
interface Props {
  visible: boolean // v-model:visible 控制显示隐藏
  script: DialogueLine[] // 剧本列表
  bgImage?: string // (可选) 当前场景背景图
}

const props = withDefaults(defineProps<Props>(), {
  bgImage: ''
})

// Emits 定义
const emit = defineEmits<{
  'update:visible': [value: boolean]
  'option-selected': [option: DialogueOption]
  'dialogue-end': []
  'line-change': [line: DialogueLine]
}>()

// 响应式数据
const currentIndex = ref(0)
const isTyping = ref(false)
const displayedContent = ref('')

// 计算属性
const currentLine = computed(() => {
  return props.script[currentIndex.value] || null
})

// 方法
const getPanelClass = () => {
  if (!currentLine.value) return ''

  switch (currentLine.value.speakerType) {
    case 'npc':
      return 'npc-panel'
    case 'player':
      return 'player-panel'
    case 'narrator':
      return 'narrator'
    default:
      return ''
  }
}

const onOverlayTap = () => {
  // 如果有选项，不自动继续
  if (currentLine.value?.options && currentLine.value.options.length > 0) {
    return
  }

  // 如果正在打字，立即显示全部内容
  if (isTyping.value) {
    isTyping.value = false
    displayedContent.value = currentLine.value?.content || ''
    return
  }

  // 否则继续下一句对话
  nextDialogue()
}

const nextDialogue = () => {
  if (currentIndex.value < props.script.length - 1) {
    currentIndex.value++
    emit('line-change', currentLine.value!)
  } else {
    // 对话结束
    endDialogue()
  }
}

const selectOption = (option: DialogueOption) => {
  emit('option-selected', option)
  // 选择后继续下一句对话
  nextDialogue()
}

const skipDialogue = () => {
  endDialogue()
}

const endDialogue = () => {
  emit('update:visible', false)
  emit('dialogue-end')
}

// 打字机效果
const typeWriter = (text: string, callback?: () => void) => {
  isTyping.value = true
  displayedContent.value = ''
  let index = 0

  const type = () => {
    if (index < text.length) {
      displayedContent.value += text[index]
      index++
      setTimeout(type, 30) // 打字速度
    } else {
      isTyping.value = false
      callback?.()
    }
  }

  type()
}

// 监听当前对话变化，触发打字机效果
watch(currentLine, (newLine) => {
  if (newLine) {
    typeWriter(newLine.content)
  }
}, { immediate: true })

// 监听显示状态变化，重置索引
watch(() => props.visible, (newVisible) => {
  if (newVisible) {
    currentIndex.value = 0
  }
})

// 暴露方法给父组件
defineExpose({
  nextDialogue,
  skipDialogue,
  currentIndex,
  currentLine
})
</script>

<style lang="scss" scoped>
.dialogue-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1000;

  .dialogue-background {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: -1;
  }

  .narrator-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.7);
    z-index: 1;
  }
}

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

// 底部固定容器 - 严格300rpx高度
.footer-wrapper {
  position: fixed;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 300rpx;
  z-index: 2;
  background: rgba(0, 0, 0, 0.3); // 半透明背景，区分立绘和文本框
}

// 头像 - 严格尺寸和位置
.avatar {
  position: absolute;
  bottom: 240rpx; // 站在文本框顶部
  z-index: 5; // 在文本框后面，看起来像从框里出来
  height: 350rpx; // 固定最大高度
  max-width: 300rpx; // 限制最大宽度
  border-radius: 15rpx 15rpx 0 0;
  box-shadow: 0 -8rpx 25rpx rgba(0, 0, 0, 0.3);

  &.npc {
    left: 40rpx; // 固定左边位置
    border-right: 4rpx solid #e74c3c;
  }

  &.player {
    right: 40rpx; // 固定右边位置
    border-left: 4rpx solid #3498db;
  }
}

// 文本框面板 - 严格260rpx高度
.text-box-panel {
  position: absolute;
  bottom: 20rpx;
  left: 20rpx;
  right: 20rpx;
  height: 260rpx; // 严格固定高度
  background: rgba(255, 255, 255, 0.95);
  border-radius: 20rpx;
  padding: 30rpx;
  box-shadow: 0 10rpx 30rpx rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(15rpx);
  z-index: 10; // 在头像前面，确保文本不被遮挡
  border: 2rpx solid rgba(255, 255, 255, 0.8);
  display: flex;
  flex-direction: column;

  // NPC 对话样式
  &.npc-panel {
    border-left: 6rpx solid #e74c3c;
  }

  // Player 对话样式
  &.player-panel {
    border-right: 6rpx solid #3498db;
  }

  // 旁白时的特殊样式
  &.narrator {
    background: rgba(155, 89, 182, 0.9);
    border: 4rpx solid #9b59b6;
    border-left: 4rpx solid #9b59b6 !important;
    border-right: 4rpx solid #9b59b6 !important;
    text-align: center;
  }
}

// 名字标签
.name-tag {
  font-size: 28rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 15rpx;
  flex-shrink: 0;

  .text-box-panel.narrator & {
    color: white;
    text-align: center;
    font-size: 32rpx;
  }
}

// 文本内容 - 可滚动区域
.text-content {
  flex: 1;
  overflow: hidden; // 确保不超出容器
  margin-bottom: 10rpx;

  .content-text {
    font-size: 26rpx;
    line-height: 1.6;
    color: #333;
    word-wrap: break-word;
    white-space: pre-wrap;

    .text-box-panel.narrator & {
      color: white;
      font-size: 28rpx;
      line-height: 1.8;
    }
  }
}

// 继续提示
.continue-hint {
  flex-shrink: 0;
  text-align: right;
  margin-top: 5rpx;

  .hint-text {
    font-size: 22rpx;
    color: #999;
    animation: pulse 1.5s ease-in-out infinite;
    font-weight: 500;

    .text-box-panel.narrator & {
      color: rgba(255, 255, 255, 0.8);
      text-align: center;
    }
  }
}

// 跳过按钮
.skip-button {
  position: fixed;
  top: 40rpx;
  right: 40rpx;
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 15rpx 25rpx;
  border-radius: 25rpx;
  z-index: 200; // 最高层级，确保始终可点击
  backdrop-filter: blur(10rpx);
  border: 2rpx solid rgba(255, 255, 255, 0.2);

  .skip-text {
    font-size: 24rpx;
    font-weight: 500;
  }

  &:active {
    opacity: 0.8;
    transform: scale(0.95);
  }
}

// 脉冲动画
@keyframes pulse {
  0%, 100% {
    opacity: 0.6;
  }
  50% {
    opacity: 1;
  }
}

// 小屏幕适配
@media screen and (max-width: 750rpx) {
  .avatar {
    height: 280rpx;
    max-width: 240rpx;

    &.npc {
      left: 30rpx;
    }

    &.player {
      right: 30rpx;
    }
  }

  .text-box-panel {
    padding: 25rpx;
  }

  .name-tag {
    font-size: 24rpx;
    margin-bottom: 12rpx;

    .text-box-panel.narrator & {
      font-size: 28rpx;
    }
  }

  .text-content .content-text {
    font-size: 24rpx;

    .text-box-panel.narrator & {
      font-size: 26rpx;
    }
  }

  .continue-hint .hint-text {
    font-size: 20rpx;
  }
}
</style>