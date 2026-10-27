# AI Admin

AI 服务管理后台(外包项目)。基于 Vue 3 + TypeScript + Vite 的 SPA 管理端，面向 AI 服务的运营、监控与配置管理。

## 技术栈

| 类别 | 选型 |
| --- | --- |
| 框架 | Vue 3.5 (Composition API + `<script setup>`) |
| 构建 | Vite 7 |
| 语言 | TypeScript 5.8 (strict) |
| UI | Element Plus 2.x(全量引入, 国际化 zh-CN) + @element-plus/icons-vue |
| 状态 | Pinia 3(setup store 风格) |
| 路由 | Vue Router 4(history 模式) |
| HTTP | Axios(统一实例封装) |
| 包管理 | pnpm 11 |

## 常用命令

```bash
pnpm dev            # 开发服务器 (http://localhost:5173, /api 代理到 :8000)
pnpm build          # 类型检查 + 生产构建
pnpm preview        # 预览生产构建
pnpm type-check     # 仅执行 vue-tsc 类型检查
```

## 目录结构

```
src/
├── api/            # 接口层: request.ts(axios 封装) + 按业务域划分的模块
├── assets/         # 全局样式
├── layouts/        # 页面布局(MainLayout: 侧边栏 + 顶栏 + 内容区)
├── router/         # 路由与导航守卫(登录校验)
├── stores/         # Pinia stores(如 user.ts: token/登录态)
├── utils/          # 通用工具函数
├── views/          # 页面组件, 按路由划分, 组件级私有子组件放同目录 components/
├── App.vue
└── main.ts         # 入口: 注册 Element Plus / Pinia / Router / 图标
```

## 开发规范

- **类型**: 严格模式(strict)。禁止 `any` / `@ts-ignore` 压制类型错误。API 返回类型须显式声明。
- **别名**: 一律使用 `@/` 指向 `src/`, 不使用相对深路径。
- **API 层**: 新接口在 `src/api/` 下按业务域建模块, 用 `httpGet/httpPost/httpPut/httpDelete` 泛型封装, 响应体通过类型参数约定, 不直接散落 `axios` 调用到组件中。
- **组件**: 使用 `<script setup lang="ts">`。页面级组件放 `views/`, 可复用业务组件放 `views/<页面>/components/` 或后续抽离 `components/`。
- **状态**: 跨组件共享状态用 Pinia; 组件内局部状态用 ref/reactive, 不要滥用全局 store。
- **路由**: 未标记 `meta.public` 的路由会被全局守卫要求登录。新页面请在 `router/index.ts` 注册并设置 `meta.title`。
- **样式**: 组件样式 scoped; 全局 reset 在 `assets/main.css`。
- **环境变量**: `.env.development` 中 `VITE_API_BASE_URL` 控制请求 base, 留空则走 Vite 代理 `/api`。

## 后端接口约定

- 默认 base: `/api`(开发环境经 Vite proxy 转发到 `http://localhost:8000`, 见 `vite.config.ts`)。
- 鉴权: `Authorization: Bearer <token>`, token 存于 localStorage(key: `token`)。
- 401 响应: 统一清 token 并跳转登录页; 其余错误由拦截器弹 ElMessage。

## 当前示例页面

- `/login` 登录页（对接 `POST /api/auth/login`，默认账号 admin/admin123）
- `/dashboard` 工作台（`GET /api/dashboard/stats` 真实统计数据）
- `/calendar` 日程日历（Schedule-X 日历组件，对接 `/api/calendar/events` CRUD）

## 后端服务

- 后端位于 `ai-agent/apps/backend`（Go + Gin + GORM + SQLite），开发启动：`PORT=8000 go run cmd/server/main.go`（模块下载需 `GOPROXY=https://goproxy.cn,direct`）。
- 提供 `/health`、`/api/auth/login`、`/api/dashboard/stats`、`/api/calendar/events`（CRUD）、`/api/v1/workflows`（工作流 CRUD，公开）。

## 后续建议(按优先级)

1. **接口对接**: 将 LoginView 的 mock 登录替换为真实 `POST /api/auth/login`。
2. **按需引入 Element Plus**: 当前全量引入, 首屏 JS 较大(377 kB gzip); 可切 unplugin-vue-components + unplugin-auto-import 按需加载。
3. **ESLint**: 引入 eslint + eslint-plugin-vue + typescript-eslint 统一代码风格。
4. **手动分包**: `build.rollupOptions.output.manualChunks` 拆分 element-plus / vue 核心, 或直接按需引入解决(chunk > 500kB 警告)。
5. **测试**: 补 Vitest 单元测试基础。