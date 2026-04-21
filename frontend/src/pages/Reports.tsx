import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  FiAlertTriangle,
  FiArrowDown,
  FiArrowUp,
  FiCheckCircle,
  FiChevronLeft,
  FiChevronRight,
  FiDownload,
  FiSearch,
} from "react-icons/fi";
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

type RuleSearchScope = "all" | "antecedent" | "consequent";
type RuleSortMetric = "support" | "confidence" | "lift";
type RuleSortDirection = "asc" | "desc";
type RecommendationSource = "rules" | "itemsets" | "popularity" | "none";

const shortProductLabel = (value: string, maxLength = 18) => {
  if (value.length <= maxLength) {
    return value;
  }
  return `${value.slice(0, maxLength - 1)}...`;
};

const parseRuleItems = (value: string) =>
  value
    .split(",")
    .map((part) => part.trim())
    .filter((part) => part.length > 0);

function Reports({ analysis }: ReportsProps) {
  const [ruleSearchText, setRuleSearchText] = useState("");
  const [ruleSearchScope, setRuleSearchScope] = useState<RuleSearchScope>("all");
  const [ruleSortMetric, setRuleSortMetric] = useState<RuleSortMetric>("lift");
  const [ruleSortDirection, setRuleSortDirection] = useState<RuleSortDirection>("desc");
  const [rulePageSize, setRulePageSize] = useState(20);
  const [rulePage, setRulePage] = useState(1);
  const [selectedRuleKey, setSelectedRuleKey] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState("");

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
          <p>Visit Workspace, upload your dataset, and run analysis to unlock all report visualizations.</p>
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

  const diagnostics = useMemo(() => {
    if (!analysis.preprocessing) {
      return null;
    }
    const prep = analysis.preprocessing;
    const droppedRate = prep.rawRows > 0 ? prep.droppedRows / prep.rawRows : 0;
    const recommendations: string[] = [];

    if (droppedRate > 0.35) {
      recommendations.push("High row drop rate detected. Check invoice and product columns for missing values.");
    }
    if (prep.removedCancelledInvoices > 0) {
      recommendations.push("Cancelled invoices were removed for cleaner purchase behavior.");
    }
    if (prep.removedNoiseItems > 0) {
      recommendations.push("Service/noise items were removed. Review product naming if this count is unexpectedly high.");
    }
    if (analysis.rules.length === 0) {
      recommendations.push("No rules generated. Try a broader support/confidence profile in Workspace.");
    }

    return { droppedRate, recommendations };
  }, [analysis]);

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

  const getRuleKey = (rule: ReportRule) =>
    `${rule.antecedent}|${rule.consequent}|${rule.support.toFixed(6)}|${rule.confidence.toFixed(6)}|${rule.lift.toFixed(6)}`;

  const searchedRules = useMemo(() => {
    const needle = ruleSearchText.trim().toLowerCase();
    if (needle.length === 0) {
      return reportRules;
    }

    return reportRules.filter((rule) => {
      const antecedent = rule.antecedent.toLowerCase();
      const consequent = rule.consequent.toLowerCase();

      if (ruleSearchScope === "antecedent") {
        return antecedent.includes(needle);
      }
      if (ruleSearchScope === "consequent") {
        return consequent.includes(needle);
      }
      return antecedent.includes(needle) || consequent.includes(needle);
    });
  }, [reportRules, ruleSearchScope, ruleSearchText]);

  const sortedRules = useMemo(() => {
    const next = [...searchedRules];
    next.sort((a, b) => {
      const delta = a[ruleSortMetric] - b[ruleSortMetric];
      return ruleSortDirection === "asc" ? delta : -delta;
    });
    return next;
  }, [ruleSortDirection, ruleSortMetric, searchedRules]);

  const totalRulePages = Math.max(1, Math.ceil(sortedRules.length / rulePageSize));

  useEffect(() => {
    setRulePage(1);
  }, [ruleSearchScope, ruleSearchText, ruleSortDirection, ruleSortMetric, rulePageSize, reportRules.length]);

  useEffect(() => {
    setRulePage((prev) => Math.min(prev, totalRulePages));
  }, [totalRulePages]);

  const pagedRules = useMemo(() => {
    const start = (rulePage - 1) * rulePageSize;
    return sortedRules.slice(start, start + rulePageSize);
  }, [rulePage, rulePageSize, sortedRules]);

  const selectedRule = useMemo(
    () => sortedRules.find((rule) => getRuleKey(rule) === selectedRuleKey) ?? null,
    [selectedRuleKey, sortedRules],
  );

  const relatedRules = useMemo(() => {
    if (!selectedRule) {
      return [] as ReportRule[];
    }

    return sortedRules
      .filter(
        (rule) =>
          getRuleKey(rule) !== getRuleKey(selectedRule) &&
          (rule.antecedent === selectedRule.antecedent || rule.consequent === selectedRule.consequent),
      )
      .slice(0, 6);
  }, [selectedRule, sortedRules]);

  const recommendationResult = useMemo(() => {
    if (!selectedItem) {
      return {
        source: "none" as RecommendationSource,
        rows: [] as Array<{ consequent: string; confidence: number; lift: number; support: number }>,
      };
    }

    const getCandidates = (rules: ReportRule[]) => {
      const collected: Array<{ consequent: string; confidence: number; lift: number; support: number }> = [];

      rules.forEach((rule) => {
        const antecedents = parseRuleItems(rule.antecedent);
        const consequents = parseRuleItems(rule.consequent);

        if (antecedents.includes(selectedItem)) {
          consequents.forEach((item) => {
            if (item !== selectedItem) {
              collected.push({ consequent: item, confidence: rule.confidence, lift: rule.lift, support: rule.support });
            }
          });
        }

        if (consequents.includes(selectedItem)) {
          antecedents.forEach((item) => {
            if (item !== selectedItem) {
              collected.push({ consequent: item, confidence: rule.confidence, lift: rule.lift, support: rule.support });
            }
          });
        }
      });

      return collected;
    };

    const ruleCandidates = getCandidates(reportRules);

    const fallbackItemsetCandidates =
      ruleCandidates.length > 0
        ? []
        : analysis.topItemsets
            .map((itemset) => {
              const pair = itemset.items.split(" + ").map((part) => part.trim());
              if (pair.length !== 2 || !pair.includes(selectedItem)) {
                return null;
              }
              const consequent = pair[0] === selectedItem ? pair[1] : pair[0];
              return {
                consequent,
                confidence: itemset.support,
                lift: 1,
                support: itemset.support,
              };
            })
            .filter((value): value is { consequent: string; confidence: number; lift: number; support: number } => value !== null);

    const fallbackPopularityCandidates =
      ruleCandidates.length > 0 || fallbackItemsetCandidates.length > 0
        ? []
        : analysis.itemFrequency
            .filter((item) => item.item !== selectedItem)
            .map((item) => ({
              consequent: item.item,
              confidence: item.count / Math.max(analysis.totalTransactions, 1),
              lift: 1,
              support: item.count / Math.max(analysis.totalRows, 1),
            }));

    const fallbackMatches =
      ruleCandidates.length > 0
        ? ruleCandidates
        : fallbackItemsetCandidates.length > 0
          ? fallbackItemsetCandidates
          : fallbackPopularityCandidates;

    let source: RecommendationSource = "none";
    if (ruleCandidates.length > 0) {
      source = "rules";
    } else if (fallbackItemsetCandidates.length > 0) {
      source = "itemsets";
    } else if (fallbackPopularityCandidates.length > 0) {
      source = "popularity";
    }

    const seen = new Set<string>();
    const rows = fallbackMatches
      .sort((a, b) => {
        if (b.confidence !== a.confidence) {
          return b.confidence - a.confidence;
        }
        return b.lift - a.lift;
      })
      .filter((candidate) => {
        if (seen.has(candidate.consequent)) {
          return false;
        }
        seen.add(candidate.consequent);
        return true;
      })
      .slice(0, 5);

    return { source, rows };
  }, [analysis.itemFrequency, analysis.topItemsets, analysis.totalRows, analysis.totalTransactions, reportRules, selectedItem]);

  const escapeCsvValue = (value: string) => `"${value.replace(/"/g, '""')}"`;

  const triggerCsvDownload = (targetFileName: string, header: string, rows: string[]) => {
    if (rows.length === 0) {
      return;
    }
    const csvContent = `${header}\n${rows.join("\n")}`;
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = targetFileName;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadRulesCsv = () => {
    if (reportRules.length > 0) {
      const header = "Antecedent,Consequent,Support,Confidence,Lift";
      const rows = reportRules.map(
        (rule) =>
          `${escapeCsvValue(rule.antecedent)},${escapeCsvValue(rule.consequent)},${rule.support.toFixed(4)},${rule.confidence.toFixed(4)},${rule.lift.toFixed(4)}`,
      );
      triggerCsvDownload("basket-sense-rules.csv", header, rows);
      return;
    }

    if (analysis.topItemsets.length > 0) {
      const header = "Itemset,Count,Support";
      const rows = analysis.topItemsets.map(
        (itemset) => `${escapeCsvValue(itemset.items)},${itemset.count},${itemset.support.toFixed(4)}`,
      );
      triggerCsvDownload("basket-sense-itemsets.csv", header, rows);
      return;
    }

    const header = "Item,Count,ShareOfRows";
    const rows = analysis.itemFrequency.map(
      (item) => `${escapeCsvValue(item.item)},${item.count},${(item.count / Math.max(analysis.totalRows, 1)).toFixed(4)}`,
    );
    triggerCsvDownload("basket-sense-item-frequency.csv", header, rows);
  };

  const getConfidenceBand = (confidence: number) => {
    if (confidence >= 0.6) {
      return "High";
    }
    if (confidence >= 0.3) {
      return "Medium";
    }
    return "Low";
  };

  return (
    <div className="page-shell">
      <section className="hero-mini workflow-hero">
        <div className="reports-hero-row">
          <div>
            <p className="hero-eyebrow">Reports</p>
            <h1>Executive Analytics and Inspection</h1>
            <p>Deep diagnostics, detailed rule exploration, recommendation actions, and exports.</p>
          </div>
          <NavLink to="/workspace" className="ghost-btn">
            Back to Workspace
          </NavLink>
        </div>
      </section>

      <section className="surface-card reports-toolbar">
        <div>
          <h2>Inspection to Presentation Flow</h2>
          <p>Use this page for detailed diagnostics, rule-level exploration, and stakeholder-ready exports.</p>
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

      <section className="workspace-stage">
        <article className={`surface-card suitability-banner ${analysis.suitability?.isSuitable === false ? "warning" : "ok"}`}>
          <div>
            <h3>
              {analysis.suitability?.isSuitable === false ? <FiAlertTriangle /> : <FiCheckCircle />} Suitability Status
            </h3>
            <p>{analysis.suitability?.message ?? "Dataset processed successfully."}</p>
          </div>
        </article>

        {analysis.preprocessing && diagnostics && (
          <article className="surface-card diagnostics-card">
            <h3>Data Cleaning Impact</h3>
            <div className="diagnostics-grid">
              <div className="diagnostic-metric">
                <span>Raw Rows</span>
                <strong>{analysis.preprocessing.rawRows.toLocaleString()}</strong>
              </div>
              <div className="diagnostic-metric">
                <span>Cleaned Rows</span>
                <strong>{analysis.preprocessing.cleanedRows.toLocaleString()}</strong>
              </div>
              <div className="diagnostic-metric">
                <span>Dropped Rows</span>
                <strong>
                  {analysis.preprocessing.droppedRows.toLocaleString()} ({(diagnostics.droppedRate * 100).toFixed(1)}%)
                </strong>
              </div>
              <div className="diagnostic-metric">
                <span>Removed Cancelled</span>
                <strong>{analysis.preprocessing.removedCancelledInvoices.toLocaleString()}</strong>
              </div>
              <div className="diagnostic-metric">
                <span>Removed Noise Items</span>
                <strong>{analysis.preprocessing.removedNoiseItems.toLocaleString()}</strong>
              </div>
              <div className="diagnostic-metric">
                <span>Invalid Qty/Price Removed</span>
                <strong>
                  {(analysis.preprocessing.removedNonPositiveQuantity + analysis.preprocessing.removedNonPositivePrice).toLocaleString()}
                </strong>
              </div>
            </div>

            {diagnostics.recommendations.length > 0 && (
              <div className="diagnostic-reco">
                <h4>Actionable Notes</h4>
                <ul>
                  {diagnostics.recommendations.map((note, index) => (
                    <li key={`${note}-${index}`}>{note}</li>
                  ))}
                </ul>
              </div>
            )}
          </article>
        )}
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
              <Tooltip labelFormatter={(label) => String(label)} formatter={(value) => [value, "count"]} />
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
          <h2>Monthly Trend</h2>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={analysis.monthlyTransactions}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="transactions" stroke="#4f46e5" strokeWidth={2.4} dot={{ r: 3 }} />
            </LineChart>
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
              <p>Upload a dataset with repeated multi-item baskets to populate this scatter chart.</p>
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

      <section className="workspace-stage surface-card">
        <div className="stage-head stage-head-slim">
          <h2>Detailed Rule Explorer</h2>
          <p>Search, sort, and inspect association rules with confidence context and related patterns.</p>
        </div>

        <div className="rule-explorer-toolbar">
          <label className="rule-search-input" htmlFor="rule-search">
            <FiSearch />
            <input
              id="rule-search"
              type="text"
              value={ruleSearchText}
              onChange={(event) => setRuleSearchText(event.target.value)}
              placeholder="Search by antecedent or consequent"
            />
          </label>

          <div className="rule-scope-chips" role="tablist" aria-label="Rule search scope">
            <button
              type="button"
              className={`scope-chip ${ruleSearchScope === "all" ? "active" : ""}`}
              onClick={() => setRuleSearchScope("all")}
            >
              All
            </button>
            <button
              type="button"
              className={`scope-chip ${ruleSearchScope === "antecedent" ? "active" : ""}`}
              onClick={() => setRuleSearchScope("antecedent")}
            >
              Antecedent
            </button>
            <button
              type="button"
              className={`scope-chip ${ruleSearchScope === "consequent" ? "active" : ""}`}
              onClick={() => setRuleSearchScope("consequent")}
            >
              Consequent
            </button>
          </div>

          <div className="rule-controls-row">
            <label>
              Sort by
              <select value={ruleSortMetric} onChange={(event) => setRuleSortMetric(event.target.value as RuleSortMetric)}>
                <option value="lift">Lift</option>
                <option value="confidence">Confidence</option>
                <option value="support">Support</option>
              </select>
            </label>

            <button
              type="button"
              className="scope-chip"
              onClick={() => setRuleSortDirection((prev) => (prev === "desc" ? "asc" : "desc"))}
            >
              {ruleSortDirection === "desc" ? <FiArrowDown /> : <FiArrowUp />} {ruleSortDirection.toUpperCase()}
            </button>

            <label>
              Rows
              <select value={rulePageSize} onChange={(event) => setRulePageSize(Number(event.target.value))}>
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </label>
          </div>
        </div>

        {reportRules.length === 0 ? (
          <div className="rule-empty-state">
            <h3>No rules available</h3>
            <p>Try broader thresholds in Workspace to discover more rule candidates.</p>
          </div>
        ) : searchedRules.length === 0 ? (
          <div className="rule-empty-state">
            <h3>No matches for your search</h3>
            <p>Try a different keyword or switch search scope.</p>
          </div>
        ) : (
          <div className="rule-explorer-layout">
            <section className="rule-table-panel">
              <div className="rule-table-wrap">
                <table className="data-table rule-data-table">
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
                    {pagedRules.map((rule) => {
                      const isSelected = selectedRuleKey === getRuleKey(rule);
                      return (
                        <tr
                          key={getRuleKey(rule)}
                          className={isSelected ? "selected" : ""}
                          onClick={() => setSelectedRuleKey(getRuleKey(rule))}
                        >
                          <td>{rule.antecedent}</td>
                          <td>{rule.consequent}</td>
                          <td>{rule.support.toFixed(3)}</td>
                          <td>{rule.confidence.toFixed(3)}</td>
                          <td>{rule.lift.toFixed(3)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="rule-pagination">
                <button
                  type="button"
                  className="ghost-btn"
                  onClick={() => setRulePage((prev) => Math.max(1, prev - 1))}
                  disabled={rulePage <= 1}
                >
                  <FiChevronLeft /> Prev
                </button>
                <p>
                  Page <strong>{rulePage}</strong> of <strong>{totalRulePages}</strong>
                </p>
                <button
                  type="button"
                  className="ghost-btn"
                  onClick={() => setRulePage((prev) => Math.min(totalRulePages, prev + 1))}
                  disabled={rulePage >= totalRulePages}
                >
                  Next <FiChevronRight />
                </button>
              </div>
            </section>

            <aside className="rule-detail-panel">
              {selectedRule ? (
                <>
                  <h3>Rule Details</h3>
                  <div className="rule-detail-metrics">
                    <p>
                      <span>Antecedent</span>
                      <strong>{selectedRule.antecedent}</strong>
                    </p>
                    <p>
                      <span>Consequent</span>
                      <strong>{selectedRule.consequent}</strong>
                    </p>
                    <p>
                      <span>Support</span>
                      <strong>{selectedRule.support.toFixed(4)}</strong>
                    </p>
                    <p>
                      <span>Confidence</span>
                      <strong>{selectedRule.confidence.toFixed(4)}</strong>
                    </p>
                    <p>
                      <span>Confidence Band</span>
                      <strong>{getConfidenceBand(selectedRule.confidence)}</strong>
                    </p>
                    <p>
                      <span>Lift</span>
                      <strong>{selectedRule.lift.toFixed(4)}</strong>
                    </p>
                  </div>

                  <div className="related-rules-block">
                    <h4>Related Rules</h4>
                    {relatedRules.length === 0 ? (
                      <p className="muted-text">No related rules for this selection.</p>
                    ) : (
                      <ul>
                        {relatedRules.map((rule) => (
                          <li key={getRuleKey(rule)}>
                            <p>
                              {rule.antecedent} → {rule.consequent}
                            </p>
                            <span>
                              Conf {rule.confidence.toFixed(3)} • Lift {rule.lift.toFixed(3)}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </>
              ) : (
                <div className="rule-empty-state detail-empty">
                  <h3>Select a rule</h3>
                  <p>Click any rule row to inspect detailed metrics and related rules.</p>
                </div>
              )}
            </aside>
          </div>
        )}
      </section>

      <section className="workspace-stage surface-card">
        <div className="stage-head stage-head-slim">
          <h2>Operational Recommendations and Export</h2>
          <p>Choose a product context, inspect ranked suggestions, and export your rules.</p>
        </div>

        <div className="recommend-row">
          <label htmlFor="itemSelect">Select Product</label>
          <select id="itemSelect" value={selectedItem} onChange={(e) => setSelectedItem(e.target.value)}>
            <option value="">Choose an item</option>
            {analysis.itemFrequency.map((item) => (
              <option key={item.item} value={item.item} title={item.item}>
                {shortProductLabel(item.item, 30)}
              </option>
            ))}
          </select>
        </div>

        <div className="recommend-status-block">
          {!selectedItem && <p className="muted-text">Select a product to preview recommendations.</p>}
          {selectedItem && recommendationResult.rows.length === 0 && (
            <p className="muted-text">No recommendations available for this item.</p>
          )}
          {selectedItem && recommendationResult.source === "itemsets" && (
            <p className="muted-text hint-text">Rule coverage is limited, so suggestions are based on itemset co-occurrence.</p>
          )}
          {selectedItem && recommendationResult.source === "popularity" && (
            <p className="muted-text hint-text">
              This dataset appears to contain mostly single-item baskets, so suggestions are based on overall popularity.
            </p>
          )}
        </div>

        <div className="recommend-grid">
          {recommendationResult.rows.map((rule, index) => (
            <div key={`${rule.consequent}-${index}`} className="recommend-chip">
              <h4 title={rule.consequent}>{rule.consequent}</h4>
              <p>{recommendationResult.source === "popularity" ? "Popularity" : "Confidence"} {rule.confidence.toFixed(2)}</p>
              <p>
                {recommendationResult.source === "popularity" ? "Support" : "Lift"}{" "}
                {recommendationResult.source === "popularity" ? rule.support.toFixed(2) : rule.lift.toFixed(2)}
              </p>
            </div>
          ))}
        </div>

        <div className="export-stage">
          <div>
            <h3>Export stakeholder-ready outputs</h3>
            <p>
              Export rows: <strong>{reportRules.length.toLocaleString()}</strong>
            </p>
          </div>
          <button className="ghost-btn" type="button" onClick={downloadRulesCsv}>
            <FiDownload /> Export Rules CSV
          </button>
        </div>
      </section>
    </div>
  );
}

export default Reports;
