# Technical Context: SpaceTraders.io Management Interface

## Technology Stack

### Frontend Framework
- **Primary**: React with TypeScript for type safety and maintainability
- **State Management**: Redux Toolkit or Zustand for centralized state
- **Styling**: Tailwind CSS for rapid UI development and consistency
- **Build Tool**: Vite for fast development and optimized builds

### UI Component Libraries
- **Base Components**: Headless UI or Radix UI for accessible primitives
- **Visualization**: D3.js or Recharts for game data visualization
- **Workflow Editor**: React Flow for node-based automation builder
- **Icons**: Lucide React or Heroicons for consistent iconography

### Backend Technologies
- **Server Runtime**: Node.js with Express for optional server mode
- **Process Management**: PM2 for production server deployment
- **Database**: SQLite for local storage, PostgreSQL for remote server
- **Real-time Communication**: Socket.io for live updates

### API Integration
- **HTTP Client**: Axios with interceptors for rate limiting and error handling
- **Rate Limiting**: Custom implementation respecting SpaceTraders.io limits
- **Data Validation**: Zod for runtime type checking of API responses
- **Caching**: React Query for client-side caching and synchronization

## Development Setup

### Prerequisites
- Node.js 18+ (LTS recommended)
- npm or pnpm package manager
- Git for version control
- VSCode with recommended extensions

### Project Structure
```
spaceup/
├── src/
│   ├── components/        # Reusable UI components
│   ├── pages/            # Page-level components
│   ├── api/              # API client and types
│   ├── automation/       # Workflow engine and nodes
│   ├── stores/           # State management
│   ├── utils/            # Helper functions
│   └── types/            # TypeScript type definitions
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
- **Background Processing**: Limited by browser tab lifecycle
- **Storage**: Local storage size constraints for workflow persistence
- **Network**: Same-origin policy restrictions
- **Performance**: Memory limitations for large datasets

### Mobile/PWA Constraints
- **Offline Support**: Service worker for basic offline functionality
- **Storage Quota**: Limited persistent storage on mobile devices
- **Performance**: Optimized for slower mobile connections
- **Battery**: Efficient background processing to preserve battery life

## Dependencies

### Core Dependencies
```json
{
  "react": "^18.x",
  "typescript": "^5.x",
  "axios": "^1.x",
  "react-query": "^5.x",
  "zustand": "^4.x",
  "react-flow": "^11.x",
  "tailwindcss": "^3.x"
}
```

### Development Dependencies
```json
{
  "vite": "^5.x",
  "vitest": "^1.x",
  "eslint": "^8.x",
  "prettier": "^3.x",
  "@types/react": "^18.x",
  "@testing-library/react": "^14.x"
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
1. **Local Development**: Vite dev server with hot module replacement
2. **API Testing**: Built-in API explorer for testing endpoints
3. **State Debugging**: Redux DevTools or Zustand DevTools
4. **Component Development**: Storybook for isolated component testing

### Testing Strategy
- **Unit Tests**: Vitest for component and utility testing
- **Integration Tests**: Testing Library for user interaction testing
- **E2E Tests**: Playwright for full workflow testing
- **API Mocking**: MSW for reliable API testing

### Code Quality
- **Linting**: ESLint with React and TypeScript rules
- **Formatting**: Prettier with automatic formatting
- **Type Checking**: TypeScript strict mode
- **Pre-commit Hooks**: Husky with lint-staged

### Build and Deployment
- **Static Build**: Vite production build for client-only deployment
- **PWA Build**: Workbox for service worker generation
- **Server Build**: Separate build process for Node.js server
- **Docker**: Containerization for consistent deployment

## Performance Considerations

### Client-Side Optimization
- **Code Splitting**: Lazy loading of automation builder and advanced features
- **Bundle Analysis**: Webpack Bundle Analyzer for size optimization
- **Image Optimization**: WebP format with fallbacks
- **Memory Management**: Cleanup intervals for long-running workflows

### API Optimization
- **Request Batching**: Combine multiple API calls where possible
- **Intelligent Caching**: Cache based on data freshness requirements
- **Background Sync**: Queue non-critical updates for batch processing
- **Error Recovery**: Exponential backoff with jitter

### Data Handling
- **Virtualization**: React Window for large lists
- **Pagination**: Server-side pagination for large datasets
- **Compression**: Gzip compression for API responses
- **Delta Updates**: Only sync changed data where possible

## Security Considerations

### Token Management
- **Secure Storage**: Encrypted storage for sensitive tokens
- **Token Rotation**: Support for token refresh workflows
- **Scope Validation**: Verify token permissions before actions
- **Environment Separation**: Different tokens for dev/staging/production

### API Security
- **Input Validation**: Client and server-side validation
- **Rate Limit Enforcement**: Prevent API abuse
- **Error Sanitization**: Don't expose sensitive error details
- **HTTPS Only**: Enforce secure connections

### Client Security
- **CSP Headers**: Content Security Policy for XSS prevention
- **Dependency Scanning**: Regular security audits of dependencies
- **Data Sanitization**: Sanitize user inputs and API responses
- **Local Storage**: Encrypt sensitive data in browser storage
