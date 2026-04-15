import { useState, type ChangeEvent } from "react";
import { BrowserRouter, NavLink, Route, Routes } from "react-router-dom";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import Reports from "./pages/Reports";
import type { AnalysisResult } from "./types";
import "./App.css";

function AppShell() {
  const [fileName, setFileName] = useState("");
  const [fileSize, setFileSize] = useState<number | null>(null);
  const [csvText, setCsvText] = useState("");
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState("");

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
    setError("");
  };

  const runAnalysis = async () => {
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
          algorithm: "fpgrowth",
          min_support: 0.02,
          min_confidence: 0.1,
          min_lift: 1,
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

      const body = (await response.json()) as { analysis: AnalysisResult; algorithm: "fpgrowth"; alert?: string };
      setAnalysis(body.analysis);
      setError("");
      if (body.alert) {
        window.alert(body.alert);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Analysis failed.";
      setError(message);
      setAnalysis(null);
      window.alert(message);
    }
  };

  return (
    <>
      <header className="app-navbar">
        <div className="nav-container">
          <div className="brand-mark">Basket Sense</div>
          <nav className="nav-links">
            <NavLink to="/" className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`} end>
              Home
            </NavLink>
            <NavLink to="/dashboard" className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}>
              Dashboard
            </NavLink>
            <NavLink to="/reports" className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}>
              Reports
            </NavLink>
          </nav>
        </div>
      </header>

      <main className="app-main">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route
            path="/dashboard"
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
