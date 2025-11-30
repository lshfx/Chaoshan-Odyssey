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

    <!-- 任务面板 - 当是任务节点时显示 -->
    <TaskPanel
      v-if="isTaskNode && currentLine?.task"
      :task="currentLine.task"
      @complete="handleTaskComplete"
    />

    <!-- 结局卡片 - 当是结局节点时显示 -->
    <EndingCard
      v-if="isEndingNode && currentLine?.ending"
      :ending="currentLine.ending"
      @close="handleEndingClose"
    />

    <!-- 选项层 - 当有选项时显示 -->
    <ChoicePanel
      v-if="currentLine?.options && currentLine.options.length > 0"
      :options="currentLine.options"
      @select="handleOptionSelect"
    />

    <!-- 对话框组件 - 当没有选项且不是任务节点时显示 -->
    <DialogueBox
      v-if="!isTaskNode && (!currentLine?.options || currentLine.options.length === 0)"
      :content="currentLine?.content || ''"
      :name="currentLine?.name || ''"
      :avatar="currentLine?.avatar"
      :speaker-type="currentLine?.speakerType || 'narrator'"
      :has-options="!!(currentLine?.options && currentLine.options.length > 0)"
      @next="nextDialogue"
    />

    <!-- 快速跳过按钮 -->
    <view class="skip-button" @tap.stop="skipDialogue">
      <text class="skip-text">跳过 (SKIP)</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import DialogueBox from './story/DialogueBox.vue'
import ChoicePanel from './story/ChoicePanel.vue'
import TaskPanel from './story/TaskPanel.vue'
import EndingCard from './story/EndingCard.vue'
import type { StoryEnding } from '@/mock/types'

// 接口定义
interface DialogueOption {
  label: string
  value: string
}

interface Task {
  type: 'question' | 'action'
  description: string
  options?: string[] // 问题选项
  correctOption?: string | number // 正确答案（索引或值）
  actionText?: string // 动作按钮自定义文本
}

interface DialogueLine {
  id: string
  speakerType: 'player' | 'npc' | 'narrator' | 'task'
  name: string // 显示的名字，如 "林文渊" 或 "陈灵儿"
  avatar?: string // 立绘图片路径
  content: string // 对话内容
  options?: DialogueOption[] // (可选) 分支选项
  task?: Task // (可选) 任务信息
  ending?: StoryEnding // (可选) 结局数据，当 type: 'end' 且有 endingId 时会被填充
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

// 计算属性
const currentLine = computed(() => {
  return props.script[currentIndex.value] || null
})

const isTaskNode = computed(() => {
  return currentLine.value?.speakerType === 'task' && currentLine.value?.task
})

const isEndingNode = computed(() => {
  return currentLine.value?.ending !== undefined
})

// 方法
const onOverlayTap = () => {
  // 如果是任务节点，不自动继续（需要用户完成任务）
  if (isTaskNode.value) {
    return
  }

  // 如果是结局节点，不自动继续（强制用户点击卡片按钮）
  if (isEndingNode.value) {
    return
  }

  // 如果有选项，不自动继续
  if (currentLine.value?.options && currentLine.value.options.length > 0) {
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

const handleOptionSelect = (option: DialogueOption) => {
  emit('option-selected', option)
  // 仅通知父组件，不要自己调用 nextDialogue()！
  // 控制权完全移交给父组件（通过 props.script 更新驱动）
}

const handleTaskComplete = (success: boolean, result?: any) => {
  console.log('Task completed:', { success, result })
  
  const node = currentLine.value

  if (success) {
    // 🎉 成功逻辑
    if (node?.nextId) {
      // 借用 option-selected 事件，告诉父组件(index.vue)去加载成功的后续剧情
      // 这里构造一个伪造的 option 对象
      emit('option-selected', { 
        label: '任务成功', 
        value: 'success', 
        nextId: node.nextId 
      } as any)
    } else {
      // 如果没有后续，就按普通翻页处理（兜底）
      nextDialogue()
    }
  } else {
    // 💀 失败逻辑
    if (node?.failId) {
      // 如果定义了失败分支，跳转到失败剧情
      emit('option-selected', { 
        label: '任务失败', 
        value: 'fail', 
        nextId: node.failId 
      } as any)
    } else {
      // ⚠️ 如果没定义失败分支，就提示重试，且不跳转
      uni.showToast({
        title: '回答错误，请再试一次',
        icon: 'none',
        duration: 2000
      })
      // 这里不调用 nextDialogue，让用户停留在当前任务卡片上重试
    }
  }
}

const handleEndingClose = () => {
  endDialogue()
}

const skipDialogue = () => {
  endDialogue()
}

// 供父组件调用的方法：继续下一句对话
const continueDialogue = () => {
  if (currentIndex.value < props.script.length - 1) {
    currentIndex.value++
    emit('line-change', currentLine.value!)
  } else {
    endDialogue()
  }
}

const endDialogue = () => {
  emit('update:visible', false)
  emit('dialogue-end')
}

// 监听显示状态变化，重置索引
watch(() => props.visible, (newVisible) => {
  if (newVisible) {
    currentIndex.value = 0
  }
})

// 监听script prop变化，强制重置索引以重新开始播放
watch(() => props.script, (newScript) => {
  if (newScript && newScript.length > 0) {
    currentIndex.value = 0
  }
})

// 暴露方法给父组件
defineExpose({
  nextDialogue,
  skipDialogue,
  continueDialogue,
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
</style>