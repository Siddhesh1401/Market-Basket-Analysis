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

type ReportRule = {
  antecedent: string;
  consequent: string;
  support: number;
  confidence: number;
  lift: number;
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
        <section className="hero-mini workflow-hero">
          <div>
            <p className="hero-eyebrow">Reports</p>
            <h1>Executive Reporting Workspace</h1>
            <p>Generate presentation-ready summaries from validated transaction analysis.</p>
          </div>
        </section>

        <section className="surface-card empty-card">
          <h3>Upload to see reports</h3>
          <p>Visit Dashboard, upload your CSV, and run analysis to unlock all report visualizations.</p>
          <NavLink to="/workspace" className="primary-cta">
            Open Workspace
          </NavLink>
        </section>
      </div>
    );
  }

  const fallbackRulesFromItemsets: ReportRule[] = analysis.topItemsets
    .map((itemset) => {
      const pair = itemset.items.split(" + ").map((part) => part.trim());
      if (pair.length !== 2) {
        return null;
      }

      return {
        antecedent: pair[0],
        consequent: pair[1],
        support: itemset.support,
        confidence: itemset.support,
        lift: 1,
      };
    })
    .filter((rule): rule is ReportRule => rule !== null);

  const reportRules: ReportRule[] = analysis.rules.length > 0 ? analysis.rules : fallbackRulesFromItemsets;

  const reportMode = analysis.rules.length > 0 ? "rules" : fallbackRulesFromItemsets.length > 0 ? "itemsets" : "popularity";

  const scatterRules = reportRules.slice(0, 140).map((rule) => ({
    support: rule.support,
    confidence: rule.confidence,
    lift: rule.lift,
  }));

  const topRules = [...reportRules]
    .sort((a, b) => {
      if (b.lift !== a.lift) {
        return b.lift - a.lift;
      }
      if (b.confidence !== a.confidence) {
        return b.confidence - a.confidence;
      }
      return b.support - a.support;
    })
    .slice(0, 12);

  return (
    <div className="page-shell">
      <section className="hero-mini workflow-hero">
        <div className="reports-hero-row">
          <div>
            <p className="hero-eyebrow">Reports</p>
            <h1>Executive Analytics View</h1>
            <p>Comprehensive visual reporting for product association and basket behavior.</p>
          </div>
          <NavLink to="/workspace" className="ghost-btn">
            Back to Workspace
          </NavLink>
        </div>
      </section>

      <section className="surface-card reports-toolbar">
        <div>
          <h2>Inspection to Presentation Flow</h2>
          <p>
            Use this page to summarize demand signals, country distribution, and top rule performance
            for business reviews.
          </p>
        </div>
        <NavLink to="/workspace" className="secondary-btn">
          Refine Analysis Inputs
        </NavLink>
      </section>

      <section className="kpi-grid">
        <article className="kpi-card"><p>Total Rows</p><h3>{analysis.totalRows.toLocaleString()}</h3></article>
        <article className="kpi-card"><p>Transactions</p><h3>{analysis.totalTransactions.toLocaleString()}</h3></article>
        <article className="kpi-card"><p>Unique Products</p><h3>{analysis.uniqueItems.toLocaleString()}</h3></article>
        <article className="kpi-card"><p>Total Rules</p><h3>{analysis.rules.length.toLocaleString()}</h3></article>
      </section>

      {reportMode !== "rules" && (
        <section className="surface-card report-callout">
          <h3>Limited Association Coverage</h3>
          <p>
            {reportMode === "itemsets"
              ? "Strong rule metrics were not generated. This report uses itemset co-occurrence as a fallback signal."
              : "No co-occurring baskets were detected for this dataset. Visuals show product demand, and rule panels remain empty until multi-item transactions are available."}
          </p>
        </section>
      )}

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
          {scatterRules.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <ScatterChart>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="support" type="number" domain={[0, "auto"]} />
                <YAxis dataKey="confidence" type="number" domain={[0, 1]} />
                <Tooltip />
                <Scatter data={scatterRules} fill="#7c3aed" />
              </ScatterChart>
            </ResponsiveContainer>
          ) : (
            <div className="chart-empty-state">
              <h3>No association points to display</h3>
              <p>
                Upload a dataset with repeated multi-item baskets to populate this scatter chart.
              </p>
            </div>
          )}
        </article>

        <article className="surface-card reports-span-two">
          <h2>{reportMode === "rules" ? "Top Rules Table" : "Top Co-occurrence Table"}</h2>
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
              {topRules.length === 0 ? (
                <tr>
                  <td colSpan={5} className="table-empty-cell">
                    No association rules were generated for this dataset.
                  </td>
                </tr>
              ) : (
                topRules.map((rule, index) => (
                  <tr key={`${rule.antecedent}-${rule.consequent}-${index}`}>
                    <td>{rule.antecedent}</td>
                    <td>{rule.consequent}</td>
                    <td>{rule.support.toFixed(3)}</td>
                    <td>{rule.confidence.toFixed(3)}</td>
                    <td>{rule.lift.toFixed(3)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </article>
      </section>
    </div>
  );
}

export default Reports;
