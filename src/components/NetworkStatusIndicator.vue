<template>
  <div class="flex items-center space-x-4">
    <!-- Network Status -->
    <div class="flex items-center space-x-2">
      <div 
        :class="[
          'w-3 h-3 rounded-full',
          networkStatus.isOnline ? 'bg-green-500' : 'bg-red-500'
        ]"
      ></div>
      <span class="text-sm font-medium text-gray-700">
        {{ networkStatus.isOnline ? 'Online' : 'Offline' }}
      </span>
    </div>

    <!-- Rate Limiter Status -->
    <div v-if="authStore.isAuthenticated" class="flex items-center space-x-2">
      <div class="text-xs text-gray-600">
        API: {{ rateLimiterStatus.burstRequests }}/{{ rateLimiterStatus.burstLimit }}
      </div>
      <div 
        :class="[
          'w-2 h-2 rounded-full',
          rateLimiterStatus.canMakeRequest ? 'bg-green-400' : 'bg-yellow-500'
        ]"
      ></div>
    </div>

    <!-- Token Status -->
    <div class="flex items-center space-x-2">
      <div 
        :class="[
          'w-3 h-3 rounded-full',
          authStore.isAuthenticated ? 'bg-blue-500' : 'bg-gray-400'
        ]"
      ></div>
      <span class="text-sm font-medium text-gray-700">
        {{ authStore.isAuthenticated ? authStore.agentSymbol : 'Not Authenticated' }}
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()

const networkStatus = computed(() => authStore.networkStatus)
const rateLimiterStatus = computed(() => authStore.rateLimiterStatus)
</script>
