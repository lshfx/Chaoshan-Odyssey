<template>
  <view class="top-hud-card">
    <view class="hud-header">
      <view class="nav-icon">
        <text class="nav-symbol">{{ symbol }}</text>
      </view>
      <view class="nav-info">
        <text class="nav-instruction">{{ instruction }}</text>
        <text class="target-name">{{ targetName || '请设置导航目标' }}</text>
      </view>
      <view class="nav-actions">
        <view class="action-btn" @tap="handleTapSelector">
          <text class="action-icon">🎯</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
interface Props {
  symbol: string
  instruction: string
  targetName: string
}

interface Emits {
  (e: 'tap-selector'): void
}

const props = withDefaults(defineProps<Props>(), {
  symbol: '🧭',
  instruction: '',
  targetName: ''
})

const emit = defineEmits<Emits>()

const handleTapSelector = () => {
  emit('tap-selector')
}
</script>

<style lang="scss" scoped>
// 顶部HUD卡片
.top-hud-card {
  position: absolute;
  top: calc(var(--status-bar-height) + 44px + 20px);
  left: 20px;
  right: 20px;
  background: rgba(0, 77, 64, 0.85);
  backdrop-filter: blur(15px);
  border-radius: 16px;
  border: 2px solid rgba(255, 215, 0, 0.4);
  padding: 16px 20px;
  z-index: 100;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);

  .hud-header {
    display: flex;
    align-items: center;
    gap: 12px;

    .nav-icon {
      width: 50px;
      height: 50px;
      background: rgba(255, 215, 0, 0.15);
      border: 2px solid rgba(255, 215, 0, 0.6);
      border-radius: 25px;
      display: flex;
      align-items: center;
      justify-content: center;

      .nav-symbol {
        font-size: 28px;
      }
    }

    .nav-info {
      flex: 1;

      .nav-instruction {
        display: block;
        color: #FFFFFF;
        font-size: 16px;
        font-weight: 600;
        margin-bottom: 4px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      }

      .target-name {
        display: block;
        color: rgba(255, 215, 0, 0.8);
        font-size: 14px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      }
    }

    .nav-actions {
      .action-btn {
        width: 40px;
        height: 40px;
        background: rgba(255, 215, 0, 0.2);
        border: 1px solid rgba(255, 215, 0, 0.4);
        border-radius: 20px;
        display: flex;
        align-items: center;
        justify-content: center;

        .action-icon {
          font-size: 18px;
        }
      }
    }
  }
}
</style>