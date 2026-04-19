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

Status: In progress

### 2.1 Professional UI Restructure

Status: Completed

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

Status: Completed

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

Status: Completed

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

Status: Completed

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

### 2.7 AI-Assisted Schema Mapping (Gemini + Rule Engine)

Status: In progress

Goal: Reduce upload failures caused by non-standard column names by adding an assisted schema-detection flow.

Scope:

- Add backend schema suggestion endpoint for uploaded CSV text
- Implement deterministic schema detection first (synonyms + fuzzy + value profiling)
- Add Gemini fallback only when rule-based confidence is low
- Return suggested mapping, confidence, alternatives, and missing required fields
- Add Workspace UI to review and edit mapping before running analysis
- Pass confirmed mapping into analysis endpoint and reuse existing mining workflow

Acceptance criteria:

- Users can upload valid but differently named datasets and still run analysis successfully
- Mapping suggestions are visible, editable, and confidence-scored
- App works without Gemini key (rule-based mode), and improves when Gemini is configured

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

## Phase 5 - AI-Powered Insights with Gemini

### Overview

Extend Gemini AI integration beyond schema mapping to provide intelligent insights, explanations, and recommendations across the platform. This phase focuses on making complex business insights accessible to non-technical users through natural language explanations.

### 5.1 Rule Explanation Engine

Status: Planned

Goal: Auto-generate business-friendly explanations for association rules using Gemini.

Scope:

- Add explanation endpoint on backend: `POST /api/rule-explanation`
- Accepts rule (antecedent, consequent, support, confidence, lift)
- Calls Gemini with structured prompt
- Returns business interpretation, impact estimate, and action recommendations
- Frontend: Add "Explain" button/icon to each rule in Reports page
- Show explanation in modal/popover with:
  - Plain-language business insight
  - Estimated impact (AOV increase, conversion uplift, etc.)
  - Actionable recommendations (bundle, pricing, placement)
  - Copy-to-clipboard for stakeholder sharing

Acceptance criteria:

- Users can click any rule and see AI-generated business explanation
- Explanations are non-technical and actionable
- Fits within Gemini rate limits (low usage, on-demand)

### 5.2 Data Quality Assessment

Status: Planned

Goal: Validate uploaded data and warn users of issues before analysis.

Scope:

- Add assessment endpoint: `POST /api/data-quality-check`
- Analyzes CSV for:
  - Missing values (% per column)
  - Duplicate/malformed invoices
  - Outlier quantities/prices
  - Data type consistency
  - Completeness ratio
- Frontend: Show results card in Workspace after upload
- Display warnings with severity (high/medium/low)
- Suggest corrective actions
- Let users proceed or upload different file

Acceptance criteria:

- Data issues are caught and surfaced before analysis
- Users understand data limitations and impact on results
- Prevents garbage-in-garbage-out analysis

### 5.3 Intelligent Parameter Recommendations

Status: Planned

Goal: Suggest optimal analysis parameters based on dataset characteristics.

Scope:

- Add recommendation endpoint: `POST /api/parameter-recommendations`
- Analyzes dataset size, sparsity, transaction count
- Recommends algorithm (Apriori vs FP-Growth)
- Recommends thresholds (min_support, min_confidence, min_lift)
- Explains trade-offs (more rules vs quality)
- Frontend: Add suggestion card in Configure step
- Show "Gemini Recommends" section with reasoning
- Let user apply or override suggestions

Acceptance criteria:

- Users can get guidance on parameter tuning
- Beginners don't have to guess optimal values
- Explanation shows why recommendations matter

### 5.4 Rule Auto-Categorization and Naming

Status: Planned

Goal: Auto-label rules with business-friendly categories and names.

Scope:

- Add categorization endpoint: `POST /api/rule-categories`
- Accepts rule batch (all rules from analysis)
- Calls Gemini to categorize rules into business domains:
  - "Morning Staple Bundle"
  - "Cross-Sell Opportunity"
  - "Loss Leader Pairing"
  - "Premium Upsell"
  - etc.
- Returns category, strength indicator, and emoji
- Frontend: Show category tags on rules in Reports
- Add filter by category for easy exploration
- Include in export (CSV, PDF) with category info

Acceptance criteria:

- Rules are organized by business meaning, not just metrics
- Non-technical stakeholders can understand rule groups
- Improves report presentation

### 5.5 Natural Language Analytics Query Engine

Status: Planned (Future)

Goal: Allow users to ask questions about their data in natural language.

Scope:

- Add query endpoint: `POST /api/analytics-query`
- User types: "Which products should I bundle together?"
- Endpoint parses query with Gemini
- Routes to appropriate analysis (top rules by lift, etc.)
- Returns narrative answer with supporting data
- Frontend: Add chat-style interface in Prediction/Analytics page
- Example queries:
  - "What's the best product to promote with coffee?"
  - "Which customers buy the most expensive items?"
  - "How should I arrange store shelves?"
  - "What discount would increase basket value?"

Acceptance criteria:

- Users can explore data through conversational interface
- Answers are contextual and actionable
- Works with existing backend analyses

### 5.6 Anomaly and Opportunity Detection

Status: Planned (Future)

Goal: Automatically surface hidden patterns and anomalies.

Scope:

- Add anomaly endpoint: `POST /api/detect-anomalies`
- Identifies:
  - Unexpected non-correlations (complementary products NOT bought together)
  - Pricing anomalies (products that should cost more/less)
  - Segment anomalies (unusual patterns for specific customer groups)
  - Seasonal opportunities (products bought together in specific periods)
- Frontend: Show "Insights" panel in Reports with auto-discovered items
- Prioritize by business impact
- Explain why each anomaly matters

Acceptance criteria:

- System finds non-obvious business opportunities
- Users discover patterns they wouldn't have looked for
- Increases strategic decision-making value

### 5.7 Stakeholder Report Generator

Status: Planned (Phase 6+)

Goal: Generate executive-ready reports with AI narration.

Scope:

- Add report endpoint: `POST /api/generate-report`
- Inputs: analysis results, filters, branding options
- Gemini generates:
  - Executive summary (2-3 paragraphs)
  - Key findings with business impact
  - Strategic recommendations
  - Risk/limitation disclaimers
- Output formats: PDF, HTML, Markdown
- Frontend: One-click "Generate Executive Report" in Reports page
- Include charts, rules, and AI narrative
- Customizable sections and branding

Acceptance criteria:

- Stakeholders receive insights in boardroom-ready format
- Eliminates need for manual report writing
- Increases product value for enterprise users

---

## Phase 6+ - Long-Term Vision (Advanced)

### 6.1 Real-Time Recommendation API

- Webhook support for live transaction stream
- Return recommendations in <100ms
- PII-safe filtering

### 6.2 Multi-Tenant SaaS Platform

- Workspace per customer
- Billing integration
- Team collaboration features

### 6.3 Mobile App

- iOS/Android native apps
- On-the-go basket recommendations
- Offline mode support

### 6.4 Advanced ML Models

- Demand forecasting
- Customer lifetime value prediction
- Churn risk scoring

---
