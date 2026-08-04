<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { fetchDashboardStats } from '@/api/dashboard'
import type { DashboardStats } from '@/api/dashboard'

const stats = ref<DashboardStats | null>(null)
const loading = ref(false)
const error = ref('')

onMounted(async () => {
  loading.value = true
  try {
    stats.value = await fetchDashboardStats()
  } catch {
    // 接口未就绪时静默降级
    error.value = '后端服务尚未就绪，以下为占位数据'
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div>
    <el-alert
      v-if="error"
      :title="error"
      type="info"
      :closable="false"
      class="dashboard__alert"
    />
    <el-row :gutter="16">
      <el-col v-for="item in stats?.items ?? placeholderItems" :key="item.label" :span="6">
        <el-card v-loading="loading" shadow="hover">
          <div class="stat-item">
            <div class="stat-item__label">{{ item.label }}</div>
            <div class="stat-item__value">{{ item.value }}</div>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script lang="ts">
// 占位数据(接口就绪后移除)
const placeholderItems = [
  { label: '今日调用量', value: '-' },
  { label: '今日收入', value: '-' },
  { label: '在线服务', value: '-' },
  { label: '告警数', value: '-' },
]
</script>

<style scoped>
.dashboard__alert {
  margin-bottom: 16px;
}

.stat-item__label {
  color: #909399;
  font-size: 13px;
  margin-bottom: 8px;
}

.stat-item__value {
  font-size: 24px;
  font-weight: 600;
}
</style>