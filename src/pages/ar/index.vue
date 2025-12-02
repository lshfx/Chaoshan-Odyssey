<template>
	<view class="ar-page">
		<!-- 背景：摄像头或静态图片 -->
		<view class="background-layer">
			<!-- 摄像头层 (z-index: 1) -->
			<camera v-if="isCameraAuth" class="camera-view" mode="normal" device-position="back" flash="auto" />

			<!-- 静态图片降级层 (z-index: 0) -->
			<image v-else class="fallback-image" :src="bgImage" mode="aspectFill" @load="onImageLoad"
				@error="onImageError" />

			<!-- 加载状态指示器 -->
			<view v-if="isImageLoading && !isCameraAuth" class="loading-indicator">
				<text class="loading-text">背景加载中...</text>
			</view>
		</view>

		<!-- UI层：退出按钮 (z-index: 100) -->
		<view class="ui-layer">
			<view class="exit-btn" @tap="handleExit">
				<text class="exit-icon">✖</text>
				<text class="exit-text">退出实景</text>
			</view>
		</view>

		<!-- 对话层 (z-index: 999) -->
		<StoryDialogue ref="dialogueComponent" v-model:visible="gameStore.isDialogueVisible"
			:script="gameStore.currentScript" :bg-image="isCameraAuth ? '' : bgImage" @option-selected="handleOptionSelected"
			@dialogue-end="handleDialogueEnd" @line-change="handleLineChange" />
	</view>
</template>

