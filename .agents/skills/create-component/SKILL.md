---
name: create-component
description: 按团队规范创建与拆分 Vue 3 组件，含层级归属判定、SFC 结构、Props/Emits 定义与拆分时机。新增组件、拆分大组件、或不确定组件该放哪时使用。
---

# 创建与拆分组件

## 使用时机

新建组件、把过大的组件拆小、或不确定某段 UI 该放全局还是页面私有时。

## 目标产出

- 组件落在正确的目录层级
- 显式类型化的 Props / Emits + BEM 样式
- `pnpm type-check` 通过

## 前置

先读 `.agents/rules/04-组件规范.md` 与 `03-项目结构.md`。
**必读** `src/layouts/MainLayout.vue`（本项目组件结构、BEM、事件命名的真实范例）。

## 步骤 1：先判定归属层级（NON-NEGOTIABLE）

| 判定 | 位置 |
|------|------|
| 路由直接渲染、一页一个 | `src/views/XxxView.vue` |
| 只被**一个**页面使用 | `src/views/<页面>/components/` |
| 被**两个及以上**页面使用 | `src/components/<组件名>/index.vue` |
| 页面骨架（侧边栏+顶栏） | `src/layouts/MainLayout.vue` |

> **不足两处复用不要提前抽象**——先放页面私有，出现第二个使用方再上提（YAGNI）。

## 步骤 2：建骨架

通用组件用「目录 + `index.vue`」；页面私有组件可直接 `.vue` 单文件（与现有 `views/*.vue` 一致）。

```vue
<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  title: string
  items?: string[]
}

const props = withDefaults(defineProps<Props>(), {
  items: () => [],
})

const count = computed(() => props.items.length)

const emit = defineEmits<{
  remove: [id: string]
}>()
</script>

<template>
  <div class="stat-card">
    <span class="stat-card__title">{{ title }}</span>
    <span class="stat-card__count">{{ count }}</span>
    <el-button type="danger" link @click="emit('remove', title)">删除</el-button>
  </div>
</template>

<style scoped>
.stat-card {
  display: flex;
  align-items: center;
  gap: 8px;
}

.stat-card__title {
  font-size: 14px;
  color: var(--el-text-color-primary);
}
</style>
```

## 步骤 3：Props / Emits 约定（NON-NEGOTIABLE）

- **必须** `defineProps<{...}>` 或 `withDefaults(defineProps<...>, ...)` 显式类型化
- 禁止运行时对象声明 + 无类型
- **必须** `defineEmits<{...}>` 显式声明
- Props PascalCase；模板中 kebab-case（`:max-count`）
- 禁止子组件修改 props；需要回传用 emit
- **禁止**用 store 中转本可用 props/emit 解决的数据（单向数据流）

## 步骤 4：样式

- 一律 `<style scoped>`
- BEM：`block__element--modifier`（如 `stat-card__title`）
- 动态 class：`:class="{ 'is-active': active }"`
- 颜色优先 `var(--el-*)`；侧边栏 `#001529` 等既有 token 见 `.agents/rules/09-样式规范`
- 间距用 4/8 倍数（4/8/12/16/24px）

## 步骤 5：交互完备性

每个组件都要有：

- **加载态**：`v-loading` / `el-skeleton` / 按钮 `loading`
- **空态**：`<el-empty>`
- **错误兜底**：失败不白屏（错误提示由 API 拦截器统一给，组件只管展示兜底）
- **破坏性操作**：`ElMessageBox.confirm` 二次确认
- **UI 文案**：中文，与现有页面语气一致

## 拆分时机

单文件接近 **400 行**时拆：

1. 先把**无业务的展示片段**下放为页面私有组件
2. 复杂逻辑抽成组合式函数 `useXxx`（若需新建 `src/composables/`，先更新 `.agents/rules/03-项目结构.md`）
3. 仍拆不动，才考虑上提为通用组件

拆分**保持视觉与交互不变**——这是结构调整，不是设计变更。

## 检查清单

- [ ] 归属层级判定有依据（"被几个页面用"）
- [ ] `<script setup lang="ts">`，无 Options API
- [ ] `defineProps` / `defineEmits` 显式类型
- [ ] 未修改 props、未用 store 中转父子数据
- [ ] `<style scoped>` + BEM 类名
- [ ] 颜色未硬编码新值（或已登记到 `09-样式规范`）
- [ ] 有加载/空/错误兜底
- [ ] 文案为中文
- [ ] `pnpm type-check` / `pnpm lint` 通过

## 常见错误

| 错误 | 后果 |
|------|------|
| 页面还没复用就抽 `src/components/` | 过度抽象，后续改动牵一发动全身 |
| `props: { title: String }` 无类型 | 类型不安全，与 TS strict 冲突 |
| 子组件改 props | 单向数据流破坏，调试困难 |
| `style` 不加 scoped | 样式泄漏到其他页面 |
| 依赖 `.el-button--primary` 内部类名 | Element Plus 升级即碎 |
| 缺空态/加载态 | 接口慢或空数据时白屏 |

## 相关技能

- 组件要挂到页面 → `.agents/skills/create-route`
- 样式与主题变量 → `.agents/skills/element-plus-theme`
- 有设计稿，需验收还原度 → `.agents/skills/ui-verification`
