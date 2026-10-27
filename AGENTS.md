# AI Admin — AI 服务管理后台（外包项目）

基于 Vue 3 + TypeScript + Vite 的 SPA 管理端，面向 AI 服务的运营、监控与配置管理。
所属工作区：`/Users/lee/Documents/code/waibao/ai/`（兄弟项目：ai-agent、ragAdmin、ros2、yijing）。

## 1. 常用命令

| 命令 | 说明 | 何时运行 |
|------|------|----------|
| `pnpm dev` | 开发服务器（http://localhost:5173，`/api` 代理到 `http://localhost:8000`） | 日常开发 |
| `pnpm build` | `vue-tsc -b` 类型检查 + `vite build` 生产构建 | 发布前 |
| `pnpm preview` | 预览生产构建 | 构建后验证 |
| `pnpm type-check` | 仅执行 `vue-tsc --noEmit` | **每次改动必跑** |

**改动完成的最小门禁**：`pnpm type-check` 通过（项目暂无 ESLint / 单测，见 §7）。

## 2. 技术栈

| 类别 | 选型 |
| --- | --- |
| 框架 | Vue 3.5（Composition API + `<script setup lang="ts">`） |
| 构建 | Vite 7 |
| 语言 | TypeScript 5.8（strict，含 noUnusedLocals / noUnusedParameters） |
| UI | Element Plus 2.x（全量引入，国际化 zh-CN）+ @element-plus/icons-vue |
| 状态 | Pinia 3（setup store 风格） |
| 路由 | Vue Router 4（history 模式） |
| HTTP | Axios（`src/api/request.ts` 统一实例封装） |
| 包管理 | pnpm（锁文件 `pnpm-lock.yaml`；构建白名单见 `pnpm-workspace.yaml`） |

## 3. 目录结构

```
src/
├── api/            # 接口层: request.ts(axios 封装) + 按业务域划分的模块(如 dashboard.ts)
├── assets/         # 全局样式(main.css: reset + 全局字体/底色)
├── layouts/        # 页面布局(MainLayout: 深色侧边栏 #001529 + 顶栏 + 内容区)
├── router/         # 路由与导航守卫(登录校验)
├── stores/         # Pinia stores(user.ts: token/登录态)
├── utils/          # 通用工具函数(formatDateTime)
├── views/          # 页面组件, 按路由划分, 组件级私有子组件放同目录 components/
├── App.vue
├── main.ts         # 入口: 全量注册 Element Plus 图标 / Pinia / Router / zh-CN
└── vite-env.d.ts
```

## 4. 开发规范

- **类型**：严格模式。禁止 `any` / `@ts-ignore` 压制类型错误；API 返回类型须显式声明。
- **别名**：一律使用 `@/` 指向 `src/`，不使用深层相对路径。
- **API 层**：新接口在 `src/api/` 下按业务域建模块，用 `httpGet / httpPost / httpPut / httpDelete` 泛型封装，响应体通过类型参数约定；禁止在组件中直接调用 axios。
- **组件**：使用 `<script setup lang="ts">`。页面级组件放 `views/`，可复用业务组件放 `views/<页面>/components/`。
- **状态**：跨组件共享状态用 Pinia；组件内局部状态用 ref/reactive，不要滥用全局 store。
- **路由**：未标记 `meta.public` 的路由会被全局守卫要求登录（无 token 跳 `/login?redirect=...`）；新页面在 `router/index.ts` 注册并设置 `meta.title`（顶栏标题取自 `route.meta.title`）。
- **样式**：组件样式 scoped（BEM 命名，如 `main-layout__aside`）；全局 reset 在 `assets/main.css`。
- **环境变量**：`.env.development` 中 `VITE_API_BASE_URL` 控制请求 base，留空则走 Vite 代理 `/api`。

## 5. 后端接口约定

- 默认 base：`/api`（开发环境经 Vite proxy 转发到 `http://localhost:8000`，见 `vite.config.ts`）。
- 鉴权：`Authorization: Bearer <token>`，token 存于 localStorage（key: `token`）。
- 401 响应：拦截器统一清 token 并跳转 `/login`；其余错误弹 `ElMessage`（取响应体 `message`，缺省"请求失败，请稍后重试"）。
- 超时：15s。

## 6. Agent 工作流框架（references 子模块）

`references/` 是 git submodule（`http://10.9.12.33:31001/aice/references.git`，dev 分支），承载本项目「需求 → 设计 → 设计评审 → 归档 → 编码 → 代码评审 → 测试 → SIT 集成 → 生产部署」全流程的 Agent 驱动开发框架。

- **路由提示词**：`references/prompts/subagent-{reqs,design,coder,review}-router.md`（按关键词路由到对应工作流）
- **工作流**：`references/workflows/`（requirements / design / review / archive / coding / testing / sit-workflow / git / deploy / prototypes / pipeline / worktree）
- **Subagent 定义**：`references/agents/`（todo-spec-reader、workspace-manager、frontend code-reviewers / design-reviewers / testing）
- **规范文档**：`references/spec/frontend/`（dev-guide + 编码/组件/API/路由/状态/样式/测试等 11 项细则）
- **模板**：`references/templates/`（frontend / design / report / requirements / testing）

