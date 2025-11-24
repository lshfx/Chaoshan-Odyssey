<template>
  <view class="test-page">
    <view class="test-buttons">
      <button class="test-btn" @tap="startNPCDialogue">NPC 对话测试</button>
      <button class="test-btn" @tap="startPlayerDialogue">玩家对话测试</button>
      <button class="test-btn" @tap="startNarratorDialogue">旁白测试</button>
      <button class="test-btn" @tap="startMixedDialogue">混合剧情测试</button>
    </view>

    <!-- 对话组件 -->
    <StoryDialogue
      v-model:visible="dialogueVisible"
      :script="currentScript"
      :bg-image="currentBgImage"
      @option-selected="handleOptionSelected"
      @dialogue-end="handleDialogueEnd"
      @line-change="handleLineChange"
    />
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import StoryDialogue from '@/components/StoryDialogue.vue'

// 响应式数据
const dialogueVisible = ref(false)
const currentScript = ref<any[]>([])
const currentBgImage = ref('')

// 测试剧本数据
const npcDialogueScript = [
  {
    id: 'npc_1',
    speakerType: 'npc' as const,
    name: '林文渊',
    avatar: '/static/npcs/lin_wenyuan.png',
    content: '年轻人，欢迎来到揭阳学宫。想要获得儒学文脉印章，必须展现出对传统文化的尊重。'
  },
  {
    id: 'npc_2',
    speakerType: 'npc' as const,
    name: '林文渊',
    avatar: '/static/npcs/lin_wenyuan.png',
    content: '请在大成殿向孔子像行揖礼，然后回答我的两个问题。你准备好了吗？',
    options: [
      { label: '我准备好了，请出题吧！', value: 'ready' },
      { label: '我需要先准备一下', value: 'prepare' },
      { label: '可以先告诉我答案吗？', value: 'cheat' }
    ]
  }
]

const playerDialogueScript = [
  {
    id: 'player_1',
    speakerType: 'player' as const,
    name: '陈灵儿',
    avatar: '/static/avatars/chen_linger.png',
    content: '林先生，我是学宫的捕快陈灵儿。我正在寻找一枚特殊的印章，据说与儒学文脉有关。'
  },
  {
    id: 'player_2',
    speakerType: 'player' as const,
    name: '陈灵儿',
    avatar: '/static/avatars/chen_linger.png',
    content: '这枚印章对我非常重要，它关系到我父母失踪的真相。'
  }
]

const narratorDialogueScript = [
  {
    id: 'narrator_1',
    speakerType: 'narrator' as const,
    name: '旁白',
    content: '百年前的揭阳古城，侨商家族的印章守护者们在这片土地上上演着一场关乎信义与背叛的故事...'
  },
  {
    id: 'narrator_2',
    speakerType: 'narrator' as const,
    name: '旁白',
    content: '今天，年轻的继承者们即将踏上寻找印章的征程，他们的命运将如何展开？'
  }
]

const mixedDialogueScript = [
  {
    id: 'mixed_1',
    speakerType: 'narrator' as const,
    name: '旁白',
    content: '揭阳学宫的大殿内，阳光透过雕花窗棂洒在青石板上...'
  },
  {
    id: 'mixed_2',
    speakerType: 'npc' as const,
    name: '林文渊',
    avatar: '/static/npcs/lin_wenyuan.png',
    content: '年轻人，我看你气宇不凡，来此有何贵干？'
  },
  {
    id: 'mixed_3',
    speakerType: 'player' as const,
    name: '陈灵儿',
    avatar: '/static/avatars/chen_linger.png',
    content: '林先生，我想了解儒学文脉印章的下落。'
  },
  {
    id: 'mixed_4',
    speakerType: 'npc' as const,
    name: '林文渊',
    avatar: '/static/npcs/lin_wenyuan.png',
    content: '印章就在我这里，但要得到它，你必须证明自己对传统文化的理解。'
  },
  {
    id: 'mixed_5',
    speakerType: 'narrator' as const,
    name: '旁白',
    content: '一场考验即将开始，这不仅仅是对知识的测试，更是对内心的考验...'
  }
]

// 测试方法
const startNPCDialogue = () => {
  currentScript.value = npcDialogueScript
  currentBgImage.value = '/static/locations/confucian_temple_bg.jpg'
  dialogueVisible.value = true
}

const startPlayerDialogue = () => {
  currentScript.value = playerDialogueScript
  currentBgImage.value = '/static/locations/confucian_temple_bg.jpg'
  dialogueVisible.value = true
}

const startNarratorDialogue = () => {
  currentScript.value = narratorDialogueScript
  currentBgImage.value = '/static/backgrounds/story_bg.jpg'
  dialogueVisible.value = true
}

const startMixedDialogue = () => {
  currentScript.value = mixedDialogueScript
  currentBgImage.value = '/static/locations/confucian_temple_bg.jpg'
  dialogueVisible.value = true
}

// 事件处理
const handleOptionSelected = (option: any) => {
  console.log('玩家选择了选项:', option)

  // 根据选择做出不同反应
  if (option.value === 'ready') {
    uni.showToast({ title: '很好，让我们开始吧！', icon: 'none' })
  } else if (option.value === 'prepare') {
    uni.showToast({ title: '请尽快准备好', icon: 'none' })
  } else if (option.value === 'cheat') {
    uni.showToast({ title: '年轻人，真正的学问需要自己去探索', icon: 'none' })
  }
}

const handleDialogueEnd = () => {
  console.log('对话结束')
  uni.showToast({ title: '对话结束', icon: 'success' })
}

const handleLineChange = (line: any) => {
  console.log('当前对话:', line)
}
</script>

<style lang="scss" scoped>
.test-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40rpx;
}

.test-buttons {
  display: flex;
  flex-direction: column;
  gap: 30rpx;
  width: 100%;
  max-width: 600rpx;
}

.test-btn {
  background: rgba(255, 255, 255, 0.9);
  color: #333;
  border: none;
  padding: 30rpx;
  border-radius: 15rpx;
  font-size: 32rpx;
  font-weight: bold;
  box-shadow: 0 10rpx 30rpx rgba(0, 0, 0, 0.2);
  transition: all 0.3s ease;

  &:active {
    transform: scale(0.95);
    opacity: 0.8;
  }

  &:hover {
    background: white;
    transform: translateY(-5rpx);
    box-shadow: 0 15rpx 40rpx rgba(0, 0, 0, 0.3);
  }
}
</style>