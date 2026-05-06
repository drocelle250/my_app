import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useInventory } from "../hooks/useInventory";

export default function Navbar() {
  const { state, dispatch } = useInventory();
  const navigate  = useNavigate();
  const location  = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    dispatch({ type: "LOGOUT" });
    navigate("/");
  };

  const isAdmin   = state.user?.role === "admin";
  const isManager = state.user?.role === "manager";
  const canManage = isAdmin || isManager;

  const isActive = (path) =>
    location.pathname === path
      ? "bg-white/20 text-white font-semibold"
      : "text-white/80 hover:bg-white/10 hover:text-white";

  const navLinks = [
    { to: "/dashboard", label: "Dashboard",    show: true },
    { to: "/shop",      label: "🛍️ Shop",      show: true },
    { to: "/products",  label: "Products",     show: true },
    { to: "/categories",label: "Categories",   show: true },
    { to: "/stock",     label: "Stock",        show: canManage },
    { to: "/analytics", label: "📊 Analytics", show: canManage },
    { to: "/orders",    label: "🧾 Orders",    show: canManage },
    { to: "/ai-predictions", label: "🤖 AI",  show: canManage },
    { to: "/users",     label: "Users",        show: isAdmin },
  ].filter((l) => l.show);

  return (
    <nav className="bg-gradient-to-r from-violet-600 to-indigo-500 text-white shadow-lg relative z-40">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">

        {/* Logo */}
        <Link to="/dashboard" className="text-xl font-bold flex items-center gap-2 text-white flex-shrink-0">
          <img src="/logo-icon.svg" alt="SmartStock" className="w-8 h-8" />
          <span className="hidden sm:inline font-extrabold tracking-tight">
            Smart<span className="text-blue-300">Stock</span>
            <span className="ml-1 text-xs bg-green-500 text-white px-1.5 py-0.5 rounded font-bold align-middle">U.D</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden lg:flex items-center gap-0.5 flex-1 mx-4 overflow-x-auto scrollbar-hide">
          {navLinks.map((l) => (
            <Link key={l.to} to={l.to}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition whitespace-nowrap ${isActive(l.to)}`}>
              {l.label}
            </Link>
          ))}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2">
          {/* User info — desktop */}
          <div className="hidden sm:flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-sm font-bold border-2 border-white/40">
              {state.user?.name?.[0]?.toUpperCase() || "?"}
            </div>
            <div className="hidden md:block">
              <p className="text-xs text-white/90 font-medium leading-none">{state.user?.name}</p>
              <p className="text-xs text-yellow-300 leading-none mt-0.5 capitalize">{state.user?.role}</p>
            </div>
          </div>

          {/* Logout — desktop */}
          <button onClick={handleLogout}
            className="hidden sm:block bg-white/20 hover:bg-white/30 text-white text-sm px-3 py-1.5 rounded-lg transition font-semibold border border-white/30">
            Logout
          </button>

          {/* Hamburger — mobile */}
          <button
            onClick={() => setMobileOpen((o) => !o)}
            className="lg:hidden w-9 h-9 flex flex-col items-center justify-center gap-1.5 rounded-lg hover:bg-white/10 transition"
            aria-label="Toggle menu"
          >
            <span className={`block w-5 h-0.5 bg-white transition-all duration-300 ${mobileOpen ? "rotate-45 translate-y-2" : ""}`} />
            <span className={`block w-5 h-0.5 bg-white transition-all duration-300 ${mobileOpen ? "opacity-0" : ""}`} />
            <span className={`block w-5 h-0.5 bg-white transition-all duration-300 ${mobileOpen ? "-rotate-45 -translate-y-2" : ""}`} />
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="lg:hidden border-t border-white/20 bg-gradient-to-b from-violet-700 to-indigo-600 animate-slide-up">
          <div className="max-w-7xl mx-auto px-4 py-3 space-y-1">
            {navLinks.map((l) => (
              <Link key={l.to} to={l.to}
                onClick={() => setMobileOpen(false)}
                className={`block px-4 py-2.5 rounded-xl text-sm font-medium transition ${isActive(l.to)}`}>
                {l.label}
              </Link>
            ))}
            {/* User info + logout */}
            <div className="border-t border-white/20 pt-3 mt-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-sm font-bold">
                  {state.user?.name?.[0]?.toUpperCase() || "?"}
                </div>
                <div>
                  <p className="text-sm text-white font-medium">{state.user?.name}</p>
                  <p className="text-xs text-yellow-300 capitalize">{state.user?.role}</p>
                </div>
              </div>
              <button onClick={() => { handleLogout(); setMobileOpen(false); }}
                className="bg-white/20 hover:bg-white/30 text-white text-sm px-4 py-2 rounded-xl font-semibold border border-white/30 transition">
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
