<template>
  <view class="mine-page">
    <!-- 自定义导航栏 -->
    <CustomNavbar
      title="我的"
      bgColor="#00897B"
      textColor="#FFFFFF"
      :showBack="false"
    />
    <!-- 头部卡片 - 用户信息 -->
    <view class="header-card">
      <!-- 左侧头像 -->
      <view class="avatar-section">
        <image
          class="user-avatar"
          :src="currentUser?.avatar || $imgHost + 'avatar-placeholder.webp'"
          mode="aspectFill"
        />
        <view class="avatar-border"></view>
      </view>

      <!-- 右侧用户信息 -->
      <view class="user-info">
        <view class="name-section">
          <text class="user-name">{{ currentUser?.name || '未登录' }}</text>
          <view class="title-tag">揭阳守护者</view>
        </view>
        <view class="level-section">
          <view class="level-bar">
            <view
              class="level-progress"
              :style="{ width: levelProgress + '%' }"
            ></view>
          </view>
          <text class="level-text">Lv.{{ currentUser?.level || 1 }}</text>
        </view>
      </view>
    </view>

    <!-- 核心：信物拼图册 -->
    <view class="seal-album">
      <view class="album-header">
        <text class="album-title">信物拼图</text>
        <text class="album-subtitle">Seal Puzzle</text>
      </view>

      <view class="seal-grid">
        <!-- 四周印章 - 2x2布局 -->
        <view class="seal-item" v-for="seal in mainSeals" :key="seal.id">
          <view
            class="seal-slot"
            :class="{ collected: isSealCollected(seal.id) }"
            @tap="showSealDetail(seal)"
          >
            <image
              v-if="isSealCollected(seal.id)"
              :src="seal.fullImage"
              class="seal-icon"
              mode="aspectFit"
            />
            <view v-else class="seal-placeholder">
              <text class="lock-icon">🔒</text>
              <text class="seal-name">{{ seal.name.slice(0, 2) }}</text>
            </view>
          </view>
          <text class="seal-label">{{ seal.name }}</text>
        </view>

        <!-- 中心老爷保号章 -->
        <view class="center-seal">
          <view
            class="master-seal-slot"
            :class="{ collected: isSealCollected('laoye_baohao_seal') }"
            @tap="showSealDetail(getMasterSeal())"
          >
            <image
              v-if="isSealCollected('laoye_baohao_seal')"
              :src="getMasterSeal()?.fullImage"
              class="seal-icon"
              mode="aspectFit"
            />
            <view v-else class="seal-placeholder master">
              <text class="lock-icon">🔒</text>
              <text class="seal-name">老爷保号</text>
            </view>
          </view>
          <text class="seal-label master-label">老爷保号章</text>
        </view>
      </view>

      <!-- 收集进度 -->
      <view class="progress-info">
        <text class="progress-text">收集进度：{{ collectedCount }} / 5</text>
        <view class="progress-bar">
          <view
            class="progress-fill"
            :style="{ width: (collectedCount / 5) * 100 + '%' }"
          ></view>
        </view>
      </view>
    </view>

    <!-- 功能菜单 -->
    <view class="menu-section">
      <view class="menu-item" @tap="openInventory">
        <view class="menu-item-left">
          <text class="menu-icon">🎒</text>
          <text class="menu-text">我的背包</text>
        </view>
        <text class="menu-arrow">></text>
      </view>

      <view class="menu-item" @tap="openStoryLog">
        <view class="menu-item-left">
          <text class="menu-icon">📜</text>
          <text class="menu-text">剧情回顾</text>
        </view>
        <text class="menu-arrow">></text>
      </view>

      <view class="menu-item" @tap="openSettings">
        <view class="menu-item-left">
          <text class="menu-icon">⚙️</text>
          <text class="menu-text">系统设置</text>
        </view>
        <text class="menu-arrow">></text>
      </view>
    </view>

    <!-- 印章详情弹窗 -->
    <view v-if="showSealModal" class="seal-modal-overlay" @tap="closeSealModal">
      <view class="seal-modal" @tap.stop>
        <view class="modal-header">
          <text class="modal-title">{{ selectedSeal?.name }}</text>
          <view class="close-btn" @tap="closeSealModal">×</view>
        </view>
        <view class="modal-content">
          <view class="seal-info-row">
            <image
              :src="selectedSeal?.fullImage"
              class="modal-seal-image"
              mode="aspectFit"
            />
            <view class="seal-text-col">
              <text class="modal-description">{{
                selectedSeal?.description
              }}</text>
            </view>
          </view>

          <view class="modal-theme">
            <text class="theme-label">文化主题：</text>
            <text class="theme-text">{{ selectedSeal?.culturalTheme }}</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 背包模态框 -->
    <InventoryModal
      v-model:visible="showInventoryModal"
      @close="showInventoryModal = false"
    />
  </view>
