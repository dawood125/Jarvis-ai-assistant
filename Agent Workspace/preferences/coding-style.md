# Coding Style and Standards

## General
- Keep modules small and focused.
- Prefer clear naming over short naming.
- Keep public APIs stable while iterating internals.

## Frontend
- Use design tokens for colors, spacing, radius, typography, and motion.
- Build reusable components before one-off styling.
- Keep animation meaningful and performance-safe.

## Backend and Command Safety
- Validate intent before execution.
- Require explicit confirmation for destructive actions.
- Log command outcomes for auditability.

## Quality
- Add basic tests for critical logic.
- Prefer predictable error handling and user-friendly messages.
