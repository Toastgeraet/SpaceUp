# Technical Context: SpaceTraders.io Management Interface

## Technology Stack

### Frontend Framework
- **Primary**: Vue 3 with Composition API and Single File Components (SFCs)
- **TypeScript**: Full TypeScript integration for type safety and maintainability
- **State Management**: Pinia for Vue 3 reactive state management
- **Styling**: Tailwind CSS for rapid UI development and consistency
- **Build Tool**: Vite for fast development and optimized builds

### Offline-First Technologies
- **Local Database**: IndexedDB with Dexie.js for structured local storage
- **Service Workers**: Workbox for background sync and offline functionality
- **Caching Strategy**: Cache-first with background sync for optimal performance
- **Queue Management**: Custom persistent queue for offline operations

### UI Component Libraries
- **Base Components**: Headless UI Vue or PrimeVue for accessible primitives
- **Visualization**: D3.js or Chart.js for game data visualization
- **Workflow Editor**: Vue Flow (Vue 3 version) for node-based automation builder
- **Icons**: Lucide Vue or Heroicons Vue for consistent iconography

### Backend Technologies
- **Server Runtime**: Node.js with Express for optional server mode
- **Process Management**: PM2 for production server deployment
- **Database**: SQLite for local storage, PostgreSQL for remote server
- **Real-time Communication**: Socket.io for live updates

### API Integration
- **HTTP Client**: Axios with interceptors for offline-first behavior and rate limiting
- **Rate Limiting**: Custom implementation respecting SpaceTraders.io limits
- **Data Validation**: Zod for runtime type checking of API responses
- **Offline Sync**: Custom background sync with conflict resolution

## Development Setup

### Prerequisites
- Node.js 18+ (LTS recommended)
- npm or pnpm package manager
- Git for version control
- VSCode with Vue 3 extensions (Volar, Vue Language Features)

### Project Structure
```
spaceup/
├── src/
│   ├── components/        # Vue 3 SFC components
│   ├── views/            # Page-level Vue components
│   ├── composables/      # Vue 3 composition functions
│   ├── api/              # API client and types
│   ├── automation/       # Workflow engine and nodes
│   ├── stores/           # Pinia stores
│   ├── utils/            # Helper functions
│   ├── types/            # TypeScript type definitions
│   └── workers/          # Service workers and web workers
├── public/               # Static assets
├── server/               # Optional server mode components
├── docs/                 # Documentation
└── tests/                # Test files
```

### Development Commands
```bash
npm run dev          # Start development server
npm run build        # Production build
npm run test         # Run test suite
npm run lint         # Code linting
npm run type-check   # TypeScript validation
npm run preview      # Preview production build
```

## Technical Constraints

### SpaceTraders.io API Limitations
- **Rate Limits**: 
  - 2 requests per second (burst)
  - 10 requests per 10 seconds (sustained)
  - Per-agent token tracking required
- **Authentication**: Bearer token with account/agent hierarchy
- **Response Format**: JSON with standardized error structure
- **CORS**: Requires proper configuration for browser requests

### Browser Limitations
- **Background Processing**: Limited by browser tab lifecycle, mitigated by service workers
- **Storage**: IndexedDB storage limits (varies by browser and device)
- **Network**: Same-origin policy restrictions for API calls
- **Performance**: Memory limitations for large datasets and long-running processes

### Mobile/PWA Constraints
- **Offline Support**: Full offline-first functionality with service workers
- **Storage Quota**: Limited persistent storage on mobile devices
- **Performance**: Optimized for slower mobile connections and limited resources
- **Battery**: Efficient background processing to preserve battery life

## Dependencies

### Core Dependencies
```json
{
  "vue": "^3.4.x",
  "typescript": "^5.x",
  "pinia": "^2.x",
  "axios": "^1.x",
  "@vueuse/core": "^10.x",
  "vue-flow": "^1.x",
  "tailwindcss": "^3.x",
  "dexie": "^3.x",
  "workbox-webpack-plugin": "^7.x",
  "zod": "^3.x"
}
```

