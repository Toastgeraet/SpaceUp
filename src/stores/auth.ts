import { defineStore } from 'pinia'
import { ref, computed, readonly } from 'vue'
import { apiClient } from '@/api/client'
import { db } from '@/db/schema'

export const useAuthStore = defineStore('auth', () => {
  // State
  const token = ref<string | null>(null)
  const agentSymbol = ref<string | null>(null)
  const agentData = ref<any>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // Computed
  const isAuthenticated = computed(() => !!token.value)
  const networkStatus = computed(() => apiClient.networkStatus)

  // Actions
  async function loadStoredAuth(): Promise<boolean> {
    isLoading.value = true
    error.value = null

    try {
      const hasToken = await apiClient.loadActiveToken()
      if (hasToken) {
        const activeToken = await db.authTokens
          .where('isActive')
          .equals(1)
          .first()
        
        if (activeToken) {
          token.value = activeToken.token
          agentSymbol.value = activeToken.agentSymbol
          
          // Try to load agent data from local storage
          const localAgent = await db.agents
            .where('symbol')
            .equals(activeToken.agentSymbol)
            .first()
          
          if (localAgent) {
            agentData.value = localAgent
          }
          
          return true
        }
      }
      
      // Check for development auto-login token if no stored auth exists
      const devToken = import.meta.env.VITE_DEV_TOKEN
      if (devToken) {
        console.log('Development token found, attempting automatic login...')
        try {
          await setToken(devToken)
          console.log('Development auto-login successful')
          return true
        } catch (err) {
          console.warn('Development auto-login failed:', err)
          // Continue with normal flow - don't throw error for dev convenience
        }
      }
      
      return false
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to load stored authentication'
      return false
    } finally {
      isLoading.value = false
    }
  }

  async function setToken(newToken: string): Promise<void> {
    isLoading.value = true
    error.value = null

    try {
      // Validate token by fetching agent data
      await apiClient.setToken(newToken, 'temp')
      const agentResponse = await apiClient.getAgent()
      
      // Extract agent symbol from response
      const agentSym = agentResponse.data.symbol
      
      // Set proper token with agent symbol
      await apiClient.setToken(newToken, agentSym)
      
      // Update local state
      token.value = newToken
      agentSymbol.value = agentSym
      agentData.value = agentResponse.data
      
      // Fetch and cache initial data
      await fetchInitialData()
      
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Invalid token'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function registerNewAgent(symbol: string, faction: string): Promise<void> {
    isLoading.value = true
    error.value = null

    try {
      const response = await apiClient.registerAgent(symbol, faction)
      
      // The registration response includes the token
      const newToken = response.data.token
      const agentSym = response.data.agent.symbol
      
      // Set token and load data
      await apiClient.setToken(newToken, agentSym)
      
      token.value = newToken
      agentSymbol.value = agentSym
      agentData.value = response.data.agent
      
      // Fetch and cache initial data
      await fetchInitialData()
      
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to register agent'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function fetchInitialData(): Promise<void> {
    try {
      // Fetch ships data
      await apiClient.getShips()
      
      // Additional initial data can be fetched here
      console.log('Initial data fetched and cached')
      
    } catch (err) {
      console.warn('Failed to fetch some initial data:', err)
      // Don't throw error here as token is still valid
    }
  }

  async function refreshAgentData(): Promise<void> {
    if (!isAuthenticated.value) return

    try {
      isLoading.value = true
      const response = await apiClient.getAgent()
      agentData.value = response.data
    } catch (err) {
      console.error('Failed to refresh agent data:', err)
      // If token is invalid, clear auth
      if (err instanceof Error && err.message.includes('401')) {
        await logout()
      }
    } finally {
      isLoading.value = false
    }
  }

  async function logout(): Promise<void> {
    // Deactivate current token in database
    if (token.value) {
      await db.authTokens
        .where('token')
        .equals(token.value)
        .modify({ isActive: false })
    }

    // Clear state
    token.value = null
    agentSymbol.value = null
    agentData.value = null
    error.value = null

    // Clear API client token
    delete apiClient['axios'].defaults.headers.common['Authorization']
  }

  function clearError(): void {
    error.value = null
  }

  return {
    // State
    token: readonly(token),
    agentSymbol: readonly(agentSymbol),
    agentData: readonly(agentData),
    isLoading: readonly(isLoading),
    error: readonly(error),
    
    // Computed
    isAuthenticated,
    networkStatus,
    
    // Actions
    loadStoredAuth,
    setToken,
    registerNewAgent,
    refreshAgentData,
    logout,
    clearError
  }
})
