# Phase 2.7 - Smart Schema Mapping with Gemini AI (Completed)

## What Was Done (Simple Summary)

This phase adds intelligent column detection to the upload workflow. When users upload CSV or Excel files with ambiguous column names, the system automatically detects which column contains product names, prices, invoice numbers, etc. If rule-based detection isn't confident, Google's Gemini AI assists to ensure accurate mapping before analysis.

Main improvements:

**Smart Column Detection System:**
- Rule-based detection runs FIRST (instant, no API calls)
- Checks column names against known patterns (product, price, date, quantity, invoice, country)
- Fuzzy matching for variations (e.g., "Prod_Name" → product/item)
- Confidence scoring (0-100%) for each detected field

**Gemini AI Fallback:**
- Activates when rule-based confidence is below 75% OR required fields missing
- Sends column names + sample rows to Gemini API
- Gemini uses natural language understanding to identify columns accurately
- Results merged with rule-based scores for hybrid confidence
- Safe error handling: falls back gracefully if Gemini is unavailable

**Schema Mapping Review UI (Phase 2.7 Card):**
- Shows detection results immediately after file upload
- Status pills indicate:
  - "Required mapping ready" (green) = Item/Product column found
  - "Confidence X%" = Overall mapping confidence score
  - "Source: rule-based" or "Source: hybrid-rule-gemini" = detection method used
  - "Gemini assisted" = AI was used to improve mapping
- Editable dropdown for each field (Item, Invoice, Date, Time, Quantity, Price, Country)
- Shows confidence % for each individual field
- Displays "Top candidates" for user verification
- "Mapping notes" section explains system decisions
- Users can override any mapping before analysis

**Column Remapping During Analysis:**
- User-confirmed mapping is sent to backend during analysis
- Backend applies column renaming before dataset processing
- Ensures analysis uses correct columns regardless of original names
- Supports synthetic invoice ID generation when needed

**Excel File Support:**
- File input now accepts `.csv`, `.xlsx`, and `.xls` files
- openpyxl library converts Excel to CSV format server-side
- Seamless experience: users don't know if data came from CSV or Excel
- Large file handling: tested with 22.6 MB Online Retail dataset

**Environment-Based Configuration:**
- GEMINI_API_KEY stored in `.env` file (git-ignored, not committed)
- `.env.example` template guides new developers
- GEMINI_MODEL configurable (currently gemini-2.5-flash)
- Graceful fallback if API key missing: rule-based still works

**Rate Limit Awareness:**
- Free tier: 5 RPM, 250K TPM, 20 requests/day
- System optimized to minimize Gemini calls (rule-based first)
- User sees if Gemini is "configured" or "not configured" in UI
- Documentation notes rate limits for stakeholders

## Quick Checklist To Test Phase 2.7

1. **Rule-Based Detection (Fast Path):**
   - Upload `Online Retail.xlsx` (column names: InvoiceNo, Description, Quantity, InvoiceDate, UnitPrice, Country)
   - Verify schema mapping card appears with confidence ~91%
   - Confirm "Source: rule-based" badge is shown
   - Check that Item/Product maps to Description (expected choice)

2. **UI Interaction:**
   - Click "Detect Mapping" button and observe detection happens in ~30 seconds
   - Verify all 7 field dropdowns have selectable columns
   - Try changing Item/Product dropdown to a different column
   - Confirm "Top candidates" list appears for each field
   - Read "Mapping notes" section for explanations

3. **Column Remapping:**
   - Leave Item/Product as "Description"
   - Click "Analyze Dataset" button
   - Verify analysis runs (backend receives Description column mapping)
   - Confirm analysis completes successfully with rules generated

4. **Gemini API Integration (if key configured):**
   - Temporarily edit column headers in CSV to be ambiguous (e.g., rename all to "col1", "col2", "col3")
   - Upload file and trigger schema detection
   - Verify system falls back to Gemini (may see "Source: hybrid-rule-gemini" badge)
   - Confirm mapping still found with reasonable confidence

