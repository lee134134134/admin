import axios, { AxiosError } from 'axios'
import { ElMessage } from 'element-plus'

/**
 * 统一的 axios 实例:
 * - baseURL 来自 VITE_API_BASE_URL, 未配置时使用 vite proxy 的 /api
 * - 请求头自动携带 Authorization
 * - 响应拦截器直接返回 data, 统一处理 401 与错误提示
 */
const request = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? '/api',
  timeout: 15000,
})

request.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

request.interceptors.response.use(
  (response) => response.data,
  (error: AxiosError<{ message?: string }>) => {
    const status = error.response?.status
    if (status === 401) {
      localStorage.removeItem('token')
      window.location.href = '/login'
    } else {
      ElMessage.error(error.response?.data?.message ?? '请求失败，请稍后重试')
    }
    return Promise.reject(error)
  },
)

/** GET 请求(返回类型安全的 Promise<T>) */
export function httpGet<T>(url: string, params?: object): Promise<T> {
  return request.get(url, { params }) as Promise<T>
}

/** POST 请求(返回类型安全的 Promise<T>) */
export function httpPost<T>(url: string, data?: object): Promise<T> {
  return request.post(url, data) as Promise<T>
}

/** PUT 请求 */
export function httpPut<T>(url: string, data?: object): Promise<T> {
  return request.put(url, data) as Promise<T>
}

/** DELETE 请求 */
export function httpDelete<T>(url: string, params?: object): Promise<T> {
  return request.delete(url, { params }) as Promise<T>
}

export default request