// 游戏核心数据结构定义
// 支持多城市架构：揭阳、潮州、汕头

export const gameData = {
  // 揭阳篇数据
  jieyang: {
    cityId: 'jieyang',
    cityName: '揭阳',
    cityStatus: 'unlocked', // unlocked, locked, completed
    description: '百年侨乡，文脉传承',

    // 角色数据
    characters: [
      {
        id: 'chen_linger',
        name: '陈灵儿',
        avatar: '/static/avatars/chen_linger.png',
        surfaceIdentity: '揭阳学宫捕快',
        realIdentity: '侨商家族信物护卫后代',
        age: 24,
        gender: 'female',
        level: 3,
        route: 'investigation', // investigation, business, culture, revenge
        coreGoal: '集齐五大印章，找到父母当年失踪的"护卫日志"，找出掠夺者',
        specialSkill: '可向NPC出示捕快腰牌，额外获取一条线索',
        backgroundImage: '/static/backgrounds/chen_linger_bg.jpg',
        story: `你自幼被侨商遗孀收养在双峰寺附近，养母告诉你，父母当年是家族的信物护卫，负责守护印章一与印章二，却在百年前的一个雨夜神秘失踪。养母临终前，将半块侨批交给你，上面只刻"印章合，亲人归"。

如今你成为揭阳学宫捕快，每日穿梭于古城，暗中观察七位守护者。你知道，只有集齐五大印章，拼合四章图案，用老爷保号章解锁暗码，才能找到父母藏匿的"护卫日志"，揭露当年他们被掠夺者重伤、流落海外的真相。

你的身上藏着母亲留下的捕快腰牌，背面刻有与印章一契合的纹路，这是你验证印章真伪的关键。`,
        hiddenSecret: '你的腰间有一块与印章二纹路一致的胎记，是家族护卫的标记，可辅助拼接四章图案。',
        tags: ['探案', '护卫', '正义']
      },
      {
        id: 'lin_jingcheng',
        name: '林景澄',
        avatar: '/static/avatars/lin_jingcheng.png',
        surfaceIdentity: '南洋归侨茶叶商',
        realIdentity: '侨商家族直系后裔',
        age: 28,
        gender: 'male',
        level: 5,
        route: 'business',
        coreGoal: '集齐五大印章，夺回家族账本，还原祖辈清白',
        specialSkill: '可与苏茶翁用南洋茶语交流，直接获取印章三线索',
        backgroundImage: '/static/backgrounds/lin_jingcheng_bg.jpg',
        story: `你的祖父是揭阳侨商家族的当家人，当年为支持家乡建设，将巨额资金分批汇回揭阳，却被管家诬陷"侵吞资产"，抑郁而终。家族印章也因此分散，账本被藏匿于藏经阁暗格，需五枚印章合力才能解锁。

你在南洋长大，自幼听父辈讲述家族故事，立誓要夺回印章、找到账本，证明祖父清白。此次归国，你表面经营茶叶生意，实则暗中接触七位守护者，希望通过拼合四章图案、激活老爷保号章，解锁账本藏匿地。

你随身携带祖父留下的红头船模型，船底刻有侨商印章，可验证印章四真伪。`,
        hiddenSecret: '你知晓掠夺者是管家的后代，身上有"管家印记"（左手六指），且伪造的印章没有拼接凹槽。',
        tags: ['归侨', '商业', '正名']
      },
      {
        id: 'tang_yian',
        name: '汤亦安',
        avatar: '/static/avatars/tang_yian.png',
        surfaceIdentity: '林景澄侍卫',
        realIdentity: '当年背叛家族的护卫之子',
        age: 26,
        gender: 'male',
        level: 4,
        route: 'loyalty',
        coreGoal: '协助林景澄集齐印章，找到父亲的忏悔信，完成赎罪',
        specialSkill: '擅长格斗，可帮其他玩家化解NPC的"额外考验"',
        backgroundImage: '/static/backgrounds/tang_yian_bg.jpg',
        story: `你的父亲曾是侨商家族的护卫，却被管家利诱，参与了诬陷祖父、抢夺印章的计划。事后父亲愧疚不已，留下一封忏悔信后自杀，信中写道"印章合，罪可赎"。

你被杨家收养，自幼跟随林景澄，立誓要帮他夺回印章，找到父亲的忏悔信，告慰父亲的在天之灵。你精通青狮拳，身上藏着父亲留下的半块青狮纹玉佩，可与印章二契合，辅助拼接图案。`,
        hiddenSecret: '你知道父亲当年将忏悔信藏在青狮文化景区的狮头道具内，且只有用印章二印在道具上才能取出。',
        tags: ['护卫', '赎罪', '忠诚']
      },
      {
        id: 'su_manman',
        name: '苏漫漫',
        avatar: '/static/avatars/su_manman.png',
        surfaceIdentity: '醉仙楼花魁',
        realIdentity: '侨商家族失散的女儿',
        age: 22,
        gender: 'female',
        level: 3,
        route: 'inheritance',
        coreGoal: '集齐五大印章，唤醒家族记忆，继承家族产业',
        specialSkill: '可通过歌舞才艺，让NPC直接透露印章关键线索',
        backgroundImage: '/static/backgrounds/su_manman_bg.jpg',
        story: `你自幼在醉仙楼长大，不知父母是谁，只身上有一块与印章三契合的胎记。老鸨告诉你，你是百年前一个雨夜被遗弃在醉仙楼门口的，襁褓中只有一张写着"婉清"的纸条和半枚破损的侨批。

长大后，你偶然听闻侨商家族的故事，怀疑自己是家族失散的女儿。此次参与印章争夺，你希望通过集齐印章、拼合图案，唤醒记忆，找到自己的身世，继承家族产业，守护揭阳古城的文化。

你擅长工夫茶与歌舞，可通过才艺获取守护者信任。`,
        hiddenSecret: '你的胎记是解锁老爷保号章背面祈福纹的"钥匙"，需贴在印章背面才能激活暗码功能。',
        tags: ['花魁', '寻亲', '才艺']
      },
      {
        id: 'cai_fusheng',
        name: '蔡福生',
        avatar: '/static/avatars/cai_fusheng.png',
        surfaceIdentity: '醉仙楼老板',
        realIdentity: '当年诬陷侨商的管家后代（掠夺者）',
        age: 35,
        gender: 'male',
        level: 6,
        route: 'betrayal',
        coreGoal: '伪装获取印章，销毁家族账本，掩盖祖辈罪行',
        specialSkill: '擅长伪装与蛊惑，可误导其他玩家怀疑他人',
        backgroundImage: '/static/backgrounds/cai_fusheng_bg.jpg',
        story: `你的祖父是侨商家族的管家，当年因贪念诬陷祖父侵吞资产，试图抢夺印章与账本，却被护卫阻止。祖父临终前嘱咐你"夺回印章，销毁账本，永绝后患"。

你经营醉仙楼为掩护，暗中观察七位守护者，伺机抢夺印章。你身上有狮纹伤疤（当年被印章二划伤），左手六指，为隐藏破绽，常年戴手套。你伪造了假印章三，因不知拼接秘密，假章无凹槽且纹路模糊。

你的口袋里藏着迷药与假印章，计划在玩家获取印章后暗中调换。`,
        hiddenSecret: '左手戴手套，刻意遮掩六指；身上有淡淡的陈皮味；对五大印章的拼接方式异常了解；伪造的印章三无拼接凹槽，纹路模糊，可被张庙祝验证。',
        tags: ['掠夺者', '伪装', '阴谋'],
        isPlunderer: true
      },
      {
        id: 'zheng_yuerong',
        name: '郑月容',
        avatar: '/static/avatars/zheng_yuerong.png',
        surfaceIdentity: '揭阳民间才女',
        realIdentity: '侨商家族账房先生后代',
        age: 23,
        gender: 'female',
        level: 4,
        route: 'revenge',
        coreGoal: '集齐五大印章，找到父亲留下的密码笔记，为父报仇',
        specialSkill: '可快速解读图案暗码，缩短老爷保号章任务时间',
        backgroundImage: '/static/backgrounds/zheng_yuerong_bg.jpg',
        story: `你的父亲是侨商家族的账房先生，因拒绝透露账本藏匿地与印章密码，被管家杀害。父亲临终前将密码笔记藏在老妈宫的祈福牌后，笔记中记录了印章拼接方式、老爷保号章暗码及管家的罪行。

你自幼精通诗词与密码解读，长大后成为古城才女，暗中寻找七位守护者，希望通过印章找到账本，为父报仇。你随身携带父亲的笔记，可快速解读四章图案上的暗码。`,
        hiddenSecret: '笔记中记载"掠夺者左手六指，狮纹伤疤，伪造印章无拼接凹槽"。',
        tags: ['才女', '密码', '复仇']
      },
      {
        id: 'liao_rongfeng',
        name: '廖榕丰',
        avatar: '/static/avatars/liao_rongfeng.png',
        surfaceIdentity: '青狮文化传承人',
        realIdentity: '侨商家族护卫后代',
        age: 25,
        gender: 'male',
        level: 4,
        route: 'guardian',
        coreGoal: '协助玩家集齐印章，找出掠夺者，完成祖父的护卫使命',
        specialSkill: '可展示印章二的隐藏功能，帮助玩家',
        backgroundImage: '/static/backgrounds/liao_rongfeng_bg.jpg',
        story: `你作为陈狮魁的徒弟，青狮表演骨干，实际上是侨商家族护卫的后代。祖父当年在印章争夺战中为保护印章二而牺牲，留下了青狮拳谱和护卫使命。

你从小学习青狮文化，致力于传承这一非物质文化遗产。同时，你也暗中守护着印章二，等待着有缘人来集齐印章，还原历史真相。

你的身上流淌着护卫的血液，誓要完成祖父未竟的使命。`,
        hiddenSecret: '展示印章二隐藏功能（如拼合时发光），帮助玩家验证真伪；引导玩家学习青狮文化，透露"掠夺者惧狮吼"的弱点。',
        tags: ['传承', '守护', '青狮']
      }
    ],

    // NPC数据
    npcs: [
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
        tasks: [
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
        ]
      },
      {
        id: 'chen_shikui',
        name: '陈狮魁',
        title: '青狮传承人',
        avatar: '/static/npcs/chen_shikui.png',
        location: 'lion_culture_area',
        background: '/static/locations/lion_culture_bg.jpg',
        description: '青狮文化的传承者，守护青狮非遗印章',
        personality: '刚猛豪爽，注重传统',
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
        tasks: [
          {
            id: 'lion_actions',
            description: '模仿青狮"眨眼、摆头、跳跃"3个动作',
            type: 'action',
            correctOption: '模仿动作'
          },
          {
            id: 'pattern_meaning',
            description: '狮头纹饰"日月星"分别代表什么？',
            type: 'question',
            options: ['天地人', '儒商匠', '福禄寿', '精气神'],
            correctOption: '儒商匠',
            correctAnswer: '日月星对应儒、商、匠'
          }
        ]
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
        tasks: [
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
        ]
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
        tasks: [
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
        ]
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
        tasks: [
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
        ]
      }
    ],

    // POI地点数据
    pois: [
      {
        id: 'jieyang_confucian_temple',
        name: '揭阳学宫',
        description: '始建于北宋的儒学圣地，揭阳文脉之源',
        latitude: 23.538611,
        longitude: 116.351389,
        address: '揭阳市榕城区韩祠路',
        image: '/static/locations/confucian_temple.jpg',
        backgroundMusic: '/static/audio/confucian_temple_bgm.mp3',
        npcId: 'lin_wenyuan',
        sealId: 'seal_one',
        culturalTheme: '儒学文脉',
        visitDuration: 45,
        difficultyLevel: 2,
        tips: ['注意礼仪规范', '准备儒学基础知识', '大成殿需保持安静']
      },
      {
        id: 'jinxian_gate',
        name: '进贤门',
        description: '揭阳古城正门，象征进取求贤',
        latitude: 23.535024,
        longitude: 116.357944,
        address: '揭阳市榕城区进贤门大道',
        image: '/static/locations/jinxian_gate.jpg',
        backgroundMusic: '/static/audio/jinxian_gate_bgm.mp3',
        npcId: 'li_chengshou',
        sealId: 'laoye_baohao_seal',
        culturalTheme: '民俗祈福',
        visitDuration: 30,
        difficultyLevel: 3,
        tips: ['准备好前四枚印章', '练习击鼓节奏', '了解进贤门历史意义']
      },
      {
        id: 'qiaopi_museum',
        name: '侨批文物馆',
        description: '展示侨批文化，见证海外游子家国情怀',
        latitude: 23.536500,
        longitude: 116.359200,
        address: '揭阳市榕城区古城隍庙附近',
        image: '/static/locations/qiaopi_museum.jpg',
        backgroundMusic: '/static/audio/qiaopi_museum_bgm.mp3',
        npcId: 'zheng_pike',
        sealId: 'seal_four',
        culturalTheme: '侨批信义',
        visitDuration: 60,
        difficultyLevel: 3,
        tips: ['仔细观察展品', '了解侨批历史', '注意批文细节']
      },
      {
        id: 'kungfu_tea_house',
        name: '工夫茶社',
        description: '传统潮汕工夫茶体验地',
        latitude: 23.539000,
        longitude: 116.356000,
        address: '揭阳市榕城区中山路古街',
        image: '/static/locations/tea_house.jpg',
        backgroundMusic: '/static/audio/tea_house_bgm.mp3',
        npcId: 'su_chaweng',
        sealId: 'seal_three',
        culturalTheme: '工夫茶韵',
        visitDuration: 40,
        difficultyLevel: 2,
        tips: ['学习茶艺礼仪', '认识潮汕茶叶', '体会茶道精神']
      },
      {
        id: 'lion_culture_area',
        name: '青狮文化景区',
        description: '青狮非遗文化展示区',
        latitude: 23.541000,
        longitude: 116.353000,
        address: '揭阳市榕城区西湖公园入口附近',
        image: '/static/locations/lion_culture.jpg',
        backgroundMusic: '/static/audio/lion_culture_bgm.mp3',
        npcId: 'chen_shikui',
        sealId: 'seal_two',
        culturalTheme: '青狮非遗',
        visitDuration: 35,
        difficultyLevel: 3,
        tips: ['准备运动服装', '学习青狮动作', '了解非遗文化']
      },
      {
        id: 'lama_palace',
        name: '老妈宫',
        description: '潮汕传统民间信仰场所',
        latitude: 23.533000,
        longitude: 116.355000,
        address: '揭阳市榕城区榕江边',
        image: '/static/locations/lama_palace.jpg',
        backgroundMusic: '/static/audio/lama_palace_bgm.mp3',
        culturalTheme: '民俗信仰',
        visitDuration: 25,
        difficultyLevel: 1,
        tips: ['尊重民间信仰', '了解祈福文化', '注意宫观礼仪']
      },
      {
        id: 'ancient_street',
        name: '古城老街',
        description: '揭阳古城传统商业街区',
        latitude: 23.537500,
        longitude: 116.356500,
        address: '揭阳市榕城区中山路步行街',
        image: '/static/locations/ancient_street.jpg',
        backgroundMusic: '/static/audio/ancient_street_bgm.mp3',
        culturalTheme: '古城风貌',
        visitDuration: 50,
        difficultyLevel: 1,
        tips: ['品尝传统美食', '购买特色纪念品', '感受古城氛围']
      }
    ],

    // 印章数据
    seals: [
      {
        id: 'seal_one',
        name: '儒学文脉章',
        description: '代表揭阳学宫的儒学文化传承',
        icon: '/static/seals/seal_one_icon.png',
        fullImage: '/static/seals/seal_one_full.png',
        culturalTheme: '揭阳学宫儒学文脉',
        holderNpcId: 'lin_wenyuan',
        puzzlePosition: { row: 0, col: 0 }, // 2x2拼图中的左上角
        canCombine: true,
        specialFeature: '与捕快腰牌纹路契合'
      },
      {
        id: 'seal_two',
        name: '青狮非遗章',
        description: '象征青狮文化的勇毅传承',
        icon: '/static/seals/seal_two_icon.png',
        fullImage: '/static/seals/seal_two_full.png',
        culturalTheme: '青狮非遗文化',
        holderNpcId: 'chen_shikui',
        puzzlePosition: { row: 0, col: 1 }, // 右上角
        canCombine: true,
        specialFeature: '拼合时会发光，可验证真伪'
      },
      {
        id: 'seal_three',
        name: '功夫茶韵章',
        description: '体现工夫茶的和敬清寂精神',
        icon: '/static/seals/seal_three_icon.png',
        fullImage: '/static/seals/seal_three_full.png',
        culturalTheme: '功夫茶韵文化',
        holderNpcId: 'su_chaweng',
        puzzlePosition: { row: 1, col: 0 }, // 左下角
        canCombine: true,
        specialFeature: '有胎记契合点'
      },
      {
        id: 'seal_four',
        name: '侨批信义章',
        description: '承载侨批的一纸千金信义精神',
        icon: '/static/seals/seal_four_icon.png',
        fullImage: '/static/seals/seal_four_full.png',
        culturalTheme: '侨批信义文化',
        holderNpcId: 'zheng_pike',
        puzzlePosition: { row: 1, col: 1 }, // 右下角
        canCombine: true,
        specialFeature: '与红头船模型契合验证'
      },
      {
        id: 'laoye_baohao_seal',
        name: '老爷保号章',
        description: '潮汕民俗祈福的核心印章，可解锁终极秘密',
        icon: '/static/seals/laoye_baohao_icon.png',
        fullImage: '/static/seals/laoye_baohao_full.png',
        culturalTheme: '潮汕民俗文化',
        holderNpcId: 'li_chengshou',
        isFinalSeal: true,
        unlockRequirement: ['seal_one', 'seal_two', 'seal_three', 'seal_four'],
        specialFeature: '背面有祈福纹，需特定胎记激活'
      }
    ],

    // 游戏流程配置
    gameFlow: {
      phases: [
        {
          id: 'ice_breaking',
          name: '破冰入场',
          duration: 30, // 分钟
          description: '玩家抽取身份，阅读背景，进行自我介绍'
        },
        {
          id: 'seal_competition',
          name: '印章争夺',
          duration: 120,
          description: '玩家与NPC互动完成任务，获取印章及线索'
        },
        {
          id: 'reasoning',
          name: '推理还原',
          duration: 60,
          description: '分享线索，拼合印章，讨论推理，找出掠夺者'
        },
        {
          id: 'ending',
          name: '结局演绎',
          duration: 30,
          description: '公布掠夺者身份，演绎结局，发放结局道具'
        }
      ],
      victoryConditions: {
        goodGuys: {
          name: '好人阵营胜利',
          requirements: ['收集5枚印章', '正确指认掠夺者', '成功拼合四章图案']
        },
        plunderer: {
          name: '掠夺者胜利',
          requirements: ['未被指认', '破坏至少2枚印章']
        },
        draw: {
          name: '平局',
          requirements: ['未集齐印章但指认掠夺者', '或集齐印章但指认错误/未拼合图案']
        }
      }
    },

    // 线索数据
    clues: [
      {
        id: 'clue_001',
        type: 'item',
        name: '伪造印章三',
        description: '这是一枚伪造的印章，无拼接凹槽，纹路模糊。在苏茶翁茶社发现，是识别掠夺者的重要线索。',
        icon: '/static/clues/fake-seal.png',
        location: 'kungfu_tea_house',
        relevance: 'plunderer_identification'
      },
      {
        id: 'clue_002',
        type: 'testimony',
        name: '陈皮味证言',
        description: '王市井的证词：蔡老板常买陈皮，称可入药。这个奇怪的习惯可能是掠夺者的特征之一。',
        icon: '/static/clues/testimony.png',
        witness: '王市井',
        location: 'ancient_street',
        relevance: 'plunderer_habit'
      },
      {
        id: 'clue_003',
        type: 'environment',
        name: '进贤门迷药残留',
        description: '在进贤门的鼓架处发现的迷药残留，与蔡福生口袋中的物品一致。这表明掠夺者使用了特殊的手段。',
        icon: '/static/clues/powder.png',
        location: 'jinxian_gate',
        relevance: 'plunderer_tools'
      },
      {
        id: 'clue_004',
        type: 'knowledge',
        name: '掠夺者特征',
        description: '根据郑月容父亲笔记记载：掠夺者左手六指，背部有狮纹伤疤，伪造的印章没有拼接凹槽。这些特征是识别他的关键。',
        icon: '/static/clues/notes.png',
        source: '郑月容父亲笔记',
        location: 'lama_palace',
        relevance: 'plunderer_identification'
      }
    ],

    // 道具数据
    items: [
      {
        id: 'item_001',
        name: '父亲的笔记',
        description: '父亲留下的珍贵笔记，记录了家族印章的秘密和掠夺者的线索。字里行间透露出深深的不安和担忧。',
        icon: '/static/items/father-notes.png',
        type: 'document'
      },
      {
        id: 'item_002',
        name: '捕快腰牌',
        description: '陈灵儿的身份凭证，背面刻有与印章一契合的纹路，是验证印章真伪的关键物品。',
        icon: '/static/items/badge.png',
        type: 'identity'
      },
      {
        id: 'item_003',
        name: '半块侨批',
        description: '养母临终前交给你的半块侨批，上面刻着"印章合，亲人归"，是寻找父母的重要线索。',
        icon: '/static/items/half-letter.png',
        type: 'heirloom'
      },
      {
        id: 'item_004',
        name: '南洋茶叶',
        description: '林景澄从南洋带回的特产茶叶，据说是与苏茶翁交流的特殊媒介，蕴含着家族的历史。',
        icon: '/static/items/tea.png',
        type: 'special'
      }
    ]
  },

  // 潮州篇数据（预留空结构）
  chaozhou: {
    cityId: 'chaozhou',
    cityName: '潮州',
    cityStatus: 'locked', // locked, unlocked, completed
    description: '千年古城，瓷都茶乡',
    characters: [],
    npcs: [],
    pois: [],
    seals: [],
    gameFlow: {},
    clues: []
  },

  // 汕头篇数据（预留空结构）
  shantou: {
    cityId: 'shantou',
    cityName: '汕头',
    cityStatus: 'locked', // locked, unlocked, completed
    description: '百载商埠，海丝门户',
    characters: [],
    npcs: [],
    pois: [],
    seals: [],
    gameFlow: {},
    clues: []
  }
}

