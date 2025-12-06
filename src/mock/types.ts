// 游戏数据类型定义
// 支持多城市架构：揭阳、潮州、汕头

// 新增：角色剧本包接口
export interface StorylinePackage {
  characterId: string // 角色ID，如 'chen_linger'
  startNodeId: string // 入口节点ID
  nodes: ScriptNode[] // 对话树节点
  privateTasks?: any[] // 角色专属任务（可选）
}

// 新增：世界状态覆写条件接口
export interface OverrideCondition {
  requiredSeals?: string[] // 需要的印章
  requiredLevel?: number // 需要的等级
  requiredFlags?: string[] // 需要的标记
}

// 新增：世界状态覆写接口
export interface WorldOverride {
  id: string
  condition: OverrideCondition
  poiMapping: Record<string, string> // POI_ID -> NPC_ID 的映射
  environmentChanges?: { bgImage?: string; bgm?: string } // 环境变化（可选）
}

// 新增：角色世界状态接口
export interface CharacterWorldState {
  characterId: string
  overrides: WorldOverride[]
}

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
  routeOrder?: string[]
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

  // 新增字段：支持角色分片的剧本系统
  storylines: Record<string, StorylinePackage> // 角色ID -> 剧本包的映射
  commonTasks?: Array<{
    id: string
    description: string
    type: string
    correctOption: string
    options?: string[]
    actionText?: string
    correctAnswer?: string
    actionType?: 'photo' | 'pose_simulation'
  }> // 通用任务，所有角色都可访问
  defaultStoryline?: StorylinePackage // 默认剧本，当没有角色特定剧本时使用

  // 旧字段：标记为可选或已废弃，以防数据迁移期间出现错误
  /** @deprecated 使用 storylines[characterId].nodes 替代 */
  scriptNodes?: ScriptNode[] // 交互式叙事节点（已废弃）
  /** @deprecated 使用 commonTasks 替代 */
  tasks?: Array<{
    id: string
    description: string
    type: string
    correctOption: string
    options?: string[]
    actionText?: string
    correctAnswer?: string
  }> // 任务列表（已废弃）

  dialogue: Array<{
    id: string
    text: string
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

export interface GameFlow {
  phases: Array<{
    id: string
    name: string
    duration: number // 分钟
    description: string
  }>
  victoryConditions: {
    goodGuys: {
      name: string
      requirements: string[]
    }
    plunderer: {
      name: string
      requirements: string[]
    }
    draw: {
      name: string
      requirements: string[]
    }
  }
}

// 结局类型定义
export type EndingType = 'perfect' | 'normal' | 'bad' | 'hidden'

export interface StoryEnding {
  id: string
  characterId: string // ❗ 必须确认有这个字段
  type: EndingType
  title: string
  achievement: string // 获得的称号
  description: string // 短描述（用于弹窗主要内容）
  background: string // 长描述（用于背景故事或详细文本）
  imageUrl?: string
  musicUrl?: string
  conditions?: {
    minCourage?: number
    maxCourage?: number
    minClue?: number
    minIntimacy?: number
    requiredFlags?: string[]
  }
}

export interface ScriptNode {
  id: string
  type: 'normal' | 'choice' | 'end' | 'task' // Added 'task'
  speaker?: string
  avatar?: string
  content?: string
  nextId?: string
  failId?: string
  taskId?: string // Added for task linking
  endingId?: string // 结局ID，用于type为'end'的节点
  trigger?: string
  options?: Array<{
    label: string
    text?: string
    nextId: string
    effects?: {
      courage?: number
      clue?: number
      intimacy?: number
    }
  }>
}

export interface CityData {
  cityId: string
  cityName: string
  cityStatus: 'locked' | 'unlocked' | 'completed'
  description: string
  characters: Character[]
  npcs: NPC[]
  pois: POI[]
  seals: Seal[]
  gameFlow: GameFlow
  clues: Clue[]
  items?: Item[]
}
