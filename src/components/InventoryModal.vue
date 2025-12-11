<template>
  <view v-if="visible" class="inventory-modal-overlay" @tap="closeModal">
    <view class="inventory-modal" @tap.stop>
      <view class="modal-header">
        <text class="modal-title">行囊</text>
        <view class="close-btn" @tap="closeModal">×</view>
      </view>

      <view class="tab-header">
        <view
          class="tab-item"
          :class="{ active: activeTab === 'clues' }"
          @tap="switchTab('clues')"
        >
          <text class="tab-text">线索</text>
        </view>
        <view
          class="tab-item"
          :class="{ active: activeTab === 'items' }"
          @tap="switchTab('items')"
        >
          <text class="tab-text">道具</text>
        </view>
      </view>

      <view class="scroll-wrapper">
        <scroll-view class="content-container" scroll-y="true">
          <view v-if="currentItems.length === 0" class="empty-state">
            <text class="empty-icon">🎒</text>
            <text class="empty-text">空空如也</text>
            <text class="empty-desc">继续探索，收集更多线索和道具</text>
          </view>

          <view v-else class="inventory-grid">
            <view
              v-for="item in currentItems"
              :key="item?.id"
              class="grid-item"
              @tap="showItemDetail(item)"
            >
              <view class="item-icon-container">
                <image
                  v-if="item?.icon"
                  :src="item.icon"
                  class="item-icon"
                  mode="aspectFit"
                />
                <text v-else class="item-placeholder">
                  {{ activeTab === 'clues' ? '📜' : '🗝️' }}
                </text>
              </view>
              <text class="item-name">{{ item?.name }}</text>
            </view>
          </view>
        </scroll-view>
      </view>

      <view v-if="showDetail" class="detail-overlay" @tap="hideItemDetail">
        <view class="detail-modal" @tap.stop>
          <view class="detail-header">
            <text class="detail-title">{{
              selectedItem?.name || selectedItem?.id
            }}</text>
            <view class="close-btn" @tap="hideItemDetail">×</view>
          </view>
          <view class="detail-content">
            <image
              :src="selectedItem?.icon || '/static/item-placeholder.png'"
              class="detail-image"
              mode="aspectFit"
            />
            <text class="detail-description">{{
              selectedItem?.description || '暂无详细描述'
            }}</text>
          </view>
          <view class="detail-actions">
            <view
              v-if="props.mode === 'select'"
              class="select-btn"
              @tap.stop="handleSelect"
            >
              <text class="select-text">📤 出示此物</text>
            </view>
            <view
              v-else-if="selectedItem?.inspectable"
              class="inspect-btn"
              @tap.stop="inspectItem"
            >
              <text class="inspect-text">🔍 调查</text>
            </view>
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
  mode?: 'inspect' | 'select'
}

interface Emits {
  (e: 'close'): void
  (e: 'update:visible', value: boolean): void
  (e: 'select', itemId: string): void
  (e: 'inspect', itemId: string): void
}

const props = withDefaults(defineProps<Props>(), {
  mode: 'inspect',
})
const emit = defineEmits<Emits>()

const gameStore = useGameStore()
const activeTab = ref<'clues' | 'items'>('clues')
const showDetail = ref(false)
const selectedItem = ref<any>(null)

const currentItems = computed(() => {
  if (activeTab.value === 'clues') {
    const clueIds = gameStore.inventory.clues || []
    return clueIds.map((id) => gameStore.getClueById(id)).filter(Boolean)
  } else {
    const itemIds = gameStore.inventory.items || []
    return itemIds.map((id) => gameStore.getItemById?.(id)).filter(Boolean)
  }
})

const switchTab = (tab: 'clues' | 'items') => {
  activeTab.value = tab
  hideItemDetail()
}

const showItemDetail = (item: any) => {
  selectedItem.value = item
  showDetail.value = true
}

const hideItemDetail = () => {
  showDetail.value = false
  selectedItem.value = null
}

const inspectItem = () => {
  if (selectedItem.value && selectedItem.value.inspectable) {
    emit('inspect', selectedItem.value.id)
  }
}

const handleSelect = () => {
  if (!selectedItem.value) return
  console.log('🎒 背包操作: 确认出示物品', selectedItem.value.id)
  emit('select', selectedItem.value.id)
  closeModal()
}

const closeModal = () => {
  emit('update:visible', false)
  emit('close')
}

watch(
  () => props.visible,
  (newVal) => {
    if (!newVal) {
      activeTab.value = 'clues'
      hideItemDetail()
    }
  }
)
</script>

<style lang="scss" scoped>
/* 蒙层 */
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
  z-index: 2000;
  backdrop-filter: blur(5rpx);
}