### Development Dependencies
```json
{
  "vite": "^5.x",
  "vitest": "^1.x",
  "eslint": "^8.x",
  "prettier": "^3.x",
  "@vue/eslint-config-typescript": "^12.x",
  "@vue/test-utils": "^2.x",
  "@vitejs/plugin-vue": "^5.x",
  "volar": "^1.x",
  "@types/node": "^20.x"
}
```

### Optional Server Dependencies
```json
{
  "express": "^4.x",
  "socket.io": "^4.x",
  "sqlite3": "^5.x",
  "pm2": "^5.x"
}
```

## Tool Usage Patterns

### Development Workflow
1. **Local Development**: Vite dev server with Vue 3 hot module replacement
2. **API Testing**: Built-in API explorer for testing endpoints with offline queue
3. **State Debugging**: Vue DevTools with Pinia integration
4. **Component Development**: Histoire (Vue Storybook alternative) for isolated component testing
5. **Offline Testing**: Service worker testing with Chrome DevTools

### Testing Strategy
- **Unit Tests**: Vitest for Vue component and composable testing
- **Integration Tests**: Vue Test Utils for user interaction testing
- **E2E Tests**: Playwright for full workflow testing including offline scenarios
- **API Mocking**: MSW for reliable API testing with offline queue simulation

### Code Quality
- **Linting**: ESLint with Vue 3 and TypeScript rules
- **Formatting**: Prettier with Vue 3 SFC support
- **Type Checking**: TypeScript strict mode with Vue 3 composition API types
- **Pre-commit Hooks**: Husky with lint-staged for automated quality checks

### Build and Deployment
- **Static Build**: Vite production build for client-only deployment
- **PWA Build**: Workbox for service worker generation and offline functionality
- **Server Build**: Separate build process for Node.js server
- **Docker**: Containerization for consistent deployment

## Performance Considerations

### Client-Side Optimization
- **Code Splitting**: Lazy loading of Vue components and automation builder
- **Bundle Analysis**: Rollup Bundle Analyzer for size optimization
- **Image Optimization**: WebP format with fallbacks
- **Memory Management**: Cleanup intervals for long-running workflows and IndexedDB
- **Vue Performance**: Proper use of computed properties and reactive refs

### Offline-First Performance
- **IndexedDB Optimization**: Efficient queries and batch operations
- **Service Worker Caching**: Strategic caching of critical resources
- **Background Sync**: Intelligent sync scheduling to avoid resource conflicts
- **Queue Prioritization**: Priority-based operation queues for optimal UX

### API Optimization
- **Request Batching**: Combine multiple API calls where possible
- **Intelligent Caching**: Cache based on data freshness requirements
- **Background Sync**: Queue non-critical updates for batch processing
- **Error Recovery**: Exponential backoff with jitter
- **Request Deduplication**: Merge identical requests in queue

### Data Handling
- **Virtual Scrolling**: Vue Virtual Scroller for large lists
- **Pagination**: Client-side pagination with background loading
- **Compression**: Gzip compression for API responses
- **Delta Updates**: Only sync changed data where possible

## Security Considerations

### Token Management
- **Secure Storage**: Encrypted storage for sensitive tokens in IndexedDB
- **Token Rotation**: Support for token refresh workflows
- **Scope Validation**: Verify token permissions before actions
- **Environment Separation**: Different tokens for dev/staging/production

### API Security
- **Input Validation**: Client and server-side validation with Zod schemas
- **Rate Limit Enforcement**: Prevent API abuse through local queue management
- **Error Sanitization**: Don't expose sensitive error details
- **HTTPS Only**: Enforce secure connections

### Client Security
- **CSP Headers**: Content Security Policy for XSS prevention
- **Dependency Scanning**: Regular security audits of dependencies
- **Data Sanitization**: Sanitize user inputs and API responses
- **Local Storage**: Encrypt sensitive data in IndexedDB storage

### Offline Security
- **Service Worker Security**: Secure service worker implementation
- **Data Integrity**: Checksums for cached data validation
- **Sync Security**: Secure background sync with authentication
- **Queue Protection**: Protect action queue from tampering
