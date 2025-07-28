<template>
  <div class="dashboard-view">
    <!-- Authentication Guard -->
    <div v-if="!authStore.isAuthenticated" class="min-h-screen flex items-center justify-center bg-gray-50">
      <div class="max-w-md w-full space-y-8">
        <div class="text-center">
          <h2 class="mt-6 text-3xl font-extrabold text-gray-900">
            Authentication Required
          </h2>
          <p class="mt-2 text-sm text-gray-600">
            Please authenticate to access the SpaceUp dashboard
          </p>
        </div>
        <AuthForm />
      </div>
    </div>

    <!-- Main Dashboard -->
    <div v-else>
      <GameDashboard />
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import GameDashboard from '@/components/GameDashboard.vue'
import AuthForm from '@/components/AuthForm.vue'

const authStore = useAuthStore()

onMounted(async () => {
  // Try to load stored authentication
  await authStore.loadStoredAuth()
})
</script>

<style scoped>
.dashboard-view {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}
</style>