// 导出类型定义
export interface Character {
  id: string
  name: string
  avatar: string
  surfaceIdentity: string
  realIdentity: string
  age: number
  gender: 'male' | 'female'
  level: number
  route: string
  coreGoal: string
  specialSkill: string
  backgroundImage: string
  story: string
  hiddenSecret: string
  tags: string[]
  isPlunderer?: boolean
}

export interface NPC {
  id: string
  name: string
  title: string
  avatar: string
  location: string
  background: string
  description: string
  personality: string
  sealId: string
  dialogue: Array<{
    id: string
    text: string
  }>
  tasks: Array<{
    id: string
    description: string
    type: string
    correctOption: string
    options?: string[]
    correctAnswer?: string
  }>
}

export interface POI {
  id: string
  name: string
  description: string
  latitude: number
  longitude: number
  address: string
  image: string
  backgroundMusic: string
  npcId?: string
  sealId?: string
  culturalTheme: string
  visitDuration: number
  difficultyLevel: number
  tips: string[]
}

export interface Seal {
  id: string
  name: string
  description: string
  icon: string
  fullImage: string
  culturalTheme: string
  holderNpcId?: string
  puzzlePosition?: { row: number; col: number }
  canCombine?: boolean
  isFinalSeal?: boolean
  unlockRequirement?: string[]
  specialFeature?: string
}

export interface Clue {
  id: string
  type: 'item' | 'testimony' | 'environment' | 'knowledge'
  name: string
  description: string
  icon: string
  location?: string
  witness?: string
  source?: string
  relevance: string
}

export interface Item {
  id: string
  name: string
  description: string
  icon: string
  type: 'document' | 'identity' | 'heirloom' | 'special' | 'consumable'
}