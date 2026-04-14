# Security Rules

## Data
- Keep user data local by default.
- Do not commit secrets.
- Store API keys in environment variables only.

## Command Execution
- Block dangerous patterns by default.
- Ask confirmation for destructive or sensitive actions.
- Maintain allowlist-first behavior for system control.

## Privacy
- No cloud sync in v1.
- Explicit opt-in before any future remote backup.

## Safety Logging
- Record command type, timestamp, result status, and error reason.
- Do not log sensitive content unnecessarily.
