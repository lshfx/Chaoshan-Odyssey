<template>
  <view class="demo-page">
    <button class="demo-btn" @tap="startDemo">开始 AVG 对话演示</button>

    <StoryDialogue
      v-model:visible="dialogueVisible"
      :script="demoScript"
      :bg-image="demoBgImage"
      @option-selected="handleOption"
      @dialogue-end="handleEnd"
    />
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import StoryDialogue from './StoryDialogue.vue'

const dialogueVisible = ref(false)

// AVG 演示剧本 - 测试长文本和各种情况
const demoScript = [
  {
    id: 'avg_1',
    speakerType: 'narrator' as const,
    name: '旁白',
    content: '揭阳学宫的大殿内，阳光透过雕花窗棂洒在青石板上，空气中弥漫着古木的香气。这是一座见证了百年历史的文庙，承载着无数读书人的梦想与希望。现在，新的故事即将在这里展开...'
  },
  {
    id: 'avg_2',
    speakerType: 'npc' as const,
    name: '林文渊',
    avatar: '/static/npcs/lin_wenyuan.png',
    content: '年轻人，我看你气宇不凡，眉宇间透着一股正气。能来这揭阳学宫，想必是对儒学文化有所向往。说吧，今日来此有何贵干？'
  },
  {
    id: 'avg_3',
    speakerType: 'player' as const,
    name: '陈灵儿',
    avatar: '/static/avatars/chen_linger.png',
    content: '林先生，晚辈陈灵儿，现任揭阳学宫捕快。我今日前来，是想向您打听儒学文脉印章的下落。这枚印章关系重大，它与我父母多年前失踪的真相息息相关。'
  },
  {
    id: 'avg_4',
    speakerType: 'npc' as const,
    name: '林文渊',
    avatar: '/static/npcs/lin_wenyuan.png',
    content: '原来如此。儒学文脉印章确实在我这里保管，但这并非寻常之物。它承载着揭阳文脉的传承，想要得到它，必须证明你有足够的学识和对传统文化的敬畏之心。'
  },
  {
    id: 'avg_5',
    speakerType: 'npc' as const,
    name: '林文渊',
    avatar: '/static/npcs/lin_wenyuan.png',
    content: '印章确实在我这里保管，但这并非寻常之物。它承载着揭阳文脉的传承，想要得到它，必须证明你有足够的学识和对传统文化的敬畏之心。请选择你的下一步行动：',
    options: [
      { label: '接受学宫的考验，证明自己的学识', value: 'accept_challenge' },
      { label: '先详细询问印章的历史渊源和传承故事', value: 'learn_history' },
      { label: '展示捕快身份，争取获得林先生的信任', value: 'show_identity' },
      { label: '先行告辞，待准备充分后再来拜访', value: 'leave_temporarily' },
      { label: '请求林先生讲述更多关于揭阳学宫的古老传说和有趣故事', value: 'request_stories' }
    ]
  },
  {
    id: 'avg_6',
    speakerType: 'narrator' as const,
    name: '旁白',
    content: '一场考验即将开始。这不仅仅是对知识的测试，更是对内心的检验。印章的背后，隐藏着更多不为人知的秘密...'
  }
]

const demoBgImage = '/static/locations/confucian_temple_bg.jpg'

const startDemo = () => {
  dialogueVisible.value = true
}

const handleOption = (option: any) => {
  console.log('选项选择:', option)
}

const handleEnd = () => {
  console.log('对话结束')
}
</script>

<style lang="scss" scoped>
.demo-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40rpx;
}

.demo-btn {
  background: rgba(255, 255, 255, 0.9);
  color: #333;
  border: none;
  padding: 30rpx 60rpx;
  border-radius: 15rpx;
  font-size: 32rpx;
  font-weight: bold;
  box-shadow: 0 10rpx 30rpx rgba(0, 0, 0, 0.2);
  transition: all 0.3s ease;

  &:active {
    transform: scale(0.95);
    opacity: 0.8;
  }
}
</style>