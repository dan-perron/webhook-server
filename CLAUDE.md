# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A Node.js webhook server built with Express and TypeScript that integrates with Slack, MongoDB, and Yahoo Fantasy Sports. The primary purpose is managing Out of the Park Baseball (OOTP) league simulations through automated file watching, scheduled tasks, and Slack-based control.

## Development Commands

```bash
# Build TypeScript to JavaScript
yarn build

# Start the server (runs build first)
yarn start

# Linting
yarn lint:check  # Check for errors
yarn lint:fix    # Auto-fix linting errors

# Formatting
yarn format:check  # Check formatting
yarn format:write  # Auto-format files

# Combined fix (lint + format)
yarn fix

# Deploy to production
yarn deploy

# Setup husky hooks
yarn prepare
```

## Architecture

### Application Entry Points

The application has multiple entry points that run simultaneously:

1. **HTTP Server** (`src/bin/www.ts`): Express server listening on port 3000
2. **Slack Bot** (`src/bin/slackApi.ts`): Slack Bolt app in Socket Mode with slash commands and event listeners
3. **OOTP File Manager** (`src/bin/ootpFileManager.ts`): File watchers monitoring team uploads and league files
4. **Simulation Scheduler** (`src/bin/simulationScheduler.ts`): Cron job running every minute to check if simulations should run

All entry points are imported in `src/app.ts` so they initialize when the server starts.

### Key Components

**Slack Integration** (`src/clients/slack.ts`):

- Runs in Socket Mode (no HTTP endpoint needed for Slack events)
- Exported `app` is the Bolt App instance used throughout the codebase
- `channelMap` contains hardcoded Slack channel IDs for different purposes
- Helper functions: `sendMessage()`, `sendEphemeralMessage()`

**OOTP Simulation System**:

- **File Watching**: Monitors `/ootp/game/team_uploads/` for team submission files
- **State Machine**: Manages simulation states (scheduled, active, paused, completed)
- **Pause System**: Supports both user pauses and system pauses (e.g., waiting for files)
- **Scheduled Runs**: Simulations run every 48 hours OR when all teams submit, whichever comes first
- **Windows Facilitator**: External service that executes the actual OOTP simulation

**MongoDB Repositories** (`src/clients/mongo/repositories/`):

- `simulation.ts`: Manages simulation state (active, scheduled, pauses)
- `ootp.ts`: Tracks OOTP simulation history
- `reminders.ts`: Stores and retrieves channel-specific reminders
- `tokens.ts`: OAuth token storage

**AI Client Abstraction** (`src/clients/ai/`):

- `AIClient.ts`: Interface defining chat methods for different channels
- `openai.ts`: OpenAI implementation
- `googleAI.ts`: Google Gemini implementation
- Channel-specific prompts configured in `src/consts/prompts.ts`
- AI client selection controlled by `config.ai.client` setting

### Simulation Flow

1. Users upload team files to `/ootp/game/team_uploads/`
2. File watcher detects change and notifies Slack channel
3. When all teams submit OR 48-hour timer expires:
   - Scheduler calls `callSimulateEndpoint()` to trigger Windows Facilitator
   - System pauses added for `league_file` and `archive_file`
4. Windows Facilitator runs simulation and uploads results
5. File watchers detect new league file and reports archive
6. System pauses auto-removed when files detected
7. Slack notifications sent to users

Users can manually pause simulations with `/supercluster pause` and resume with `/supercluster resume`.

### Configuration

Configuration uses the `config` package with environment-specific files in `config/`:

- `default.cjs`: Default configuration with structure
- `local.cjs`: Local overrides (gitignored, not committed)

Required environment variables:

- `MONGODB_CONNSTRING`: MongoDB connection string
- Slack tokens, API keys defined in config files

## TypeScript Setup

- Compiles to `built/` directory
- Uses ES modules (`"type": "module"` in package.json)
- Module resolution: `nodenext`
- All imports must include `.js` extension (even for `.ts` files)
- Source maps enabled for debugging

## Code Style

- ESLint + Prettier enforced via husky pre-commit hooks
- Unused variables allowed if prefixed with underscore (`_variableName`)
- Pre-commit hook runs: `yarn build && yarn lint:check && yarn format:check`

## Important Files to Check

- `src/consts/slack.ts`: Authorized users and team-to-Slack mappings
- `src/utils/simulationStateMachine.ts`: Simulation state transitions
- `src/clients/mongo/types.ts`: `SimulationOptions` class defining simulation configuration
