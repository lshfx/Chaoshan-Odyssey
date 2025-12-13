<template>
  <view class="test-page">
    <view class="test-buttons">
      <button class="test-btn" @tap="startNPCDialogue">NPC 对话测试</button>
      <button class="test-btn" @tap="startPlayerDialogue">玩家对话测试</button>
      <button class="test-btn" @tap="startNarratorDialogue">旁白测试</button>
      <button class="test-btn" @tap="startMixedDialogue">混合剧情测试</button>
      <button class="test-btn" @tap="startTaskDialogue">任务功能测试</button>
      <button class="test-btn" @tap="startInteractiveNarrative">
        Phase 6 交互叙事测试
      </button>
      <button class="test-btn" @tap="startEndingTest">结局画面测试</button>
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
    avatar: 'npcs/lin_wenyuan.webp',
    content:
      '年轻人，欢迎来到揭阳学宫。想要获得儒学文脉印章，必须展现出对传统文化的尊重。',
  },
  {
    id: 'npc_2',
    speakerType: 'npc' as const,
    name: '林文渊',
    avatar: 'npcs/lin_wenyuan.webp',
    content: '请在大成殿向孔子像行揖礼，然后回答我的两个问题。你准备好了吗？',
    options: [
      { label: '我准备好了，请出题吧！', value: 'ready' },
      { label: '我需要先准备一下', value: 'prepare' },
      { label: '可以先告诉我答案吗？', value: 'cheat' },
    ],
  },
]

const playerDialogueScript = [
  {
    id: 'player_1',
    speakerType: 'player' as const,
    name: '陈灵儿',
    avatar: 'avatars/chen_linger.webp',
    content:
      '林先生，我是学宫的捕快陈灵儿。我正在寻找一枚特殊的印章，据说与儒学文脉有关。',
  },
  {
    id: 'player_2',
    speakerType: 'player' as const,
    name: '陈灵儿',
    avatar: 'avatars/chen_linger.webp',
    content: '这枚印章对我非常重要，它关系到我父母失踪的真相。',
  },
]

const narratorDialogueScript = [
  {
    id: 'narrator_1',
    speakerType: 'narrator' as const,
    name: '旁白',
    content:
      '百年前的揭阳古城，侨商家族的印章守护者们在这片土地上上演着一场关乎信义与背叛的故事...',
  },
  {
    id: 'narrator_2',
    speakerType: 'narrator' as const,
    name: '旁白',
    content:
      '今天，年轻的继承者们即将踏上寻找印章的征程，他们的命运将如何展开？',
  },
]

const mixedDialogueScript = [
  {
    id: 'mixed_1',
    speakerType: 'narrator' as const,
    name: '旁白',
    content: '揭阳学宫的大殿内，阳光透过雕花窗棂洒在青石板上...',
  },
  {
    id: 'mixed_2',
    speakerType: 'npc' as const,
    name: '林文渊',
    avatar: 'npcs/lin_wenyuan.webp',
    content: '年轻人，我看你气宇不凡，来此有何贵干？',
  },
  {
    id: 'mixed_3',
    speakerType: 'player' as const,
    name: '陈灵儿',
    avatar: 'avatars/chen_linger.webp',
    content: '林先生，我想了解儒学文脉印章的下落。',
  },
  {
    id: 'mixed_4',
    speakerType: 'npc' as const,
    name: '林文渊',
    avatar: 'npcs/lin_wenyuan.webp',
    content: '印章就在我这里，但要得到它，你必须证明自己对传统文化的理解。',
  },
  {
    id: 'mixed_5',
    speakerType: 'narrator' as const,
    name: '旁白',
    content: '一场考验即将开始，这不仅仅是对知识的测试，更是对内心的考验...',
  },
]

