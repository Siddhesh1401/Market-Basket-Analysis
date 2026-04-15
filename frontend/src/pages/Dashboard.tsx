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
  FiBarChart2,
  FiDatabase,
  FiDownload,
  FiFileText,
  FiInbox,
  FiLayers,
  FiLoader,
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

  const recommendations = useMemo(() => {
    if (!selectedItem || !analysis) {
      return [];
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

    const fallbackMatches = ruleCandidates.length > 0 ? ruleCandidates : fallbackItemsetCandidates;

    const seen = new Set<string>();
    return fallbackMatches
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
  }, [analysis, filteredRules, selectedItem]);

  const topProducts = useMemo(
    () => (analysis ? analysis.itemFrequency.slice(0, 8) : []),
    [analysis],
  );

  const downloadRulesCsv = () => {
    if (filteredRules.length === 0) {
      return;
    }
    const header = "Antecedent,Consequent,Support,Confidence,Lift\n";
    const rows = filteredRules
      .map(
        (rule) =>
          `"${rule.antecedent}","${rule.consequent}",${rule.support.toFixed(4)},${rule.confidence.toFixed(4)},${rule.lift.toFixed(4)}`,
      )
      .join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "basket-sense-rules.csv";
    a.click();
    URL.revokeObjectURL(url);
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
    <div className="page-shell">
      <section className="hero-mini dashboard-hero-premium">
        <div className="dashboard-hero-grid">
          <div className="dashboard-hero-copy">
            <p className="hero-eyebrow">Dashboard</p>
            <h1>Market Basket Workspace</h1>
            <p>
              Upload transaction data, tune thresholds, and surface product
              recommendations in a modern analytics workflow.
            </p>
            <div className="hero-inline-metrics">
              <span>
                <FiDatabase /> CSV Ingestion
              </span>
              <span>
                <FiBarChart2 /> Real-time Insights
              </span>
            </div>
          </div>

          <div className="dashboard-hero-art" aria-hidden>
            <div className="dashboard-art-orb" />
            <div className="dashboard-art-card card-main">
              <p>Signal Strength</p>
              <h4>2.84x</h4>
              <div className="art-bars">
                <span style={{ height: "35%" }} />
                <span style={{ height: "52%" }} />
                <span style={{ height: "66%" }} />
                <span style={{ height: "80%" }} />
              </div>
            </div>
            <div className="dashboard-art-card card-float">
              <FiLayers /> Rule Engine Active
            </div>
          </div>
        </div>
      </section>

      <section className="surface-card upload-card premium-upload-card">
        <div className="upload-heading-row">
          <div>
            <h2>Upload Dataset</h2>
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
          <button className="ghost-btn" type="button" onClick={downloadRulesCsv}>
            <FiDownload /> Export Rules
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

      {!analysis && !error && (
        <section className="surface-card empty-card premium-empty">
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
          <section className="kpi-grid">
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
          </section>

          <section className="surface-card">
            <h2>Rule Filters</h2>
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
          </section>

          <section className="dashboard-grid-two">
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
          </section>

          <section className="surface-card">
            <h2>Quick Recommendations</h2>
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
            <div className="recommend-grid">
              {recommendations.length === 0 && <p className="muted-text">No recommendations yet. Select an item to preview.</p>}
              {recommendations.map((rule, index) => (
                <div key={`${rule.consequent}-${index}`} className="recommend-chip">
                  <h4 title={rule.consequent}>{rule.consequent}</h4>
                  <p>Confidence {rule.confidence.toFixed(2)}</p>
                  <p>Lift {rule.lift.toFixed(2)}</p>
                </div>
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}

export default Dashboard;
