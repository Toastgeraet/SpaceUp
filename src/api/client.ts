import axios, { type AxiosInstance, type AxiosRequestConfig, type AxiosResponse } from 'axios'
import { db } from '@/db/schema'
import { actionQueue } from '@/services/actionQueue'
import { z } from 'zod'

// Rate limiting configuration for SpaceTraders API
// Based on actual API headers and documentation:
// - Burst limit: 30 requests
// - Burst duration: 60 seconds  
// - Rate limit: 2 requests per second
interface RateLimitConfig {
  burstLimit: number // 30 requests total in burst
  rateLimit: number // 2 requests per second sustained
  burstWindow: number // 60000ms (60 seconds)
  rateWindow: number // 1000ms (1 second)
}

const RATE_LIMIT_CONFIG: RateLimitConfig = {
  burstLimit: 30,      // From x-ratelimit-limit-burst header
  rateLimit: 2,        // From x-ratelimit-limit-per-second header  
  burstWindow: 60000,  // 60 seconds burst duration from docs
  rateWindow: 1000     // 1 second window for rate limiting
}

// Track rate limiting per agent token
interface RateLimitTracker {
  burstRequests: number[]    // Track requests within burst window (60s)
  rateRequests: number[]     // Track requests within rate window (1s)
  lastReset: number
}

// API Response schemas for validation
export const ApiErrorSchema = z.object({
  error: z.object({
    message: z.string(),
    code: z.number(),
    data: z.any().optional()
  })
})

export const AgentResponseSchema = z.object({
  data: z.object({
    accountId: z.string(),
    symbol: z.string(),
    headquarters: z.string(),
    credits: z.number(),
    startingFaction: z.string(),
    shipCount: z.number()
  })
})

// Schema for individual ship data
const ShipDataSchema = z.object({
  symbol: z.string(),
  registration: z.object({
    name: z.string(),
    factionSymbol: z.string(),
    role: z.string()
  }),
  nav: z.object({
    systemSymbol: z.string(),
    waypointSymbol: z.string(),
    route: z.object({
      origin: z.string(),
      destination: z.string(),
      arrival: z.string(),
      departureTime: z.string()
    }),
    status: z.string(),
    flightMode: z.string()
  }),
  crew: z.object({
    current: z.number(),
    required: z.number(),
    capacity: z.number(),
    rotation: z.string(),
    morale: z.number(),
    wages: z.number()
  }),
  frame: z.any(),
  reactor: z.any(),
  engine: z.any(),
  cooldown: z.object({
    shipSymbol: z.string(),
    totalSeconds: z.number(),
    remainingSeconds: z.number(),
    expiration: z.string().optional()
  }),
  modules: z.array(z.any()),
  mounts: z.array(z.any()),
  cargo: z.object({
    capacity: z.number(),
    units: z.number(),
    inventory: z.array(z.any())
  }),
  fuel: z.object({
    current: z.number(),
    capacity: z.number(),
    consumed: z.object({
      amount: z.number(),
      timestamp: z.string()
    }).optional()
  })
})

// Schema for single ship response
export const ShipResponseSchema = z.object({
  data: ShipDataSchema
})

// Schema for multiple ships response
export const ShipsResponseSchema = z.object({
  data: z.array(ShipDataSchema)
})

export class SpaceTradersApiClient {
  private axios: AxiosInstance
  private rateLimitTrackers = new Map<string, RateLimitTracker>()
  private isOnline = navigator.onLine
  private currentToken: string | null = null
  private currentAgentSymbol: string | null = null

  constructor() {
    this.axios = axios.create({
      baseURL: 'https://api.spacetraders.io/v2',
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json'
      }
    })

