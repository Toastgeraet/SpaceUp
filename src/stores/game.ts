import { defineStore } from 'pinia'
import { ref, computed, readonly } from 'vue'
import { apiClient } from '@/api/client'
import { db, checkDatabaseCompatibility } from '@/db/schema'
import type { Ship, Agent } from '@/db/schema'

export const useGameStore = defineStore('game', () => {
  // State
  const ships = ref<Ship[]>([])
  const selectedShip = ref<Ship | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  
  // Optimistic updates tracking
  const optimisticUpdates = ref<Map<string, any>>(new Map())

  // Computed
  const fleetCount = computed(() => ships.value.length)
  const availableShips = computed(() => 
    ships.value.filter(ship => ship.nav.status === 'DOCKED' || ship.nav.status === 'IN_ORBIT')
  )
  const travelingShips = computed(() => 
    ships.value.filter(ship => ship.nav.status === 'IN_TRANSIT')
  )

  // Actions
  async function loadShips(): Promise<void> {
    isLoading.value = true
    error.value = null

    try {
      // Check database compatibility and reset if needed
      await checkDatabaseCompatibility()
      
      // First load from local cache
      const cachedShips = await db.ships.toArray()
      if (cachedShips.length > 0) {
        ships.value = cachedShips
      }

      // Then try to fetch fresh data from API
      try {
        const response = await apiClient.getShips()
        // Data is automatically cached by the API client
        // Reload from cache to get the updated data
        const updatedShips = await db.ships.toArray()
        ships.value = updatedShips
      } catch (apiError) {
        console.log('Using cached ship data due to API error:', apiError)
        // Continue with cached data
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to load ships'
      console.error('Failed to load ships:', err)
    } finally {
      isLoading.value = false
    }
  }

  async function selectShip(shipSymbol: string): Promise<void> {
    const ship = ships.value.find(s => s.symbol === shipSymbol)
    if (ship) {
      selectedShip.value = ship
      
      // Try to fetch fresh ship data
      try {
        await apiClient.getShip(shipSymbol)
        // Reload from cache to get updated data
        const updatedShip = await db.ships.where('symbol').equals(shipSymbol).first()
        if (updatedShip) {
          selectedShip.value = updatedShip
          // Update ships array
          const index = ships.value.findIndex(s => s.symbol === shipSymbol)
          if (index >= 0) {
            ships.value[index] = updatedShip
          }
        }
      } catch (err) {
        console.log('Using cached ship data:', err)
      }
    }
  }

  async function navigateShip(shipSymbol: string, waypointSymbol: string): Promise<void> {
    const ship = ships.value.find(s => s.symbol === shipSymbol)
    if (!ship) throw new Error('Ship not found')

    // Create optimistic update
    const optimisticKey = `${shipSymbol}_navigate`
    const estimatedArrival = new Date(Date.now() + 60000) // Estimate 1 minute
    
    optimisticUpdates.value.set(optimisticKey, {
      type: 'navigation',
      shipSymbol,
      destination: waypointSymbol,
      estimatedCompletion: estimatedArrival,
      status: 'expected'
    })

    try {
      await apiClient.navigateShip(shipSymbol, waypointSymbol)
      // Remove optimistic update on success
      optimisticUpdates.value.delete(optimisticKey)
      // Reload ship data
      await selectShip(shipSymbol)
    } catch (err) {
      // Update optimistic state to show queued
      optimisticUpdates.value.set(optimisticKey, {
        ...optimisticUpdates.value.get(optimisticKey),
        status: 'queued',
        message: 'Navigation queued for when online'
      })
      console.log('Navigation queued for background sync:', err)
    }
  }

  async function extractResources(shipSymbol: string): Promise<void> {
    const ship = ships.value.find(s => s.symbol === shipSymbol)
    if (!ship) throw new Error('Ship not found')

    // Create optimistic update
    const optimisticKey = `${shipSymbol}_extract`
    const estimatedCompletion = new Date(Date.now() + 30000) // Estimate 30 seconds
    
    optimisticUpdates.value.set(optimisticKey, {
      type: 'extraction',
      shipSymbol,
      estimatedCompletion,
      status: 'expected',
      expectedYield: 'Unknown resources'
    })

    try {
      await apiClient.extractResources(shipSymbol)
      // Remove optimistic update on success
      optimisticUpdates.value.delete(optimisticKey)
      // Reload ship data
      await selectShip(shipSymbol)
    } catch (err) {
      // Update optimistic state to show queued
      optimisticUpdates.value.set(optimisticKey, {
        ...optimisticUpdates.value.get(optimisticKey),
        status: 'queued',
        message: 'Extraction queued for when online'
      })
      console.log('Extraction queued for background sync:', err)
    }
  }

  async function dockShip(shipSymbol: string): Promise<void> {
    const ship = ships.value.find(s => s.symbol === shipSymbol)
    if (!ship) throw new Error('Ship not found')

    // Create optimistic update
    const optimisticKey = `${shipSymbol}_dock`
    
    optimisticUpdates.value.set(optimisticKey, {
      type: 'dock',
      shipSymbol,
      status: 'expected',
      message: 'Expected: Ship docked'
    })

    try {
      await apiClient.dockShip(shipSymbol)
      optimisticUpdates.value.delete(optimisticKey)
      await selectShip(shipSymbol)
    } catch (err) {
      optimisticUpdates.value.set(optimisticKey, {
        ...optimisticUpdates.value.get(optimisticKey),
        status: 'queued',
        message: 'Dock command queued for when online'
      })
      console.log('Dock queued for background sync:', err)
    }
  }

  async function orbitShip(shipSymbol: string): Promise<void> {
    const ship = ships.value.find(s => s.symbol === shipSymbol)
    if (!ship) throw new Error('Ship not found')

    // Create optimistic update
    const optimisticKey = `${shipSymbol}_orbit`
    
    optimisticUpdates.value.set(optimisticKey, {
      type: 'orbit',
      shipSymbol,
      status: 'expected',
      message: 'Expected: Ship in orbit'
    })

    try {
      await apiClient.orbitShip(shipSymbol)
      optimisticUpdates.value.delete(optimisticKey)
      await selectShip(shipSymbol)
    } catch (err) {
      optimisticUpdates.value.set(optimisticKey, {
        ...optimisticUpdates.value.get(optimisticKey),
        status: 'queued',
        message: 'Orbit command queued for when online'
      })
      console.log('Orbit queued for background sync:', err)
    }
  }

  function getOptimisticUpdate(key: string) {
    return optimisticUpdates.value.get(key)
  }

  function clearOptimisticUpdate(key: string) {
    optimisticUpdates.value.delete(key)
  }

  function clearError(): void {
    error.value = null
  }

  return {
    // State
    ships: readonly(ships),
    selectedShip,
    isLoading: readonly(isLoading),
    error: readonly(error),
    optimisticUpdates: readonly(optimisticUpdates),
    
    // Computed
    fleetCount,
    availableShips,
    travelingShips,
    
    // Actions
    loadShips,
    selectShip,
    navigateShip,
    extractResources,
    dockShip,
    orbitShip,
    getOptimisticUpdate,
    clearOptimisticUpdate,
    clearError
  }
})
