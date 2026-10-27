---
name: create-route
description: 按团队规范新增页面路由，含路由注册、meta 契约、菜单同步与懒加载。需要新增页面、新增路由或调整侧边栏菜单时使用。
---

# 新增页面与路由

## 使用时机

新增一个页面、给现有页面改路由路径、或需要在侧边栏增删菜单项时。

## 目标产出

- `src/views/XxxView.vue` 页面组件
- `src/router/index.ts` 中新增一条路由
- （需要展示在侧边栏时）`src/layouts/MainLayout.vue` 同步菜单项
- `pnpm type-check` 通过

## 前置

先读 `.agents/rules/06-路由规范.md`（meta 契约、守卫行为、菜单一致性）与 `03-项目结构.md`。

## 工作流程（5 步）

### 1. 建页面组件

文件名 PascalCase 且以 `View` 结尾，放 `src/views/` 根目录（不要建子目录）。

```vue
<script setup lang="ts">
import { ref } from 'vue'

const loading = ref(false)
</script>

<template>
  <div class="xxx-view" v-loading="loading">
    <h2>页面标题</h2>
  </div>
</template>

<style scoped>
.xxx-view {
  /* BEM, 见 09-样式规范 */
}
</style>
```

> 页面已有私有子组件时放 `src/views/XxxView/components/`（同名目录），不要提前抽到 `src/components/`。

### 2. 注册路由

在 `src/router/index.ts` 注册。需要侧边栏框架的页面放进 `MainLayout` 的 `children`：

```ts
{
  path: 'report',
  name: 'report',
  component: () => import('@/views/ReportView.vue'),
  meta: { title: '报表中心' },     // 必填: 顶栏标题
},
```

**全屏独立页**（登录类）放顶层：

```ts
{
  path: '/login',
  name: 'login',
  component: () => import('@/views/LoginView.vue'),
  meta: { title: '登录', public: true },   // public = 免登录
},
```

### 3. 判定 meta

| 情况 | 写法 |
|------|------|
| 需登录、顶栏显示标题 | `meta: { title: 'xxx' }` |
| 免登录（登录页、404、落地页） | `meta: { title: 'xxx', public: true }` |
| 想在顶栏隐藏标题 | `meta: { title: '', hideTitle: true }`（需 `MainLayout` 支持，先确认） |

- `meta.title` **必填**，否则顶栏空白
- `name` 全局唯一，camelCase，供 `router.push({ name })` 使用

### 4. 同步侧边栏菜单（需要展示时）

**必须同时改两处**，否则菜单与路由不一致。编辑 `src/layouts/MainLayout.vue`：

```html
<el-menu-item index="/report">
  <el-icon><DataAnalysis /></el-icon>
  <span>报表中心</span>
</el-menu-item>
```

- `index` 必须与 `path` **完全一致**（`el-menu` 靠它高亮与跳转）
- 路由是 `/calendar`（子路径），菜单 `index` 写 `/calendar`
- 图标来自 `@element-plus/icons-vue`，已在 `main.ts` **全量注册**，无需 import
- 不需要展示的页面（登录、个人工具页）跳过本步

### 5. 验收

```bash
pnpm type-check
pnpm lint
pnpm format:check
pnpm build
```

## 检查清单

- [ ] 组件在 `src/views/` 根目录，文件名以 `View` 结尾
- [ ] 用了懒加载 `() => import('@/views/XxxView.vue')`，**没有**顶层静态 import 页面
- [ ] `meta.title` 已设置
- [ ] 已判断是否需要 `meta.public`
- [ ] `name` 全局唯一
- [ ] 需要菜单则已同步 `MainLayout.vue`，`index` 与 `path` 一致
- [ ] 页面有加载态与空态兜底
- [ ] 四条门禁全部通过

## 常见错误

| 错误 | 后果 |
|------|------|
| 忘了 `meta.title` | 顶栏标题空白 |
| 忘了同步 `MainLayout` | 路由能访问但菜单没有入口 |
| 菜单 `index` 与 `path` 不一致 | 高亮错乱、点击跳转失败 |
| 顶层静态 import 页面组件 | 首屏包体积增大，失去懒加载 |
| 用 `meta: { public: true }` 之外的方式绕过守卫 | 权限漏洞 |

## 相关技能

- 页面要接接口 → `.agents/skills/create-api`
- 需要页面级共享状态 → `.agents/skills/create-store`
- 有设计稿 → `.agents/skills/design-analysis`，实现后 `.agents/skills/ui-verification`