const taskDialogueScript = [
  {
    id: 'task_1',
    speakerType: 'narrator' as const,
    name: '旁白',
    content: '在揭阳学宫的大成殿前，林文渊要考验你对传统文化的理解...',
  },
  {
    id: 'task_2',
    speakerType: 'npc' as const,
    name: '林文渊',
    avatar: 'npcs/lin_wenyuan.webp',
    content: '年轻人，让我们先来一个简单的数学题热热身。',
  },
  {
    id: 'task_3',
    speakerType: 'task' as const,
    name: '数学题',
    task: {
      type: 'question',
      description: '请问：1 + 1 = ?',
      options: ['1', '2', '3', '4'],
      correctOption: 1, // 索引1，即'2'
    },
  },
  {
    id: 'task_4',
    speakerType: 'npc' as const,
    name: '林文渊',
    avatar: 'npcs/lin_wenyuan.webp',
    content: '很好！现在让我们来一个更有文化内涵的问题。',
  },
  {
    id: 'task_5',
    speakerType: 'task' as const,
    name: '文化题',
    task: {
      type: 'question',
      description: '揭阳学宫始建于哪个朝代？',
      options: ['唐朝', '宋朝', '明朝', '清朝'],
      correctOption: 2, // 索引2，即'明朝'
    },
  },
  {
    id: 'task_6',
    speakerType: 'npc' as const,
    name: '林文渊',
    avatar: 'npcs/lin_wenyuan.webp',
    content: '知识储备不错！现在请表现出你对传统文化的尊重。',
  },
  {
    id: 'task_7',
    speakerType: 'task' as const,
    name: '礼仪动作',
    task: {
      type: 'action',
      description: '请向孔子像行揖礼，表达对传统文化的敬意',
      actionText: '行揖礼',
    },
  },
  {
    id: 'task_8',
    speakerType: 'npc' as const,
    name: '林文渊',
    avatar: 'npcs/lin_wenyuan.webp',
    content:
      '很好！你已经证明了你对传统文化的理解和尊重。这枚儒学文脉印章，你当之无愧！',
  },
  {
    id: 'task_9',
    speakerType: 'narrator' as const,
    name: '旁白',
    content:
      '恭喜你成功完成了所有考验，获得了第一枚印章！接下来的旅程还充满挑战...',
  },
]

// 结局测试剧本
const endingTestScript = [
  {
    id: 'ending_narrator_1',
    speakerType: 'narrator' as const,
    name: '旁白',
    content: '随着真相大白，你的旅途也迎来了终点...',
  },
  {
    id: 'ending_node',
    speakerType: 'narrator' as const,
    name: '旁白',
    ending: {
      id: 'test_ending_perfect',
      characterId: 'chen_linger',
      type: 'perfect',
      title: '云开月明',
      achievement: '家族守护者',
      description:
        '蔡福生被当场拿获，那一包还没来得及销毁的迷药和藏在暗格里的《护卫日志》完好无损。',
      background:
        '你翻开日志，看到父亲的笔迹："吾儿，父母未死，隐于南洋。"三个月后，你辞去捕快之职，登上了去往南洋的红头船，与家人团聚。',
      imageUrl: 'locations/confucian_temple_bg.webp',
    },
  },
]

// 测试方法
const startNPCDialogue = () => {
  currentScript.value = npcDialogueScript
  currentBgImage.value = 'locations/confucian_temple_bg.webp'
  dialogueVisible.value = true
}

const startPlayerDialogue = () => {
  currentScript.value = playerDialogueScript
  currentBgImage.value = 'locations/confucian_temple_bg.webp'
  dialogueVisible.value = true
}

const startNarratorDialogue = () => {
  currentScript.value = narratorDialogueScript
  currentBgImage.value = 'backgrounds/story_bg.webp'
  dialogueVisible.value = true
}

const startMixedDialogue = () => {
  currentScript.value = mixedDialogueScript
  currentBgImage.value = 'locations/confucian_temple_bg.webp'
  dialogueVisible.value = true
}

