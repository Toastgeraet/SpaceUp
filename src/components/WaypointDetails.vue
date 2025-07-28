<template>
  <div class="bg-white rounded-lg shadow-md p-6">
    <div class="flex justify-between items-center mb-4">
      <h2 class="text-lg font-semibold text-gray-900">Waypoint Details</h2>
      <button 
        v-if="selectedWaypoint"
        @click="refreshWaypoint"
        :disabled="isRefreshing"
        class="text-sm text-blue-600 hover:text-blue-800 disabled:text-gray-400"
      >
        {{ isRefreshing ? 'Refreshing...' : 'Refresh' }}
      </button>
    </div>

    <!-- No Selection State -->
    <div v-if="!selectedWaypoint" class="text-center py-8">
      <p class="text-gray-500 text-sm mb-2">Select a waypoint to view details</p>
    </div>

    <!-- Waypoint Details -->
    <div v-else class="space-y-6">
      <!-- Basic Information -->
      <div>
        <h3 class="text-sm font-medium text-gray-700 border-b border-gray-200 pb-2 mb-3">Basic Information</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="space-y-2">
            <div class="flex justify-between text-sm">
              <span class="text-gray-600">Symbol</span>
              <span class="font-medium">{{ selectedWaypoint.symbol }}</span>
            </div>
            <div class="flex justify-between text-sm">
              <span class="text-gray-600">Type</span>
              <span :class="waypointType.color" class="font-medium">
                {{ waypointType.name }}
              </span>
            </div>
            <div class="flex justify-between text-sm">
              <span class="text-gray-600">System</span>
              <span class="font-medium">{{ selectedWaypoint.systemSymbol }}</span>
            </div>
          </div>
          <div class="space-y-2">
            <div class="flex justify-between text-sm">
              <span class="text-gray-600">Coordinates</span>
              <span class="font-medium">{{ selectedWaypoint.x }}, {{ selectedWaypoint.y }}</span>
            </div>
            <div v-if="selectedShip" class="flex justify-between text-sm">
              <span class="text-gray-600">Distance</span>
              <span class="font-medium">{{ formattedDistance }}</span>
            </div>
            <div v-if="selectedWaypoint.isUnderConstruction" class="flex justify-between text-sm">
              <span class="text-gray-600">Status</span>
              <span class="text-orange-600 font-medium">Under Construction</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Faction -->
      <div v-if="selectedWaypoint.faction">
        <h3 class="text-sm font-medium text-gray-700 border-b border-gray-200 pb-2 mb-3">Controlling Faction</h3>
        <div class="flex justify-between text-sm">
          <span class="text-gray-600">Faction</span>
          <span class="font-medium">{{ selectedWaypoint.faction.symbol }}</span>
        </div>
      </div>

      <!-- Traits with Cache Information -->
      <div v-if="selectedWaypoint.traits && selectedWaypoint.traits.length > 0">
        <div class="flex justify-between items-center border-b border-gray-200 pb-2 mb-3">
          <h3 class="text-sm font-medium text-gray-700">Traits</h3>
          <div v-if="hasVariableTraits" class="text-xs text-gray-500">
            Cached: {{ cacheAge }}
            <span v-if="waypointsStore.isDataStale(selectedWaypoint)" class="text-orange-600 ml-1">
              (may be outdated)
            </span>
          </div>
        </div>
        <div class="grid grid-cols-1 gap-3">
          <div
            v-for="trait in selectedWaypoint.traits"
            :key="trait.symbol"
            class="p-3 bg-gray-50 rounded border"
            :class="{ 'border-orange-200 bg-orange-50': isVariableTrait(trait.symbol) && waypointsStore.isDataStale(selectedWaypoint) }"
          >
            <div class="flex justify-between items-start mb-2">
              <h4 class="font-medium text-gray-900">{{ formatTraitName(trait.name) }}</h4>
              <div class="flex items-center space-x-2">
                <span
                  v-if="isVariableTrait(trait.symbol)"
                  class="inline-block px-2 py-1 text-xs bg-blue-100 text-blue-600 rounded"
                >
                  Variable Data
                </span>
                <span
                  v-if="isResourceTrait(trait.symbol)"
                  class="inline-block px-2 py-1 text-xs bg-green-100 text-green-600 rounded"
                >
                  Extractable
                </span>
              </div>
            </div>
            <p class="text-sm text-gray-600">{{ trait.description }}</p>
          </div>
        </div>
      </div>

      <!-- Modifiers -->
      <div v-if="selectedWaypoint.modifiers && selectedWaypoint.modifiers.length > 0">
        <h3 class="text-sm font-medium text-gray-700 border-b border-gray-200 pb-2 mb-3">Modifiers</h3>
        <div class="grid grid-cols-1 gap-3">
          <div
            v-for="modifier in selectedWaypoint.modifiers"
            :key="modifier.symbol"
            class="p-3 bg-yellow-50 rounded border border-yellow-200"
          >
            <h4 class="font-medium text-gray-900 mb-2">{{ formatTraitName(modifier.name) }}</h4>
            <p class="text-sm text-gray-600">{{ modifier.description }}</p>
          </div>
        </div>
      </div>

      <!-- Orbitals -->
      <div v-if="selectedWaypoint.orbitals && selectedWaypoint.orbitals.length > 0">
        <h3 class="text-sm font-medium text-gray-700 border-b border-gray-200 pb-2 mb-3">Orbitals</h3>
        <div class="grid grid-cols-2 md:grid-cols-3 gap-2">
          <span
            v-for="orbital in selectedWaypoint.orbitals"
            :key="orbital.symbol"
            class="px-3 py-2 bg-gray-100 text-gray-700 rounded text-sm text-center cursor-pointer hover:bg-gray-200 transition-colors"
            @click="selectOrbital(orbital.symbol)"
          >
            {{ orbital.symbol }}
          </span>
        </div>
      </div>

      <!-- Chart Information -->
      <div v-if="selectedWaypoint.chart">
        <h3 class="text-sm font-medium text-gray-700 border-b border-gray-200 pb-2 mb-3">Chart Information</h3>
        <div class="space-y-2">
          <div v-if="selectedWaypoint.chart.submittedBy" class="flex justify-between text-sm">
            <span class="text-gray-600">Charted by</span>
            <span class="font-medium">{{ selectedWaypoint.chart.submittedBy }}</span>
          </div>
          <div v-if="selectedWaypoint.chart.submittedOn" class="flex justify-between text-sm">
            <span class="text-gray-600">Charted on</span>
            <span class="font-medium">{{ formatDate(selectedWaypoint.chart.submittedOn) }}</span>
          </div>
        </div>
      </div>

      <!-- Action Buttons -->
      <div v-if="selectedShip" class="border-t border-gray-200 pt-4">
        <div class="flex space-x-3">
          <button
            @click="navigateToWaypoint"
            :disabled="isNavigating || selectedShip.nav.waypointSymbol === selectedWaypoint.symbol"
            class="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-sm font-medium"
          >
            <span v-if="isNavigating">Navigating...</span>
            <span v-else-if="selectedShip.nav.waypointSymbol === selectedWaypoint.symbol">Current Location</span>
            <span v-else>Navigate Here</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useGameStore } from '@/stores/game'
