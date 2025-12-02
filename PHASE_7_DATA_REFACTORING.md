# Phase 7: Data Architecture Refactoring (NPC & World State)

## 🎯 目标 (Objective)

将当前的单一 NPC 列表和硬编码逻辑，重构为 **"按角色分片的剧本结构"** 和 **"配置化的世界状态覆写"**。
这旨在解决多主角剧情耦合问题，并消除代码中的 `if (character === 'chen_linger')` 硬编码。

---

## ✅ Step 1: 定义核心接口 (Type Definitions)

**目的:** 建立新的数据模型，确保 TypeScript 类型检查通过。

**Prompt for Agent:**

````markdown
# Role

TypeScript Architect

# Task

Update `src/mock/types.ts` to support the new "Character-Scoped" architecture and "World State" system.

# Requirements

1.  **Define `StorylinePackage`:**
    Create an interface for character-specific plot data:

    ```typescript
    export interface StorylinePackage {
      characterId: string // e.g., 'chen_linger'
      startNodeId: string // Entry point node ID
      nodes: ScriptNode[] // The dialogue tree
      privateTasks?: any[] // Character-specific tasks (optional)
    }
    ```

2.  **Update `NPC` Interface:**
    Modify the existing `NPC` interface:

    - Add `storylines: Record<string, StorylinePackage>;`
    - Add `commonTasks?: any[];` (renaming/migrating the old `tasks`)
    - Add `defaultStoryline?: StorylinePackage;`
    - Mark old fields `scriptNodes` and `tasks` as `@deprecated` (or remove them if you prefer a clean break, but be careful with existing code errors).

3.  **Define World State Interfaces:**
    Add these new interfaces:

    ```typescript
    export interface OverrideCondition {
      requiredSeals?: string[]
      requiredLevel?: number
      requiredFlags?: string[]
    }

    export interface WorldOverride {
      id: string
      condition: OverrideCondition
      poiMapping: Record<string, string> // POI_ID -> NPC_ID
      environmentChanges?: { bgImage?: string; bgm?: string }
    }

    export interface CharacterWorldState {
      characterId: string
      overrides: WorldOverride[]
    }
    ```
````

# Role

Game Data Engineer

# Task

1. Create a new file: `src/mock/world_states.ts`.
2. Implement the `worldStates` constant using the new `CharacterWorldState` interface.
3. Migrate the "Chen Linger Finale" logic into this config.

# Implementation Details

The configuration should look like this:

```typescript
import type { CharacterWorldState } from './types'

export const worldStates: Record<string, CharacterWorldState> = {
  chen_linger: {
    characterId: 'chen_linger',
    overrides: [
      {
        id: 'chen_linger_finale',
        condition: {
          requiredSeals: ['seal_one', 'seal_two'],
        },
        poiMapping: {
          // At Jinxian Gate, replace Li Chengshou with Cai Fusheng
          jinxian_gate: 'cai_fusheng',
        },
      },
    ],
  },
}
```

---

## ✅ Step 3: 迁移 NPC 数据 (Migrate NPC Data)

**目的:** 将 `npcs.ts` 中的扁平数据转换为 `storylines` 嵌套结构。

**Prompt for Agent:**

````markdown
# Role

Data Migration Specialist

# Task

Refactor `src/mock/jieyang/npcs.ts` to match the new `NPC` interface structure.

# Instructions

1.  **Refactor `lin_wenyuan` & `chen_shikui`:**

    - Move their existing `scriptNodes` into `storylines['chen_linger'].nodes`.
    - Move their existing `tasks` into `commonTasks` (since these tasks are cultural quizzes, suitable for everyone).
    - Set `startNodeId` correctly for Chen Linger.

2.  **Refactor `cai_fusheng`:**

    - Move his finale script into `storylines['chen_linger'].nodes`.

3.  **Ensure Backward Compatibility (Optional):**
    - If needed, create a dummy `defaultStoryline` for now to prevent crashes if the user has no character ID.

# Example Structure

```typescript
{
  id: 'lin_wenyuan',
  // ... static props ...
  commonTasks: [ ...old tasks... ],
  storylines: {
    'chen_linger': {
      characterId: 'chen_linger',
      startNodeId: 'act1_intro',
      nodes: [ ...old scriptNodes... ]
    }
  }
}
```
````

---

## ✅ Step 4: 逻辑适配 (Logic Adaptation in Index.vue)

**目的:** 修改 AR 页面逻辑，使其读取新的配置表和数据结构。

**Prompt for Agent:**

````markdown
# Role

Vue 3 Logic Engineer

# Context

We have refactored the data structure. Now `src/pages/ar/index.vue` needs to be updated to use `world_states.ts` and the new `NPC.storylines` structure.

# Task

Modify `src/pages/ar/index.vue`.

# Changes Required

1.  **Import New Data:**
    Import `worldStates` from `../../mock/world_states`.

2.  **Implement `resolveNPCId` Function:**
    Create a helper function that determines which NPC to show based on the current World State.

    - Input: `poiId`, `defaultNpcId`, `userProfile`, `inventory`.
    - Logic: Check `worldStates[characterId]`. Iterate through `overrides`. If conditions (seals) are met and `poiMapping` exists, return the overridden NPC ID.
    - Use this function inside `loadNPCData` to determine `targetNpcId`.

3.  **Implement `getScriptNodes` Function:**
    Update how we retrieve the script nodes.

    - **Old:** `nodes = currentNPC.value.scriptNodes`
    - **New:** ```typescript
      const charId = gameStore.currentUser?.id || 'default';
      const storyline = currentNPC.value.storylines?.[charId] || currentNPC.value.defaultStoryline;
      const nodes = storyline?.nodes || [];
      ```

      ```

4.  **Clean up:**
    Remove the hardcoded "Chen Linger vs Cai Fusheng" if/else logic block inside `loadNPCData`, as it is now handled by `resolveNPCId`.
````
