import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import API from "../api";
import { useInventory } from "../hooks/useInventory";

export default function Login() {
  const { dispatch } = useInventory();
  const navigate = useNavigate();

  const [form, setForm] = useState({ email: "", password: "" });
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await API.post("/auth/login", form);
      dispatch({ type: "LOGIN", payload: res.data });
      // Staff → shop, admin/manager → dashboard
      const role = res.data.user?.role;
      navigate(role === "admin" || role === "manager" ? "/dashboard" : "/shop");
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 to-indigo-100 flex flex-col">

      {/* Top nav */}
      <nav className="px-6 py-4 flex items-center justify-between">
        <Link to="/" className="text-violet-700 font-bold text-lg flex items-center gap-2">
          <img src="/logo-icon.svg" alt="SmartStock" className="w-7 h-7" />
          Smart<span className="text-blue-600">Stock</span>
          <span className="text-xs bg-green-500 text-white px-1.5 py-0.5 rounded font-bold">U.D</span>
        </Link>
        <span className="text-sm text-gray-500">
          No account?{" "}
          <Link to="/register" className="text-violet-600 font-semibold hover:underline">
            Register
          </Link>
        </span>
      </nav>

      {/* Card */}
      <div className="flex-1 flex items-center justify-center px-4 py-6 sm:py-10">
        <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-xl w-full max-w-md">
          <div className="text-center mb-6 sm:mb-8">
            <div className="text-4xl sm:text-5xl mb-3">👋</div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Welcome back</h1>
            <p className="text-gray-500 mt-1 text-sm">Sign in to your account to continue</p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-300 text-red-700 px-4 py-3 rounded-lg text-sm mb-5">
              ❌ {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <input
                type="email"
                required
                autoFocus
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-violet-500 transition"
                placeholder="your@email.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPass ? "text" : "password"}
                  required
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full border border-gray-300 rounded-xl px-4 py-2.5 pr-12 focus:outline-none focus:ring-2 focus:ring-violet-500 transition"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-lg"
                >
                  {showPass ? "🙈" : "👁️"}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-violet-600 text-white py-3 rounded-xl font-semibold hover:bg-violet-700 transition disabled:opacity-50 text-base shadow"
            >
              {loading ? "Signing in..." : "Sign In →"}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">
              Don't have an account?{" "}
              <Link to="/register" className="text-violet-600 font-semibold hover:underline">
                Create one for free
              </Link>
            </p>
          </div>

          <div className="mt-4 text-center">
            <Link to="/" className="text-xs text-gray-400 hover:text-gray-600 hover:underline">
              ← Back to store
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
