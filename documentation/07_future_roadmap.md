# 07 - Future Roadmap

This file tracks the complete agreed roadmap, including all high-impact, platform, and advanced feature improvements.

---

## Phase 1 - Documentation Alignment (Completed)

Status: Done

- Removed outdated planning docs that did not match current codebase
- Replaced with implementation-aligned documentation
- Added project snapshot, architecture, API, run guide, and roadmap files

---

## Phase 2 - Highest-Impact Improvements (Do First)

Status: Next priority

### 2.1 Professional UI Restructure

Status: In progress (initial structured layout foundation implemented)

Goal: Move from basic pages to a structured, professional analytics product flow.

Scope:

- Redesign information architecture and page hierarchy
- Create clear journey: Upload -> Configure -> Analyze -> Inspect -> Export
- Standardize layout, spacing, typography, and card system
- Improve visual hierarchy for controls, diagnostics, and results
- Make Dashboard and Reports feel part of one cohesive product

Acceptance criteria:

- Navigation feels structured and intentional
- Core workflow is obvious and easy to follow
- UI is presentation-ready for demo, grading, and portfolio use

### 2.2 User-Driven Analysis Controls

Goal: Replace hardcoded analysis parameters with user controls.

Scope:

- Add algorithm switch (Apriori or FP-Growth)
- Add controls for min support, min confidence, min lift
- Add top-N rules control
- Send selected parameters to analysis request

Acceptance criteria:

- Users can run analysis with custom parameters
- Results and charts refresh correctly based on selected inputs

### 2.3 Preprocessing and Data Quality Diagnostics

Goal: Surface backend preprocessing diagnostics in UI.

Scope:

- Show dropped rows
- Show removed cancelled invoices
- Show removed noise items
- Show suitability status and suitability message

Acceptance criteria:

- Users can understand data cleaning impact before interpreting rules
- Suitability warnings are clearly visible and actionable

### 2.4 Rule Exploration UX

Goal: Upgrade rules table from static to exploratory.

Scope:

- Search by antecedent or consequent
- Sort by support, confidence, and lift
- Add pagination
- Add rule details panel with related item pairs and confidence context

Acceptance criteria:

- Rules can be explored quickly even for larger outputs
- Users can identify strongest and most relevant rules without friction

### 2.5 Basket Simulator Page

Goal: Add interactive recommendation simulation.

Scope:

- Add dedicated Basket Simulator route and page
- Let users pick multiple items
- Call `/api/recommendations`
- Show recommendation cards with support, confidence, and lift
- Include loading, empty, and error states

Acceptance criteria:

- Users can instantly simulate and test basket recommendations
- Simulator is demo-friendly and aligned with new UI system

### 2.6 Segmentation and Prediction Pages

Goal: Expose existing backend ML endpoints through clean UI workflows.

Scope:

- Build Segmentation page for customer profile input and segment output
- Build Prediction page for purchase likelihood estimation
- Show confidence and plain-language explanation for each result

Acceptance criteria:

- Endpoints are usable from frontend without manual API calls
- Output is understandable to non-technical users

---

## Phase 3 - Platform-Level Upgrades

### 3.1 Async Analysis Jobs for Large CSVs

Scope:

- Start job endpoint
- Poll job status endpoint
- Progress and cancel support

### 3.2 Analysis Run History and Comparison

Scope:

- Save run metadata (file, timestamp, params, metrics)
- Compare run A vs run B
- Trend view for key metrics
- Export compare report (CSV or PDF)

### 3.3 Reliability and Security

Scope:

- File type and file size validation
- Rate limiting
- Environment-aware CORS configuration
- Centralized error response schema

### 3.4 Performance Improvements

Scope:

- Route-level code splitting
- Lazy load heavy chart views
- Reduce initial bundle size and improve first render performance

### 3.5 Testing and CI

Scope:

- Backend tests for mining and API contracts
- Frontend tests for core user flows
- CI pipeline for lint, test, and build checks

---

## Phase 4 - Advanced Feature Ideas

### 4.1 Promotion Planner

- Choose a product and generate recommended bundle offers ranked by lift and confidence

### 4.2 Inventory Co-Demand Alerts

- Detect strongly co-purchased products and suggest stocking pairs

### 4.3 Segment-Aware Recommendations

- Adjust recommendations based on customer segment context

### 4.4 Explainability Panel

- Show plain-language explanation for why a rule or recommendation was generated

### 4.5 Scenario Lab

- Simulate parameter changes (example: min confidence 0.1 to 0.3) and show impact deltas

---

## Delivery Order

1. Phase 2.1 to 2.4 (UI restructure + controls + diagnostics + rule UX)
2. Phase 2.5 (Basket Simulator)
3. Phase 2.6 (Segmentation and Prediction pages)
4. Phase 3 platform upgrades
5. Phase 4 advanced features

---

## Change Management

For each phase:

1. Implement
2. Validate (build and checks)
3. Update documentation
4. Record decisions in this roadmap
