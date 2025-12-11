<template>
	<view class="present-item-actions">
		<view class="present-button" @tap.stop="handlePresent">
			<text class="present-icon">🎒</text>
			<text class="present-text">出示证物</text>
		</view>
		<text v-if="hint" class="present-hint">{{ hint }}</text>
	</view>
</template>

<script setup lang="ts">
	interface Props {
		hint?: string
	}

	const props = withDefaults(defineProps<Props>(), {
		hint: ''
	})

	const emit = defineEmits<{
		present: []
	}>()

	const handlePresent = () => {
		console.log('[举证面板] 用户点击出示证物')
		emit('present')
	}
</script>

<style lang="scss" scoped>
	.present-item-actions {
		position: fixed;
		bottom: 320rpx;
		left: 50%;
		transform: translateX(-50%);
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 20rpx;
		z-index: 15;
	}

	.present-button {
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		color: white;
		padding: 25rpx 50rpx;
		border-radius: 50rpx;
		display: flex;
		align-items: center;
		gap: 15rpx;
		box-shadow: 0 10rpx 30rpx rgba(102, 126, 234, 0.4);
		cursor: pointer;
		transition: all 0.3s ease;

		&:active {
			transform: scale(0.95);
			box-shadow: 0 5rpx 15rpx rgba(102, 126, 234, 0.4);
		}

		.present-icon {
			font-size: 36rpx;
		}

		.present-text {
			font-size: 28rpx;
			font-weight: 600;
		}
	}

	.present-hint {
		font-size: 24rpx;
		color: rgba(255, 255, 255, 0.8);
		text-align: center;
		background: rgba(0, 0, 0, 0.6);
		padding: 15rpx 30rpx;
		border-radius: 25rpx;
		backdrop-filter: blur(10rpx);
	}
</style>