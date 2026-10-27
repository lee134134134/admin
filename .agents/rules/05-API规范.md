---
alwaysApply: false
description: 接口文件位置、请求封装用法、函数命名、类型定义、错误处理边界。新增、修改或调用后端接口时读取。
---

# API 规范

## 接口文件位置（NON-NEGOTIABLE）

- 所有 HTTP 请求函数**必须**放在 `src/api/<业务域>.ts`（如 `auth.ts` / `dashboard.ts` / `calendar.ts`）
- 一个业务域一个文件；新业务域先建 `src/api/<domain>.ts`
- **禁止**在组件 / store / utils 里直接使用 axios 或 `fetch`

## 请求封装（NON-NEGOTIABLE）

统一从 `src/api/request` 导入，按语义选用：

```ts
import { httpDelete, httpGet, httpPost, httpPut } from './request'

export function httpGet<T>(url: string, params?: object): Promise<T>
export function httpPost<T>(url: string, data?: object): Promise<T>
export function httpPut<T>(url: string, data?: object): Promise<T>
export function httpDelete<T>(url: string, params?: object): Promise<T>
```

- **必须传泛型参数**显式声明返回类型，禁止依赖推断
- 拦截器已把 `response.data` 直接返回，`await` 到的就是 `T`
- 不要自己构造 `axios.create()`、不要手工拼 `Authorization` 头（拦截器已注入）
- 不要改 `request.ts` 的拦截器行为，除非需求明确涉及

## 接口函数命名（NON-NEGOTIABLE）

| 操作 | 命名规则 | 示例 |
|------|----------|------|
| 查列表 | `getXxxList` | `getCalendarEvents` |
| 查详情 / 查单个统计 | `getXxxDetail` / `getXxx` | `getDashboardStats` |
| 新建 | `createXxx` | `createCalendarEvent` |
| 更新 | `updateXxx` | `updateCalendarEvent` |
| 删除 | `deleteXxx` | `deleteCalendarEvent` |
| 登录等动词型动作 | 直接动词 | `login` |

> **禁止 `fetch` 前缀**（如 `fetchXxxList`），禁止 `queryXxx` / `loadXxx`。
> 存量偏差：`fetchDashboardStats`、`fetchCalendarEvents` 待整改为 `getDashboardStats`、`getCalendarEvents`。

## 类型定义（NON-NEGOTIABLE）

- 接口出入参用 `interface` / `type`，**导出**并就近放在同一 `src/api/<domain>.ts` 内
- 命名：请求体 `XxxInput`（如 `CalendarEventInput`）、响应 `XxxResponse` 或直接用实体
- 后端蛇形字段**保持原样**（`all_day` / `created_at`），**禁止**擅自转换命名风格
- 可选字段用 `?`，不要用 `| undefined` 堆砌

```ts
export interface CalendarEvent {
  id: string
  title: string
  start: string
  end: string
  description?: string
  all_day?: boolean
}
```

## 错误处理（NON-NEGOTIABLE）

- **错误由 `request.ts` 拦截器统一处理**：401 清 token 跳 `/login`，其余 `ElMessage.error(message ?? '请求失败，请稍后重试')`
- 业务代码**只处理成功逻辑**
- **禁止**在业务代码里再包一层 `try/catch` 弹错误提示，或重复 `ElMessage.error`
- 唯一允许 `catch` 的场景：需要**降级而非提示**（如拉取失败仍展示占位数据），此时不弹 toast

```ts
// ✅ 正确: 只写成功逻辑
const data = await getCalendarEvents(start, end)
events.value = data.items

// ❌ 错误: 重复提示
try {
  events.value = (await getCalendarEvents(start, end)).items
} catch {
  ElMessage.error('加载失败')   // 拦截器已经弹过了
}
```

## Mock 与占位

- 后端未就绪时保留占位接口（如 `getDashboardStats` 标注注释说明），**不要**伪造数据结构
- 接口就绪后必须对齐真实字段并删掉占位注释
