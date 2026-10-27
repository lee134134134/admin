import { httpDelete, httpGet, httpPost, httpPut } from './request'

/** 日历事件（后端存储格式，start/end 为 Temporal toString 格式字符串） */
export interface CalendarEvent {
  id: string
  title: string
  start: string
  end: string
  description?: string
  location?: string
  all_day?: boolean
  calendar_id?: string
  created_at?: string
  updated_at?: string
}

export interface CalendarEventsResponse {
  items: CalendarEvent[]
}

/** 创建/更新日程的请求体 */
export interface CalendarEventInput {
  title: string
  start: string
  end: string
  description?: string
  location?: string
  all_day?: boolean
  calendar_id?: string
}

/** 查询日程列表（from/to 为日期或日期时间字符串，可选） */
export function fetchCalendarEvents(from: string, to: string) {
  return httpGet<CalendarEventsResponse>('/calendar/events', { from, to })
}

/** 创建日程 */
export function createCalendarEvent(data: CalendarEventInput) {
  return httpPost<CalendarEvent>('/calendar/events', data)
}

/** 更新日程（部分字段） */
export function updateCalendarEvent(id: string, data: Partial<CalendarEventInput>) {
  return httpPut<CalendarEvent>(`/calendar/events/${id}`, data)
}

/** 删除日程 */
export function deleteCalendarEvent(id: string) {
  return httpDelete<{ message: string }>(`/calendar/events/${id}`)
}
