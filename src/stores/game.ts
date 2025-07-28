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
  
  // Auto-extraction tracking
  const autoExtractionShips = ref<Set<string>>(new Set())
  const autoExtractionIntervals = ref<Map<string, number>>(new Map())
  const notifications = ref<Array<{ id: string; type: string; message: string; timestamp: Date }>>([])

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

  // Auto-extraction functionality
  async function toggleAutoExtraction(shipSymbol: string): Promise<void> {
    if (autoExtractionShips.value.has(shipSymbol)) {
      // Stop auto-extraction
      stopAutoExtraction(shipSymbol)
    } else {
      // Start auto-extraction
      startAutoExtraction(shipSymbol)
    }
  }

  function startAutoExtraction(shipSymbol: string): void {
    // Add to auto-extraction set
    autoExtractionShips.value.add(shipSymbol)
    
    // Start extraction loop
    const extractionLoop = async () => {
      try {
        const ship = ships.value.find(s => s.symbol === shipSymbol)
        if (!ship) {
          stopAutoExtraction(shipSymbol)
          return
        }

        // Check if cargo is full
        if (ship.cargo.units >= ship.cargo.capacity) {
          stopAutoExtraction(shipSymbol)
          addNotification('warning', `${shipSymbol}: Cargo is full! Auto-extraction stopped.`)
          return
        }

        // Check if ship is in orbit and cooldown is 0
        console.debug(`${shipSymbol}: Ships status: ${ship.nav.status}, Cooldown: ${ship.cooldown.remainingSeconds}s`)
        if (ship.nav.status === 'IN_ORBIT' && ship.cooldown.remainingSeconds === 0) {
          await extractResources(shipSymbol)
        }
      } catch (error: any) {
        // Handle 409 cooldown errors
        if (error.response?.status === 409) {
          const cooldownData = error.response.data?.error?.data?.cooldown
          if (cooldownData) {
            console.log(`Auto-extraction waiting for cooldown: ${cooldownData.remainingSeconds}s`)
            // Continue the loop, it will check again
          }
        } else {
          console.error('Auto-extraction error:', error)
          stopAutoExtraction(shipSymbol)
          addNotification('error', `${shipSymbol}: Auto-extraction stopped due to error.`)
        }
      }
    }

    // Set up interval to check every 2 seconds
    const intervalId = setInterval(extractionLoop, 2000)
    autoExtractionIntervals.value.set(shipSymbol, intervalId)
    
    addNotification('info', `${shipSymbol}: Auto-extraction started.`)
  }

  function stopAutoExtraction(shipSymbol: string): void {
    // Remove from auto-extraction set
    autoExtractionShips.value.delete(shipSymbol)
    
    // Clear interval
    const intervalId = autoExtractionIntervals.value.get(shipSymbol)
    if (intervalId) {
      clearInterval(intervalId)
      autoExtractionIntervals.value.delete(shipSymbol)
    }
    
    addNotification('info', `${shipSymbol}: Auto-extraction stopped.`)
  }

  function isAutoExtracting(shipSymbol: string): boolean {
    return autoExtractionShips.value.has(shipSymbol)
  }

  function addNotification(type: string, message: string): void {
    const notification = {
      id: Date.now().toString(),
      type,
      message,
      timestamp: new Date()
    }
    notifications.value.unshift(notification)
    
    // Keep only last 10 notifications
    if (notifications.value.length > 10) {
      notifications.value = notifications.value.slice(0, 10)
    }
  }

  function clearNotification(id: string): void {
    const index = notifications.value.findIndex(n => n.id === id)
    if (index >= 0) {
      notifications.value.splice(index, 1)
    }
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
    autoExtractionShips: readonly(autoExtractionShips),
    notifications: readonly(notifications),
    
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
    toggleAutoExtraction,
    isAutoExtracting,
    addNotification,
    clearNotification,
    getOptimisticUpdate,
    clearOptimisticUpdate,
    clearError
  }
})
