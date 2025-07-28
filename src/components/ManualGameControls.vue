<template>
  <div class="bg-white rounded-lg shadow-md p-6">
    <div class="flex justify-between items-center mb-4">
      <h2 class="text-lg font-semibold text-gray-900">Manual Game Controls</h2>
      <div class="text-xs text-gray-500">
        <span class="inline-block w-2 h-2 bg-yellow-500 rounded-full mr-1"></span>
        Commands are queued when offline
      </div>
    </div>

    <!-- Important Notice -->
    <div class="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
      <div class="flex items-start space-x-2">
        <div class="flex-shrink-0">
          <svg class="w-5 h-5 text-blue-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"></path>
          </svg>
        </div>
        <div>
          <h3 class="text-sm font-medium text-blue-800">Real-time Gameplay Notice</h3>
          <p class="text-sm text-blue-700 mt-1">
            Real offline play is not possible. These controls queue commands and workflows to the sync layer 
            which will be executed once the API is available again.
          </p>
        </div>
      </div>
    </div>

    <div v-if="!gameStore.selectedShip" class="text-center py-8">
      <p class="text-gray-500 text-sm mb-2">No ship selected</p>
      <p class="text-xs text-gray-400">Select a ship from the fleet to access manual controls</p>
    </div>

    <div v-else class="space-y-6">
      <!-- Ship Selection -->
      <div class="flex items-center space-x-4">
        <label class="text-sm font-medium text-gray-700">Active Ship:</label>
        <select 
          :value="gameStore.selectedShip.symbol"
          @change="onShipChange"
          class="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
        >
          <option v-for="ship in gameStore.ships" :key="ship.symbol" :value="ship.symbol">
            {{ ship.symbol }} ({{ ship.nav.waypointSymbol }})
          </option>
        </select>
      </div>

      <!-- Navigation Controls -->
      <div class="border border-gray-200 rounded-lg p-4">
        <h3 class="text-sm font-semibold text-gray-900 mb-4">Navigation</h3>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <!-- Waypoint Navigation -->
          <div class="space-y-3">
            <label class="block text-sm font-medium text-gray-700">Navigate to Waypoint</label>
            <div class="flex space-x-2">
              <input 
                v-model="navigationTarget"
                type="text" 
                placeholder="Enter waypoint symbol"
                class="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
              >
              <button 
                @click="navigateToWaypoint"
                :disabled="!navigationTarget || isNavigating"
                class="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 rounded-md"
              >
                {{ isNavigating ? 'Queuing...' : 'Navigate' }}
              </button>
            </div>
            <div v-if="hasNavOptimisticUpdate" class="text-xs text-blue-600 italic">
              {{ navOptimisticUpdate.status === 'queued' ? navOptimisticUpdate.message : `Expected arrival: ${formatTimeToCompletion(navOptimisticUpdate.estimatedCompletion)}` }}
            </div>
          </div>

          <!-- Dock/Orbit Controls -->
          <div class="space-y-3">
            <label class="block text-sm font-medium text-gray-700">Ship Status</label>
            <div class="grid grid-cols-2 gap-2">
              <button 
                v-if="gameStore.selectedShip.nav.status === 'IN_ORBIT'"
                @click="dockShip"
                :disabled="isDocking"
                class="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 rounded-md"
              >
                {{ isDocking ? 'Queuing...' : 'Dock' }}
              </button>
              <button 
                v-if="gameStore.selectedShip.nav.status === 'DOCKED'"
                @click="orbitShip"
                :disabled="isOrbiting"
                class="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:bg-gray-400 rounded-md"
              >
                {{ isOrbiting ? 'Queuing...' : 'Orbit' }}
              </button>
            </div>
            <div v-if="hasStatusOptimisticUpdate" class="text-xs text-blue-600 italic">
              {{ statusOptimisticUpdate.message }}
            </div>
          </div>
        </div>
      </div>

      <!-- Resource Extraction -->
      <div class="border border-gray-200 rounded-lg p-4">
        <h3 class="text-sm font-semibold text-gray-900 mb-4">Resource Extraction</h3>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="space-y-3">
            <div class="flex items-center justify-between">
              <label class="text-sm font-medium text-gray-700">Extract Resources</label>
              <span class="text-xs text-gray-500">
                Cargo: {{ gameStore.selectedShip.cargo.units }}/{{ gameStore.selectedShip.cargo.capacity }}
              </span>
            </div>
            <button 
              @click="toggleExtraction"
              :disabled="!canExtract || isExtracting"
              :class="[
                'w-full px-4 py-2 text-sm font-medium text-white rounded-md transition-colors',
                gameStore.isAutoExtracting(gameStore.selectedShip.symbol) 
                  ? 'bg-red-600 hover:bg-red-700' 
                  : 'bg-yellow-600 hover:bg-yellow-700',
                (!canExtract || isExtracting) && 'bg-gray-400'
              ]"
            >
              {{ isExtracting ? 'Queuing...' : (gameStore.isAutoExtracting(gameStore.selectedShip.symbol) ? 'Stop Auto-Extract' : 'Start Auto-Extract') }}
            </button>
            <div v-if="!canExtract" class="text-xs text-red-600">
              Ship must be in orbit to extract resources
            </div>
            <div v-if="hasExtractOptimisticUpdate" class="text-xs text-blue-600 italic">
              {{ extractOptimisticUpdate.status === 'queued' ? extractOptimisticUpdate.message : `Expected yield: ${extractOptimisticUpdate.expectedYield} in ${formatTimeToCompletion(extractOptimisticUpdate.estimatedCompletion)}` }}
            </div>
          </div>

          <div class="space-y-3">
            <label class="text-sm font-medium text-gray-700">Cargo Management</label>
            <div v-if="gameStore.selectedShip.cargo.inventory.length > 0" class="space-y-2 max-h-32 overflow-y-auto">
              <div 
                v-for="item in gameStore.selectedShip.cargo.inventory" 
                :key="item.symbol"
                class="flex justify-between items-center text-sm p-2 bg-gray-50 rounded"
              >
                <span class="font-medium">{{ item.symbol }}</span>
                <div class="flex items-center space-x-2">
                  <span class="text-gray-600">{{ item.units }}</span>
                  <button 
                    @click="sellCargo(item.symbol, item.units)"
                    class="px-2 py-1 text-xs text-red-600 hover:text-red-800"
                  >
                    Sell
                  </button>
                </div>
              </div>
            </div>
            <div v-else class="text-xs text-gray-500 text-center py-4">
              No cargo to manage
            </div>
          </div>
        </div>
      </div>

      <!-- Queued Actions Display -->
      <div v-if="hasQueuedActions" class="border border-yellow-200 rounded-lg p-4 bg-yellow-50">
        <h3 class="text-sm font-semibold text-gray-900 mb-4">Queued Actions</h3>
        <div class="space-y-2">
          <div 
            v-for="(action, key) in queuedActions" 
            :key="key"
            class="flex justify-between items-center text-sm p-2 bg-white rounded border"
          >
            <div class="flex items-center space-x-2">
              <span class="w-2 h-2 bg-yellow-500 rounded-full"></span>
              <span class="font-medium">{{ action.type.toUpperCase() }}</span>
              <span class="text-gray-600">
                {{ action.shipSymbol }}
                <span v-if="action.destination"> → {{ action.destination }}</span>
              </span>
            </div>
            <div class="text-xs text-gray-500">
              {{ action.status === 'queued' ? 'Queued for online' : 'Processing...' }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useGameStore } from '@/stores/game'

