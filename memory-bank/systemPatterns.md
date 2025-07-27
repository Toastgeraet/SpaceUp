# System Patterns: SpaceTraders.io Management Interface

## Core Architecture

### Offline-First Architecture
The application follows offline-first principles where functionality works without internet connectivity first, then enhances when connected:

```
┌─────────────────────────────────────────────────────────┐
│                 Offline-First Layer                     │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ ┌─────────────────┐    ┌─────────────────┐             │
│ │  Local Storage  │    │  Action Queue   │             │
│ │                 │    │                 │             │
│ │ • Game State    │    │ • Pending Ops   │             │
│ │ • Ship Data     │    │ • Retry Logic   │             │
│ │ • Market Cache  │    │ • Sync Control  │             │
│ │ • Workflows     │    │ • Rate Limits   │             │
│ └─────────────────┘    └─────────────────┘             │
│                                                         │
├─────────────────────────────────────────────────────────┤
│                    Sync Layer                           │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ ┌─────────────────┐    ┌─────────────────┐             │
│ │   Client Mode   │    │   Server Mode   │             │
│ │                 │    │                 │             │
│ │ ┌─────────────┐ │    │ ┌─────────────┐ │             │
│ │ │   Browser   │ │    │ │   Node.js   │ │             │
│ │ │   Runtime   │ │    │ │   Runtime   │ │             │
│ │ └─────────────┘ │    │ └─────────────┘ │             │
│ │                 │    │                 │             │
│ │ Web Workers for │    │ Persistent      │             │
│ │ Background Tasks│    │ Background      │             │
│ │                 │    │ Execution       │             │
│ └─────────────────┘    └─────────────────┘             │
│        │                       │                       │
│        └───────────────────────┘                       │
└─────────────────────────┼─────────────────────────────┘
                          │
                  ┌───────────────┐
                  │ SpaceTraders  │
                  │     API       │
                  └───────────────┘
```

### Dual-Mode Agent System
The application supports two execution environments for automated agents, built on the offline-first foundation:

### Component Hierarchy

```
Application Root
├── Offline-First Layer
│   ├── Local Database (IndexedDB)
│   ├── Action Queue System
│   ├── Sync Manager
│   └── Conflict Resolution
├── Authentication Layer
├── Rate Limiter
├── API Client
├── State Management (Pinia)
├── UI Components (Vue 3 SFCs)
│   ├── Dashboard
│   ├── Manual Controls
│   └── Automation Builder
└── Agent Runtime
    ├── Client Runtime (Browser)
    └── Server Runtime (Optional)
```

## Key Technical Decisions

### Offline-First Data Management
- **Local-First Storage**: IndexedDB as primary data source for all game state
- **Action Queue Pattern**: All API operations queued locally first, then synchronized
- **Optimistic UI Updates**: UI updates immediately from local data, sync in background
- **Conflict Resolution**: Last-write-wins with user override for critical conflicts
- **Smart Caching**: Intelligent cache expiration based on data type and mutation frequency

### State Management Pattern
- **Pinia Store**: Vue 3 reactive state management with composition API integration
- **Local Storage Integration**: Automatic persistence of critical state to IndexedDB
- **Real-time Sync**: Background synchronization with intelligent retry logic
- **Rate-Aware Caching**: Batch API requests and respect rate limits during sync

### API Integration Pattern
- **Axios-Based Client**: Clean HTTP client with interceptors for offline-first behavior
- **Offline Queue**: Persistent queue for API operations when offline
- **Background Sync**: Automatic synchronization when connectivity returns
- **Automatic Retry**: Exponential backoff with jitter for failed requests
- **Request Deduplication**: Merge similar requests to minimize API calls
- **Error Handling**: Graceful degradation with local fallbacks

### Automation Workflow Pattern
- **Node-Based Architecture**: Visual nodes represent actions/conditions
- **Event-Driven Execution**: Workflows respond to game state changes
- **Serializable Workflows**: Save/load automation routines
- **Runtime Abstraction**: Same workflow runs in client or server mode

## Design Patterns In Use

### Offline-First Patterns

#### Command Pattern with Queue
- **Action Queue**: All operations as executable commands stored locally
- **Retry Logic**: Failed commands automatically retry with backoff
- **Batch Processing**: Similar commands batched to optimize API usage
- **Undo/Redo**: Reversible actions with local state rollback

#### Event Sourcing Light
- **Action Log**: Local log of all user actions and system events
- **State Reconstruction**: Rebuild application state from action history
- **Conflict Resolution**: Use action history to resolve sync conflicts
- **Audit Trail**: Complete history for debugging and analytics

#### Cache-Aside Pattern
- **Local Cache**: IndexedDB cache for all API responses
- **Cache Warming**: Proactive loading of likely-needed data
- **Smart Expiration**: Context-aware cache invalidation
- **Background Refresh**: Async cache updates without blocking UI

### Traditional Patterns

#### Observer Pattern (Vue 3 Reactivity)
- **Reactive State**: Vue 3's reactivity system for component updates
- **Pinia Subscriptions**: Store subscriptions for cross-component communication
- **Workflow Events**: Automation nodes emit/listen to events
- **Rate Limit Monitoring**: UI components react to rate limit status

