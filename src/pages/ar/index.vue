<template>
  <view class="ar-page">
    <!-- 背景：摄像头或静态图片 -->
    <view class="background-layer">
      <!-- 摄像头层 (z-index: 1) -->
      <camera
        v-if="isCameraAuth"
        class="camera-view"
        mode="normal"
        device-position="back"
        flash="auto"
      />

      <!-- 静态图片降级层 (z-index: 0) -->
      <image
        v-else
        class="fallback-image"
        :src="bgImage"
        mode="aspectFill"
        @load="onImageLoad"
        @error="onImageError"
      />

      <!-- 加载状态指示器 -->
      <view v-if="isImageLoading && !isCameraAuth" class="loading-indicator">
        <text class="loading-text">背景加载中...</text>
      </view>
    </view>

    <!-- NPC立绘层 (z-index: 10) -->
    <view class="npc-layer">
      <image
        class="npc-image"
        :src="npcImage"
        mode="aspectFit"
        @error="onNpcError"
      />
    </view>

    <!-- UI层：退出按钮 (z-index: 100) -->
    <view class="ui-layer">
      <view class="exit-btn" @tap="handleExit">
        <text class="exit-icon">✖</text>
        <text class="exit-text">退出实景</text>
      </view>
    </view>

    <!-- 剧情对话层 (z-index: 999) -->
    <StoryDialogue
      v-model:visible="gameStore.isDialogueVisible"
      :script="gameStore.currentScript"
      bgImage=""
      @dialogue-end="handleDialogueEnd"
    />
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { useGameStore } from '../../stores/useGameStore'
import { gameData } from '../../mock/gameData'
import StoryDialogue from '../../components/StoryDialogue.vue'

// Store
const gameStore = useGameStore()

// 响应式变量
const isCameraAuth = ref<boolean>(false)
const bgImage = ref<string>('/static/ar_fallback.png')
const npcImage = ref<string>('/static/default-npc.png')
const isImageLoading = ref<boolean>(true)
const hasImageError = ref<boolean>(false)

// 路由参数
const routeParams = ref<{
  npcId?: string
  poiId?: string
}>({})

// NPC数据
const currentNPC = ref<any>(null)
const currentPOI = ref<any>(null)

// 检查摄像头权限
const checkCameraPermission = () => {
  try {
    // 模拟器检测：如果在开发者工具中，直接降级
    const systemInfo = uni.getSystemInfoSync()
    console.log('运行平台:', systemInfo.platform)

    if (systemInfo.platform === 'devtools') {
      console.log('检测到开发工具，自动降级到静态背景')
      isCameraAuth.value = false
      // 确保使用黑色背景作为fallback
      if (!hasImageError.value && isImageLoading.value) {
        bgImage.value = '/static/ar_fallback.png'
        isImageLoading.value = false
      }
      return
    }

    // 请求摄像头权限
    uni.authorize({
      scope: 'scope.camera',
      success: () => {
        console.log('摄像头权限获取成功')
        isCameraAuth.value = true
      },
      fail: (err) => {
        console.log('摄像头权限获取失败:', err)
        isCameraAuth.value = false

        // 确保在权限被拒绝时使用合适的背景图片
        if (!hasImageError.value && isImageLoading.value) {
          // 如果还在加载中，直接使用黑色背景
          bgImage.value = '/static/ar_fallback.png'
          isImageLoading.value = false
        }

        // 显示权限被拒绝的提示
        uni.showToast({
          title: '摄像头权限被拒绝，显示静态背景',
          icon: 'none',
          duration: 3000
        })
      }
    })
  } catch (error) {
    console.error('权限检查出错:', error)
    isCameraAuth.value = false

    // 异常情况下确保有背景图片
    if (!hasImageError.value && isImageLoading.value) {
      bgImage.value = '/static/ar_fallback.png'
      isImageLoading.value = false
    }
  }
}

// 加载NPC和POI数据
const loadData = () => {
  const { npcId, poiId } = routeParams.value

  // 获取当前城市数据
  const cityData = gameData[gameStore.currentCity as keyof typeof gameData] || gameData.jieyang

  // 查找NPC数据
  if (npcId) {
    currentNPC.value = cityData.npcs?.find((npc: any) => npc.id === npcId)
    if (currentNPC.value) {
      npcImage.value = currentNPC.value.avatar || '/static/default-npc.png'
      console.log('加载NPC数据:', currentNPC.value.name)
    }
  }

  // 查找POI数据
  if (poiId) {
    currentPOI.value = cityData.pois?.find((poi: any) => poi.id === poiId)
    if (currentPOI.value && currentPOI.value.background) {
      // 尝试加载POI背景图片
      bgImage.value = currentPOI.value.background
      isImageLoading.value = true
      hasImageError.value = false
      console.log('尝试加载POI背景:', currentPOI.value.name, currentPOI.value.background)
    } else {
      // POI没有背景图片，使用默认黑色背景
      bgImage.value = '/static/ar_fallback.png'
      isImageLoading.value = false
      hasImageError.value = false
      console.log('POI无背景图片，使用默认黑色背景:', currentPOI.value?.name)
    }
  }

  // 生成AR剧情对话脚本
  generateARScript()
}

