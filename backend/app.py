from flask import Flask, request, jsonify
from flask_cors import CORS
from recommender import Recommender
from mining_live import analyze_csv_text
import traceback

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
    'ready': False,
}


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

# ==================== HEALTH CHECK ====================
@app.route('/', methods=['GET'])
def api_index():
    """API index endpoint for quick browser checks"""
    return jsonify({
        'status': 'ok',
        'message': 'Market Basket Analysis API is running',
        'endpoints': [
            '/api/health',
            '/api/analyze',
            '/api/recommendations',
            '/api/rules',
            '/api/segments',
            '/api/predict',
            '/api/analytics',
            '/api/products',
            '/api/fbt',
            '/api/models',
        ]
    }), 200


@app.route('/api/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({'status': 'ok', 'message': 'Flask API is running'}), 200


# ==================== LIVE DATA MINING ====================
@app.route('/api/analyze', methods=['POST'])
def analyze_uploaded_csv():
    """Run association mining directly on uploaded CSV text"""
    try:
        ACTIVE_ANALYSIS_CONTEXT['products'] = []
        ACTIVE_ANALYSIS_CONTEXT['rules'] = []
        ACTIVE_ANALYSIS_CONTEXT['algorithm'] = None
        ACTIVE_ANALYSIS_CONTEXT['ready'] = False

        data = request.json or {}
        csv_text = data.get('csv_text', '')
        algorithm = str(data.get('algorithm', 'fpgrowth')).strip().lower()
        if algorithm not in {'apriori', 'fpgrowth'}:
            return jsonify({'error': 'Unsupported algorithm. Use apriori or fpgrowth.'}), 400

        min_support = float(data.get('min_support', 0.01))
        min_confidence = float(data.get('min_confidence', 0.1))
        min_lift = float(data.get('min_lift', 1.0))
        top_n = int(data.get('top_n', 400))

        result = analyze_csv_text(
            csv_text=csv_text,
            algorithm=algorithm,
            min_support=min_support,
            min_confidence=min_confidence,
            min_lift=min_lift,
            top_n=top_n,
        )

        ACTIVE_ANALYSIS_CONTEXT['products'] = result.get('productCatalog', [])
        ACTIVE_ANALYSIS_CONTEXT['rules'] = result.get('rules', [])
        ACTIVE_ANALYSIS_CONTEXT['algorithm'] = algorithm
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
    """Get overall analytics"""
    try:
        analytics = recommender.get_analytics()
        return jsonify(analytics), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

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
    print("  - GET  /api/products")
    print("  - POST /api/fbt")
    print("  - GET  /api/models")
    print("=" * 60)
    app.run(debug=True, port=5000)