const startTaskDialogue = () => {
  currentScript.value = taskDialogueScript
  currentBgImage.value = 'locations/confucian_temple_bg.webp'
  dialogueVisible.value = true
}

const startInteractiveNarrative = () => {
  currentScript.value = interactiveNarrativeScript
  currentBgImage.value = 'locations/confucian_temple_bg.webp'
  dialogueVisible.value = true
}

const startEndingTest = () => {
  currentScript.value = endingTestScript
  currentBgImage.value = 'locations/confucian_temple_bg.webp'
  dialogueVisible.value = true
}

// Phase 6 交互式叙事脚本示例
const interactiveNarrativeScript: any[] = [
  {
    id: 'lin_wenyuan_welcome_interactive',
    type: 'normal',
    speakerType: 'npc',
    name: '林文渊',
    avatar: 'npcs/lin_wenyuan.webp',
    content:
      '（林文渊正在整理古籍，看到你走近）年轻人，我看你气质不凡，来此有何贵干？',
  },
  {
    id: 'lin_wenyuan_choice_interactive',
    type: 'choice',
    speakerType: 'npc',
    name: '林文渊',
    avatar: 'npcs/lin_wenyuan.webp',
    content: '作为揭阳学宫的讲学者，我可以为你解答关于儒学文脉的疑问。',
    options: [
      { label: '我想了解揭阳学宫的历史', value: 'history_path' },
      { label: '我想学习儒学经典', value: 'classics_path' },
      { label: '我想直接挑战印章', value: 'seal_path' },
    ],
  },
  {
    id: 'lin_wenyuan_history_explain',
    type: 'normal',
    speakerType: 'npc',
    name: '林文渊',
    avatar: 'npcs/lin_wenyuan.webp',
    content:
      '揭阳学宫始建于北宋庆历年间，至今已有近千年历史。这里曾是粤东地区的最高学府，培养了无数人才。',
  },
  {
    id: 'lin_wenyuan_history_question',
    type: 'task',
    speakerType: 'task',
    name: '历史知识测试',
    task: {
      type: 'question',
      description: '揭阳学宫始建于哪个朝代？',
      options: ['唐朝', '宋朝', '明朝', '清朝'],
      correctOption: 1, // '宋朝' 的索引
    },
  },
  {
    id: 'lin_wenyuan_history_correct',
    type: 'normal',
    speakerType: 'npc',
    name: '林文渊',
    avatar: 'npcs/lin_wenyuan.webp',
    content:
      '非常好！你对揭阳历史文化确实有了解。既然你这么用心，我愿意传授你一些儒学礼仪知识。',
  },
  {
    id: 'lin_wenyuan_classics_teach',
    type: 'normal',
    speakerType: 'npc',
    name: '林文渊',
    avatar: 'npcs/lin_wenyuan.webp',
    content:
      '（林文渊从书架上取下一本《论语》）"学而时习之，不亦说乎？"学习儒家经典，最重要的是要懂得实践。',
  },
  {
    id: 'lin_wenyuan_etiquette_task',
    type: 'task',
    speakerType: 'task',
    name: '礼仪学习',
    task: {
      type: 'question',
      description: '儒家最基础的礼仪是什么？',
      options: ['揖礼', '鞠躬', '抱拳', '作揖'],
      correctOption: 0, // '揖礼' 的索引
    },
  },
  {
    id: 'lin_wenyuan_ritual_task',
    type: 'task',
    speakerType: 'task',
    name: '礼仪实践',
    task: {
      type: 'action',
      description: '请向孔子像行揖礼，表达对先贤的敬意',
      actionText: '行揖礼',
    },
  },
  {
    id: 'lin_wenyuan_seal_earned',
    type: 'normal',
    speakerType: 'npc',
    name: '林文渊',
    avatar: 'npcs/lin_wenyuan.webp',
    content:
      '恭喜你！你通过了所有考验，获得了儒学文脉印章。记住，这枚印章不仅是文脉的象征，更是传承的责任。',
  },
]

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
