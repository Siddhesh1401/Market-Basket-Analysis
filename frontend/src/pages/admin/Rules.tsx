import { useState, useMemo } from "react";
import {
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell
} from "recharts";
import { FiDownload, FiSearch } from "react-icons/fi";

// Mock association rules data (would come from Flask API in full version)
const allRules = [
  { id: 1, antecedents: "Whole Milk", consequents: "White Bread", support: 0.056, confidence: 0.782, lift: 3.21 },
  { id: 2, antecedents: "Eggs", consequents: "Bacon Rashers", support: 0.034, confidence: 0.651, lift: 4.12 },
  { id: 3, antecedents: "Cheddar Cheese", consequents: "Olive Oil", support: 0.028, confidence: 0.583, lift: 2.98 },
  { id: 4, antecedents: "White Bread, Unsalted Butter", consequents: "Whole Milk", support: 0.052, confidence: 0.741, lift: 3.05 },
  { id: 5, antecedents: "Pasta (Penne)", consequents: "Tomato Sauce", support: 0.041, confidence: 0.812, lift: 5.43 },
  { id: 6, antecedents: "Instant Coffee", consequents: "Chocolate Biscuits", support: 0.037, confidence: 0.694, lift: 3.78 },
  { id: 7, antecedents: "Chicken Breast", consequents: "Brown Rice", support: 0.029, confidence: 0.623, lift: 4.01 },
  { id: 8, antecedents: "Greek Yoghurt", consequents: "Whole Milk", support: 0.048, confidence: 0.715, lift: 2.94 },
  { id: 9, antecedents: "Strawberry Jam", consequents: "Unsalted Butter", support: 0.033, confidence: 0.661, lift: 3.45 },
  { id: 10, antecedents: "Orange Juice", consequents: "Cornflakes", support: 0.025, confidence: 0.542, lift: 2.67 },
  { id: 11, antecedents: "Bacon Rashers, Eggs", consequents: "White Bread", support: 0.031, confidence: 0.834, lift: 4.89 },
  { id: 12, antecedents: "Tomato Sauce", consequents: "Pasta (Penne)", support: 0.041, confidence: 0.799, lift: 5.21 },
  { id: 13, antecedents: "Brown Rice", consequents: "Chicken Breast", support: 0.029, confidence: 0.611, lift: 3.89 },
  { id: 14, antecedents: "Chocolate Biscuits", consequents: "Instant Coffee", support: 0.037, confidence: 0.712, lift: 3.91 },
  { id: 15, antecedents: "Unsalted Butter", consequents: "Strawberry Jam", support: 0.033, confidence: 0.598, lift: 3.12 },
  { id: 16, antecedents: "Whole Milk, Eggs", consequents: "White Bread", support: 0.044, confidence: 0.768, lift: 3.34 },
  { id: 17, antecedents: "Soda", consequents: "Snacks", support: 0.039, confidence: 0.623, lift: 2.45 },
  { id: 18, antecedents: "Olive Oil, Pasta", consequents: "Tomato Sauce", support: 0.022, confidence: 0.891, lift: 6.12 },
  { id: 19, antecedents: "Cornflakes", consequents: "Whole Milk", support: 0.051, confidence: 0.743, lift: 3.06 },
  { id: 20, antecedents: "White Bread, Whole Milk", consequents: "Unsalted Butter", support: 0.038, confidence: 0.671, lift: 2.88 },
];

// Heatmap data
const heatmapItems = ["Milk", "Bread", "Eggs", "Butter", "Cheese", "Pasta", "Sauce", "Coffee"];
const heatmapData = heatmapItems.map(row =>
  heatmapItems.map(col => row === col ? 1 : Math.random() < 0.3 ? 0 : Math.round(Math.random() * 80 + 10) / 100)
);

const COLORS = ["#2563eb", "#7c3aed", "#10b981", "#f59e0b", "#ef4444"];

