# Project Brief: SpaceTraders.io Management Interface

## Overview
We are developing a comprehensive management interface for the headless space 4x browser game SpaceTraders.io. This interface will include:
- Manual game controls and visualization
- Automatic agent routines and automation system
- Analytics tools and data visualization
- Progressive Web App (PWA) capabilities for mobile companion app

## Core Requirements

### API Integration
- **REST API**: https://api.spacetraders.io/v2
- **Authentication**: Bearer token scheme (account tokens + agent tokens)
- **Rate Limiting**: Must implement rate limiter for all API requests per account token
- **Rate Limit Info**: https://spacetraders.io/api-guide/rate-limits

### Initial Implementation Path
Follow the quickstart guide to implement basic game features:
1. New game setup: https://spacetraders.io/quickstart/new-game
2. First mission: https://spacetraders.io/quickstart/first-mission
3. Purchase ship: https://spacetraders.io/quickstart/purchase-ship
4. Mine asteroids: https://spacetraders.io/quickstart/mine-asteroids
5. Sell cargo: https://spacetraders.io/quickstart/sell-cargo
6. Last steps: https://spacetraders.io/quickstart/last-steps

**Goal**: Create UI for all API features to enable quick tutorial completion.

### Key Automation System
Implement a "low-code" visual editor (similar to n8n/Node-RED) supporting:
- Action chaining ("Action B" after "Action A" completes)
- Timed actions
- Repeated actions
- Counters and conditions
- Loops
- Visual workflow builder

### Architecture Requirements

#### Dual-Mode Agent System
1. **Serverless Mode**: Agents run in browser tab only, executed on device (with background workers)
2. **Remote Mode**: Server component for offline execution (Raspberry Pi or cloud deployment)

### Future Features
- Notification system
- PWA/mobile companion app
- Analytics and visualization tools

## Success Criteria
- Complete quickstart guide implementation with UI
- Functional rate limiting system
- Basic automation workflow editor
- Dual-mode architecture foundation
- Extensible codebase for future enhancements

## Project Scope
- **Phase 1**: Basic UI and quickstart guide implementation
- **Phase 2**: Automation system and visual editor
- **Phase 3**: PWA, notifications, and advanced analytics