</template>

<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import { useGameStore } from '@/stores/useGameStore'
import CustomNavbar from '@/components/CustomNavbar.vue'
import InventoryModal from '@/components/InventoryModal.vue'

const gameStore = useGameStore()

// 响应式数据
const showSealModal = ref(false)
const selectedSeal = ref<any>(null)
const showInventoryModal = ref(false)

// 计算属性
const currentUser = computed(() => gameStore.currentUser)
const currentCityData = computed(() => gameStore.currentCityData)
const mainSeals = computed(
  () => currentCityData.value?.seals?.filter((seal) => !seal.isFinalSeal) || []
)
const collectedSeals = computed(() => gameStore.collectedSeals)
const collectedCount = computed(() => collectedSeals.value.length)

// 等级进度 (简单模拟)
const levelProgress = computed(() => {
  const level = currentUser.value?.level || 1
  return Math.min(level * 20, 100)
})

// 方法
const isSealCollected = (sealId: string) => {
  return collectedSeals.value.some((seal) => seal?.id === sealId)
}

const getMasterSeal = () => {
  return currentCityData.value?.seals?.find((seal) => seal.isFinalSeal)
}

const showSealDetail = (seal: any) => {
  if (seal && isSealCollected(seal.id)) {
    selectedSeal.value = seal
    showSealModal.value = true
  } else {
    uni.showToast({
      title: '尚未收集此印章',
      icon: 'none',
    })
  }
}

const closeSealModal = () => {
  showSealModal.value = false
  selectedSeal.value = null
}

const openInventory = () => {
  showInventoryModal.value = true
}

const openStoryLog = () => {
  uni.showToast({
    title: '剧情回顾功能开发中...',
    icon: 'none',
  })
}

const openSettings = () => {
  uni.showToast({
    title: '系统设置功能开发中...',
    icon: 'none',
  })
}

onMounted(() => {
  console.log('Mine page loaded, user:', currentUser.value)
  // 加载保存的游戏进度
  gameStore.loadProgress()
})
</script>

<style lang="scss" scoped>
.mine-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  padding: 20rpx 30rpx 100rpx 30rpx; // 仅顶部小间距，底部为 tabBar 留出空间
  position: relative;

  // 添加纸质感背景
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-image: radial-gradient(
        circle at 20% 30%,
        rgba(0, 137, 123, 0.05) 0%,
        transparent 50%
      ),
      radial-gradient(
        circle at 80% 70%,
        rgba(244, 67, 54, 0.05) 0%,
        transparent 50%
      );
    z-index: 0;
  }
}

