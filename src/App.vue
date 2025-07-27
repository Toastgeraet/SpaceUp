<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import AuthForm from '@/components/AuthForm.vue'

const authStore = useAuthStore()

// Initialize the app
onMounted(async () => {
  // Load any stored authentication
  await authStore.loadStoredAuth()
})
</script>

<template>
  <div class="min-h-screen bg-gray-100">
    <!-- Header -->
    <header class="bg-white shadow-sm border-b">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center py-4">
          <div class="flex items-center">
            <h1 class="text-2xl font-bold text-gray-900">SpaceUp</h1>
            <span class="ml-2 text-sm text-gray-500">SpaceTraders Management</span>
          </div>
          
          <!-- Auth Status -->
          <div v-if="authStore.isAuthenticated" class="flex items-center space-x-4">
            <div class="text-sm text-gray-600">
              Agent: <span class="font-medium">{{ authStore.agentSymbol }}</span>
            </div>
            <div v-if="authStore.agentData" class="text-sm text-gray-600">
              Credits: <span class="font-medium text-green-600">{{ authStore.agentData.credits?.toLocaleString() }}</span>
            </div>
            <button
              @click="authStore.logout"
              class="text-sm text-red-600 hover:text-red-800 underline"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Authentication Required -->
      <div v-if="!authStore.isAuthenticated">
        <div class="text-center mb-8">
          <h2 class="text-3xl font-bold text-gray-900 mb-4">Welcome to SpaceUp</h2>
          <p class="text-lg text-gray-600 max-w-2xl mx-auto">
            Your offline-first management interface for SpaceTraders.io. 
            Works seamlessly offline with automatic background sync when you're back online.
          </p>
        </div>
        
        <AuthForm />
        
        <div class="mt-12 max-w-4xl mx-auto">
          <h3 class="text-xl font-semibold text-gray-900 mb-4">Features</h3>
          <div class="grid md:grid-cols-2 gap-6">
            <div class="bg-white p-6 rounded-lg shadow">
              <h4 class="font-medium text-gray-900 mb-2">🚀 Offline-First</h4>
              <p class="text-gray-600 text-sm">
                Make decisions and queue actions even without internet. 
                Everything syncs automatically when you're back online.
              </p>
            </div>
            <div class="bg-white p-6 rounded-lg shadow">
              <h4 class="font-medium text-gray-900 mb-2">📱 Progressive Web App</h4>
              <p class="text-gray-600 text-sm">
                Install on your phone or desktop for a native app experience. 
                Perfect for managing your fleet on the go.
              </p>
            </div>
            <div class="bg-white p-6 rounded-lg shadow">
              <h4 class="font-medium text-gray-900 mb-2">⚡ Smart Rate Limiting</h4>
              <p class="text-gray-600 text-sm">
                Automatically respects SpaceTraders API limits with intelligent 
                queuing and retry logic.
              </p>
            </div>
            <div class="bg-white p-6 rounded-lg shadow">
              <h4 class="font-medium text-gray-900 mb-2">🔄 Background Sync</h4>
              <p class="text-gray-600 text-sm">
                Actions continue processing in the background. 
                Your ships keep working even when you close the app.
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Authenticated Dashboard -->
      <div v-else>
        <div class="bg-white rounded-lg shadow p-6">
          <h3 class="text-xl font-semibold text-gray-900 mb-4">Agent Dashboard</h3>
          
          <!-- Agent Info -->
          <div v-if="authStore.agentData" class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div class="bg-gray-50 p-4 rounded-lg">
              <div class="text-sm text-gray-600">Headquarters</div>
              <div class="font-medium">{{ authStore.agentData.headquarters }}</div>
            </div>
            <div class="bg-gray-50 p-4 rounded-lg">
              <div class="text-sm text-gray-600">Faction</div>
              <div class="font-medium">{{ authStore.agentData.startingFaction }}</div>
            </div>
            <div class="bg-gray-50 p-4 rounded-lg">
              <div class="text-sm text-gray-600">Ships</div>
              <div class="font-medium">{{ authStore.agentData.shipCount }}</div>
            </div>
          </div>

          <!-- Loading State -->
          <div v-if="authStore.isLoading" class="text-center py-8">
            <div class="animate-pulse text-gray-600">Loading agent data...</div>
          </div>

          <!-- Coming Soon -->
          <div class="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h4 class="font-medium text-blue-900 mb-2">🚧 Phase 1: Offline-First Foundation Complete!</h4>
            <p class="text-blue-800 text-sm mb-4">
              The core offline-first infrastructure is now ready. Coming next:
            </p>
            <ul class="text-blue-700 text-sm space-y-1 list-disc list-inside">
              <li>Ship management and fleet overview</li>
              <li>SpaceTraders quickstart guide implementation</li>
              <li>Manual game controls (navigation, mining, trading)</li>
              <li>Visual automation workflow builder</li>
            </ul>
          </div>
        </div>
      </div>
    </main>

    <!-- Footer -->
    <footer class="bg-white border-t mt-12">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div class="text-center text-sm text-gray-500">
          SpaceUp - Offline-first SpaceTraders.io management interface
        </div>
      </div>
    </footer>
  </div>
</template>

<style scoped>
/* Any component-specific styles can go here */
</style>