> ⚠️ `references/spec/frontend/dev-guide.md` 中的 API 辅助函数（noload_post 等）属于框架通用示例，本项目实际使用 `httpGet/httpPost/httpPut/httpDelete`（§4）。以本文档与 `CLAUDE.md` 为准。

### 指令速查（关键词 → 工作流）

**代码生成指令**

| 指令关键词 | 工作流 |
|---|---|
| 生成前端vue版代码{详设路径} | `references/workflows/coding/Frontend-Vue-Code-Generate-Coordinator.md`（types → api → store → composables → 组件 → 页面组装，含设计图一致性校验） |

**集成指令**

| 指令关键词 | 工作流 |
|---|---|
| 做SIT系统集成 | `references/workflows/sit-workflow/coordinator.md`（环境检查 → 拉代码 → 后端/前端并行集成 → 测试 → 报告） |
| 重新部署前端服务 | `references/workflows/sit-workflow/subagents/frontend-integration.md` |

**测试指令**

| 指令关键词 | 工作流 |
|---|---|
| 执行全量测试{feature_id} | `references/workflows/testing/Execute-Full-Test-Workflow.md`（功能+前端+后端+覆盖率+性能+设计，聚合报告） |
| 执行测试自动化流水线{feature_id} | `references/workflows/testing/Test-Auto-Pipeline-Workflow.md`（测试→定位→修复→回归闭环） |
| 生成测试用例 | `references/workflows/testing/Generate-Functional-Test-Cases-Workflow.md` |

**Git 操作指令**

| 指令关键词 | 工作流 |
|---|---|
| 提交git dev分支 | `references/workflows/git/commit-dev-branch.md`（仅提交当前会话变更，保留其他会话工作区；**要求当前分支为 dev**） |

> ⚠️ 本仓库当前分支为 `main`（remote: `github.com/lee134134134/admin.git`），`commit-dev-branch` 工作流要求 `dev` 分支，执行前需先与用户确认分支策略。

### 代码评审

前端代码评审走 `references/workflows/review/Frontend-Code-Review-Workflow.md`，并行维度见 `references/agents/frontend/code-reviewers/`（Vue 规范 / TypeScript / API 使用 / UI 规范 / 代码质量 / 性能）与 `references/agents/frontend/design-reviewers/`（页面结构 / 组件设计 / API 接入 / 状态管理 / UI 规范）。

### Subagent 安装

将 `references/agents/*.md` 复制到工作空间根目录 `.opencode/agents/` 后重启 OpenCode 加载（详见 `references/agents/AGENTS.md`）。

## 7. 当前状态与待办

- 登录已对接真实接口 `POST /api/auth/login`（默认账号 `admin` / `admin123`，可用环境变量 `ADMIN_USERNAME` / `ADMIN_PASSWORD` 覆盖；token 为内存存储，重启后端后失效）。
- `/dashboard` 工作台对接 `GET /api/dashboard/stats`（含数据库工作流真实计数）。
- `/calendar` 日程日历使用 Schedule-X（`@schedule-x/calendar` 4.x + `temporal-polyfill`），对接 `/api/calendar/events` CRUD；点击日期/时间新建、点击事件编辑/删除，分类颜色见 `CalendarView.vue` 的 `calendars` 配置。拖拽调整时间为 Schedule-X 付费插件，未集成。
- Element Plus 全量引入，首屏 JS 较大；后续可切 unplugin-vue-components + unplugin-auto-import 按需加载。
- 尚未引入 ESLint / Vitest；执行依赖静态检查的测试工作流前需先补齐基础设施。
- 后端为 Go + Gin + GORM + SQLite（见 `ai-agent/apps/backend`），Go 模块下载需 `GOPROXY=https://goproxy.cn,direct`（官方代理超时）。

## 8. 速查表

| 想做什么 | 看哪里 |
|----------|--------|
| 改登录逻辑 / token | `src/views/LoginView.vue` + `src/stores/user.ts` + `src/api/auth.ts` |
| 改日程日历 | `src/views/CalendarView.vue` + `src/utils/calendar.ts` + `src/api/calendar.ts`（后端 `ai-agent/apps/backend/internal/handler/calendar.go`） |
| 加新接口 | `src/api/` 新建业务域模块，复用 `request.ts` 的 `http*` 封装 |
| 加新页面 | `src/views/` + `src/router/index.ts` 注册（注意 `meta.title` 与 `meta.public`） |
| 改布局 / 菜单 | `src/layouts/MainLayout.vue` |
| 改全局样式 | `src/assets/main.css` |
| 改代理 / 端口 | `vite.config.ts`（`server.proxy` / `server.port`） |
| 执行 Agent 工作流 | §6 指令速查表 |

---

补充说明：本项目另有一份面向 Claude 的协作文档 `CLAUDE.md`（技术栈 / 规范 / 接口约定），内容与本文档保持一致；两者如有冲突，以实际代码为准并同步更新两份文档。
