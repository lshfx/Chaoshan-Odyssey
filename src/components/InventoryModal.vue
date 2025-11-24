<template>
  <view v-if="visible" class="inventory-modal-overlay" @tap="closeModal">
    <view class="inventory-modal" @tap.stop>
      <!-- 标题栏 -->
      <view class="modal-header">
        <text class="modal-title">行囊</text>
        <view class="close-btn" @tap="closeModal">×</view>
      </view>

      <!-- 分类标签 -->
      <view class="tab-header">
        <view
          class="tab-item"
          :class="{ 'active': activeTab === 'clues' }"
          @tap="switchTab('clues')"
        >
          <text class="tab-text">线索</text>
        </view>
        <view
          class="tab-item"
          :class="{ 'active': activeTab === 'items' }"
          @tap="switchTab('items')"
        >
          <text class="tab-text">道具</text>
        </view>
      </view>

      <!-- 物品网格 -->
      <scroll-view class="content-container" scroll-y="true">
        <view v-if="currentItems.length === 0" class="empty-state">
          <text class="empty-icon">🎒</text>
          <text class="empty-text">空空如也</text>
          <text class="empty-desc">继续探索，收集更多线索和道具</text>
        </view>

        <view v-else class="inventory-grid">
          <view
            v-for="item in currentItems"
            :key="item.id"
            class="grid-item"
            @tap="showItemDetail(item)"
          >
            <view class="item-icon-container">
              <image
                v-if="item.icon"
                :src="item.icon"
                class="item-icon"
                mode="aspectFit"
              />
              <text v-else class="item-placeholder">
                {{ activeTab === 'clues' ? '📜' : '🗝️' }}
              </text>
            </view>
            <text class="item-name">{{ item.name }}</text>
          </view>
        </view>
      </scroll-view>

      <!-- 物品详情弹窗 -->
      <view v-if="showDetail" class="detail-overlay" @tap="hideItemDetail">
        <view class="detail-modal" @tap.stop>
          <view class="detail-header">
            <text class="detail-title">{{ selectedItem?.name || selectedItem?.id }}</text>
            <view class="close-btn" @tap="hideItemDetail">×</view>
          </view>
          <view class="detail-content">
            <image
              :src="selectedItem?.icon || '/static/item-placeholder.png'"
              class="detail-image"
              mode="aspectFit"
            />
            <text class="detail-description">{{ selectedItem?.description || '暂无详细描述' }}</text>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useGameStore } from '@/stores/useGameStore'

interface Props {
  visible: boolean
}

