# Phase 2.6 - Segmentation & Prediction Pages (Ready To Start)

## What Will Be Done (Simple Summary)

This phase exposes existing backend ML endpoints through clean, intuitive UI pages for customer segmentation and purchase prediction. Non-technical users can input customer profiles and get actionable segment assignments and purchase likelihood predictions without calling APIs manually.

Main improvements:

**Segmentation Page:**
- Interactive form to input customer profile attributes (age group, purchase frequency, region, spending tier, etc.)
- Calls `/api/segments` endpoint with customer data
- Displays assigned segment label and confidence
- Shows segment profile breakdown (% of customer base, average purchase value, top 5 products in segment)
- Plain-language summary of segment characteristics
- Business recommendations based on segment (e.g., "this segment responds well to bundled offers")
- Clear "Copy result" and optional "Export as CSV" buttons

**Prediction Page:**
- Interactive form to input:
  - Product basket (reuse chip selector from Phase 2.5)
  - Customer context (optional demographic fields)
- Calls `/api/predict` endpoint with basket and metadata
- Displays purchase likelihood as percentage with visual confidence indicator
- Shows top 3 predicted next products customer might buy (with probabilities)
- Risk assessment (High confidence, Moderate, Low confidence recommendation)
- Plain-language explanation of prediction
  - Why are we confident/uncertain?
  - What factors influenced this prediction?
- Similar "Copy result" and "Export" buttons

**Shared Design Elements:**
- Reuse card system from Phase 2.5 (consistent styling)
- Reuse form patterns: text input, checkbox groups, number sliders
- Reuse button styles and hover effects
- Reuse loading spinner and error state design
- Both pages in top navigation between Simulator and Reports

**Technical Implementation:**
- New routes: `/segmentation` and `/prediction`
- New page components: `Segmentation.tsx`, `Prediction.tsx`
- Add menu items in navigation
- Call backend endpoints synchronously (assume they return quickly)
- Format responses into readable summaries with color-coded confidence

## Quick Checklist To Test Phase 2.6

### Segmentation Page Tests:
1. Open Segmentation from top navigation
2. Fill in customer profile form (age group, frequency, region, spending)
3. Click "Analyze Segment" button
4. Verify loading state appears briefly
5. Confirm segment result appears with:
   - Segment name/label
   - Confidence percentage
   - Segment size and avg purchase value
   - Top products in segment
6. Verify plain-language summary describes the segment
7. Verify "Copy" button copies result to clipboard
8. Try with different profiles and verify segment assignments change
9. Test error state (backend down) and confirm helpful message

### Prediction Page Tests:
1. Open Prediction from top navigation
2. Add some products to basket using chip selector
3. Optionally fill customer context fields
4. Click "Predict Purchase Likelihood" button
5. Verify loading state appears briefly
6. Confirm prediction result appears with:
   - Purchase likelihood % (e.g., "78% likely to purchase")
   - Confidence rating (High/Moderate/Low)
   - Top 3 next products with probabilities
7. Verify plain-language explanation of prediction
8. Click "Add top suggestion to basket" → verify it adds to basket
9. Change basket contents and rerun → verify new prediction
10. Test error state and confirm clear messaging

### Cross-Phase Tests:
1. Verify both pages feel visually consistent with Basket Simulator
2. Verify both pages are in main navigation
3. Verify both pages have proper empty states
4. Verify both pages have proper error handling
5. Test mobile responsive layout on both pages

## Done Criteria

✅ Segmentation page is usable without technical knowledge
✅ Prediction page is usable without technical knowledge
✅ Output is formatted in plain language (no raw JSON)
✅ UI is consistent with Phase 2.5 design system (cards, spacing, colors)
✅ Both pages have complete loading, empty, error, and success states
✅ Results can be copied/exported for reporting
✅ Backend endpoints are fully integrated and working

## Files To Create/Modify

- Create: `frontend/src/pages/Segmentation.tsx`
- Create: `frontend/src/pages/Prediction.tsx`
- Modify: `frontend/src/App.tsx` (add routes, navigation items)
- Modify: `frontend/src/App.css` (reuse v2 card system, add specific styles if needed)

## API Endpoints Expected

- `POST /api/segments` - Send customer profile, get segment assignment
- `POST /api/predict` - Send basket + customer context, get purchase likelihood

**Note:** Verify these endpoints exist in backend before starting implementation.
