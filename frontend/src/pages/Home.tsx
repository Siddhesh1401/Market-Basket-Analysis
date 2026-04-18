import { NavLink } from "react-router-dom";
import {
  FiArrowRight,
  FiBarChart2,
  FiCheckCircle,
  FiClock,
  FiDatabase,
  FiLayers,
  FiLock,
  FiPlayCircle,
  FiShield,
  FiSliders,
  FiTrendingUp,
  FiUnlock,
} from "react-icons/fi";

type HomeProps = {
  hasDataset: boolean;
  hasInsights: boolean;
  fileName: string;
};

function Home({ hasDataset, hasInsights, fileName }: HomeProps) {
  const workflow = [
    {
      title: "Upload dataset",
      description: "Load a transaction CSV in Workspace.",
      complete: hasDataset,
    },
    {
      title: "Run analysis",
      description: "Generate itemsets and association rules.",
      complete: hasInsights,
    },
    {
      title: "Use intelligence pages",
      description: "Open Simulator, Segmentation, Prediction, and Reports.",
      complete: hasInsights,
    },
  ];

  const features = [
    {
      title: "Workspace",
      description: "Upload data, validate quality, and control mining thresholds.",
      icon: FiDatabase,
      route: "/workspace",
      status: "ready",
      action: "Open Workspace",
    },
    {
      title: "Simulator",
      description: "Build baskets and run goal-based recommendation simulations.",
      icon: FiTrendingUp,
      route: hasDataset ? "/simulator" : "/workspace",
      status: hasDataset ? (hasInsights ? "ready" : "pending") : "locked",
      action: hasDataset ? (hasInsights ? "Open Simulator" : "Run Analysis First") : "Upload Dataset",
    },
    {
      title: "Segmentation",
      description: "Classify customer behavior and review strategic guidance.",
      icon: FiSliders,
      route: hasDataset ? "/segmentation" : "/workspace",
      status: hasDataset ? (hasInsights ? "ready" : "pending") : "locked",
      action: hasDataset ? (hasInsights ? "Open Segmentation" : "Run Analysis First") : "Upload Dataset",
    },
    {
      title: "Prediction",
      description: "Estimate purchase likelihood and likely next products.",
      icon: FiPlayCircle,
      route: hasDataset ? "/prediction" : "/workspace",
      status: hasDataset ? (hasInsights ? "ready" : "pending") : "locked",
      action: hasDataset ? (hasInsights ? "Open Prediction" : "Run Analysis First") : "Upload Dataset",
    },
    {
      title: "Reports",
      description: "Review KPIs, distributions, and rule tables for stakeholders.",
      icon: FiLayers,
      route: hasDataset ? "/reports" : "/workspace",
      status: hasDataset ? (hasInsights ? "ready" : "pending") : "locked",
      action: hasDataset ? (hasInsights ? "Open Reports" : "Run Analysis First") : "Upload Dataset",
    },
  ] as const;

  return (
    <div className="page-shell">
      <section className="hero-card home-hero-card">
        <div className="hero-content">
          <p className="hero-eyebrow">Market Basket Intelligence</p>
          <h1>From raw CSV to production-grade retail intelligence</h1>
          <p>
            Basket Sense provides a structured workflow for professional analytics teams: ingest data,
            validate associations, simulate recommendations, and publish decision-ready insights.
          </p>
          <NavLink to="/workspace" className="primary-cta">
            {hasDataset ? "Continue in Workspace" : "Start in Workspace"} <FiArrowRight />
          </NavLink>
        </div>
        <div className="hero-visual" aria-hidden>
          <div className="hero-ring" />
          <div className="hero-icon-wrap">
            <FiBarChart2 />
          </div>
          <div className="hero-panel panel-a">
            <p className="panel-label">Readiness</p>
            <h4>{hasInsights ? "Ready" : hasDataset ? "In Progress" : "Locked"}</h4>
            <p className="panel-sub">workflow status</p>
          </div>
          <div className="hero-panel panel-c">
            <p className="panel-label">Dataset</p>
            <h4>{hasDataset ? "Loaded" : "Pending"}</h4>
            <p className="panel-sub">{hasDataset ? fileName || "CSV selected" : "Upload required"}</p>
          </div>
          <div className="hero-chip chip-a">
            <FiTrendingUp /> Recommendation AI
          </div>
          <div className="hero-chip chip-b">
            <FiClock /> Live by dataset
          </div>
        </div>
      </section>

      <section className="home-status-strip">
        <article className="home-status-card">
          <p>Dataset status</p>
          <h3>{hasDataset ? "Uploaded" : "Not uploaded"}</h3>
          <span className={`home-status-badge ${hasDataset ? "ready" : "locked"}`}>
            {hasDataset ? <FiUnlock /> : <FiLock />} {hasDataset ? "Unlocked" : "Locked"}
          </span>
        </article>
        <article className="home-status-card">
          <p>Analysis status</p>
          <h3>{hasInsights ? "Complete" : "Pending"}</h3>
          <span className={`home-status-badge ${hasInsights ? "ready" : "pending"}`}>
            <FiCheckCircle /> {hasInsights ? "Insights ready" : "Run analysis"}
          </span>
        </article>
        <article className="home-status-card">
          <p>Advanced pages</p>
          <h3>{hasDataset ? "Accessible" : "Locked"}</h3>
          <span className={`home-status-badge ${hasDataset ? "pending" : "locked"}`}>
            {hasDataset ? <FiUnlock /> : <FiLock />} {hasDataset ? "Unlocked by upload" : "Needs dataset"}
          </span>
        </article>
      </section>

      <section className="surface-card home-workflow-card">
        <h2>Professional Workflow</h2>
        <p className="home-workflow-subtitle">Follow this order to ensure reliable, explainable outputs.</p>
        <div className="home-workflow-grid">
          {workflow.map((step, index) => (
            <article key={step.title} className={`home-workflow-step ${step.complete ? "complete" : "pending"}`}>
              <span className="home-workflow-index">{index + 1}</span>
              <div>
                <h3>{step.title}</h3>
                <p>{step.description}</p>
              </div>
              <span className="home-workflow-state">{step.complete ? "Complete" : "Pending"}</span>
            </article>
          ))}
        </div>
      </section>

      <section className="home-module-grid">
        {features.map((feature) => {
          const Icon = feature.icon;
          return (
            <article key={feature.title} className={`feature-tile home-module-card ${feature.status}`}>
              <div className="home-module-head">
                <div className="feature-icon">
                  <Icon />
                </div>
                <span className={`home-module-status ${feature.status}`}>
                  {feature.status === "ready" ? "Ready" : feature.status === "pending" ? "Needs analysis" : "Locked"}
                </span>
              </div>
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
              <NavLink to={feature.route} className="ghost-btn">
                {feature.action}
              </NavLink>
            </article>
          );
        })}
      </section>

      <section className="split-section">
        <article className="surface-card">
          <h2>Industry-Ready Standards</h2>
          <ul className="check-list">
            <li>
              <FiShield />
              <span>Every advanced output is tied to your active uploaded dataset.</span>
            </li>
            <li>
              <FiCheckCircle />
              <span>Clear workflow stages prevent accidental use without required data.</span>
            </li>
            <li>
              <FiTrendingUp />
              <span>Simulator, Segmentation, Prediction, and Reports use a unified analysis context.</span>
            </li>
          </ul>
        </article>

        <article className="surface-card">
          <h2>Recommended Next Step</h2>
          <p>
            {hasInsights
              ? "Your dataset is analysis-ready. Proceed to Simulator, Segmentation, Prediction, or Reports."
              : hasDataset
                ? "Dataset uploaded. Open Workspace and run analysis to unlock insight quality outputs."
                : "Open Workspace and upload a dataset to begin the guided flow."}
          </p>
          <NavLink to="/workspace" className="primary-cta">
            Open Workspace <FiArrowRight />
          </NavLink>
        </article>
      </section>
    </div>
  );
}

export default Home;
