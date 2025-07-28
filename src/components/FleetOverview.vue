<template>
  <div class="bg-white rounded-lg shadow-md p-6">
    <h2 class="text-lg font-semibold text-gray-900 mb-4">Fleet Overview</h2>
    
    <div v-if="gameStore.ships.length > 0" class="space-y-4">
      <!-- Fleet Statistics -->
      <div class="grid grid-cols-2 gap-4">
        <div class="text-center">
          <div class="text-2xl font-bold text-blue-600">{{ gameStore.fleetCount }}</div>
          <div class="text-xs text-gray-600">Total Ships</div>
        </div>
        <div class="text-center">
          <div class="text-2xl font-bold text-green-600">{{ gameStore.availableShips.length }}</div>
          <div class="text-xs text-gray-600">Available</div>
        </div>
      </div>

      <!-- Traveling Ships with optimistic updates -->
      <div v-if="gameStore.travelingShips.length > 0" class="border-t border-gray-200 pt-4">
        <h3 class="text-sm font-medium text-gray-700 mb-2">Traveling Ships</h3>
        <div class="space-y-2">
          <div 
            v-for="ship in gameStore.travelingShips" 
            :key="ship.symbol"
            class="flex justify-between items-center text-sm"
          >
            <span class="font-medium">{{ ship.symbol }}</span>
            <div class="text-right">
              <div class="text-gray-900">{{ ship.nav.route.destination.symbol }}</div>
              <div class="text-xs text-gray-500">
                Arrival: {{ formatArrivalTime(ship.nav.route.arrival) }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Optimistic Navigation Updates -->
      <div v-if="hasOptimisticNavUpdates" class="border-t border-gray-200 pt-4">
        <h3 class="text-sm font-medium text-blue-600 mb-2">Expected Movements</h3>
        <div class="space-y-2">
          <div 
            v-for="update in optimisticNavUpdates" 
            :key="update.shipSymbol"
            class="flex justify-between items-center text-sm"
          >
            <span class="font-medium">{{ update.shipSymbol }}</span>
            <div class="text-right">
              <div class="text-blue-600 italic">Expected: {{ update.destination }}</div>
              <div class="text-xs text-gray-500">
                {{ update.status === 'queued' ? 'Queued for when online' : `in ${formatTimeToCompletion(update.estimatedCompletion)}` }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Available Ships List -->
      <div class="border-t border-gray-200 pt-4">
        <h3 class="text-sm font-medium text-gray-700 mb-2">Available Ships</h3>
        <div class="space-y-2 max-h-32 overflow-y-auto">
          <div 
            v-for="ship in gameStore.availableShips" 
            :key="ship.symbol"
            class="flex justify-between items-center text-sm cursor-pointer hover:bg-gray-50 p-2 rounded"
            @click="selectShip(ship.symbol)"
          >
            <span class="font-medium">{{ ship.symbol }}</span>
            <div class="text-right">
              <div class="text-gray-900">{{ ship.nav.waypointSymbol }}</div>
              <div class="text-xs text-gray-500">{{ ship.nav.status }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Refresh Button -->
      <div class="border-t border-gray-200 pt-4">
        <button 
          @click="refreshFleet"
          :disabled="gameStore.isLoading"
          class="w-full px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-800 disabled:text-gray-400"
        >
          <span v-if="gameStore.isLoading">Refreshing...</span>
          <span v-else>Refresh Fleet</span>
        </button>
      </div>
    </div>

    <!-- Loading State -->
    <div v-else-if="gameStore.isLoading" class="flex items-center justify-center py-8">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>

    <!-- Empty State -->
    <div v-else class="text-center py-8">
      <p class="text-gray-500 text-sm mb-2">No ships available</p>
      <button 
        @click="refreshFleet" 
        class="text-blue-600 hover:text-blue-800 text-sm font-medium"
      >
        Load Fleet
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useGameStore } from '@/stores/game'

const gameStore = useGameStore()

const optimisticNavUpdates = computed(() => {
  const updates = []
  for (const [key, update] of gameStore.optimisticUpdates) {
    if (update.type === 'navigation') {
      updates.push(update)
    }
  }
  return updates
})

const hasOptimisticNavUpdates = computed(() => optimisticNavUpdates.value.length > 0)

async function selectShip(shipSymbol: string) {
  await gameStore.selectShip(shipSymbol)
}

async function refreshFleet() {
  await gameStore.loadShips()
}

function formatArrivalTime(arrivalTime: string): string {
  const arrival = new Date(arrivalTime)
  const now = new Date()
  const diff = arrival.getTime() - now.getTime()
  
  if (diff <= 0) {
    return 'Arrived'
  }
  
  const minutes = Math.floor(diff / 60000)
  const seconds = Math.floor((diff % 60000) / 1000)
  
  if (minutes > 0) {
    return `${minutes}m ${seconds}s`
  } else {
    return `${seconds}s`
  }
}

function formatTimeToCompletion(estimatedTime: Date): string {
  const now = new Date()
  const diff = estimatedTime.getTime() - now.getTime()
  
  if (diff <= 0) {
    return 'any moment'
  }
  
  const minutes = Math.floor(diff / 60000)
  const seconds = Math.floor((diff % 60000) / 1000)
  
  if (minutes > 0) {
    return `${minutes}m ${seconds}s`
  } else {
    return `${seconds}s`
  }
}
</script>
