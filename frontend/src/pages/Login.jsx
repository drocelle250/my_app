import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api";
import { useInventory } from "../hooks/useInventory";

export default function Login() {
  const { dispatch } = useInventory();
  const navigate = useNavigate();
  const [tab, setTab] = useState("login");

  // Login form
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [showLoginPass, setShowLoginPass] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  // Register form
  const [regForm, setRegForm] = useState({ name: "", email: "", password: "", confirmPassword: "" });
  const [showRegPass, setShowRegPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [regError, setRegError] = useState("");
  const [regSuccess, setRegSuccess] = useState("");
  const [regLoading, setRegLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError("");
    setLoginLoading(true);
    try {
      const res = await API.post("/auth/login", loginForm);
      dispatch({ type: "LOGIN", payload: res.data });
      navigate("/");
    } catch (err) {
      setLoginError(err.response?.data?.message || err.message || "Login failed");
    } finally {
      setLoginLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setRegError("");
    setRegSuccess("");

    if (regForm.password !== regForm.confirmPassword) {
      return setRegError("Passwords do not match");
    }
    if (regForm.password.length < 6) {
      return setRegError("Password must be at least 6 characters");
    }

    setRegLoading(true);
    try {
      await API.post("/auth/register", {
        name: regForm.name,
        email: regForm.email,
        password: regForm.password,
      });
      setRegSuccess("Account created! Please sign in.");
      setRegForm({ name: "", email: "", password: "", confirmPassword: "" });
      // Switch to login tab after 1.5s
      setTimeout(() => {
        setTab("login");
        setLoginForm({ email: regForm.email, password: "" });
        setRegSuccess("");
      }, 1500);
    } catch (err) {
      setRegError(
        err.response?.data?.message ||
        err.response?.data?.errors?.[0]?.msg ||
        "Registration failed"
      );
    } finally {
      setRegLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 to-indigo-100 flex items-center justify-center px-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md">

        {/* Header */}
        <div className="text-center mb-6">
          <div className="text-5xl mb-3">📦</div>
          <h1 className="text-3xl font-bold text-gray-800">Inventory System</h1>
          <p className="text-gray-500 mt-1 text-sm">Manage your inventory with ease</p>
        </div>

        {/* Tabs */}
        <div className="flex rounded-lg overflow-hidden border border-gray-200 mb-6">
          <button
            onClick={() => { setTab("login"); setLoginError(""); }}
            className={`flex-1 py-2 text-sm font-medium transition ${
              tab === "login"
                ? "bg-violet-600 text-white"
                : "bg-white text-gray-600 hover:bg-gray-50"
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => { setTab("register"); setRegError(""); setRegSuccess(""); }}
            className={`flex-1 py-2 text-sm font-medium transition ${
              tab === "register"
                ? "bg-violet-600 text-white"
                : "bg-white text-gray-600 hover:bg-gray-50"
            }`}
          >
            Register
          </button>
        </div>

        {/* ── LOGIN FORM ── */}
        {tab === "login" && (
          <form onSubmit={handleLogin} className="space-y-4">
            {loginError && (
              <div className="bg-red-50 border border-red-300 text-red-700 px-4 py-3 rounded-lg text-sm">
                {loginError}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email" required
                value={loginForm.email}
                onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-violet-500"
                placeholder="your@email.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <div className="relative">
                <input
                  type={showLoginPass ? "text" : "password"} required
                  value={loginForm.password}
                  onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 pr-12 focus:outline-none focus:ring-2 focus:ring-violet-500"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowLoginPass(!showLoginPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-lg"
                >
                  {showLoginPass ? "🙈" : "👁️"}
                </button>
              </div>
            </div>

            <button
              type="submit" disabled={loginLoading}
              className="w-full bg-violet-600 text-white py-2.5 rounded-lg font-semibold hover:bg-violet-700 transition disabled:opacity-50"
            >
              {loginLoading ? "Signing in..." : "Sign In"}
            </button>

            <p className="text-center text-sm text-gray-500">
              No account?{" "}
              <button
                type="button"
                onClick={() => setTab("register")}
                className="text-violet-600 font-medium hover:underline"
              >
                Create one
              </button>
            </p>
          </form>
        )}

        {/* ── REGISTER FORM ── */}
        {tab === "register" && (
          <form onSubmit={handleRegister} className="space-y-4">
            {regError && (
              <div className="bg-red-50 border border-red-300 text-red-700 px-4 py-3 rounded-lg text-sm">
                {regError}
              </div>
            )}
            {regSuccess && (
              <div className="bg-green-50 border border-green-300 text-green-700 px-4 py-3 rounded-lg text-sm">
                ✅ {regSuccess}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text" required
                value={regForm.name}
                onChange={(e) => setRegForm({ ...regForm, name: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-violet-500"
                placeholder="e.g. John Doe"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email" required
                value={regForm.email}
                onChange={(e) => setRegForm({ ...regForm, email: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-violet-500"
                placeholder="your@email.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showRegPass ? "text" : "password"} required minLength={6}
                  value={regForm.password}
                  onChange={(e) => setRegForm({ ...regForm, password: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 pr-12 focus:outline-none focus:ring-2 focus:ring-violet-500"
                  placeholder="Min 6 characters"
                />
                <button
                  type="button"
                  onClick={() => setShowRegPass(!showRegPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-lg"
                >
                  {showRegPass ? "🙈" : "👁️"}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Confirm Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showConfirmPass ? "text" : "password"} required
                  value={regForm.confirmPassword}
                  onChange={(e) => setRegForm({ ...regForm, confirmPassword: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 pr-12 focus:outline-none focus:ring-2 focus:ring-violet-500"
                  placeholder="Repeat password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPass(!showConfirmPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-lg"
                >
                  {showConfirmPass ? "🙈" : "👁️"}
                </button>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 text-amber-700 px-4 py-3 rounded-lg text-sm">
              ℹ️ New accounts start as <strong>Staff</strong>. An admin can upgrade your role.
            </div>

            <button
              type="submit" disabled={regLoading}
              className="w-full bg-violet-600 text-white py-2.5 rounded-lg font-semibold hover:bg-violet-700 transition disabled:opacity-50"
            >
              {regLoading ? "Creating account..." : "Create Account"}
            </button>

            <p className="text-center text-sm text-gray-500">
              Already have an account?{" "}
              <button
                type="button"
                onClick={() => setTab("login")}
                className="text-violet-600 font-medium hover:underline"
              >
                Sign in
              </button>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
