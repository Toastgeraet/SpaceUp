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
      origin: {
        symbol: string
        type: string
        systemSymbol: string
        x: number
        y: number
      }
      destination: {
        symbol: string
        type: string
        systemSymbol: string
        x: number
        y: number
      }
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

export interface Waypoint {
  symbol: string
  type: string
  systemSymbol: string
  x: number
  y: number
  orbitals?: Array<{
    symbol: string
  }>
  traits?: Array<{
    symbol: string
    name: string
    description: string
  }>
  modifiers?: Array<{
    symbol: string
    name: string
    description: string
  }>
  chart?: {
    waypointSymbol?: string
    submittedBy?: string
    submittedOn?: string
  }
  faction?: {
    symbol: string
  }
  isUnderConstruction?: boolean
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
  ships!: EntityTable<Ship, 'symbol'>
  waypoints!: EntityTable<Waypoint, 'symbol'>
  actionQueue!: EntityTable<ActionQueue, 'id'>
  apiCache!: EntityTable<ApiCache, 'id'>
  systemData!: EntityTable<SystemData, 'id'>
  marketData!: EntityTable<MarketData, 'id'>
  authTokens!: EntityTable<AuthToken, 'id'>

  constructor() {
    super('SpaceUpDB')
    
    this.version(3).stores({
      agents: '++id, symbol, accountId, createdAt',
      ships: 'symbol, agentSymbol, nav.systemSymbol, nav.waypointSymbol',
      waypoints: 'symbol, systemSymbol, type, x, y, updatedAt',
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

    this.waypoints.hook('creating', (primKey, obj: Waypoint, trans) => {
      obj.updatedAt = new Date()
    })

    this.waypoints.hook('updating', (modifications: Partial<Waypoint>, primKey, obj, trans) => {
      modifications.updatedAt = new Date()
    })

    this.actionQueue.hook('creating', (primKey, obj: ActionQueue, trans) => {
      obj.createdAt = new Date()
    })
  }
}

// Create database instance
export const db = new SpaceUpDB()

// Database management utilities
export async function resetDatabase(): Promise<void> {
  console.log('Resetting database due to schema changes...')
  try {
    await db.delete()
    await db.open()
    console.log('Database reset successfully')
  } catch (error) {
    console.error('Failed to reset database:', error)
    throw error
  }
}

// Check if database needs to be reset due to schema incompatibility
export async function checkDatabaseCompatibility(): Promise<void> {
  try {
    // Try to access ships table with new schema
    await db.ships.limit(1).toArray()
  } catch (error) {
    if (error instanceof Error && (
      error.message.includes('UpgradeError') || 
      error.message.includes('primary key') ||
      error.message.includes('schema')
    )) {
      console.log('Database schema incompatible, resetting...')
      await resetDatabase()
    } else {
      throw error
    }
  }
}
