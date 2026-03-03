import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell
} from "recharts";

const topProducts = [
  { name: "Whole Milk", sales: 2502 },
  { name: "Other Veg", sales: 1898 },
  { name: "Rolls/Buns", sales: 1716 },
  { name: "Soda", sales: 1514 },
  { name: "Yogurt", sales: 1372 },
  { name: "Root Veg", sales: 1211 },
  { name: "Tropical Fruit", sales: 1032 },
  { name: "Bottled Water", sales: 933 },
  { name: "Sausage", sales: 924 },
  { name: "Citrus Fruit", sales: 812 },
];

const monthlyData = [
  { month: "Jan", transactions: 1800 },
  { month: "Feb", transactions: 2100 },
  { month: "Mar", transactions: 1900 },
  { month: "Apr", transactions: 2400 },
  { month: "May", transactions: 2200 },
  { month: "Jun", transactions: 2700 },
  { month: "Jul", transactions: 2500 },
  { month: "Aug", transactions: 2900 },
  { month: "Sep", transactions: 3100 },
  { month: "Oct", transactions: 3400 },
  { month: "Nov", transactions: 3800 },
  { month: "Dec", transactions: 4200 },
];

const countryData = [
  { name: "United Kingdom", value: 495478, color: "#2563eb" },
  { name: "Germany", value: 9042, color: "#7c3aed" },
  { name: "France", value: 8408, color: "#f59e0b" },
  { name: "EIRE", value: 8196, color: "#10b981" },
  { name: "Others", value: 20785, color: "#e5e7eb" },
];

const topRules = [
  { antecedent: "Bread, Butter", consequent: "Milk", support: "0.050", confidence: "0.72", lift: "2.40" },
  { antecedent: "Eggs", consequent: "Bacon", support: "0.030", confidence: "0.65", lift: "3.10" },
  { antecedent: "Cheese", consequent: "Wine", support: "0.020", confidence: "0.58", lift: "2.90" },
  { antecedent: "Yogurt", consequent: "Whole Milk", support: "0.056", confidence: "0.40", lift: "1.57" },
  { antecedent: "Rolls/Buns", consequent: "Whole Milk", support: "0.057", confidence: "0.31", lift: "1.20" },
];

const StatCard = ({ label, value, sub, icon }: { label: string; value: string; sub: string; icon: string }) => (
  <div className="stat-card">
    <div style={{ fontSize: "1.8rem" }}>{icon}</div>
    <div className="stat-card-label">{label}</div>
    <div className="stat-card-value">{value}</div>
    <div className="stat-card-sub">{sub}</div>
  </div>
);

const Dashboard = () => {
  return (
    <div>
      <h1 className="admin-page-title">Dashboard</h1>
      <p className="admin-page-subtitle">Overview of dataset, model, and key statistics</p>

      {/* Stat Cards */}
      <div className="stat-cards-grid">
        <StatCard icon="🧾" label="Total Transactions" value="541,909" sub="Dec 2010 – Dec 2011" />
        <StatCard icon="📦" label="Unique Products" value="4,070" sub="Across all categories" />
        <StatCard icon="🔗" label="Rules Generated" value="847" sub="min support: 0.01" />
        <StatCard icon="🌍" label="Countries" value="38" sub="UK is primary market" />
      </div>

      {/* Charts Row 1 */}
      <div className="charts-grid">
        <div className="chart-card">
          <div className="chart-title">Top 10 Most Purchased Products</div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={topProducts} layout="vertical" margin={{ left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={100} />
              <Tooltip formatter={(v) => [`${v} transactions`, "Sales"]} />
              <Bar dataKey="sales" fill="#2563eb" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <div className="chart-title">Monthly Transactions (2011)</div>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v) => [`${v}`, "Transactions"]} />
              <Line type="monotone" dataKey="transactions" stroke="#7c3aed" strokeWidth={2.5} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="charts-grid">
        <div className="chart-card">
          <div className="chart-title">Orders by Country</div>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={countryData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`} labelLine={false} fontSize={11}>
                {countryData.map((entry, index) => (
                  <Cell key={index} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(v) => [(v as number).toLocaleString(), "Orders"]} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <div className="chart-title">Top 5 Association Rules (by Lift)</div>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
            <thead>
              <tr style={{ borderBottom: "2px solid #e5e7eb" }}>
                <th style={{ textAlign: "left", padding: "8px 10px", color: "#6b7280", fontWeight: 600, fontSize: "0.78rem", textTransform: "uppercase" }}>Antecedents → Consequents</th>
                <th style={{ textAlign: "center", padding: "8px 10px", color: "#6b7280", fontWeight: 600, fontSize: "0.78rem" }}>Conf.</th>
                <th style={{ textAlign: "center", padding: "8px 10px", color: "#6b7280", fontWeight: 600, fontSize: "0.78rem" }}>Lift</th>
              </tr>
            </thead>
            <tbody>
              {topRules.map((rule, i) => (
                <tr key={i} style={{ borderBottom: "1px solid #f3f4f6" }}>
                  <td style={{ padding: "10px 10px", fontWeight: 500 }}>{rule.antecedent} → {rule.consequent}</td>
                  <td style={{ textAlign: "center", padding: "10px", color: "#2563eb", fontWeight: 600 }}>{rule.confidence}</td>
                  <td style={{ textAlign: "center", padding: "10px" }}>
                    <span style={{ background: "#eff6ff", color: "#1d4ed8", padding: "3px 10px", borderRadius: "50px", fontWeight: 700, fontSize: "0.82rem" }}>{rule.lift}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
