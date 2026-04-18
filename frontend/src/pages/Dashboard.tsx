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
  FiAlertTriangle,
  FiArrowDown,
  FiArrowUp,
  FiChevronLeft,
  FiChevronRight,
  FiCpu,
  FiCheckCircle,
  FiDatabase,
  FiDownload,
  FiFileText,
  FiInfo,
  FiInbox,
  FiLoader,
  FiSearch,
  FiSettings,
  FiXCircle,
  FiZap,
  FiUploadCloud,
} from "react-icons/fi";
import type {
  AnalysisParams,
  AnalysisResult,
  CanonicalSchemaField,
  ColumnMapping,
  MiningAlgorithm,
  SchemaSuggestResponse,
} from "../types";

type DashboardProps = {
  fileName: string;
  fileSize: number | null;
  fileObject: File | null;
  csvText: string;
  error: string;
  analysis: AnalysisResult | null;
  onFileChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onFileSelected: (file: File) => void;
  onClearDataset: () => void;
  runAnalysis: (params: AnalysisParams, columnMapping?: ColumnMapping) => Promise<void>;
};

type WorkflowStageState = "idle" | "active" | "complete";
type RecommendationSource = "rules" | "itemsets" | "popularity" | "none";
type PresetKey = "balanced" | "broad" | "strict";
type PresetSelection = PresetKey | "custom";
type RuleSearchScope = "all" | "antecedent" | "consequent";
type RuleSortMetric = "support" | "confidence" | "lift";
type RuleSortDirection = "asc" | "desc";
type RuleRow = AnalysisResult["rules"][number];

const PRESET_PROFILES: Record<PresetKey, { label: string; description: string; params: AnalysisParams }> = {
  balanced: {
    label: "Balanced",
    description: "General-purpose settings for most retail datasets.",
    params: {
      algorithm: "fpgrowth",
      minSupport: 0.02,
      minConfidence: 0.2,
      minLift: 1,
      topN: 120,
    },
  },
  broad: {
    label: "Broad",
    description: "Capture more candidates for exploratory analysis and discovery.",
    params: {
      algorithm: "fpgrowth",
      minSupport: 0.005,
      minConfidence: 0.1,
      minLift: 0.8,
      topN: 240,
    },
  },
  strict: {
    label: "Strict",
    description: "Prioritize stronger and higher-confidence associations.",
    params: {
      algorithm: "apriori",
      minSupport: 0.03,
      minConfidence: 0.35,
      minLift: 1.2,
      topN: 80,
    },
  },
};

const PRESET_ORDER: PresetKey[] = ["balanced", "broad", "strict"];

const SCHEMA_FIELD_META: Array<{ key: CanonicalSchemaField; label: string; required?: boolean; hint: string }> = [
  { key: "item", label: "Item/Product", required: true, hint: "Primary product column used for basket mining." },
  { key: "invoice", label: "Invoice/Order", hint: "Transaction identifier for precise basket grouping." },
  { key: "date", label: "Date", hint: "Used for temporal trends and synthetic transaction fallback." },
  { key: "time", label: "Time", hint: "Used with date for stronger temporal basket inference." },
  { key: "quantity", label: "Quantity", hint: "Optional quality filter for non-positive quantity rows." },
  { key: "price", label: "Price", hint: "Optional quality filter for non-positive price rows." },
  { key: "country", label: "Country", hint: "Optional geography distribution insights." },
];