    this.setupInterceptors()
    this.setupNetworkListeners()
  }

  /**
   * Set authentication token
   */
  async setToken(token: string, agentSymbol: string): Promise<void> {
    this.currentToken = token
    this.currentAgentSymbol = agentSymbol
    this.axios.defaults.headers.common['Authorization'] = `Bearer ${token}`

    // Initialize rate limit tracker for this token
    if (!this.rateLimitTrackers.has(token)) {
      this.rateLimitTrackers.set(token, {
        burstRequests: [],
        rateRequests: [],
        lastReset: Date.now()
      })
    }

    // Store token in IndexedDB
    await db.authTokens.put({
      token,
      agentSymbol,
      accountId: 'unknown', // Will be updated when we fetch agent data
      isActive: true,
      createdAt: new Date()
    })
  }

  /**
   * Load active token from IndexedDB
   */
  async loadActiveToken(): Promise<boolean> {
    const activeToken = await db.authTokens
      .where('isActive')
      .equals(1)
      .first()

    if (activeToken) {
      await this.setToken(activeToken.token, activeToken.agentSymbol)
      return true
    }

    return false
  }

  /**
   * Setup axios interceptors for offline support and rate limiting
   */
  private setupInterceptors(): void {
    // Request interceptor for rate limiting and offline handling
    this.axios.interceptors.request.use(
      async (config) => {
        // Check if we should queue this request instead of sending immediately
        if (!this.isOnline) {
          throw new Error('Offline: Request queued for later')
        }

        // Apply rate limiting
        if (this.currentToken && !await this.checkRateLimit(this.currentToken)) {
          throw new Error('Rate limit exceeded: Request queued for later')
        }

        // Track request for rate limiting
        if (this.currentToken) {
          this.trackRequest(this.currentToken)
        }

        return config
      },
      (error) => Promise.reject(error)
    )

    // Response interceptor for caching and error handling
    this.axios.interceptors.response.use(
      async (response) => {
        // Cache successful responses
        if (response.config.method === 'get') {
          await this.cacheResponse(response)
        }

        // Update local data based on response
        await this.updateLocalData(response)

        return response
      },
  async (error) => {
    // Check if error.config exists to avoid accessing undefined properties
    if (!error.config) {
      console.warn('Error occurred without request config:', error)
      return Promise.reject(error)
    }

    // Handle offline or network errors by queuing
    if (!navigator.onLine || error.code === 'NETWORK_ERROR') {
      console.log('Network error, queuing request for background sync')
      // Queue for background sync if applicable
      await this.queueForBackgroundSync(error.config)
    }

    // Try to return cached data for GET requests
    if (error.config.method === 'get') {
      const cachedResponse = await this.getCachedResponse(error.config)
      if (cachedResponse) {
        console.log('Returning cached response for:', error.config.url)
        return cachedResponse
      }
    }

    return Promise.reject(error)
  }
    )
  }

  /**
   * Setup network status listeners
   */
  private setupNetworkListeners(): void {
    window.addEventListener('online', () => {
      this.isOnline = true
      console.log('Network online: Starting background sync')
      // Trigger background sync when back online
      actionQueue.startProcessing()
    })

    window.addEventListener('offline', () => {
      this.isOnline = false
      console.log('Network offline: Switching to offline mode')
    })
  }

  /**
   * Check if request can be made within rate limits
   */
  private async checkRateLimit(token: string): Promise<boolean> {
    const tracker = this.rateLimitTrackers.get(token)
    if (!tracker) return true

    // Clean expired timestamps from the tracker arrays
    this.cleanExpiredTimestamps(tracker)

    // Check burst limit (30 requests in 60 seconds)
    if (tracker.burstRequests.length >= RATE_LIMIT_CONFIG.burstLimit) {
      return false
    }

    // Check rate limit (2 requests per second)
    if (tracker.rateRequests.length >= RATE_LIMIT_CONFIG.rateLimit) {
      return false
    }

    return true
  }

  /**
   * Track a request for rate limiting
   */
  private trackRequest(token: string): void {
    const tracker = this.rateLimitTrackers.get(token)
    if (tracker) {
      const now = Date.now()
      tracker.burstRequests.push(now)
      tracker.rateRequests.push(now)
    }
  }

  /**
   * Cache API response
   */
  private async cacheResponse(response: AxiosResponse): Promise<void> {
    try {
      const cacheKey = this.getCacheKey(response.config)
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000) // 5 minutes default

      await db.apiCache.put({
        endpoint: cacheKey.endpoint,
        params: cacheKey.params,
        response: response.data,
        expiresAt,
        createdAt: new Date()
      })
    } catch (error) {
      console.warn('Failed to cache response:', error)
    }
  }

  /**
   * Get cached response
   */
  private async getCachedResponse(config: AxiosRequestConfig): Promise<AxiosResponse | null> {
    try {
      const cacheKey = this.getCacheKey(config)
      const cached = await db.apiCache
        .where('endpoint')
        .equals(cacheKey.endpoint)
        .and(item => item.params === cacheKey.params && item.expiresAt > new Date())
        .first()

      if (cached) {
        return {
          data: cached.response,
          status: 200,
          statusText: 'OK (Cached)',
          headers: {},
          config
        } as AxiosResponse
      }
    } catch (error) {
      console.warn('Failed to get cached response:', error)
    }

    return null
  }

  /**
   * Generate cache key from request config
   */
  private getCacheKey(config: AxiosRequestConfig): { endpoint: string; params: string } {
    const endpoint = config.url || ''
    const params = JSON.stringify({
      method: config.method,
      params: config.params,
      data: config.data
    })
    return { endpoint, params }
  }

  /**
   * Update local data based on API response
   */
  private async updateLocalData(response: AxiosResponse): Promise<void> {
    try {
      const url = response.config.url || ''
      
      // Update agent data
      if (url.includes('/my/agent')) {
        const agentData = AgentResponseSchema.parse(response.data)
        await db.agents.put({
          symbol: agentData.data.symbol,
          headquarters: agentData.data.headquarters,
          credits: agentData.data.credits,
          startingFaction: agentData.data.startingFaction,
          shipCount: agentData.data.shipCount,
          accountId: agentData.data.accountId,
          createdAt: new Date(),
          updatedAt: new Date()
        })
      }

      // Update ship data
      if (url.includes('/my/ships')) {
        // Check if this is a single ship or multiple ships response
        if (url.match(/\/my\/ships\/[^\/]+$/)) {
          // Single ship response (e.g., /my/ships/SHIP-123)
          const shipData = ShipResponseSchema.parse(response.data)
          await db.ships.put({
            symbol: shipData.data.symbol,
            registration: shipData.data.registration,
            nav: shipData.data.nav,
            crew: shipData.data.crew,
            frame: shipData.data.frame,
            reactor: shipData.data.reactor,
            engine: shipData.data.engine,
            cooldown: shipData.data.cooldown,
            modules: shipData.data.modules,
            mounts: shipData.data.mounts,
            cargo: shipData.data.cargo,
            fuel: shipData.data.fuel,
            agentSymbol: this.currentAgentSymbol || '',
            updatedAt: new Date()
          })
        } else if (url === '/my/ships') {
          // Multiple ships response
          const shipsData = ShipsResponseSchema.parse(response.data)
          // Store each ship individually
          for (const ship of shipsData.data) {
            await db.ships.put({
              symbol: ship.symbol,
              registration: ship.registration,
              nav: ship.nav,
              crew: ship.crew,
              frame: ship.frame,
              reactor: ship.reactor,
              engine: ship.engine,
              cooldown: ship.cooldown,
              modules: ship.modules,
              mounts: ship.mounts,
              cargo: ship.cargo,
              fuel: ship.fuel,
              agentSymbol: this.currentAgentSymbol || '',
              updatedAt: new Date()
            })
          }
        }
      }
    } catch (error) {
      console.warn('Failed to update local data:', error)
    }
  }

  /**
   * Queue request for background sync
   */
  private async queueForBackgroundSync(config: AxiosRequestConfig): Promise<void> {
    if (config.method !== 'get' && this.currentAgentSymbol) {
      // Only queue non-GET requests that modify state
      await actionQueue.enqueue({
        type: this.mapUrlToActionType(config.url || ''),
        payload: {
          url: config.url,
          method: config.method,
          data: config.data,
          params: config.params
        },
        agentSymbol: this.currentAgentSymbol
      })
    }
  }

  /**
   * Map API URL to action type
   */
  private mapUrlToActionType(url: string): any {
    if (url.includes('/navigate')) return 'navigate'
    if (url.includes('/extract')) return 'extract'
    if (url.includes('/dock')) return 'dock'
    if (url.includes('/orbit')) return 'orbit'
    if (url.includes('/refuel')) return 'refuel'
    if (url.includes('/sell')) return 'sell'
    if (url.includes('/purchase')) return 'purchase'
    if (url.includes('/survey')) return 'survey'
    return 'navigate' // default
  }

  /**
   * API Methods
   */

  async getAgent(): Promise<any> {
    const response = await this.axios.get('/my/agent')
    return response.data
  }

  async getShips(): Promise<any> {
    const response = await this.axios.get('/my/ships')
    return response.data
  }

  async getShip(shipSymbol: string): Promise<any> {
    const response = await this.axios.get(`/my/ships/${shipSymbol}`)
    return response.data
  }

  async navigateShip(shipSymbol: string, waypointSymbol: string): Promise<any> {
    const response = await this.axios.post(`/my/ships/${shipSymbol}/navigate`, {
      waypointSymbol
    })
    return response.data
  }

  async orbitShip(shipSymbol: string): Promise<any> {
    const response = await this.axios.post(`/my/ships/${shipSymbol}/orbit`)
    return response.data
  }

  async dockShip(shipSymbol: string): Promise<any> {
    const response = await this.axios.post(`/my/ships/${shipSymbol}/dock`)
    return response.data
  }

  async extractResources(shipSymbol: string): Promise<any> {
    const response = await this.axios.post(`/my/ships/${shipSymbol}/extract`)
    return response.data
  }

  async refuelShip(shipSymbol: string): Promise<any> {
    const response = await this.axios.post(`/my/ships/${shipSymbol}/refuel`)
    return response.data
  }

  async sellCargo(shipSymbol: string, symbol: string, units: number): Promise<any> {
    const response = await this.axios.post(`/my/ships/${shipSymbol}/sell`, {
      symbol,
      units
    })
    return response.data
  }

  async registerAgent(symbol: string, faction: string): Promise<any> {
    const response = await this.axios.post('/register', {
      symbol,
      faction
    })
    return response.data
  }

  /**
   * Get network status
   */
  get networkStatus() {
    return {
      isOnline: this.isOnline,
      hasToken: !!this.currentToken,
      agentSymbol: this.currentAgentSymbol
    }
  }

  /**
   * Clean expired timestamps from rate limit tracker
   */
  private cleanExpiredTimestamps(tracker: RateLimitTracker): void {
    const now = Date.now()
    
    // Clean old requests from tracking arrays and update the stored arrays
    tracker.burstRequests = tracker.burstRequests.filter(
      (time: number) => now - time < RATE_LIMIT_CONFIG.burstWindow
    )
    tracker.rateRequests = tracker.rateRequests.filter(
      (time: number) => now - time < RATE_LIMIT_CONFIG.rateWindow
    )
  }

  /**
   * Get rate limiter status
   */
  get rateLimiterStatus() {
    if (!this.currentToken) {
      return {
        hasToken: false,
        burstRequests: 0,
        burstLimit: RATE_LIMIT_CONFIG.burstLimit,
        rateRequests: 0,
        rateLimit: RATE_LIMIT_CONFIG.rateLimit,
        burstWindow: RATE_LIMIT_CONFIG.burstWindow,
        rateWindow: RATE_LIMIT_CONFIG.rateWindow,
        canMakeRequest: false
      }
    }

    const tracker = this.rateLimitTrackers.get(this.currentToken)
    if (!tracker) {
      return {
        hasToken: true,
        burstRequests: 0,
        burstLimit: RATE_LIMIT_CONFIG.burstLimit,
        rateRequests: 0,
        rateLimit: RATE_LIMIT_CONFIG.rateLimit,
        burstWindow: RATE_LIMIT_CONFIG.burstWindow,
        rateWindow: RATE_LIMIT_CONFIG.rateWindow,
        canMakeRequest: true
      }
    }

    // Clean expired timestamps from the tracker arrays
    this.cleanExpiredTimestamps(tracker)

    const burstRequests = tracker.burstRequests.length
    const rateRequests = tracker.rateRequests.length

    const canMakeRequest = burstRequests < RATE_LIMIT_CONFIG.burstLimit && 
                          rateRequests < RATE_LIMIT_CONFIG.rateLimit

    return {
      hasToken: true,
      burstRequests,
      burstLimit: RATE_LIMIT_CONFIG.burstLimit,
      rateRequests,
      rateLimit: RATE_LIMIT_CONFIG.rateLimit,
      burstWindow: RATE_LIMIT_CONFIG.burstWindow,
      rateWindow: RATE_LIMIT_CONFIG.rateWindow,
      canMakeRequest
    }
  }
}

// Create singleton instance
export const apiClient = new SpaceTradersApiClient()

// Export types
export type { AxiosResponse, AxiosRequestConfig }
