import React from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useInventory } from "../hooks/useInventory";

export default function Navbar() {
  const { state, dispatch } = useInventory();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    dispatch({ type: "LOGOUT" });
    navigate("/login");
  };

  const isActive = (path) =>
    location.pathname === path
      ? "bg-white text-violet-600 font-semibold"
      : "text-white hover:bg-violet-500 hover:text-white";

  return (
    <nav className="bg-gradient-to-r from-violet-600 to-indigo-500 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link to="/" className="text-xl font-bold flex items-center gap-2 text-white">
            📦 Inventory
          </Link>
          <div className="hidden sm:flex items-center gap-1">
            <NavLink to="/" label="Dashboard" isActive={isActive} />
            <NavLink to="/products" label="Products" isActive={isActive} />
            <NavLink to="/categories" label="Categories" isActive={isActive} />
            {state.user?.role === "admin" && (
              <NavLink to="/users" label="Users" isActive={isActive} />
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2">
            <img
              src="/profile.jpg"
              alt="Profile"
              className="w-8 h-8 rounded-full object-cover border-2 border-white shadow"
              onError={(e) => { e.target.style.display = "none"; }}
            />
            <span className="text-sm text-violet-100">
              {state.user?.name} <span className="text-yellow-300">({state.user?.role})</span>
            </span>
          </div>
          <button onClick={handleLogout}
            className="bg-white text-violet-600 hover:bg-violet-50 text-sm px-4 py-1.5 rounded-lg transition font-semibold">
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
}

function NavLink({ to, label, isActive }) {
  return (
    <Link to={to} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${isActive(to)}`}>
      {label}
    </Link>
  );
}
