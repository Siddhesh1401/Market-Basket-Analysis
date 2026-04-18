import { useMemo, useState } from "react";
import { FiBell, FiCopy, FiDownload, FiInfo, FiLoader, FiPlus, FiSearch, FiTarget, FiTrendingUp, FiX } from "react-icons/fi";
import type { AnalysisResult } from "../types";

type PredictionProps = {
  analysis: AnalysisResult | null;
  datasetLoaded: boolean;
};

interface PurchasePrediction {
  likelihood_percent: number;
  confidence: string;
  next_products: Array<{
    product: string;
    probability: number;
  }>;
  explanation: string;
  risk_factors: string[];
}

function Prediction({ analysis, datasetLoaded }: PredictionProps) {
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [predictionError, setPredictionError] = useState("");
  const [predictionResult, setPredictionResult] = useState<PurchasePrediction | null>(null);
  const [hasRequested, setHasRequested] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState("");

  const allProducts = useMemo(() => {
    if (!analysis) return [];
    const products = new Set<string>();
    analysis.productCatalog?.forEach((item) => products.add(item.trim()));
    analysis.itemFrequency.forEach((item) => products.add(item.item));
    analysis.rules.forEach((rule) => {
      rule.antecedent.split(",").forEach((item) => products.add(item.trim()));
      rule.consequent.split(",").forEach((item) => products.add(item.trim()));
    });
    return Array.from(products).sort();
  }, [analysis]);

  const filteredProducts = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (needle.length < 2) return [];
    return allProducts
      .filter((item) => !selectedItems.includes(item) && item.toLowerCase().includes(needle))
      .slice(0, 50);
  }, [allProducts, query, selectedItems]);

  const popularProducts = useMemo(() => {
    if (!analysis) return [];
    return analysis.itemFrequency
      .map((entry) => entry.item)
      .filter((item) => !selectedItems.includes(item))
      .slice(0, 8);
  }, [analysis, selectedItems]);

  const toggleItem = (item: string) => {
    setSelectedItems((prev) => (prev.includes(item) ? prev.filter((v) => v !== item) : [...prev, item]));
    setHasRequested(false);
    setPredictionResult(null);
    setPredictionError("");
  };

  const runPrediction = async () => {
    if (!analysis) {
      setPredictionError(
        datasetLoaded
          ? "Dataset uploaded, but analysis is not complete yet. Run analysis in Workspace first."
          : "Upload and analyze a dataset in Workspace first.",
      );
      setPredictionResult(null);
      setHasRequested(true);
      return;
    }

    if (selectedItems.length === 0) {
      setPredictionError("Add at least one product to the basket before predicting.");
      setPredictionResult(null);
      setHasRequested(true);
      return;
    }

    setIsLoading(true);
    setHasRequested(true);
    setPredictionError("");
    setPredictionResult(null);

    try {
      const response = await fetch("http://localhost:5000/api/predict", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          products: selectedItems,
        }),
      });

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { error?: string } | null;
        const message = body?.error ?? "Prediction failed.";
        throw new Error(message);
      }

      const body = (await response.json()) as any;
      if (body && body.will_buy_high_quantity !== undefined) {
        const likelihood = body.likelihood_percent || Math.round(body.will_buy_high_quantity * 100);
        setPredictionResult({
          likelihood_percent: likelihood,
          confidence: body.confidence_label || (body.confidence > 0.8 ? "High" : body.confidence > 0.6 ? "Moderate" : "Low"),
          next_products: (body.next_products || []).map((item: any) => ({
            product: item.product || item.item,
            probability: item.probability || 0.5,
          })),
          explanation: body.explanation || `Based on the selected products, there is a ${likelihood}% likelihood of high-quantity purchase.`,
          risk_factors: body.risk_factors || [],
        });
      } else {
        throw new Error(body?.error || "No prediction result returned.");
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Prediction failed.";
      setPredictionError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const copyResult = () => {
    if (!predictionResult) return;

    const text = `Purchase Likelihood Prediction
Likelihood: ${predictionResult.likelihood_percent}%
Confidence: ${predictionResult.confidence}

Next Products Likely to Buy:
${predictionResult.next_products.map((p) => `- ${p.product} (${(p.probability * 100).toFixed(0)}%)`).join("\n")}

Explanation: ${predictionResult.explanation}

Risk Factors: ${predictionResult.risk_factors.join(", ")}`;

    navigator.clipboard.writeText(text);
    setCopyFeedback("Copied!");
    setTimeout(() => setCopyFeedback(""), 2000);
  };

  const addTopProduct = () => {
    if (predictionResult && predictionResult.next_products.length > 0) {
      const topProduct = predictionResult.next_products[0].product;
      if (!selectedItems.includes(topProduct)) {
        toggleItem(topProduct);
      }
    }
  };

  const getLikelihoodColor = (percent: number) => {
    if (percent >= 70) return "green";
    if (percent >= 40) return "blue";
    return "amber";
  };

  const getConfidenceLabel = (conf: string) => {
    if (conf.includes("High")) return "green";
    if (conf.includes("Moderate")) return "blue";
    return "amber";
  };

  return (
    <div className="page-shell">
      <section className="hero-mini workflow-hero">
        <p className="hero-eyebrow">Predictive Analytics</p>
        <h1>Purchase Likelihood Predictor</h1>
        <p>Build a basket and predict the likelihood of purchase completion with confidence metrics and explanations.</p>
        <div className="hero-inline-metrics">
          <span>
            <FiTarget /> Basket-Based Prediction
          </span>
          <span>
            <FiTrendingUp /> Likelihood Scoring
          </span>
          <span>
            <FiBell /> Next Product Recommendations
          </span>
        </div>
      </section>

      <section className="analyzer-grid analyzer-grid-v2">
        <article className="surface-card analyzer-builder analyzer-builder-v2">
          <div className="stage-head stage-head-slim">
            <p className="stage-kicker">Step 1 of 2</p>
            <h2>Build Prediction Basket</h2>
            <p>Add products the customer has shown interest in.</p>
          </div>

          {!analysis && (
            <article className="sim-card blocked-hint-card">
              <FiInfo className="blocked-hint-icon" />
              <p className="blocked-hint-title">{datasetLoaded ? "Dataset ready, analysis pending" : "No dataset loaded"}</p>
              <p className="blocked-hint-text">
                {datasetLoaded
                  ? "Run analysis in Workspace to unlock prediction outputs."
                  : "Upload and analyze a dataset in Workspace first to use predictions."}
              </p>
            </article>
          )}

          <article className="sim-card">
            <p className="sim-card-title">Current Basket ({selectedItems.length})</p>
            <div className="selected-basket selected-basket-v2">
              {selectedItems.length === 0 ? (
                <p className="muted-text">No items yet. Add products below to start prediction.</p>
              ) : (
                selectedItems.map((item) => (
                  <button key={item} type="button" className="basket-chip" onClick={() => toggleItem(item)}>
                    {item}
                    <FiX />
                  </button>
                ))
              )}
            </div>
          </article>

          <article className="sim-card">
            <p className="sim-card-title">Add Products</p>

            {analysis && popularProducts.length > 0 && (
              <div className="sim-quick-section">
                <p className="sim-subsection-title">Popular Items</p>
                <div className="starter-template-row">
                  {popularProducts.map((item) => (
                    <button key={item} type="button" className="starter-template-chip" onClick={() => toggleItem(item)}>
                      <FiPlus /> {item}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="sim-search-section">
              <p className="sim-subsection-title">Search Catalog</p>
              <label className="rule-search-input simulator-search" htmlFor="pred-product-search">
                <FiSearch />
                <input
                  id="pred-product-search"
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Type product name..."
                  disabled={!analysis}
                />
              </label>

              <div className="product-pool product-pool-v2">
                {!analysis && <p className="muted-text">No products available yet.</p>}
                {analysis && query.trim().length < 2 && <p className="muted-text">Type at least 2 characters to search.</p>}
                {analysis && query.trim().length >= 2 && filteredProducts.length === 0 && (
                  <p className="muted-text">No products found. Try different keywords.</p>
                )}
                {analysis &&
                  filteredProducts.map((item) => (
                    <button key={item} type="button" className="product-pill" onClick={() => toggleItem(item)}>
                      <FiPlus /> {item}
                    </button>
                  ))}
              </div>
            </div>
          </article>

          <div className="profile-actions sim-primary-actions">
            <button className="primary-btn" type="button" onClick={runPrediction} disabled={isLoading || !analysis}>
              {isLoading ? <FiLoader className="spin" /> : <FiBell />}
              {isLoading ? "Predicting..." : "Predict Purchase"}
            </button>
          </div>
        </article>

        <article className="surface-card analyzer-results analyzer-results-v2">
          <div className="stage-head stage-head-slim">
            <p className="stage-kicker">Step 2 of 2</p>
            <h2>Prediction Results</h2>
            <p>Likelihood score and next product recommendations.</p>
          </div>

          {!hasRequested && (
            <article className="sim-empty-state">
              <FiBell />
              <h3>Ready to predict?</h3>
              <p>Add products to basket and click Predict Purchase to estimate purchase likelihood.</p>
            </article>
          )}

          {hasRequested && isLoading && (
            <article className="sim-empty-state">
              <FiLoader className="spin" />
              <h3>Analyzing basket...</h3>
              <p>Calculating purchase likelihood based on product co-patterns.</p>
            </article>
          )}

          {hasRequested && !isLoading && predictionError && (
            <article className="sim-error-state">
              <h3>
                <FiX /> Error
              </h3>
              <p>{predictionError}</p>
            </article>
          )}

          {hasRequested && !isLoading && !predictionError && predictionResult && (
            <div className="pred-results-grid">
              <article className="pred-likelihood-card">
                <div className="pred-likelihood-inner">
                  <p className="pred-likelihood-label">Purchase Likelihood</p>
                  <p className={`pred-likelihood-value pred-likelihood-${getLikelihoodColor(predictionResult.likelihood_percent)}`}>
                    {predictionResult.likelihood_percent}%
                  </p>
                  <span className={`pred-confidence-badge pred-confidence-${getConfidenceLabel(predictionResult.confidence)}`}>
                    {predictionResult.confidence}
                  </span>
                </div>
              </article>

              <article className="pred-next-products">
                <p className="pred-section-title">Top Next Products</p>
                {predictionResult.next_products.map((product, idx) => (
                  <div key={product.product} className="pred-product-row">
                    <span className="pred-product-rank">#{idx + 1}</span>
                    <div className="pred-product-info">
                      <p className="pred-product-name">{product.product}</p>
                      <div className="pred-probability-bar">
                        <span style={{ width: `${Math.max(5, product.probability * 100)}%` }} />
                      </div>
                    </div>
                    <span className="pred-product-percent">{(product.probability * 100).toFixed(0)}%</span>
                  </div>
                ))}
                <button className="pred-add-top" onClick={addTopProduct}>
                  <FiPlus /> Add top suggestion to basket
                </button>
              </article>

              <article className="pred-explanation">
                <p className="pred-section-title">Why This Prediction?</p>
                <p className="pred-explanation-text">{predictionResult.explanation}</p>
              </article>

              {predictionResult.risk_factors.length > 0 && (
                <article className="pred-risk-factors">
                  <p className="pred-section-title">Risk Factors</p>
                  <ul className="pred-risk-list">
                    {predictionResult.risk_factors.map((factor) => (
                      <li key={factor}>{factor}</li>
                    ))}
                  </ul>
                </article>
              )}

              <div className="pred-actions">
                <button className="pred-action-btn" onClick={copyResult}>
                  <FiCopy /> {copyFeedback || "Copy Result"}
                </button>
                <button className="pred-action-btn">
                  <FiDownload /> Export as CSV
                </button>
              </div>
            </div>
          )}
        </article>
      </section>
    </div>
  );
}

export default Prediction;
