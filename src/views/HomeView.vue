<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import TheWelcome from '../components/TheWelcome.vue'

const router = useRouter()
const authStore = useAuthStore()

function goToDashboard() {
  router.push('/dashboard')
}

async function init() {
  // Try to load stored auth and redirect if authenticated
  const hasAuth = await authStore.loadStoredAuth()
  if (hasAuth) {
    router.push('/dashboard')
  }
}

// Initialize on component mount
init()
</script>

<template>
  <main class="min-h-screen bg-gradient-to-br from-blue-600 via-purple-600 to-purple-800">
    <div class="container mx-auto px-4 py-16">
      <div class="text-center mb-12">
        <h1 class="text-5xl font-bold text-white mb-4">SpaceUp</h1>
        <p class="text-xl text-blue-100 mb-8">Offline-First SpaceTraders.io Management Interface</p>
        
        <div class="max-w-2xl mx-auto text-blue-100 mb-12">
          <p class="mb-4">
            Manage your SpaceTraders fleet with an offline-first approach. Queue commands, 
            track ships, and automate operations even when offline.
          </p>
          <p class="text-sm">
            Commands are queued locally and executed when your connection is restored.
          </p>
        </div>

        <button 
          @click="goToDashboard"
          class="inline-flex items-center px-8 py-4 text-lg font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-lg shadow-lg transition-colors duration-200"
        >
          <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6"></path>
          </svg>
          Launch Dashboard
        </button>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
        <div class="bg-white/10 backdrop-blur-sm rounded-lg p-6 text-white">
          <div class="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center mb-4">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"></path>
            </svg>
          </div>
          <h3 class="text-lg font-semibold mb-2">Offline-First</h3>
          <p class="text-blue-100 text-sm">
            Works seamlessly offline. Commands are queued and executed when connection is restored.
          </p>
        </div>

        <div class="bg-white/10 backdrop-blur-sm rounded-lg p-6 text-white">
          <div class="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center mb-4">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
            </svg>
          </div>
          <h3 class="text-lg font-semibold mb-2">Real-time Updates</h3>
          <p class="text-blue-100 text-sm">
            Live dashboard with optimistic updates and clear distinction between real and predicted data.
          </p>
        </div>

        <div class="bg-white/10 backdrop-blur-sm rounded-lg p-6 text-white">
          <div class="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center mb-4">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 8.172V5L8 4z"></path>
            </svg>
          </div>
          <h3 class="text-lg font-semibold mb-2">Fleet Management</h3>
          <p class="text-blue-100 text-sm">
            Comprehensive ship management with manual controls and automation workflows.
          </p>
        </div>
      </div>
    </div>

    <!-- Original Welcome Component (Hidden by default, can be shown for development) -->
    <div class="hidden">
      <TheWelcome />
    </div>
  </main>
</template>