const gameStore = useGameStore()

// Form state
const navigationTarget = ref('')
const isNavigating = ref(false)
const isDocking = ref(false)
const isOrbiting = ref(false)
const isExtracting = ref(false)

// Computed properties
const canExtract = computed(() => {
  return gameStore.selectedShip?.nav.status === 'IN_ORBIT'
})

const hasNavOptimisticUpdate = computed(() => {
  if (!gameStore.selectedShip) return false
  return !!gameStore.getOptimisticUpdate(`${gameStore.selectedShip.symbol}_navigate`)
})

const navOptimisticUpdate = computed(() => {
  if (!gameStore.selectedShip) return null
  return gameStore.getOptimisticUpdate(`${gameStore.selectedShip.symbol}_navigate`)
})

const hasStatusOptimisticUpdate = computed(() => {
  if (!gameStore.selectedShip) return false
  const dockUpdate = gameStore.getOptimisticUpdate(`${gameStore.selectedShip.symbol}_dock`)
  const orbitUpdate = gameStore.getOptimisticUpdate(`${gameStore.selectedShip.symbol}_orbit`)
  return !!(dockUpdate || orbitUpdate)
})

const statusOptimisticUpdate = computed(() => {
  if (!gameStore.selectedShip) return null
  const dockUpdate = gameStore.getOptimisticUpdate(`${gameStore.selectedShip.symbol}_dock`)
  const orbitUpdate = gameStore.getOptimisticUpdate(`${gameStore.selectedShip.symbol}_orbit`)
  return dockUpdate || orbitUpdate
})

