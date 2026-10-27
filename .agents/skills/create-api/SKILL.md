---
name: create-api
description: 按团队规范新增后端接口调用，含业务域归属、类型定义、httpGet/httpPost 封装、命名与错误处理边界。新增或修改接口时使用。
---

# 新增与维护 API

## 使用时机

需要调用新的后端接口、修改现有接口的出入参、或新建业务域的接口模块时。

## 目标产出

- `src/api/<业务域>.ts` 中的请求函数 + 导出的出入参类型
- 调用方只写成功逻辑，不处理错误
- `pnpm type-check` 通过

## 前置

先读 `.agents/rules/05-API规范.md`（NON-NEGOTIABLE 命名与错误处理）。
**必读** `src/api/request.ts`（封装签名）与一个现有范例（`src/api/calendar.ts` 覆盖 CRUD 全场景）。

## 工作流程（5 步）

### 1. 定位业务域

| 场景 | 文件 |
|------|------|
| 已有业务域 | 追加到 `src/api/<domain>.ts`（`auth` / `dashboard` / `calendar`） |
| 新业务域 | 新建 `src/api/<domain>.ts`，文件名 camelCase 单数或领域名 |

**禁止**：在组件/Store/utils 里直接用 axios 或 `fetch`；新建 `src/http/`、`src/services/`。

### 2. 定义类型

接口放在**同一文件内**（就近原则，不建 `src/types/`）：

```ts
export interface LogItem {
  id: string
  level: 'info' | 'warn' | 'error'
  message: string
  created_at: string        // 后端蛇形字段保持原样, 不要转驼峰
}

export interface LogListResponse {
  items: LogItem[]
  total: number
}

/** 创建日志的请求体 */
export interface LogItemInput {
  level: string
  message: string
}
```

- 请求体后缀 `Input`，响应可用 `XxxResponse` 或直接用实体
- 后端返回的 snake_case 字段（`all_day` / `created_at`）**保持原样**，不要擅自转换
- 可选字段用 `?`

### 3. 写请求函数

从 `./request` 导入封装（**同目录用 `./`，不写 `@/`**）：

```ts
import { httpDelete, httpGet, httpPost, httpPut } from './request'

/** 查询日志列表 */
export function getLogList(params: { page: number; size: number }) {
  return httpGet<LogListResponse>('/logs', params)
}

/** 创建日志 */
export function createLog(data: LogItemInput) {
  return httpPost<LogItem>('/logs', data)
}

/** 更新日志（部分字段） */
export function updateLog(id: string, data: Partial<LogItemInput>) {
  return httpPut<LogItem>(`/logs/${id}`, data)
}

/** 删除日志 */
export function deleteLog(id: string) {
  return httpDelete<{ message: string }>(`/logs/${id}`)
}
```

**必须**给 `httpGet<T>` 等传泛型显式声明返回类型（拦截器已返回 `response.data`，`await` 即得 `T`）。

### 4. 命名（NON-NEGOTIABLE）

| 操作 | 规则 | 示例 |
|------|------|------|
| 列表 | `getXxxList` | `getLogList` |
| 详情/统计 | `getXxxDetail` / `getXxx` | `getDashboardStats` |
| 新建 | `createXxx` | `createLog` |
| 更新 | `updateXxx` | `updateLog` |
| 删除 | `deleteXxx` | `deleteLog` |
| 动词型动作 | 直接动词 | `login` |

> **禁止 `fetch` 前缀**、`query`、`load`、`request` 前缀。

### 5. 调用方只写成功逻辑（NON-NEGOTIABLE）

```ts
// ✅ 正确
loading.value = true
try {
  const data = await getLogList({ page, size })
  list.value = data.items
} finally {
  loading.value = false     // 只管理 loading, 不弹错误提示
}
```

```ts
// ❌ 错误: 拦截器已统一弹 ElMessage, 这里重复提示
catch (err) {
  ElMessage.error('加载失败')
}
```

- 错误提示、401 跳转全部由 `request.ts` 拦截器负责
- 唯一允许 `catch` 的场景：需要**降级而非提示**（失败仍展示占位数据），此时不弹 toast

## 检查清单

- [ ] 函数在 `src/api/<业务域>.ts`，未散落在组件里
- [ ] 泛型显式声明了返回类型
- [ ] 命名符合 `getXxxList / createXxx / updateXxx / deleteXxx`，**无 `fetch` 前缀**
- [ ] 类型已 `export` 并在同文件内定义
- [ ] 后端 snake_case 字段未被擅自转换
- [ ] 调用方未重复弹错误提示
- [ ] `pnpm type-check` 通过

## 常见错误

| 错误 | 后果 |
|------|------|
| 用 `fetchXxx` 命名 | 违反 NON-NEGOTIABLE 命名规范 |
| 不写泛型靠推断 | 类型漂移，`any` 污染 |
| 在组件里 `axios.get(...)` | 绕过拦截器：丢 token、丢 401 处理、丢统一错误提示 |
| 手工拼 `Authorization` | 与拦截器重复，登录态易不一致 |
| `catch` 里再弹 `ElMessage` | 用户看到两次错误提示 |
| 建 `src/types/` 放接口类型 | 违反就近原则，类型与实现分离 |

## 相关技能

- 接口要进页面 → `.agents/skills/create-route`
- 数据需跨组件共享 → `.agents/skills/create-store`