// 头部卡片 - 深青色渐变，与导航栏无缝融合
.header-card {
  background: linear-gradient(135deg, #00897b 0%, #00695c 50%, #004d40 100%);
  border-radius: 0 0 24rpx 24rpx; // 只有底部圆角，与导航栏融合
  padding: 40rpx;
  margin-bottom: 40rpx;
  margin-top: 0; // 移除额外间距，页面padding已处理
  display: flex;
  align-items: center;
  box-shadow: 0 12rpx 30rpx rgba(0, 137, 123, 0.3);
  position: relative;
  z-index: 1;

  // 添加云纹效果
  &::after {
    content: '';
    position: absolute;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
    background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="clouds" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse"><circle cx="5" cy="5" r="1" fill="rgba(255,255,255,0.05)"/></pattern></defs><rect width="100" height="100" fill="url(%23clouds)"/></svg>');
    opacity: 0.3;
    border-radius: 24rpx;
    pointer-events: none;
  }
}

.avatar-section {
  position: relative;
  margin-right: 30rpx;

  .user-avatar {
    width: 120rpx;
    height: 120rpx;
    border-radius: 50%;
    border: 4rpx solid rgba(255, 255, 255, 0.9);
    position: relative;
    z-index: 2;
  }

  .avatar-border {
    position: absolute;
    top: -8rpx;
    left: -8rpx;
    right: -8rpx;
    bottom: -8rpx;
    border: 2rpx solid #bfa46f;
    border-radius: 50%;
    z-index: 1;
  }
}

.user-info {
  flex: 1;
  color: white;
}

.name-section {
  display: flex;
  align-items: center;
  margin-bottom: 15rpx;

  .user-name {
    font-size: 36rpx;
    font-weight: bold;
    margin-right: 15rpx;
    font-family: 'SimSun', 'STSong', serif;
  }

  .title-tag {
    background: rgba(191, 164, 111, 0.3);
    color: #ffc107;
    padding: 6rpx 12rpx;
    border-radius: 12rpx;
    font-size: 20rpx;
    border: 1rpx solid #bfa46f;
  }
}

.level-section {
  display: flex;
  align-items: center;

  .level-bar {
    width: 150rpx;
    height: 8rpx;
    background: rgba(255, 255, 255, 0.2);
    border-radius: 4rpx;
    overflow: hidden;
    margin-right: 15rpx;

    .level-progress {
      height: 100%;
      background: linear-gradient(90deg, #ffc107, #ff9800);
      border-radius: 4rpx;
      transition: width 0.3s ease;
    }
  }

  .level-text {
    font-size: 24rpx;
    opacity: 0.9;
  }
}

// 信物拼图册
.seal-album {
  background: rgba(255, 252, 245, 0.95);
  border-radius: 20rpx;
  padding: 30rpx;
  margin-bottom: 40rpx;
  box-shadow: 0 8rpx 25rpx rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(10rpx);
  position: relative;
  z-index: 1;
}

.album-header {
  text-align: center;
  margin-bottom: 40rpx;

  .album-title {
    font-size: 32rpx;
    font-weight: bold;
    color: #333;
    font-family: 'SimSun', 'STSong', serif;
    display: block;
    margin-bottom: 8rpx;
  }

  .album-subtitle {
    font-size: 22rpx;
    color: #666;
    font-style: italic;
  }
}

.seal-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 30rpx;
  margin-bottom: 30rpx;
  position: relative;

  // 中心印章特殊定位
  .center-seal {
    grid-column: 1 / -1;
    display: flex;
    flex-direction: column;
    align-items: center;
    margin-top: 20rpx;
  }
}

.seal-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.seal-slot {
  width: 120rpx;
  height: 120rpx;
  border-radius: 16rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  transition: all 0.3s ease;
  cursor: pointer;

  // 未收集状态
  background: #f5f5f5;
  border: 2rpx dashed #ddd;

  &.collected {
    background: rgba(0, 137, 123, 0.1);
    border: 2rpx solid #00897b;
    box-shadow: 0 4rpx 15rpx rgba(0, 137, 123, 0.2);

    &:active {
      transform: scale(0.95);
    }
  }

  .seal-icon {
    width: 80rpx;
    height: 80rpx;
  }

  .seal-placeholder {
    text-align: center;

    .lock-icon {
      font-size: 32rpx;
      display: block;
      margin-bottom: 8rpx;
      opacity: 0.5;
    }

    .seal-name {
      font-size: 20rpx;
      color: #999;

      &.master {
        font-size: 18rpx;
      }
    }
  }
}

.master-seal-slot {
  width: 140rpx;
  height: 140rpx;
  border-radius: 20rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  transition: all 0.3s ease;
  cursor: pointer;

  // 未收集状态
  background: linear-gradient(135deg, #fef8e7 0%, #f9f1dc 100%);
  border: 3rpx dashed #bfa46f;

  &.collected {
    background: rgba(191, 164, 111, 0.1);
    border: 3rpx solid #bfa46f;
    box-shadow: 0 6rpx 20rpx rgba(191, 164, 111, 0.3);

    &:active {
      transform: scale(0.95);
    }
  }

  .seal-icon {
    width: 100rpx;
    height: 100rpx;
  }

  .seal-placeholder.master {
    text-align: center;

    .lock-icon {
      font-size: 36rpx;
      display: block;
      margin-bottom: 8rpx;
      opacity: 0.6;
    }

    .seal-name {
      font-size: 20rpx;
      color: #bfa46f;
      font-weight: bold;
    }
  }
}

.seal-label {
  font-size: 24rpx;
  color: #333;
  margin-top: 12rpx;
  text-align: center;

  &.master-label {
    color: #bfa46f;
    font-weight: bold;
  }
}

.progress-info {
  text-align: center;

  .progress-text {
    font-size: 26rpx;
    color: #666;
    display: block;
    margin-bottom: 15rpx;
  }

  .progress-bar {
    width: 100%;
    height: 8rpx;
    background: #e0e0e0;
    border-radius: 4rpx;
    overflow: hidden;

    .progress-fill {
      height: 100%;
      background: linear-gradient(90deg, #00897b, #4caf50);
      border-radius: 4rpx;
      transition: width 0.5s ease;
    }
  }
}

// 功能菜单
.menu-section {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 20rpx;
  padding: 20rpx;
  box-shadow: 0 6rpx 20rpx rgba(0, 0, 0, 0.08);
  backdrop-filter: blur(10rpx);
  position: relative;
  z-index: 1;
}

.menu-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 25rpx 20rpx;
  border-bottom: 1rpx solid #f0f0f0;
  cursor: pointer;
  transition: background-color 0.2s ease;

  &:last-child {
    border-bottom: none;
  }

  &:active {
    background-color: rgba(0, 137, 123, 0.05);
  }

  .menu-item-left {
    display: flex;
    align-items: center;

    .menu-icon {
      font-size: 32rpx;
      margin-right: 20rpx;
      width: 40rpx;
      text-align: center;
    }

    .menu-text {
      font-size: 28rpx;
      color: #333;
    }
  }

  .menu-arrow {
    font-size: 24rpx;
    color: #ccc;
  }
}

// 印章详情弹窗
.seal-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(5rpx);
}

.seal-modal {
  background: rgba(255, 252, 245, 0.98);
  border-radius: 24rpx;
  padding: 30rpx;
  margin: 40rpx;
  max-width: 600rpx;
  width: 100%;
  box-shadow: 0 15rpx 40rpx rgba(0, 0, 0, 0.2);

  .modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 25rpx;

    .modal-title {
      font-size: 32rpx;
      font-weight: bold;
      color: #333;
      font-family: 'SimSun', 'STSong', serif;
    }

    .close-btn {
      font-size: 36rpx;
      color: #999;
      cursor: pointer;
      padding: 0 10rpx;

      &:active {
        color: #666;
      }
    }
  }

  .modal-content {
    display: flex;
    flex-direction: column;
    padding: 10rpx 0;
  }

  /* ✨ 横向布局核心 */
  .seal-info-row {
    display: flex;
    flex-direction: row;
    align-items: center; /* 垂直居中 */
    justify-content: flex-start;
    margin-bottom: 30rpx;
    padding: 0 20rpx; /* 增加一点内边距 */
    gap: 30rpx; /* 图文间距 */
  }

  .modal-seal-image {
    width: 140rpx;
    height: 140rpx;
    flex-shrink: 0; /* 防止图片被压缩 */
    border-radius: 12rpx;
    background: rgba(0, 0, 0, 0.03);
    border: 1rpx solid rgba(0, 0, 0, 0.05);
  }

  .seal-text-col {
    flex: 1; /* 占据剩余空间 */
    display: flex;
    flex-direction: column;
    justify-content: center;
  }

  .modal-description {
    font-size: 28rpx;
    color: #555;
    text-align: left; /* ✨ 左对齐更易阅读 */
    line-height: 1.6;
    /* 增加最大高度限制，防止文字太多 */
    max-height: 140rpx;
    overflow-y: auto;
  }

  /* 主题栏微调 */
  .modal-theme {
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(0, 137, 123, 0.08);
    padding: 16rpx;
    border-radius: 12rpx;
    margin: 0 20rpx; /* 与上方内容对齐 */

    .theme-label {
      font-size: 24rpx;
      color: #00897b;
      font-weight: bold;
      margin-right: 10rpx;
    }

    .theme-text {
      font-size: 24rpx;
      color: #00695c;
    }
  }
}
</style>
