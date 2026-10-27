<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  createCalendar,
  createViewDay,
  createViewList,
  createViewMonthAgenda,
  createViewMonthGrid,
  createViewWeek,
  toJSDate,
} from '@schedule-x/calendar'
import { createEventsServicePlugin } from '@schedule-x/events-service'
import '@schedule-x/theme-default/dist/index.css'
import 'temporal-polyfill/global'
import { Temporal } from 'temporal-polyfill'
import {
  createCalendarEvent,
  deleteCalendarEvent,
  fetchCalendarEvents,
  updateCalendarEvent,
} from '@/api/calendar'
import {
  LOCAL_TIME_ZONE,
  isTimedEvent,
  toScheduleXEvent,
  toZonedDateTime,
} from '@/utils/calendar'

const containerRef = ref<HTMLElement>()
const eventsService = createEventsServicePlugin()
let calendarApp: ReturnType<typeof createCalendar> | null = null
let currentRange: { start: string; end: string } | null = null

/** 日历分类（对应后端 calendar_id 与日历颜色配置） */
const CALENDAR_IDS = ['default', 'work', 'personal'] as const
const CALENDAR_LABELS: Record<string, string> = {
  default: '默认',
  work: '工作',
  personal: '个人',
}

/* ---------- 事件加载 ---------- */

async function loadEvents(start: string, end: string) {
  currentRange = { start, end }
  const data = await fetchCalendarEvents(start, end)
  return data.items.map(toScheduleXEvent)
}

/** 增删改后刷新当前视图范围 */
async function refreshEvents() {
  if (!calendarApp || !currentRange) return
  try {
    const data = await fetchCalendarEvents(currentRange.start, currentRange.end)
    eventsService.set(data.items.map(toScheduleXEvent))
  } catch {
    // 错误由响应拦截器统一提示
  }
}

/* ---------- 新建 / 编辑对话框 ---------- */

const dialogVisible = ref(false)
const editingId = ref<string | null>(null)
const form = ref({
  title: '',
  calendarId: 'default',
  allDay: false,
  dateRange: [] as string[],
  dateTimeRange: [] as Date[],
  location: '',
  description: '',
})

function resetForm() {
  form.value = {
    title: '',
    calendarId: 'default',
    allDay: false,
    dateRange: [],
    dateTimeRange: [],
    location: '',
    description: '',
  }
}

/** 新建：可预填点击的日期 / 时间 */
function openCreate(source?: Temporal.PlainDate | Temporal.ZonedDateTime) {
  editingId.value = null
  resetForm()
  if (source) {
    if (isTimedEvent(source)) {
      form.value.dateTimeRange = [toJSDate(source), toJSDate(source)]
    } else {
      form.value.allDay = true
      form.value.dateRange = [source.toString(), source.toString()]
    }
  }
  dialogVisible.value = true
}

/** 编辑：打开点击的日程 */
function openEdit(event: {
  id: string | number
  title?: string
  start: Temporal.ZonedDateTime | Temporal.PlainDate
  end: Temporal.ZonedDateTime | Temporal.PlainDate
  description?: string
  location?: string
  calendarId?: string
}) {
  editingId.value = String(event.id)
  const timed = isTimedEvent(event.start)
  form.value = {
    title: event.title ?? '',
    calendarId: event.calendarId ?? 'default',
    allDay: !timed,
    dateRange: timed ? [] : [event.start.toString(), event.end.toString()],
    dateTimeRange: timed
      ? [toJSDate(event.start), toJSDate(event.end)]
      : [],
    location: event.location ?? '',
    description: event.description ?? '',
  }
  dialogVisible.value = true
}

/** 校验并组装请求体 */
function buildPayload() {
  if (form.value.allDay) {
    if (form.value.dateRange.length !== 2) {
      ElMessage.warning('请选择日期范围')
      return null
    }
    const [start, end] = form.value.dateRange
    return {
      title: form.value.title.trim(),
      start,
      end,
      description: form.value.description,
      location: form.value.location,
      all_day: true,
      calendar_id: form.value.calendarId,
    }
  }
  if (form.value.dateTimeRange.length !== 2) {
    ElMessage.warning('请选择时间范围')
    return null
  }
  return {
    title: form.value.title.trim(),
    start: toZonedDateTime(form.value.dateTimeRange[0]).toString(),
    end: toZonedDateTime(form.value.dateTimeRange[1]).toString(),
    description: form.value.description,
    location: form.value.location,
    all_day: false,
    calendar_id: form.value.calendarId,
  }
}