/* 弹窗主容器 */
.inventory-modal {
  background: #fffcf5;
  border-radius: 24rpx;
  border: 2rpx solid #bfa46f;
  width: 90%;
  max-width: 700rpx;
  /* 🚨 强制固定高度，确保 Flex 布局生效 */
  height: 80vh;
  max-height: 800rpx;
  display: flex;
  flex-direction: column;
  box-shadow: 0 12rpx 40rpx rgba(0, 0, 0, 0.15);
  position: relative;
  /* 🚨 核心：防止圆角溢出 */
  overflow: hidden;
}

/* 1. 头部样式 */
.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 30rpx;
  border-bottom: 1rpx solid rgba(191, 164, 111, 0.3);
  /* 防止 Flex 压缩 */
  flex-shrink: 0;
}
.modal-title {
  font-size: 36rpx;
  font-weight: bold;
  color: #333;
  font-family: 'SimSun', serif;
}
.close-btn {
  font-size: 32rpx;
  color: #909399;
  padding: 10rpx;
  cursor: pointer;
}

/* 2. 标签栏样式 */
.tab-header {
  display: flex;
  background: rgba(0, 137, 123, 0.05);
  border-bottom: 1rpx solid rgba(0, 137, 123, 0.1);
  flex-shrink: 0;
}
.tab-item {
  flex: 1;
  padding: 24rpx;
  text-align: center;
  position: relative;
}
.tab-text {
  font-size: 30rpx;
  color: #909399;
}
.tab-item.active .tab-text {
  font-weight: bold;
  color: #00897b;
}
.tab-item.active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 20%;
  right: 20%;
  height: 4rpx;
  background: #00897b;
}

/* 3. 滚动区域包装层 (核心布局) */
.scroll-wrapper {
  /* 占据 header 和 tab 剩下的所有空间 */
  flex: 1;
  /* 🚨 绝对定位的锚点 */
  position: relative;
  width: 100%;
  overflow: hidden;
}

/* 4. 滚动视图 */
.content-container {
  /* 🚨 绝对定位撑满 wrapper */
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  height: 100%;
  padding: 30rpx;
  box-sizing: border-box;
}

/* 网格样式 */
.inventory-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20rpx;
  padding-bottom: 30rpx;
}

.grid-item {
  background: #ffffff;
  border: 1rpx solid #e0d3b8;
  border-radius: 16rpx;
  padding: 20rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  /* 保持正方形 */
  aspect-ratio: 1;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.05);
}

.item-icon-container {
  width: 80rpx;
  height: 80rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 10rpx;
}
.item-icon {
  width: 60rpx;
  height: 60rpx;
}
.item-placeholder {
  font-size: 60rpx;
}

/* 文本截断修复 */
.item-name {
  font-size: 24rpx;
  color: #606266;
  text-align: center;
  line-height: 1.3;
  margin-top: 10rpx;
  width: 100%;
  /* 限制最多2行，超出省略 */
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;
  text-overflow: ellipsis;
  word-break: break-all;
}

/* 空状态 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #909399;
}
.empty-icon {
  font-size: 80rpx;
  margin-bottom: 20rpx;
  opacity: 0.6;
}
.empty-text {
  font-size: 28rpx;
  margin-bottom: 10rpx;
  font-weight: bold;
}
.empty-desc {
  font-size: 24rpx;
  color: #c0c4cc;
}

/* 详情弹窗样式 */
.detail-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  z-index: 2200;
  display: flex;
  align-items: center;
  justify-content: center;
}
.detail-modal {
  background: #fffcf5;
  width: 600rpx;
  padding: 30rpx;
  border-radius: 24rpx;
  border: 2rpx solid #bfa46f;
  box-shadow: 0 10rpx 30rpx rgba(0, 0, 0, 0.3);
}
.detail-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 20rpx;
  border-bottom: 1rpx solid #bfa46f;
  padding-bottom: 10rpx;
}
.detail-title {
  font-weight: bold;
  font-size: 32rpx;
  color: #333;
}
.detail-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin: 20rpx 0;
}
.detail-image {
  width: 150rpx;
  height: 150rpx;
  margin-bottom: 20rpx;
  border-radius: 12rpx;
  background-color: rgba(0, 0, 0, 0.05);
}
.detail-description {
  font-size: 28rpx;
  color: #666;
  text-align: left;
  line-height: 1.6;
  width: 100%;
}
.detail-actions {
  margin-top: 30rpx;
  display: flex;
  justify-content: center;
  gap: 20rpx;
}
.inspect-btn,
.select-btn {
  padding: 15rpx 50rpx;
  border-radius: 40rpx;
  color: white;
  font-size: 28rpx;
  font-weight: 600;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.2);
}
.inspect-btn {
  background: linear-gradient(135deg, #4caf50, #45a049);
}
.select-btn {
  background: linear-gradient(135deg, #ff6b6b, #ee5a24);
}
</style>
