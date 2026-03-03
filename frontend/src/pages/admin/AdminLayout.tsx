import { useLocation, NavLink, Outlet } from "react-router-dom";
import { MdDashboard, MdOutlineRule, MdPeople, MdModelTraining, MdCompare, MdUpload } from "react-icons/md";

const navItems = [
  { to: "/admin", label: "Dashboard", icon: <MdDashboard />, end: true },
  { to: "/admin/rules", label: "Association Rules", icon: <MdOutlineRule /> },
  { to: "/admin/segmentation", label: "Segmentation", icon: <MdPeople /> },
  { to: "/admin/prediction", label: "Prediction", icon: <MdModelTraining /> },
  { to: "/admin/algorithm", label: "Algorithm Compare", icon: <MdCompare /> },
  { to: "/admin/upload", label: "Data Upload", icon: <MdUpload /> },
];

const AdminLayout = () => {
  return (
    <div className="admin-layout">
      {/* Sidebar */}
      <aside className="admin-sidebar">
        <div className="sidebar-title">Analytics</div>
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) => `sidebar-link ${isActive ? "active" : ""}`}
          >
            <span className="sidebar-icon">{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </aside>

      {/* Main content */}
      <div className="admin-main">
        <Outlet />
      </div>
    </div>
  );
};

export default AdminLayout;
