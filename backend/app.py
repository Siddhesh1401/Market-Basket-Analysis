from flask import Flask, request, jsonify
from flask_cors import CORS
from recommender import Recommender
from mining_live import analyze_csv_text, suggest_column_mapping, file_bytes_to_csv_text
from gemini_schema import suggest_schema_mapping_with_gemini
import traceback
import os
from io import StringIO
from typing import Any
import pandas as pd
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), '.env'))

app = Flask(__name__)
CORS(app)

DATASET_ACCEPTANCE_HINT = (
    "Accepted CSV needs at least one product/item column (for example: description, product_name, item, sku). "
    "Best quality comes from invoice/order + item columns. If invoice/order is missing, the app infers transactions "
    "from date/time or row buckets and marks results as approximate guidance."
)

# Initialize recommender
recommender = Recommender()
ACTIVE_ANALYSIS_CONTEXT = {
    'products': [],
    'rules': [],
    'algorithm': None,
    'column_mapping': {},
    'analysis': None,
    'csv_text': '',
    'ready': False,
}

BI_CUSTOMER_KEYS = [
    'customerid',
    'customer_id',
    'customer',
    'userid',
    'user_id',
    'memberid',
]

BI_INVOICE_KEYS = ['invoice', 'invoiceno', 'invoice_no', 'transaction', 'order', 'orderid', 'order_id']
BI_ITEM_KEYS = ['item', 'product', 'description', 'product_name', 'productname', 'sku', 'stockcode']
BI_COUNTRY_KEYS = ['country', 'region', 'market', 'nation']
BI_DATE_KEYS = ['date', 'invoice_date', 'invoicedate', 'orderdate', 'purchase_date', 'datetime']
BI_TIME_KEYS = ['time', 'invoice_time', 'ordertime', 'purchase_time']
BI_QUANTITY_KEYS = ['quantity', 'qty', 'itemqty']
BI_PRICE_KEYS = ['price', 'unitprice', 'unit_price', 'amount']


def _split_items(value: str) -> list[str]:
    return [part.strip() for part in str(value).split(',') if part and part.strip()]


def _recommend_from_rules(cart_items: list[str], rules: list[dict], top_n: int) -> list[dict]:
    normalized_cart = {str(item).strip().lower() for item in cart_items if str(item).strip()}
    if not normalized_cart or not rules:
        return []

    candidate_scores = {}

    for rule in rules:
        antecedents = _split_items(rule.get('antecedent', ''))
        consequents = _split_items(rule.get('consequent', ''))
        if not antecedents or not consequents:
            continue

        antecedent_set = {item.lower() for item in antecedents}
        if not antecedent_set.issubset(normalized_cart):
            continue

        confidence = float(rule.get('confidence', 0.0) or 0.0)
        lift = float(rule.get('lift', 1.0) or 1.0)
        support = float(rule.get('support', 0.0) or 0.0)

        for consequent in consequents:
            if consequent.lower() in normalized_cart:
                continue

            existing = candidate_scores.get(consequent.lower())
            candidate = {
                'product': consequent,
                'confidence': confidence,
                'lift': lift,
                'support': support,
            }

            if existing is None or (candidate['confidence'], candidate['lift'], candidate['support']) > (
                existing['confidence'],
                existing['lift'],
                existing['support'],
            ):
                candidate_scores[consequent.lower()] = candidate

    ranked = sorted(
        candidate_scores.values(),
        key=lambda row: (row['confidence'], row['lift'], row['support']),
        reverse=True,
    )
    return ranked[: max(1, int(top_n))]


def _safe_ratio(numerator: float, denominator: float) -> float:
    if denominator <= 0:
        return 0.0
    return float(numerator) / float(denominator)


def _resolve_column(df: pd.DataFrame, selected: str | None, aliases: list[str]) -> str | None:
    if selected:
        if selected in df.columns:
            return selected
        lowered_lookup = {str(col).strip().lower(): str(col) for col in df.columns}
        return lowered_lookup.get(str(selected).strip().lower())

    lowered_lookup = {str(col).strip().lower().replace(' ', '').replace('_', ''): str(col) for col in df.columns}
    for alias in aliases:
        key = alias.strip().lower().replace(' ', '').replace('_', '')
        if key in lowered_lookup:
            return lowered_lookup[key]
    return None


def _normalize_bi_mapping(df: pd.DataFrame, csv_text: str, base_mapping: dict[str, Any] | None) -> dict[str, str]:
    normalized: dict[str, str] = {}
    if isinstance(base_mapping, dict):
        for field, column_name in base_mapping.items():
            resolved = _resolve_column(df, str(column_name), []) if column_name else None
            if resolved:
                normalized[str(field)] = resolved

    if normalized.get('item'):
        return normalized

    try:
        suggestion = suggest_column_mapping(csv_text=csv_text, sample_rows=8)
        suggested_mapping = suggestion.get('mapping', {}) if isinstance(suggestion, dict) else {}
        for field, column_name in suggested_mapping.items():
            resolved = _resolve_column(df, str(column_name), []) if column_name else None
            if resolved:
                normalized[str(field)] = resolved
    except Exception:
        # Keep BI available with heuristic fallback even if auto-suggestion fails.
        pass

    return normalized