// 生成AR剧情对话脚本
const generateARScript = () => {
  if (!currentNPC.value || !currentPOI.value) return

  // 根据NPC和POI生成相应的对话脚本
  const script = [
    {
      id: 'ar_intro',
      speakerType: 'npc',
      name: currentNPC.value.name,
      avatar: currentNPC.value.avatar,
      content: `欢迎来到${currentPOI.value.name}！这里有着深厚的历史文化底蕴。`
    },
    {
      id: 'ar_main',
      speakerType: 'npc',
      name: currentNPC.value.name,
      avatar: currentNPC.value.avatar,
      content: currentPOI.value.description || '让我们开始探索这里的奥秘吧！'
    },
    {
      id: 'ar_challenge',
      speakerType: 'npc',
      name: currentNPC.value.name,
      avatar: currentNPC.value.avatar,
      content: '完成这里的挑战，你将获得珍贵的印章收藏！'
    }
  ]

  // 设置到Store中
  gameStore.currentScript = script

  console.log('生成AR剧情脚本，对话数量:', script.length)
}

// 图片加载成功处理
const onImageLoad = () => {
  console.log('背景图片加载成功:', bgImage.value)
  isImageLoading.value = false
  hasImageError.value = false
}

// 图片加载失败处理
const onImageError = () => {
  console.log('背景图片加载失败，切换到黑色背景')
  hasImageError.value = true
  isImageLoading.value = false

  // 如果POI背景加载失败，使用黑色背景图
  if (bgImage.value !== '/static/ar_fallback.png') {
    bgImage.value = '/static/ar_fallback.png'
    console.log('已切换到默认黑色背景')

    // 提示用户（可选，避免干扰用户体验可以注释掉）
    // uni.showToast({
    //   title: '背景图片加载失败，使用默认背景',
    //   icon: 'none',
    //   duration: 2000
    // })
  }
}

const onNpcError = () => {
  console.log('NPC图片加载失败，使用默认图片')
  npcImage.value = '/static/default-npc.png'
}

// 处理对话结束
const handleDialogueEnd = () => {
  console.log('AR对话结束')

  // 隐藏对话
  gameStore.isDialogueVisible = false

  // 显示完成提示
  uni.showToast({
    title: '探索完成！',
    icon: 'success',
    duration: 1500
  })

  // 延迟返回
  setTimeout(() => {
    // 触发任务完成逻辑
    if (currentPOI.value) {
      console.log('任务完成，POI:', currentPOI.value.id)
      gameStore.completeMission(currentPOI.value.id)
    }

    uni.navigateBack()
  }, 1500)
}

// 退出实景页面
const handleExit = () => {
  uni.showModal({
    title: '退出实景',
    content: '确定要退出AR实景模式吗？',
    success: (res) => {
      if (res.confirm) {
        uni.navigateBack()
      }
    }
  })
}

// 页面加载
onLoad((options) => {
  console.log('AR页面加载，路由参数:', options)

  // 解析路由参数
  if (options) {
    routeParams.value = {
      npcId: options.npcId,
      poiId: options.poiId
    }
  }

  console.log('解析后的参数:', routeParams.value)

  // 加载NPC和POI数据
  loadData()

  // 检查摄像头权限
  checkCameraPermission()

  // 延迟显示对话，让用户先看到AR场景
  setTimeout(() => {
    if (gameStore.currentScript && gameStore.currentScript.length > 0) {
      gameStore.isDialogueVisible = true
      console.log('开始显示AR对话')
    }
  }, 1000)
})
</script>

<style lang="scss" scoped>
.ar-page {
  position: relative;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
}

/* 背景层 */
.background-layer {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 0;
}

.camera-view {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.fallback-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.loading-indicator {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 5;
  display: flex;
  align-items: center;
  justify-content: center;
}

.loading-text {
  color: #ffffff;
  font-size: 16px;
  font-weight: 500;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.8);
  background: rgba(0, 0, 0, 0.6);
  padding: 8px 16px;
  border-radius: 20px;
  backdrop-filter: blur(10px);
}

/* NPC层 */
.npc-layer {
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 80%;
  height: 60%;
  z-index: 10;
  display: flex;
  align-items: flex-end;
  justify-content: center;
}

.npc-image {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

/* UI层 */
.ui-layer {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 100;
  pointer-events: none;
}

.exit-btn {
  position: absolute;
  top: calc(var(--status-bar-height) + 20px);
  left: 20px;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(10px);
  border-radius: 25px;
  padding: 10px 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  pointer-events: auto;
  cursor: pointer;
  transition: all 0.3s ease;

  &:active {
    background: rgba(0, 0, 0, 0.9);
    transform: scale(0.95);
  }
}

.exit-icon {
  color: #ffffff;
  font-size: 20px;
  font-weight: bold;
}

.exit-text {
  color: #ffffff;
  font-size: 16px;
  font-weight: 500;
}

/* 响应式适配 */
@media screen and (max-width: 768px) {
  .npc-layer {
    width: 90%;
    height: 65%;
  }
}

@media screen and (max-width: 480px) {
  .npc-layer {
    width: 95%;
    height: 70%;
  }

  .exit-btn {
    padding: 8px 16px;
  }

  .exit-text {
    font-size: 14px;
  }
}

/* 确保在微信小程序中的全屏显示 */
page {
  height: 100%;
  overflow: hidden;
}

/* 深色主题适配 */
@media (prefers-color-scheme: dark) {
  .exit-btn {
    background: rgba(0, 0, 0, 0.85);
  }
}

/* 黑色背景优化 - 确保fallback图片正确显示 */
.ar-page .fallback-image[src*="ar_fallback.png"] {
  background-color: #000000;
}

/* 防止图片加载时的白色闪烁 */
.fallback-image {
  background-color: #000000;
}
</style>