<template>
  <div class="bg-white rounded-lg shadow-md p-6">
    <h2 class="text-lg font-semibold text-gray-900 mb-4">Current Location</h2>
    
    <div v-if="selectedShipLocation" class="space-y-4">
      <!-- Selected Ship -->
      <div class="flex justify-between items-center">
        <span class="text-sm font-medium text-gray-600">Ship</span>
        <span class="text-sm font-bold text-gray-900">{{ gameStore.selectedShip?.symbol || 'None Selected' }}</span>
      </div>

      <!-- Current System -->
      <div class="flex justify-between items-center">
        <span class="text-sm font-medium text-gray-600">System</span>
        <div class="text-right">
          <div class="text-sm font-bold text-gray-900">{{ selectedShipLocation.systemSymbol }}</div>
          <div v-if="hasOptimisticSystemUpdate" class="text-xs text-blue-600 italic">
            Expected: {{ optimisticSystemUpdate.destination }} in {{ formatTimeToCompletion(optimisticSystemUpdate.estimatedCompletion) }}
          </div>
        </div>
      </div>

      <!-- Current Waypoint -->
      <div class="flex justify-between items-center">
        <span class="text-sm font-medium text-gray-600">Waypoint</span>
        <div class="text-right">
          <div class="text-sm font-bold text-gray-900">{{ selectedShipLocation.waypointSymbol }}</div>
          <div v-if="hasOptimisticWaypointUpdate" class="text-xs text-blue-600 italic">
            Expected: {{ optimisticWaypointUpdate.destination }} in {{ formatTimeToCompletion(optimisticWaypointUpdate.estimatedCompletion) }}
          </div>
        </div>
      </div>

      <!-- Navigation Status -->
      <div class="flex justify-between items-center">
        <span class="text-sm font-medium text-gray-600">Status</span>
        <div class="text-right">
          <div class="text-sm font-bold text-gray-900">
            <span :class="getStatusColor(selectedShipLocation.status)">
              {{ formatStatus(selectedShipLocation.status) }}
            </span>
          </div>
          <div v-if="hasOptimisticStatusUpdate" class="text-xs text-blue-600 italic">
            {{ optimisticStatusUpdate.message }}
          </div>
        </div>
      </div>

      <!-- Flight Mode -->
      <div class="flex justify-between items-center">
        <span class="text-sm font-medium text-gray-600">Flight Mode</span>
        <span class="text-sm text-gray-900">{{ selectedShipLocation.flightMode }}</span>
      </div>

      <!-- Travel Route (if in transit) -->
      <div v-if="selectedShipLocation.status === 'IN_TRANSIT'" class="border-t border-gray-200 pt-4">
        <h3 class="text-sm font-medium text-gray-700 mb-2">Current Route</h3>
        <div class="space-y-2">
          <div class="flex justify-between items-center text-sm">
            <span class="text-gray-600">From</span>
            <span class="font-medium">{{ selectedShipLocation.route.origin }}</span>
          </div>
          <div class="flex justify-between items-center text-sm">
            <span class="text-gray-600">To</span>
            <span class="font-medium">{{ selectedShipLocation.route.destination }}</span>
          </div>
          <div class="flex justify-between items-center text-sm">
            <span class="text-gray-600">Arrival</span>
            <span class="font-medium">{{ formatArrivalTime(selectedShipLocation.route.arrival) }}</span>
          </div>
        </div>
      </div>

      <!-- Quick Actions -->
      <div class="border-t border-gray-200 pt-4">
        <h3 class="text-sm font-medium text-gray-700 mb-2">Quick Actions</h3>
        <div class="grid grid-cols-2 gap-2">
          <button 
            v-if="selectedShipLocation.status === 'IN_ORBIT'"
            @click="dockShip"
            class="px-3 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded"
          >
            Dock
          </button>
          <button 
            v-if="selectedShipLocation.status === 'DOCKED'"
            @click="orbitShip"
            class="px-3 py-2 text-xs font-medium text-white bg-green-600 hover:bg-green-700 rounded"
          >
            Orbit
          </button>
          <button 
            v-if="canExtract"
            @click="extractResources"
            class="px-3 py-2 text-xs font-medium text-white bg-yellow-600 hover:bg-yellow-700 rounded"
          >
            Extract
          </button>
        </div>
      </div>
    </div>

    <!-- No Ship Selected -->
    <div v-else class="text-center py-8">
      <p class="text-gray-500 text-sm mb-2">No ship selected</p>
      <p class="text-xs text-gray-400">Select a ship from the fleet to view location details</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useGameStore } from '@/stores/game'

const gameStore = useGameStore()

const selectedShipLocation = computed(() => {
  return gameStore.selectedShip?.nav || null
})

const canExtract = computed(() => {
  // Simplified logic - in reality, you'd check if the waypoint has extractable resources
  return gameStore.selectedShip?.nav.status === 'IN_ORBIT'
})

// Optimistic updates for location changes
const optimisticSystemUpdate = computed(() => {
  if (!gameStore.selectedShip) return null
  const update = gameStore.getOptimisticUpdate(`${gameStore.selectedShip.symbol}_navigate`)
  return update?.type === 'navigation' ? update : null
})

const optimisticWaypointUpdate = computed(() => optimisticSystemUpdate.value)

const optimisticStatusUpdate = computed(() => {
  if (!gameStore.selectedShip) return null
  const dockUpdate = gameStore.getOptimisticUpdate(`${gameStore.selectedShip.symbol}_dock`)
  const orbitUpdate = gameStore.getOptimisticUpdate(`${gameStore.selectedShip.symbol}_orbit`)
  return dockUpdate || orbitUpdate || null
})

const hasOptimisticSystemUpdate = computed(() => !!optimisticSystemUpdate.value)
const hasOptimisticWaypointUpdate = computed(() => !!optimisticWaypointUpdate.value)
const hasOptimisticStatusUpdate = computed(() => !!optimisticStatusUpdate.value)

async function dockShip() {
  if (gameStore.selectedShip) {
    await gameStore.dockShip(gameStore.selectedShip.symbol)
  }
}

async function orbitShip() {
  if (gameStore.selectedShip) {
    await gameStore.orbitShip(gameStore.selectedShip.symbol)
  }
}

async function extractResources() {
  if (gameStore.selectedShip) {
    await gameStore.extractResources(gameStore.selectedShip.symbol)
  }
}

function getStatusColor(status: string): string {
  switch (status) {
    case 'DOCKED':
      return 'text-blue-600'
    case 'IN_ORBIT':
      return 'text-green-600'
    case 'IN_TRANSIT':
      return 'text-yellow-600'
    default:
      return 'text-gray-600'
  }
}

function formatStatus(status: string): string {
  switch (status) {
    case 'DOCKED':
      return 'Docked'
    case 'IN_ORBIT':
      return 'In Orbit'
    case 'IN_TRANSIT':
      return 'In Transit'
    default:
      return status
  }
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