const hasExtractOptimisticUpdate = computed(() => {
  if (!gameStore.selectedShip) return false
  return !!gameStore.getOptimisticUpdate(`${gameStore.selectedShip.symbol}_extract`)
})

const extractOptimisticUpdate = computed(() => {
  if (!gameStore.selectedShip) return null
  return gameStore.getOptimisticUpdate(`${gameStore.selectedShip.symbol}_extract`)
})

const queuedActions = computed(() => {
  const actions: any[] = []
  for (const [key, update] of gameStore.optimisticUpdates) {
    if (update.status === 'queued' || update.status === 'expected') {
      actions.push({
        key,
        ...update
      })
    }
  }
  return actions
})

const hasQueuedActions = computed(() => queuedActions.value.length > 0)

// Actions
async function onShipChange(event: Event) {
  const target = event.target as HTMLSelectElement
  await gameStore.selectShip(target.value)
}

async function navigateToWaypoint() {
  if (!navigationTarget.value.trim() || !gameStore.selectedShip) return
  
  isNavigating.value = true
  try {
    await gameStore.navigateShip(gameStore.selectedShip.symbol, navigationTarget.value.trim())
    navigationTarget.value = '' // Clear input on success
  } finally {
    isNavigating.value = false
  }
}

async function dockShip() {
  if (!gameStore.selectedShip) return
  
  isDocking.value = true
  try {
    await gameStore.dockShip(gameStore.selectedShip.symbol)
  } finally {
    isDocking.value = false
  }
}

async function orbitShip() {
  if (!gameStore.selectedShip) return
  
  isOrbiting.value = true
  try {
    await gameStore.orbitShip(gameStore.selectedShip.symbol)
  } finally {
    isOrbiting.value = false
  }
}

async function toggleExtraction() {
  if (!gameStore.selectedShip) return
  
  isExtracting.value = true
  try {
    await gameStore.toggleAutoExtraction(gameStore.selectedShip.symbol)
  } finally {
    isExtracting.value = false
  }
}

async function extractResources() {
  if (!gameStore.selectedShip) return
  
  isExtracting.value = true
  try {
    await gameStore.extractResources(gameStore.selectedShip.symbol)
  } finally {
    isExtracting.value = false
  }
}

async function sellCargo(symbol: string, units: number) {
  if (!gameStore.selectedShip) return
  
  // This would be implemented when we add selling functionality to the game store
  console.log(`Selling ${units} units of ${symbol}`)
  // await gameStore.sellCargo(gameStore.selectedShip.symbol, symbol, units)
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
