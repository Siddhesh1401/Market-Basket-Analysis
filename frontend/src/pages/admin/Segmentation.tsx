import { useState } from "react";
import {
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell, Legend, PieChart, Pie
} from "recharts";

const SEGMENT_COLORS = ["#2563eb", "#10b981", "#f59e0b"];
const SEGMENT_LABELS = ["High-Value", "Occasional", "Budget"];

// Mock cluster scatter data (PCA reduced to 2D)
const clusterData = [
  ...Array.from({ length: 40 }, (_, i) => ({ x: 70 + Math.random() * 30, y: 60 + Math.random() * 35, cluster: 0, freq: Math.round(10 + Math.random() * 5), spend: Math.round(700 + Math.random() * 300) })),
  ...Array.from({ length: 60 }, (_, i) => ({ x: 35 + Math.random() * 30, y: 30 + Math.random() * 30, cluster: 1, freq: Math.round(3 + Math.random() * 3), spend: Math.round(150 + Math.random() * 150) })),
  ...Array.from({ length: 50 }, (_, i) => ({ x: 5 + Math.random() * 25, y: 5 + Math.random() * 25, cluster: 2, freq: Math.round(1 + Math.random() * 2), spend: Math.round(30 + Math.random() * 80) })),
];

const segmentSummary = [
  { segment: "High-Value", customers: 1200, avgSpend: 850, avgOrders: 12, color: "#2563eb" },
  { segment: "Occasional", customers: 3400, avgSpend: 220, avgOrders: 4, color: "#10b981" },
  { segment: "Budget", customers: 1800, avgSpend: 65, avgOrders: 1.5, color: "#f59e0b" },
];

const elbowData = [
  { k: 1, inertia: 9800 }, { k: 2, inertia: 5200 }, { k: 3, inertia: 2100 },
  { k: 4, inertia: 1850 }, { k: 5, inertia: 1750 }, { k: 6, inertia: 1680 },
  { k: 7, inertia: 1640 }, { k: 8, inertia: 1610 },
];

const pieData = segmentSummary.map(s => ({ name: s.segment, value: s.customers }));

const CustomDot = (props: any) => {
  const { cx, cy, payload } = props;
  return <circle cx={cx} cy={cy} r={4} fill={SEGMENT_COLORS[payload.cluster]} opacity={0.7} />;
};

const Segmentation = () => {
  const [k, setK] = useState(3);
  const [trained, setTrained] = useState(true);
  const [training, setTraining] = useState(false);

  const handleTrain = () => {
    setTraining(true);
    setTimeout(() => { setTraining(false); setTrained(true); }, 2000);
  };

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Customer Segmentation</h1>
          <p className="admin-page-subtitle">K-Means clustering on RFM features — group customers by behaviour</p>
        </div>
      </div>

      {/* Train Control */}
      <div className="train-control-card">
        <div className="control-group" style={{ maxWidth: 260 }}>
          <label>Number of Clusters (K): <strong>{k}</strong></label>
          <input type="range" min="2" max="8" step="1" value={k} onChange={e => setK(Number(e.target.value))} />
        </div>
        <button className={`btn btn-primary ${training ? "loading" : ""}`} onClick={handleTrain} disabled={training}>
          {training ? "Training..." : "Train K-Means Model"}
        </button>
        <div className={`model-status ${trained ? "trained" : "untrained"}`}>
          ● {trained ? `Trained (K=${k})` : "Not trained"}
        </div>
      </div>

      {trained && (
        <>
          {/* Segment Summary Cards */}
          <div className="segment-cards">
            {segmentSummary.map(s => (
              <div key={s.segment} className="segment-card" style={{ borderTop: `4px solid ${s.color}` }}>
                <div className="seg-top">
                  <h3 style={{ color: s.color }}>{s.segment}</h3>
                  <span className="seg-count">{s.customers.toLocaleString()} customers</span>
                </div>
                <div className="seg-stats">
                  <div><span className="seg-label">Avg Spend</span><span className="seg-val">£{s.avgSpend}</span></div>
                  <div><span className="seg-label">Avg Orders</span><span className="seg-val">{s.avgOrders}/mo</span></div>
                </div>
              </div>
            ))}
          </div>

          {/* Charts */}
          <div className="charts-row-2">
            {/* Cluster Scatter Plot */}
            <div className="chart-card">
              <h3 className="chart-title">Customer Clusters (PCA 2D)</h3>
              <p className="chart-subtitle">Each dot = 1 customer, coloured by segment</p>
              <ResponsiveContainer width="100%" height={280}>
                <ScatterChart margin={{ top: 10, right: 20, bottom: 20, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="x" name="PC1" type="number" tick={{ fontSize: 10 }}
                    label={{ value: "Principal Component 1", position: "insideBottom", offset: -10, fontSize: 11 }} />
                  <YAxis dataKey="y" name="PC2" type="number" tick={{ fontSize: 10 }}
                    label={{ value: "PC2", angle: -90, position: "insideLeft", fontSize: 11 }} />
                  <Tooltip content={({ payload }) => {
                    if (!payload?.length) return null;
                    const d = payload[0].payload;
                    return (
                      <div className="custom-tooltip">
                        <strong>{SEGMENT_LABELS[d.cluster]}</strong>
                        <div>Frequency: {d.freq} orders</div>
                        <div>Spend: £{d.spend}</div>
                      </div>
                    );
                  }} />
                  <Scatter data={clusterData} shape={<CustomDot />} />
                </ScatterChart>
              </ResponsiveContainer>
              <div className="cluster-legend">
                {SEGMENT_LABELS.map((label, i) => (
                  <span key={label} className="legend-dot" style={{ color: SEGMENT_COLORS[i] }}>● {label}</span>
                ))}
              </div>
            </div>

            {/* Stats Charts */}
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div className="chart-card">
                <h3 className="chart-title">Avg Spend per Segment</h3>
                <ResponsiveContainer width="100%" height={130}>
                  <BarChart data={segmentSummary} layout="vertical" margin={{ left: 20, right: 30 }}>
                    <XAxis type="number" tick={{ fontSize: 10 }} />
                    <YAxis dataKey="segment" type="category" tick={{ fontSize: 11 }} width={80} />
                    <Tooltip formatter={(v: number) => [`£${v}`, "Avg Spend"]} />
                    <Bar dataKey="avgSpend" radius={[0, 6, 6, 0]}>
                      {segmentSummary.map((s, i) => <Cell key={i} fill={s.color} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="chart-card">
                <h3 className="chart-title">Customer Distribution</h3>
                <ResponsiveContainer width="100%" height={130}>
                  <PieChart>
                    <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={50} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                      {pieData.map((_, i) => <Cell key={i} fill={SEGMENT_COLORS[i]} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Elbow Curve */}
          <div className="chart-card" style={{ marginTop: 16 }}>
            <h3 className="chart-title">Elbow Curve — Optimal K Selection</h3>
            <p className="chart-subtitle">The curve bends at K=3, confirming 3 clusters is optimal</p>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={elbowData} margin={{ top: 10, right: 20, bottom: 20, left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="k" label={{ value: "K (clusters)", position: "insideBottom", offset: -10, fontSize: 11 }} />
                <YAxis label={{ value: "Inertia", angle: -90, position: "insideLeft", fontSize: 11 }} />
                <Tooltip formatter={(v: number) => [v.toLocaleString(), "Inertia"]} />
                <Bar dataKey="inertia" radius={[4, 4, 0, 0]}>
                  {elbowData.map((entry, i) => (
                    <Cell key={i} fill={entry.k === 3 ? "#2563eb" : "#93c5fd"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </div>
  );
};

export default Segmentation;
