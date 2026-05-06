import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import API from "../api";
import { useInventory } from "../hooks/useInventory";

export default function Register() {
  const { dispatch } = useInventory();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (form.password !== form.confirmPassword) {
      return setError("Passwords do not match");
    }
    if (form.password.length < 6) {
      return setError("Password must be at least 6 characters");
    }

    setLoading(true);
    try {
      const res = await API.post("/auth/register", {
        name: form.name,
        email: form.email,
        password: form.password,
      });
      // Auto-login after register — new users are staff → go to shop
      dispatch({ type: "LOGIN", payload: res.data });
      navigate("/shop");
    } catch (err) {
      setError(
        err.response?.data?.message ||
        err.response?.data?.errors?.[0]?.msg ||
        "Registration failed"
      );
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
          Already have an account?{" "}
          <Link to="/login" className="text-violet-600 font-semibold hover:underline">
            Sign In
          </Link>
        </span>
      </nav>

      {/* Card */}
      <div className="flex-1 flex items-center justify-center px-4 py-10">
        <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md">

          {/* Header */}
          <div className="text-center mb-8">
            <div className="text-5xl mb-3">🚀</div>
            <h1 className="text-3xl font-bold text-gray-800">Create Account</h1>
            <p className="text-gray-500 mt-1 text-sm">Join us and start managing your inventory</p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-300 text-red-700 px-4 py-3 rounded-lg text-sm mb-5">
              ❌ {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                autoFocus
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-violet-500 transition"
                placeholder="e.g. John Doe"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email Address <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-violet-500 transition"
                placeholder="your@email.com"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showPass ? "text" : "password"}
                  required
                  minLength={6}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full border border-gray-300 rounded-xl px-4 py-2.5 pr-12 focus:outline-none focus:ring-2 focus:ring-violet-500 transition"
                  placeholder="Min 6 characters"
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

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Confirm Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showConfirm ? "text" : "password"}
                  required
                  value={form.confirmPassword}
                  onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                  className="w-full border border-gray-300 rounded-xl px-4 py-2.5 pr-12 focus:outline-none focus:ring-2 focus:ring-violet-500 transition"
                  placeholder="Repeat your password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-lg"
                >
                  {showConfirm ? "🙈" : "👁️"}
                </button>
              </div>
            </div>

            {/* Role info */}
            <div className="bg-amber-50 border border-amber-200 text-amber-700 px-4 py-3 rounded-xl text-sm">
              ℹ️ New accounts start as <strong>Staff</strong>. An admin can upgrade your role later.
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-violet-600 text-white py-3 rounded-xl font-semibold hover:bg-violet-700 transition disabled:opacity-50 text-base shadow"
            >
              {loading ? "Creating account..." : "Create Account →"}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">
              Already have an account?{" "}
              <Link to="/login" className="text-violet-600 font-semibold hover:underline">
                Sign In
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