#### Strategy Pattern
- **Runtime Selection**: Client vs Server execution strategies
- **Sync Strategies**: Different sync approaches based on connection quality
- **Action Handlers**: Different implementations for online/offline modes
- **Validation Strategies**: Context-aware input validation

#### Factory Pattern
- **Workflow Nodes**: Create different types of automation nodes
- **API Clients**: Generate configured API clients for different agents
- **Vue Components**: Dynamic component generation based on game state

#### Composition Pattern (Vue 3)
- **Composables**: Reusable logic extracted into composition functions
- **Feature Composition**: Complex features built from smaller composables
- **State Composition**: Multiple Pinia stores composed for complex state

## Component Relationships

### Offline-First Data Flow
```
User Input → Local Validation → Local State Update → UI Update (Immediate)
                                        ↓
                                Command Queue → Background Sync
                                        ↓
                           Rate Limiter → API Client → SpaceTraders API
                                        ↓
                        Conflict Check ← Response Processing ← API Response
                                        ↓
                         State Merge → UI Update (If Changed)
```

### Traditional Data Flow (Fallback)
```
User Input → Validation → Command → Rate Limiter → API Client → SpaceTraders API
                ↓
        State Update ← Response Processing ← API Response
                ↓
        UI Update → User Feedback
```

### Offline-First Automation Flow
```
Workflow Definition → Node Execution → Local State Check → Action Trigger
                                                ↓
                                        Local Command Queue → Immediate UI Feedback
                                                ↓
                                        Background Sync Queue → Rate Limiter
                                                ↓
                                        API Client → SpaceTraders API
                                                ↓
                                State Merge ← Response Processing ← API Response
                                        ↓
                                Workflow Continuation → Next Node
```

## Critical Implementation Paths

### Offline-First Bootstrap Flow
1. **Local Database Initialization**: Set up IndexedDB schema and migrations
2. **Cache Warming**: Load previously cached data if available
3. **Authentication Flow**: Token validation with local fallback
4. **State Hydration**: Restore application state from local storage
5. **Background Sync Setup**: Initialize sync workers and queue processing

### Authentication Flow
1. Token input and validation (with offline storage)
2. Agent selection/creation (cached options)
3. Initial game state fetch (background sync)
4. Rate limit baseline establishment
5. Local data synchronization

### Offline-First Manual Control Path
1. **Local Game State Display**: Show cached/current local state immediately
2. **Available Actions Detection**: Determine actions from local state
3. **User Action Selection**: Present options based on local data
4. **Optimistic Update**: Update local state and UI immediately
5. **Background Sync**: Queue action for API execution
6. **Conflict Resolution**: Handle any sync conflicts when online

### Offline-First Automation Path
1. **Local Workflow Storage**: Save workflows to IndexedDB immediately
2. **Offline Execution**: Run workflows against local state
3. **Action Queuing**: Queue automation actions for background sync
4. **Smart Scheduling**: Schedule workflows based on local conditions
5. **Sync Coordination**: Coordinate automation with background API sync

### Offline-First Rate Limiting Strategy
1. **Local Rate Tracking**: Track rate limits in local storage across sessions
2. **Intelligent Queuing**: Queue requests with priority and batching
3. **Predictive Spacing**: Predict optimal request timing based on queue
4. **User Transparency**: Show queue status and estimated sync times
5. **Adaptive Batching**: Batch similar requests to maximize throughput

## Error Handling Patterns

### API Error Handling
- **Network Errors**: Retry with exponential backoff
- **Rate Limit Errors**: Queue request for later execution
- **Authentication Errors**: Prompt for token refresh
- **Validation Errors**: Show user-friendly error messages

### Automation Error Handling
- **Node Execution Errors**: Skip to error handler node
- **Workflow Timeout**: Configurable timeout with cleanup
- **State Inconsistency**: Workflow pause with manual intervention option
- **Critical Errors**: Safe shutdown with state preservation

## Scalability Considerations

### Offline-First Scalability
- **IndexedDB Management**: Efficient storage with automatic cleanup
- **Sync Optimization**: Intelligent sync scheduling to minimize resource usage
- **Queue Management**: Priority-based queue processing with resource limits
- **Background Processing**: Service workers for efficient background sync
- **Data Pruning**: Automatic cleanup of old cached data

### Client-Side Scalability
- **Web Workers**: Offload sync operations and heavy computations
- **Lazy Loading**: Load Vue components as needed
- **Virtual Scrolling**: Handle large datasets efficiently
- **Memory Management**: Cleanup unused automation instances and cache
- **Reactive Efficiency**: Optimize Vue reactivity for large state trees

### Server-Side Scalability
- **Process Isolation**: Separate processes for different agents
- **Resource Monitoring**: CPU/memory usage tracking
- **Graceful Degradation**: Fallback to client mode if server unavailable
- **Horizontal Scaling**: Multiple server instances for load distribution
- **Database Scaling**: Efficient database design for multi-agent support