const Rules = () => {
  const [minSupport, setMinSupport] = useState(0.02);
  const [minConfidence, setMinConfidence] = useState(0.3);
  const [minLift, setMinLift] = useState(1.5);
  const [algorithm, setAlgorithm] = useState("apriori");
  const [sortKey, setSortKey] = useState<"support" | "confidence" | "lift">("lift");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    let list = allRules.filter(r =>
      r.support >= minSupport &&
      r.confidence >= minConfidence &&
      r.lift >= minLift &&
      (r.antecedents.toLowerCase().includes(search.toLowerCase()) ||
       r.consequents.toLowerCase().includes(search.toLowerCase()))
    );
    list.sort((a, b) => sortDir === "desc" ? b[sortKey] - a[sortKey] : a[sortKey] - b[sortKey]);
    return list;
  }, [minSupport, minConfidence, minLift, search, sortKey, sortDir]);

  const toggleSort = (key: typeof sortKey) => {
    if (sortKey === key) setSortDir(d => d === "desc" ? "asc" : "desc");
    else { setSortKey(key); setSortDir("desc"); }
  };

  const downloadCSV = () => {
    const header = "Antecedents,Consequents,Support,Confidence,Lift\n";
    const rows = filtered.map(r => `"${r.antecedents}","${r.consequents}",${r.support},${r.confidence},${r.lift}`).join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "association_rules.csv"; a.click();
  };

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Association Rules</h1>
          <p className="admin-page-subtitle">Discover product purchase patterns using Apriori &amp; FP-Growth</p>
        </div>
      </div>

      {/* Controls */}
      <div className="rules-controls">
        <div className="control-group">
          <label>Min Support: <strong>{minSupport.toFixed(2)}</strong></label>
          <input type="range" min="0.01" max="0.1" step="0.005"
            value={minSupport} onChange={e => setMinSupport(Number(e.target.value))} />
        </div>
        <div className="control-group">
          <label>Min Confidence: <strong>{minConfidence.toFixed(2)}</strong></label>
          <input type="range" min="0.1" max="1" step="0.05"
            value={minConfidence} onChange={e => setMinConfidence(Number(e.target.value))} />
        </div>
        <div className="control-group">
          <label>Min Lift: <strong>{minLift.toFixed(1)}</strong></label>
          <input type="range" min="1" max="7" step="0.5"
            value={minLift} onChange={e => setMinLift(Number(e.target.value))} />
        </div>
        <div className="control-group algo-group">
          <label>Algorithm</label>
          <div className="algo-toggle">
            <button className={algorithm === "apriori" ? "active" : ""} onClick={() => setAlgorithm("apriori")}>Apriori</button>
            <button className={algorithm === "fpgrowth" ? "active" : ""} onClick={() => setAlgorithm("fpgrowth")}>FP-Growth</button>
          </div>
        </div>
        <div className="rules-found-badge">{filtered.length} rules found</div>
      </div>

      {/* Charts Row */}
      <div className="charts-row-3">
        {/* Scatter Plot */}
        <div className="chart-card">
          <h3 className="chart-title">Support vs Confidence (size = lift)</h3>
          <ResponsiveContainer width="100%" height={220}>
            <ScatterChart margin={{ top: 10, right: 20, bottom: 20, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="support" name="Support" type="number" domain={[0, 0.07]}
                tick={{ fontSize: 11 }} label={{ value: "Support", position: "insideBottom", offset: -10, fontSize: 11 }} />
              <YAxis dataKey="confidence" name="Confidence" type="number" domain={[0, 1]}
                tick={{ fontSize: 11 }} label={{ value: "Confidence", angle: -90, position: "insideLeft", fontSize: 11 }} />
              <Tooltip cursor={{ strokeDasharray: "3 3" }}
                formatter={(val: number, name: string) => [val.toFixed(3), name]} />
              <Scatter data={filtered} fill="#2563eb">
                {filtered.map((entry, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]}
                    opacity={0.75} />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </div>

        {/* Heatmap */}
        <div className="chart-card">
          <h3 className="chart-title">Product Co-occurrence Heatmap</h3>
          <div className="heatmap-wrap">
            <div className="heatmap-col-labels">
              {heatmapItems.map(item => <div key={item} className="heatmap-label">{item}</div>)}
            </div>
            {heatmapData.map((row, ri) => (
              <div key={ri} className="heatmap-row">
                <div className="heatmap-row-label">{heatmapItems[ri]}</div>
                {row.map((val, ci) => (
                  <div key={ci} className="heatmap-cell"
                    style={{ background: `rgba(37, 99, 235, ${val})` }}
                    title={`${heatmapItems[ri]} × ${heatmapItems[ci]}: ${(val * 100).toFixed(0)}%`}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Top Rules by Lift */}
        <div className="chart-card">
          <h3 className="chart-title">Top Rules by Lift</h3>
          <div className="top-rules-list">
            {[...filtered].sort((a, b) => b.lift - a.lift).slice(0, 6).map((r, i) => (
              <div key={r.id} className="top-rule-item">
                <span className="rule-rank">#{i + 1}</span>
                <div className="rule-text">
                  <span className="rule-ant">{r.antecedents}</span>
                  <span className="rule-arrow">→</span>
                  <span className="rule-con">{r.consequents}</span>
                </div>
                <div className="rule-lift-bar">
                  <div className="rule-lift-fill" style={{ width: `${Math.min(r.lift / 7 * 100, 100)}%` }} />
                  <span className="rule-lift-val">{r.lift.toFixed(2)}×</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Rules Table */}
      <div className="rules-table-section">
        <div className="table-toolbar">
          <div className="table-search-wrap">
            <FiSearch />
            <input type="text" placeholder="Search rules by product name..."
              value={search} onChange={e => setSearch(e.target.value)} className="table-search" />
          </div>
          <button className="btn btn-outline download-btn" onClick={downloadCSV}>
            <FiDownload /> Download CSV
          </button>
        </div>

        <div className="rules-table-wrap">
          <table className="rules-table">
            <thead>
              <tr>
                <th>#</th>
                <th>If Customer Buys (Antecedents)</th>
                <th>They Also Buy (Consequents)</th>
                <th className="sortable" onClick={() => toggleSort("support")}>
                  Support {sortKey === "support" ? (sortDir === "desc" ? "↓" : "↑") : "↕"}
                </th>
                <th className="sortable" onClick={() => toggleSort("confidence")}>
                  Confidence {sortKey === "confidence" ? (sortDir === "desc" ? "↓" : "↑") : "↕"}
                </th>
                <th className="sortable" onClick={() => toggleSort("lift")}>
                  Lift {sortKey === "lift" ? (sortDir === "desc" ? "↓" : "↑") : "↕"}
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={6} className="no-rules">No rules match the current thresholds. Try lowering the sliders.</td></tr>
              ) : filtered.map((r, i) => (
                <tr key={r.id}>
                  <td className="row-num">{i + 1}</td>
                  <td><span className="ant-tag">{r.antecedents}</span></td>
                  <td><span className="con-tag">{r.consequents}</span></td>
                  <td>
                    <div className="metric-cell">
                      <div className="metric-bar"><div style={{ width: `${r.support * 1000}%`, background: "#2563eb" }} /></div>
                      <span>{r.support.toFixed(3)}</span>
                    </div>
                  </td>
                  <td>
                    <div className="metric-cell">
                      <div className="metric-bar"><div style={{ width: `${r.confidence * 100}%`, background: "#7c3aed" }} /></div>
                      <span>{(r.confidence * 100).toFixed(1)}%</span>
                    </div>
                  </td>
                  <td>
                    <span className={`lift-badge ${r.lift >= 3 ? "high" : r.lift >= 2 ? "med" : "low"}`}>
                      {r.lift.toFixed(2)}×
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Rules;

