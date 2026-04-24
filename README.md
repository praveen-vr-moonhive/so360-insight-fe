# SO360 Insight Frontend

React MFE providing the Insight analytics dashboard — cross-module KPI cards, business segment deep-dives, signal management, AI-generated summaries, and 10 chart types. Loaded by the Shell at `/insight/*`.

## Module Federation Details

| | |
|-|-|
| Federation Name | `insight_app` |
| Remote Entry | `http://localhost:3024/assets/remoteEntry.js` |
| Exposed Module | `./App` |
| Port | 3024 |
| Shell Route | `/insight/*` |
| Shell Wrapper | `RemoteInsight.tsx` in `so360-shell-fe` |

## Tech Stack

| | |
|-|-|
| Framework | React 19.2 |
| Build Tool | Vite 5.4 |
| Language | TypeScript 5.7 |
| Styling | Tailwind CSS 3.4 |
| Federation | @originjs/vite-plugin-federation 1.4 |
| Animation | Framer Motion 12 |
| State | React Query (server state) + URL state (filters) |
| Runtime | Node.js 22.12+ |

## Shared Singletons
`react`, `react-dom`, `react-router-dom`, `framer-motion`, `lucide-react`, `@so360/shell-context`, `@so360/design-system`, `@so360/event-bus`

## Pages & Routes

| Route | Component | Description |
|-------|-----------|-------------|
| `/insight` | `InsightDashboard` | Top-level KPI summary and signals overview |
| `/insight/dashboard` | `Dashboard` | Full dashboard with segment cards and data freshness |
| `/insight/signals` | `SignalsPage` | Signal list with severity filter, module filter, resolution |
| `/insight/segment` | `SegmentOverview` | All 5 business segments with summary metrics |
| `/insight/segment/:code` | `SegmentDetail` | Deep-dive: charts, KPI trends, AI summary |

**Business Segments:** `revenue`, `execution`, `delivery`, `workforce`, `finance`

## Key Components

### KPI & Signal Display
| Component | Purpose |
|-----------|---------|
| `KPICard` | KPI metric card with trend indicator and sparkline |
| `SignalCard` | Signal alert with severity badge and resolve action |
| `NeuraSummaryCard` | AI-generated narrative summary for segment |
| `DataFreshnessIndicator` | Shows last computation timestamp and staleness |

### Chart Components (10 types)
| Component | Use Case |
|-----------|---------|
| `BarChart` | Comparison metrics |
| `LineChart` | Time-series trends |
| `AreaChart` | Cumulative metrics |
| `PieChart` | Distribution / composition |
| `FunnelChart` | Conversion / pipeline stages |
| `GaugeChart` | Target vs actual |
| `WaterfallChart` | Variance / bridge analysis |
| `SparklineChart` | Compact inline trend |
| `ChartContainer` | Responsive wrapper for all charts |
| `ChartExport` | Export chart data (CSV/PNG) |

## How to Run

### Prerequisites
Build shared packages before starting:
```bash
cd so360-shell-fe/packages/shell-context && npm run build
cd so360-shell-fe/packages/design-system && npm run build
cd so360-shell-fe/packages/event-bus && npm run build
cd so360-shell-fe/packages/formatters && npm run build
```

### MFE Preview Mode (Shell integration)
```bash
npm install
npm run build && npm run preview    # port 3024
```

### Standalone Dev Mode
```bash
npm run dev    # port 3024, standalone only
```

> **Never use `npm run dev` for Shell integration.** Must use `build && preview` to produce `remoteEntry.js`.

## Environment Variables
```env
VITE_BASE_URL=http://localhost:3024/
VITE_SO360_INSIGHT_API=http://localhost:3023
VITE_SO360_CORE_API=http://localhost:3000
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

## UI Theme (Premium Dark Mode)

```
Pages:     bg-slate-950
Cards:     bg-slate-900/50 border border-slate-800
Text:      text-slate-100 (primary) / text-slate-400 (secondary)
Charts:    recharts with slate/blue color tokens
```

## Cross-Module Integrations

- **Neura FE**: Neura reads AI summaries from Insight BE; `NeuraPanel` can show segment summaries inline
- **Shell**: Publishes `SIGNAL_RAISED` and `SIGNAL_RESOLVED` events via `@so360/event-bus`