interface Emits {
  (e: 'close'): void
  (e: 'update:visible', value: boolean): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const gameStore = useGameStore()
const activeTab = ref<'clues' | 'items'>('clues')
const showDetail = ref(false)
const selectedItem = ref<any>(null)

// 计算当前显示的物品列表
const currentItems = computed(() => {
  if (activeTab.value === 'clues') {
    // 获取线索数据
    const clueIds = gameStore.inventory.clues || []
    return clueIds.map(id => gameStore.getClueById(id)).filter(Boolean)
  } else {
    // 获取道具数据
    const itemIds = gameStore.inventory.items || []
    return itemIds.map(id => gameStore.getItemById?.(id)).filter(Boolean)
  }
})

// 切换标签
const switchTab = (tab: 'clues' | 'items') => {
  activeTab.value = tab
  hideItemDetail()
}

// 显示物品详情
const showItemDetail = (item: any) => {
  selectedItem.value = item
  showDetail.value = true
}

// 隐藏物品详情
const hideItemDetail = () => {
  showDetail.value = false
  selectedItem.value = null
}

// 关闭模态框
const closeModal = () => {
  emit('update:visible', false)
  emit('close')
}

// 监听 visible 变化，重置状态
watch(() => props.visible, (newVal) => {
  if (!newVal) {
    activeTab.value = 'clues'
    hideItemDetail()
  }
})
</script>

<style lang="scss" scoped>
.inventory-modal-overlay {
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

.inventory-modal {
  background: #FFFcF5;
  border-radius: 24rpx;
  border: 2rpx solid #BFA46F;
  width: 90%;
  max-width: 700rpx;
  height: 80vh;
  max-height: 800rpx;
  display: flex;
  flex-direction: column;
  box-shadow: 0 12rpx 40rpx rgba(0, 0, 0, 0.15);
  position: relative;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 30rpx;
  border-bottom: 1rpx solid rgba(191, 164, 111, 0.3);

  .modal-title {
    font-size: 36rpx;
    font-weight: bold;
    color: #333333;
    font-family: 'SimSun', 'STSong', serif;
  }

  .close-btn {
    font-size: 32rpx;
    color: #909399;
    cursor: pointer;
    padding: 10rpx;
    border-radius: 50%;
    transition: all 0.2s ease;
    background: rgba(144, 147, 153, 0.1);

    &:active {
      color: #606266;
      background: rgba(144, 147, 153, 0.2);
    }
  }
}

.tab-header {
  display: flex;
  background: rgba(0, 137, 123, 0.05);
  border-bottom: 1rpx solid rgba(0, 137, 123, 0.1);
}

.tab-item {
  flex: 1;
  padding: 24rpx;
  text-align: center;
  cursor: pointer;
  position: relative;
  transition: all 0.3s ease;

  .tab-text {
    font-size: 30rpx;
    color: #909399;
    transition: all 0.3s ease;
    font-weight: normal;
  }

  &.active {
    .tab-text {
      font-weight: bold;
      color: #00897B;
    }

    &::after {
      content: '';
      position: absolute;
      bottom: 0;
      left: 20%;
      right: 20%;
      height: 4rpx;
      background: #00897B;
      border-radius: 2rpx;
    }
  }
}

.content-container {
  flex: 1;
  padding: 30rpx;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  text-align: center;

  .empty-icon {
    font-size: 80rpx;
    margin-bottom: 20rpx;
    opacity: 0.6;
  }

  .empty-text {
    font-size: 28rpx;
    color: #909399;
    margin-bottom: 10rpx;
    font-weight: bold;
  }

  .empty-desc {
    font-size: 24rpx;
    color: #C0C4CC;
  }
}

.inventory-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20rpx;
}

.grid-item {
  background: #FFFFFF;
  border: 1rpx solid #E0D3B8;
  border-radius: 16rpx;
  padding: 20rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
  transition: all 0.2s ease;
  aspect-ratio: 1;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.05);

  &:active {
    transform: scale(0.95);
    background: #F2F6FC;
  }

  .item-icon-container {
    width: 80rpx;
    height: 80rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 10rpx;

    .item-icon {
      width: 60rpx;
      height: 60rpx;
    }

    .item-placeholder {
      font-size: 60rpx;
      color: #DCDFE6;
    }
  }

  .item-name {
    font-size: 24rpx;
    color: #606266;
    text-align: center;
    line-height: 1.2;
    word-break: break-all;
    font-weight: 500;
    margin-top: 10rpx;
  }
}

.detail-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1100;
  backdrop-filter: blur(8rpx);
}

.detail-modal {
  background: #FFFcF5;
  border-radius: 24rpx;
  border: 2rpx solid #BFA46F;
  padding: 30rpx;
  margin: 40rpx;
  max-width: 600rpx;
  width: 100%;
  max-height: 80vh;
  box-shadow: 0 20rpx 50rpx rgba(0, 0, 0, 0.3);
}

.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20rpx;
  padding-bottom: 15rpx;
  border-bottom: 1rpx solid rgba(191, 164, 111, 0.3);

  .detail-title {
    font-size: 32rpx;
    font-weight: bold;
    color: #333333;
    font-family: 'SimSun', 'STSong', serif;
  }

  .close-btn {
    font-size: 32rpx;
    color: #909399;
    cursor: pointer;
    padding: 10rpx;
    border-radius: 50%;
    background: rgba(144, 147, 153, 0.1);

    &:active {
      color: #606266;
      background: rgba(144, 147, 153, 0.2);
    }
  }
}

.detail-content {
  text-align: center;

  .detail-image {
    width: 120rpx;
    height: 120rpx;
    margin-bottom: 20rpx;
  }

  .detail-description {
    font-size: 28rpx;
    color: #606266;
    line-height: 1.6;
    text-align: justify;
  }
}
</style>