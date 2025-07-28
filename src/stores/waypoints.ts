import { defineStore } from 'pinia'
import { ref, computed, readonly } from 'vue'
import { apiClient } from '@/api/client'
import { db, checkDatabaseCompatibility } from '@/db/schema'
import type { Waypoint } from '@/db/schema'

export const useWaypointsStore = defineStore('waypoints', () => {
  // State
  const waypoints = ref<Waypoint[]>([])
  const selectedWaypoint = ref<Waypoint | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // Computed
  const waypointsBySystem = computed(() => {
    const grouped: Record<string, Waypoint[]> = {}
    waypoints.value.forEach(waypoint => {
      if (!grouped[waypoint.systemSymbol]) {
        grouped[waypoint.systemSymbol] = []
      }
      grouped[waypoint.systemSymbol].push(waypoint)
    })
    return grouped
  })

  // Actions
  async function loadSystemWaypoints(systemSymbol: string): Promise<void> {
    isLoading.value = true
    error.value = null

    try {
      // Check database compatibility
      await checkDatabaseCompatibility()
      
      // First load from local cache
      const cachedWaypoints = await db.waypoints
        .where('systemSymbol')
        .equals(systemSymbol)
        .toArray()
      
      if (cachedWaypoints.length > 0) {
        // Update waypoints array with system waypoints
        const otherWaypoints = waypoints.value.filter(w => w.systemSymbol !== systemSymbol)
        waypoints.value = [...otherWaypoints, ...cachedWaypoints]
      }

      // Try to fetch fresh data from API
      try {
        await apiClient.getSystemWaypoints(systemSymbol)
        // Reload from cache to get updated data
        const updatedWaypoints = await db.waypoints
          .where('systemSymbol')
          .equals(systemSymbol)
          .toArray()
        
        // Update waypoints array with fresh data
        const otherWaypoints = waypoints.value.filter(w => w.systemSymbol !== systemSymbol)
        waypoints.value = [...otherWaypoints, ...updatedWaypoints]
      } catch (apiError) {
        console.log('Using cached waypoint data due to API error:', apiError)
        // Continue with cached data
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to load waypoints'
      console.error('Failed to load waypoints:', err)
    } finally {
      isLoading.value = false
    }
  }

  async function selectWaypoint(waypointSymbol: string): Promise<void> {
    const waypoint = waypoints.value.find(w => w.symbol === waypointSymbol)
    if (waypoint) {
      selectedWaypoint.value = waypoint
      
      // Try to fetch fresh waypoint data for detailed view
      try {
        await apiClient.getWaypoint(waypoint.systemSymbol, waypointSymbol)
        // Reload from cache to get updated data
        const updatedWaypoint = await db.waypoints.where('symbol').equals(waypointSymbol).first()
        if (updatedWaypoint) {
          selectedWaypoint.value = updatedWaypoint
          // Update waypoints array
          const index = waypoints.value.findIndex(w => w.symbol === waypointSymbol)
          if (index >= 0) {
            waypoints.value[index] = updatedWaypoint
          }
        }
      } catch (err) {
        console.log('Using cached waypoint data:', err)
      }
    }
  }

  function getWaypointsForSystem(systemSymbol: string): Waypoint[] {
    return waypoints.value.filter(w => w.systemSymbol === systemSymbol)
  }

  function calculateDistance(waypoint: Waypoint, shipX: number, shipY: number): number {
    const dx = waypoint.x - shipX
    const dy = waypoint.y - shipY
    return Math.sqrt(dx * dx + dy * dy)
  }

  function formatDistance(distance: number): string {
    if (distance < 1) {
      return `${Math.round(distance * 1000)}m`
    } else if (distance < 1000) {
      return `${Math.round(distance * 10) / 10}km`
    } else {
      return `${Math.round(distance)}km`
    }
  }

  function getCacheAge(waypoint: Waypoint): string {
    const now = new Date()
    const updated = new Date(waypoint.updatedAt)
    const diffMs = now.getTime() - updated.getTime()
    
    const minutes = Math.floor(diffMs / 60000)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)
    
    if (days > 0) {
      return `${days} day${days > 1 ? 's' : ''} ago`
    } else if (hours > 0) {
      return `${hours} hour${hours > 1 ? 's' : ''} ago`
    } else if (minutes > 0) {
      return `${minutes} minute${minutes > 1 ? 's' : ''} ago`
    } else {
      return 'Just now'
    }
  }

  function isDataStale(waypoint: Waypoint, maxAgeMinutes: number = 60): boolean {
    const now = new Date()
    const updated = new Date(waypoint.updatedAt)
    const diffMs = now.getTime() - updated.getTime()
    const diffMinutes = diffMs / 60000
    return diffMinutes > maxAgeMinutes
  }

  function getWaypointType(type: string): { name: string; color: string } {
    const types: Record<string, { name: string; color: string }> = {
      'PLANET': { name: 'Planet', color: 'text-green-600' },
      'GAS_GIANT': { name: 'Gas Giant', color: 'text-purple-600' },
      'MOON': { name: 'Moon', color: 'text-gray-600' },
      'ORBITAL_STATION': { name: 'Orbital Station', color: 'text-blue-600' },
      'JUMP_GATE': { name: 'Jump Gate', color: 'text-yellow-600' },
      'ASTEROID_FIELD': { name: 'Asteroid Field', color: 'text-orange-600' },
      'ASTEROID': { name: 'Asteroid', color: 'text-orange-500' },
      'DEBRIS_FIELD': { name: 'Debris Field', color: 'text-red-600' },
      'NEBULA': { name: 'Nebula', color: 'text-indigo-600' },
      'ENGINEERED_ASTEROID': { name: 'Engineered Asteroid', color: 'text-cyan-600' },
      'ASTEROID_BASE': { name: 'Asteroid Base', color: 'text-orange-700' }
    }
    return types[type] || { name: type, color: 'text-gray-600' }
  }

  function clearError(): void {
    error.value = null
  }

  return {
    // State
    waypoints: readonly(waypoints),
    selectedWaypoint,
    isLoading: readonly(isLoading),
    error: readonly(error),
    
    // Computed
    waypointsBySystem,
    
    // Actions
    loadSystemWaypoints,
    selectWaypoint,
    getWaypointsForSystem,
    calculateDistance,
    formatDistance,
    getCacheAge,
    isDataStale,
    getWaypointType,
    clearError
  }
})
