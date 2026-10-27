---
name: create-store
description: 用 Pinia setup store 风格新增全局状态模块，含状态归属判定、文件组织与持久化。需要跨组件共享状态、或不确定状态该放哪时使用。
---

# 新增 Pinia Store

## 使用时机

需要在多个不相关组件间共享状态、或不确定某状态该放 Store 还是组件内时。

## 目标产出

- `src/stores/<模块>.ts` 导出 `useXxxStore`
- 状态归属判定结论（若判定为「不该进 store」，也要明确给出）
- `pnpm type-check` 通过

## 前置

先读 `.agents/rules/07-状态管理.md`。**必读** `src/stores/user.ts`（本项目唯一真实范例）。

## 步骤 0：先判断要不要建 Store（NON-NEGOTIABLE）

**多数「新状态」不需要新 Store。** 按下表判定，**优先级从上到下**：

| 状态特征 | 放哪 |
|----------|------|
| 只被一个组件用 | 组件内 `ref` / `reactive` |
| 父子之间传递 | props down / emit up |
| 当前路径、页面参数 | `useRoute()` |
| 筛选、分页等可分享的状态 | **路由 query/params**（刷新保留、可分享） |
| 派生值（列表长度、是否已登录） | `computed`，不要存冗余副本 |
| **两个及以上不相关组件**共享，且刷新需保留 | **这才进 Store** |

> 判定结果为「不进 store」时，直接采用对应方案并说明理由，**不要为了用而用**。

## 工作流程（4 步）

### 1. 建文件

`src/stores/<模块>.ts`，**单文件单模块**，camelCase 文件名。

### 2. 写 setup store

```ts
import { ref, computed } from 'vue'
import { defineStore } from 'pinia'

export const useAuthStore = defineStore('auth', () => {
  // 1) 状态: 一律带显式类型, 不要 ref() 裸用
  const token = ref<string>(localStorage.getItem('token') ?? '')
  const name = ref<string>('')

  // 2) 派生值: 用 computed, 不存冗余副本
  const isLoggedIn = computed(() => token.value.length > 0)

  // 3) 行为(action): 副作用集中在 action, 不散在组件里
  function setToken(value: string) {
    token.value = value
    localStorage.setItem('token', value)
  }

  function logout() {
    token.value = ''
    name.value = ''
    localStorage.removeItem('token')
  }

  // 4) 显式返回需要暴露的成员
  return { token, name, isLoggedIn, setToken, logout }
})
```

**要点**

- 风格**必须**是 `defineStore('id', () => {...})`（setup store），禁止 options store
- `ref<T>` **必须带类型**，`ref()` 裸用会推断为 `Ref<undefined>`
- store id 全局唯一，短小单词
- **显式 `return`** 暴露成员（与 `user.ts` 一致）

### 3. 组件中使用

```vue
<script setup lang="ts">
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
</script>

<template>
  <span>{{ authStore.name }}</span>
</template>
```

- `main.ts` 已 `app.use(createPinia())`，**不要**重复注册
- 通过 store 暴露的 action 修改状态，**禁止**在 store 外直接改内部 `ref`

### 4. 请求数据的 Store

需要在 store 里调接口时：

```ts
import { getLogList } from '@/api/log'
import type { LogItem } from '@/api/log'

const items = ref<LogItem[]>([])
const loading = ref(false)

async function load(params: { page: number; size: number }) {
  loading.value = true
  try {
    const data = await getLogList(params)
    items.value = data.items
  } finally {
    loading.value = false
    // 注意: 不要 ElMessage.error — 拦截器已统一提示 (见 05-API规范)
  }
}
```

## 持久化

- 本项目**未安装** `pinia-plugin-persistedstate`
- 现行做法：在 action 内显式读写 `localStorage`（见 `user.ts` 的 `setToken` / `logout`）
- **token 的 localStorage 读写集中在 store**；仅 `router/index.ts` 守卫允许直接读 `localStorage.getItem('token')`（避免循环依赖）
- 需要更通用的持久化方案时，先更新 `.agents/rules/07-状态管理.md` 与 `01-项目概述.md`

## 检查清单

- [ ] 已完成步骤 0 判定，确认**确实需要**进 Store
- [ ] 文件在 `src/stores/<模块>.ts`，单模块
- [ ] `defineStore('id', () => {...})` setup 风格
- [ ] `ref<T>` 全部带显式类型
- [ ] 派生值用 `computed`
- [ ] 副作用（请求、localStorage）在 action 内
- [ ] 未在组件中直接改 store 内部状态
- [ ] 未重复注册 pinia
- [ ] `pnpm type-check` 通过

## 常见错误

| 错误 | 后果 |
|------|------|
| 组件一挂载就新建 store 存本组件状态 | 状态污染、无法预期共享范围 |
| `ref()` 裸用 | 类型推断为 `undefined`，后续赋值报错 |
| 存一份列表长度再手工同步 | 数据漂移，改了列表忘了改长度 |
| Store 里 `ElMessage.error` | 与拦截器重复提示 |
| Store 里 import 组件 / 操作 DOM | 耦合 UI，无法复用 |
| 建 `src/state/`、`src/store/` 目录 | 违反 `03-项目结构` NON-NEGOTIABLE |

## 相关技能

- 数据来源 → `.agents/skills/create-api`
- 页面路由参数表达状态 → `.agents/skills/create-route`
