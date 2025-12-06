<template>
  <view class="footer-wrapper">
    <!-- NPC 立绘 - 固定位置和尺寸 -->
    <image
      v-if="speakerType === 'npc' && avatar"
      :src="avatar"
      class="avatar npc"
      mode="aspectFit"
    />

    <!-- Player 立绘 - 固定位置和尺寸 -->
    <image
      v-if="speakerType === 'player' && avatar"
      :src="avatar"
      class="avatar player"
      mode="aspectFit"
    />

    <!-- 文本框面板 - 固定高度和位置 -->
    <view class="text-box-panel" :class="getPanelClass()">
      <!-- 说话者名字标签 -->
      <view v-if="speakerType !== 'narrator'" class="name-tag">
        {{ name }}
      </view>

      <!-- 对话文本内容 - 固定高度，可滚动 -->
      <scroll-view
        class="text-content"
        scroll-y="true"
        :show-scrollbar="false"
      >
        <text class="content-text">{{ displayedContent || content }}</text>
      </scroll-view>

      <!-- 继续提示 -->
      <view v-if="!hasOptions" class="continue-hint">
        <text class="hint-text">点击继续 ▶</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'

// Props 定义
interface Props {
  content: string
  name: string
  avatar?: string
  speakerType: 'player' | 'npc' | 'narrator'
  hasOptions?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  avatar: '',
  hasOptions: false
})

// Emits 定义
const emit = defineEmits<{
  next: []
}>()

// 响应式数据
const isTyping = ref(false)
const displayedContent = ref('')

// 方法
const getPanelClass = () => {
  switch (props.speakerType) {
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

const onBoxClick = () => {
  // 如果正在打字，立即显示全部内容
  if (isTyping.value) {
    isTyping.value = false
    displayedContent.value = props.content
    return
  }

  // 否则触发下一句对话
  emit('next')
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

// 监听内容变化，触发打字机效果
watch(() => props.content, (newContent) => {
  if (newContent) {
    typeWriter(newContent)
  }
}, { immediate: true })

// 暴露方法给父组件
defineExpose({
  onBoxClick,
  getPanelClass
})
</script>

<style lang="scss" scoped>
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

// 头像 - 纯净立绘效果
.avatar {
  position: absolute;
  bottom: 220rpx; // 稍微下沉，增加景深感
  z-index: 5; // 在文本框后面
  height: 350rpx; // 固定高度
  max-width: 300rpx; // 限制最大宽度
  filter: drop-shadow(0 0 10rpx rgba(0, 0, 0, 0.3)); // 沿像素边缘的阴影
  transition: filter 0.3s ease; // 平滑过渡效果

  &.npc {
    left: 40rpx; // 固定左边位置
  }

  &.player {
    right: 40rpx; // 固定右边位置
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
  cursor: pointer;

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
    bottom: 200rpx; // 同样下沉，保持比例

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