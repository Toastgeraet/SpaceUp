<template>
  <div class="bg-white rounded-lg shadow-md p-6">
    <div class="flex justify-between items-center mb-4">
      <h2 class="text-lg font-semibold text-gray-900">Available Waypoints</h2>
      <button 
        @click="refreshWaypoints"
        :disabled="waypointsStore.isLoading || !selectedShip"
        class="text-sm text-blue-600 hover:text-blue-800 disabled:text-gray-400"
      >
        {{ waypointsStore.isLoading ? 'Loading...' : 'Refresh' }}
      </button>
    </div>

    <!-- Ship Selection Notice -->
    <div v-if="!selectedShip" class="text-center py-8">
      <p class="text-gray-500 text-sm mb-2">Select a ship to view available waypoints</p>
    </div>

    <!-- Waypoints List -->
    <div v-else-if="systemWaypoints.length > 0" class="space-y-2 max-h-96 overflow-y-auto">
      <div
        v-for="waypoint in sortedWaypoints"
        :key="waypoint.symbol"
        class="flex justify-between items-center p-3 rounded border hover:bg-gray-50 cursor-pointer transition-colors"
        :class="{ 'border-blue-300 bg-blue-50': selectedWaypoint?.symbol === waypoint.symbol }"
        @click="selectWaypoint(waypoint)"
      >
        <div class="flex-1 min-w-0">
          <div class="flex items-center space-x-2">
            <h3 class="font-medium text-gray-900 truncate">{{ waypoint.symbol }}</h3>
            <span :class="waypointType(waypoint.type).color" class="text-xs font-medium">
              {{ waypointType(waypoint.type).name }}
            </span>
          </div>
          
          <!-- Traits (extractable resources, etc.) -->
          <div v-if="waypoint.traits && waypoint.traits.length > 0" class="mt-1">
            <div class="flex flex-wrap gap-1">
              <span
                v-for="trait in waypoint.traits.slice(0, 3)"
                :key="trait.symbol"
                class="inline-block px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded"
              >
                {{ formatTraitName(trait.name) }}
              </span>
              <span
                v-if="waypoint.traits.length > 3"
                class="inline-block px-2 py-1 text-xs bg-gray-100 text-gray-400 rounded"
              >
                +{{ waypoint.traits.length - 3 }} more
              </span>
            </div>
          </div>

          <!-- Cache age indicator for variable data -->
          <div v-if="hasVariableData(waypoint)" class="mt-1">
            <span class="text-xs text-gray-500">
              Cached: {{ waypointsStore.getCacheAge(waypoint) }}
              <span v-if="waypointsStore.isDataStale(waypoint)" class="text-orange-600">
                (may be outdated)
              </span>
            </span>
          </div>
        </div>

        <div class="text-right ml-4">
          <div class="font-medium text-gray-900">
            {{ waypointsStore.formatDistance(calculateDistance(waypoint)) }}
          </div>
          <div class="text-xs text-gray-500">
            {{ waypoint.x }}, {{ waypoint.y }}
          </div>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-else-if="waypointsStore.isLoading" class="flex items-center justify-center py-8">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>

    <!-- Empty State -->
    <div v-else class="text-center py-8">
      <p class="text-gray-500 text-sm mb-2">No waypoints found in this system</p>
      <button 
        @click="refreshWaypoints" 
        class="text-blue-600 hover:text-blue-800 text-sm font-medium"
        :disabled="!selectedShip"
      >
        Load Waypoints
      </button>
    </div>

    <!-- Error State -->
    <div v-if="waypointsStore.error" class="mt-4 p-3 bg-red-50 border border-red-200 rounded">
      <p class="text-red-600 text-sm">{{ waypointsStore.error }}</p>
      <button 
        @click="waypointsStore.clearError()"
        class="text-red-800 hover:text-red-900 text-xs mt-1"
      >
        Dismiss
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, watch } from 'vue'
import { useGameStore } from '@/stores/game'
import { useWaypointsStore } from '@/stores/waypoints'
import type { Waypoint } from '@/db/schema'

const gameStore = useGameStore()
const waypointsStore = useWaypointsStore()

const selectedShip = computed(() => gameStore.selectedShip)
const selectedWaypoint = computed(() => waypointsStore.selectedWaypoint)

const systemWaypoints = computed(() => {
  if (!selectedShip.value) return []
  return waypointsStore.getWaypointsForSystem(selectedShip.value.nav.systemSymbol)
})

const sortedWaypoints = computed(() => {
  if (!selectedShip.value) return []
  
  return [...systemWaypoints.value].sort((a, b) => {
    const distanceA = calculateDistance(a)
    const distanceB = calculateDistance(b)
    return distanceA - distanceB
  })
})

function calculateDistance(waypoint: Waypoint): number {
  if (!selectedShip.value) return 0
  
  // Get ship's current position from nav.route.destination (current location)
  const shipPos = selectedShip.value.nav.route.destination
  return waypointsStore.calculateDistance(waypoint, shipPos.x, shipPos.y)
}

function waypointType(type: string) {
  return waypointsStore.getWaypointType(type)
}

function formatTraitName(name: string): string {
  return name.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())
}

function hasVariableData(waypoint: Waypoint): boolean {
  // Data that can change over time (resources, markets, etc.)
  return waypoint.traits?.some(trait => 
    trait.symbol.includes('MINERAL') || 
    trait.symbol.includes('GAS') || 
    trait.symbol.includes('MARKETPLACE') ||
    trait.symbol.includes('SHIPYARD')
  ) || false
}

async function selectWaypoint(waypoint: Waypoint) {
  await waypointsStore.selectWaypoint(waypoint.symbol)
}

async function refreshWaypoints() {
  if (selectedShip.value) {
    await waypointsStore.loadSystemWaypoints(selectedShip.value.nav.systemSymbol)
  }
}

// Auto-load waypoints when ship is selected
watch(selectedShip, async (newShip) => {
  if (newShip) {
    await waypointsStore.loadSystemWaypoints(newShip.nav.systemSymbol)
  }
}, { immediate: true })
</script>
