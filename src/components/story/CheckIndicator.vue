<template>
	<view class="check-indicator">
		<view class="check-loading">
			<text class="loading-dots">{{ text }}</text>
		</view>
	</view>
</template>

<script setup lang="ts">
	interface Props {
		text?: string
	}

	const props = withDefaults(defineProps<Props>(), {
		text: '判定中'
	})
</script>

<style lang="scss" scoped>
	.check-indicator {
		position: fixed;
		bottom: 320rpx;
		left: 50%;
		transform: translateX(-50%);
		z-index: 15;
	}

	.check-loading {
		background: rgba(0, 0, 0, 0.8);
		padding: 20rpx 40rpx;
		border-radius: 30rpx;
		backdrop-filter: blur(10rpx);

		.loading-dots {
			color: white;
			font-size: 26rpx;

			&::after {
				content: '...';
				animation: dots 1.5s steps(4, end) infinite;
			}
		}
	}

	@keyframes dots {
		0%, 20% { content: '.'; }
		40% { content: '..'; }
		60%, 100% { content: '...'; }
	}
</style>