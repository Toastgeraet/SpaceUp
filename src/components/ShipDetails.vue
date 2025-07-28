<template>
  <div class="bg-white rounded-lg shadow-md p-6">
    <div class="flex justify-between items-center mb-4">
      <h2 class="text-lg font-semibold text-gray-900">Ship Details</h2>
      <button 
        @click="refreshShipData"
        :disabled="isRefreshing"
        class="text-sm text-blue-600 hover:text-blue-800 disabled:text-gray-400"
      >
        {{ isRefreshing ? 'Refreshing...' : 'Refresh' }}
      </button>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <!-- Basic Info -->
      <div class="space-y-4">
        <h3 class="text-sm font-medium text-gray-700 border-b border-gray-200 pb-2">Basic Info</h3>
        
        <div class="space-y-2">
          <div class="flex justify-between text-sm">
            <span class="text-gray-600">Symbol</span>
            <span class="font-medium">{{ ship.symbol }}</span>
          </div>
          <div class="flex justify-between text-sm">
            <span class="text-gray-600">Name</span>
            <span class="font-medium">{{ ship.registration.name }}</span>
          </div>
          <div class="flex justify-between text-sm">
            <span class="text-gray-600">Role</span>
            <span class="font-medium">{{ ship.registration.role }}</span>
          </div>
          <div class="flex justify-between text-sm">
            <span class="text-gray-600">Faction</span>
            <span class="font-medium">{{ ship.registration.factionSymbol }}</span>
          </div>
        </div>
      </div>

      <!-- Navigation -->
      <div class="space-y-4">
        <h3 class="text-sm font-medium text-gray-700 border-b border-gray-200 pb-2">Navigation</h3>
        
        <div class="space-y-2">
          <div class="flex justify-between text-sm">
            <span class="text-gray-600">Status</span>
            <span :class="getStatusColor(ship.nav.status)" class="font-medium">
              {{ formatStatus(ship.nav.status) }}
            </span>
          </div>
          <div class="flex justify-between text-sm">
            <span class="text-gray-600">System</span>
            <span class="font-medium">{{ ship.nav.systemSymbol }}</span>
          </div>
          <div class="flex justify-between text-sm">
            <span class="text-gray-600">Waypoint</span>
            <div class="text-right">
              <div class="font-medium">{{ ship.nav.waypointSymbol }}</div>
              <div v-if="hasOptimisticNavUpdate" class="text-xs text-blue-600 italic">
                Expected: {{ optimisticNavUpdate.destination }}
              </div>
            </div>
          </div>
          <div class="flex justify-between text-sm">
            <span class="text-gray-600">Flight Mode</span>
            <span class="font-medium">{{ ship.nav.flightMode }}</span>
          </div>
        </div>

        <!-- Route info if in transit -->
        <div v-if="ship.nav.status === 'IN_TRANSIT'" class="mt-4 p-3 bg-yellow-50 rounded">
          <h4 class="text-xs font-medium text-gray-700 mb-2">Current Route</h4>
          <div class="space-y-1 text-xs">
            <div class="flex justify-between">
              <span class="text-gray-600">From</span>
              <span>{{ ship.nav.route.origin.symbol }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-600">To</span>
              <span>{{ ship.nav.route.destination.symbol }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-600">Arrival</span>
              <span>{{ formatArrivalTime(ship.nav.route.arrival) }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Cargo -->
      <div class="space-y-4">
        <h3 class="text-sm font-medium text-gray-700 border-b border-gray-200 pb-2">Cargo</h3>
        
        <div class="space-y-2">
          <div class="flex justify-between text-sm">
            <span class="text-gray-600">Capacity</span>
            <span class="font-medium">{{ ship.cargo.units }} / {{ ship.cargo.capacity }}</span>
          </div>
          
          <!-- Cargo Progress Bar -->
          <div class="w-full bg-gray-200 rounded-full h-2">
            <div 
              class="bg-blue-600 h-2 rounded-full transition-all duration-300"
              :style="{ width: `${(ship.cargo.units / ship.cargo.capacity) * 100}%` }"
            ></div>
          </div>

          <!-- Inventory -->
          <div v-if="ship.cargo.inventory.length > 0" class="mt-3">
            <h4 class="text-xs font-medium text-gray-700 mb-2">Inventory</h4>
            <div class="space-y-1 max-h-24 overflow-y-auto">
              <div 
                v-for="item in ship.cargo.inventory" 
                :key="item.symbol"
                class="flex justify-between text-xs"
              >
                <span class="text-gray-600">{{ item.symbol }}</span>
                <span>{{ item.units }}</span>
              </div>
            </div>
          </div>

          <!-- Optimistic cargo updates -->
          <div v-if="hasOptimisticCargoUpdate" class="mt-3 p-2 bg-blue-50 rounded">
            <div class="text-xs text-blue-600 italic">
              {{ optimisticCargoUpdate.message }}
            </div>
          </div>
        </div>
      </div>

      <!-- Fuel -->
      <div class="space-y-4">
        <h3 class="text-sm font-medium text-gray-700 border-b border-gray-200 pb-2">Fuel</h3>
        
        <div class="space-y-2">
          <div class="flex justify-between text-sm">
            <span class="text-gray-600">Current</span>
            <span class="font-medium">{{ ship.fuel.current }} / {{ ship.fuel.capacity }}</span>
          </div>
          
          <!-- Fuel Progress Bar -->
          <div class="w-full bg-gray-200 rounded-full h-2">
            <div 
              class="bg-green-600 h-2 rounded-full transition-all duration-300"
              :style="{ width: `${(ship.fuel.current / ship.fuel.capacity) * 100}%` }"
            ></div>
          </div>

          <div v-if="ship.fuel.consumed" class="text-xs text-gray-500">
            Last consumed: {{ ship.fuel.consumed.amount }} units
          </div>
        </div>
      </div>

      <!-- Crew -->
      <div class="space-y-4">
        <h3 class="text-sm font-medium text-gray-700 border-b border-gray-200 pb-2">Crew</h3>
        
        <div class="space-y-2">
          <div class="flex justify-between text-sm">
            <span class="text-gray-600">Current</span>
            <span class="font-medium">{{ ship.crew.current }} / {{ ship.crew.capacity }}</span>
          </div>
          <div class="flex justify-between text-sm">
            <span class="text-gray-600">Required</span>
            <span class="font-medium">{{ ship.crew.required }}</span>
          </div>
          <div class="flex justify-between text-sm">
            <span class="text-gray-600">Morale</span>
            <span class="font-medium">{{ ship.crew.morale }}</span>
          </div>
          <div class="flex justify-between text-sm">
            <span class="text-gray-600">Wages</span>
            <span class="font-medium">{{ ship.crew.wages }} ¤</span>
          </div>
        </div>
      </div>

      <!-- Cooldown -->
      <div class="space-y-4">
        <h3 class="text-sm font-medium text-gray-700 border-b border-gray-200 pb-2">Cooldown</h3>
        
        <div class="space-y-2">
          <div class="flex justify-between text-sm">
            <span class="text-gray-600">Remaining</span>
            <span class="font-medium">{{ ship.cooldown.remainingSeconds }}s</span>
          </div>
          <div class="flex justify-between text-sm">
            <span class="text-gray-600">Total</span>
            <span class="font-medium">{{ ship.cooldown.totalSeconds }}s</span>
          </div>
          
          <!-- Cooldown Progress Bar -->
          <div class="w-full bg-gray-200 rounded-full h-2">
            <div 
              class="bg-red-600 h-2 rounded-full transition-all duration-300"
              :style="{ width: `${((ship.cooldown.totalSeconds - ship.cooldown.remainingSeconds) / ship.cooldown.totalSeconds) * 100}%` }"
            ></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useGameStore } from '@/stores/game'
import type { Ship } from '@/db/schema'

interface Props {
  ship: Ship
}

const props = defineProps<Props>()
const gameStore = useGameStore()
const isRefreshing = ref(false)

const optimisticNavUpdate = computed(() => {
  return gameStore.getOptimisticUpdate(`${props.ship.symbol}_navigate`)
})

const optimisticCargoUpdate = computed(() => {
  return gameStore.getOptimisticUpdate(`${props.ship.symbol}_extract`)
})

const hasOptimisticNavUpdate = computed(() => !!optimisticNavUpdate.value)
const hasOptimisticCargoUpdate = computed(() => !!optimisticCargoUpdate.value)

async function refreshShipData() {
  isRefreshing.value = true
  try {
    await gameStore.selectShip(props.ship.symbol)
  } finally {
    isRefreshing.value = false
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
</script>
