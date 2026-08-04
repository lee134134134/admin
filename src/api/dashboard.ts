import { httpGet } from './request'

export interface DashboardStats {
  items: Array<{ label: string; value: string | number }>
}

/** 获取工作台统计数据(占位接口, 后端就绪后对齐) */
export function fetchDashboardStats() {
  return httpGet<DashboardStats>('/dashboard/stats')
}