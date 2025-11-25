<template>
  <view class="bottom-dashboard">
    <!-- 迷你罗盘 -->
    <view class="mini-compass-container">
      <!-- 刻度盘容器 (固定底盘) -->
      <view class="mini-dial">
        <view class="dial-ring"></view>

        <!-- 装饰性刻度线 -->
        <view class="dial-ticks">
          <!-- 主方向刻度线（粗） -->
          <view class="tick tick-major tick-top"></view>
          <view class="tick tick-major tick-right"></view>
          <view class="tick tick-major tick-bottom"></view>
          <view class="tick tick-major tick-left"></view>

          <!-- 次要刻度线（细） -->
          <view class="tick tick-minor tick-top-right"></view>
          <view class="tick tick-minor tick-bottom-right"></view>
          <view class="tick tick-minor tick-bottom-left"></view>
          <view class="tick tick-minor tick-top-left"></view>
        </view>
      </view>

      <!-- 指针容器 (兄弟节点，避免嵌套旋转叠加) -->
      <view
        class="mini-pointer"
        :style="{ transform: `translate(-50%, -50%) rotate(${pointerAngle}deg)` }"
      >
        <view class="pointer-arrow"></view>
        <view class="pointer-center"></view>
      </view>

      <text class="mini-compass-label">方位</text>
    </view>

    <!-- 数据面板 -->
    <view class="data-panel">
      <view class="data-item">
        <text class="data-label">距离</text>
        <text class="data-value">{{ distance }}</text>
      </view>
      <view class="data-item">
        <text class="data-label">预计</text>
        <text class="data-value">{{ duration }}</text>
      </view>
      <view class="data-item">
        <text class="data-label">时速</text>
        <text class="data-value">{{ speed }}</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
interface Props {
  deviceHeading: number
  pointerAngle: number
  distance: string
  duration: string
  speed: string
}

defineProps<Props>()
</script>

<style lang="scss" scoped>
// 底部仪表盘
.bottom-dashboard {
  position: absolute;
  bottom: 20px;
  bottom: calc(20px + env(safe-area-inset-bottom));
  left: 20px;
  right: 20px;
  display: flex;
  gap: 20px;
  z-index: 100;

  // 迷你罗盘
  .mini-compass-container {
    width: 100px;
    height: 100px;
    background: rgba(0, 50, 50, 0.9);
    backdrop-filter: blur(15px);
    border: 2px solid rgba(255, 215, 0, 0.6);
    border-radius: 50px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    position: relative;

    // 刻度盘容器 (固定底盘)
    .mini-dial {
      position: absolute;
      top: 50%;
      left: 50%;
      width: 70px;
      height: 70px;
      transform: translate(-50%, -50%);

      .dial-ring {
        position: absolute;
        width: 100%;
        height: 100%;
        border: 2px solid rgba(255, 215, 0, 0.4);
        border-radius: 50%;
      }

      // 装饰性刻度线容器
      .dial-ticks {
        position: absolute;
        width: 100%;
        height: 100%;

        .tick {
          position: absolute;
          border-radius: 1px;

          // 主方向刻度线（更粗更亮）
          &.tick-major {
            background: #FFD700;
            box-shadow: 0 0 6px rgba(255, 215, 0, 0.6);

            &.tick-top {
              top: 0;
              left: 50%;
              transform: translateX(-50%);
              width: 4px;
              height: 12px;
              box-shadow: 0 0 8px rgba(255, 215, 0, 0.8);
            }

            &.tick-right {
              top: 50%;
              right: 0;
              transform: translateY(-50%);
              width: 10px;
              height: 3px;
            }

            &.tick-bottom {
              bottom: 0;
              left: 50%;
              transform: translateX(-50%);
              width: 4px;
              height: 12px;
            }

            &.tick-left {
              top: 50%;
              left: 0;
              transform: translateY(-50%);
              width: 10px;
              height: 3px;
            }
          }

          // 次要刻度线（细，对角方向）
          &.tick-minor {
            background: rgba(255, 215, 0, 0.4);

            &.tick-top-right {
              top: 8px;
              right: 8px;
              width: 6px;
              height: 2px;
              transform: rotate(45deg);
            }

            &.tick-bottom-right {
              bottom: 8px;
              right: 8px;
              width: 6px;
              height: 2px;
              transform: rotate(-45deg);
            }

            &.tick-bottom-left {
              bottom: 8px;
              left: 8px;
              width: 6px;
              height: 2px;
              transform: rotate(45deg);
            }

            &.tick-top-left {
              top: 8px;
              left: 8px;
              width: 6px;
              height: 2px;
              transform: rotate(-45deg);
            }
          }
        }
      }
    }

    // 指针容器 (兄弟节点)
    .mini-pointer {
      position: absolute;
      top: 50%;
      left: 50%;
      width: 35px;
      height: 35px;
      transform: translate(-50%, -50%);
      transition: transform 0.2s linear;

      .pointer-arrow {
        position: absolute;
        top: 0;
        left: 50%;
        width: 0;
        height: 0;
        transform: translateX(-50%);
        border-left: 4px solid transparent;
        border-right: 4px solid transparent;
        border-bottom: 20px solid #FF6B6B;
        filter: drop-shadow(0 2px 4px rgba(255, 107, 107, 0.3));
      }

      .pointer-center {
        position: absolute;
        top: 50%;
        left: 50%;
        width: 8px;
        height: 8px;
        background: radial-gradient(circle, #FFD700 0%, #FF6B6B 100%);
        border-radius: 50%;
        transform: translate(-50%, -50%);
        box-shadow: 0 0 8px rgba(255, 215, 0, 0.4);
      }
    }

    .mini-compass-label {
      color: rgba(255, 215, 0, 0.8);
      font-size: 10px;
      font-family: 'SimSun', 'STSong', serif;
      margin-top: 2px;
    }
  }

  // 数据面板
  .data-panel {
    flex: 1;
    background: rgba(0, 50, 50, 0.9);
    backdrop-filter: blur(15px);
    border: 2px solid rgba(255, 215, 0, 0.6);
    border-radius: 16px;
    padding: 16px 20px;
    display: flex;
    align-items: center;
    justify-content: space-around;

    .data-item {
      text-align: center;

      .data-label {
        display: block;
        color: rgba(255, 215, 0, 0.7);
        font-size: 12px;
        margin-bottom: 4px;
        font-family: 'SimSun', 'STSong', serif;
      }

      .data-value {
        display: block;
        color: #FFD700;
        font-size: 18px;
        font-weight: bold;
        font-family: 'SimSun', 'STSong', serif;
      }
    }
  }
}
</style>