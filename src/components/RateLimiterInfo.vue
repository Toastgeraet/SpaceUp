<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()

// Reactive update interval
const updateInterval = ref<number | null>(null)
const lastUpdate = ref(new Date())

// Force reactivity update every second
const forceUpdate = () => {
  lastUpdate.value = new Date()
}

onMounted(() => {
  // Update every 100ms for smooth progress bars
  updateInterval.value = window.setInterval(forceUpdate, 100)
})

onUnmounted(() => {
  if (updateInterval.value) {
    clearInterval(updateInterval.value)
  }
})

// Computed values that update with the interval
const rateLimiter = computed(() => {
  // Access lastUpdate to force reactivity - this ensures the computed property
  // is re-evaluated every 100ms, which allows the rate limiter to clean up
  // expired timestamps and update the UI accordingly
  lastUpdate.value
  return authStore.rateLimiterStatus
})

const burstPercentage = computed(() => {
  return rateLimiter.value.burstLimit > 0 
    ? (rateLimiter.value.burstRequests / rateLimiter.value.burstLimit) * 100 
    : 0
})

const ratePercentage = computed(() => {
  return rateLimiter.value.rateLimit > 0 
    ? (rateLimiter.value.rateRequests / rateLimiter.value.rateLimit) * 100 
    : 0
})

const burstStatus = computed(() => {
  const pct = burstPercentage.value
  if (pct >= 100) return 'text-red-600 bg-red-100'
  if (pct >= 75) return 'text-orange-600 bg-orange-100'
  if (pct >= 50) return 'text-yellow-600 bg-yellow-100'
  return 'text-green-600 bg-green-100'
})

const rateStatus = computed(() => {
  const pct = ratePercentage.value
  if (pct >= 100) return 'text-red-600 bg-red-100'
  if (pct >= 75) return 'text-orange-600 bg-orange-100'
  if (pct >= 50) return 'text-yellow-600 bg-yellow-100'
  return 'text-green-600 bg-green-100'
})

const overallStatus = computed(() => {
  if (!rateLimiter.value.hasToken) return 'No Token'
  if (!rateLimiter.value.canMakeRequest) return 'Rate Limited'
  if (burstPercentage.value >= 75 || ratePercentage.value >= 75) return 'High Usage'
  if (burstPercentage.value >= 50 || ratePercentage.value >= 50) return 'Moderate Usage'
  return 'Available'
})

const overallStatusClass = computed(() => {
  if (!rateLimiter.value.hasToken) return 'text-gray-600 bg-gray-100'
  if (!rateLimiter.value.canMakeRequest) return 'text-red-600 bg-red-100'
  if (burstPercentage.value >= 75 || ratePercentage.value >= 75) return 'text-orange-600 bg-orange-100'
  if (burstPercentage.value >= 50 || ratePercentage.value >= 50) return 'text-yellow-600 bg-yellow-100'
  return 'text-green-600 bg-green-100'
})

// Check if we're in development mode
const isDev = import.meta.env.DEV
</script>

<template>
  <div class="bg-white rounded-lg shadow p-4 border">
    <div class="flex items-center justify-between mb-4">
      <h3 class="text-lg font-semibold text-gray-900">API Rate Limiter</h3>
      <div class="flex items-center space-x-2">
        <div :class="['px-2 py-1 rounded-full text-xs font-medium', overallStatusClass]">
          {{ overallStatus }}
        </div>
        <div class="w-2 h-2 rounded-full bg-green-400 animate-pulse" v-if="rateLimiter.canMakeRequest"></div>
        <div class="w-2 h-2 rounded-full bg-red-400" v-else></div>
      </div>
    </div>

    <!-- Token Status -->
    <div v-if="!rateLimiter.hasToken" class="text-center py-4 text-gray-500">
      <div class="text-sm">No authentication token available</div>
      <div class="text-xs mt-1">Rate limiting not active</div>
    </div>

    <!-- Rate Limit Details -->
    <div v-else class="space-y-4">
      <!-- Burst Limit -->
      <div>
        <div class="flex justify-between items-center mb-2">
          <div class="text-sm font-medium text-gray-700">
            Burst Limit ({{ rateLimiter.burstWindow / 1000 }}s window)
          </div>
          <div :class="['text-xs px-2 py-1 rounded', burstStatus]">
            {{ rateLimiter.burstRequests }}/{{ rateLimiter.burstLimit }}
          </div>
        </div>
        <div class="w-full bg-gray-200 rounded-full h-2">
          <div 
            class="h-2 rounded-full transition-all duration-200"
            :class="{
              'bg-green-500': burstPercentage < 50,
              'bg-yellow-500': burstPercentage >= 50 && burstPercentage < 75,
              'bg-orange-500': burstPercentage >= 75 && burstPercentage < 100,
              'bg-red-500': burstPercentage >= 100
            }"
            :style="{ width: Math.min(burstPercentage, 100) + '%' }"
          ></div>
        </div>
      </div>

      <!-- Rate Limit -->
      <div>
        <div class="flex justify-between items-center mb-2">
          <div class="text-sm font-medium text-gray-700">
            Rate Limit ({{ rateLimiter.rateWindow / 1000 }}s window)
          </div>
          <div :class="['text-xs px-2 py-1 rounded', rateStatus]">
            {{ rateLimiter.rateRequests }}/{{ rateLimiter.rateLimit }}
          </div>
        </div>
        <div class="w-full bg-gray-200 rounded-full h-2">
          <div 
            class="h-2 rounded-full transition-all duration-200"
            :class="{
              'bg-green-500': ratePercentage < 50,
              'bg-yellow-500': ratePercentage >= 50 && ratePercentage < 75,
              'bg-orange-500': ratePercentage >= 75 && ratePercentage < 100,
              'bg-red-500': ratePercentage >= 100
            }"
            :style="{ width: Math.min(ratePercentage, 100) + '%' }"
          ></div>
        </div>
      </div>

      <!-- API Info -->
      <div class="bg-gray-50 rounded p-3">
        <div class="text-xs text-gray-600 space-y-1">
          <div>SpaceTraders API limits: 30 requests/60s burst, 2 requests/sec sustained</div>
          <div v-if="!rateLimiter.canMakeRequest" class="text-red-600 font-medium">
            ⚠️ Rate limit reached - requests will be queued for background sync
          </div>
          <div v-else class="text-green-600">
            ✅ Ready to make API requests
          </div>
        </div>
      </div>

      <!-- Debug Info (only in development) -->
      <details v-if="isDev" class="text-xs text-gray-500">
        <summary class="cursor-pointer hover:text-gray-700">Debug Info</summary>
        <pre class="mt-2 bg-gray-100 p-2 rounded overflow-auto">{{ JSON.stringify(rateLimiter, null, 2) }}</pre>
      </details>
    </div>
  </div>
</template>

<style scoped>
/* Progress bar animations */
.transition-all {
  transition-property: all;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
}
</style>
