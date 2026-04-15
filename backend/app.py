from flask import Flask, request, jsonify
from flask_cors import CORS
from recommender import Recommender
from mining_live import analyze_csv_text
import traceback

app = Flask(__name__)
CORS(app)

# Initialize recommender
recommender = Recommender()

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
    """Run FP-Growth directly on uploaded CSV text"""
    try:
        data = request.json or {}
        csv_text = data.get('csv_text', '')
        algorithm = 'fpgrowth'
        min_support = float(data.get('min_support', 0.01))
        min_confidence = float(data.get('min_confidence', 0.1))
        min_lift = float(data.get('min_lift', 1.0))

        result = analyze_csv_text(
            csv_text=csv_text,
            algorithm=algorithm,
            min_support=min_support,
            min_confidence=min_confidence,
            min_lift=min_lift,
        )

        return jsonify({
            'analysis': result,
            'algorithm': algorithm,
            'alert': result.get('suitability', {}).get('message', 'Dataset analyzed successfully.')
        }), 200
    except ValueError as exc:
        return jsonify({
            'error': str(exc),
            'suitability': {
                'isSuitable': False,
                'message': str(exc)
            },
            'alert': f"Dataset not suitable for mining: {exc}"
        }), 400
    except Exception as exc:
        return jsonify({'error': str(exc)}), 500

# ==================== RECOMMENDATIONS ====================
@app.route('/api/recommendations', methods=['POST'])
def get_recommendations():
    """Get product recommendations based on cart items"""
    try:
        data = request.json
        cart_items = data.get('items', [])
        algorithm = data.get('algorithm', 'apriori')
        top_n = data.get('top_n', 5)

        if not cart_items:
            return jsonify({'recommendations': []}), 200

        recommendations = recommender.get_recommendations(cart_items, algorithm, top_n)
        return jsonify({'recommendations': recommendations}), 200
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
    """Get customer segment"""
    try:
        data = request.json
        purchase_count = float(data.get('purchase_count', 0))
        avg_price = float(data.get('avg_price', 0))
        total_quantity = float(data.get('total_quantity', 0))

        segment = recommender.get_customer_segment(purchase_count, avg_price, total_quantity)
        return jsonify(segment), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ==================== PURCHASE PREDICTION ====================
@app.route('/api/predict', methods=['POST'])
def predict_purchase():
    """Predict purchase likelihood"""
    try:
        data = request.json
        products = data.get('products', [])

        prediction = recommender.predict_purchase_likelihood(products)
        return jsonify(prediction), 200
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
        if recommender.df is None:
            return jsonify({'products': []}), 200

        products = recommender.df['Description'].unique().tolist()[:100]  # Top 100 products
        return jsonify({'products': products}), 200
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
