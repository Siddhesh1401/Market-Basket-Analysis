import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { NavLink } from "react-router-dom";
import type { AnalysisResult } from "../types";
import { CHART_COLORS } from "../utils/analyze";

type ReportsProps = {
  analysis: AnalysisResult | null;
};

const shortProductLabel = (value: string, maxLength = 18) => {
  if (value.length <= maxLength) {
    return value;
  }
  return `${value.slice(0, maxLength - 1)}...`;
};

function Reports({ analysis }: ReportsProps) {
  if (!analysis) {
    return (
      <div className="page-shell">
        <section className="hero-mini">
          <div>
            <p className="hero-eyebrow">Reports</p>
            <h1>Company Reports</h1>
            <p>Generate charts and summaries from your uploaded transaction data.</p>
          </div>
        </section>

        <section className="surface-card empty-card">
          <h3>Upload to see reports</h3>
          <p>Visit Dashboard, upload your CSV, and run analysis to unlock all report visualizations.</p>
          <NavLink to="/dashboard" className="primary-cta">
            Go to Dashboard
          </NavLink>
        </section>
      </div>
    );
  }

  const scatterRules = analysis.rules.slice(0, 140).map((rule) => ({
    support: rule.support,
    confidence: rule.confidence,
    lift: rule.lift,
  }));

  const topRules = [...analysis.rules].sort((a, b) => b.lift - a.lift).slice(0, 12);

  return (
    <div className="page-shell">
      <section className="hero-mini">
        <div>
          <p className="hero-eyebrow">Reports</p>
          <h1>Executive Analytics View</h1>
          <p>Comprehensive visual reporting for product association and basket behavior.</p>
        </div>
      </section>

      <section className="kpi-grid">
        <article className="kpi-card"><p>Total Rows</p><h3>{analysis.totalRows.toLocaleString()}</h3></article>
        <article className="kpi-card"><p>Transactions</p><h3>{analysis.totalTransactions.toLocaleString()}</h3></article>
        <article className="kpi-card"><p>Unique Products</p><h3>{analysis.uniqueItems.toLocaleString()}</h3></article>
        <article className="kpi-card"><p>Total Rules</p><h3>{analysis.rules.length.toLocaleString()}</h3></article>
      </section>

      <section className="reports-grid">
        <article className="surface-card">
          <h2>Top Products by Frequency</h2>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={analysis.itemFrequency.slice(0, 10)} layout="vertical" margin={{ left: 12 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis
                type="category"
                dataKey="item"
                width={120}
                tick={{ fontSize: 11 }}
                tickFormatter={(value: string) => shortProductLabel(value)}
              />
              <Tooltip
                labelFormatter={(label) => String(label)}
                formatter={(value) => [value, "count"]}
              />
              <Bar dataKey="count" fill="#2563eb" radius={[0, 8, 8, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </article>

        <article className="surface-card">
          <h2>Country Distribution</h2>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={analysis.countryDistribution} dataKey="value" nameKey="name" outerRadius={90}>
                {analysis.countryDistribution.map((entry, index) => (
                  <Cell key={`${entry.name}-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </article>

        <article className="surface-card reports-span-two">
          <h2>Support vs Confidence</h2>
          <ResponsiveContainer width="100%" height={300}>
            <ScatterChart>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="support" type="number" domain={[0, "auto"]} />
              <YAxis dataKey="confidence" type="number" domain={[0, 1]} />
              <Tooltip />
              <Scatter data={scatterRules} fill="#7c3aed" />
            </ScatterChart>
          </ResponsiveContainer>
        </article>

        <article className="surface-card reports-span-two">
          <h2>Top Rules Table</h2>
          <table className="data-table">
            <thead>
              <tr>
                <th>Antecedent</th>
                <th>Consequent</th>
                <th>Support</th>
                <th>Confidence</th>
                <th>Lift</th>
              </tr>
            </thead>
            <tbody>
              {topRules.map((rule, index) => (
                <tr key={`${rule.antecedent}-${rule.consequent}-${index}`}>
                  <td>{rule.antecedent}</td>
                  <td>{rule.consequent}</td>
                  <td>{rule.support.toFixed(3)}</td>
                  <td>{rule.confidence.toFixed(3)}</td>
                  <td>{rule.lift.toFixed(3)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </article>
      </section>
    </div>
  );
}

export default Reports;
