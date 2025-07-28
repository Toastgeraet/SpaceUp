<template>
  <div class="bg-white rounded-lg shadow-md p-6">
    <h2 class="text-lg font-semibold text-gray-900 mb-4">Agent Overview</h2>
    
    <div v-if="authStore.agentData" class="space-y-4">
      <!-- Agent Symbol -->
      <div class="flex justify-between items-center">
        <span class="text-sm font-medium text-gray-600">Agent</span>
        <span class="text-sm font-bold text-gray-900">{{ authStore.agentData.symbol }}</span>
      </div>

      <!-- Credits with optimistic updates -->
      <div class="flex justify-between items-center">
        <span class="text-sm font-medium text-gray-600">Credits</span>
        <div class="text-right">
          <div class="text-sm font-bold text-gray-900">
            {{ formatNumber(authStore.agentData.credits) }} ¤
          </div>
          <div v-if="hasOptimisticCreditsUpdate" class="text-xs text-blue-600 italic">
            Expected: {{ formatNumber(optimisticCredits) }} ¤ in {{ estimatedTimeToCompletion }}
          </div>
        </div>
      </div>

      <!-- Headquarters -->
      <div class="flex justify-between items-center">
        <span class="text-sm font-medium text-gray-600">Headquarters</span>
        <span class="text-sm text-gray-900">{{ authStore.agentData.headquarters }}</span>
      </div>

      <!-- Starting Faction -->
      <div class="flex justify-between items-center">
        <span class="text-sm font-medium text-gray-600">Faction</span>
        <span class="text-sm text-gray-900">{{ authStore.agentData.startingFaction }}</span>
      </div>

      <!-- Ship Count with optimistic updates -->
      <div class="flex justify-between items-center">
        <span class="text-sm font-medium text-gray-600">Ships</span>
        <div class="text-right">
          <div class="text-sm font-bold text-gray-900">
            {{ authStore.agentData.shipCount }}
          </div>
          <div v-if="hasOptimisticShipUpdate" class="text-xs text-blue-600 italic">
            Expected: {{ optimisticShipCount }} after purchase completion
          </div>
        </div>
      </div>

      <!-- Last Updated -->
      <div class="flex justify-between items-center pt-2 border-t border-gray-200">
        <span class="text-xs text-gray-500">Last Updated</span>
        <span class="text-xs text-gray-500">{{ formatTime(lastUpdated) }}</span>
      </div>
    </div>

    <!-- Loading State -->
    <div v-else-if="authStore.isLoading" class="flex items-center justify-center py-8">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>

    <!-- Error State -->
    <div v-else-if="authStore.error" class="text-center py-8">
      <p class="text-red-600 text-sm mb-2">{{ authStore.error }}</p>
      <button 
        @click="refreshData" 
        class="text-blue-600 hover:text-blue-800 text-sm font-medium"
      >
        Try Again
      </button>
    </div>

    <!-- No Data State -->
    <div v-else class="text-center py-8">
      <p class="text-gray-500 text-sm mb-2">No agent data available</p>
      <button 
        @click="refreshData" 
        class="text-blue-600 hover:text-blue-800 text-sm font-medium"
      >
        Load Data
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useGameStore } from '@/stores/game'

const authStore = useAuthStore()
const gameStore = useGameStore()

// Track optimistic updates for credits and ship count
const optimisticCredits = ref(0)
const optimisticShipCount = ref(0)
const hasOptimisticCreditsUpdate = ref(false)
const hasOptimisticShipUpdate = ref(false)

const lastUpdated = computed(() => {
  // This would be the last time we successfully fetched from API
  return new Date() // Placeholder - should track actual last API success
})

const estimatedTimeToCompletion = computed(() => {
  // Calculate estimated time for pending operations
  // This is a simplified example
  return "2 minutes"
})

async function refreshData() {
  await authStore.refreshAgentData()
}

function formatNumber(num: number): string {
  return new Intl.NumberFormat().format(num)
}

function formatTime(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  }).format(date)
}

// Example function to simulate optimistic updates
// In a real implementation, this would be connected to the game store's optimistic updates
function simulateOptimisticUpdate(type: 'credits' | 'ships', expectedValue: number) {
  if (type === 'credits') {
    optimisticCredits.value = expectedValue
    hasOptimisticCreditsUpdate.value = true
    // Clear after estimated time
    setTimeout(() => {
      hasOptimisticCreditsUpdate.value = false
    }, 120000) // 2 minutes
  } else if (type === 'ships') {
    optimisticShipCount.value = expectedValue
    hasOptimisticShipUpdate.value = true
    setTimeout(() => {
      hasOptimisticShipUpdate.value = false
    }, 180000) // 3 minutes
  }
}
</script>
