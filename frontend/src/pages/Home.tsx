import { NavLink } from "react-router-dom";
import {
  FiArrowRight,
  FiBarChart2,
  FiCheckCircle,
  FiClock,
  FiDatabase,
  FiLayers,
  FiSliders,
  FiTrendingUp,
} from "react-icons/fi";

const features = [
  {
    title: "Upload and Analyze",
    description: "Bring your retail CSV and generate associations in seconds.",
    icon: FiDatabase,
  },
  {
    title: "Smart Insights",
    description: "Filter rules using support, confidence, and lift thresholds.",
    icon: FiSliders,
  },
  {
    title: "Recommendations",
    description: "Discover products customers are likely to buy together.",
    icon: FiTrendingUp,
  },
  {
    title: "Report Ready",
    description: "Generate clean visual reports for business teams.",
    icon: FiLayers,
  },
];

const timeline = [
  "Upload transaction dataset",
  "Run market basket analysis",
  "Review association strengths",
  "Share reports with your company",
];

const checklist = [
  "Upload your CSV and run analysis",
  "Inspect top product combinations",
  "Check trend and country charts",
  "Review top lift-based rules",
  "Download insights as CSV",
];

function Home() {
  return (
    <div className="page-shell">
      <section className="hero-card">
        <div className="hero-content">
          <p className="hero-eyebrow">Market Basket Intelligence</p>
          <h1>Modern Analytics for Product Recommendation</h1>
          <p>
            Basket Sense helps teams discover buying behavior, evaluate product
            relationships, and turn transactions into clear recommendations.
          </p>
          <NavLink to="/dashboard" className="primary-cta">
            Go to Dashboard <FiArrowRight />
          </NavLink>
        </div>
        <div className="hero-visual" aria-hidden>
          <div className="hero-ring" />
          <div className="hero-icon-wrap">
            <FiBarChart2 />
          </div>
          <div className="hero-panel panel-a">
            <p className="panel-label">Top Basket Lift</p>
            <h4>2.84x</h4>
            <div className="spark-bars">
              <span style={{ height: "28%" }} />
              <span style={{ height: "52%" }} />
              <span style={{ height: "44%" }} />
              <span style={{ height: "68%" }} />
              <span style={{ height: "84%" }} />
            </div>
          </div>
          <div className="hero-panel panel-c">
            <p className="panel-label">Rule Coverage</p>
            <h4>87%</h4>
            <p className="panel-sub">high-confidence pairs</p>
          </div>
          <div className="hero-chip chip-a">
            <FiTrendingUp /> Growth
          </div>
          <div className="hero-chip chip-b">
            <FiClock /> Live Insights
          </div>
        </div>
      </section>

      <section className="feature-grid">
        {features.map((feature) => {
          const Icon = feature.icon;
          return (
            <article key={feature.title} className="feature-tile">
              <div className="feature-icon">
                <Icon />
              </div>
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
            </article>
          );
        })}
      </section>

      <section className="split-section">
        <article className="surface-card">
          <h2>User Journey</h2>
          <div className="timeline-wrap">
            {timeline.map((step, index) => (
              <div key={step} className="timeline-item">
                <span className="timeline-index">{index + 1}</span>
                <div>
                  <h4>Step {index + 1}</h4>
                  <p>{step}</p>
                </div>
              </div>
            ))}
          </div>
        </article>

        <article className="surface-card">
          <h2>User Checklist</h2>
          <ul className="check-list">
            {checklist.map((item) => (
              <li key={item}>
                <FiCheckCircle />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </article>
      </section>
    </div>
  );
}

export default Home;
