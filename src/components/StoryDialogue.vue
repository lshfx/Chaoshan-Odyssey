<template>
	<view v-if="visible" class="dialogue-overlay" @tap="onOverlayTap">
		<image v-if="bgImage" :src="bgImage" class="dialogue-background" mode="aspectFill" />

		<view v-if="currentLine?.speakerType === 'narrator'" class="dialogue-overlay narrator-overlay" />

		<view v-if="showTask" class="task-layer" @tap.stop>
			<TaskPanel :task="currentLine.task!" @complete="handleTaskComplete" />
		</view>

		<view v-else-if="showTrueEndingCard" class="ending-layer" @tap.stop>
			<EndingCard :ending="currentLine.ending!" @close="handleEndingClose" />
		</view>

		<view v-else class="dialogue-layer">
			<ChoicePanel v-if="hasOptions" :options="currentLine.options!" @select="handleOptionSelect" />

			<DialogueBox
				v-if="!hasOptions"
				:key="currentLine?.id"
				:content="currentLine?.content || ''"
				:name="currentLine?.name || ''"
				:avatar="currentLine?.avatar"
				:speaker-type="(currentLine?.speakerType as 'narrator' | 'player' | 'npc') || 'narrator'"
				@next="handleDialogueTap"
			/>
		</view>

		<view v-if="!showTrueEndingCard" class="skip-button" @tap.stop="skipDialogue">
			<text class="skip-text">跳过 (SKIP)</text>
		</view>
	</view>
</template>

<script setup lang="ts">
	import { ref, computed, watch } from 'vue'
	import DialogueBox from './story/DialogueBox.vue'
	import ChoicePanel from './story/ChoicePanel.vue'
	import TaskPanel from './story/TaskPanel.vue'
	import EndingCard from './story/EndingCard.vue'
	import type { StoryEnding } from '@/mock/types'

	// 接口定义
	interface DialogueOption {
		label : string
		value : string
	}

	interface Task {
		type : 'question' | 'action'
		description : string
		options ?: string[]
		correctOption ?: string | number
		actionText ?: string
	}

	interface DialogueLine {
		id : string
		speakerType : 'player' | 'npc' | 'narrator' | 'task'
		name : string
		avatar ?: string
		content : string
		options ?: DialogueOption[]
		task ?: Task
		ending ?: StoryEnding
		type ?: 'end'
		nextId ?: string
		failId ?: string
	}

	// Props 定义
	interface Props {
		visible : boolean
		script : DialogueLine[]
		bgImage ?: string
	}

	const props = withDefaults(defineProps<Props>(), {
		bgImage: ''
	})

	// Emits 定义
	const emit = defineEmits<{
		'update:visible' : [value: boolean]
		'option-selected' : [option: DialogueOption]
		'dialogue-end' : []
		'line-change' : [line: DialogueLine]
	}>()

	// 响应式数据
	const currentIndex = ref(0)

	// 计算属性
	const currentLine = computed(() => {
		return props.script[currentIndex.value] || null
	})

	// 🔥 [关键修改] 只有明确包含 ending 数据的才是真结局
	const showTrueEndingCard = computed(() => {
		return !!currentLine.value?.ending
	})

	// 🔥 [关键修改] 识别"普通结束"节点 (type='end' 但没有 ending 数据)
	const isNormalEnd = computed(() => {
		return currentLine.value?.type === 'end' && !currentLine.value?.ending
	})

	const showTask = computed(() => {
		return currentLine.value?.speakerType === 'task' && !!currentLine.value?.task
	})

	const hasOptions = computed(() => {
		return !!(currentLine.value?.options && currentLine.value.options.length > 0)
	})

	// 方法
	const onOverlayTap = () => {
		handleDialogueTap()
	}

	// 统一处理点击逻辑
	const handleDialogueTap = () => {
		if (showTask.value) return
		if (showTrueEndingCard.value) return // 真结局必须点卡片按钮
		if (hasOptions.value) return

		// 🔥 [关键修改] 如果是普通结束节点，点击直接退出
		if (isNormalEnd.value) {
			endDialogue()
			return
		}

		// 否则继续下一句
		nextDialogue()
	}

	const nextDialogue = () => {
		if (currentIndex.value < props.script.length - 1) {
			currentIndex.value++
			emit('line-change', currentLine.value!)
		} else {
			// 如果已经是最后一句，直接结束
			endDialogue()
		}
	}

	const handleOptionSelect = (option : DialogueOption) => {
		emit('option-selected', option)
	}

	const handleTaskComplete = (success : boolean, result ?: any) => {
		console.log('Task completed:', { success, result })
		const node = currentLine.value

		if (success) {
			if (node?.nextId) {
				emit('option-selected', {
					label: '任务成功',
					value: 'success',
					nextId: node.nextId
				} as any)
			} else {
				nextDialogue()
			}
		} else {
			if (node?.failId) {
				emit('option-selected', {
					label: '任务失败',
					value: 'fail',
					nextId: node.failId
				} as any)
			} else {
				uni.showToast({
					title: '回答错误，请再试一次',
					icon: 'none',
					duration: 2000
				})
			}
		}
	}

	const handleEndingClose = () => {
		endDialogue()
	}

	const skipDialogue = () => {
		endDialogue()
	}

	// 供父组件调用的方法
	const continueDialogue = () => {
		if (currentIndex.value < props.script.length - 1) {
			currentIndex.value++
			emit('line-change', currentLine.value!)
		} else {
			// 如果是普通结束页，保持显示等待用户点击退出；否则直接退出
			if (!isNormalEnd.value) {
				endDialogue()
			}
		}
	}

	const endDialogue = () => {
		emit('update:visible', false)
		emit('dialogue-end')
	}

	// 监听显示状态变化，重置索引
	watch(() => props.visible, (newVisible) => {
		if (newVisible) {
			currentIndex.value = 0
		}
	})

	// 监听script prop变化，强制重置索引
	watch(() => props.script, (newScript) => {
		if (newScript && newScript.length > 0) {
			currentIndex.value = 0
		}
	})

	// 暴露方法给父组件
	defineExpose({
		nextDialogue,
		skipDialogue,
		continueDialogue,
		currentIndex,
		currentLine
	})
</script>

<style lang="scss" scoped>
	.dialogue-overlay {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		z-index: 1000;

		.dialogue-background {
			position: absolute;
			top: 0;
			left: 0;
			right: 0;
			bottom: 0;
			z-index: -1;
		}

		.narrator-overlay {
			position: absolute;
			top: 0;
			left: 0;
			right: 0;
			bottom: 0;
			background: rgba(0, 0, 0, 0.7);
			z-index: 1;
		}
	}

	// 跳过按钮
	.skip-button {
		position: fixed;
		top: 40rpx;
		right: 40rpx;
		background: rgba(0, 0, 0, 0.8);
		color: white;
		padding: 15rpx 25rpx;
		border-radius: 25rpx;
		z-index: 200; // 最高层级，确保始终可点击
		backdrop-filter: blur(10rpx);
		border: 2rpx solid rgba(255, 255, 255, 0.2);

		.skip-text {
			font-size: 24rpx;
			font-weight: 500;
		}

		&:active {
			opacity: 0.8;
			transform: scale(0.95);
		}
	}
</style>