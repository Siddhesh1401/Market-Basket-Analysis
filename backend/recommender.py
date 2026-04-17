import pandas as pd
import numpy as np
import joblib
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
MODEL_DIR = BASE_DIR / "models"
DATA_PATH = BASE_DIR / "data" / "retail.csv"

class Recommender:
    def __init__(self):
        """Initialize recommender with trained models"""
        self.apriori_data = None
        self.fpgrowth_data = None
        self.kmeans_data = None
        self.dt_data = None
        self.df = None
        self.fallback_index = {}
        self.fallback_lookup = {}
        self.fallback_total_transactions = 0
        self.load_models()

    def _build_fallback_recommendations(self):
        """Build a recommendation index directly from transaction co-occurrence."""
        self.fallback_index = {}
        self.fallback_lookup = {}
        self.fallback_total_transactions = 0

        if self.df is None:
            return

        if 'InvoiceNo' not in self.df.columns or 'Description' not in self.df.columns:
            return

        working = self.df[['InvoiceNo', 'Description']].dropna().copy()
        if working.empty:
            return

        working['InvoiceNo'] = working['InvoiceNo'].astype(str).str.strip()
        working['Description'] = working['Description'].astype(str).str.strip()
        working = working[(working['InvoiceNo'] != '') & (working['Description'] != '')]

        if working.empty:
            return

        grouped = (
            working.groupby('InvoiceNo')['Description']
            .apply(lambda values: sorted(set(values)))
        )

        transactions = [items for items in grouped.tolist() if len(items) > 0]
        self.fallback_total_transactions = len(transactions)
        if self.fallback_total_transactions < 2:
            return

        item_counts = {}
        pair_counts = {}

        for items in transactions:
            for item in items:
                item_counts[item] = item_counts.get(item, 0) + 1

            for i in range(len(items)):
                for j in range(i + 1, len(items)):
                    pair = (items[i], items[j])
                    pair_counts[pair] = pair_counts.get(pair, 0) + 1

        recommendations_by_item = {}

        for (a, b), pair_count in pair_counts.items():
            support_ab = pair_count / self.fallback_total_transactions

            support_a = item_counts[a] / self.fallback_total_transactions if item_counts.get(a) else 0
            support_b = item_counts[b] / self.fallback_total_transactions if item_counts.get(b) else 0

            confidence_a_to_b = pair_count / item_counts[a] if item_counts.get(a) else 0
            confidence_b_to_a = pair_count / item_counts[b] if item_counts.get(b) else 0

            lift_a_to_b = (confidence_a_to_b / support_b) if support_b > 0 else 1.0
            lift_b_to_a = (confidence_b_to_a / support_a) if support_a > 0 else 1.0

            recommendations_by_item.setdefault(a, []).append({
                'product': b,
                'confidence': float(confidence_a_to_b),
                'lift': float(lift_a_to_b),
                'support': float(support_ab),
            })

            recommendations_by_item.setdefault(b, []).append({
                'product': a,
                'confidence': float(confidence_b_to_a),
                'lift': float(lift_b_to_a),
                'support': float(support_ab),
            })

        for antecedent, records in recommendations_by_item.items():
            records.sort(key=lambda row: (row['confidence'], row['lift'], row['support']), reverse=True)
            self.fallback_index[antecedent] = records
            self.fallback_lookup[antecedent.lower()] = antecedent

    def load_models(self):
        """Load all trained models"""
        try:
            apriori_path = MODEL_DIR / 'apriori_model.pkl'
            fpgrowth_path = MODEL_DIR / 'fpgrowth_model.pkl'
            kmeans_path = MODEL_DIR / 'kmeans_model.pkl'
            dtree_path = MODEL_DIR / 'decision_tree_model.pkl'

            if apriori_path.exists():
                self.apriori_data = joblib.load(apriori_path)
            if fpgrowth_path.exists():
                self.fpgrowth_data = joblib.load(fpgrowth_path)
            if kmeans_path.exists():
                self.kmeans_data = joblib.load(kmeans_path)
            if dtree_path.exists():
                self.dt_data = joblib.load(dtree_path)

            # Load dataset for additional analytics (with encoding handling)
            try:
                self.df = pd.read_csv(DATA_PATH)
            except UnicodeDecodeError:
                self.df = pd.read_csv(DATA_PATH, encoding='ISO-8859-1')

            self.df = self.df.dropna(subset=['InvoiceNo', 'StockCode', 'Description'])
            self.df['UnitPrice'] = pd.to_numeric(self.df['UnitPrice'], errors='coerce')
            self.df['Quantity'] = pd.to_numeric(self.df['Quantity'], errors='coerce')
            self.df = self.df[(self.df['Quantity'] > 0) & (self.df['UnitPrice'] > 0)]

            # Build fallback recommendation index so simulator works even if model files are missing.
            self._build_fallback_recommendations()
        except Exception as e:
            print(f"Error loading models: {e}")

    def get_recommendations(self, cart_items, algorithm='apriori', top_n=5):
        """Get product recommendations based on cart items"""
        top_n = max(1, int(top_n))

        if algorithm == 'apriori' and self.apriori_data:
            rules = self.apriori_data['rules']
        elif algorithm == 'fpgrowth' and self.fpgrowth_data:
            rules = self.fpgrowth_data['rules']
        else:
            rules = None

        recommendations = []

        if rules is not None:
            for item in cart_items:
                # Find rules where this item is an antecedent
                matching_rules = rules[rules['antecedents'].str.contains(item, case=False, na=False)]

                for _, rule in matching_rules.iterrows():
                    consequents = rule['consequents'].split(', ')
                    for consequent in consequents:
                        if consequent not in cart_items:
                            recommendations.append({
                                'product': consequent,
                                'confidence': float(rule['confidence']),
                                'lift': float(rule['lift']) if 'lift' in rule else 1.0,
                                'support': float(rule['support']) if 'support' in rule else 0.0
                            })

        # Fallback recommendations from transaction co-occurrence if models are unavailable
        if not recommendations and self.fallback_index:
            cart_lookup = {str(item).strip().lower() for item in cart_items}
            candidate_scores = {}

            for raw_item in cart_items:
                key = str(raw_item).strip().lower()
                canonical = self.fallback_lookup.get(key)
                if not canonical:
                    continue

                for rec in self.fallback_index.get(canonical, []):
                    product_key = rec['product'].lower()
                    if product_key in cart_lookup:
                        continue

                    existing = candidate_scores.get(product_key)
                    if existing is None or (rec['confidence'], rec['lift'], rec['support']) > (
                        existing['confidence'],
                        existing['lift'],
                        existing['support'],
                    ):
                        candidate_scores[product_key] = rec

            recommendations = list(candidate_scores.values())

        # Sort by confidence and lift
        recommendations = sorted(
            recommendations,
            key=lambda x: (x['confidence'], x['lift']),
            reverse=True
        )

        # Remove duplicates
        seen = set()
        unique_recommendations = []
        for rec in recommendations:
            if rec['product'] not in seen:
                unique_recommendations.append(rec)
                seen.add(rec['product'])
                if len(unique_recommendations) >= top_n:
                    break

        return unique_recommendations

    def get_rules(self, algorithm='apriori', min_confidence=0.3, top_n=20):
        """Get association rules"""
        if algorithm == 'apriori' and self.apriori_data:
            rules = self.apriori_data['rules']
        elif algorithm == 'fpgrowth' and self.fpgrowth_data:
            rules = self.fpgrowth_data['rules']
        else:
            return []

        # Filter by confidence
        filtered_rules = rules[rules['confidence'] >= min_confidence]

        # Sort by lift
        if 'lift' in filtered_rules.columns:
            filtered_rules = filtered_rules.sort_values('lift', ascending=False)

        # Convert to list of dicts
        result = []
        for _, rule in filtered_rules.head(top_n).iterrows():
            result.append({
                'antecedent': rule['antecedents'],
                'consequent': rule['consequents'],
                'confidence': float(rule['confidence']),
                'lift': float(rule['lift']) if 'lift' in rule else 1.0,
                'support': float(rule['support']) if 'support' in rule else 0.0
            })

        return result

    def get_customer_segment(self, purchase_count, avg_price, total_quantity):
        """Predict customer segment"""
        if not self.kmeans_data:
            return None

        kmeans = self.kmeans_data['model']
        scaler = self.kmeans_data['scaler']

        X = np.array([[purchase_count, avg_price, total_quantity]])
        X_scaled = scaler.transform(X)
        segment = kmeans.predict(X_scaled)[0]

        # Get segment info
        data = self.kmeans_data['data']
        segment_stats = data[data['segment'] == segment].describe().to_dict()

        return {
            'segment': int(segment),
            'characteristics': {
                'avg_purchases': float(data[data['segment'] == segment]['purchases'].mean()),
                'avg_price': float(data[data['segment'] == segment]['avg_price'].mean()),
                'avg_quantity': float(data[data['segment'] == segment]['total_quantity'].mean())
            }
        }

    def predict_purchase_likelihood(self, products):
        """Predict if customer will purchase high quantity"""
        if not self.dt_data:
            return None

        dt = self.dt_data['model']
        available_products = self.dt_data['products']

        # Create feature vector
        features = [1 if prod in products else 0 for prod in available_products]
        probability = dt.predict_proba([features])[0]

        return {
            'will_buy_high_quantity': float(probability[1]),
            'confidence': float(max(probability))
        }

    def get_analytics(self):
        """Get overall analytics"""
        if self.df is None:
            return {}

        transactions = self.df['InvoiceNo'].nunique()
        total_revenue = (self.df['Quantity'] * self.df['UnitPrice']).sum()
        unique_products = self.df['Description'].nunique()
        unique_customers = self.df['CustomerID'].nunique()
        avg_transaction_value = total_revenue / transactions

        # Top products by frequency
        top_products = self.df['Description'].value_counts().head(10).to_dict()

        return {
            'total_transactions': int(transactions),
            'total_revenue': float(total_revenue),
            'unique_products': int(unique_products),
            'unique_customers': int(unique_customers),
            'avg_transaction_value': float(avg_transaction_value),
            'top_products': {k: int(v) for k, v in top_products.items()}
        }

    def get_product_details(self, product_name):
        """Get details about a product"""
        if self.df is None:
            return None

        product_data = self.df[self.df['Description'].str.contains(product_name, case=False, na=False)]

        if len(product_data) == 0:
            return None

        return {
            'name': product_name,
            'total_sold': int(product_data['Quantity'].sum()),
            'avg_price': float(product_data['UnitPrice'].mean()),
            'frequency': int(len(product_data)),
            'total_revenue': float((product_data['Quantity'] * product_data['UnitPrice']).sum())
        }