<script setup lang="ts">
	import { ref, watch } from 'vue'
	import { onLoad, onUnload } from '@dcloudio/uni-app'
	import { useGameStore } from '../../stores/useGameStore'
	import { jieyang } from '../../mock/jieyang'
	import type { NPC, ScriptNode, StoryEnding } from '../../mock/types'
	import StoryDialogue from '../../components/StoryDialogue.vue'

	// 🎭 故事结局数据字典
	const STORY_ENDINGS : Record<string, StoryEnding> = {
		ending_perfect: {
			id: 'ending_perfect',
			characterId: 'chen_linger',
			type: 'perfect',
			title: '完美结局：真相大白',
			achievement: '真相守护者',
			description: '成功揭露了蔡福生的真面目，找回了失落的《护卫日志》。百年的冤案终于昭雪，揭阳古城的文脉得以完整传承。',
			background: '经过一番智斗，陈灵儿不仅保护了珍贵的印章，更重要的是还原了历史的真相。蔡福生的阴谋被彻底粉碎，而那本记录着家族荣耀与责任的《护卫日志》重见天日。揭阳的文脉得以完整传承，你的名字将永远铭记在这座古城的历史中。',
			imageUrl: '/static/endings/perfect.png',
			musicUrl: '/static/audio/ending_perfect.mp3',
			conditions: {
				minCourage: 1,
				minClue: 2,
				minIntimacy: 0
			}
		},
		ending_normal: {
			id: 'ending_normal',
			characterId: 'chen_linger',
			type: 'normal',
			title: '普通结局：虽胜犹憾',
			achievement: '古城守夜人',
			description: '蔡福生被捕，但《护卫日志》下落不明。虽然守护了印章，但当年的真相可能永远埋藏在了历史的尘埃中。',
			background: '虽然成功阻止了蔡福生的恶行，但那本承载着真相的《护卫日志》在混乱中被焚毁。你守护了揭阳的文化遗产，却失去了揭开全部真相的机会。或许，有些故事注定要带着遗憾继续书写。你成为了这座古城新的守夜人，默默守护着那些不为人知的秘密。',
			imageUrl: '/static/endings/normal.png',
			musicUrl: '/static/audio/ending_normal.mp3',
			conditions: {
				minCourage: 0,
				minClue: 0,
				minIntimacy: 0
			}
		},
		ending_bad: {
			id: 'ending_bad',
			characterId: 'chen_linger',
			type: 'bad',
			title: '悲剧结局：线索断绝',
			achievement: '雨夜孤影',
			description: '关键证据被毁，唯一的线索化为灰烬。你虽然得到了印章，但心中的谜团将永远无法解开。',
			background: '在那个雨夜，眼看着蔡福生将《护卫日志》投入烈火，所有的线索都化为了灰烬。虽然你成功保护了印章的安全，但那个困扰你多年的谜团却永远失去了答案。从此，每当雨夜降临，你都会独自站在揭阳古城的屋檐下，凝望着那片埋葬真相的废墟，心中留下永远的遗憾。',
			imageUrl: '/static/endings/bad.png',
			musicUrl: '/static/audio/ending_bad.mp3',
			conditions: {
				minCourage: -1,
				minClue: 0,
				minIntimacy: -1
			}
		}
	}

	// Store
	const gameStore = useGameStore()

	// 响应式变量
	const isCameraAuth = ref<boolean>(false)
	const bgImage = ref<string>('/static/ar_fallback.png')
	const isImageLoading = ref<boolean>(true)
	const hasImageError = ref<boolean>(false)
	const currentScript = ref<ScriptNode[]>([])

	// 路由参数
	const routeParams = ref<{
		npcId ?: string
		poiId ?: string
	}>({})

	// 当前NPC数据
	const currentNPC = ref<NPC | null>(null)

	// StoryDialogue 组件引用
	const dialogueComponent = ref<InstanceType<typeof StoryDialogue> | null>(null)

	onUnload(() => {
		console.log('AR页面卸载，清理全局状态')
		gameStore.isDialogueVisible = false
		gameStore.currentScript = []
	})

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

	// 叙事引擎：根据选项查找下一个节点
	const findNextNode = (nextId : string) : ScriptNode | null => {
		if (!currentNPC.value) return null

		const scriptNodes = currentNPC.value.scriptNodes || []
		return scriptNodes.find(node => node.id === nextId) || null
	}

	// 数据转换函数：将ScriptNode转换为StoryDialogue所需格式
	const transformNode = (node : ScriptNode) : ScriptNode & { speakerType ?: string; task ?: any; ending ?: StoryEnding } => {
		const newNode = { ...node } as any

		// 1. 映射 speakerType
		if (node.type === 'task') {
			newNode.speakerType = 'task'
			// 2. 注入 task 数据
			if (node.taskId && currentNPC.value?.tasks) {
				newNode.task = currentNPC.value.tasks.find(t => t.id === node.taskId)
			}
		} else {
			// 普通的 speakerType 映射逻辑
			if (node.speaker === '系统') {
				newNode.speakerType = 'narrator'
			} else if (node.speaker === '陈灵儿') {
				newNode.speakerType = 'player'
			} else {
				newNode.speakerType = 'npc'
			}
		}

		// 🎭 3. 注入结局数据 - 关键修复
		if (node.endingId && STORY_ENDINGS[node.endingId]) {
			newNode.ending = STORY_ENDINGS[node.endingId]
			console.log('🎭 注入结局数据:', node.endingId, '->', newNode.ending.title)
		}

		return newNode
	}

	// 1. 先定义工具函数：检查NPC是否已完成
	const checkNPCCompletion = (npc : NPC) : boolean => {
		if (!npc.sealId) {
			console.log('NPC没有关联印章:', npc.id)
			return false
		}
		// 检查背包里是否有该 NPC 守护的印章
		const hasSeal = gameStore.inventory.seals.includes(npc.sealId)
		console.log('检查NPC完成状态:', npc.id, '印章ID:', npc.sealId, '拥有印章:', hasSeal)
		return hasSeal
	}

	// 2. 先定义工具函数：从已完成节点池中随机选择
	const getRandomCompletedNode = (scriptNodes : ScriptNode[]) : ScriptNode | null => {
		// 定义已完成节点的ID前缀
		const completedNodePrefix = 'completed_'

		// 过滤出已完成相关的节点
		const completedNodes = scriptNodes.filter(node =>
			node.id && node.id.startsWith(completedNodePrefix)
		)

		if (completedNodes.length === 0) {
			console.log('未找到已完成相关的节点')
			return null
		}

		// 随机选择一个节点
		const randomIndex = Math.floor(Math.random() * completedNodes.length)
		const selectedNode = completedNodes[randomIndex]

		console.log('从', completedNodes.length, '个已完成节点中随机选择:', selectedNode.id)
		return selectedNode
	}

	// 3. 最后定义主逻辑：构建初始对话脚本
	const buildInitialScript = () => {
		if (!currentNPC.value) return

		const scriptNodes = currentNPC.value.scriptNodes || []
		if (scriptNodes.length === 0) return

		let startNode : ScriptNode | null = null

		// 优先检查：是否已完成该 NPC 任务？
		const hasCompleted = checkNPCCompletion(currentNPC.value)

		if (hasCompleted) {
			// ✅ 已完成：随机进入闲聊模式
			startNode = getRandomCompletedNode(scriptNodes)
			if (startNode) {
				console.log('任务已完成，进入闲聊模式:', startNode.id)
			}
		}

		// 如果没完成（或者没找到闲聊节点），则尝试读取存档
		if (!startNode) {
			const savedNodeId = gameStore.getNPCProgress(currentNPC.value.id)
			if (savedNodeId) {
				startNode = scriptNodes.find(node => node.id === savedNodeId) || null
				if (startNode) console.log('读取存档恢复进度:', savedNodeId)
			}
		}

		// 最后的兜底：从头开始
		if (!startNode) {
			startNode = scriptNodes[0]
		}

		if (!startNode) return

		// 构建脚本并显示
		const initialScript = [transformNode(startNode)]

		// 如果是普通剧情，继续加载后续线性节点；如果是闲聊(end类型)，这就只有一句
		let currentNode = startNode
		while (currentNode.nextId && !currentNode.options && currentNode.type !== 'end') {
			const nextNode = findNextNode(currentNode.nextId)
			if (nextNode) {
				initialScript.push(transformNode(nextNode))
				currentNode = nextNode
			} else {
				break
			}
		}

		currentScript.value = initialScript
		gameStore.currentScript = initialScript

		setTimeout(() => {
			gameStore.isDialogueVisible = true
		}, 1000)
	}

	const loadNPCData = () => {
		const { npcId, poiId } = routeParams.value

		if (!npcId) {
			console.log('缺少npcId参数')
			return
		}

		// 🕵️‍♀️ 开始：动态NPC覆盖机制 - Chen Linger的终局对决
		let targetNpcId = npcId

		// 条件检查
		const isChenLinger = gameStore.currentUser?.id === 'chen_linger'
		const isNotCaiFusheng = gameStore.currentUser?.id !== 'cai_fusheng' // 防止蔡福生打自己
		const isAtJinxianGate = targetNpcId === 'li_chengshou' || poiId === 'jinxian_gate'

		// 检查是否进入终局阶段 - 拥有前面2个印章表示剧情进展到终局
		const seals = gameStore.inventory.seals || []
		const hasSealOne = seals.includes('seal_one')
		const hasSealTwo = seals.includes('seal_two')
		const isReadyForFinale = hasSealOne && hasSealTwo

		// 执行覆盖逻辑
		if (isChenLinger && isNotCaiFusheng && isAtJinxianGate && isReadyForFinale) {
			targetNpcId = 'cai_fusheng'
			console.log('⚡ 触发终局对决：陈灵儿 vs 蔡福生')
			console.log('📍 位置：进贤门 (jinxian_gate)')
			console.log('📜 剧情进度：已获得前2枚印章，触发最终BOSS战')
			console.log('🔄 NPC覆盖：li_chengshou -> cai_fusheng')
		}

		// 从jieyang.npcs数组中查找对应的NPC（使用可能被覆盖的targetNpcId）
		currentNPC.value = jieyang.npcs.find((npc : NPC) => npc.id === targetNpcId) || null

		if (!currentNPC.value) {
			console.log('未找到NPC数据:', targetNpcId)
			uni.showToast({
				title: '未找到对应的NPC数据',
				icon: 'none'
			})
			return
		}

		// 如果发生了覆盖，记录调试信息
		if (targetNpcId !== npcId) {
			console.log('✅ NPC覆盖成功：')
			console.log('   原始NPC:', npcId, '->', '覆盖NPC:', targetNpcId)
			console.log('   当前NPC:', currentNPC.value.name, '(', currentNPC.value.title, ')')
		}

		// 设置背景图片（使用NPC的background）
		if (currentNPC.value.background) {
			bgImage.value = currentNPC.value.background
			isImageLoading.value = true
			hasImageError.value = false
			console.log('加载NPC背景:', currentNPC.value.background)
		} else {
			// NPC没有背景图片，使用默认黑色背景
			bgImage.value = '/static/ar_fallback.png'
			isImageLoading.value = false
			hasImageError.value = false
			console.log('NPC无背景图片，使用默认背景:', currentNPC.value?.name)
		}

		// 构建初始对话脚本
		buildInitialScript()
	}

	// 处理选项选择
	const handleOptionSelected = (option : any) => {
		console.log('玩家选择了选项:', option)

		// 1. 拦截"稍后再来"相关选项 - 直接退出并保存进度
		const isLeaveChoice = option.nextId === 'act1_leave_choice' || option.nextId === 'act1_leave'

		if (isLeaveChoice) {
			// 保存当前正在显示的节点ID（但不保存闲聊节点）
			if (currentNPC.value && gameStore.currentScript.length > 0) {
				const currentNodeId = gameStore.currentScript[0].id

				// 检查是否是闲聊节点，如果是则不保存
				if (!currentNodeId || !currentNodeId.startsWith('completed_')) {
					gameStore.saveNPCProgress(currentNPC.value.id, currentNodeId)
					console.log('保存进度到存档:', currentNPC.value.id, '->', currentNodeId)
				} else {
					console.log('闲聊节点不保存进度:', currentNodeId)
				}
			}

			// ✅ 新增：在退出前，必须关闭全局对话框状态！
			gameStore.isDialogueVisible = false
			// ✅ 新增：清空当前脚本，防止残留
			gameStore.currentScript = []

			uni.showToast({ title: '进度已保存', icon: 'none' })
			setTimeout(() => uni.navigateBack(), 500)
			return
		}

		// 2. 正常选项处理逻辑
		// 查找下一个节点
		const nextNode = findNextNode(option.nextId)
		if (!nextNode) {
			console.log('没有找到下一个节点:', option.nextId)
			return
		}

		// 构建新的脚本片段（先转换数据格式）
		const transformedNextNode = transformNode(nextNode)
		const newScript = [transformedNextNode]

		// 如果下一个节点有后续节点且没有选项，继续添加线性节点
		let currentNode = transformedNextNode
		while (currentNode.nextId && !currentNode.options) {
			const subsequentNode = findNextNode(currentNode.nextId)
			if (subsequentNode) {
				const transformedSubsequentNode = transformNode(subsequentNode)
				newScript.push(transformedSubsequentNode)
				currentNode = transformedSubsequentNode
			} else {
				break
			}
		}

		// 更新脚本
		currentScript.value = newScript
		gameStore.currentScript = newScript

		// 删除对 continueDialogue 的调用，避免双重重置问题
		// StoryDialogue 组件会在 watch props.script 时自动重置 currentIndex = 0
		// 这里的调用会导致索引被重置，然后立即触发结束条件
	}

	// 处理对话行变化
	const handleLineChange = (line : any) => {
		console.log('当前对话行变化:', line.id)

		// ✅ 通用逻辑：检查是否有 trigger 触发器
		if (line.trigger === 'grant_seal') {
			// 确保当前 NPC 有关联的 sealId
			if (currentNPC.value && currentNPC.value.sealId) {
				// 1. 检查是否已经拿过了（防止重复弹窗）
				const alreadyHas = gameStore.inventory.seals.includes(currentNPC.value.sealId)

				if (!alreadyHas) {
					// 2. 调用 Store 添加印章 (内部会自动 saveProgress)
					gameStore.addSeal(currentNPC.value.sealId)

					// 3. UI 反馈
					uni.showToast({
						title: '印章已收入背包',
						icon: 'success',
						duration: 2000
					})
					console.log(`[Trigger] 触发奖励发放: ${currentNPC.value.sealId}`)
				} else {
					console.log(`[Trigger] 玩家已拥有印章，跳过发放`)
				}
			} else {
				console.warn(`[Trigger] 触发了 grant_seal 但当前 NPC 没有 sealId`)
			}
		}

		// 如果当前行有nextId且没有选项，可以在播放完后自动加载下一个节点
		if (line.nextId && !line.options) {
			// 这里可以让StoryDialogue在播放完当前行后自动继续
			// 或者在这里预加载下一个节点
			const nextNode = findNextNode(line.nextId)
			if (nextNode) {
				console.log('预加载下一个节点:', nextNode.id)
			}
		}
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
			if (currentNPC.value) {
				console.log('任务完成，NPC:', currentNPC.value.id)
				// 这里可以添加任务完成的逻辑
			}

			uni.navigateBack()
		}, 1500)
	}

	// 图片加载成功处理
	const onImageLoad = () => {
		console.log('背景图片加载成功:', bgImage.value)
		isImageLoading.value = false
		hasImageError.value = false
	}

	// 图片加载失败处理
	const onImageError = () => {
		console.log('背景图片加载失败，切换到默认背景')
		hasImageError.value = true
		isImageLoading.value = false

		// 如果POI背景加载失败，使用黑色背景图
		if (bgImage.value !== '/static/ar_fallback.png') {
			bgImage.value = '/static/ar_fallback.png'
			console.log('已切换到默认背景')
		}

		// 提示用户（可选，避免干扰用户体验可以注释掉）
		// uni.showToast({
		//   title: '背景图片加载失败，使用默认背景',
		//   icon: 'none',
		//   duration: 2000
		// })
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

		// 加载NPC数据
		loadNPCData()

		// 检查摄像头权限
		checkCameraPermission()
	})

	// 监听NPC数据变化，构建脚本
	watch(currentNPC, (newNPC) => {
		if (newNPC && !gameStore.isDialogueVisible) {
			// NPC数据变化时重新构建脚本
			buildInitialScript()
		}
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

	/* 黑色主题适配 */
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