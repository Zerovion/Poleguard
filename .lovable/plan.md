## PoleGuard — Application Architecture Foundation

Enterprise IoT Smart Pole Monitoring dashboard. No UI is built in this step; this is the blueprint.

**One stack correction:** this project runs on TanStack Start + TanStack Router (file-based routing). React Router DOM cannot be installed here. Everything else from your list stands: React 19, TypeScript, Vite 7, Tailwind v4, shadcn UI, Framer Motion, ECharts, Leaflet, TanStack Query, Lucide.

---

### 1. Information Architecture

```text
PoleGuard
├── Dashboard Overview .... KPI cards, per-pole status cards, connection health
├── Live Monitoring ....... realtime charts: tilt / wire sag / leakage + health radar
├── Map View .............. Leaflet map, status pins, pole popover, navigate action
├── Alert History ......... searchable/filterable alert table, today's summary
├── Settings .............. thresholds, notification channels (Telegram), devices
└── About Project ......... system description, hardware, credits
Overlays: Pole Details Modal (Overview/Live/History/Statistics/Alerts/Maintenance/Sensor Info)
          Notification Panel (drawer)
```

Core domain entities: `Pole`, `SensorReading`, `Alert`, `Device` (ESP32/API/Bot), `Threshold`, `MaintenanceRecord`.

### 2. User Flow

```text
Land on Dashboard → scan KPIs → spot Warning/Critical pole
   ├→ click pole card ──→ Pole Details Modal → tabs → Export / Resolve
   ├→ Live Monitoring ──→ pick metric + time range → inspect threshold breach
   ├→ Map View ─────────→ click pin → popover → "View Details" (modal) / "Navigate"
   └→ bell icon ────────→ Notification drawer → alert → Alert History (deep link ?alert=)
Alert History → filter by pole/type/severity/status → mark Resolved
Settings → adjust thresholds → affects alert generation immediately
```

### 3. Navigation Structure

- Fixed left sidebar (shadcn Sidebar, `collapsible="icon"`): brand, 6 nav items, Connection Status panel pinned at bottom.
- Topbar: title + subtitle, live clock/date, "All Systems Normal" pill, notification bell with badge, avatar menu.
- Mobile: sidebar becomes off-canvas sheet, topbar collapses to hamburger + title + bell.

### 4. Routing Structure

```text
src/routes/
  __root.tsx              shell: sidebar + topbar + <Outlet/>, QueryClientProvider
  index.tsx               /                 Dashboard Overview
  monitoring.tsx          /monitoring       Live Monitoring   ?metric=&range=
  map.tsx                 /map              Map View          ?pole=
  alerts.tsx              /alerts           Alert History     ?severity=&status=&q=&page=
  settings.tsx            /settings         Settings
  about.tsx               /about            About Project
  sitemap[.]xml.ts        /sitemap.xml
```

Filters/selections live in URL search params (`validateSearch` + `zodValidator` + `fallback`), never `useState`. Each route defines its own `head()` metadata, `errorComponent`, and `notFoundComponent`.

### 5. Folder Structure

```text
src/
  routes/                     route files only (thin: page composition)
  components/
    layout/                   AppSidebar, Topbar, PageHeader, ConnectionStatus
    dashboard/                KpiCard, PoleStatusCard, GaugeRing, Sparkline
    charts/                   LineChart, AreaChart, RadarChart, ChartFrame, chartTheme.ts
    map/                      PoleMap.client.tsx, PoleMarker, PolePopover, MapLegend
    alerts/                   AlertTable, AlertRow, SeverityBadge, AlertFilters
    pole/                     PoleDetailsModal + tabs/
    notifications/            NotificationDrawer, NotificationItem
    common/                   StatusBadge, EmptyState, ErrorState, SkeletonCard
    ui/                       shadcn primitives (generated, minimally edited)
  features/                   per-domain query options + selectors + types
    poles/  alerts/  telemetry/  devices/  settings/
  lib/                        utils, formatters (units, relative time), constants
  hooks/                      useLiveClock, useMediaQuery, usePolling, useHydrated
  mocks/                      seed data + deterministic generators
  types/                      shared domain models
  styles.css                  design tokens
```

### 6. Component Hierarchy

