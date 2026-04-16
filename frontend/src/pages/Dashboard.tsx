import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  FiActivity,
  FiCheckCircle,
  FiDatabase,
  FiDownload,
  FiFileText,
  FiInbox,
  FiLoader,
  FiSearch,
  FiSettings,
  FiXCircle,
  FiZap,
  FiUploadCloud,
} from "react-icons/fi";
import type { AnalysisResult } from "../types";

type DashboardProps = {
  fileName: string;
  fileSize: number | null;
  error: string;
  analysis: AnalysisResult | null;
  onFileChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onFileSelected: (file: File) => void;
  onClearDataset: () => void;
  runAnalysis: () => Promise<void>;
};

type WorkflowStageState = "idle" | "active" | "complete";
type RecommendationSource = "rules" | "itemsets" | "popularity" | "none";

function Dashboard({
  fileName,
  fileSize,
  error,
  analysis,
  onFileChange,
  onFileSelected,
  onClearDataset,
  runAnalysis,
}: DashboardProps) {
  const [minSupport, setMinSupport] = useState(0.01);
  const [minConfidence, setMinConfidence] = useState(0.1);
  const [minLift, setMinLift] = useState(1);
  const [selectedItem, setSelectedItem] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const workflowStages = useMemo(
    () => [
      {
        title: "Upload",
        subtitle: "Bring transaction data",
        state: (fileName ? "complete" : "active") as WorkflowStageState,
      },
      {
        title: "Configure",
        subtitle: "Review analysis profile",
        state: (fileName ? "active" : "idle") as WorkflowStageState,
      },
      {
        title: "Analyze",
        subtitle: "Run market basket mining",
        state: (analysis ? "complete" : isAnalyzing || fileName ? "active" : "idle") as WorkflowStageState,
      },
      {
        title: "Inspect",
        subtitle: "Explore insight quality",
        state: (analysis ? "active" : "idle") as WorkflowStageState,
      },
      {
        title: "Export",
        subtitle: "Share filtered rule outputs",
        state: (analysis ? "active" : "idle") as WorkflowStageState,
      },
    ],
    [analysis, fileName, isAnalyzing],
  );

  const analysisProfile = [
    { label: "Algorithm", value: "FP-Growth (baseline profile)" },
    { label: "Min Support", value: "0.02" },
    { label: "Min Confidence", value: "0.10" },
    { label: "Min Lift", value: "1.00" },
    { label: "Rule Cap", value: "Top 400 rules" },
    { label: "Itemset Max Length", value: "2 items" },
  ];

  useEffect(() => {
    if (!fileName) {
      setUploadProgress(0);
      return;
    }

    setUploadProgress(8);
    const intervalId = window.setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 100) {
          window.clearInterval(intervalId);
          return 100;
        }
        return Math.min(prev + 12, 100);
      });
    }, 80);

    return () => window.clearInterval(intervalId);
  }, [fileName]);

  const filteredRules = useMemo(() => {
    if (!analysis) {
      return [];
    }
    return analysis.rules.filter(
      (rule) =>
        rule.support >= minSupport &&
        rule.confidence >= minConfidence &&
        rule.lift >= minLift,
    );
  }, [analysis, minSupport, minConfidence, minLift]);

  const parseRuleItems = (value: string) =>
    value
      .split(",")
      .map((part) => part.trim())
      .filter((part) => part.length > 0);

  const shortProductLabel = (value: string, maxLength = 26) => {
    if (value.length <= maxLength) {
      return value;
    }
    return `${value.slice(0, maxLength - 1)}...`;
  };

  const recommendationResult = useMemo(() => {
    if (!selectedItem || !analysis) {
      return {
        source: "none" as RecommendationSource,
        rows: [] as Recommendation[],
      };
    }

    type Recommendation = {
      consequent: string;
      confidence: number;
      lift: number;
      support: number;
    };

    const getCandidates = (rules: typeof analysis.rules) => {
      const collected: Recommendation[] = [];

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

    const strictMatches = getCandidates(filteredRules);
    const ruleCandidates = strictMatches.length > 0 ? strictMatches : getCandidates(analysis.rules);

    const fallbackItemsetCandidates: Recommendation[] =
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
            .filter((value): value is Recommendation => value !== null);

    const fallbackPopularityCandidates: Recommendation[] =
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
      .filter((ruleCandidate) => {
        if (seen.has(ruleCandidate.consequent)) {
          return false;
        }
        seen.add(ruleCandidate.consequent);
        return true;
      })
      .slice(0, 5);

    return { source, rows };
  }, [analysis, filteredRules, selectedItem]);

  const topProducts = useMemo(
    () => (analysis ? analysis.itemFrequency.slice(0, 8) : []),
    [analysis],
  );

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

  const exportMetadata = useMemo(() => {
    if (!analysis) {
      return {
        label: "Export Rules CSV",
        count: 0,
        hint: "",
      };
    }

    if (filteredRules.length > 0) {
      return {
        label: "Export Filtered Rules CSV",
        count: filteredRules.length,
        hint: "",
      };
    }

    if (analysis.rules.length > 0) {
      return {
        label: "Export All Rules CSV",
        count: analysis.rules.length,
        hint: "Current thresholds removed all rules, so export will use all mined rules.",
      };
    }

    if (analysis.topItemsets.length > 0) {
      return {
        label: "Export Itemsets CSV",
        count: analysis.topItemsets.length,
        hint: "No association rules were generated, so export will use co-occurring itemsets.",
      };
    }

    return {
      label: "Export Item Frequency CSV",
      count: analysis.itemFrequency.length,
      hint: "No co-occurrence pairs were found, so export will use item popularity.",
    };
  }, [analysis, filteredRules.length]);

  const downloadRulesCsv = () => {
    if (!analysis) {
      return;
    }

    const rulesToExport = filteredRules.length > 0 ? filteredRules : analysis.rules;
    if (rulesToExport.length > 0) {
      const header = "Antecedent,Consequent,Support,Confidence,Lift";
      const rows = rulesToExport.map(
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

  const formatFileSize = (size: number | null) => {
    if (!size) {
      return "";
    }
    if (size < 1024) {
      return `${size} B`;
    }
    if (size < 1024 * 1024) {
      return `${(size / 1024).toFixed(1)} KB`;
    }
    return `${(size / (1024 * 1024)).toFixed(2)} MB`;
  };

  const handleDrop: React.DragEventHandler<HTMLDivElement> = (event) => {
    event.preventDefault();
    setDragActive(false);
    const file = event.dataTransfer.files?.[0];
    if (file) {
      onFileSelected(file);
    }
  };

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    try {
      await runAnalysis();
    } finally {
      setIsAnalyzing(false);
    }
  };

  const openFilePicker = () => {
    inputRef.current?.click();
  };

  const clearDataset = () => {
    if (inputRef.current) {
      inputRef.current.value = "";
    }
    onClearDataset();
  };

  const previewStats = [
    {
      label: "Upload Status",
      value: fileName ? "Ready" : "Waiting",
      icon: FiDatabase,
    },
    {
      label: "File Size",
      value: fileName ? formatFileSize(fileSize) : "0 KB",
      icon: FiFileText,
    },
    {
      label: "Ready to Analyze",
      value: fileName ? "Yes" : "No",
      icon: FiActivity,
    },
  ];

  return (
    <div className="page-shell workspace-shell">
      <section className="hero-mini workflow-hero">
        <p className="hero-eyebrow">Workspace</p>
        <h1>Structured Market Basket Workflow</h1>
        <p>
          Move through a clear analytics sequence: upload data, review analysis profile,
          run mining, inspect rule quality, and export stakeholder-ready outputs.
        </p>
        <div className="hero-inline-metrics workflow-metrics">
          <span>
            <FiDatabase /> Controlled Data Intake
          </span>
          <span>
            <FiSettings /> Guided Analysis Stages
          </span>
          <span>
            <FiSearch /> Insight Inspection
          </span>
        </div>
      </section>

      <section className="surface-card workflow-rail">
        {workflowStages.map((stage, index) => (
          <article key={stage.title} className={`workflow-step ${stage.state}`}>
            <span className="workflow-step-index">{index + 1}</span>
            <div>
              <h3>{stage.title}</h3>
              <p>{stage.subtitle}</p>
            </div>
            {stage.state === "complete" && <FiCheckCircle className="workflow-step-check" />}
          </article>
        ))}
      </section>

      <section className="workspace-stage surface-card upload-card premium-upload-card">
        <div className="stage-head">
          <p className="stage-kicker">Step 1</p>
          <h2>Upload Dataset</h2>
          <p>Bring your transaction CSV to initialize the workspace session.</p>
        </div>

        <div className="upload-heading-row">
          <div>
            <p className="upload-subtext">
              Drag and drop your retail CSV, then run one-click basket analysis.
            </p>
          </div>
          <FiUploadCloud className="upload-heading-icon" />
        </div>

        <div
          className={`upload-dropzone ${dragActive ? "drop-active" : ""}`}
          onDragOver={(event) => {
            event.preventDefault();
            setDragActive(true);
          }}
          onDragLeave={() => setDragActive(false)}
          onDrop={handleDrop}
        >
          <FiUploadCloud className="dropzone-icon" />
          <h4>Drag and drop CSV or browse</h4>
          <p>
            Drop your file here or
            <button type="button" className="dropzone-link" onClick={openFilePicker}>
              browse your device
            </button>
          </p>
          <input ref={inputRef} type="file" accept=".csv" onChange={onFileChange} />
          <div className="required-tags">
            <span className="tag-pill">invoice/order id</span>
            <span className="tag-pill">product/item description</span>
            <span className="tag-pill">optional: transaction date</span>
          </div>
        </div>

        <div className="upload-row action-row">
          <button className="secondary-btn" type="button" onClick={openFilePicker}>
            <FiUploadCloud /> Upload File
          </button>
          <button className="primary-btn" type="button" onClick={handleAnalyze} disabled={isAnalyzing || !fileName}>
            {isAnalyzing ? <FiLoader className="spin" /> : <FiZap />}
            {isAnalyzing ? "Analyzing..." : "Analyze Dataset"}
          </button>
          <button className="danger-btn" type="button" onClick={clearDataset} disabled={!fileName && !analysis}>
            <FiXCircle /> Remove Dataset
          </button>
        </div>

        {fileName && (
          <div className="file-preview">
            <FiFileText />
            <div>
              <strong>{fileName}</strong>
              <p>{formatFileSize(fileSize)} • ready for analysis</p>
            </div>
          </div>
        )}

        {fileName && (
          <div className="upload-progress-wrap">
            <div className="upload-progress-bar">
              <span style={{ width: `${uploadProgress}%` }} />
            </div>
            <small>Upload complete: {uploadProgress}% - click Analyze Dataset to start mining.</small>
          </div>
        )}

        <div className="upload-mini-stats">
          {previewStats.map((stat) => {
            const Icon = stat.icon;
            return (
              <article key={stat.label} className="upload-mini-card">
                <p>{stat.label}</p>
                <h4>{stat.value}</h4>
                <Icon />
              </article>
            );
          })}
        </div>

        {error && <p className="error-pill">{error}</p>}
      </section>

      <section className="workspace-stage surface-card">
        <div className="stage-head">
          <p className="stage-kicker">Step 2</p>
          <h2>Configure Analysis Profile</h2>
          <p>
            This release uses a standardized baseline profile so teams can compare results
            consistently across datasets.
          </p>
        </div>
        <div className="profile-grid">
          {analysisProfile.map((setting) => (
            <article key={setting.label} className="profile-tile">
              <p>{setting.label}</p>
              <h4>{setting.value}</h4>
            </article>
          ))}
        </div>
      </section>

      {!analysis && !error && (
        <section className="workspace-stage surface-card empty-card premium-empty">
          <div className="stage-head stage-head-slim">
            <p className="stage-kicker">Step 3</p>
            <h2>Run Analysis</h2>
            <p>Execute mining once the dataset is loaded to unlock inspection views.</p>
          </div>
          <div className="empty-state-bg" />
          <div className="empty-icon-wrap" aria-hidden>
            <FiInbox />
          </div>
          <h3>No insights yet</h3>
          <p>
            Drop your CSV in the upload area above, then click Analyze Dataset
            to generate product affinity insights and visual reports.
          </p>
        </section>
      )}

      {analysis && (
        <>
          <section className="workspace-stage">
            <div className="stage-head stage-head-slim">
              <p className="stage-kicker">Step 3</p>
              <h2>Analyze Result Snapshot</h2>
              <p>Confirm mining quality with core volume and coverage indicators.</p>
            </div>
            <div className="kpi-grid">
              <article className="kpi-card">
                <p>Total Transactions</p>
                <h3>{analysis.totalTransactions.toLocaleString()}</h3>
              </article>
              <article className="kpi-card">
                <p>Unique Products</p>
                <h3>{analysis.uniqueItems.toLocaleString()}</h3>
              </article>
              <article className="kpi-card">
                <p>Filtered Rules</p>
                <h3>{filteredRules.length.toLocaleString()}</h3>
              </article>
              <article className="kpi-card">
                <p>Countries</p>
                <h3>{analysis.uniqueCountries.toLocaleString()}</h3>
              </article>
            </div>
          </section>

          <section className="workspace-stage surface-card">
            <div className="stage-head stage-head-slim">
              <p className="stage-kicker">Step 4</p>
              <h2>Inspect Rule Signal</h2>
              <p>Adjust threshold lenses, then evaluate demand and temporal trend patterns.</p>
            </div>

            <div className="slider-grid">
              <label>
                Min Support: {minSupport.toFixed(2)}
                <input type="range" min="0.01" max="0.2" step="0.01" value={minSupport} onChange={(e) => setMinSupport(Number(e.target.value))} />
              </label>
              <label>
                Min Confidence: {minConfidence.toFixed(2)}
                <input type="range" min="0.1" max="1" step="0.05" value={minConfidence} onChange={(e) => setMinConfidence(Number(e.target.value))} />
              </label>
              <label>
                Min Lift: {minLift.toFixed(1)}
                <input type="range" min="1" max="8" step="0.1" value={minLift} onChange={(e) => setMinLift(Number(e.target.value))} />
              </label>
            </div>

            <div className="dashboard-grid-two">
              <article className="surface-card">
                <h2>Top Product Demand</h2>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={topProducts} layout="vertical" margin={{ left: 12 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis
                      type="category"
                      dataKey="item"
                      width={110}
                      tick={{ fontSize: 11 }}
                      tickFormatter={(value: string) => shortProductLabel(value, 14)}
                    />
                    <Tooltip />
                    <Bar dataKey="count" fill="url(#barGradient)" radius={[0, 8, 8, 0]} />
                    <defs>
                      <linearGradient id="barGradient" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#4f46e5" />
                        <stop offset="100%" stopColor="#3b82f6" />
                      </linearGradient>
                    </defs>
                  </BarChart>
                </ResponsiveContainer>
              </article>

              <article className="surface-card">
                <h2>Monthly Trend</h2>
                <ResponsiveContainer width="100%" height={260}>
                  <LineChart data={analysis.monthlyTransactions}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="transactions" stroke="#4f46e5" strokeWidth={2.5} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </article>
            </div>
          </section>

          <section className="workspace-stage surface-card">
            <div className="stage-head stage-head-slim">
              <p className="stage-kicker">Step 5</p>
              <h2>Operational Recommendations and Export</h2>
              <p>Select a product context, inspect ranked suggestions, and export filtered rules.</p>
            </div>

            <div className="recommend-row">
              <label htmlFor="itemSelect">Select Product</label>
              <select id="itemSelect" value={selectedItem} onChange={(e) => setSelectedItem(e.target.value)}>
                <option value="">Choose an item</option>
                {analysis.itemFrequency.map((item) => (
                  <option key={item.item} value={item.item} title={item.item}>
                    {shortProductLabel(item.item)}
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
                <p className="muted-text hint-text">
                  Rule coverage is limited, so these suggestions are based on itemset co-occurrence.
                </p>
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
                  <p>
                    {recommendationResult.source === "popularity" ? "Popularity" : "Confidence"} {rule.confidence.toFixed(2)}
                  </p>
                  <p>
                    {recommendationResult.source === "popularity" ? "Support" : "Lift"}{" "}
                    {recommendationResult.source === "popularity" ? rule.support.toFixed(2) : rule.lift.toFixed(2)}
                  </p>
                </div>
              ))}
            </div>

            <div className="export-stage">
              <div>
                <h3>Export stakeholder-ready rule set</h3>
                <p>
                  Current export rows: <strong>{exportMetadata.count.toLocaleString()}</strong>
                </p>
                {exportMetadata.hint && <p className="export-hint">{exportMetadata.hint}</p>}
              </div>
              <button className="ghost-btn" type="button" onClick={downloadRulesCsv} disabled={exportMetadata.count === 0}>
                <FiDownload /> {exportMetadata.label}
              </button>
            </div>
          </section>
        </>
      )}
    </div>
  );
}

export default Dashboard;