5. **Excel File Support:**
   - Upload `.xlsx` file (Online Retail.xlsx works)
   - Verify schema detection works same as CSV
   - Confirm file input accept=".csv,.xlsx,.xls"

6. **Error Cases:**
   - Upload file with NO product/item column
   - Verify error message: "Required column missing: item/product"
   - Confirm "Mapping notes" section explains what's needed

7. **API Key Not Configured:**
   - Remove GEMINI_API_KEY from `.env` file
   - Upload file with low-confidence column names
   - Verify system still detects using rule-based (no AI fallback)
   - Confirm "Gemini not configured" badge appears

## Backend Changes

**Files Modified:**
- `app.py`: Added `/api/schema-suggest` endpoint (POST), updated `/api/analyze` to accept file uploads + column_mapping
- `mining_live.py`: Added `suggest_column_mapping()` (rule-based detection), `file_bytes_to_csv_text()` (Excel conversion)
- `gemini_schema.py`: New file with `suggest_schema_mapping_with_gemini()` function
- `requirements.txt`: Added `openpyxl==3.1.5` for Excel support

**New Endpoints:**
- `POST /api/schema-suggest`: Accepts CSV text (JSON) or Excel file (FormData), returns mapping suggestion + confidence scores
- `POST /api/analyze`: Updated to accept both JSON (CSV text) and FormData (Excel file) with column_mapping parameter

**Key Algorithms:**

**Rule-Based Detection** (lines 92-308 in mining_live.py):
1. Normalize all column names (lowercase, remove special chars)
2. For each canonical field (item, invoice, date, etc.):
   - Rank columns by similarity to known aliases using fuzzy matching + token matching
   - Score based on structural characteristics (text density, uniqueness, datetime detection)
   - Pick top match if confidence > threshold (usually 0.4)
3. Return mapping dict + per-field confidence scores
4. Detect missing required fields (item/product is mandatory)

**Gemini AI Fallback** (gemini_schema.py):
1. Prepare prompt with column names + first 5 sample rows
2. Ask Gemini: "Which columns map to these fields: item, invoice, date, time, quantity, price, country?"
3. Extract JSON response with mapping + field-level confidence
4. Merge with rule-based scores (take max confidence for each field)

**Column Mapping Application** (mining_live.py line 310):
1. Receive column_mapping dict from frontend
2. For each canonical field (item → Description), rename DataFrame column
3. Pass renamed DataFrame to analysis functions

## Frontend Changes

**Files Modified:**
- `App.tsx`: Added `fileObject` state, updated `runAnalysis()` to send Excel files via FormData
- `Dashboard.tsx`: Added `fileObject` prop, refactored `requestSchemaSuggestion()` to handle Excel files + JSON
- `App.css`: Added 155+ lines for Schema Mapping Review card styling
- `types.ts`: Added types: `CanonicalSchemaField`, `SchemaSuggestion`, `ColumnMapping`, `SchemaSuggestResponse`

**New UI Components:**
- Schema Mapping Review card (Phase 2.7 section)
- Status pills (required/confidence/source/gemini-assisted)
- 7 field selector cards (Item, Invoice, Date, Time, Quantity, Price, Country)
- Mapping notes section with bullet points

## Done Criteria

✅ Rule-based column detection identifies fields from CSV/Excel  
✅ Gemini AI fallback works when confidence low  
✅ Excel files supported (.xlsx, .xls)  
✅ User can override auto-detected mappings  
✅ Column mapping applied correctly during analysis  
✅ Rate limits and API keys documented  
✅ Graceful fallback when Gemini unavailable  
✅ All error cases handled with clear user messaging  
✅ Schema Mapping Review UI is intuitive and professional  
✅ No hardcoded API keys (uses .env)

## Known Limitations

- Gemini free tier limited to 20 requests/day
- Large files (>25 MB) may take 1-2 minutes to detect
- Excel conversion may lose formatting/metadata
- Column detection works best with English column names

## Future Enhancements

- Batch column detection for multiple files
- Custom field mapping templates for different retail formats
- Caching of detection results per file hash
- Support for multi-language column names
- Integration with data lineage/audit logs
