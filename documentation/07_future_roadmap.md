# 07 - Future Roadmap

This file tracks the agreed next improvements from the latest planning discussion.

---

## Phase 1 - Documentation Reset (Completed)

Status: Done

- Removed outdated planning docs that did not match current codebase
- Replaced with implementation-aligned documentation
- Added this roadmap for next delivery phases

---

## Phase 2 - Professional UI Restructure (Next Priority)

Goal: Move from basic pages to a clean product-grade analytics flow.

Planned scope:

- Redesign information architecture and page hierarchy
- Create a clearer analysis journey: Upload -> Configure -> Analyze -> Inspect -> Export
- Standardize section layout, spacing, typography, and card system
- Improve visual hierarchy for controls vs insights vs actions
- Improve consistency between Dashboard and Reports

Acceptance criteria:

- Navigation feels structured and intentional
- Users can complete the main workflow without confusion
- UI looks presentation-ready for academic or professional demos

---

## Phase 3 - Basket Simulator Page

Goal: Add an interactive simulation page for recommendation testing.

Note: This was requested in chat as a "password simulator" and interpreted as "Basket Simulator" in this project context.

Planned scope:

- New route and page for selecting multiple products
- Call `/api/recommendations` to fetch top recommendations
- Show confidence/lift/support for recommended products
- Add controls for algorithm choice and top-N recommendations
- Add clear empty/loading/error states

Acceptance criteria:

- User can select basket items and get meaningful recommendations
- Results update quickly and are easy to interpret
- Page follows the new professional UI structure from Phase 2

---

## Phase 4 - Platform Maturity

Planned scope:

- Analysis run history and compare mode
- Better backend error schema and API typing
- Frontend code-splitting and performance tuning
- Basic test coverage (frontend + backend)

---

## Change Management

For each phase:

1. Implement
2. Validate (build/check)
3. Update docs
4. Record decisions in this file
