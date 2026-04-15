import pandas as pd
import numpy as np
from mlxtend.frequent_patterns import apriori, fpgrowth
from mlxtend.preprocessing import TransactionEncoder
from sklearn.cluster import KMeans
from sklearn.tree import DecisionTreeClassifier
from sklearn.preprocessing import StandardScaler
import joblib
import os
from datetime import datetime

# Configuration
DATA_FILE = "data/retail.csv"
MODEL_DIR = "models"

def load_and_prepare_data():
    """Load and clean the retail dataset"""
    print("Loading dataset...")
    try:
        # Try UTF-8 first, then fall back to ISO-8859-1 (Latin-1)
        try:
            df = pd.read_csv(DATA_FILE)
        except UnicodeDecodeError:
            df = pd.read_csv(DATA_FILE, encoding='ISO-8859-1')
    except Exception as exc:
        raise RuntimeError(f"Failed to read dataset: {exc}") from exc

    # Clean data
    df = df.dropna(subset=['InvoiceNo', 'StockCode', 'Description'])
    df['UnitPrice'] = pd.to_numeric(df['UnitPrice'], errors='coerce')
    df['Quantity'] = pd.to_numeric(df['Quantity'], errors='coerce')
    df = df[(df['Quantity'] > 0) & (df['UnitPrice'] > 0)]

    print(f"Dataset loaded: {len(df)} transactions, {df['InvoiceNo'].nunique()} unique invoices")
    return df

def train_apriori(df, min_support=0.01):
    """Train Apriori model"""
    print("\nTraining Apriori model...")

    # Create transaction list
    transactions = df.groupby('InvoiceNo')['Description'].apply(list).values
    te = TransactionEncoder()
    te_ary = te.fit(transactions).transform(transactions)
    frequent_itemsets = apriori(pd.DataFrame(te_ary, columns=te.columns_),
                                min_support=min_support, use_colnames=True)

    # Generate rules
    from mlxtend.frequent_patterns import association_rules
    if len(frequent_itemsets) > 1:
        rules = association_rules(frequent_itemsets, metric="confidence", min_threshold=0.3)
        rules['antecedents'] = rules['antecedents'].apply(lambda x: ', '.join(list(x)))
        rules['consequents'] = rules['consequents'].apply(lambda x: ', '.join(list(x)))
    else:
        rules = pd.DataFrame(columns=['antecedents', 'consequents', 'support', 'confidence', 'lift'])

    joblib.dump({'itemsets': frequent_itemsets, 'rules': rules},
                f'{MODEL_DIR}/apriori_model.pkl')
    print(f"Apriori: {len(rules)} rules generated")
    return rules

def train_fpgrowth(df, min_support=0.01):
    """Train FP-Growth model"""
    print("Training FP-Growth model...")

    # Create transaction list
    transactions = df.groupby('InvoiceNo')['Description'].apply(list).values
    te = TransactionEncoder()
    te_ary = te.fit(transactions).transform(transactions)
    frequent_itemsets = fpgrowth(pd.DataFrame(te_ary, columns=te.columns_),
                                 min_support=min_support, use_colnames=True)

    # Generate rules
    from mlxtend.frequent_patterns import association_rules
    if len(frequent_itemsets) > 1:
        rules = association_rules(frequent_itemsets, metric="confidence", min_threshold=0.3)
        rules['antecedents'] = rules['antecedents'].apply(lambda x: ', '.join(list(x)))
        rules['consequents'] = rules['consequents'].apply(lambda x: ', '.join(list(x)))
    else:
        rules = pd.DataFrame(columns=['antecedents', 'consequents', 'support', 'confidence', 'lift'])

    joblib.dump({'itemsets': frequent_itemsets, 'rules': rules},
                f'{MODEL_DIR}/fpgrowth_model.pkl')
    print(f"FP-Growth: {len(rules)} rules generated")
    return rules

def train_kmeans(df, n_clusters=5):
    """Train K-Means clustering model"""
    print("Training K-Means model...")

    # Aggregate by customer
    customer_data = df.groupby('CustomerID').agg({
        'InvoiceNo': 'count',
        'UnitPrice': 'mean',
        'Quantity': 'sum'
    }).reset_index()
    customer_data.columns = ['CustomerID', 'purchases', 'avg_price', 'total_quantity']

    # Scale features
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(customer_data[['purchases', 'avg_price', 'total_quantity']])

    # Train K-Means
    kmeans = KMeans(n_clusters=n_clusters, random_state=42, n_init=10)
    clusters = kmeans.fit_predict(X_scaled)

    customer_data['segment'] = clusters

    joblib.dump({'model': kmeans, 'scaler': scaler, 'data': customer_data},
                f'{MODEL_DIR}/kmeans_model.pkl')
    print(f"K-Means: {n_clusters} segments created")

    # Print segment stats
    for i in range(n_clusters):
        segment_data = customer_data[customer_data['segment'] == i]
        print(f"  Segment {i}: {len(segment_data)} customers, Avg purchases: {segment_data['purchases'].mean():.1f}")

    return customer_data

def train_decision_tree(df):
    """Train Decision Tree for purchase prediction"""
    print("Training Decision Tree model...")

    # Create features: products bought
    products = df['Description'].unique()[:20]  # Top 20 products
    product_features = pd.DataFrame()

    for product in products:
        product_features[product] = (df['Description'] == product).astype(int)

    # Create target: whether customer will purchase again (based on quantity >= 5)
    product_features['will_buy'] = (df['Quantity'] >= 5).astype(int)
    product_features = product_features.dropna()

    if len(product_features) > 0:
        X = product_features.drop('will_buy', axis=1)
        y = product_features['will_buy']

        dt = DecisionTreeClassifier(max_depth=5, random_state=42)
        dt.fit(X, y)

        joblib.dump({'model': dt, 'products': products},
                    f'{MODEL_DIR}/decision_tree_model.pkl')
        accuracy = dt.score(X, y)
        print(f"Decision Tree: Accuracy = {accuracy:.2%}")
    else:
        print("Decision Tree: Insufficient data")

def main():
    """Main training pipeline"""
    os.makedirs(MODEL_DIR, exist_ok=True)

    print("=" * 60)
    print("MARKET BASKET ANALYSIS - MODEL TRAINING")
    print(f"Started: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 60)

    # Load data
    df = load_and_prepare_data()

    # Train all models
    apriori_rules = train_apriori(df)
    fpgrowth_rules = train_fpgrowth(df)
    kmeans_data = train_kmeans(df)
    train_decision_tree(df)

    print("\n" + "=" * 60)
    print(f"Training completed: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("All models saved to models/ directory")
    print("=" * 60)

if __name__ == "__main__":
    main()
