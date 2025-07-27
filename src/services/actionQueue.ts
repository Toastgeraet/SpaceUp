import { db, type ActionQueue } from '@/db/schema'
import { reactive, ref } from 'vue'

export interface QueuedAction {
  type: ActionQueue['type']
  payload: any
  shipSymbol?: string
  agentSymbol: string
  priority?: number
  scheduledAt?: Date
}

class ActionQueueService {
  private isProcessing = ref(false)
  private processingInterval: number | null = null
  private readonly PROCESSING_INTERVAL = 500 // Process every 500ms
  private readonly MAX_RETRIES = 3
  private readonly RETRY_DELAYS = [1000, 5000, 15000] // Exponential backoff

  // Queue statistics
  public stats = reactive({
    pending: 0,
    processing: 0,
    completed: 0,
    failed: 0,
    totalToday: 0
  })

  constructor() {
    this.updateStats()
  }

  /**
   * Add an action to the offline queue
   */
  async enqueue(action: QueuedAction): Promise<number> {
    const queueItem: Partial<ActionQueue> = {
      type: action.type,
      payload: action.payload,
      shipSymbol: action.shipSymbol,
      agentSymbol: action.agentSymbol,
      status: 'pending',
      priority: action.priority || 0,
      scheduledAt: action.scheduledAt || new Date(),
      attemptCount: 0
    }

    const id = await db.actionQueue.add(queueItem as ActionQueue)
    await this.updateStats()
    
    // Start processing if not already running
    if (!this.isProcessing.value) {
      this.startProcessing()
    }

    return id as number
  }

  /**
   * Get pending actions for a specific agent
   */
  async getPendingActions(agentSymbol: string): Promise<ActionQueue[]> {
    const actions = await db.actionQueue
      .where('agentSymbol')
      .equals(agentSymbol)
      .and(item => item.status === 'pending')
      .toArray()
    
    return actions.sort((a, b) => b.priority - a.priority)
  }

  /**
   * Get all actions for a specific ship
   */
  async getShipActions(shipSymbol: string): Promise<ActionQueue[]> {
    const actions = await db.actionQueue
      .where('shipSymbol')
      .equals(shipSymbol)
      .toArray()
    
    return actions.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
  }

  /**
   * Update queue statistics
   */
  private async updateStats() {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const [pending, processing, completed, failed, totalToday] = await Promise.all([
      db.actionQueue.where('status').equals('pending').count(),
      db.actionQueue.where('status').equals('processing').count(),
      db.actionQueue.where('status').equals('completed').count(),
      db.actionQueue.where('status').equals('failed').count(),
      db.actionQueue.where('createdAt').above(today).count()
    ])

    this.stats.pending = pending
    this.stats.processing = processing
    this.stats.completed = completed
    this.stats.failed = failed
    this.stats.totalToday = totalToday
  }

  /**
   * Start processing the action queue
   */
  startProcessing() {
    if (this.isProcessing.value) return

    this.isProcessing.value = true
    this.processingInterval = window.setInterval(async () => {
      await this.processNext()
    }, this.PROCESSING_INTERVAL)
  }

  /**
   * Stop processing the action queue
   */
  stopProcessing() {
    this.isProcessing.value = false
    if (this.processingInterval) {
      clearInterval(this.processingInterval)
      this.processingInterval = null
    }
  }

  /**
   * Process the next item in the queue
   */
  private async processNext(): Promise<void> {
    try {
      // Get the next pending action with highest priority
      const pendingActions = await db.actionQueue
        .where('status')
        .equals('pending')
        .and(item => item.scheduledAt <= new Date())
        .toArray()

      if (pendingActions.length === 0) {
        return // No actions to process
      }

      // Sort by priority (highest first) and get the first one
      const nextAction = pendingActions.sort((a, b) => b.priority - a.priority)[0]

      // Mark as processing
      await db.actionQueue.update(nextAction.id!, {
        status: 'processing',
        lastAttempt: new Date()
      })

      await this.updateStats()

      try {
        // Process the action based on type
        await this.executeAction(nextAction)

        // Mark as completed
        await db.actionQueue.update(nextAction.id!, {
          status: 'completed'
        })
      } catch (error) {
        // Handle failure
        const attemptCount = (nextAction.attemptCount || 0) + 1
        
        if (attemptCount >= this.MAX_RETRIES) {
          // Max retries reached, mark as failed
          await db.actionQueue.update(nextAction.id!, {
            status: 'failed',
            attemptCount,
            error: error instanceof Error ? error.message : 'Unknown error'
          })
        } else {
          // Schedule retry with exponential backoff
          const retryDelay = this.RETRY_DELAYS[attemptCount - 1] || this.RETRY_DELAYS[this.RETRY_DELAYS.length - 1]
          const scheduledAt = new Date(Date.now() + retryDelay)

          await db.actionQueue.update(nextAction.id!, {
            status: 'pending',
            attemptCount,
            scheduledAt,
            error: error instanceof Error ? error.message : 'Unknown error'
          })
        }
      }

      await this.updateStats()

    } catch (error) {
      console.error('Error processing action queue:', error)
    }
  }

  /**
   * Execute a specific action
   */
  private async executeAction(action: ActionQueue): Promise<void> {
    // This will be implemented when we create the API client
    // For now, we'll just simulate the action
    console.log(`Executing action: ${action.type}`, action.payload)
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 100))
    
    // TODO: Implement actual API calls based on action type
    switch (action.type) {
      case 'navigate':
        // await apiClient.navigate(action.payload)
        break
      case 'extract':
        // await apiClient.extract(action.payload)
        break
      case 'dock':
        // await apiClient.dock(action.payload)  
        break
      case 'orbit':
        // await apiClient.orbit(action.payload)
        break
      case 'refuel':
        // await apiClient.refuel(action.payload)
        break
      case 'sell':
        // await apiClient.sell(action.payload)
        break
      case 'purchase':
        // await apiClient.purchase(action.payload)
        break
      case 'survey':
        // await apiClient.survey(action.payload)
        break
      default:
        throw new Error(`Unknown action type: ${action.type}`)
    }
  }

  /**
   * Cancel a pending action
   */
  async cancelAction(actionId: number): Promise<void> {
    const action = await db.actionQueue.get(actionId)
    if (action && action.status === 'pending') {
      await db.actionQueue.update(actionId, { status: 'failed', error: 'Cancelled by user' })
      await this.updateStats()
    }
  }

  /**
   * Clear completed and failed actions
   */
  async clearCompleted(): Promise<void> {
    await db.actionQueue
      .where('status')
      .anyOf(['completed', 'failed'])
      .delete()
    
    await this.updateStats()
  }

  /**
   * Get queue status
   */
  get status() {
    return {
      isProcessing: this.isProcessing.value,
      stats: this.stats
    }
  }
}

// Create singleton instance
export const actionQueue = new ActionQueueService()

// Export for use in components
export { ActionQueueService }