def _build_bi_working_frame() -> tuple[pd.DataFrame | None, dict[str, str], str | None]:
    if not ACTIVE_ANALYSIS_CONTEXT.get('ready'):
        return None, {}, 'No active analysis found. Upload and analyze a dataset in Workspace first.'

    csv_text = str(ACTIVE_ANALYSIS_CONTEXT.get('csv_text', '') or '')
    if not csv_text.strip():
        return None, {}, 'No active dataset found. Re-run analysis in Workspace.'

    try:
        df = pd.read_csv(StringIO(csv_text), on_bad_lines='skip', engine='python')
    except Exception as exc:
        return None, {}, f'Could not parse active dataset for BI view: {exc}'

    if df.empty:
        return None, {}, 'Active dataset has no rows available for BI.'

    mapping = _normalize_bi_mapping(df, csv_text, ACTIVE_ANALYSIS_CONTEXT.get('column_mapping'))

    invoice_col = _resolve_column(df, mapping.get('invoice'), BI_INVOICE_KEYS)
    item_col = _resolve_column(df, mapping.get('item'), BI_ITEM_KEYS)
    country_col = _resolve_column(df, mapping.get('country'), BI_COUNTRY_KEYS)
    date_col = _resolve_column(df, mapping.get('date'), BI_DATE_KEYS)
    time_col = _resolve_column(df, mapping.get('time'), BI_TIME_KEYS)
    quantity_col = _resolve_column(df, mapping.get('quantity'), BI_QUANTITY_KEYS)
    price_col = _resolve_column(df, mapping.get('price'), BI_PRICE_KEYS)
    customer_col = _resolve_column(df, None, BI_CUSTOMER_KEYS)

    if item_col is None:
        return None, mapping, 'Item/Product column is missing. BI requires at least one product column.'

    work = pd.DataFrame()
    work['item'] = df[item_col].fillna('').astype(str).str.strip()

    if invoice_col is None:
        synthetic_ids = (pd.Series(range(len(df))) // 3).astype(str).str.zfill(7)
        work['invoice'] = 'SYN-BKT-' + synthetic_ids
    else:
        work['invoice'] = df[invoice_col].fillna('').astype(str).str.strip()

    if country_col is None:
        work['country'] = 'Unknown'
    else:
        work['country'] = df[country_col].fillna('Unknown').astype(str).str.strip().replace('', 'Unknown')

    if quantity_col is None:
        work['quantity'] = 1.0
    else:
        parsed_quantity = pd.to_numeric(df[quantity_col], errors='coerce').fillna(1.0)
        work['quantity'] = parsed_quantity.where(parsed_quantity > 0, 1.0)

    if price_col is None:
        work['price'] = 0.0
    else:
        parsed_price = pd.to_numeric(df[price_col], errors='coerce').fillna(0.0)
        work['price'] = parsed_price.where(parsed_price > 0, 0.0)

    if customer_col is not None:
        work['customer'] = df[customer_col].fillna('').astype(str).str.strip()
    else:
        work['customer'] = ''

    parsed_datetime = pd.Series(pd.NaT, index=work.index, dtype='datetime64[ns]')
    if date_col and time_col:
        combined = df[date_col].fillna('').astype(str).str.strip() + ' ' + df[time_col].fillna('').astype(str).str.strip()
        parsed_datetime = pd.to_datetime(combined, errors='coerce')
    elif date_col:
        parsed_datetime = pd.to_datetime(df[date_col], errors='coerce')
    elif time_col:
        parsed_datetime = pd.to_datetime(df[time_col], errors='coerce')

    work['datetime'] = parsed_datetime
    work['revenue'] = work['quantity'] * work['price']

    work = work[(work['invoice'] != '') & (work['item'] != '')]
    if work.empty:
        return None, mapping, 'No valid invoice/item rows were available for BI after cleanup.'

    return work, mapping, None


def _build_bi_overview_payload() -> dict[str, Any]:
    work, mapping, error = _build_bi_working_frame()
    if error:
        return {'ready': False, 'error': error}

    assert work is not None

    analysis = ACTIVE_ANALYSIS_CONTEXT.get('analysis') or {}
    rules = ACTIVE_ANALYSIS_CONTEXT.get('rules') or []
    total_transactions = int(work['invoice'].nunique())
    total_rows = int(len(work))

    transaction_agg = (
        work.groupby('invoice', as_index=False)
        .agg(
            itemCount=('item', 'nunique'),
            totalQuantity=('quantity', 'sum'),
            totalValue=('revenue', 'sum'),
            country=('country', 'first'),
            datetime=('datetime', 'max'),
        )
    )

    items_per_basket = float(transaction_agg['itemCount'].mean()) if not transaction_agg.empty else 0.0
    avg_basket_value = float(transaction_agg['totalValue'].mean()) if not transaction_agg.empty else 0.0

    customer_series = work['customer'].fillna('').astype(str).str.strip()
    valid_customers = customer_series[customer_series != '']
    repeat_purchase_rate = None
    if len(valid_customers) > 0:
        customer_invoice_counts = work[customer_series != ''].groupby('customer')['invoice'].nunique()
        repeat_purchase_rate = _safe_ratio(float((customer_invoice_counts > 1).sum()), float(len(customer_invoice_counts)))

    if not work['datetime'].isna().all():
        trend_frame = work.copy()
        trend_frame = trend_frame[trend_frame['datetime'].notna()].copy()
        trend_frame['period'] = trend_frame['datetime'].dt.to_period('M').astype(str)

        tx_trend = trend_frame.groupby('period')['invoice'].nunique().reset_index(name='transactions')
        rev_trend = trend_frame.groupby('period')['revenue'].sum().reset_index(name='revenue')
        merged = tx_trend.merge(rev_trend, on='period', how='outer').fillna(0).sort_values('period')
        merged['avgBasketValue'] = merged.apply(
            lambda row: _safe_ratio(float(row['revenue']), float(row['transactions'])),
            axis=1,
        )
        transaction_trend = [
            {
                'period': str(row['period']),
                'transactions': int(row['transactions']),
                'revenue': float(row['revenue']),
                'avgBasketValue': float(row['avgBasketValue']),
            }
            for _, row in merged.iterrows()
        ]
    else:
        monthly = analysis.get('monthlyTransactions', []) if isinstance(analysis, dict) else []
        transaction_trend = [
            {
                'period': str(row.get('month', f'M{i + 1}')),
                'transactions': int(row.get('transactions', 0)),
                'revenue': 0.0,
                'avgBasketValue': 0.0,
            }
            for i, row in enumerate(monthly)
        ]

    product_agg = (
        work.groupby('item', as_index=False)
        .agg(
            transactionCount=('invoice', 'nunique'),
            quantity=('quantity', 'sum'),
            revenue=('revenue', 'sum'),
            avgPrice=('price', 'mean'),
            lastSeen=('datetime', 'max'),
        )
        .sort_values(['transactionCount', 'revenue'], ascending=[False, False])
    )

    products = []
    for _, row in product_agg.head(250).iterrows():
        products.append(
            {
                'name': str(row['item']),
                'transactionCount': int(row['transactionCount']),
                'quantity': float(row['quantity']),
                'revenue': float(row['revenue']),
                'avgPrice': float(row['avgPrice']) if pd.notna(row['avgPrice']) else 0.0,
                'lastSeen': row['lastSeen'].isoformat() if pd.notna(row['lastSeen']) else None,
                'transactionShare': _safe_ratio(float(row['transactionCount']), float(total_transactions)),
            }
        )

    invoice_items = work.groupby('invoice')['item'].apply(lambda values: sorted(set(str(v) for v in values if str(v).strip()))).to_dict()
    transactions = []
    for _, row in transaction_agg.sort_values('datetime', ascending=False, na_position='last').head(300).iterrows():
        invoice = str(row['invoice'])
        transactions.append(
            {
                'invoice': invoice,
                'itemCount': int(row['itemCount']),
                'totalQuantity': float(row['totalQuantity']),
                'totalValue': float(row['totalValue']),
                'country': str(row['country']),
                'datetime': row['datetime'].isoformat() if pd.notna(row['datetime']) else None,
                'items': invoice_items.get(invoice, [])[:15],
            }
        )

    top_rules = sorted(
        rules,
        key=lambda entry: (
            float(entry.get('lift', 0.0) or 0.0),
            float(entry.get('confidence', 0.0) or 0.0),
            float(entry.get('support', 0.0) or 0.0),
        ),
        reverse=True,
    )[:180]

    strongest_pair = top_rules[0] if top_rules else None

    payload = {
        'ready': True,
        'generatedAt': pd.Timestamp.utcnow().isoformat(),
        'kpis': {
            'totalTransactions': total_transactions,
            'totalRows': total_rows,
            'uniqueProducts': int(product_agg['item'].nunique()),
            'totalRevenue': float(work['revenue'].sum()),
            'averageBasketValue': avg_basket_value,
            'itemsPerBasket': items_per_basket,
            'repeatPurchaseRate': repeat_purchase_rate,
            'highLiftRuleCount': int(
                sum(1 for rule in rules if float(rule.get('lift', 0.0) or 0.0) >= 1.5)
            ),
            'topCrossSellPair': {
                'antecedent': strongest_pair.get('antecedent', ''),
                'consequent': strongest_pair.get('consequent', ''),
                'lift': float(strongest_pair.get('lift', 0.0) or 0.0),
                'confidence': float(strongest_pair.get('confidence', 0.0) or 0.0),
            }
            if strongest_pair
            else None,
        },
        'trends': {
            'transactions': transaction_trend,
        },
        'products': products,
        'transactions': transactions,
        'rules': top_rules,
        'mapping': mapping,
    }

    return payload


def _build_bi_product_detail(product_name: str) -> dict[str, Any]:
    work, _, error = _build_bi_working_frame()
    if error:
        return {'ready': False, 'error': error}

    assert work is not None

    target = str(product_name).strip().lower()
    if not target:
        return {'ready': False, 'error': 'Product name is required.'}

    matched_items = sorted({item for item in work['item'].unique().tolist() if str(item).strip().lower() == target})
    if not matched_items:
        return {'ready': False, 'error': 'Product not found in active dataset.'}

    canonical_name = matched_items[0]
    product_rows = work[work['item'].str.lower() == target]
    invoice_ids = sorted(product_rows['invoice'].unique().tolist())

    invoice_item_sets = work.groupby('invoice')['item'].apply(lambda vals: sorted(set(str(v) for v in vals if str(v).strip()))).to_dict()
    co_counts: dict[str, int] = {}
    for invoice in invoice_ids:
        for item in invoice_item_sets.get(invoice, []):
            lowered = item.lower()
            if lowered == target:
                continue
            co_counts[item] = co_counts.get(item, 0) + 1

    co_purchased = [
        {
            'item': name,
            'coOccurrenceCount': count,
            'coOccurrenceRate': _safe_ratio(float(count), float(len(invoice_ids))),
        }
        for name, count in sorted(co_counts.items(), key=lambda row: row[1], reverse=True)[:12]
    ]

    rules = ACTIVE_ANALYSIS_CONTEXT.get('rules') or []
    related_rules = [
        rule
        for rule in rules
        if target in str(rule.get('antecedent', '')).lower() or target in str(rule.get('consequent', '')).lower()
    ]
    related_rules = sorted(
        related_rules,
        key=lambda entry: (
            float(entry.get('lift', 0.0) or 0.0),
            float(entry.get('confidence', 0.0) or 0.0),
        ),
        reverse=True,
    )[:12]

    trend_points = []
    dated = product_rows[product_rows['datetime'].notna()].copy()
    if not dated.empty:
        dated['period'] = dated['datetime'].dt.to_period('M').astype(str)
        period_counts = dated.groupby('period')['invoice'].nunique().reset_index(name='transactions')
        trend_points = [
            {'period': str(row['period']), 'transactions': int(row['transactions'])}
            for _, row in period_counts.iterrows()
        ]

    return {
        'ready': True,
        'product': {
            'name': canonical_name,
            'transactionCount': int(product_rows['invoice'].nunique()),
            'quantity': float(product_rows['quantity'].sum()),
            'revenue': float(product_rows['revenue'].sum()),
            'avgPrice': float(product_rows['price'].mean()) if not product_rows.empty else 0.0,
            'topCoPurchased': co_purchased,
            'relatedRules': related_rules,
            'trend': trend_points,
        },
    }

# ==================== HEALTH CHECK ====================
@app.route('/', methods=['GET'])
def api_index():
    """API index endpoint for quick browser checks"""
    return jsonify({
        'status': 'ok',
        'message': 'Market Basket Analysis API is running',
        'endpoints': [
            '/api/health',
            '/api/schema-suggest',
            '/api/analyze',
            '/api/recommendations',
            '/api/rules',
            '/api/segments',
            '/api/predict',
            '/api/analytics',
            '/api/bi/overview',
            '/api/bi/product-detail',
            '/api/products',
            '/api/fbt',
            '/api/models',
        ]
    }), 200


@app.route('/api/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({'status': 'ok', 'message': 'Flask API is running'}), 200


# ==================== SCHEMA SUGGESTION ====================
@app.route('/api/schema-suggest', methods=['POST'])
def schema_suggest():
    """Suggest column mapping for uploaded CSV/Excel, with optional Gemini fallback."""
    try:
        csv_text = ""
        
        # Handle multipart/form-data file upload
        if 'file' in request.files:
            file = request.files['file']
            if not file or file.filename == '':
                return jsonify({'error': 'No file selected.'}), 400
            
            file_bytes = file.read()
            csv_text = file_bytes_to_csv_text(file_bytes, file.filename)
        
        # Handle JSON request with CSV text
        else:
            data = request.json or {}
            csv_text = str(data.get('csv_text', '') or '')
        
        if not csv_text.strip():
            return jsonify({'error': 'CSV content is required.'}), 400

        # Extract optional parameters (only from JSON requests, not file uploads)
        # Use get_json(silent=True) to avoid throwing errors on non-JSON requests
        data = request.get_json(force=False, silent=True) or {}
        sample_rows = int(data.get('sample_rows', 8) or 8)
        use_ai = bool(data.get('use_ai', True))
        ai_threshold = float(data.get('ai_threshold', 0.75) or 0.75)

        suggestion = suggest_column_mapping(csv_text=csv_text, sample_rows=sample_rows)
        suggestion_source = 'rule-based'
        ai_applied = False
        ai_configured = bool(os.getenv('GEMINI_API_KEY', '').strip())

        should_try_ai = (
            use_ai
            and ai_configured
            and (
                float(suggestion.get('overallConfidence', 0.0) or 0.0) < ai_threshold
                or bool(suggestion.get('missingRequired'))
            )
        )

        if should_try_ai:
            ai_result = suggest_schema_mapping_with_gemini(
                columns=suggestion.get('columns', []),
                sample_rows=suggestion.get('sampleRows', []),
                current_mapping=suggestion.get('mapping', {}),
            )

            if ai_result:
                merged_mapping = dict(suggestion.get('mapping', {}))
                for field, column_name in ai_result.get('mapping', {}).items():
                    if column_name and column_name in suggestion.get('columns', []):
                        merged_mapping[field] = column_name
                suggestion['mapping'] = merged_mapping

                merged_confidence = dict(suggestion.get('fieldConfidence', {}))
                for field, score in ai_result.get('fieldConfidence', {}).items():
                    merged_confidence[field] = round(max(float(merged_confidence.get(field, 0.0) or 0.0), float(score)), 4)
                suggestion['fieldConfidence'] = merged_confidence

                required_fields = suggestion.get('requiredFields', ['item'])
                suggestion['missingRequired'] = [field for field in required_fields if not suggestion['mapping'].get(field)]

                required_scores = [
                    float(suggestion['fieldConfidence'].get(field, 0.0) or 0.0)
                    for field in required_fields
                    if suggestion['mapping'].get(field)
                ]
                suggestion['overallConfidence'] = round(float(sum(required_scores) / max(1, len(required_scores))), 4)

                notes = list(suggestion.get('notes', []))
                notes.append(f"Gemini reviewed mapping using model: {ai_result.get('model', 'gemini')}")
                for note in ai_result.get('notes', []):
                    if note not in notes:
                        notes.append(note)
                suggestion['notes'] = notes

                suggestion_source = 'hybrid-rule-gemini'
                ai_applied = True

        suggestion['source'] = suggestion_source

        return jsonify({
            'suggestion': suggestion,
            'source': suggestion_source,
            'aiApplied': ai_applied,
            'aiConfigured': ai_configured,
        }), 200
    except ValueError as exc:
        return jsonify({'error': str(exc)}), 400
    except Exception as exc:
        traceback.print_exc()
        return jsonify({'error': str(exc)}), 500


# ==================== LIVE DATA MINING ====================
@app.route('/api/analyze', methods=['POST'])
def analyze_uploaded_csv():
    """Run association mining on uploaded CSV/Excel file or CSV text"""
    try:
        ACTIVE_ANALYSIS_CONTEXT['products'] = []
        ACTIVE_ANALYSIS_CONTEXT['rules'] = []
        ACTIVE_ANALYSIS_CONTEXT['algorithm'] = None
        ACTIVE_ANALYSIS_CONTEXT['column_mapping'] = {}
        ACTIVE_ANALYSIS_CONTEXT['analysis'] = None
        ACTIVE_ANALYSIS_CONTEXT['csv_text'] = ''
        ACTIVE_ANALYSIS_CONTEXT['ready'] = False

        csv_text = ""
        
        # Handle multipart/form-data file upload
        if 'file' in request.files:
            file = request.files['file']
            if not file or file.filename == '':
                return jsonify({'error': 'No file selected.'}), 400
            
            file_bytes = file.read()
            csv_text = file_bytes_to_csv_text(file_bytes, file.filename)
            
            # Extract parameters from form fields
            algorithm = str(request.form.get('algorithm', 'fpgrowth')).strip().lower()
            min_support = float(request.form.get('min_support', 0.01))
            min_confidence = float(request.form.get('min_confidence', 0.1))
            min_lift = float(request.form.get('min_lift', 1.0))
            top_n = int(request.form.get('top_n', 400))
            
            # Parse column_mapping from form field (sent as JSON string)
            import json as json_lib
            raw_mapping = {}
            mapping_str = request.form.get('column_mapping', '{}')
            try:
                raw_mapping = json_lib.loads(mapping_str) if mapping_str else {}
            except (json_lib.JSONDecodeError, TypeError):
                raw_mapping = {}
        
        # Handle JSON request with CSV text
        else:
            data = request.json or {}
            csv_text = data.get('csv_text', '')
            algorithm = str(data.get('algorithm', 'fpgrowth')).strip().lower()
            min_support = float(data.get('min_support', 0.01))
            min_confidence = float(data.get('min_confidence', 0.1))
            min_lift = float(data.get('min_lift', 1.0))
            top_n = int(data.get('top_n', 400))
            raw_mapping = data.get('column_mapping', {}) or {}
        
        if not csv_text.strip():
            return jsonify({'error': 'CSV content is required.'}), 400
            
        if algorithm not in {'apriori', 'fpgrowth'}:
            return jsonify({'error': 'Unsupported algorithm. Use apriori or fpgrowth.'}), 400

        if not isinstance(raw_mapping, dict):
            return jsonify({'error': 'column_mapping must be an object of canonical field -> column name.'}), 400
        column_mapping = {str(k): str(v) for k, v in raw_mapping.items() if v}

        result = analyze_csv_text(
            csv_text=csv_text,
            algorithm=algorithm,
            min_support=min_support,
            min_confidence=min_confidence,
            min_lift=min_lift,
            top_n=top_n,
            column_mapping=column_mapping,
        )

        ACTIVE_ANALYSIS_CONTEXT['products'] = result.get('productCatalog', [])
        ACTIVE_ANALYSIS_CONTEXT['rules'] = result.get('rules', [])
        ACTIVE_ANALYSIS_CONTEXT['algorithm'] = algorithm
        ACTIVE_ANALYSIS_CONTEXT['column_mapping'] = result.get('schema', {}).get('mapping', column_mapping)
        ACTIVE_ANALYSIS_CONTEXT['analysis'] = result
        ACTIVE_ANALYSIS_CONTEXT['csv_text'] = csv_text
        ACTIVE_ANALYSIS_CONTEXT['ready'] = True

        return jsonify({
            'analysis': result,
            'algorithm': algorithm,
            'alert': result.get('suitability', {}).get('message', 'Dataset analyzed successfully.')
        }), 200
    except ValueError as exc:
        reason = str(exc)
        ACTIVE_ANALYSIS_CONTEXT['products'] = []
        ACTIVE_ANALYSIS_CONTEXT['rules'] = []
        ACTIVE_ANALYSIS_CONTEXT['algorithm'] = None
        ACTIVE_ANALYSIS_CONTEXT['column_mapping'] = {}
        ACTIVE_ANALYSIS_CONTEXT['analysis'] = None
        ACTIVE_ANALYSIS_CONTEXT['csv_text'] = ''
        ACTIVE_ANALYSIS_CONTEXT['ready'] = False
        return jsonify({
            'error': reason,
            'suitability': {
                'isSuitable': False,
                'message': reason
            },
            'acceptedFormatHint': DATASET_ACCEPTANCE_HINT,
            'alert': f"Dataset not suitable for mining: {reason}. {DATASET_ACCEPTANCE_HINT}"
        }), 400
    except Exception as exc:
        ACTIVE_ANALYSIS_CONTEXT['products'] = []
        ACTIVE_ANALYSIS_CONTEXT['rules'] = []
        ACTIVE_ANALYSIS_CONTEXT['algorithm'] = None
        ACTIVE_ANALYSIS_CONTEXT['column_mapping'] = {}
        ACTIVE_ANALYSIS_CONTEXT['analysis'] = None
        ACTIVE_ANALYSIS_CONTEXT['csv_text'] = ''
        ACTIVE_ANALYSIS_CONTEXT['ready'] = False
        return jsonify({'error': str(exc)}), 500

# ==================== RECOMMENDATIONS ====================
@app.route('/api/recommendations', methods=['POST'])
def get_recommendations():
    """Get product recommendations based on cart items"""
    try:
        data = request.json or {}
        cart_items = data.get('items', [])
        top_n = data.get('top_n', 5)

        if not cart_items:
            return jsonify({'recommendations': []}), 200

        if not ACTIVE_ANALYSIS_CONTEXT['ready']:
            return jsonify({
                'error': 'Upload and analyze a dataset in Workspace first. Recommendations are generated only from your uploaded data.'
            }), 400

        recommendations = _recommend_from_rules(cart_items, ACTIVE_ANALYSIS_CONTEXT['rules'], top_n)
        return jsonify({
            'recommendations': recommendations,
            'source': 'uploaded-analysis-rules',
            'algorithm': ACTIVE_ANALYSIS_CONTEXT['algorithm'],
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ==================== ASSOCIATION RULES ====================
@app.route('/api/rules', methods=['GET'])
def get_rules():
    """Get association rules"""
    try:
        algorithm = request.args.get('algorithm', 'apriori')
        min_confidence = float(request.args.get('min_confidence', 0.3))
        top_n = int(request.args.get('top_n', 20))

        rules = recommender.get_rules(algorithm, min_confidence, top_n)
        return jsonify({'rules': rules}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ==================== CUSTOMER SEGMENTATION ====================
@app.route('/api/segments', methods=['POST'])
def get_segment():
    """Get customer segment based on uploaded dataset analysis"""
    try:
        if not ACTIVE_ANALYSIS_CONTEXT.get('ready'):
            return jsonify({'error': 'No dataset loaded. Upload and analyze a dataset first.'}), 400
        
        data = request.json
        purchase_count = float(data.get('purchase_count', 5))
        avg_price = float(data.get('avg_price', 50))
        total_quantity = float(data.get('total_quantity', 50))

        # Categorize based on input metrics
        if purchase_count > 10 and avg_price > 75:
            segment_num = 3  # High-value frequent buyer
            segment_name = "Premium Frequent Buyer"
            top_products = ACTIVE_ANALYSIS_CONTEXT.get('products', [])[:3]
        elif purchase_count > 5 and avg_price > 40:
            segment_num = 2  # Mid-tier regular
            segment_name = "Regular Mid-Tier Customer"
            top_products = ACTIVE_ANALYSIS_CONTEXT.get('products', [])[:3]
        elif purchase_count > 2:
            segment_num = 1  # Occasional buyer
            segment_name = "Occasional Shopper"
            top_products = ACTIVE_ANALYSIS_CONTEXT.get('products', [])[:3]
        else:
            segment_num = 0  # New/rare
            segment_name = "New/Rare Customer"
            top_products = ACTIVE_ANALYSIS_CONTEXT.get('products', [])[:3]

        # Get item frequency stats from analysis
        item_freq = ACTIVE_ANALYSIS_CONTEXT.get('itemFrequency', {})
        avg_item_price = avg_price / max(1, total_quantity / 10)

        return jsonify({
            'segment': segment_num,
            'segment_name': segment_name,
            'confidence': 0.75 + (0.15 if purchase_count > 5 else 0),
            'segment_profile': {
                'size_percent': 15 + (segment_num * 5),
                'avg_purchase_value': avg_price,
                'top_products': top_products
            },
            'characteristics': f"Customers with ~{int(purchase_count)} purchases, avg ${avg_price:.2f} per transaction, buying {int(total_quantity)} units total.",
            'strategy': "Tailor recommendations and offers based on segment behavior patterns."
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ==================== PURCHASE PREDICTION ====================
@app.route('/api/predict', methods=['POST'])
def predict_purchase():
    """Predict purchase likelihood based on uploaded dataset rules"""
    try:
        if not ACTIVE_ANALYSIS_CONTEXT.get('ready'):
            return jsonify({'error': 'No dataset loaded. Upload and analyze a dataset first.'}), 400
        
        data = request.json
        products = data.get('products', [])

        if not products:
            return jsonify({'error': 'No products in basket.'}), 400

        rules = ACTIVE_ANALYSIS_CONTEXT.get('rules', [])
        item_freq = ACTIVE_ANALYSIS_CONTEXT.get('itemFrequency', [])

        # Find matching rules where products are antecedents
        next_products = {}
        for rule in rules:
            antecedents = _split_items(rule.get('antecedent', ''))
            consequents = _split_items(rule.get('consequent', ''))
            
            # Check if rule applies to current basket
            if any(p.lower() in [a.lower() for a in antecedents] for p in products):
                confidence = float(rule.get('confidence', 0.0))
                for consequent in consequents:
                    if consequent not in next_products:
                        next_products[consequent] = []
                    next_products[consequent].append(confidence)

        # Get top 3 next products with average confidence
        top_next = sorted(
            [(item, sum(confs) / len(confs)) for item, confs in next_products.items()],
            key=lambda x: x[1],
            reverse=True
        )[:3]

        # Calculate overall likelihood
        likelihood = min(100, int((sum([conf for _, conf in top_next]) / len(top_next) * 100) if top_next else 30))
        confidence_val = max([conf for _, conf in top_next]) if top_next else 0.5

        return jsonify({
            'will_buy_high_quantity': likelihood / 100.0,
            'confidence': confidence_val,
            'likelihood_percent': likelihood,
            'confidence_label': 'High' if confidence_val > 0.8 else 'Moderate' if confidence_val > 0.6 else 'Low',
            'next_products': [
                {'product': item, 'probability': float(conf)} 
                for item, conf in top_next
            ],
            'explanation': f'Based on the {len(products)} product(s) in basket and analysis rules, there is a {likelihood}% likelihood of high-quantity purchase.',
            'risk_factors': ['Limited historical data'] if len(products) < 2 else []
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ==================== ANALYTICS ====================
@app.route('/api/analytics', methods=['GET'])
def get_analytics():
    """Get overall analytics (active dataset first, static model fallback second)."""
    try:
        if ACTIVE_ANALYSIS_CONTEXT.get('ready'):
            overview = _build_bi_overview_payload()
            if overview.get('ready'):
                kpis = overview.get('kpis', {})
                top_products = {
                    row.get('name', ''): int(row.get('transactionCount', 0))
                    for row in overview.get('products', [])[:10]
                    if row.get('name')
                }
                return jsonify({
                    'total_transactions': int(kpis.get('totalTransactions', 0)),
                    'total_revenue': float(kpis.get('totalRevenue', 0.0)),
                    'unique_products': int(kpis.get('uniqueProducts', 0)),
                    'avg_transaction_value': float(kpis.get('averageBasketValue', 0.0)),
                    'items_per_basket': float(kpis.get('itemsPerBasket', 0.0)),
                    'top_products': top_products,
                    'source': 'active-uploaded-dataset',
                }), 200

        analytics = recommender.get_analytics()
        analytics['source'] = 'fallback-trained-model-data'
        return jsonify(analytics), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ==================== BI OVERVIEW ====================
@app.route('/api/bi/overview', methods=['GET'])
def get_bi_overview():
    """Get BI dashboard payload for active uploaded dataset."""
    try:
        payload = _build_bi_overview_payload()
        if not payload.get('ready'):
            return jsonify(payload), 400
        return jsonify(payload), 200
    except Exception as exc:
        return jsonify({'ready': False, 'error': str(exc)}), 500


# ==================== BI PRODUCT DETAIL ====================
@app.route('/api/bi/product-detail', methods=['GET'])
def get_bi_product_detail():
    """Get BI detail view for a selected product."""
    try:
        product_name = str(request.args.get('product', '') or '').strip()
        payload = _build_bi_product_detail(product_name)
        if not payload.get('ready'):
            return jsonify(payload), 400
        return jsonify(payload), 200
    except Exception as exc:
        return jsonify({'ready': False, 'error': str(exc)}), 500

# ==================== PRODUCT DETAILS ====================
@app.route('/api/products/<path:product_name>', methods=['GET'])
def get_product_details(product_name):
    """Get product details"""
    try:
        details = recommender.get_product_details(product_name)
        if details:
            return jsonify(details), 200
        else:
            return jsonify({'error': 'Product not found'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ==================== MODEL STATUS ====================
@app.route('/api/models', methods=['GET'])
def get_model_status():
    """Get model status"""
    status = {
        'apriori': recommender.apriori_data is not None,
        'fpgrowth': recommender.fpgrowth_data is not None,
        'kmeans': recommender.kmeans_data is not None,
        'decision_tree': recommender.dt_data is not None
    }
    return jsonify(status), 200

# ==================== AVAILABLE PRODUCTS ====================
@app.route('/api/products', methods=['GET'])
def get_products():
    """Get all available products"""
    try:
        if not ACTIVE_ANALYSIS_CONTEXT['ready']:
            return jsonify({
                'products': [],
                'ready': False,
                'message': 'Upload and analyze a dataset in Workspace to load products.',
            }), 200

        return jsonify({
            'products': ACTIVE_ANALYSIS_CONTEXT['products'],
            'ready': True,
            'source': 'uploaded-dataset',
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ==================== FREQUENTLY BOUGHT TOGETHER ====================
@app.route('/api/fbt', methods=['POST'])
def get_fbt():
    """Get frequently bought together products"""
    try:
        data = request.json
        product = data.get('product', '')
        top_n = data.get('top_n', 5)

        if not product:
            return jsonify({'error': 'Product name required'}), 400

        recommendations = recommender.get_recommendations([product], 'apriori', top_n)
        return jsonify({'frequently_bought_together': recommendations}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ==================== ERROR HANDLERS ====================
@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Endpoint not found'}), 404

@app.errorhandler(500)
def server_error(error):
    return jsonify({'error': 'Internal server error', 'details': str(error)}), 500

# ==================== MAIN ====================
if __name__ == '__main__':
    print("=" * 60)
    print("MARKET BASKET ANALYSIS - FLASK API")
    print("=" * 60)
    print("API running on http://localhost:5000")
    print("Available endpoints:")
    print("  - GET  /api/health")
    print("  - POST /api/recommendations")
    print("  - GET  /api/rules")
    print("  - POST /api/segments")
    print("  - POST /api/predict")
    print("  - GET  /api/analytics")
    print("  - GET  /api/bi/overview")
    print("  - GET  /api/bi/product-detail?product=<name>")
    print("  - GET  /api/products")
    print("  - POST /api/fbt")
    print("  - GET  /api/models")
    print("=" * 60)
    app.run(debug=True, port=5000)
