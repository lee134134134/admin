import { Temporal } from 'temporal-polyfill'
import type { CalendarEvent } from '@/api/calendar'

/** 浏览器本地时区 */
export const LOCAL_TIME_ZONE = Intl.DateTimeFormat().resolvedOptions().timeZone

/** 后端日程 → Schedule-X 日历事件 */
export function toScheduleXEvent(event: CalendarEvent) {
  const isAllDay = Boolean(event.all_day)
  return {
    id: event.id,
    title: event.title,
    start: isAllDay
      ? Temporal.PlainDate.from(event.start)
      : Temporal.ZonedDateTime.from(event.start),
    end: isAllDay ? Temporal.PlainDate.from(event.end) : Temporal.ZonedDateTime.from(event.end),
    description: event.description,
    location: event.location,
    calendarId: event.calendar_id || 'default',
  }
}

/** JS Date → Temporal.ZonedDateTime（本地时区） */
export function toZonedDateTime(date: Date): Temporal.ZonedDateTime {
  return Temporal.Instant.fromEpochMilliseconds(date.getTime()).toZonedDateTimeISO(LOCAL_TIME_ZONE)
}

/** 判断是否为定时事件（ZonedDateTime 含 hour 属性，PlainDate 无） */
export function isTimedEvent(
  start: Temporal.ZonedDateTime | Temporal.PlainDate,
): start is Temporal.ZonedDateTime {
  return 'hour' in start
}
