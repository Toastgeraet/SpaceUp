## Brief overview
Git commit message formatting guidelines specific to this project, based on established commit history patterns and development workflow preferences.

## Commit message format
- Use present tense, imperative mood (e.g., "Fix rate limiter", not "Fixed rate limiter" or "Fixes rate limiter")
- Start with an action verb that describes what the commit accomplishes
- Capitalize the first word
- Keep messages concise but descriptive (typically under 50 characters for the subject line)
- No periods at the end of commit messages
- Focus on what the commit accomplishes, not the process

## Commit message examples
- "Refine error handling"
- "Add automatic login option for dev mode"
- "Fix a zod validation error with the ships endpoint"
- "Implement Phase 1"
- "Initialize vue project spaceup"

## Commit scope and content
- Each commit should represent a logical unit of work
- Avoid combining unrelated changes in a single commit
- For API-related fixes, mention the specific component or endpoint when relevant
- For feature additions, use "Add" or "Implement" as the leading verb
- For bug fixes, use "Fix" as the leading verb
- For improvements or refinements, use "Refine", "Improve", or "Update" as appropriate
