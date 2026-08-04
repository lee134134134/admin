/** 通用工具函数 */

/** 格式化时间戳为 YYYY-MM-DD HH:mm:ss */
export function formatDateTime(
  input: string | number | Date,
  pattern = 'YYYY-MM-DD HH:mm:ss',
): string {
  const date = new Date(input)
  const pad = (n: number) => String(n).padStart(2, '0')
  return pattern
    .replace('YYYY', String(date.getFullYear()))
    .replace('MM', pad(date.getMonth() + 1))
    .replace('DD', pad(date.getDate()))
    .replace('HH', pad(date.getHours()))
    .replace('mm', pad(date.getMinutes()))
    .replace('ss', pad(date.getSeconds()))
}