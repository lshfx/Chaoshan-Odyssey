import type { NPC, ScriptNode } from '../types'
import { IMG_HOST } from '@/config/constants'

export const npcs: NPC[] = [
  {
    id: 'lin_wenyuan',
    name: '林文渊',
    title: '学宫讲学者',
    avatar: IMG_HOST + 'npcs/lin_wenyuan.webp',
    location: 'jieyang_confucian_temple',
    background: IMG_HOST + 'locations/confucian_temple_bg.webp',
    description: '揭阳学宫的资深讲学者，守护儒学文脉印章',
    personality: '严谨博学，注重礼仪',
    sealId: 'seal_one',

    dialogue: [
      {
        id: 'greeting',
        text: '年轻人，欢迎来到揭阳学宫。想要获得儒学文脉印章，必须展现出对传统文化的尊重。',
      },
      {
        id: 'task_intro',
        text: '请在大成殿向孔子像行揖礼，然后回答我的两个问题。',
      },
    ],

    // 新增：支持角色分片的剧本系统
    storylines: {
      chen_linger: {
        characterId: 'chen_linger',
        startNodeId: 'act1_intro',
        nodes: [
          // ---------------------------------------------------------
          // 1. 开场与初见
          // ---------------------------------------------------------
          {
            id: 'act1_intro',
            type: 'normal',
            speaker: '陈灵儿',
            avatar: 'avatars/chen_linger.webp',
            content:
              '（站在大成殿前深吸一口气）这里就是揭阳学宫...父亲笔记里提到的第一枚印章就在林先生手中。不管怎样，我必须拿到它。',
            nextId: 'act1_meet_lin',
          },
          {
            id: 'act1_meet_lin',
            type: 'normal',
            speaker: '系统',
            content:
              '大成殿内十分安静。一位身穿长衫的先生正背对着你擦拭牌匾，阳光从窗格斜射进来，扬起细微的灰尘。',
            nextId: 'act1_choice_attitude',
          },

          // ---------------------------------------------------------
          // 2. 态度抉择
          // ---------------------------------------------------------
          {
            id: 'act1_choice_attitude',
            type: 'choice',
            speaker: '系统',
            content: '林先生似乎不愿理人，请选择你的开场白：',
            options: [
              {
                label: '公事公办（强硬）',
                nextId: 'act1_branch_strict',
                effects: { courage: 1, intimacy: -1 },
              },
              {
                label: '真诚示弱（礼貌）',
                nextId: 'act1_branch_sincere',
                effects: { intimacy: 1 },
              },
              {
                label: '稍后再来',
                nextId: 'act1_leave_choice',
              },
            ],
          },
          // 离开分支
          {
            id: 'act1_leave_choice',
            type: 'normal',
            speaker: '陈灵儿',
            avatar: 'avatars/chen_linger.webp',
            content:
              '（你感到一阵心烦意乱，决定先离开学宫，整理一下思绪。晚些时候再回来找林先生吧。）',
            nextId: 'act1_leave',
          },
          {
            id: 'act1_leave',
            type: 'end',
            speaker: '系统',
            content: '你决定暂时离开，稍后再来挑战。',
          },
          // 强硬分支
          {
            id: 'act1_branch_strict',
            type: 'normal',
            speaker: '林文渊',
            avatar: IMG_HOST + 'npcs/lin_wenyuan.webp',
            content:
              '（动作停顿了一下，冷淡转身）公事？那便按公事规矩办。想拿印章，先过我这关。',
            nextId: 'act1_task_bow_intro',
          },
          // 柔和分支
          {
            id: 'act1_branch_sincere',
            type: 'normal',
            speaker: '林文渊',
            avatar: IMG_HOST + 'npcs/lin_wenyuan.webp',
            content:
              '（眼神柔和了一些）你和你母亲长得真像……罢了。虽然有情分在，但学宫的规矩不能废。',
            nextId: 'act1_task_bow_intro',
          },

          // ---------------------------------------------------------
          // 3. 任务环节：行礼与答题
          // ---------------------------------------------------------
          {
            id: 'act1_task_bow_intro',
            type: 'normal',
            speaker: '林文渊',
            avatar: IMG_HOST + 'npcs/lin_wenyuan.webp',
            content: '孔圣人面前，先正衣冠，再行揖礼。让我看看你的诚意。',
            nextId: 'act1_task_bow',
          },
          {
            id: 'act1_task_bow',
            type: 'task',
            taskId: 'bow_to_confucius', // 关联 commonTasks
            nextId: 'act1_task_quiz_intro',
          },
          {
            id: 'act1_task_quiz_intro',
            type: 'normal',
            speaker: '林文渊',
            avatar: IMG_HOST + 'npcs/lin_wenyuan.webp',
            content: '礼数尚可。接下来听题：揭阳学宫始建于哪个朝代？',
            nextId: 'act1_task_quiz',
          },
          {
            id: 'act1_task_quiz',
            type: 'task',
            taskId: 'riddle_one', // 关联 commonTasks
            nextId: 'act1_puzzle_success',
            failId: 'act1_fail_quiz',
          },
          {
            id: 'act1_fail_quiz',
            type: 'normal',
            speaker: '林文渊',
            avatar: IMG_HOST + 'npcs/lin_wenyuan.webp',
            content: '（摇头）连这个都不知道？回去多读几年书再来吧！',
            nextId: 'act1_retry_choice',
          },
          {
            id: 'act1_retry_choice',
            type: 'choice',
            speaker: '系统',
            content: '林先生对你很不满意，是否重新挑战？',
            options: [
              {
                label: '再试一次',
                nextId: 'act1_task_quiz',
              },
              {
                label: '羞愧离开',
                nextId: 'act1_leave',
              },
            ],
          },

          // ---------------------------------------------------------
          // 4. 印章获取与侦探引导 (逻辑修复点)
          // ---------------------------------------------------------
          {
            id: 'act1_puzzle_success',
            type: 'normal',
            speaker: '林文渊',
            avatar: IMG_HOST + 'npcs/lin_wenyuan.webp',
            content:
              '（抚须点头）不错，是个可造之材。这枚【儒学文脉章】便借给你一用。',
            trigger: 'grant_seal_one', // ✅ 立即发放印章
            nextId: 'act1_hint_inspect_pre',
          },
          {
            id: 'act1_hint_inspect_pre',
            type: 'normal',
            speaker: '陈灵儿',
            avatar: 'avatars/chen_linger.webp',
            content:
              '（接过印章，指腹划过侧面时，似乎摸到了一丝细微的裂痕...这印章似乎藏着什么秘密？）\n【系统提示：稍后请进入背包仔细调查印章】',
            nextId: 'act1_pre_present',
          },

          // ---------------------------------------------------------
          // 5. 关键抉择：出示信物 (获取额外线索)
          // ---------------------------------------------------------
          {
            id: 'act1_pre_present',
            type: 'normal',
            speaker: '陈灵儿',
            avatar: 'avatars/chen_linger.webp',
            content:
              '（不过当务之急，是向林先生打听当年的事。若能让他相信我是故人之后...）',
            nextId: 'act1_present_badge',
          },
          {
            id: 'act1_present_badge',
            type: 'present_item',
            speaker: '系统',
            content: '林文渊似乎准备送客了，你身上有什么能证明身份的东西吗？',
            presentHint:
              '提示：出示一件母亲留下的旧物（若未出示将进入普通分支）',
            requiredItemId: 'item_badge',
            correctNextId: 'act1_reveal_badge',
            wrongNextId: 'act1_conceal_badge',
          },

          // ---------------------------------------------------------
          // 6. 结局分支 (只发放线索)
          // ---------------------------------------------------------

          // 分支 A：完美线索 (Six Fingers)
          {
            id: 'act1_reveal_badge',
            type: 'normal',
            speaker: '林文渊',
            avatar: IMG_HOST + 'npcs/lin_wenyuan.webp',
            content:
              '（大惊失色，颤抖着接过腰牌）这...这半月纹...孩子，当年你父母追查的是一个“左手有六指”的人！切记！',
            trigger: 'grant_clue_six_fingers', // 发放核心线索
            nextId: 'act1_end_perfect',
          },

          // 分支 B：模糊线索 (Gloves)
          {
            id: 'act1_conceal_badge',
            type: 'normal',
            speaker: '林文渊',
            avatar: IMG_HOST + 'npcs/lin_wenyuan.webp',
            content:
              '既然印章已到手，就请回吧。我也不能多说，只能告诉你，以后办案要小心身边那些“总是戴着手套”的人。',
            trigger: 'grant_clue_gloves', // 发放普通线索
            nextId: 'act1_end_normal',
          },

          // ---------------------------------------------------------
          // 7. 幕间结算
          // ---------------------------------------------------------
          {
            id: 'act1_end_perfect',
            type: 'end',
            speaker: '系统',
            content:
              '第一幕【学宫试探】完美完成。获得了核心线索“六指”。线索指向了古城老街的青狮表演场。',
            trigger: 'chapter_complete_perfect',
          },
          {
            id: 'act1_end_normal',
            type: 'end',
            speaker: '系统',
            content:
              '第一幕【学宫试探】完成。虽然获得了印章，但关于凶手的特征依然模糊。线索指向了古城老街。',
            trigger: 'chapter_complete_normal',
          },

          // ---------------------------------------------------------
          // 8. 闲聊节点 (保留旧版)
          // ---------------------------------------------------------
          {
            id: 'completed_hint',
            type: 'end',
            speaker: '林文渊',
            avatar: IMG_HOST + 'npcs/lin_wenyuan.webp',
            content:
              '你已经证明了自己的实力。听说古城老街那边锣鼓喧天，或许你应该去见见陈狮魁班主。',
          },
          {
            id: 'completed_chat_reading',
            type: 'end',
            speaker: '林文渊',
            avatar: IMG_HOST + 'npcs/lin_wenyuan.webp',
            content:
              '（手不释卷）"学而不思则罔，思而不学则殆"。拿到了印章也要多读书啊。',
          },
          {
            id: 'completed_chat_care',
            type: 'end',
            speaker: '林文渊',
            avatar: IMG_HOST + 'npcs/lin_wenyuan.webp',
            content:
              '那枚儒学文脉章传了几百年，切记妥善保管，莫要让文脉断了传承。',
          },
          {
            id: 'completed_chat_history',
            type: 'end',
            speaker: '林文渊',
            avatar: IMG_HOST + 'npcs/lin_wenyuan.webp',
            content:
              '揭阳学宫始建于北宋，历经千年风雨。你要守护的不仅是印章，更是这段文脉历史。',
          },
          {
            id: 'completed_chat_wisdom',
            type: 'end',
            speaker: '林文渊',
            avatar: IMG_HOST + 'npcs/lin_wenyuan.webp',
            content:
              '（看着你离去的背影）"知者不惑，仁者不忧，勇者不惧"。孩子，你的路还很长。',
          },
        ],
      },
    },

    // 通用任务：所有角色都可以访问 (保持不变)
    commonTasks: [
      {
        id: 'bow_to_confucius',
        description: '在大成殿向孔子像行揖礼',
        type: 'action',
        correctOption: '行揖礼',
        actionType: 'pose_simulation',
        actionText: '📸 采集动作',
      },
      {
        id: 'riddle_one',
        description: '揭阳学宫始建于哪个朝代？',
        type: 'question',
        options: ['唐朝', '宋朝', '明朝', '清朝'],
        correctOption: '宋朝',
        correctAnswer: '揭阳学宫始建于北宋庆历年间',
      },
      {
        id: 'riddle_two',
        description: '"万世师表"是对谁的尊称？',
        type: 'question',
        options: ['孟子', '孔子', '荀子', '韩愈'],
        correctOption: '孔子',
        correctAnswer: '"万世师表"致敬孔子',
      },
    ],

    // 保持向后兼容的旧字段
    /** @deprecated 使用 storylines[characterId].nodes 替代 */
    scriptNodes: [],
    /** @deprecated 使用 commonTasks 替代 */
    tasks: [],
  },
  {
    id: 'chen_shikui',
    name: '陈狮魁',
    title: '青狮传承人',
    avatar: IMG_HOST + 'npcs/chen_shikui.webp',
    location: 'lion_culture_area',
    background: IMG_HOST + 'locations/lion_culture_bg.webp',
    description: '青狮文化的传承者，守护青狮非遗印章',
    personality: '刚猛豪爽，吃软不吃硬',
    sealId: 'seal_two',

    dialogue: [
      {
        id: 'greeting',
        text: '青狮舞是揭阳的骄傲！想要获得青狮印章，要展现你的勇气和悟性。',
      },
      {
        id: 'task_intro',
        text: '模仿青狮的三个基本动作，然后解读狮头纹饰的含义。',
      },
    ],

    storylines: {
      chen_linger: {
        characterId: 'chen_linger',
        startNodeId: 'act2_start',
        nodes: [
          // ---------------------------------------------------------
          // 1. 开场与初见
          // ---------------------------------------------------------
          {
            id: 'act2_start',
            type: 'normal',
            speaker: '系统',
            content:
              '古城老街传来阵阵锣鼓声。青狮表演场内，一位身材魁梧的中年人正在演练狮头，动作刚猛有力。他就是陈狮魁。',
            nextId: 'act2_observe',
          },
          {
            id: 'act2_observe',
            type: 'normal',
            speaker: '陈灵儿',
            avatar: 'avatars/chen_linger.webp',
            content:
              '（这人看起来脾气暴躁，连林先生都对他颇有微词...想要拿到印章，恐怕没那么容易。）',
            nextId: 'act2_choice_attitude',
          },

          // ---------------------------------------------------------
          // 2. 态度抉择 (影响亲密度)
          // ---------------------------------------------------------
          {
            id: 'act2_choice_attitude',
            type: 'choice',
            speaker: '系统',
            content: '陈狮魁似乎很讨厌官府的人。你打算怎么做？',
            options: [
              {
                label: '武力威慑 (强硬)',
                text: '（亮出捕快佩刀）班主，配合官府办案，交出印章！',
                nextId: 'act2_branch_force',
                effects: { courage: 1, intimacy: -2 }, // 🔴 困难线
              },
              {
                label: '技艺折服 (技巧)',
                text: '（放下佩刀，抱拳行礼）我不以捕快身份压你，愿用青狮步法赢你！',
                nextId: 'act2_branch_skill',
                effects: { intimacy: 2 }, // 🟢 亲密线
              },
            ],
          },

          // 分支 A：强硬
          {
            id: 'act2_branch_force',
            type: 'normal',
            speaker: '陈狮魁',
            avatar: IMG_HOST + 'npcs/chen_shikui.webp',
            content:
              '（冷笑一声）哼！官威好大！印章可以给你，但你别想从我这听到半句废话。不过，规矩就是规矩，想拿印章，先过这关！',
            nextId: 'act2_task_intro',
          },
          // 分支 B：技巧
          {
            id: 'act2_branch_skill',
            type: 'normal',
            speaker: '陈狮魁',
            avatar: IMG_HOST + 'npcs/chen_shikui.webp',
            content:
              '（眼神一亮，上下打量你）哦？有点意思。像当年那个护卫的种！来，让我看看你的身手！',
            nextId: 'act2_task_intro',
          },

          // ---------------------------------------------------------
          // 3. 任务环节：动作 + 答题
          // ---------------------------------------------------------
          {
            id: 'act2_task_intro',
            type: 'normal',
            speaker: '陈狮魁',
            avatar: IMG_HOST + 'npcs/chen_shikui.webp',
            content: '青狮舞讲究"动如雷霆，静如处子"。跟上我的动作！',
            nextId: 'act2_do_action',
          },
          {
            id: 'act2_do_action',
            type: 'task',
            taskId: 'lion_dance_action', // 关联 commonTasks
            nextId: 'act2_quiz_intro',
          },
          {
            id: 'act2_quiz_intro',
            type: 'normal',
            speaker: '陈狮魁',
            avatar: IMG_HOST + 'npcs/chen_shikui.webp',
            content: '身法尚可。再考考你的眼力！',
            nextId: 'act2_do_quiz',
          },
          {
            id: 'act2_do_quiz',
            type: 'task',
            taskId: 'lion_pattern_quiz', // 关联 commonTasks
            nextId: 'act2_success',
            failId: 'act2_fail',
          },
          // 失败分支
          {
            id: 'act2_fail',
            type: 'normal',
            speaker: '陈狮魁',
            avatar: IMG_HOST + 'npcs/chen_shikui.webp',
            content: '（摆摆手）连狮纹都看不懂，回去练练再来吧。',
            nextId: 'act2_retry_choice',
          },
          {
            id: 'act2_retry_choice',
            type: 'choice',
            speaker: '系统',
            content: '挑战失败，是否重新尝试？',
            options: [
              { label: '再试一次', nextId: 'act2_do_quiz' },
              { label: '稍后挑战', nextId: 'act2_leave' },
            ],
          },
          {
            id: 'act2_leave',
            type: 'end',
            speaker: '系统',
            content: '你决定先去别处转转。',
          },

          // ---------------------------------------------------------
          // 4. 成功与印章发放 (基础奖励)
          // ---------------------------------------------------------
          {
            id: 'act2_success',
            type: 'normal',
            speaker: '陈狮魁',
            avatar: IMG_HOST + 'npcs/chen_shikui.webp',
            content: '好！身手不错，也是个懂行的人。这枚【青狮非遗章】归你了。',
            trigger: 'grant_seal_two', // ✅ 立即发放印章
            nextId: 'act2_reveal_mark',
          },

          // ---------------------------------------------------------
          // 5. 剧情转折：发现胎记 (开启隐藏线索)
          // ---------------------------------------------------------
          {
            id: 'act2_reveal_mark',
            type: 'normal',
            speaker: '系统',
            content:
              '你接过印章正欲转身离开，动作幅度略大，不慎露出了腰间的半月形胎记。\n陈狮魁的目光突然凝固了。',
            nextId: 'act2_interrupt',
          },
          {
            id: 'act2_interrupt',
            type: 'normal',
            speaker: '陈狮魁',
            avatar: IMG_HOST + 'npcs/chen_shikui.webp',
            content: '慢着！你腰上那个...那个半月形的痕迹...',
            nextId: 'act2_choice_mark',
          },
          {
            id: 'act2_choice_mark',
            type: 'choice',
            speaker: '系统',
            content: '陈狮魁死死盯着你的胎记，神情复杂。',
            options: [
              {
                label: '大方展示',
                text: '（停下脚步）这是我娘胎里带出来的，班主认得？',
                nextId: 'act2_confirm_identity',
                effects: { clue: 1 }, // 🟢 获得关键线索
              },
              {
                label: '遮掩离去',
                text: '（拉好衣角）没什么，旧伤罢了。告辞。',
                nextId: 'act2_miss_clue',
              },
            ],
          },

          // ---------------------------------------------------------
          // 6. 结局分支 (线索获取)
          // ---------------------------------------------------------

          // 分支 A：获得核心线索 (Lion Scar)
          {
            id: 'act2_confirm_identity',
            type: 'normal',
            speaker: '陈狮魁',
            avatar: IMG_HOST + 'npcs/chen_shikui.webp',
            content:
              '（激动地拍大腿）错不了！果然是故人之女！孩子，既然你是那人的后代，有些事我必须告诉你。',
            nextId: 'act2_clue_reveal',
          },
          {
            id: 'act2_clue_reveal',
            type: 'normal',
            speaker: '陈狮魁',
            avatar: IMG_HOST + 'npcs/chen_shikui.webp',
            content:
              '当年那个抢走印章的人，和我交过手。他被我在手背上狠狠砍了一刀，留下了【狮纹伤疤】。这标记这辈子都消不掉！',
            trigger: 'grant_clue_lion_scar', // ✅ 发放核心线索
            nextId: 'act2_end_perfect',
          },

          // 分支 B：错过线索
          {
            id: 'act2_miss_clue',
            type: 'normal',
            speaker: '陈狮魁',
            avatar: IMG_HOST + 'npcs/chen_shikui.webp',
            content:
              '（眼神黯淡下去）也是...世上相似的人多了去了。行吧，江湖路远，好自为之。',
            nextId: 'act2_end_normal',
          },

          // ---------------------------------------------------------
          // 7. 幕间结算
          // ---------------------------------------------------------
          {
            id: 'act2_end_perfect',
            type: 'end',
            speaker: '系统',
            content:
              '第二幕【青狮怒火】完成。你获得了印章，并掌握了凶手的重要特征“狮纹伤疤”。所有的线索都汇聚到了终点——进贤门。',
            trigger: 'chapter_complete_perfect',
          },
          {
            id: 'act2_end_normal',
            type: 'end',
            speaker: '系统',
            content:
              '第二幕【青狮怒火】完成。虽然获得了印章，但陈狮魁似乎还有话没说。线索指向了终点——进贤门。',
            trigger: 'chapter_complete_normal',
          },

          // ---------------------------------------------------------
          // 8. 闲聊节点
          // ---------------------------------------------------------
          {
            id: 'completed_hint',
            type: 'end',
            speaker: '陈狮魁',
            avatar: IMG_HOST + 'npcs/chen_shikui.webp',
            content:
              '你这身手不错啊！不过真正的考验还在后头。听说进贤门那边有新的线索。',
          },
          {
            id: 'completed_chat_lion',
            type: 'end',
            speaker: '陈狮魁',
            avatar: IMG_HOST + 'npcs/chen_shikui.webp',
            content:
              '（擦拭着狮头）青狮舞要的是那股子精气神！你这年轻人，有当年那个护卫的种。',
          },
          {
            id: 'completed_chat_courage',
            type: 'end',
            speaker: '陈狮魁',
            avatar: IMG_HOST + 'npcs/chen_shikui.webp',
            content:
              '功夫茶要静，舞狮要动！一静一动，才是咱们潮汕人的本事。印章要保管好啊。',
          },
        ],
      },
    },

    // 通用任务定义
    commonTasks: [
      {
        id: 'lion_dance_action',
        description: '模仿青狮步法：左脚虚点，右拳高举，怒目圆睁',
        type: 'action',
        correctOption: '完成动作',
        actionType: 'pose_simulation',
        actionText: '演练青狮步',
      },
      {
        id: 'lion_pattern_quiz',
        description: '青狮头额头的"王"字纹饰，代表了什么寓意？',
        type: 'question',
        options: ['驱邪镇煞', '王者之风', '吉祥如意', '风调雨顺'],
        correctOption: '驱邪镇煞',
        correctAnswer: '青狮被视为"瑞狮"，额头王字意在驱邪镇煞，保一方平安。',
      },
    ],

    scriptNodes: [],
    tasks: [],
  },
  {
    id: 'su_chaweng',
    name: '苏茶翁',
    title: '工夫茶社老师傅',
    avatar: IMG_HOST + 'npcs/su_chaweng.webp',
    location: 'kungfu_tea_house',
    background: IMG_HOST + 'locations/tea_house_bg.webp',
    description: '工夫茶大师，守护茶韵文化印章',
    personality: '温和细致，注重礼仪',
    sealId: 'seal_three',
    dialogue: [
      {
        id: 'greeting',
        text: '工夫茶是潮汕人的待客之道。想要获得茶韵印章，需要领会茶道精髓。',
      },
      {
        id: 'task_intro',
        text: '学会斟茶礼节，认识潮汕名茶。',
      },
    ],

    // 新增：支持角色分片的剧本系统（苏茶翁暂无特定剧情，保留向后兼容）
    storylines: {
      default: {
        characterId: 'default',
        startNodeId: 'tea_intro',
        nodes: [],
      },
    },

    // 通用任务：所有角色都可以访问
    commonTasks: [
      {
        id: 'tea_ceremony',
        description: '学会"关公巡城""韩信点兵"斟茶礼',
        type: 'action',
        correctOption: '演示茶艺',
      },
      {
        id: 'tea_knowledge',
        description: '说出3种工夫茶常用茶',
        type: 'question',
        options: [
          '龙井、碧螺春、铁观音',
          '凤凰单丛、肉桂、水仙',
          '普洱、白茶、黄茶',
        ],
        correctOption: '凤凰单丛、肉桂、水仙',
        correctAnswer: '凤凰单丛、肉桂、水仙都是工夫茶常用茶',
      },
    ],

    // 保持向后兼容的旧字段（已废弃）
    /** @deprecated 使用 commonTasks 替代 */
    tasks: [],
  },
  {
    id: 'zheng_pike',
    name: '郑批客',
    title: '侨批文物馆守护人',
    avatar: IMG_HOST + 'npcs/zheng_pike.webp',
    location: 'qiaopi_museum',
    background: IMG_HOST + 'locations/qiaopi_museum_bg.webp',
    description: '侨批文化的守护者，守护侨批信义印章',
    personality: '怀旧重情，注重信义',
    sealId: 'seal_four',
    dialogue: [
      {
        id: 'greeting',
        text: '侨批承载着海外游子的乡愁和信义。每一张侨批都是一个故事。',
      },
      {
        id: 'task_intro',
        text: '在这里寻找批文残片，拼接出完整的历史记忆。',
      },
    ],

    // 新增：支持角色分片的剧本系统（郑批客暂无特定剧情，保留向后兼容）
    storylines: {
      default: {
        characterId: 'default',
        startNodeId: 'qiaopi_intro',
        nodes: [],
      },
    },

    // 通用任务：所有角色都可以访问
    commonTasks: [
      {
        id: 'find_fragments',
        description: '在文物馆找到3块批文残片',
        type: 'exploration',
        correctOption: '探索寻找',
      },
      {
        id: 'assemble_qiaopi',
        description: '按"银-信-归"符号拼接完整批文',
        type: 'puzzle',
        correctOption: '正确拼接',
      },
    ],

    // 保持向后兼容的旧字段（已废弃）
    /** @deprecated 使用 commonTasks 替代 */
    tasks: [],
  },
  {
    id: 'li_chengshou',
    name: '李城守',
    title: '进贤门城门守史',
    avatar: IMG_HOST + 'npcs/li_chengshou.webp',
    location: 'jinxian_gate',
    background: IMG_HOST + 'locations/jinxian_gate_bg.webp',
    description: '进贤门的守护者，掌管老爷保号章',
    personality: '威严正直，注重传统',
    sealId: 'laoye_baohao_seal',
    dialogue: [
      {
        id: 'greeting',
        text: '进贤门是揭阳古城的正门，象征着进取求贤。老爷保号章在此守护。',
      },
      {
        id: 'task_intro',
        text: '需要集齐前四枚印章，并通过考验才能获得老爷保号章。',
      },
    ],

    // 新增：支持角色分片的剧本系统（李城守暂无特定剧情，保留向后兼容）
    storylines: {
      default: {
        characterId: 'default',
        startNodeId: 'gate_intro',
        nodes: [],
      },
    },

    // 通用任务：所有角色都可以访问
    commonTasks: [
      {
        id: 'drum_declaration',
        description: '登上进贤门击鼓明志（喊出"守护文脉，老爷保号"）',
        type: 'action',
        correctOption: '击鼓宣誓',
      },
      {
        id: 'gate_knowledge',
        description: '进贤门象征什么？',
        type: 'question',
        options: ['财富繁荣', '进取求贤', '平安健康', '团圆美满'],
        correctOption: '进取求贤',
        correctAnswer: '进贤门为揭阳古城正门，象征进取求贤',
      },
      {
        id: 'show_seals',
        description: '出示前四枚印章',
        type: 'item_check',
        correctOption: '展示印章',
      },
    ],

    // 保持向后兼容的旧字段（已废弃）
    /** @deprecated 使用 commonTasks 替代 */
    tasks: [],
  },
  // ... 前面是林文渊、陈狮魁等 ...

  {
    id: 'cai_fusheng',
    name: '蔡福生',
    title: '醉仙楼老板',
    avatar: IMG_HOST + 'npcs/cai_fusheng_boss.webp',
    location: 'jinxian_gate',
    background: IMG_HOST + 'locations/jinxian_gate_bg.webp',
    description: '表面是和气生财的老板，实则是当年的掠夺者后代',
    personality: '伪善、狡诈',
    sealId: 'seal_three_fake', // 默认持有的伪造物
    dialogue: [
      {
        id: 'greeting',
        text: '和气生财，和气生财。陈捕快，今日怎么有空光临寒舍？',
      },
      {
        id: 'default',
        text: '我这人做生意最讲诚信，童叟无欺。您随便看。',
      },
    ],

    storylines: {
      chen_linger: {
        characterId: 'chen_linger',
        startNodeId: 'act3_meet_cai',
        nodes: [
          // ---------------------------------------------------------
          // 1. 决战开场与获得伪证
          // ---------------------------------------------------------
          {
            id: 'act3_meet_cai',
            type: 'normal',
            speaker: '蔡福生',
            avatar: IMG_HOST + 'npcs/cai_fusheng_boss.webp',
            content:
              '哟，这不是陈捕快吗？怎么有空来进贤门吹风？听说你在找老物件，巧了，我这儿正好收了一枚印章。',
            nextId: 'act3_get_fake',
          },
          {
            id: 'act3_get_fake',
            type: 'normal',
            speaker: '系统',
            content:
              '蔡福生笑眯眯地递过来一枚印章。印章表面光鲜亮丽，刻着进贤门的图案。',
            trigger: 'grant_seal_fake', // ✅ 发放伪造印章
            nextId: 'act3_inspect_pause',
          },

          // ---------------------------------------------------------
          // 2. 强制调查断点 (引导玩家使用背包)
          // ---------------------------------------------------------
          {
            id: 'act3_inspect_pause',
            type: 'end', // ⛔️ 暂时结束对话，强迫玩家操作
            speaker: '系统',
            content:
              '（拿到印章的一瞬间，你感觉手感有些不对劲……侧面似乎太平滑了？）\n\n【系统提示】请点击右上角【背包】，仔细【调查】这枚新获得的印章，获得线索后再回来找蔡福生对质。',
            // ✨ [新增] 通用跳转条件：如果已获得线索，则跳转到对质节点
            jumpCondition: {
              requiredClue: 'clue_fake_seal',
              nextId: 'act3_confront',
            },
          },

          // ---------------------------------------------------------
          // 3. 对质与举证 (玩家调查归来后触发)
          // ---------------------------------------------------------
          {
            id: 'act3_confront',
            type: 'normal',
            speaker: '陈灵儿',
            avatar: 'avatars/chen_linger.webp',
            content:
              '（眼神犀利）蔡老板，生意人讲究诚信。但这印章……恐怕有问题吧？',
            nextId: 'act3_present_fake',
          },
          {
            id: 'act3_present_fake',
            type: 'present_item',
            speaker: '系统',
            content: '请指出蔡福生给的信物哪里有问题。',
            presentHint: '提示：出示刚才获得的假印章',
            requiredItemId: 'item_seal_three_fake', // 🎯 修正为背包中实际存在的物品 ID
            correctNextId: 'act3_cai_deny',
            wrongNextId: 'act3_fail_present',
          },
          {
            id: 'act3_fail_present',
            type: 'normal',
            speaker: '蔡福生',
            content: '陈捕快，你拿个毫不相干的东西出来做什么？莫非是想讹我？',
            nextId: 'act3_present_fake', // 重试
          },
          {
            id: 'act3_cai_deny',
            type: 'normal',
            speaker: '蔡福生',
            avatar: IMG_HOST + 'npcs/cai_fusheng_boss.webp',
            content:
              '（脸色一僵，随即恢复正常）假的？哎呀！我也是被人骗了！但我可是正经商人，陈捕快可不能含血喷人啊。',
            nextId: 'act3_final_choice',
          },

          // ---------------------------------------------------------
          // 4. 最终审判抉择 (策略分支)
          // ---------------------------------------------------------
          {
            id: 'act3_final_choice',
            type: 'choice',
            speaker: '系统',
            content:
              '蔡福生还在狡辩，而且他的左手一直藏在袖子里。所有的线索已齐，该收网了！',
            options: [
              {
                label: '雷霆一击 (需果敢)',
                text: '（掀翻桌子）别装了！让我看看你的左手！',
                nextId: 'act3_check_courage',
              },
              {
                label: '言语周旋 (需线索)',
                text: '“蔡老板，听说您这手套是西洋货？摘下来看看？”',
                nextId: 'act3_check_clue',
              },
              {
                label: '暗中观察 (需亲密)',
                text: '（不出声，死死盯着他试图销毁证据的动作）',
                nextId: 'act3_check_intimacy',
              },
            ],
          },

          // ---------------------------------------------------------
          // 5. 属性判定 (Check Logic)
          // ---------------------------------------------------------

          // A. 果敢判定 (Courage Check)
          {
            id: 'act3_check_courage',
            type: 'check',
            condition: { courage: 2 }, // 需要前两幕都选强硬选项
            nextId: 'act3_outcome_force_success',
            failId: 'act3_outcome_force_fail',
          },
          {
            id: 'act3_outcome_force_success',
            type: 'normal',
            speaker: '系统',
            content:
              '【判定成功】你动作极快，一把抓住了他的左手腕！手套脱落，露出了那只有**六根手指**的手！以及手背上狰狞的**狮纹伤疤**！',
            nextId: 'act3_ending_perfect',
          },
          {
            id: 'act3_outcome_force_fail',
            type: 'normal',
            speaker: '系统',
            content:
              '【判定失败】你试图冲上去，但犹豫了一瞬。蔡福生顺势推倒了火盆，场面一片混乱！',
            nextId: 'act3_ending_bad',
          },

          // B. 线索判定 (Clue Check)
          {
            id: 'act3_check_clue',
            type: 'check',
            condition: { clue: 2 }, // 需要前两幕都拿到隐藏线索
            nextId: 'act3_outcome_wit_success',
            failId: 'act3_outcome_wit_fail',
          },
          {
            id: 'act3_outcome_wit_success',
            type: 'normal',
            speaker: '系统',
            content:
              '【判定成功】你冷静地指出了他所有的破绽。蔡福生心理防线崩溃，正要逃跑时被埋伏的郑批客拦住。',
            nextId: 'act3_ending_normal', // 智取虽然抓了人，但可能没拿到日志
          },
          {
            id: 'act3_outcome_wit_fail',
            type: 'normal',
            speaker: '系统',
            content: '【判定失败】证据链不完整，蔡福生反咬一口说你诬陷良民。',
            nextId: 'act3_ending_bad',
          },

          // C. 亲密/洞察判定 (Intimacy Check)
          {
            id: 'act3_check_intimacy',
            type: 'check',
            condition: { intimacy: 1 },
            nextId: 'act3_outcome_observe_success',
            failId: 'act3_outcome_observe_fail',
          },
          {
            id: 'act3_outcome_observe_success',
            type: 'normal',
            speaker: '系统',
            content:
              '【判定成功】你眼疾手快，在他将怀里的《护卫日志》扔进火盆前抢了出来！',
            nextId: 'act3_ending_perfect', // 抢救回日志也是完美结局
          },
          {
            id: 'act3_outcome_observe_fail',
            type: 'normal',
            speaker: '系统',
            content:
              '【判定失败】你眼睁睁看着他把一本泛黄的册子扔进了火盆，化为灰烬。',
            nextId: 'act3_ending_bad',
          },

          // ---------------------------------------------------------
          // 6. 最终结局
          // ---------------------------------------------------------
          {
            id: 'act3_ending_perfect',
            type: 'end',
            speaker: '系统',
            content:
              '【结局：云开月明】\n蔡福生被当场拿获，那一包还没来得及销毁的迷药和藏在暗格里的《护卫日志》完好无损。你终于得知了父母的下落，登上了去往南洋的红头船。',
            endingId: 'ending_perfect', // 🏆 完美结局
          },
          {
            id: 'act3_ending_normal',
            type: 'end',
            speaker: '系统',
            content:
              '【结局：古城守夜人】\n蔡福生因伪造信物被捕入狱，但他死不松口。因为缺乏关键证据《护卫日志》，你无法得知父母的生死，只能继续留在古城守望。',
            endingId: 'ending_normal', // 🛡️ 普通结局
          },
          {
            id: 'act3_ending_bad',
            type: 'end',
            speaker: '系统',
            content:
              '【结局：雨夜孤影】\n线索断了。虽然蔡福生被抓，但他狂笑着看着火盆里的灰烬。你赢了局，却输了家。',
            endingId: 'ending_bad', // 🌧️ 悲剧结局
          },
          // ---------------------------------------------------------
          // 7. 闲聊节点 (剧情结束后随机触发) - 幕后旁白版
          // ---------------------------------------------------------
          {
            id: 'completed_cai_silence',
            type: 'end',
            speaker: '系统',
            content:
              '【后日谈】\n醉仙楼已被官府查封。往日里推杯换盏的喧嚣不再，只剩下门口那张褪色的封条在风中猎猎作响。',
            // 注意：这里不需要 trigger，因为 index.vue 会自动随机读取 completed_ 开头的节点
          },
          {
            id: 'completed_cai_reflection',
            type: 'end',
            speaker: '系统',
            content:
              '【后日谈】\n那个总是把“和气生财”挂在嘴边的老板，终究还是倒在了自己的贪婪之中。古城的正义或许会迟到，但从未缺席。',
          },
          {
            id: 'completed_cai_hint',
            type: 'end',
            speaker: '系统',
            content:
              '【系统提示】\n蔡福生的阴谋已被粉碎。你抚摸着手中的信物，感觉离父母的真相又近了一步。也许该去码头看看了……',
          },
        ],
      },
    },

    commonTasks: [],
    scriptNodes: [],
    tasks: [],
  },
]
