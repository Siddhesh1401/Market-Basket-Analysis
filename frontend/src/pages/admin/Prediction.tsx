import { useState } from "react";
import { products } from "../../data/products";

const metrics = {
  accuracy: 84.2, precision: 81.7, recall: 79.3, f1: 80.5,
};

const confMatrix = [
  [324, 67],
  [89, 412],
];

const featureImportance = [
  { name: "White Bread", importance: 0.18 },
  { name: "Unsalted Butter", importance: 0.15 },
  { name: "Free Range Eggs", importance: 0.13 },
  { name: "Greek Yoghurt", importance: 0.11 },
  { name: "Orange Juice", importance: 0.09 },
  { name: "Cornflakes", importance: 0.08 },
  { name: "Cheddar Cheese", importance: 0.07 },
  { name: "Strawberry Jam", importance: 0.06 },
];

const Prediction = () => {
  const [targetId, setTargetId] = useState(1);
  const [classifier, setClassifier] = useState("decision-tree");
  const [trained, setTrained] = useState(true);
  const [training, setTraining] = useState(false);
  const [checkedItems, setCheckedItems] = useState<number[]>([]);
  const [predicted, setPredicted] = useState<null | { willBuy: boolean; probability: number }>(null);

  const target = products.find(p => p.id === targetId)!;

  const handleTrain = () => {
    setTraining(true);
    setTimeout(() => { setTraining(false); setTrained(true); }, 2500);
  };

  const toggleItem = (id: number) => {
    setCheckedItems(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    setPredicted(null);
  };

  const handlePredict = () => {
    const prob = Math.min(0.95, 0.3 + checkedItems.length * 0.12 + Math.random() * 0.1);
    setPredicted({ willBuy: prob > 0.65, probability: Math.round(prob * 100) });
  };

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Purchase Prediction</h1>
          <p className="admin-page-subtitle">Decision Tree classifier — predict if a customer will buy a target product</p>
        </div>
      </div>

      {/* Train Control */}
      <div className="train-control-card">
        <div className="control-group" style={{ minWidth: 220 }}>
          <label>Target Product</label>
          <select className="sort-select" value={targetId} onChange={e => { setTargetId(Number(e.target.value)); setTrained(false); setPredicted(null); }}>
            {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
        <div className="control-group">
          <label>Algorithm</label>
          <div className="algo-toggle">
            <button className={classifier === "decision-tree" ? "active" : ""} onClick={() => setClassifier("decision-tree")}>Decision Tree</button>
            <button className={classifier === "random-forest" ? "active" : ""} onClick={() => setClassifier("random-forest")}>Random Forest</button>
          </div>
        </div>
        <button className={`btn btn-primary ${training ? "loading" : ""}`} onClick={handleTrain} disabled={training}>
          {training ? "Training..." : "Train Classifier"}
        </button>
        {trained && <div className="model-status trained">● Trained on {target.name}</div>}
      </div>

      {trained && (
        <>
          {/* Metrics */}
          <div className="metrics-cards">
            {Object.entries(metrics).map(([k, v]) => (
              <div key={k} className="metric-card">
                <div className="metric-label">{k.charAt(0).toUpperCase() + k.slice(1)}</div>
                <div className="metric-value">{v}%</div>
                <div className="metric-bar-wrap">
                  <div className="metric-bar-fill" style={{ width: `${v}%` }} />
                </div>
              </div>
            ))}
          </div>

          <div className="charts-row-2">
            {/* Confusion Matrix */}
            <div className="chart-card">
              <h3 className="chart-title">Confusion Matrix — {target.name}</h3>
              <div className="conf-matrix">
                <div className="matrix-labels">
                  <div />
                  <div className="matrix-col-label">Predicted No</div>
                  <div className="matrix-col-label">Predicted Yes</div>
                </div>
                {confMatrix.map((row, ri) => (
                  <div key={ri} className="matrix-row">
                    <div className="matrix-row-label">{ri === 0 ? "Actual No" : "Actual Yes"}</div>
                    {row.map((val, ci) => (
                      <div key={ci} className={`matrix-cell ${ri === ci ? "matrix-correct" : "matrix-wrong"}`}>
                        {val}
                        <span className="matrix-pct">{ri === ci ? "✓" : "✗"}</span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>

            {/* Feature Importance */}
            <div className="chart-card">
              <h3 className="chart-title">Feature Importance (top predictors)</h3>
              <div className="feature-list">
                {featureImportance.map((f, i) => (
                  <div key={i} className="feature-item">
                    <span className="feature-name">{f.name}</span>
                    <div className="feature-bar-wrap">
                      <div className="feature-bar-fill" style={{ width: `${f.importance * 100 / 0.18 * 100}%` }} />
                    </div>
                    <span className="feature-val">{(f.importance * 100).toFixed(0)}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Predictor Demo */}
          <div className="predictor-section">
            <h3 className="chart-title">Try the Predictor — Will this customer buy {target.name}?</h3>
            <p className="chart-subtitle">Check items the customer has already bought:</p>
            <div className="predictor-items">
              {products.filter(p => p.id !== targetId).map(p => (
                <label key={p.id} className={`predictor-item ${checkedItems.includes(p.id) ? "checked" : ""}`}>
                  <input type="checkbox" checked={checkedItems.includes(p.id)} onChange={() => toggleItem(p.id)} />
                  <img src={p.image} alt={p.name} />
                  <span>{p.name}</span>
                </label>
              ))}
            </div>
            <div className="predictor-actions">
              <button className="btn btn-primary" onClick={handlePredict} disabled={checkedItems.length === 0}>
                Predict Purchase
              </button>
              {checkedItems.length === 0 && <span className="predict-hint">Select at least 1 item to predict</span>}
            </div>
            {predicted && (
              <div className={`predict-result ${predicted.willBuy ? "positive" : "negative"}`}>
                <div className="predict-verdict">
                  {predicted.willBuy ? "✓ Likely to buy" : "✗ Unlikely to buy"} {target.name}
                </div>
                <div className="predict-prob-wrap">
                  <div className="predict-prob-bar">
                    <div className="predict-prob-fill" style={{ width: `${predicted.probability}%` }} />
                  </div>
                  <span className="predict-prob-val">{predicted.probability}% probability</span>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default Prediction;
