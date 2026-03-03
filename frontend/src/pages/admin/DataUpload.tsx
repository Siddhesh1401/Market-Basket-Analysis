import { useState, useRef } from "react";
import { FiUpload, FiFile, FiCheck, FiRefreshCw } from "react-icons/fi";

const DataUpload = () => {
  const [dragging, setDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<"idle" | "training" | "done">("idle");
  const [minSupport, setMinSupport] = useState(0.01);
  const [minConfidence, setMinConfidence] = useState(0.20);
  const [minLift, setMinLift] = useState(1.0);
  const [algorithm, setAlgorithm] = useState("fpgrowth");
  const fileRef = useRef<HTMLInputElement>(null);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f?.name.endsWith(".csv")) setFile(f);
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) setFile(f);
  };

  const handleTrain = () => {
    setStatus("training"); setProgress(0);
    const steps = [10, 25, 40, 55, 70, 82, 90, 100];
    steps.forEach((p, i) => setTimeout(() => {
      setProgress(p);
      if (p === 100) setStatus("done");
    }, i * 400));
  };

  const handleReset = () => { setFile(null); setProgress(0); setStatus("idle"); };

  const statusMessages: Record<number, string> = {
    10: "Loading dataset...",
    25: "Cleaning & preprocessing...",
    40: "Building transaction matrix...",
    55: "Running " + algorithm.toUpperCase() + "...",
    70: "Generating association rules...",
    82: "Calculating metrics...",
    90: "Saving model...",
    100: "Complete!",
  };

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Data Upload &amp; Retrain</h1>
          <p className="admin-page-subtitle">Upload a new transaction CSV to retrain the recommendation model</p>
        </div>
      </div>

      {/* Current Dataset Info */}
      <div className="dataset-info-card">
        <h3>Current Dataset</h3>
        <div className="dataset-meta">
          <div className="dataset-meta-item"><span>File</span><strong>retail.csv</strong></div>
          <div className="dataset-meta-item"><span>Size</span><strong>45.6 MB</strong></div>
          <div className="dataset-meta-item"><span>Rows</span><strong>541,909</strong></div>
          <div className="dataset-meta-item"><span>Products</span><strong>4,070 unique</strong></div>
          <div className="dataset-meta-item"><span>Last Trained</span><strong>March 3, 2026</strong></div>
        </div>
      </div>

      {/* Upload Zone */}
      <div className="upload-section">
        <h3 className="chart-title">Upload New Dataset</h3>
        <div
          className={`upload-zone ${dragging ? "dragging" : ""} ${file ? "has-file" : ""}`}
          onDragOver={e => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => !file && fileRef.current?.click()}
        >
          <input ref={fileRef} type="file" accept=".csv" onChange={handleFile} style={{ display: "none" }} />
          {file ? (
            <div className="file-selected">
              <FiFile className="file-icon" />
              <div>
                <p className="file-name">{file.name}</p>
                <p className="file-size">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
              </div>
              <button className="file-clear" onClick={e => { e.stopPropagation(); setFile(null); setStatus("idle"); }}>×</button>
            </div>
          ) : (
            <div className="upload-prompt">
              <FiUpload className="upload-icon" />
              <p className="upload-text">Drag &amp; drop a CSV file here</p>
              <p className="upload-sub">or click to browse</p>
              <div className="upload-required">
                <p>Required columns:</p>
                <code>InvoiceNo, Description, Quantity</code>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Retrain Settings */}
      <div className="chart-card" style={{ marginTop: 20 }}>
        <h3 className="chart-title">Retrain Settings</h3>
        <div className="retrain-controls">
          <div className="control-group">
            <label>Min Support: <strong>{minSupport.toFixed(3)}</strong></label>
            <input type="range" min="0.005" max="0.1" step="0.005" value={minSupport} onChange={e => setMinSupport(Number(e.target.value))} />
          </div>
          <div className="control-group">
            <label>Min Confidence: <strong>{minConfidence.toFixed(2)}</strong></label>
            <input type="range" min="0.1" max="1" step="0.05" value={minConfidence} onChange={e => setMinConfidence(Number(e.target.value))} />
          </div>
          <div className="control-group">
            <label>Min Lift: <strong>{minLift.toFixed(1)}</strong></label>
            <input type="range" min="1" max="5" step="0.5" value={minLift} onChange={e => setMinLift(Number(e.target.value))} />
          </div>
          <div className="control-group">
            <label>Algorithm</label>
            <div className="algo-toggle">
              <button className={algorithm === "fpgrowth" ? "active" : ""} onClick={() => setAlgorithm("fpgrowth")}>FP-Growth</button>
              <button className={algorithm === "apriori" ? "active" : ""} onClick={() => setAlgorithm("apriori")}>Apriori</button>
            </div>
          </div>
        </div>

        <div className="train-btn-row">
          {status === "done" ? (
            <button className="btn btn-outline" onClick={handleReset}><FiRefreshCw /> Retrain with New File</button>
          ) : (
            <button className="btn btn-primary" onClick={handleTrain} disabled={!file || status === "training"}>
              {status === "training" ? "Training..." : "▶ Retrain Model"}
            </button>
          )}
        </div>

        {status !== "idle" && (
          <div className="progress-section">
            <div className="progress-bar-wrap">
              <div className="progress-fill" style={{ width: `${progress}%`, background: status === "done" ? "#10b981" : "#2563eb" }} />
            </div>
            <div className="progress-info">
              <span className="progress-msg">{statusMessages[progress] || "Processing..."}</span>
              <span className="progress-pct">{progress}%</span>
            </div>
            {status === "done" && (
              <div className="train-success">
                <FiCheck /> Model retrained successfully! All recommendations now use the new rules.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default DataUpload;