```text
RootShell
└── AppShell (SidebarProvider)
    ├── AppSidebar → NavGroup → NavItem[] , ConnectionStatusPanel
    ├── Topbar → LiveClock, SystemStatusPill, NotificationBell, UserMenu
    └── <Outlet/>
        └── DashboardPage
            ├── KpiGrid → KpiCard ×4
            └── PoleGrid → PoleStatusCard → GaugeRing | MetricReadout | Sparkline
        └── MonitoringPage → ChartFrame → LineChart | RadarChart
        └── MapPage → PoleMap (client-only) → PoleMarker → PolePopover
        └── AlertsPage → AlertFilters + AlertTable + TodaySummary
    Portals: PoleDetailsModal, NotificationDrawer, Toaster
```

Rule: presentational components take plain props; data access happens in page-level containers via query hooks.

### 7. State Management Strategy

| State | Owner |
|---|---|
| Server/telemetry data | TanStack Query (`ensureQueryData` in loader + `useSuspenseQuery`) |
| Filters, selected pole, active tab, time range | URL search params |
| Modal/drawer open | URL param (`?pole=P002`) so it is shareable |
| Sidebar collapsed, theme | localStorage via small context, read after hydration |
| Transient form state | local `useState` / react-hook-form + zod |

No Redux/Zustand. Query keys: `["poles"]`, `["pole", id]`, `["telemetry", poleId, metric, range]`, `["alerts", filters]`, `["devices"]`. Live feel via `refetchInterval` (2–5s) on telemetry keys, toggleable by an "Auto Refresh" switch.

### 8. API Architecture

Typed server functions (`createServerFn`) in `src/features/*/*.functions.ts`, consumed through `queryOptions` objects — the same contract whether data comes from mocks now or real hardware later.

```text
getPoles()                      → Pole[]
getPole(id)                     → PoleDetail
getTelemetry({poleId,metric,range}) → SensorReading[]
getAlerts(filters)              → { rows: Alert[]; total: number }
resolveAlert(id)                → Alert          (mutation → invalidate ["alerts"])
getDevices()                    → Device[]
getSettings() / updateSettings()
```

Future ingestion: `src/routes/api/public/ingest.ts` (signature-verified POST from ESP32) and `/api/public/telegram-webhook`. All DTOs plain and SSR-serializable.

### 9. Mock Data Strategy

`src/mocks/` exports a deterministic, seeded generator (3 poles: P001 tilt / P002 wire sag / P003 leakage) producing time-series with realistic drift, occasional threshold breaches, and a derived alert log. Server functions read from mocks behind the same interface, so switching to Lovable Cloud later touches only the data layer — never components.

### 10. Responsive Strategy

Breakpoints: `<640` stacked single column, off-canvas nav, charts 200px tall, table → card list; `640–1024` 2-col KPI grid, icon sidebar; `≥1280` full 4-col dashboard as in the reference. Charts use ResizeObserver-driven responsive containers; map fills viewport minus chrome. Touch targets ≥44px.

### 11. Design Tokens (`src/styles.css`, oklch, semantic only)

Dark-first industrial control-room theme from the reference:

```text
background #12091F · surface #170A2A · surface-2 #1D1033
card #24153D · card-2 #2B1946 · border rgba(gold,12%)
primary/accent gold #FFD54A → #FFC107 → #FB6100 (gradient-accent)
status: normal #00CD84 · warning #FF9800 · critical #FF3830 · offline #7A7A7A
chart: gold, violet #A78BFA, teal, red — one --chart-* token each
shadow-glow-accent / -critical, radius 12px, font Inter (H1 32 bold → small 12)
```

Every color, gradient, and glow is a token; components never hardcode color classes. Status colors get badge variants (`<StatusBadge variant="critical">`) rather than inline classes.

### 12. File Organization Conventions

PascalCase components, camelCase hooks/utils, `*.functions.ts` for server functions, `*.client.tsx` for browser-only (Leaflet) modules loaded via `React.lazy` behind `<ClientOnly>`. One component per file, colocated subcomponents in a folder with `index.ts` barrel. Types in `src/types` when shared, colocated when local.

### 13. Future Scalability Plan

1. Swap mocks → Lovable Cloud (Postgres + RLS) behind unchanged query contracts.
2. Realtime: replace polling with websocket/realtime subscription in one hook.
3. Multi-tenant: `site_id` scoping + role table (`admin`/`operator`/`viewer`) with security-definer `has_role`.
4. Scale poles 3 → 500: virtualized tables, marker clustering, server-side pagination and aggregation.
5. Ops: threshold rules engine, maintenance scheduling, CSV/PDF export, audit log, i18n, PWA offline cache.

---

**Next step after approval:** implement the design system tokens + app shell, then Dashboard → Monitoring → Map → Alerts → Settings/About in that order.