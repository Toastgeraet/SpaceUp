import Dexie, { type EntityTable } from 'dexie'

// Define the data structures for offline-first storage
export interface Agent {
  id?: number
  symbol: string
  headquarters: string
  credits: number
  startingFaction: string
  shipCount: number
  accountId: string
  createdAt: Date
  updatedAt: Date
}

export interface Ship {
  id?: number
  symbol: string
  registration: {
    name: string
    factionSymbol: string
    role: string
  }
  nav: {
    systemSymbol: string
    waypointSymbol: string
    route: {
      origin: string
      destination: string
      arrival: string
      departureTime: string
    }
    status: string
    flightMode: string
  }
  crew: {
    current: number
    required: number
    capacity: number
    rotation: string
    morale: number
    wages: number
  }
  frame: any
  reactor: any
  engine: any
  cooldown: {
    shipSymbol: string
    totalSeconds: number
    remainingSeconds: number
    expiration?: string
  }
  modules: any[]
  mounts: any[]
  cargo: {
    capacity: number
    units: number
    inventory: any[]
  }
  fuel: {
    current: number
    capacity: number
    consumed?: {
      amount: number
      timestamp: string
    }
  }
  agentSymbol: string
  updatedAt: Date
}

export interface ActionQueue {
  id?: number
  type: 'navigate' | 'extract' | 'dock' | 'orbit' | 'refuel' | 'sell' | 'purchase' | 'survey'
  payload: any
  shipSymbol?: string
  agentSymbol: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  priority: number
  scheduledAt: Date
  attemptCount: number
  lastAttempt?: Date
  error?: string
  createdAt: Date
}

export interface ApiCache {
  id?: number
  endpoint: string
  params: string
  response: any
  expiresAt: Date
  createdAt: Date
}

export interface SystemData {
  id?: number
  symbol: string
  type: string
  x: number
  y: number
  waypoints: any[]
  factions: any[]
  updatedAt: Date
}

export interface MarketData {
  id?: number
  waypointSymbol: string
  systemSymbol: string
  tradeGoods: any[]
  transactions: any[]
  updatedAt: Date
}

export interface AuthToken {
  id?: number
  token: string
  agentSymbol: string
  accountId: string
  isActive: boolean
  createdAt: Date
  expiresAt?: Date
}

// Define the database schema
export class SpaceUpDB extends Dexie {
  agents!: EntityTable<Agent, 'id'>
  ships!: EntityTable<Ship, 'id'>
  actionQueue!: EntityTable<ActionQueue, 'id'>
  apiCache!: EntityTable<ApiCache, 'id'>
  systemData!: EntityTable<SystemData, 'id'>
  marketData!: EntityTable<MarketData, 'id'>
  authTokens!: EntityTable<AuthToken, 'id'>

  constructor() {
    super('SpaceUpDB')
    
    this.version(1).stores({
      agents: '++id, symbol, accountId, createdAt',
      ships: '++id, symbol, agentSymbol, nav.systemSymbol, nav.waypointSymbol',
      actionQueue: '++id, agentSymbol, shipSymbol, status, priority, scheduledAt, createdAt',
      apiCache: '++id, endpoint, params, expiresAt',
      systemData: '++id, symbol, type, x, y',
      marketData: '++id, waypointSymbol, systemSymbol, updatedAt',
      authTokens: '++id, agentSymbol, accountId, isActive, createdAt'
    })

    // Add hooks for automatic timestamp updates
    this.agents.hook('creating', (primKey, obj: Agent, trans) => {
      obj.createdAt = new Date()
      obj.updatedAt = new Date()
    })

    this.agents.hook('updating', (modifications: Partial<Agent>, primKey, obj, trans) => {
      modifications.updatedAt = new Date()
    })

    this.ships.hook('creating', (primKey, obj: Ship, trans) => {
      obj.updatedAt = new Date()
    })

    this.ships.hook('updating', (modifications: Partial<Ship>, primKey, obj, trans) => {
      modifications.updatedAt = new Date()
    })

    this.actionQueue.hook('creating', (primKey, obj: ActionQueue, trans) => {
      obj.createdAt = new Date()
    })
  }
}

// Create database instance
export const db = new SpaceUpDB()
