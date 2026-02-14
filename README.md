# SO360 Insight Frontend

SO360 Insight MFE - KPI & Signal Analysis Dashboard

## Overview

The Insight frontend provides a beautiful, real-time dashboard for viewing KPIs and managing intelligent signals across all SO360 modules.

## Features

- **Insight Dashboard**: Real-time KPI cards with trend indicators
- **Signals Panel**: Active signals with severity badges and resolution actions
- **Module Insights**: Module-specific KPI and signal views
- **Dark Theme**: Premium slate color palette matching SO360 design system
- **Responsive Design**: Mobile, tablet, and desktop layouts

## Tech Stack

- React 19.2
- Vite 5.4
- TypeScript 5.7
- Tailwind CSS 3.4
- React Router 7.12
- Framer Motion 12
- Lucide React
- Axios

## Port

Development: `3024`
Preview (Production Build): `3024`

## Module Federation

- **Federation Name**: `insight_app`
- **Exposed**: `./App`
- **Remote Entry**: `http://localhost:3024/assets/remoteEntry.js`

## Installation

```bash
npm install
```

## Running the MFE

**CRITICAL: Always use build + preview for MFEs**

```bash
# Build the MFE
npm run build

# Serve the production build (required for Module Federation)
npm run preview
```

DO NOT use `npm run dev` - it does not produce a valid `remoteEntry.js`.

## Environment Variables

Create `.env` file (see `.env.example`):

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_API_BASE_URL=http://localhost:3023
```

## Routes

- `/insight/dashboard` - Main insight dashboard
- `/insight/signals` - Signals management page

## Integration with Shell

The Shell loads this MFE via Module Federation:

```typescript
// In Shell vite.config.ts
remotes: {
    insight_app: 'http://localhost:3024/assets/remoteEntry.js',
}

// In Shell App.tsx
<Route path="/insight/*" element={<RemoteInsight />} />
```

## MFE Initializer Pattern

The `MfeShellInitializer` component syncs with Shell context before rendering:

```typescript
// Waits for tenant and org IDs from Shell
// Sets API client headers automatically
// Shows loading state until synced
```

## API Client

The `insightApi` client auto-injects multi-tenant headers:

```typescript
import { insightApi } from './services/insightApi';

// Headers automatically added from Shell context
const dashboard = await insightApi.getDashboard();
```

## Shared Packages

- `@so360/shell-context` - Shell context hooks
- `@so360/design-system` - Shared UI components
- `@so360/event-bus` - Event-driven communication

## Development Workflow

1. Make code changes
2. Rebuild: `npm run build`
3. Restart preview: `npm run preview`
4. Verify `remoteEntry.js` accessible at http://localhost:3024/assets/remoteEntry.js

## Testing

```bash
# Lint code
npm run lint
```

## Notes

- All data fetching goes through NestJS backend (no direct Supabase access)
- Dark theme matches SO360 design standards
- Signals can be resolved directly from UI
- KPIs computed in real-time by backend
- Module Federation requires production build (preview mode)