async function handleSave() {
  if (!form.value.title.trim()) {
    ElMessage.warning('请输入日程标题')
    return
  }
  const payload = buildPayload()
  if (!payload) return
  try {
    if (editingId.value) {
      await updateCalendarEvent(editingId.value, payload)
      ElMessage.success('日程已更新')
    } else {
      await createCalendarEvent(payload)
      ElMessage.success('日程已创建')
    }
    dialogVisible.value = false
    await refreshEvents()
  } catch {
    // 错误由响应拦截器统一提示
  }
}

async function handleDelete() {
  if (!editingId.value) return
  try {
    await ElMessageBox.confirm('确定删除该日程吗？', '提示', { type: 'warning' })
  } catch {
    return // 用户取消
  }
  try {
    await deleteCalendarEvent(editingId.value)
    ElMessage.success('日程已删除')
    dialogVisible.value = false
    await refreshEvents()
  } catch {
    // 错误由响应拦截器统一提示
  }
}

/* ---------- 日历初始化 ---------- */

onMounted(() => {
  if (!containerRef.value) return
  calendarApp = createCalendar(
    {
      locale: 'zh-CN',
      timezone: LOCAL_TIME_ZONE,
      firstDayOfWeek: 1,
      views: [
        createViewMonthGrid(),
        createViewWeek(),
        createViewDay(),
        createViewMonthAgenda(),
        createViewList(),
      ],
      calendars: {
        default: {
          colorName: 'default',
          lightColors: { main: '#409eff', container: '#ecf5ff', onContainer: '#337ecc' },
        },
        work: {
          colorName: 'work',
          lightColors: { main: '#f91c45', container: '#ffd2dc', onContainer: '#59000d' },
        },
        personal: {
          colorName: 'personal',
          lightColors: { main: '#1cf9b0', container: '#dafff0', onContainer: '#004d3d' },
        },
      },
      callbacks: {
        async fetchEvents(range) {
          return loadEvents(String(range.start), String(range.end))
        },
        onRangeUpdate(range) {
          currentRange = { start: String(range.start), end: String(range.end) }
        },
        onEventClick(event) {
          openEdit(event)
        },
        onClickDate(date) {
          openCreate(date)
        },
        onClickDateTime(dateTime) {
          openCreate(dateTime)
        },
      },
    },
    [eventsService],
  )
  calendarApp.render(containerRef.value)
})

onUnmounted(() => {
  calendarApp?.destroy()
  calendarApp = null
})
</script>

<template>
  <div class="calendar-page">
    <el-card shadow="never" class="calendar-card">
      <template #header>
        <div class="calendar-header">
          <span class="calendar-header__title">日程日历</span>
          <el-button type="primary" @click="openCreate()">新建日程</el-button>
        </div>
      </template>
      <div ref="containerRef" class="calendar-container" />
    </el-card>

    <el-dialog
      v-model="dialogVisible"
      :title="editingId ? '编辑日程' : '新建日程'"
      width="520px"
      destroy-on-close
    >
      <el-form label-width="88px">
        <el-form-item label="标题">
          <el-input
            v-model="form.title"
            placeholder="请输入日程标题"
            maxlength="100"
            show-word-limit
          />
        </el-form-item>
        <el-form-item label="分类">
          <el-select v-model="form.calendarId" class="w-full">
            <el-option
              v-for="id in CALENDAR_IDS"
              :key="id"
              :label="CALENDAR_LABELS[id]"
              :value="id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="全天">
          <el-switch v-model="form.allDay" />
        </el-form-item>
        <el-form-item :label="form.allDay ? '日期' : '时间'">
          <el-date-picker
            v-if="form.allDay"
            v-model="form.dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
            class="w-full"
          />
          <el-date-picker
            v-else
            v-model="form.dateTimeRange"
            type="datetimerange"
            range-separator="至"
            start-placeholder="开始时间"
            end-placeholder="结束时间"
            class="w-full"
          />
        </el-form-item>
        <el-form-item label="地点">
          <el-input v-model="form.location" placeholder="请输入地点" maxlength="200" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input
            v-model="form.description"
            type="textarea"
            :rows="3"
            placeholder="请输入描述"
            maxlength="1000"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button v-if="editingId" type="danger" plain @click="handleDelete">删除</el-button>
        <el-button type="primary" @click="handleSave">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.calendar-page {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.calendar-card {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.calendar-card :deep(.el-card__body) {
  flex: 1;
  overflow: hidden;
  padding: 12px;
}

.calendar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.calendar-header__title {
  font-size: 16px;
  font-weight: 500;
}

.calendar-container {
  width: 100%;
  height: 100%;
  min-height: 560px;
}

.w-full {
  width: 100%;
}
</style>