function Dashboard({
  fileName,
  fileSize,
  fileObject,
  csvText,
  error,
  analysis,
  onFileChange,
  onFileSelected,
  onClearDataset,
  runAnalysis,
}: DashboardProps) {
  const [draftParams, setDraftParams] = useState<AnalysisParams>(PRESET_PROFILES.balanced.params);
  const [appliedParams, setAppliedParams] = useState<AnalysisParams>(PRESET_PROFILES.balanced.params);
  const [selectedPreset, setSelectedPreset] = useState<PresetSelection>("balanced");
  const [appliedPreset, setAppliedPreset] = useState<PresetSelection>("balanced");
  const [selectedItem, setSelectedItem] = useState("");
  const [ruleSearchText, setRuleSearchText] = useState("");
  const [ruleSearchScope, setRuleSearchScope] = useState<RuleSearchScope>("all");
  const [ruleSortMetric, setRuleSortMetric] = useState<RuleSortMetric>("lift");
  const [ruleSortDirection, setRuleSortDirection] = useState<RuleSortDirection>("desc");
  const [rulePageSize, setRulePageSize] = useState(20);
  const [rulePage, setRulePage] = useState(1);
  const [selectedRuleKey, setSelectedRuleKey] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);
  const [schemaSuggestion, setSchemaSuggestion] = useState<SchemaSuggestResponse["suggestion"] | null>(null);
  const [schemaMapping, setSchemaMapping] = useState<ColumnMapping>({});
  const [schemaLoading, setSchemaLoading] = useState(false);
  const [schemaError, setSchemaError] = useState("");
  const [schemaSource, setSchemaSource] = useState("");
  const [schemaAiApplied, setSchemaAiApplied] = useState(false);
  const [schemaAiConfigured, setSchemaAiConfigured] = useState(false);
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

  useEffect(() => {
    setSchemaSuggestion(null);
    setSchemaMapping({});
    setSchemaError("");
    setSchemaSource("");
    setSchemaAiApplied(false);
    setSchemaAiConfigured(false);
  }, [csvText, fileName]);

  const requestSchemaSuggestion = async () => {
    setSchemaLoading(true);
    setSchemaError("");
    try {
      // If file is Excel, send file directly; else send CSV text
      if (fileObject && (fileObject.name.toLowerCase().endsWith('.xlsx') || fileObject.name.toLowerCase().endsWith('.xls'))) {
        const formData = new FormData();
        formData.append('file', fileObject);

        const response = await fetch("http://localhost:5000/api/schema-suggest", {
          method: "POST",
          body: formData,
        });

        const body = (await response.json().catch(() => null)) as SchemaSuggestResponse | { error?: string } | null;
        if (!response.ok || !body || !("suggestion" in body)) {
          const message = body && "error" in body ? body.error ?? "Failed to suggest schema." : "Failed to suggest schema.";
          setSchemaSuggestion(null);
          setSchemaMapping({});
          setSchemaError(message);
          return;
        }

        setSchemaSuggestion(body.suggestion);
        const initialMapping: ColumnMapping = {};
        SCHEMA_FIELD_META.forEach(({ key }) => {
          const candidate = body.suggestion.mapping[key];
          if (typeof candidate === "string" && candidate.trim()) {
            initialMapping[key] = candidate;
          }
        });
        setSchemaMapping(initialMapping);
        setSchemaSource(body.source || "");
        setSchemaAiApplied(body.aiApplied || false);
        setSchemaAiConfigured(body.aiConfigured || false);
      } else if (!csvText.trim()) {
        setSchemaError("Upload a CSV file first to detect schema mapping.");
        return;
      } else {
        // Original CSV text flow
        const response = await fetch("http://localhost:5000/api/schema-suggest", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            csv_text: csvText,
            sample_rows: 8,
            use_ai: true,
            ai_threshold: 0.75,
          }),
        });

        const body = (await response.json().catch(() => null)) as SchemaSuggestResponse | { error?: string } | null;
        if (!response.ok || !body || !("suggestion" in body)) {
          const message = body && "error" in body ? body.error ?? "Failed to suggest schema." : "Failed to suggest schema.";
          setSchemaSuggestion(null);
          setSchemaMapping({});
          setSchemaError(message);
          return;
        }

        setSchemaSuggestion(body.suggestion);
        const initialMapping: ColumnMapping = {};
        SCHEMA_FIELD_META.forEach(({ key }) => {
          const candidate = body.suggestion.mapping[key];
          if (typeof candidate === "string" && candidate.trim()) {
            initialMapping[key] = candidate;
          }
        });
        setSchemaMapping(initialMapping);
        setSchemaSource(body.source || "");
        setSchemaAiApplied(body.aiApplied || false);
        setSchemaAiConfigured(body.aiConfigured || false);
      }
    } catch (err) {
      setSchemaError(err instanceof Error ? err.message : "Unknown error");
      setSchemaSuggestion(null);
      setSchemaMapping({});
    } finally {
      setSchemaLoading(false);
    }
  };

  useEffect(() => {
    if (!csvText.trim()) {
      return;
    }
    void requestSchemaSuggestion();
  }, [csvText]);

  const normalizedSchemaMapping = useMemo(() => {
    const mapping: ColumnMapping = {};
    Object.entries(schemaMapping).forEach(([field, value]) => {
      if (typeof value === "string" && value.trim()) {
        mapping[field as CanonicalSchemaField] = value;
      }
    });
    return mapping;
  }, [schemaMapping]);

  const missingRequiredMapping = useMemo(() => {
    if (!schemaSuggestion) {
      return ["item"] as CanonicalSchemaField[];
    }
    return (schemaSuggestion.requiredFields ?? ["item"]).filter((field) => !normalizedSchemaMapping[field]);
  }, [normalizedSchemaMapping, schemaSuggestion]);

  const schemaConfidence = schemaSuggestion?.overallConfidence ?? 0;

  const filteredRules = useMemo(() => {
    if (!analysis) {
      return [];
    }
    return analysis.rules.filter(
      (rule) =>
        rule.support >= appliedParams.minSupport &&
        rule.confidence >= appliedParams.minConfidence &&
        rule.lift >= appliedParams.minLift,
    );
  }, [analysis, appliedParams.minConfidence, appliedParams.minLift, appliedParams.minSupport]);

  const diagnostics = useMemo(() => {
    if (!analysis?.preprocessing) {
      return null;
    }

    const prep = analysis.preprocessing;
    const droppedRate = prep.rawRows > 0 ? prep.droppedRows / prep.rawRows : 0;

    const recommendations: string[] = [];
    if (droppedRate > 0.35) {
      recommendations.push("High row drop rate detected. Check invoice and product columns for missing values.");
    }
    if (prep.removedCancelledInvoices > 0) {
      recommendations.push("Cancelled invoices were removed. This is expected for cleaner purchase behavior.");
    }
    if (prep.removedNoiseItems > 0) {
      recommendations.push("Service/noise items were removed. Consider checking raw data labels if counts are unexpectedly high.");
    }
    if ((analysis.rules?.length ?? 0) === 0) {
      recommendations.push("No rules generated. Try the Broad preset or lower support/confidence thresholds.");
    }
    if (analysis.transactionInferenceMode === "row-bucket") {
      recommendations.push("Invoice/date-time columns were missing, so transactions were approximated from nearby rows. Treat rules as directional guidance.");
    } else if (analysis.usedSyntheticTransactions) {
      recommendations.push("Transaction IDs were inferred from date/time windows. Add invoice/order IDs for strongest rule quality.");
    }

    return {
      droppedRate,
      recommendations,
    };
  }, [analysis]);

  const hasPendingChanges = useMemo(
    () =>
      draftParams.algorithm !== appliedParams.algorithm ||
      draftParams.minSupport !== appliedParams.minSupport ||
      draftParams.minConfidence !== appliedParams.minConfidence ||
      draftParams.minLift !== appliedParams.minLift ||
      draftParams.topN !== appliedParams.topN,
    [appliedParams, draftParams],
  );

  const currentPresetDescription =
    selectedPreset === "custom" ? "Manual profile tuned by user controls." : PRESET_PROFILES[selectedPreset].description;

  const applyPreset = (presetKey: PresetKey) => {
    setSelectedPreset(presetKey);
    setDraftParams(PRESET_PROFILES[presetKey].params);
  };

  const updateDraftParams = (next: Partial<AnalysisParams>) => {
    setSelectedPreset("custom");
    setDraftParams((prev) => ({ ...prev, ...next }));
  };

  const applyDraftParams = () => {
    setAppliedParams(draftParams);
    setAppliedPreset(selectedPreset);
  };

  const resetDraftParams = () => {
    setDraftParams(appliedParams);
    setSelectedPreset(appliedPreset);
  };

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

  const getRuleKey = (rule: RuleRow) =>
    `${rule.antecedent}|${rule.consequent}|${rule.support.toFixed(6)}|${rule.confidence.toFixed(6)}|${rule.lift.toFixed(6)}`;

  const getConfidenceBand = (confidence: number) => {
    if (confidence >= 0.6) {
      return "High";
    }
    if (confidence >= 0.3) {
      return "Medium";
    }
    return "Low";
  };

  const searchedRules = useMemo(() => {
    const needle = ruleSearchText.trim().toLowerCase();
    if (needle.length === 0) {
      return filteredRules;
    }

    return filteredRules.filter((rule) => {
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
  }, [filteredRules, ruleSearchScope, ruleSearchText]);

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
  }, [ruleSearchScope, ruleSearchText, ruleSortDirection, ruleSortMetric, rulePageSize, filteredRules.length]);

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
      return [] as RuleRow[];
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
    if (hasPendingChanges) {
      window.alert("You have unapplied profile changes. Click Apply Settings in Step 2 first.");
      return;
    }

    if (!schemaSuggestion && csvText.trim()) {
      window.alert("Schema mapping is still being prepared. Please wait a moment and try again.");
      return;
    }

    if (missingRequiredMapping.length > 0) {
      window.alert("Schema mapping is incomplete. Please map the required Item/Product field before analysis.");
      return;
    }

    setIsAnalyzing(true);
    try {
      await runAnalysis(appliedParams, normalizedSchemaMapping);
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

  const updateSchemaField = (field: CanonicalSchemaField, value: string) => {
    setSchemaMapping((prev) => {
      const next = { ...prev };
      if (value.trim()) {
        next[field] = value;
      } else {
        delete next[field];
      }
      return next;
    });
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
          <input ref={inputRef} type="file" accept=".csv,.xlsx,.xls" onChange={onFileChange} />
          <div className="required-tags">
            <span className="tag-pill">required: product/item column</span>
            <span className="tag-pill">best: invoice/order + item</span>
            <span className="tag-pill">fallback: date/time or row buckets</span>
          </div>

          <details className="dataset-format-guide">
            <summary>Accepted dataset formats</summary>
            <div className="dataset-format-grid">
              <article>
                <h4>Best quality format</h4>
                <p>Include transaction identifier and product name columns.</p>
                <span>Examples: invoice_no/order_id + description/product_name</span>
              </article>
              <article>
                <h4>Supported fallback format</h4>
                <p>If invoice/order is missing, include date/time so transaction groups can be inferred.</p>
                <span>Examples: date/time + product columns</span>
              </article>
              <article>
                <h4>Last-resort fallback</h4>
                <p>When invoice and date/time are both missing, nearby rows are grouped into synthetic baskets.</p>
                <span>This works, but results are approximate directional guidance.</span>
              </article>
            </div>
            <p className="dataset-note">
              Recognized product column aliases include: description, product, product_name, item, itemname, coffee_name, sku.
            </p>
          </details>
        </div>

        {fileName && (
          <div className="schema-mapper-card">
            <div className="schema-mapper-header">
              <div>
                <p className="stage-kicker">Phase 2.7</p>
                <h3>Schema Mapping Review</h3>
                <p>
                  Validate detected columns before analysis. Rule-based matching runs first, then Gemini assists when confidence is low.
                </p>
              </div>
              <button
                type="button"
                className="secondary-btn"
                onClick={() => {
                  void requestSchemaSuggestion();
                }}
                disabled={schemaLoading || !csvText.trim()}
              >
                {schemaLoading ? <FiLoader className="spin" /> : <FiSearch />} Detect Mapping
              </button>
            </div>

            <div className="schema-pill-row">
              <span className={`schema-pill ${missingRequiredMapping.length === 0 ? "ok" : "warn"}`}>
                {missingRequiredMapping.length === 0 ? "Required mapping ready" : "Required mapping missing"}
              </span>
              <span className="schema-pill">Confidence {Math.round(schemaConfidence * 100)}%</span>
              {schemaSource && <span className="schema-pill">Source: {schemaSource}</span>}
              {schemaAiApplied && <span className="schema-pill">Gemini assisted</span>}
              {!schemaAiApplied && schemaAiConfigured && schemaSource && <span className="schema-pill">Rule engine resolved</span>}
              {!schemaAiConfigured && <span className="schema-pill">Gemini not configured</span>}
            </div>

            {schemaLoading && <p className="control-note">Detecting column semantics and preparing mapping suggestions...</p>}

            {schemaError && <p className="error-pill">{schemaError}</p>}

            {schemaSuggestion && (
              <>
                <div className="schema-field-grid">
                  {SCHEMA_FIELD_META.map((field) => {
                    const fieldConfidence = schemaSuggestion.fieldConfidence[field.key] ?? 0;
                    const selectedValue = schemaMapping[field.key] ?? "";
                    const alternatives = schemaSuggestion.alternatives[field.key] ?? [];

                    return (
                      <article key={field.key} className={`schema-field-card ${field.required ? "required" : ""}`}>
                        <div className="schema-field-top">
                          <h4>
                            {field.label}
                            {field.required && <span>Required</span>}
                          </h4>
                          <strong>{Math.round(fieldConfidence * 100)}%</strong>
                        </div>
                        <select value={selectedValue} onChange={(event) => updateSchemaField(field.key, event.target.value)}>
                          <option value="">Not mapped</option>
                          {schemaSuggestion.columns.map((column) => (
                            <option key={`${field.key}-${column}`} value={column}>
                              {column}
                            </option>
                          ))}
                        </select>
                        <p>{field.hint}</p>
                        {alternatives.length > 0 && (
                          <small>Top candidates: {alternatives.slice(0, 3).join(", ")}</small>
                        )}
                      </article>
                    );
                  })}
                </div>

                {schemaSuggestion.notes.length > 0 && (
                  <div className="schema-notes">
                    <h4>Mapping notes</h4>
                    <ul>
                      {schemaSuggestion.notes.map((note, index) => (
                        <li key={`${note}-${index}`}>{note}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        <div className="upload-row action-row">
          <button className="secondary-btn" type="button" onClick={openFilePicker}>
            <FiUploadCloud /> Upload File
          </button>
          <button
            className="primary-btn"
            type="button"
            onClick={handleAnalyze}
            disabled={isAnalyzing || schemaLoading || !fileName || hasPendingChanges}
          >
            {isAnalyzing || schemaLoading ? <FiLoader className="spin" /> : <FiZap />}
            {isAnalyzing ? "Analyzing..." : schemaLoading ? "Preparing mapping..." : "Analyze Dataset"}
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
            Select the mining algorithm and thresholds before running analysis. These controls
            are applied directly to backend mining.
          </p>
        </div>

        <div className="preset-strip">
          {PRESET_ORDER.map((presetKey) => {
            const preset = PRESET_PROFILES[presetKey];
            return (
              <button
                key={presetKey}
                type="button"
                className={`preset-chip ${selectedPreset === presetKey ? "active" : ""}`}
                onClick={() => applyPreset(presetKey)}
              >
                {preset.label}
              </button>
            );
          })}
          {selectedPreset === "custom" && <span className="preset-chip custom">Custom</span>}
        </div>

        <p className="control-note">{currentPresetDescription}</p>

        <div className="control-grid">
          <article className="profile-tile control-card">
            <p>Algorithm</p>
            <div className="control-inline">
              <FiCpu />
              <select
                value={draftParams.algorithm}
                onChange={(e) => updateDraftParams({ algorithm: e.target.value as MiningAlgorithm })}
              >
                <option value="fpgrowth">FP-Growth</option>
                <option value="apriori">Apriori</option>
              </select>
            </div>
          </article>

          <article className="profile-tile control-card">
            <p>Min Support</p>
            <h4>{draftParams.minSupport.toFixed(3)}</h4>
            <input
              type="range"
              min="0.005"
              max="0.2"
              step="0.005"
              value={draftParams.minSupport}
              onChange={(e) => updateDraftParams({ minSupport: Number(e.target.value) })}
            />
          </article>

          <article className="profile-tile control-card">
            <p>Min Confidence</p>
            <h4>{draftParams.minConfidence.toFixed(2)}</h4>
            <input
              type="range"
              min="0.05"
              max="1"
              step="0.05"
              value={draftParams.minConfidence}
              onChange={(e) => updateDraftParams({ minConfidence: Number(e.target.value) })}
            />
          </article>

          <article className="profile-tile control-card">
            <p>Min Lift</p>
            <h4>{draftParams.minLift.toFixed(2)}</h4>
            <input
              type="range"
              min="0.5"
              max="8"
              step="0.1"
              value={draftParams.minLift}
              onChange={(e) => updateDraftParams({ minLift: Number(e.target.value) })}
            />
          </article>

          <article className="profile-tile control-card">
            <p>Top Rules</p>
            <h4>{draftParams.topN}</h4>
            <input
              type="range"
              min="20"
              max="400"
              step="20"
              value={draftParams.topN}
              onChange={(e) => updateDraftParams({ topN: Number(e.target.value) })}
            />
          </article>
        </div>

        <details className="algo-guide">
          <summary>
            <FiInfo /> What are FP-Growth and Apriori?
          </summary>
          <div className="algo-guide-grid">
            <article>
              <h4>FP-Growth</h4>
              <p>Builds a compact FP-tree and mines frequent patterns without generating huge candidate sets.</p>
              <span>Best for larger or sparse datasets with many unique products.</span>
            </article>
            <article>
              <h4>Apriori</h4>
              <p>Generates and tests candidate itemsets level by level, which is simpler but can be slower at scale.</p>
              <span>Useful for small to medium datasets and easier conceptual explanation.</span>
            </article>
          </div>
        </details>

        <div className="profile-actions">
          <button className="secondary-btn" type="button" onClick={applyDraftParams} disabled={!hasPendingChanges}>
            Apply Settings
          </button>
          <button className="ghost-btn" type="button" onClick={resetDraftParams} disabled={!hasPendingChanges}>
            Reset Draft
          </button>
        </div>

        <p className="control-note">
          Applied run profile: <strong>{appliedParams.algorithm.toUpperCase()}</strong> • support {appliedParams.minSupport.toFixed(3)} • confidence {appliedParams.minConfidence.toFixed(2)} • lift {appliedParams.minLift.toFixed(2)} • top {appliedParams.topN} rules
        </p>
        {hasPendingChanges && <p className="control-warning">You have unapplied changes. Apply Settings to run analysis with this draft profile.</p>}
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
              <p>Confirm mining quality and review preprocessing diagnostics before interpreting rules.</p>
            </div>

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
              <p>Evaluate demand and temporal trend patterns produced by your selected run profile.</p>
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

            <article className="surface-card rule-explorer-card">
              <div className="rule-explorer-header">
                <div>
                  <h2>Rule Explorer</h2>
                  <p>Search, sort, and inspect association rules with detailed confidence context.</p>
                </div>
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

              {filteredRules.length === 0 ? (
                <div className="rule-empty-state">
                  <h3>No rules available for this profile</h3>
                  <p>Try Broad preset or reduce support/confidence thresholds to discover more rule candidates.</p>
                </div>
              ) : searchedRules.length === 0 ? (
                <div className="rule-empty-state">
                  <h3>No matches for your search</h3>
                  <p>Try a different product keyword or switch search scope.</p>
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
                                  <span>Conf {rule.confidence.toFixed(3)} • Lift {rule.lift.toFixed(3)}</span>
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
            </article>
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
