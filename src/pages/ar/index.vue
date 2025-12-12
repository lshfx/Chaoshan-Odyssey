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
			@dialogue-end="handleDialogueEnd" @line-change="handleLineChange" @present-request="handlePresentRequest" />
	</view>

	<!-- 物品选择弹窗 (z-index: 1000) -->
	<InventoryModal v-model:visible="showItemSelector" mode="select" @select="handleItemSelection" @inspect="handleItemInspect" />
</template>

<script setup lang="ts">
	import { ref, watch, nextTick } from 'vue'
	import { onLoad, onUnload } from '@dcloudio/uni-app'
	import { useGameStore } from '../../stores/useGameStore'
	import { jieyang } from '../../mock/jieyang'
	import type { NPC, ScriptNode, StoryEnding } from '../../mock/types'
	import StoryDialogue from '../../components/StoryDialogue.vue'
	import InventoryModal from '../../components/InventoryModal.vue'

	// 🌟 引入新的世界状态系统
	import { resolveNpcId } from '../../mock/world_states'

	// 🎭 引入抽离的结局数据
	import { storyEndings } from '../../mock/endings'

	
	// Store
	const gameStore = useGameStore()

	// 响应式变量
	const isCameraAuth = ref<boolean>(false)
	const bgImage = ref<string>('/static/ar_fallback.png')
	const isImageLoading = ref<boolean>(true)
	const hasImageError = ref<boolean>(false)
	const currentScript = ref<ScriptNode[]>([])
	const showItemSelector = ref<boolean>(false)
	const currentPresentNode = ref<ScriptNode | null>(null)

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

		// 🌟 根据当前用户获取对应的剧本包
		const currentUserId = gameStore.currentUser?.id || 'default'
		const storyline = currentNPC.value.storylines?.[currentUserId] || currentNPC.value.defaultStoryline

		if (storyline) {
			// 使用新的剧本系统
			const nodes = storyline.nodes || []
			return nodes.find(node => node.id === nextId) || null
		} else {
			// 回退到旧的scriptNodes（向后兼容）
			const scriptNodes = currentNPC.value.scriptNodes || []
			return scriptNodes.find(node => node.id === nextId) || null
		}
	}

	// 数据转换函数：将ScriptNode转换为StoryDialogue所需格式
	const transformNode = (node : ScriptNode) : ScriptNode & { speakerType ?: string; task ?: any; ending ?: StoryEnding } => {
		const newNode = { ...node } as any

		// 1. 映射 speakerType
		if (node.type === 'task') {
			newNode.speakerType = 'task'
				// 2. 注入 task 数据 - 支持新的任务系统，按优先级查找
			if (node.taskId) {
				const currentUserId = gameStore.currentUser?.id || 'default'
				const storyline = currentNPC.value?.storylines?.[currentUserId]

				// 优先级1: 从当前角色的专属任务池中查找
				if (storyline?.privateTasks) {
					newNode.task = storyline.privateTasks.find(t => t.id === node.taskId)
					if (newNode.task) {
						console.log(`✅ 从专属任务池找到任务: ${node.taskId}`)
					}
				}

				// 优先级2: 从NPC的通用任务池中查找
				if (!newNode.task && currentNPC.value?.commonTasks) {
					newNode.task = currentNPC.value.commonTasks.find(t => t.id === node.taskId)
					if (newNode.task) {
						console.log(`🔄 从通用任务池找到任务: ${node.taskId}`)
					}
				}

				// 优先级3: 回退到旧的 tasks 字段（向后兼容）
				if (!newNode.task && currentNPC.value?.tasks) {
					newNode.task = currentNPC.value.tasks.find(t => t.id === node.taskId)
					if (newNode.task) {
						console.log(`⚠️ 从旧任务池找到任务: ${node.taskId}`)
					}
				}

				// 如果所有地方都没找到，记录警告
				if (!newNode.task) {
					console.warn(`❌ 未找到任务: ${node.taskId}`)
				}
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
		if (node.endingId && storyEndings[node.endingId]) {
			newNode.ending = storyEndings[node.endingId]
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

		console.log('从', completedNodes.length, '个已完成节点中随机选择:', selectedNode?.id)
		return selectedNode || null
	}

	// 3. 最后定义主逻辑：构建初始对话脚本
	const buildInitialScript = () => {
		if (!currentNPC.value) return

		// 🚨 1. [新增] 优先检查：是否已达成真结局/剧情完结？
		const savedProgress = gameStore.getNPCProgress(currentNPC.value.id)
		if (savedProgress === 'completed_ending') {
			console.log('检测到该角色剧情已彻底完结，加载随机闲聊节点')

			// 🌟 根据当前用户获取对应的剧本包
			const currentUserId = gameStore.currentUser?.id || 'default'
			const storyline = currentNPC.value.storylines?.[currentUserId] || currentNPC.value.defaultStoryline

			// 1. 获取节点池
			let nodes = storyline?.nodes || currentNPC.value.scriptNodes || []

			// 2. 筛选闲聊节点 (id 包含 'completed_')
			const chatNodes = nodes.filter(n => n.id && n.id.startsWith('completed_'))

			if (chatNodes.length > 0) {
				// 3. 随机选择一个
				const randomNode = chatNodes[Math.floor(Math.random() * chatNodes.length)]

				// 确保节点存在
				if (randomNode) {
					console.log('🌟 加载闲聊节点:', randomNode.id)

					// 4. 转换为显示格式 (保持 type='end' 以便点击退出)
					currentScript.value = [transformNode(randomNode)]
				} else {
					// 兜底处理
					currentScript.value = [transformNode({
						id: 'default_end',
						type: 'end',
						speaker: '系统',
						content: '（该角色已无更多剧情。）'
					})]
				}
			} else {
				// 兜底：如果没有配置闲聊节点，才显示默认文本
				currentScript.value = [transformNode({
					id: 'default_end',
					type: 'end',
					speaker: '系统',
					content: '（该角色已无更多剧情。）'
				})]
			}

			gameStore.currentScript = currentScript.value
			setTimeout(() => { gameStore.isDialogueVisible = true }, 500)
			return // 🛑 阻断后续逻辑，直接返回
		}

		// 🌟 根据当前用户获取对应的剧本包
		const currentUserId = gameStore.currentUser?.id || 'default'
		const storyline = currentNPC.value.storylines?.[currentUserId] || currentNPC.value.defaultStoryline

		let scriptNodes: ScriptNode[] = []

		if (storyline) {
			// 使用新的剧本系统
			scriptNodes = storyline.nodes || []
			console.log('🌟 使用角色专属剧本:', currentUserId, '入口节点:', storyline.startNodeId)
		} else {
			// 回退到旧的scriptNodes（向后兼容）
			scriptNodes = currentNPC.value.scriptNodes || []
			console.log('⚠️ 回退到旧数据结构，使用scriptNodes:', scriptNodes.length)
		}

		if (scriptNodes.length === 0) return

		let startNode : ScriptNode | null = null

		// 1. 获取存档
		let savedNodeId = gameStore.getNPCProgress(currentNPC.value.id)

		// 2. [FIX] 进度修正/跳过逻辑
		// 如果存档停留在"解谜成功"节点，说明玩家已经看过了成功动画，
		// 下次进来应该直接从"出示证物前"的对话开始，避免重复获得物品的错觉。
		if (savedNodeId === 'act1_puzzle_success') {
			console.log('🔄 检测到已完成解谜，自动跳过成功动画，跳转至: act1_pre_present')
			savedNodeId = 'act1_pre_present'
		}

		// 3. 优先尝试恢复存档 (Fix: 只要有存档且不是完结状态，优先继续剧情)
		if (savedNodeId && savedNodeId !== 'completed_ending') {
			startNode = scriptNodes.find(node => node.id === savedNodeId) || null
			if (startNode) console.log('📖 读取存档恢复剧情进度:', savedNodeId)
		}

		// 3. 如果没有存档，再检查是否已完成印章收集 (进入闲聊)
		if (!startNode) {
			const hasCompleted = checkNPCCompletion(currentNPC.value)
			if (hasCompleted) {
				startNode = getRandomCompletedNode(scriptNodes)
				if (startNode) console.log('☕️ 任务已完成且无进行中剧情，进入闲聊模式')
			}
		}

		// 如果有剧本包，优先使用startNodeId；否则使用第一个节点
		if (!startNode && storyline?.startNodeId) {
			startNode = scriptNodes.find(node => node.id === storyline.startNodeId) || scriptNodes[0] || null
			if (startNode) console.log('🌟 使用剧本包入口节点:', storyline.startNodeId)
		}

		// 最后的兜底：从头开始
		if (!startNode) {
			startNode = scriptNodes[0] || null
			console.log('🌟 使用默认第一个节点')
		}

		if (!startNode) return

		// =========================================================
		// 🚀 [通用引擎升级] 智能跳转检查器
		// 作用：无需硬编码，基于数据配置自动判断是否跳过当前节点
		// =========================================================
		let currentNode = startNode
		let jumpCount = 0
		const MAX_JUMPS = 10

		while (currentNode.jumpCondition && jumpCount < MAX_JUMPS) {
			const condition = currentNode.jumpCondition
			let shouldJump = false
			let reason = ''

			// 1. 检查线索 (Clues)
			if (condition.requiredClue && gameStore.inventory.clues.includes(condition.requiredClue)) {
				shouldJump = true
				reason = `拥有线索: ${condition.requiredClue}`
			}
			// 2. 检查印章 (Seals)
			else if (condition.requiredSeal && gameStore.inventory.seals.includes(condition.requiredSeal)) {
				shouldJump = true
				reason = `拥有印章: ${condition.requiredSeal}`
			}
			// 3. 检查物品 (Items)
			else if (condition.requiredItem && gameStore.inventory.items.includes(condition.requiredItem)) {
				shouldJump = true
				reason = `拥有物品: ${condition.requiredItem}`
			}

			// 执行跳转
			if (shouldJump) {
				const nextNode = findNextNode(condition.nextId)
				if (nextNode) {
					console.log(`🔀 [剧情引擎] 自动跳转: ${currentNode.id} -> ${nextNode.id} (${reason})`)
					currentNode = nextNode
					jumpCount++
				} else {
					console.warn(`⚠️ [剧情引擎] 跳转目标不存在: ${condition.nextId}`)
					break
				}
			} else {
				break // 条件不满足，停留在当前节点
			}
		}

		// 🚨 安全警告
		if (jumpCount >= MAX_JUMPS) {
			console.error('🚫 [剧情引擎] 检测到潜在的死循环，已强制停止跳转')
		}

		// 构建脚本并显示
		const initialScript = [transformNode(currentNode)]

		// 🔄 [升级版] 线性节点加载器（支持中途跳转）
		let scriptNode = currentNode
		// 安全计数器防止死循环
		let loopSafeCount = 0

		while (scriptNode.nextId && !scriptNode.options && scriptNode.type !== 'end' && loopSafeCount < 20) {
			loopSafeCount++
			let nextNode = findNextNode(scriptNode.nextId)

			if (nextNode) {
				// 🕵️‍♀️ [关键逻辑] 在加载下一个节点前，再次检查它是否满足跳转条件
				// 这样即使存档在"获得印章"，加载到"调查提示"时也能自动跳过
				if (nextNode.jumpCondition) {
					const condition = nextNode.jumpCondition
					let shouldJump = false

					if (condition.requiredClue && gameStore.inventory.clues.includes(condition.requiredClue)) shouldJump = true
					else if (condition.requiredSeal && gameStore.inventory.seals.includes(condition.requiredSeal)) shouldJump = true
					else if (condition.requiredItem && gameStore.inventory.items.includes(condition.requiredItem)) shouldJump = true

					if (shouldJump) {
						console.log(`🔀 [流式跳转] 跳过节点 ${nextNode.id} -> ${condition.nextId}`)
						const jumpTarget = findNextNode(condition.nextId)
						if (jumpTarget) {
							nextNode = jumpTarget
						}
					}
				}

				// 🆕 如果遇到特殊节点（check、present_item），停止线性加载
				if (nextNode.type === 'check' || nextNode.type === 'present_item') {
					// 即使停止加载，也要把这个特殊节点加进去，否则玩家看不见它
					initialScript.push(transformNode(nextNode))
					break
				}

				initialScript.push(transformNode(nextNode))
				scriptNode = nextNode
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

		// 🕵️‍♀️ 使用新的世界状态系统解析NPC ID
		const targetNpcId = resolveNpcId(
			poiId || npcId, // poiId: string
			npcId, // defaultNpcId: string
			gameStore.currentUser?.id, // characterId?: string
			gameStore.inventory.seals || [] // userInventory: string[]
		)

		console.log('🔄 NPC解析:', npcId, '->', targetNpcId, '(角色:', gameStore.currentUser?.id, ')')

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

		// 2. 应用选项效果
		if (option.effects) {
			if (option.effects.courage) {
				gameStore.updateStat('courage', option.effects.courage)
			}
			if (option.effects.clue) {
				gameStore.updateStat('clue', option.effects.clue)
			}
			if (option.effects.intimacy) {
				gameStore.updateStat('intimacy', option.effects.intimacy)
			}
		}

		// 3. 加载下一个节点并处理
		loadNextNode(option.nextId)
	}

	// 🆕 处理属性判定节点
	const handleCheckNode = (checkNode: ScriptNode) => {
		console.log('处理属性判定节点:', checkNode.id, checkNode.condition)

		// 使用 Store 的 checkCondition 方法进行判定
		const conditionMet = gameStore.checkCondition(checkNode.condition || {})

		// 根据判定结果选择下一个节点
		const nextNodeId = conditionMet ? checkNode.nextId : checkNode.failId
		if (nextNodeId) {
			loadNextNode(nextNodeId)
		} else {
			console.error('Check node 没有配置跳转节点:', checkNode.id)
		}
	}

	// 🆕 加载下一个节点的通用方法
	const loadNextNode = (nextNodeId: string) => {
		// 查找下一个节点
		const nextNode = findNextNode(nextNodeId)
		if (!nextNode) {
			console.log('没有找到下一个节点:', nextNodeId)
			return
		}

		// 🆕 检查是否是判定节点
		if (nextNode.type === 'check') {
			// 先显示判定节点本身
			const transformedCheckNode = transformNode(nextNode)
			const newScript = [transformedCheckNode]

			// 更新脚本显示判定内容
			currentScript.value = newScript
			gameStore.currentScript = newScript

			// 🚨 [新增] 强制触发首节点逻辑 (以防 Check 节点也有 Trigger)
			handleLineChange(newScript[0])

			// 延迟执行判定，让玩家看到判定内容
			setTimeout(() => {
				handleCheckNode(nextNode)
			}, 2000)
			return
		}

		// 构建新的脚本片段（先转换数据格式）
		const transformedNextNode = transformNode(nextNode)
		const newScript = [transformedNextNode]

		// 如果下一个节点有后续节点且没有选项，继续添加线性节点
		let currentNode = transformedNextNode
		while (currentNode.nextId && !currentNode.options && currentNode.type !== 'end') {
			const subsequentNode = findNextNode(currentNode.nextId)
			if (subsequentNode) {
				// 🆕 如果遇到特殊节点（check、present_item），停止线性加载
				if (subsequentNode.type === 'check' || subsequentNode.type === 'present_item') {
					break
				}
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

		// 🚨 [新增] 强制触发当前显示的第一行节点的 Trigger！
		// 修复印章无法获取的核心 bug
		if (newScript.length > 0 && newScript[0]) {
			console.log('🔄 [系统] 强制执行首节点 Trigger:', newScript[0]?.id)
			handleLineChange(newScript[0])
		}

		// 删除对 continueDialogue 的调用，避免双重重置问题
		// StoryDialogue 组件会在 watch props.script 时自动重置 currentIndex = 0
		// 这里的调用会导致索引被重置，然后立即触发结束条件
	}

	// 处理对话行变化
	const handleLineChange = (line : any) => {
		console.log('当前对话行变化:', line.id)

		// ✅ 检查是否有 trigger 触发器
		if (line.trigger) {
			switch (line.trigger) {
				case 'grant_seal_one':
					// 林文渊 - 儒学文脉章
					if (!gameStore.inventory.seals.includes('seal_one')) {
						gameStore.addSeal('seal_one')
						gameStore.addItem('item_seal_one')

						// ✅ 仅提示，不弹窗打断
						uni.showToast({ title: '获得：儒学文脉章(实物)', icon: 'none' })

						// ✅ 立即保存进度！防止玩家退出后回档
						if (currentNPC.value) {
							gameStore.saveNPCProgress(currentNPC.value.id, line.id)
						}
					}
					break

				case 'grant_seal_two':
					// 陈狮魁 - 青狮非遗章
					if (!gameStore.inventory.seals.includes('seal_two')) {
						gameStore.addSeal('seal_two')
						uni.showToast({
							title: '获得【青狮非遗章】',
							icon: 'success',
							duration: 2000
						})
						console.log('[Trigger] 获得印章二')
					}
					break

				case 'grant_seal_fake':
					// 蔡福生 - 伪造的印章（不加入印章进度）
					if (!gameStore.inventory.items.includes('item_seal_three_fake')) {
						gameStore.addItem('item_seal_three_fake')
						uni.showToast({ title: '获得：可疑的印章', icon: 'none' })

						// 🚨 [Fix 1] 立即保存进度！
						if (currentNPC.value) {
							gameStore.saveNPCProgress(currentNPC.value.id, line.id)
						}
						console.log('[Trigger] 获得伪造印章并保存进度')
					}
					break

				case 'grant_clue_six_fingers':
					// 线索：六指传说
					if (!gameStore.inventory.clues.includes('clue_six_fingers')) {
						gameStore.addClue('clue_six_fingers')
						uni.showToast({
							title: '获得关键线索：六指传说',
							icon: 'none',
							duration: 2000
						})
						console.log('[Trigger] 获得线索：六指传说')
					}
					break

				case 'grant_clue_lion_scar':
					// 线索：狮纹伤疤
					if (!gameStore.inventory.clues.includes('clue_lion_scar')) {
						gameStore.addClue('clue_lion_scar')
						uni.showToast({
							title: '获得关键线索：狮纹伤疤',
							icon: 'none',
							duration: 2000
						})
						console.log('[Trigger] 获得线索：狮纹伤疤')
					}
					break

				case 'grant_clue_gloves':
					// 线索：手套（如果有定义）
					// TODO: 如果 clues 中定义了 gloves 相关线索，可以在这里添加
					console.log('[Trigger] 线索：手套 - 暂未实现')
					break

				case 'chapter_complete_perfect':
					// 完美结局达成
					console.log('[Trigger] 完美结局达成')
					if (currentNPC.value && routeParams.value.poiId) {
						gameStore.completeMission(routeParams.value.poiId)
						gameStore.saveNPCProgress(currentNPC.value.id, 'completed_ending')
						gameStore.clearTargetLocation()
						uni.showToast({
							title: '完美结局达成',
							icon: 'success',
							duration: 2000
						})
					}
					break

				case 'chapter_complete_normal':
					// 普通结局达成
					console.log('[Trigger] 普通结局达成')
					if (currentNPC.value && routeParams.value.poiId) {
						gameStore.completeMission(routeParams.value.poiId)
						gameStore.saveNPCProgress(currentNPC.value.id, 'completed_ending')
						gameStore.clearTargetLocation()
						uni.showToast({
							title: '章节完成',
							icon: 'none',
							duration: 2000
						})
					}
					break

				default:
					console.log(`[Trigger] 未处理的触发器: ${line.trigger}`)
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

	// 处理举证请求
	const handlePresentRequest = (node: any) => {
		console.log('[AR页面] 收到举证请求:', node)
		currentPresentNode.value = node

		// 打开物品选择器
		showItemSelector.value = true
	}

	// 处理物品选择
	const handleItemSelection = (selectedItemId: string) => {
		console.log('[AR页面] 玩家选择了物品:', selectedItemId)

		// 关闭物品选择器
		showItemSelector.value = false

		if (!currentPresentNode.value) {
			console.error('没有当前举证节点')
			return
		}

		const node = currentPresentNode.value

		// 使用 Store 的 validatePresentation 方法验证
		const isCorrect = gameStore.validatePresentation(selectedItemId, node.requiredItemId || '')

		// 根据验证结果选择下一个节点
		const nextNodeId = isCorrect ? node.correctNextId : node.wrongNextId

		if (nextNodeId) {
			// 显示反馈
			uni.showToast({
				title: isCorrect ? '出示正确！' : '出示错误...',
				icon: isCorrect ? 'success' : 'none',
				duration: 1500
			})

			// 延迟加载下一个节点
			setTimeout(() => {
				loadNextNode(nextNodeId)
			}, 1500)
		} else {
			console.error('举证节点没有配置跳转节点:', node.id)
		}

		// 清空当前举证节点
		currentPresentNode.value = null
	}

	// 处理物品调查
	const handleItemInspect = (itemId: string) => {
		console.log('[AR页面] 玩家调查物品:', itemId)

		// ✅ 强制关闭背包弹窗
		showItemSelector.value = false

		// 调用 Store 的 inspectItem 方法
		const result = gameStore.inspectItem(itemId)

		if (result.success) {
			// 构造内心独白脚本
			const inspectNode = {
				id: 'inspect_' + itemId,
				type: 'normal' as const,
				speaker: '陈灵儿',
				avatar: '/static/avatars/chen_linger.png',
				content: result.inspectText || '仔细查看后，你发现了什么。'
			}

			console.log('播放调查独白:', inspectNode.content)

			// ✅ 确保对话框层级最高
			// 重置脚本数组，确保组件能监听到变化
			gameStore.currentScript = []

			// 使用 nextTick 确保在下一个 DOM 更新周期执行
			nextTick(() => {
				// 播放调查结果作为内心独白
				const transformedNode = transformNode(inspectNode)
				gameStore.currentScript = [transformedNode]
				gameStore.isDialogueVisible = true
			})
		} else {
			// 物品不可调查
			uni.showToast({
				title: '这件物品似乎没什么特别的',
				icon: 'none',
				duration: 2000
			})
		}
	}

	// 处理对话结束
	const handleDialogueEnd = () => {
		console.log('AR对话结束 - 准备退出页面')

		// 关闭对话框
		gameStore.isDialogueVisible = false

		// ✅ [修复] 无条件退出AR页面，确保不会卡死
		console.log('[AR页面] 触发退出跳转...')
		setTimeout(() => {
			uni.navigateBack()
			console.log('[AR页面] 已执行 navigateBack()')
		}, 100)
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

		// 🛠️ 开发调试功能：重置游戏数据
		if (options && options.reset === 'true') {
			console.warn('⚠️ 检测到重置参数，正在清除所有游戏数据...')
			gameStore.resetGame()
			uni.showToast({
				title: '游戏数据已重置',
				icon: 'success',
				duration: 2000
			})
			console.log('✅ 游戏数据重置完成')
		}

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