import type { NPC, ScriptNode } from '../types'

export const npcs: NPC[] = [
	{
		id: 'lin_wenyuan',
		name: '林文渊',
		title: '学宫讲学者',
		avatar: '/static/npcs/lin_wenyuan.png',
		location: 'jieyang_confucian_temple',
		background: '/static/locations/confucian_temple_bg.jpg',
		description: '揭阳学宫的资深讲学者，守护儒学文脉印章',
		personality: '严谨博学，注重礼仪',
		sealId: 'seal_one',

		dialogue: [
			{
				id: 'greeting',
				text: '年轻人，欢迎来到揭阳学宫。想要获得儒学文脉印章，必须展现出对传统文化的尊重。'
			},
			{
				id: 'task_intro',
				text: '请在大成殿向孔子像行揖礼，然后回答我的两个问题。'
			}
		],

		// 新增：支持角色分片的剧本系统
		storylines: {
			'chen_linger': {
				characterId: 'chen_linger',
				startNodeId: 'act1_intro', // 对应原剧本的入口
				nodes: [
					// 1. 开场独白（建立代入感）
			{
				id: 'act1_intro',
				type: 'normal',
				speaker: '陈灵儿',
				avatar: '/static/avatars/chen_linger.png',
				content: '（站在大成殿前深吸一口气）这里就是揭阳学宫...父亲笔记里提到的第一枚印章就在林先生手中。不管怎样，我必须拿到它。',
				nextId: 'act1_scene_desc'
			},
			// 2. 环境描写
			{
				id: 'act1_scene_desc',
				type: 'normal',
				speaker: '系统',
				content: '大成殿内十分安静，只有偶尔传来的翻书声。一位身穿长衫的先生正背对着你擦拭牌匾，阳光从窗格斜射进来，扬起细微的灰尘。',
				nextId: 'act1_choice_1'
			},
			// 3. 第一次抉择：开场白
			{
				id: 'act1_choice_1',
				type: 'choice',
				speaker: '系统',
				content: '请选择你的开场白：',
				options: [
					{
						label: '公事公办',
						text: '（清了清嗓子，亮出腰牌）林先生，学宫古籍失窃案有眉目了，但我需要借"学宫印"一用。',
						nextId: 'act1_branch_a',
						effects: { courage: 1, intimacy: -1 } // 🔴 果敢+1, 🟢 亲密度-1
					},
					{
						label: '真诚示弱',
						text: '（上前一步，恭敬行礼）林先生，晚辈灵儿求见。事关二十年前我父母的旧案，求先生成全。',
						nextId: 'act1_branch_b',
						effects: { intimacy: 1 } // 🟢 亲密度+1
					},
					{
						label: '稍后再来',
						text: '（有些为难，看看再说吧...）',
						nextId: 'act1_leave_choice',
						effects: { courage: -1, intimacy: 0 } // 🔴 果敢-1, 亲密度不变
					}
				]
			},
			// 3-1. 离开节点（点击"稍后再来"后触发）
			{
				id: 'act1_leave_choice',
				type: 'normal',
				speaker: '陈灵儿',
				avatar: '/static/avatars/chen_linger.png',
				content: '（你感到一阵心烦意乱，决定先离开学宫，整理一下思绪。晚些时候再回来找林先生吧。）',
				nextId: 'act1_leave'
			},
			// 3-2. 离开节点（存档并退出）
			{
				id: 'act1_leave',
				type: 'end',
				speaker: '系统',
				content: '你决定暂时离开，稍后再来挑战。'
			},
			// 4. 分支 A：冷淡回应
			{
				id: 'act1_branch_a',
				type: 'normal',
				speaker: '林文渊',
				avatar: '/static/npcs/lin_wenyuan.png',
				content: '（动作停顿了一下，转过身，神色冷淡）公事？那便按公事规矩办。答不出难题，谁也别想拿走印章。',
				nextId: 'act1_task_difficulty'
			},
			// 5. 分支 B：柔和回应
			{
				id: 'act1_branch_b',
				type: 'normal',
				speaker: '林文渊',
				avatar: '/static/npcs/lin_wenyuan.png',
				content: '（叹了口气，放下手中的抹布，眼神柔和）你和你母亲长得真像……罢了，印章可以借你，但规矩不能废。',
				nextId: 'act1_task_normal'
			},
			// 6. 模式提示与过渡
			{
				id: 'act1_task_difficulty',
				type: 'normal',
				speaker: '系统',
				content: '【进入困难模式】林先生似乎对你的礼数很在意，请完成他的考验。',
				nextId: 'act1_do_action'
			},
			{
				id: 'act1_task_normal',
				type: 'normal',
				speaker: '系统',
				content: '【进入普通模式】既然林先生愿意给机会，就请按规矩行事吧。',
				nextId: 'act1_do_action'
			},

			// --- 任务环节 ---

			// 7. 任务：行礼
			{
				id: 'act1_do_action',
				type: 'task',
				taskId: 'bow_to_confucius', // 对应 tasks 里的 id
				nextId: 'act1_quiz_1'
			},
			// 8. 任务：答题
			{
				id: 'act1_quiz_1',
				type: 'task',
				taskId: 'riddle_one',
				nextId: 'act1_puzzle_success',
				failId: 'act1_fail'
			},
			// 2. 失败反馈节点 (Fail Feedback)
			{
			    id: 'act1_fail',
			    type: 'normal',
			    speaker: '林文渊',
			    avatar: '/static/npcs/lin_wenyuan.png',
			    content: '（摇了摇头）连这个都不知道？年轻人，基本功还要再练练。', // 嘲讽一下
			    nextId: 'act1_retry_choice'
			},
			
			// 3. 重试选择节点 (Retry Choice)
			{
			    id: 'act1_retry_choice',
			    type: 'choice',
			    speaker: '系统',
			    content: '林先生似乎对你很不满意。要重新挑战吗？',
			    options: [
			        {
			            label: '我准备好了',
			            text: '（深吸一口气）林先生，刚才是我大意了，请再问一次。',
			            nextId: 'act1_quiz_1' // 🔄 关键：闭环！跳回任务节点ID
			        },
			        {
			            label: '稍后再来',
			            text: '（羞愧地低下头）晚辈这就去温书。',
			            nextId: 'act1_leave'  // 🚪 退出或去其他地方，现在这个节点已存在
			        }
			    ]
			},

			// --- 任务完成后的剧情 ---

			{
				id: 'act1_puzzle_success',
				type: 'normal',
				speaker: '林文渊',
				avatar: '/static/npcs/lin_wenyuan.png',
				content: '（抚须点头）不错，看来你确实对学宫有所了解，并非无礼之徒。印章就在这书案上。',
				nextId: 'act1_choice_2'
			},
			// 9. 第二次抉择：腰牌
			{
				id: 'act1_choice_2',
				type: 'choice',
				speaker: '系统',
				content: '（你看到印章旁似乎有一个凹槽，这让你想起了身上的物品...）',
				options: [
					{
						label: '出示腰牌',
						text: '林先生，我父母当年也是学宫护卫，这是我母亲留下的腰牌，请您看看...',
						nextId: 'act1_reveal_badge',
						effects: { clue: 1 } // 🔵 线索+1 (关键线索)
					},
					{
						label: '暂且隐瞒',
						text: '（这腰牌太过重要，还是先别暴露。）林先生，请问这印章为何如此重要？',
						nextId: 'act1_conceal_badge'
					}
				]
			},
			// 10. 结局 A：获得关键线索
			{
				id: 'act1_reveal_badge',
				type: 'normal',
				speaker: '林文渊',
				avatar: '/static/npcs/lin_wenyuan.png',
				content: '（大惊失色，颤抖着接过腰牌）这确实是你母亲之物...孩子，当年你父母追查的是一个“左手有六指”的人！切记！',
				nextId: 'act1_get_seal'
			},
			// 11. 结局 B：获得模糊线索
			{
				id: 'act1_conceal_badge',
				type: 'normal',
				speaker: '林文渊',
				avatar: '/static/npcs/lin_wenyuan.png',
				content: '（皱了皱眉）这印章关系到学宫文脉传承...我也不能多说。只能告诉你，要小心身边那些“总是戴着手套”的人。',
				nextId: 'act1_get_seal'
			},
			// 12. 获得印章（第一幕结束）
			{
				id: 'act1_get_seal',
				type: 'normal',
				speaker: '系统',
				content: '【恭喜！你通过了考验，获得物品：儒学文脉章】',
				nextId: 'act1_end'
			},
			{
				id: 'act1_end',
				type: 'end',
				speaker: '系统',
				content: '第一幕【学宫试探】完成。线索指向了古城老街的青狮表演场。去找陈狮魁吧。',
				trigger: 'grant_seal'
			},

			// --- 通关后随机闲聊节点 ---
			{
				id: 'completed_hint',
				type: 'end',
				speaker: '林文渊',
				avatar: '/static/npcs/lin_wenyuan.png',
				content: '你已经证明了自己的实力。听说古城老街那边锣鼓喧天，或许你应该去见见陈狮魁班主。'
			},
			{
				id: 'completed_chat_reading',
				type: 'end',
				speaker: '林文渊',
				avatar: '/static/npcs/lin_wenyuan.png',
				content: '（手不释卷）"学而不思则罔，思而不学则殆"。拿到了印章也要多读书啊。'
			},
			{
				id: 'completed_chat_care',
				type: 'end',
				speaker: '林文渊',
				avatar: '/static/npcs/lin_wenyuan.png',
				content: '那枚儒学文脉章传了几百年，切记妥善保管，莫要让文脉断了传承。'
			},
			{
				id: 'completed_chat_history',
				type: 'end',
				speaker: '林文渊',
				avatar: '/static/npcs/lin_wenyuan.png',
				content: '揭阳学宫始建于北宋，历经千年风雨。你要守护的不仅是印章，更是这段文脉历史。'
			},
			{
				id: 'completed_chat_wisdom',
				type: 'end',
				speaker: '林文渊',
				avatar: '/static/npcs/lin_wenyuan.png',
				content: '（看着你离去的背影）"知者不惑，仁者不忧，勇者不惧"。孩子，你的路还很长。'
			}
				]
			}
		},

		// 通用任务：所有角色都可以访问
		commonTasks: [
			{
				id: 'bow_to_confucius',
				description: '在大成殿向孔子像行揖礼',
				type: 'action',
				correctOption: '行揖礼'
			},
			{
				id: 'riddle_one',
				description: '揭阳学宫始建于哪个朝代？',
				type: 'question',
				options: ['唐朝', '宋朝', '明朝', '清朝'],
				correctOption: '宋朝',
				correctAnswer: '揭阳学宫始建于北宋庆历年间'
			},
			{
				id: 'riddle_two',
				description: '"万世师表"是对谁的尊称？',
				type: 'question',
				options: ['孟子', '孔子', '荀子', '韩愈'],
				correctOption: '孔子',
				correctAnswer: '"万世师表"致敬孔子'
			}
		],

		// 保持向后兼容的旧字段（已废弃）
		/** @deprecated 使用 storylines[characterId].nodes 替代 */
		scriptNodes: [],
		/** @deprecated 使用 commonTasks 替代 */
		tasks: [],
	},
	{
		id: 'chen_shikui',
		name: '陈狮魁',
		title: '青狮传承人',
		avatar: '/static/npcs/chen_shikui.png',
		location: 'lion_culture_area',
		background: '/static/locations/lion_culture_bg.jpg',
		description: '青狮文化的传承者，守护青狮非遗印章',
		personality: '刚猛豪爽，吃软不吃硬',
		sealId: 'seal_two',

		dialogue: [
			{
				id: 'greeting',
				text: '青狮舞是揭阳的骄傲！想要获得青狮印章，要展现你的勇气和悟性。'
			},
			{
				id: 'task_intro',
				text: '模仿青狮的三个基本动作，然后解读狮头纹饰的含义。'
			}
		],

		// 新增：支持角色分片的剧本系统
		storylines: {
			'chen_linger': {
				characterId: 'chen_linger',
				startNodeId: 'act2_start', // 对应原剧本的入口
				nodes: [
			// 1. 开场观察
			{
				id: 'act2_start',
				type: 'normal',
				speaker: '系统',
				content: '古城老街传来阵阵锣鼓声。青狮表演场内，一位身材魁梧的中年人正在演练狮头，动作刚猛有力。他就是陈狮魁。',
				nextId: 'act2_observe'
			},
			{
				id: 'act2_observe',
				type: 'normal',
				speaker: '陈灵儿',
				avatar: '/static/avatars/chen_linger.png',
				content: '（这人看起来脾气暴躁...想要拿到印章，恐怕没那么容易。）',
				nextId: 'act2_choice_1'
			},
			// 2. 关键抉择：硬碰硬还是以技服人
			{
				id: 'act2_choice_1',
				type: 'choice',
				speaker: '系统',
				content: '陈狮魁似乎很讨厌官府的人。你打算怎么做？',
				options: [
					{
						label: '武力威慑',
						text: '（亮出捕快佩刀）班主，配合官府办案，交出印章！',
						nextId: 'act2_branch_a', // 🔴 困难线
						effects: { courage: 1, intimacy: -2 }
					},
					{
						label: '技艺折服',
						text: '（放下佩刀，抱拳行礼）我不以捕快身份压你，愿用青狮步法赢你！',
						nextId: 'act2_branch_b', // 🟢 亲密线
						effects: { intimacy: 2 }
					}
				]
			},

			// --- 分支 A：武力威慑 (困难模式) ---
			{
				id: 'act2_branch_a',
				type: 'normal',
				speaker: '陈狮魁',
				avatar: '/static/npcs/chen_shikui.png',
				content: '（冷笑一声）哼！官威好大！印章可以给你，但你别想从我这听到半句废话。不过，规矩就是规矩，想拿印章，先过这关！',
				nextId: 'act2_task_action'
			},

			// --- 分支 B：技艺折服 (普通/友好模式) ---
			{
				id: 'act2_branch_b',
				type: 'normal',
				speaker: '陈狮魁',
				avatar: '/static/npcs/chen_shikui.png',
				content: '（眼神一亮，上下打量你）哦？有点意思。像当年那个护卫的种！来，让我看看你的身手！',
				nextId: 'act2_task_action'
			},

			// 3. 任务环节：动作挑战
			{
				id: 'act2_task_action',
				type: 'task',
				taskId: 'lion_dance_action', // 对应上面的 tasks
				nextId: 'act2_task_quiz'
			},
			// 4. 任务环节：知识问答
			{
				id: 'act2_task_quiz',
				type: 'task',
				taskId: 'lion_pattern_quiz',
				nextId: 'act2_success'
			},

			// 5. 任务成功后的反应 (区分好感度)
			{
				id: 'act2_success',
				type: 'normal',
				speaker: '陈狮魁',
				avatar: '/static/npcs/chen_shikui.png',
				content: '好！身手不错，也是个懂行的人。印章归你了。',
				nextId: 'act2_check_intimacy' // 检查亲密度，决定是否有隐藏剧情
			},

			// 6. 隐藏剧情判定 (蝴蝶效应)
			{
				id: 'act2_check_intimacy',
				type: 'choice',
				speaker: '系统',
				content: '（陈狮魁递给你印章时，目光停留在你腰间的半月胎记上...）',
				options: [
					{
						label: '让他看胎记',
						text: '（察觉到他的目光，大方展示）班主认识这个胎记？',
						nextId: 'act2_reveal_scar',
						effects: { clue: 1 } // 获得关键线索：狮纹伤疤
					},
					{
						label: '遮挡胎记',
						text: '（下意识地遮挡）多谢班主赠印。',
						nextId: 'act2_miss_clue'
					}
				]
			},

			// 7. 结局 A：获得关键线索 (狮纹伤疤)
			{
				id: 'act2_reveal_scar',
				type: 'normal',
				speaker: '陈狮魁',
				avatar: '/static/npcs/chen_shikui.png',
				content: '（激动地拍大腿）果然是故人之女！孩子，你要找的凶手，当年手背被你爹砍了一刀，留有“狮纹伤疤”！千万记住了！',
				nextId: 'act2_get_seal'
			},

			// 8. 结局 B：错过线索
			{
				id: 'act2_miss_clue',
				type: 'normal',
				speaker: '陈狮魁',
				avatar: '/static/npcs/chen_shikui.png',
				content: '（收回目光，叹了口气）行吧，江湖路远，好自为之。那个凶手受过伤，自己小心点。',
				nextId: 'act2_get_seal'
			},

			// 9. 第二幕结束
			{
				id: 'act2_get_seal',
				type: 'normal',
				speaker: '系统',
				content: '【恭喜！获得物品：青狮非遗章】\n（印章刻有怒狮头像，威风凛凛）',
				nextId: 'act2_end'
			},
			{
				id: 'act2_end',
				type: 'end',
				speaker: '系统',
				content: '第二幕【青狮怒火】完成。所有的线索都汇聚到了终点——进贤门。最终的审判即将开始。',
				trigger: 'grant_seal'
			},

			// --- 通关后随机闲聊节点 ---
			{
				id: 'completed_hint',
				type: 'end',
				speaker: '陈狮魁',
				avatar: '/static/npcs/chen_shikui.png',
				content: '你这身手不错啊！不过真正的考验还在后头。听说进贤门那边有新的线索。'
			},
			{
				id: 'completed_chat_lion',
				type: 'end',
				speaker: '陈狮魁',
				avatar: '/static/npcs/chen_shikui.png',
				content: '（擦拭着狮头）青狮舞要的是那股子精气神！你这年轻人，有当年那个护卫的种。'
			},
			{
				id: 'completed_chat_courage',
				type: 'end',
				speaker: '陈狮魁',
				avatar: '/static/npcs/chen_shikui.png',
				content: '功夫茶要静，舞狮要动！一静一动，才是咱们潮汕人的本事。印章要保管好啊。'
			},
			{
				id: 'completed_chat_tradition',
				type: 'end',
				speaker: '陈狮魁',
				avatar: '/static/npcs/chen_shikui.png',
				content: '这青狮舞传了几百年，驱邪镇煞。你手里的印章，关系着咱们揭阳的根。'
			}
				]
			}
		},

		// 通用任务：所有角色都可以访问
		commonTasks: [
			{
				id: 'lion_dance_action',
				description: '模仿青狮步法：左脚虚点，右拳高举，怒目圆睁',
				type: 'action',
				correctOption: '完成动作',
				actionText: '演练青狮步'
			},
			{
				id: 'lion_pattern_quiz',
				description: '青狮头额头的"王"字纹饰，代表了什么寓意？',
				type: 'question',
				options: ['驱邪镇煞', '王者之风', '吉祥如意', '风调雨顺'],
				correctOption: '驱邪镇煞',
				correctAnswer: '青狮被视为"瑞狮"，额头王字意在驱邪镇煞，保一方平安。'
			}
		],

		// 保持向后兼容的旧字段（已废弃）
		/** @deprecated 使用 storylines[characterId].nodes 替代 */
		scriptNodes: [],
		/** @deprecated 使用 commonTasks 替代 */
		tasks: [],
	},
	{
		id: 'su_chaweng',
		name: '苏茶翁',
		title: '工夫茶社老师傅',
		avatar: '/static/npcs/su_chaweng.png',
		location: 'kungfu_tea_house',
		background: '/static/locations/tea_house_bg.jpg',
		description: '工夫茶大师，守护茶韵文化印章',
		personality: '温和细致，注重礼仪',
		sealId: 'seal_three',
		dialogue: [
			{
				id: 'greeting',
				text: '工夫茶是潮汕人的待客之道。想要获得茶韵印章，需要领会茶道精髓。'
			},
			{
				id: 'task_intro',
				text: '学会斟茶礼节，认识潮汕名茶。'
			}
		],

		// 新增：支持角色分片的剧本系统（苏茶翁暂无特定剧情，保留向后兼容）
		storylines: {
			'default': {
				characterId: 'default',
				startNodeId: 'tea_intro',
				nodes: []
			}
		},

		// 通用任务：所有角色都可以访问
		commonTasks: [
			{
				id: 'tea_ceremony',
				description: '学会"关公巡城""韩信点兵"斟茶礼',
				type: 'action',
				correctOption: '演示茶艺'
			},
			{
				id: 'tea_knowledge',
				description: '说出3种工夫茶常用茶',
				type: 'question',
				options: ['龙井、碧螺春、铁观音', '凤凰单丛、肉桂、水仙', '普洱、白茶、黄茶'],
				correctOption: '凤凰单丛、肉桂、水仙',
				correctAnswer: '凤凰单丛、肉桂、水仙都是工夫茶常用茶'
			}
		],

		// 保持向后兼容的旧字段（已废弃）
		/** @deprecated 使用 commonTasks 替代 */
		tasks: [],
	},
	{
		id: 'zheng_pike',
		name: '郑批客',
		title: '侨批文物馆守护人',
		avatar: '/static/npcs/zheng_pike.png',
		location: 'qiaopi_museum',
		background: '/static/locations/qiaopi_museum_bg.jpg',
		description: '侨批文化的守护者，守护侨批信义印章',
		personality: '怀旧重情，注重信义',
		sealId: 'seal_four',
		dialogue: [
			{
				id: 'greeting',
				text: '侨批承载着海外游子的乡愁和信义。每一张侨批都是一个故事。'
			},
			{
				id: 'task_intro',
				text: '在这里寻找批文残片，拼接出完整的历史记忆。'
			}
		],

		// 新增：支持角色分片的剧本系统（郑批客暂无特定剧情，保留向后兼容）
		storylines: {
			'default': {
				characterId: 'default',
				startNodeId: 'qiaopi_intro',
				nodes: []
			}
		},

		// 通用任务：所有角色都可以访问
		commonTasks: [
			{
				id: 'find_fragments',
				description: '在文物馆找到3块批文残片',
				type: 'exploration',
				correctOption: '探索寻找'
			},
			{
				id: 'assemble_qiaopi',
				description: '按"银-信-归"符号拼接完整批文',
				type: 'puzzle',
				correctOption: '正确拼接'
			}
		],

		// 保持向后兼容的旧字段（已废弃）
		/** @deprecated 使用 commonTasks 替代 */
		tasks: [],
	},
	{
		id: 'li_chengshou',
		name: '李城守',
		title: '进贤门城门守史',
		avatar: '/static/npcs/li_chengshou.png',
		location: 'jinxian_gate',
		background: '/static/locations/jinxian_gate_bg.jpg',
		description: '进贤门的守护者，掌管老爷保号章',
		personality: '威严正直，注重传统',
		sealId: 'laoye_baohao_seal',
		dialogue: [
			{
				id: 'greeting',
				text: '进贤门是揭阳古城的正门，象征着进取求贤。老爷保号章在此守护。'
			},
			{
				id: 'task_intro',
				text: '需要集齐前四枚印章，并通过考验才能获得老爷保号章。'
			}
		],

		// 新增：支持角色分片的剧本系统（李城守暂无特定剧情，保留向后兼容）
		storylines: {
			'default': {
				characterId: 'default',
				startNodeId: 'gate_intro',
				nodes: []
			}
		},

		// 通用任务：所有角色都可以访问
		commonTasks: [
			{
				id: 'drum_declaration',
				description: '登上进贤门击鼓明志（喊出"守护文脉，老爷保号"）',
				type: 'action',
				correctOption: '击鼓宣誓'
			},
			{
				id: 'gate_knowledge',
				description: '进贤门象征什么？',
				type: 'question',
				options: ['财富繁荣', '进取求贤', '平安健康', '团圆美满'],
				correctOption: '进取求贤',
				correctAnswer: '进贤门为揭阳古城正门，象征进取求贤'
			},
			{
				id: 'show_seals',
				description: '出示前四枚印章',
				type: 'item_check',
				correctOption: '展示印章'
			}
		],

		// 保持向后兼容的旧字段（已废弃）
		/** @deprecated 使用 commonTasks 替代 */
		tasks: [],
	},
	// ... 前面是林文渊、陈狮魁等 ...

	// 🌟 核心修正：陈灵儿线 - 最终 BOSS 蔡福生
	{
		id: 'cai_fusheng',
		name: '蔡福生',
		title: '醉仙楼老板',
		avatar: '/static/npcs/cai_fusheng.png', // 确保有图，或者用 default
		location: 'jinxian_gate', // 决战地点：进贤门
		background: '/static/locations/jinxian_gate_bg.jpg',
		description: '表面是和气生财的老板，实则是当年的掠夺者后代',
		personality: '伪善、狡诈',
		sealId: 'fake_seal', // 伪造的印章

		// 新增：支持角色分片的剧本系统
		storylines: {
			'chen_linger': {
				characterId: 'chen_linger',
				startNodeId: 'act3_start', // 对应原剧本的入口
				nodes: [
			// 1. 决战开场
			{
				id: 'act3_start',
				type: 'normal',
				speaker: '系统',
				content: '进贤门下，蔡福生正拿着一枚印章把玩。你已集齐了其他线索，发现他手中的【印章三】表面虽光鲜，但侧面竟然没有拼接凹槽！',
				nextId: 'act3_confrontation'
			},
			{
				id: 'act3_confrontation',
				type: 'normal',
				speaker: '陈灵儿',
				avatar: '/static/avatars/chen_linger.png',
				content: '（那是假的...而且他一直戴着手套，难道是为了掩饰六指？）蔡老板，别来无恙。',
				nextId: 'act3_cai_reply'
			},
			{
				id: 'act3_cai_reply',
				type: 'normal',
				speaker: '蔡福生',
				avatar: '/static/npcs/cai_fusheng.png',
				content: '哟，这不是陈捕快吗？怎么有空来我这儿喝茶？你看，我这枚印章可是刚收来的宝贝。',
				nextId: 'act3_choice_final'
			},

			// 2. 最终审判抉择 (决定结局走向)
			{
				id: 'act3_choice_final',
				type: 'choice',
				speaker: '系统',
				content: '你的心跳加速。所有的证据都指向他。你决定如何揭穿他？',
				options: [
					{
						label: '雷霆一击 (强行制服)',
						text: '（趁他喝茶，直接掀翻桌子，强行扯下他的手套！）别装了！让我看看你的左手！',
						nextId: 'act3_branch_a',
						// 🌟 策略：给予大量属性加成，确保触发完美结局 (前提是之前基础属性不为负)
						effects: { courage: 10, clue: 5 }
					},
					{
						label: '言语周旋 (智取)',
						text: '蔡老板，听说您这手套是西洋货？不知能否摘下来让我开开眼？',
						nextId: 'act3_branch_b',
						// 🌟 策略：加线索但没加果敢，容易触发普通结局
						effects: { clue: 5, courage: 0 }
					},
					{
						label: '暗中观察 (犹豫)',
						text: '（不出声，等他自己露出马脚...）',
						nextId: 'act3_branch_c',
						// 🌟 策略：扣减果敢，强制触发悲剧结局
						effects: { courage: -10 }
					}
				]
			},

			// --- 分支 A：雷霆一击 (完美结局路径) ---
			{
				id: 'act3_branch_a',
				type: 'normal',
				speaker: '系统',
				content: '【判定：大成功】你动作极快，蔡福生来不及反应，手套脱落——赫然是六指！而且手背上有一道狰狞的狮纹伤疤！',
				nextId: 'act3_branch_a_2'
			},
			{
				id: 'act3_branch_a_2',
				type: 'normal',
				speaker: '陈灵儿',
				avatar: '/static/avatars/chen_linger.png',
				content: '六指、狮纹、假印章！蔡福生，当年谋害我父母的掠夺者就是你家先人！人赃并获，你还有什么好说的！',
				nextId: 'act3_ending_perfect'
			},
			// 这个 End 节点会触发 handleDialogueEnd -> checkEnding() -> 完美结局
			{
				id: 'act3_ending_perfect',
				type: 'end',
				speaker: '系统',
				content: '蔡福生面如死灰，瘫软在地。那一包还没来得及销毁的迷药和藏在暗格里的《护卫日志》完好无损...',
				endingId: 'ending_perfect'
			},

			// --- 分支 B：言语周旋 (普通结局路径) ---
			{
				id: 'act3_branch_b',
				type: 'normal',
				speaker: '蔡福生',
				avatar: '/static/npcs/cai_fusheng.png',
				content: '（警觉地缩回手）陈捕快真会开玩笑，手有旧疾，见不得风。我还有事，失陪了。',
				nextId: 'act3_branch_b_2'
			},
			{
				id: 'act3_branch_b_2',
				type: 'normal',
				speaker: '系统',
				content: '他试图逃跑，却被门口的守卫拦住。虽然抓住了人，但他趁机把口袋里的东西丢进了井里。',
				nextId: 'act3_ending_normal'
			},
			// 这个 End 节点会触发 checkEnding() -> 普通结局
			{
				id: 'act3_ending_normal',
				type: 'end',
				speaker: '系统',
				content: '蔡福生被捕，但他死咬着不松口。关键证据《护卫日志》下落不明...',
				endingId: 'ending_normal'
			},

			// --- 分支 C：暗中观察 (悲剧结局路径) ---
			{
				id: 'act3_branch_c',
				type: 'normal',
				speaker: '系统',
				content: '【判定：失败】蔡福生察觉到了你的视线，嘴角闪过一丝冷笑。他迅速从怀里掏出一本泛黄的笔记，扔进了旁边的火盆！',
				nextId: 'act3_branch_c_2'
			},
			{
				id: 'act3_branch_c_2',
				type: 'normal',
				speaker: '蔡福生',
				avatar: '/static/npcs/cai_fusheng.png',
				content: '烧了！都烧了！你爹娘的消息，这辈子你也别想知道！哈哈哈哈！',
				nextId: 'act3_ending_bad'
			},
			// 这个 End 节点会触发 checkEnding() -> 悲剧结局 (因为 courage 被扣成了负数)
			{
				id: 'act3_ending_bad',
				type: 'end',
				speaker: '系统',
				content: '火盆里的纸张化为灰烬。线索断了...',
				endingId: 'ending_bad'
			}
				]
			}
		},

		// 兼容旧字段（已废弃）
		dialogue: [],
		commonTasks: [],
		/** @deprecated 使用 storylines[characterId].nodes 替代 */
		scriptNodes: [],
		/** @deprecated 使用 commonTasks 替代 */
		tasks: [],
	}
]