<template>
  <div class="game-dashboard space-y-6">
    <!-- Header with network status -->
    <div class="flex justify-between items-center">
      <h1 class="text-2xl font-bold text-gray-900">SpaceUp Dashboard</h1>
      <NetworkStatusIndicator />
    </div>

    <!-- Main Dashboard Grid -->
    <div class="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
      <!-- Agent Overview -->
      <AgentOverview />
      
      <!-- Fleet Overview -->
      <FleetOverview />
      
      <!-- Current Location -->
      <LocationOverview />
    </div>

    <!-- Waypoints Section -->
    <div class="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Available Waypoints -->
      <WaypointsList />
      
      <!-- Waypoint Details -->
      <WaypointDetails />
    </div>

    <!-- Ship Details Section -->
    <div v-if="gameStore.selectedShip" class="mt-8">
      <ShipDetails :ship="gameStore.selectedShip" />
    </div>

    <!-- Manual Game Controls -->
    <div class="mt-8">
      <ManualGameControls />
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useGameStore } from '@/stores/game'
import NetworkStatusIndicator from './NetworkStatusIndicator.vue'
import AgentOverview from './AgentOverview.vue'
import FleetOverview from './FleetOverview.vue'
import LocationOverview from './LocationOverview.vue'
import WaypointsList from './WaypointsList.vue'
import WaypointDetails from './WaypointDetails.vue'
import ShipDetails from './ShipDetails.vue'
import ManualGameControls from './ManualGameControls.vue'

const authStore = useAuthStore()
const gameStore = useGameStore()

onMounted(async () => {
  // Load initial game data
  await gameStore.loadShips()
  
  // Refresh agent data
  await authStore.refreshAgentData()
})
</script>

<style scoped>
.game-dashboard {
  min-height: 100vh;
  padding: 1rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

@media (min-width: 768px) {
  .game-dashboard {
    padding: 2rem;
  }
}
</style>
