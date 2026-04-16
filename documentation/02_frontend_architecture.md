# 02 - Frontend Architecture

## Stack

- React 19 + TypeScript
- Vite
- React Router
- Recharts
- React Icons

---

## Source Structure

```
frontend/src/
  App.tsx
  App.css
  index.css
  main.tsx
  types.ts
  pages/
    Home.tsx
    Dashboard.tsx
    Reports.tsx
  utils/
    analyze.ts
```

---

## Routing

Defined in `App.tsx`:

- `/` -> Home
- `/dashboard` -> Dashboard
- `/reports` -> Reports

Navigation is top-level and simple, with shared state held in `AppShell`.

---

## State Ownership

`AppShell` currently owns dataset and analysis state:

- `fileName`, `fileSize`
- `csvText`
- `analysis`
- `error`

This state is passed to page components via props.

---

## Analysis Trigger Flow

1. User selects CSV
2. FileReader loads text into `csvText`
3. `runAnalysis()` posts payload to `http://localhost:5000/api/analyze`
4. API response updates `analysis` state
5. Dashboard and Reports render from shared `analysis` object

---

## Dashboard Responsibilities

- Dataset upload and upload progress UI
- Analysis controls (currently support/confidence/lift filtering in UI)
- KPI cards
- Product demand chart
- Monthly trend chart
- Quick recommendations for selected product
- CSV export of filtered rules

---

## Reports Responsibilities

- Overview KPI cards
- Top products chart
- Country distribution pie chart
- Support vs confidence scatter chart
- Top rules table

---

## Styling

- Global typography/reset in `index.css`
- Main visual system and component-level styling in `App.css`

Current style quality is functional but needs stronger information architecture and layout hierarchy to look enterprise-ready.

---

## Planned Frontend Direction

The next UI phase (see roadmap) will move toward a professional product flow:

- Structured navigation and page hierarchy
- Consistent analytics layout system
- Better visual grouping of upload, controls, results, and actions
- Dedicated Basket Simulator experience
