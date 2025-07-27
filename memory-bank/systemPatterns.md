# System Patterns: SpaceTraders.io Management Interface

## Core Architecture

### Dual-Mode Agent System
The application supports two execution environments for automated agents:

```
┌─────────────────┐    ┌─────────────────┐
│   Client Mode   │    │   Server Mode   │
│                 │    │                 │
│ ┌─────────────┐ │    │ ┌─────────────┐ │
│ │   Browser   │ │    │ │   Node.js   │ │
│ │   Runtime   │ │    │ │   Runtime   │ │
│ └─────────────┘ │    │ └─────────────┘ │
│                 │    │                 │
│ Web Workers for │    │ Persistent      │
│ Background Tasks│    │ Background      │
│                 │    │ Execution       │
└─────────────────┘    └─────────────────┘
        │                       │
        └───────────────────────┘
                    │
            ┌───────────────┐
            │ SpaceTraders  │
            │     API       │
            └───────────────┘
```

### Component Hierarchy

```
Application Root
├── Authentication Layer
├── Rate Limiter
├── API Client
├── State Management
├── UI Components
│   ├── Dashboard
│   ├── Manual Controls
│   └── Automation Builder
└── Agent Runtime
    ├── Client Runtime (Browser)
    └── Server Runtime (Optional)
```

## Key Technical Decisions

### State Management Pattern
- **Centralized Store**: Single source of truth for application state
- **Real-time Sync**: WebSocket or polling for live game updates
- **Optimistic Updates**: UI updates immediately, rollback on API errors
- **Rate-Aware Caching**: Cache API responses to minimize rate limit usage

### API Integration Pattern
- **Client Wrapper**: Abstraction layer over raw SpaceTraders API
- **Automatic Retry**: Exponential backoff for rate-limited requests
- **Request Queuing**: Queue system to respect rate limits
- **Error Handling**: Consistent error propagation and user feedback

### Automation Workflow Pattern
- **Node-Based Architecture**: Visual nodes represent actions/conditions
- **Event-Driven Execution**: Workflows respond to game state changes
- **Serializable Workflows**: Save/load automation routines
- **Runtime Abstraction**: Same workflow runs in client or server mode

## Design Patterns In Use

### Observer Pattern
- **Game State Updates**: Components subscribe to state changes
- **Workflow Events**: Automation nodes emit/listen to events
- **Rate Limit Monitoring**: UI components react to rate limit status

### Strategy Pattern
- **Runtime Selection**: Client vs Server execution strategies
- **Action Handlers**: Different implementations for game actions
- **Validation Strategies**: Context-aware input validation

### Factory Pattern
- **Workflow Nodes**: Create different types of automation nodes
- **API Clients**: Generate configured API clients for different agents
- **UI Components**: Dynamic component generation based on game state

### Command Pattern
- **Action Queue**: All game actions as executable commands
- **Undo/Redo**: Reversible actions where possible
- **Macro Recording**: Capture user actions as command sequences

## Component Relationships

### Core Data Flow
```
User Input → Validation → Command → Rate Limiter → API Client → SpaceTraders API
                ↓
        State Update ← Response Processing ← API Response
                ↓
        UI Update → User Feedback
```

### Automation Flow
```
Workflow Definition → Node Execution → Game State Check → Action Trigger
                                                ↓
                         Rate Limiter ← Command Queue ← Action Generation
                                ↓
                        API Client → SpaceTraders API
                                ↓
                        State Update → Workflow Continuation
```

## Critical Implementation Paths

### Authentication Flow
1. Token input and validation
2. Agent selection/creation
3. Initial game state fetch
4. Rate limit baseline establishment

### Manual Game Control Path
1. Game state display
2. Available actions detection
3. User action selection
4. Action validation and execution
5. State update and UI refresh

### Automation Setup Path
1. Workflow canvas initialization
2. Node palette and drag-drop
3. Node configuration interfaces
4. Workflow validation and testing
5. Runtime deployment (client/server)

### Rate Limiting Strategy
1. Request tracking per agent token
2. Dynamic request queuing
3. User feedback on rate limit status
4. Automatic request spacing

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

### Client-Side Scalability
- **Web Workers**: Offload heavy computations
- **Lazy Loading**: Load components as needed
- **Virtual Scrolling**: Handle large datasets efficiently
- **Memory Management**: Cleanup unused automation instances

### Server-Side Scalability
- **Process Isolation**: Separate processes for different agents
- **Resource Monitoring**: CPU/memory usage tracking
- **Graceful Degradation**: Fallback to client mode if server unavailable
- **Horizontal Scaling**: Multiple server instances for load distribution
