import type { Character } from '../types'
import { IMG_HOST } from '@/config/constants'

export const characters: Character[] = [
  {
    id: 'chen_linger',
    name: '陈灵儿',
    avatar: IMG_HOST + 'avatars/chen_linger.webp',
    surfaceIdentity: '揭阳学宫捕快',
    realIdentity: '侨商家族信物护卫后代',
    age: 24,
    gender: 'female',
    level: 3,
    route: 'investigation', // investigation, business, culture, revenge
    coreGoal: '集齐五大印章，找到父母当年失踪的"护卫日志"，找出掠夺者',
    specialSkill: '可向NPC出示捕快腰牌，额外获取一条线索',
    backgroundImage: IMG_HOST + 'background/chen_linger_bg.webp',
    story: `你自幼被侨商遗孀收养在双峰寺附近，养母告诉你，父母当年是家族的信物护卫，负责守护印章一与印章二，却在百年前的一个雨夜神秘失踪。养母临终前，将半块侨批交给你，上面只刻"印章合，亲人归"。

如今你成为揭阳学宫捕快，每日穿梭于古城，暗中观察七位守护者。你知道，只有集齐五大印章，拼合四章图案，用老爷保号章解锁暗码，才能找到父母藏匿的"护卫日志"，揭露当年他们被掠夺者重伤、流落海外的真相。

你的身上藏着母亲留下的捕快腰牌，背面刻有与印章一契合的纹路，这是你验证印章真伪的关键。`,
    hiddenSecret:
      '你的腰间有一块与印章二纹路一致的胎记，是家族护卫的标记，可辅助拼接四章图案。',
    tags: ['探案', '护卫', '正义'],
    routeOrder: [
      'jieyang_confucian_temple', // 初始点 (0印章)
      'lion_culture_area', // 第2站 (1印章解锁)
      // 'kungfu_tea_house',         // 第3站 (2印章解锁)
      // 'qiaopi_museum',            // 第4站 (3印章解锁)
      'jinxian_gate', // 终局 (4印章解锁)
    ],
  },
  {
    id: 'lin_jingcheng',
    name: '林景澄',
    avatar: IMG_HOST + 'avatars/lin_jingcheng.webp',
    surfaceIdentity: '南洋归侨茶叶商',
    realIdentity: '侨商家族直系后裔',
    age: 28,
    gender: 'male',
    level: 5,
    route: 'business',
    coreGoal: '集齐五大印章，夺回家族账本，还原祖辈清白',
    specialSkill: '可与苏茶翁用南洋茶语交流，直接获取印章三线索',
    backgroundImage: IMG_HOST + 'background/lin_jingcheng_bg.webp',
    story: `你的祖父是揭阳侨商家族的当家人，当年为支持家乡建设，将巨额资金分批汇回揭阳，却被管家诬陷"侵吞资产"，抑郁而终。家族印章也因此分散，账本被藏匿于藏经阁暗格，需五枚印章合力才能解锁。

你在南洋长大，自幼听父辈讲述家族故事，立誓要夺回印章、找到账本，证明祖父清白。此次归国，你表面经营茶叶生意，实则暗中接触七位守护者，希望通过拼合四章图案、激活老爷保号章，解锁账本藏匿地。

你随身携带祖父留下的红头船模型，船底刻有侨商印章，可验证印章四真伪。`,
    hiddenSecret:
      '你知晓掠夺者是管家的后代，身上有"管家印记"（左手六指），且伪造的印章没有拼接凹槽。',
    tags: ['归侨', '商业', '正名'],
  },
  {
    id: 'tang_yian',
    name: '汤亦安',
    avatar: IMG_HOST + 'avatars/tang_yian.webp',
    surfaceIdentity: '林景澄侍卫',
    realIdentity: '当年背叛家族的护卫之子',
    age: 26,
    gender: 'male',
    level: 4,
    route: 'loyalty',
    coreGoal: '协助林景澄集齐印章，找到父亲的忏悔信，完成赎罪',
    specialSkill: '擅长格斗，可帮其他玩家化解NPC的"额外考验"',
    backgroundImage: IMG_HOST + 'background/tang_yian_bg.webp',
    story: `你的父亲曾是侨商家族的护卫，却被管家利诱，参与了诬陷祖父、抢夺印章的计划。事后父亲愧疚不已，留下一封忏悔信后自杀，信中写道"印章合，罪可赎"。

你被杨家收养，自幼跟随林景澄，立誓要帮他夺回印章，找到父亲的忏悔信，告慰父亲的在天之灵。你精通青狮拳，身上藏着父亲留下的半块青狮纹玉佩，可与印章二契合，辅助拼接图案。`,
    hiddenSecret:
      '你知道父亲当年将忏悔信藏在青狮文化景区的狮头道具内，且只有用印章二印在道具上才能取出。',
    tags: ['护卫', '赎罪', '忠诚'],
  },
  {
    id: 'su_manman',
    name: '苏漫漫',
    avatar: IMG_HOST + 'avatars/su_manman.webp',
    surfaceIdentity: '醉仙楼花魁',
    realIdentity: '侨商家族失散的女儿',
    age: 22,
    gender: 'female',
    level: 3,
    route: 'inheritance',
    coreGoal: '集齐五大印章，唤醒家族记忆，继承家族产业',
    specialSkill: '可通过歌舞才艺，让NPC直接透露印章关键线索',
    backgroundImage: IMG_HOST + 'background/su_manman_bg.webp',
    story: `你自幼在醉仙楼长大，不知父母是谁，只身上有一块与印章三契合的胎记。老鸨告诉你，你是百年前一个雨夜被遗弃在醉仙楼门口的，襁褓中只有一张写着"婉清"的纸条和半枚破损的侨批。

长大后，你偶然听闻侨商家族的故事，怀疑自己是家族失散的女儿。此次参与印章争夺，你希望通过集齐印章、拼合图案，唤醒记忆，找到自己的身世，继承家族产业，守护揭阳古城的文化。

你擅长工夫茶与歌舞，可通过才艺获取守护者信任。`,
    hiddenSecret:
      '你的胎记是解锁老爷保号章背面祈福纹的"钥匙"，需贴在印章背面才能激活暗码功能。',
    tags: ['花魁', '寻亲', '才艺'],
  },
  {
    id: 'cai_fusheng',
    name: '蔡福生',
    avatar: IMG_HOST + 'avatars/cai_fusheng.webp',
    surfaceIdentity: '醉仙楼老板',
    realIdentity: '当年诬陷侨商的管家后代（掠夺者）',
    age: 35,
    gender: 'male',
    level: 6,
    route: 'betrayal',
    coreGoal: '伪装获取印章，销毁家族账本，掩盖祖辈罪行',
    specialSkill: '擅长伪装与蛊惑，可误导其他玩家怀疑他人',
    backgroundImage: IMG_HOST + 'background/cai_fusheng_bg.webp',
    story: `你的祖父是侨商家族的管家，当年因贪念诬陷祖父侵吞资产，试图抢夺印章与账本，却被护卫阻止。祖父临终前嘱咐你"夺回印章，销毁账本，永绝后患"。

你经营醉仙楼为掩护，暗中观察七位守护者，伺机抢夺印章。你身上有狮纹伤疤（当年被印章二划伤），左手六指，为隐藏破绽，常年戴手套。你伪造了假印章三，因不知拼接秘密，假章无凹槽且纹路模糊。

你的口袋里藏着迷药与假印章，计划在玩家获取印章后暗中调换。`,
    hiddenSecret:
      '左手戴手套，刻意遮掩六指；身上有淡淡的陈皮味；对五大印章的拼接方式异常了解；伪造的印章三无拼接凹槽，纹路模糊，可被张庙祝验证。',
    tags: ['掠夺者', '伪装', '阴谋'],
    isPlunderer: true,
  },
  {
    id: 'zheng_yuerong',
    name: '郑月容',
    avatar: IMG_HOST + 'avatars/zheng_yuerong.webp',
    surfaceIdentity: '揭阳民间才女',
    realIdentity: '侨商家族账房先生后代',
    age: 23,
    gender: 'female',
    level: 4,
    route: 'revenge',
    coreGoal: '集齐五大印章，找到父亲留下的密码笔记，为父报仇',
    specialSkill: '可快速解读图案暗码，缩短老爷保号章任务时间',
    backgroundImage: IMG_HOST + 'background/zheng_yuerong_bg.webp',
    story: `你的父亲是侨商家族的账房先生，因拒绝透露账本藏匿地与印章密码，被管家杀害。父亲临终前将密码笔记藏在老妈宫的祈福牌后，笔记中记录了印章拼接方式、老爷保号章暗码及管家的罪行。

你自幼精通诗词与密码解读，长大后成为古城才女，暗中寻找七位守护者，希望通过印章找到账本，为父报仇。你随身携带父亲的笔记，可快速解读四章图案上的暗码。`,
    hiddenSecret: '笔记中记载"掠夺者左手六指，狮纹伤疤，伪造印章无拼接凹槽"。',
    tags: ['才女', '密码', '复仇'],
  },
  {
    id: 'liao_rongfeng',
    name: '廖榕丰',
    avatar: IMG_HOST + 'avatars/liao_rongfeng.webp',
    surfaceIdentity: '青狮文化传承人',
    realIdentity: '侨商家族护卫后代',
    age: 25,
    gender: 'male',
    level: 4,
    route: 'guardian',
    coreGoal: '协助玩家集齐印章，找出掠夺者，完成祖父的护卫使命',
    specialSkill: '可展示印章二的隐藏功能，帮助玩家',
    backgroundImage: IMG_HOST + 'background/liao_rongfeng_bg.webp',
    story: `你作为陈狮魁的徒弟，青狮表演骨干，实际上是侨商家族护卫的后代。祖父当年在印章争夺战中为保护印章二而牺牲，留下了青狮拳谱和护卫使命。

你从小学习青狮文化，致力于传承这一非物质文化遗产。同时，你也暗中守护着印章二，等待着有缘人来集齐印章，还原历史真相。

你的身上流淌着护卫的血液，誓要完成祖父未竟的使命。`,
    hiddenSecret:
      '展示印章二隐藏功能（如拼合时发光），帮助玩家验证真伪；引导玩家学习青狮文化，透露"掠夺者惧狮吼"的弱点。',
    tags: ['传承', '守护', '青狮'],
  },
]