import { useWaypointsStore } from '@/stores/waypoints'

const gameStore = useGameStore()
const waypointsStore = useWaypointsStore()
const isRefreshing = ref(false)
const isNavigating = ref(false)

const selectedWaypoint = computed(() => waypointsStore.selectedWaypoint)
const selectedShip = computed(() => gameStore.selectedShip)

const waypointType = computed(() => {
  if (!selectedWaypoint.value) return { name: '', color: '' }
  return waypointsStore.getWaypointType(selectedWaypoint.value.type)
})

const formattedDistance = computed(() => {
  if (!selectedWaypoint.value || !selectedShip.value) return ''
  const shipPos = selectedShip.value.nav.route.destination
  const distance = waypointsStore.calculateDistance(selectedWaypoint.value, shipPos.x, shipPos.y)
  return waypointsStore.formatDistance(distance)
})

const cacheAge = computed(() => {
  if (!selectedWaypoint.value) return ''
  return waypointsStore.getCacheAge(selectedWaypoint.value)
})

const hasVariableTraits = computed(() => {
  if (!selectedWaypoint.value?.traits) return false
  return selectedWaypoint.value.traits.some(trait => isVariableTrait(trait.symbol))
})

function formatTraitName(name: string): string {
  return name.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())
}

function isVariableTrait(symbol: string): boolean {
  return symbol.includes('MINERAL') || 
         symbol.includes('GAS') || 
         symbol.includes('MARKETPLACE') ||
         symbol.includes('SHIPYARD') ||
         symbol.includes('DEPOSITS')
}

function isResourceTrait(symbol: string): boolean {
  return symbol.includes('MINERAL') || 
         symbol.includes('GAS') ||
         symbol.includes('DEPOSITS')
}

function formatDate(dateString: string): string {
  try {
    return new Date(dateString).toLocaleDateString()
  } catch {
    return dateString
  }
}

async function refreshWaypoint() {
  if (!selectedWaypoint.value) return
  
  isRefreshing.value = true
  try {
    await waypointsStore.selectWaypoint(selectedWaypoint.value.symbol)
  } finally {
    isRefreshing.value = false
  }
}

async function navigateToWaypoint() {
  if (!selectedWaypoint.value || !selectedShip.value) return
  
  isNavigating.value = true
  try {
    await gameStore.navigateShip(selectedShip.value.symbol, selectedWaypoint.value.symbol)
  } catch (error) {
    console.error('Failed to navigate to waypoint:', error)
  } finally {
    isNavigating.value = false
  }
}

async function selectOrbital(orbitalSymbol: string) {
  await waypointsStore.selectWaypoint(orbitalSymbol)
}
</script>
