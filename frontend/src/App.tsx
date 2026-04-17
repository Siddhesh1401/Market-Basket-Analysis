import { useState, type ChangeEvent } from "react";
import { BrowserRouter, Navigate, NavLink, Route, Routes } from "react-router-dom";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import Reports from "./pages/Reports";
import BasketSimulator from "./pages/BasketSimulator";
import type { AnalysisParams, AnalysisResult, MiningAlgorithm } from "./types";
import "./App.css";

function AppShell() {
  const [fileName, setFileName] = useState("");
  const [fileSize, setFileSize] = useState<number | null>(null);
  const [csvText, setCsvText] = useState("");
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [analysisRunAt, setAnalysisRunAt] = useState<string | null>(null);
  const [error, setError] = useState("");

  const workspaceStatus = analysis
    ? { label: "Insights Ready", tone: "ready" }
    : fileName
      ? { label: "Dataset Loaded", tone: "pending" }
      : { label: "Awaiting Dataset", tone: "idle" };

  const onFileSelected = (file: File) => {
    if (!file) {
      return;
    }

    setError("");
    setAnalysis(null);
    setFileName(file.name);
    setFileSize(file.size);

    const reader = new FileReader();
    reader.onload = () => {
      setCsvText(String(reader.result ?? ""));
    };
    reader.onerror = () => {
      setError("Could not read the file. Please try another CSV.");
    };
    reader.readAsText(file);
  };

  const onFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    onFileSelected(file);
  };

  const clearDataset = () => {
    setFileName("");
    setFileSize(null);
    setCsvText("");
    setAnalysis(null);
    setAnalysisRunAt(null);
    setError("");
  };

  const runAnalysis = async (params: AnalysisParams) => {
    if (!csvText) {
      setError("Upload a CSV file first.");
      return;
    }

    try {
      const response = await fetch("http://localhost:5000/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          csv_text: csvText,
          algorithm: params.algorithm,
          min_support: params.minSupport,
          min_confidence: params.minConfidence,
          min_lift: params.minLift,
          top_n: params.topN,
        }),
      });

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { error?: string; alert?: string } | null;
        const message = body?.alert ?? body?.error ?? "Dataset not suitable for mining.";
        setAnalysis(null);
        setError(message);
        window.alert(message);
        return;
      }

      const body = (await response.json()) as { analysis: AnalysisResult; algorithm: MiningAlgorithm; alert?: string };
      setAnalysis(body.analysis);
      setAnalysisRunAt(new Date().toISOString());
      setError("");
      if (body.alert) {
        window.alert(body.alert);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Analysis failed.";
      setError(message);
      setAnalysis(null);
      setAnalysisRunAt(null);
      window.alert(message);
    }
  };

  return (
    <>
      <header className="app-navbar">
        <div className="nav-container nav-container-pro">
          <div className="brand-block">
            <div className="brand-mark">Basket Sense</div>
            <p className="brand-sub">Market Basket Intelligence Studio</p>
          </div>
          <nav className="nav-links">
            <NavLink to="/" className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`} end>
              Home
            </NavLink>
            <NavLink to="/workspace" className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}>
              Workspace
            </NavLink>
            <NavLink to="/reports" className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}>
              Reports
            </NavLink>
            <NavLink to="/simulator" className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}>
              Simulator
            </NavLink>
          </nav>
          <div className="nav-status" aria-live="polite">
            <span className={`status-pill ${workspaceStatus.tone}`}>{workspaceStatus.label}</span>
          </div>
        </div>
      </header>

      <main className="app-main">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/dashboard" element={<Navigate to="/workspace" replace />} />
          <Route
            path="/workspace"
            element={
              <Dashboard
                fileName={fileName}
                fileSize={fileSize}
                error={error}
                analysis={analysis}
                onFileChange={onFileChange}
                onFileSelected={onFileSelected}
                onClearDataset={clearDataset}
                runAnalysis={runAnalysis}
              />
            }
          />
          <Route path="/reports" element={<Reports analysis={analysis} />} />
          <Route
            path="/simulator"
            element={<BasketSimulator analysis={analysis} activeFileName={fileName} analyzedAt={analysisRunAt} />}
          />
          <Route path="/basket-simulator" element={<Navigate to="/simulator" replace />} />
        </Routes>
      </main>
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppShell />
    </BrowserRouter>
  );
}

export default App;
