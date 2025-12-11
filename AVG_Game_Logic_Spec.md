# 🕵️‍♂️ 侦探解谜 AVG 核心逻辑实现技术规范

## 1. 项目概述

本项目正从简单的线性对话游戏升级为具备**物证调查**、**逻辑推理**和**多结局判定**的 AVG 游戏。
本规范旨在指导开发 `src/stores/useGameStore.ts`、`src/pages/ar/index.vue` 和 `src/components/StoryDialogue.vue`，以支持 `npcs.ts` 中定义的复杂剧本逻辑。

**⚠️ 重要原则：**

1.  **增量开发**：优先增加新方法/组件，尽量不修改现有核心逻辑，除非是为了修复 Bug。
2.  **类型安全**：严格遵循 `types.ts` 定义的接口。
3.  **状态驱动**：所有的逻辑判断（检定、物品所有权）必须通过 Pinia Store 进行。

---

## 2. 核心机制定义

我们需要实现以下三种核心交互节点的逻辑流转：

1.  **🔍 调查断点 (Inspect Pause)**

    - **场景**：NPC 给玩家物品后，对话暂时结束，提示玩家去背包调查。
    - **数据特征**：`type: 'end'`，但没有 `endingId`，通常伴随系统提示。
    - **行为**：关闭对话框 -> 玩家手动打开背包 -> 调查物品 -> 获得线索 -> 再次与 NPC 对话触发新剧情。

2.  **⚖️ 数值判定 (Attribute Check)**

    - **场景**：剧情分支点，根据玩家的 `courage` (果敢), `clue` (线索), `intimacy` (亲密) 决定走向。
    - **数据特征**：`type: 'check'`，包含 `condition`, `nextId` (成功), `failId` (失败)。
    - **行为**：Store 计算判定结果 -> 自动跳转到对应节点。

3.  **✋ 举证质询 (Present Item)**
    - **场景**：NPC 要求玩家出示特定证物。
    - **数据特征**：`type: 'present_item'`，包含 `requiredItemId`, `correctNextId`, `wrongNextId`。
    - **行为**：暂停对话 -> 唤起物品选择器 -> 玩家选择物品 -> Store 验证 -> 跳转分支。

---

## 3. 分步实施计划 (Step-by-Step Implementation)

请按顺序执行以下步骤。每完成一步，请确认代码无误。

### ✅ Step 1: 增强 Store 逻辑 (`src/stores/useGameStore.ts`)

**目标**：在 Store 中添加处理 AVG 核心逻辑的 Actions。

**需求描述**：

1.  **新增 `inspectItem(itemId: string)` Action**:
    - 检查该物品是否 `inspectable`。
    - 如果 `inspectable` 且有 `relatedClueId`，调用 `addClue` 发放线索。
    - 返回调查结果文本 (`inspectText`) 和获得的线索 ID。
2.  **新增 `validatePresentation(presentedItemId: string, requiredItemId: string)` Action**:
    - 比对两个 ID 是否一致。
    - 返回布尔值 `true/false`。
3.  **完善 `checkCondition`**:
    - 确保能正确处理 `courage`, `clue`, `intimacy` 的对比逻辑（`types.ts` 中定义的 `ScriptNode` 结构）。

**输出要求**：仅修改 `useGameStore.ts`，保留原有逻辑，追加新函数。

---

### ✅ Step 2: 升级对话组件 UI (`src/components/StoryDialogue.vue`)

**目标**：让对话组件能够渲染特殊节点，并向父组件发射事件。

**需求描述**：

1.  **支持 `type: 'present_item'`**:
    - 当遇到此节点时，不显示普通选项。
    - 显示“出示证物”按钮（或直接嵌入一个简易的物品水平滚动选择栏，视 UX 设计而定，目前建议仅显示按钮，点击触发父组件事件）。
    - **Event**: 点击按钮发射 `emit('present-request', currentNode)`。
2.  **支持 `type: 'check'`**:
    - (可选) 添加一个简短的“判定中...”动画效果。
    - 组件内部或通过父组件立即执行判定逻辑，自动跳转下一句。
3.  **UI 优化**:
    - 区分 `speaker: '系统'` 的样式（通常为画外音/提示，无头像）。

**输出要求**：修改 `StoryDialogue.vue` 的 template 和 script，确保兼容旧版 `choice` 和 `normal` 节点。

---

### ✅ Step 3: 集成主游戏循环 (`src/pages/ar/index.vue`)

**目标**：作为控制器，连接 Store 和 UI，处理复杂的剧情流转。

**需求描述**：

1.  **处理 `present-request` 事件**:
    - 当 `StoryDialogue` 发出请求时，暂停对话组件（不要关闭，只是叠加层）。
    - 打开一个模态框/弹窗显示背包中的 `inventory.items`。
    - 玩家点击物品后，调用 Store 的 `validatePresentation`。
    - 根据结果（True/False），查找当前节点的 `correctNextId` 或 `wrongNextId`。
    - 调用脚本引擎跳转到目标节点 (`currentScriptNode = findNode(targetId)`)。
2.  **处理 `check` 节点逻辑**:
    - 在脚本解析器遇到 `type: 'check'` 时，不要等待用户点击。
    - 立即调用 Store 的 `checkCondition`。
    - 根据结果自动跳转 `nextId` 或 `failId`。
3.  **处理 `end` 节点的特殊情况**:
    - 如果 `end` 节点没有 `endingId`（如 `act3_inspect_pause`），视为“暂时离开”，仅关闭对话框，不触发游戏结局界面。
    - 如果 `end` 节点有 `endingId`，触发游戏结算流程。

**输出要求**：修改 `src/pages/ar/index.vue` 中的脚本执行逻辑（通常是 `handleNode` 或 `next` 函数）。

---

## 4. 辅助数据参考

- **Item Inspection**: 参考 `items.ts` 中的 `item_seal_three_fake` 和 `item_badge`。
- **Script Flow**: 参考 `npcs.ts` 中的 `storylines.chen_linger`。
