---
name: element-plus-theme
description: 正确使用 Element Plus 主题 CSS 变量与既有设计 token，避免硬编码颜色、避免依赖组件内部类名。编写或修改样式、需要换色/调整主题时使用。
---

# Element Plus 主题与样式变量

## 使用时机

需要设置颜色、圆角、间距，或要调整 Element Plus 组件外观、做主题定制时。

## 目标产出

- 样式中的颜色/尺寸来自 CSS 变量或已登记的既有 token
- 不依赖 Element Plus 内部类名
- 无新增硬编码色值（或已在规范中登记）

## 前置

先读 `.agents/rules/09-样式规范.md`（含既有设计 token 清单与 BEM 约定）。

## 核心原则

1. **本项目全量引入 Element Plus**（`main.ts` 注册 + `import 'element-plus/dist/index.css'`），主题定制**只走 CSS 变量覆盖**
2. **禁止**引入第二套主题包、禁止改 `node_modules`、禁止用 `!important` 覆盖
3. **禁止硬编码任意色值**——先查变量，再查既有 token，都没有才登记新值
4. **禁止**把 Element Plus 内部类名（`.el-button--primary`、`.el-table__row`）当业务选择器

## 步骤 1：查颜色该用什么（按优先级）

### 优先级 1 — Element Plus 语义变量

| 需求 | 变量 |
|------|------|
| 主色/品牌色 | `var(--el-color-primary)` |
| 主文本 / 次要 / 弱化 / 占位 | `var(--el-text-color-primary)` / `-regular` / `-secondary` / `-placeholder` |
| 页面/浮层背景 | `var(--el-bg-color)` / `var(--el-bg-color-overlay)` |
| 边框 | `var(--el-border-color)` / `-light` / `-lighter` |
| 填充（hover 底色） | `var(--el-fill-color)` / `-light` / `-lighter` |
| 成功/警告/危险/信息 | `var(--el-color-success)` / `-warning` / `-danger` / `-info` |
| 圆角 | `var(--el-border-radius-base)` / `var(--el-border-radius-small)` |

```css
.my-card {
  background-color: var(--el-bg-color-overlay);
  border: 1px solid var(--el-border-color-light);
  border-radius: var(--el-border-radius-base);
  color: var(--el-text-color-regular);
}
```

> 需要完整清单时用 **Context7 MCP** 查 Element Plus 当前版本的「CSS 变量」文档，避免用到已废弃变量。

### 优先级 2 — 本项目既有设计 token（允许直接写死，不要"纠正"）

来自设计稿，**已在规范中登记**：

| token | 值 | 归属 |
|-------|-----|------|
| 侧边栏底色 | `#001529` | `MainLayout` 深色侧边栏 / `el-menu background-color` |
| 内容区底色 | `#f5f7fa` | `main-layout__main` |
| 顶栏分隔线 | `#e4e7ed` | 顶栏 `border-bottom` |
| 顶栏主文本 | `#303133` | 用户区文字 |
| 侧边栏文本 | `rgba(255, 255, 255, 0.65)` | `el-menu text-color` |
| 侧边栏激活文字 | `#ffffff` | `el-menu active-text-color` |

```html
<!-- 既有写法, 保留 -->
<el-menu background-color="#001529" text-color="rgba(255, 255, 255, 0.65)" active-text-color="#ffffff">
```

### 优先级 3 — 新色值

需要新颜色时：**先在 `.agents/rules/09-样式规范.md` 登记，再使用**，并说明来源（设计稿 / 品牌规范）。

## 步骤 2：需要全局改主题时

集中在 `src/assets/main.css`（**唯一全局样式入口**），不要散落到组件：

```css
/* 主题定制 - 集中维护 */
:root {
  --el-color-primary: #1677ff;
  --el-border-radius-base: 4px;
}
```

- 改动会影响**全站**，需与用户确认色值
- Element Plus 主色改深/改浅时，其 `-light-3/5/7/9` 与 `-dark-2` 派生色需一并调整（官方提供 `@apply-colors` 思路；本项目未引入预处理器，必要时手动覆盖派生色）

## 步骤 3：需要改某个组件外观时

**用业务类包裹 + 变量**，不要直接命中内部类名：

```html
<!-- ✅ 正确: 业务类做锚点 -->
<div class="page-toolbar">
  <el-button type="primary">查询</el-button>
</div>
```

```css
.page-toolbar {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
}
```

```css
/* ❌ 错误: 依赖内部类名, 升级即碎 */
.el-table th.el-table__cell { background: #fafafa; }
```

确需覆盖 Element Plus 组件内部样式时：
1. 用深度选择器 `:deep(.el-xxx)`，且**限定在业务容器内**
2. 写注释说明原因
3. 若是通用诉求，考虑改用主题变量而非深度选择器

## 步骤 4：尺寸与间距

- 间距用 4/8 倍数：`4px / 8px / 12px / 16px / 24px`，**禁止** `13px` `17px`
- 组件尺寸优先 Element Plus 的 `size` 属性（`small` / `default` / `large`）而非自定义高宽
- 固定高度（如 header 60px）需注释理由

## 检查清单

- [ ] 颜色来自 `var(--el-*)` 或已登记的既有 token
- [ ] 新色值已在 `09-样式规范.md` 登记
- [ ] 全局主题改动放在 `assets/main.css`，非组件内
- [ ] 未把 `.el-*` 内部类名当业务选择器
- [ ] 用 `:deep()` 时已限定范围并加注释
- [ ] 间距为 4/8 倍数
- [ ] 样式在 `<style scoped>` 内

## 常见错误

| 错误 | 后果 |
|------|------|
| 硬编码新主色 | 与全站主题不一致，后续换肤困难 |
| `:deep(.el-button--primary)` 写死颜色 | 升级 Element Plus 即失效 |
| 在组件里改 `:root` 变量 | 影响范围不可预期 |
| 用 `!important` 压制 | 特异性战争，后续无法覆盖 |
| 把 `#001529` 改成 `var(--el-color-primary)` | **破坏设计**——它是既定 token，不是错误 |

## 相关技能

- 建组件 → `.agents/skills/create-component`
- 还原度验收 → `.agents/skills/ui-verification`
