## Brief overview
Development preferences and patterns specific to this project and general workflow, including tool usage patterns and architectural preferences observed during SpaceUp development.

## Command execution preferences
- Always use full path `/c/Program Files/nodejs/npx.cmd` instead of `npx` for Node.js package execution
- This ensures consistent execution in Windows environments where npx might not be in PATH

## Project architecture preferences
- Prefer offline-first architecture patterns with IndexedDB and service workers as foundation
- Use Vue 3 with Composition API and TypeScript for type safety
- Implement PWA capabilities with Workbox for background sync and caching
- Structure projects with comprehensive documentation in memory-bank system

## Technology stack preferences
- Vue 3 with TypeScript, Pinia for state management
- Tailwind CSS for styling with utility-first approach
- Vite as build tool for fast development
- Dexie.js for IndexedDB operations
- Axios for HTTP client with offline interceptors

## Development workflow
- Follow phased development approach with clear milestones
- Maintain comprehensive project documentation in memory-bank structure
- Implement rate limiting and API client patterns for external API integration
- Use strict TypeScript configuration for type safety

## Documentation approach
- Maintain detailed memory bank with project context, progress tracking, and technical decisions
- Document architectural decisions and patterns for offline-first development
- Keep activeContext.md updated with current work status and next steps
