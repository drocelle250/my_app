import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import API from "../api";
import { useInventory } from "../hooks/useInventory";

// ─── Constants ────────────────────────────────────────────────────────────────
const URGENCY = {
  critical: {
    bg:     "bg-red-50",
    border: "border-red-300",
    badge:  "bg-red-600 text-white",
    icon:   "🚨",
    label:  "CRITICAL",
    bar:    "bg-red-500",
    text:   "text-red-700",
  },
  high: {
    bg:     "bg-orange-50",
    border: "border-orange-300",
    badge:  "bg-orange-500 text-white",
    icon:   "⚠️",
    label:  "HIGH",
    bar:    "bg-orange-400",
    text:   "text-orange-700",
  },
  medium: {
    bg:     "bg-yellow-50",
    border: "border-yellow-200",
    badge:  "bg-yellow-400 text-yellow-900",
    icon:   "📋",
    label:  "MEDIUM",
    bar:    "bg-yellow-400",
    text:   "text-yellow-700",
  },
  low: {
    bg:     "bg-green-50",
    border: "border-green-200",
    badge:  "bg-green-500 text-white",
    icon:   "✅",
    label:  "LOW",
    bar:    "bg-green-400",
    text:   "text-green-700",
  },
};

const TREND = {
  accelerating: { icon: "📈", label: "Accelerating", color: "text-red-600 bg-red-50" },
  stable:       { icon: "➡️", label: "Stable",       color: "text-blue-600 bg-blue-50" },
  decelerating: { icon: "📉", label: "Slowing",      color: "text-gray-600 bg-gray-100" },
  unknown:      { icon: "❓", label: "No data",      color: "text-gray-400 bg-gray-50" },
};

const fmtMoney = (n) =>
  "$" + Number(n ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// ─── Confidence Bar ───────────────────────────────────────────────────────────
function ConfidenceBar({ value }) {
  const color =
    value >= 70 ? "bg-green-500"
    : value >= 40 ? "bg-yellow-400"
    : "bg-red-400";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 bg-gray-100 rounded-full h-1.5 overflow-hidden">
        <div
          className={`${color} h-1.5 rounded-full transition-all duration-700`}
          style={{ width: `${value}%` }}
        />
      </div>
      <span className="text-xs text-gray-500 w-8 text-right">{value}%</span>
    </div>
  );
}

// ─── Summary Card ─────────────────────────────────────────────────────────────
function SummaryCard({ icon, label, value, color }) {
  const colors = {
    red:    "from-red-500 to-red-700",
    orange: "from-orange-400 to-orange-600",
    yellow: "from-yellow-400 to-yellow-600",
    green:  "from-green-500 to-green-700",
    violet: "from-violet-500 to-violet-700",
  };
  return (
    <div className={`bg-gradient-to-br ${colors[color]} text-white rounded-2xl p-5 shadow-lg`}>
      <div className="text-3xl mb-2">{icon}</div>
      <p className="text-sm opacity-80">{label}</p>
      <p className="text-3xl font-extrabold mt-1">{value}</p>
    </div>
  );
}

// ─── Prediction Card ──────────────────────────────────────────────────────────
function PredictionCard({ p }) {
  const [expanded, setExpanded] = useState(false);
  const u = URGENCY[p.urgency] || URGENCY.low;
  const t = TREND[p.trend]     || TREND.unknown;

  return (
    <div className={`rounded-2xl border-2 ${u.border} ${u.bg} overflow-hidden shadow-sm hover:shadow-md transition-shadow`}>

      {/* Header */}
      <div
        className="px-5 py-4 flex items-start justify-between cursor-pointer"
        onClick={() => setExpanded((e) => !e)}
      >
        <div className="flex items-start gap-3 flex-1 min-w-0">
          {/* Urgency icon */}
          <span className="text-2xl mt-0.5 flex-shrink-0">{u.icon}</span>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-bold text-gray-800 text-base">{p.productName}</h3>
              <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${u.badge}`}>
                {u.label}
              </span>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex items-center gap-1 ${t.color}`}>
                {t.icon} {t.label}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              {p.category} · SKU: {p.sku}
            </p>

            {/* AI message */}
            <p className={`text-sm font-medium mt-2 ${u.text}`}>
              {p.prediction}
            </p>
          </div>
        </div>

        {/* Right: key numbers */}
        <div className="flex-shrink-0 text-right ml-4">
          <p className="text-2xl font-extrabold text-gray-800">{p.currentStock}</p>
          <p className="text-xs text-gray-400">in stock</p>
          {p.daysUntilStockout !== null && (
            <p className={`text-xs font-bold mt-1 ${u.text}`}>
              {p.daysUntilStockout}d left
            </p>
          )}
          <span className={`text-xs mt-1 inline-block ${expanded ? "rotate-180" : ""} transition-transform text-gray-400`}>
            ▼
          </span>
        </div>
      </div>

      {/* Expanded details */}
      {expanded && (
        <div className="border-t border-gray-200 bg-white px-5 py-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
            <Metric label="Avg Daily Sales" value={p.avgDailySales ?? "—"} unit="units/day" />
            <Metric label="7-Day MA" value={p.ma7 ?? "—"} unit="units/day" />
            <Metric label="30-Day MA" value={p.ma30 ?? "—"} unit="units/day" />
            <Metric label="Predicted Daily" value={p.predictedDailySales ?? "—"} unit="units/day" highlight />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-4">
            <Metric label="Days Until Stockout" value={p.daysUntilStockout ?? "∞"} unit="days" />
            <Metric label="Recommended Restock" value={p.recommendedRestock > 0 ? `+${p.recommendedRestock}` : "—"} unit="units" highlight />
            {p.peakDay && <Metric label="Peak Sales Day" value={p.peakDay} unit="" />}
          </div>

          {/* Confidence */}
          <div className="mb-3">
            <p className="text-xs text-gray-500 mb-1">
              AI Confidence Score
              <span className="ml-1 text-gray-400">(based on data volume & consistency)</span>
            </p>
            <ConfidenceBar value={p.confidence} />
          </div>

          {/* Restock button hint */}
          {p.recommendedRestock > 0 && (
            <div className="mt-3 flex items-center gap-3">
              <Link
                to="/stock"
                className="bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold px-4 py-2 rounded-lg transition shadow"
              >
                📦 Go to Stock Management
              </Link>
              <span className="text-xs text-gray-400">
                Restock {p.recommendedRestock} units of "{p.productName}"
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Metric({ label, value, unit, highlight }) {
  return (
    <div className={`rounded-xl p-3 ${highlight ? "bg-violet-50 border border-violet-200" : "bg-gray-50"}`}>
      <p className="text-xs text-gray-400 mb-0.5">{label}</p>
      <p className={`text-lg font-extrabold ${highlight ? "text-violet-700" : "text-gray-800"}`}>
        {value}
      </p>
      {unit && <p className="text-xs text-gray-400">{unit}</p>}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function AIPredictions() {
  const { state } = useInventory();
  const canView = state.user?.role === "admin" || state.user?.role === "manager";

  const [days, setDays]           = useState(30);
  const [data, setData]           = useState(null);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState("");
  const [filterUrgency, setFilterUrgency] = useState("all");
  const [search, setSearch]       = useState("");
  const [lastRefresh, setLastRefresh] = useState(null);

  const fetchPredictions = useCallback(() => {
    if (!canView) return;
    setLoading(true);
    setError("");
    API.get(`/ai/predict-restock?days=${days}`)
      .then((res) => {
        setData(res.data);
        setLastRefresh(new Date());
      })
      .catch((err) => setError(err.response?.data?.message || "Failed to load predictions"))
      .finally(() => setLoading(false));
  }, [days, canView]);

  useEffect(() => { fetchPredictions(); }, [fetchPredictions]);

  if (!canView) return (
    <div className="flex flex-col items-center justify-center h-64 gap-3">
      <span className="text-5xl">🔒</span>
      <p className="text-gray-600 font-medium">Admin / Manager access only</p>
    </div>
  );

  const filtered = (data?.predictions || []).filter((p) => {
    const matchU = filterUrgency === "all" || p.urgency === filterUrgency;
    const matchS = search
      ? p.productName.toLowerCase().includes(search.toLowerCase()) ||
        p.sku.toLowerCase().includes(search.toLowerCase()) ||
        p.category.toLowerCase().includes(search.toLowerCase())
      : true;
    return matchU && matchS;
  });

  const { summary } = data || {};

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            🤖 AI Restock Predictions
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Smart predictions using moving averages, trend detection & sales patterns
            {lastRefresh && (
              <span className="ml-2 text-gray-400">
                · Updated {lastRefresh.toLocaleTimeString()}
              </span>
            )}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Period selector */}
          <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-xl p-1 shadow-sm">
            {[7, 30, 90].map((d) => (
              <button
                key={d}
                onClick={() => setDays(d)}
                className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition ${
                  days === d ? "bg-violet-600 text-white shadow" : "text-gray-500 hover:bg-gray-100"
                }`}
              >
                {d}d
              </button>
            ))}
          </div>

          {/* Refresh */}
          <button
            onClick={fetchPredictions}
            disabled={loading}
            className="bg-violet-600 hover:bg-violet-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition disabled:opacity-50 shadow flex items-center gap-2"
          >
            {loading ? (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin inline-block" />
            ) : "🔄"}
            Refresh
          </button>
        </div>
      </div>

      {/* ── How it works banner ─────────────────────────────────────────── */}
      <div className="bg-gradient-to-r from-violet-600 to-indigo-600 rounded-2xl p-5 text-white shadow-xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="text-4xl">🧠</div>
          <div className="flex-1">
            <h2 className="font-bold text-lg mb-1">How the AI Works</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm text-violet-100">
              <div className="flex items-start gap-2">
                <span className="text-violet-300 font-bold">①</span>
                <span><strong className="text-white">Moving Averages</strong> — 7-day & 30-day sales averages to smooth out noise</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-violet-300 font-bold">②</span>
                <span><strong className="text-white">Trend Detection</strong> — Compares recent vs older sales to detect acceleration</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-violet-300 font-bold">③</span>
                <span><strong className="text-white">Stockout Forecast</strong> — Predicts exact days until stock runs out</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Error ──────────────────────────────────────────────────────── */}
      {error && (
        <div className="bg-red-50 border border-red-300 text-red-700 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
          ❌ {error}
          <button onClick={fetchPredictions} className="ml-auto underline text-red-600 hover:text-red-800">Retry</button>
        </div>
      )}

      {/* ── Summary Cards ───────────────────────────────────────────────── */}
      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          <SummaryCard icon="🚨" label="Critical"  value={summary.criticalProducts} color="red" />
          <SummaryCard icon="⚠️" label="High"      value={summary.highUrgency}      color="orange" />
          <SummaryCard icon="📋" label="Medium"    value={summary.mediumUrgency}    color="yellow" />
          <SummaryCard icon="✅" label="Low"       value={summary.lowUrgency}       color="green" />
          <SummaryCard icon="🎯" label="Avg Confidence" value={`${summary.avgConfidence}%`} color="violet" />
        </div>
      )}

      {/* ── Filters ─────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
          <input
            type="text"
            placeholder="Search by product name, SKU or category..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-400 text-sm"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {["all", "critical", "high", "medium", "low"].map((u) => {
            const cfg = u === "all" ? { icon: "🔍", label: "All" } : URGENCY[u];
            return (
              <button
                key={u}
                onClick={() => setFilterUrgency(u)}
                className={`px-3 py-2 rounded-xl text-sm font-semibold transition border ${
                  filterUrgency === u
                    ? "bg-violet-600 text-white border-violet-600 shadow"
                    : "bg-white text-gray-600 border-gray-200 hover:border-violet-400"
                }`}
              >
                {cfg.icon} {cfg.label}
                {u !== "all" && summary && (
                  <span className="ml-1 opacity-70">
                    ({summary[u === "critical" ? "criticalProducts" : u === "high" ? "highUrgency" : u === "medium" ? "mediumUrgency" : "lowUrgency"]})
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Predictions List ─────────────────────────────────────────────── */}
      {loading ? (
        <div className="text-center py-24">
          <div className="w-12 h-12 border-4 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500 font-medium">AI is analyzing your inventory data…</p>
          <p className="text-gray-400 text-sm mt-1">Calculating moving averages & trends</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-gray-100 shadow">
          <div className="text-5xl mb-3">🎉</div>
          <p className="text-xl font-bold text-gray-700 mb-1">
            {filterUrgency === "all" ? "No predictions available" : `No ${filterUrgency} urgency products`}
          </p>
          <p className="text-gray-400 text-sm">
            {filterUrgency === "all"
              ? "Add some sales data to generate predictions"
              : "Try a different filter"}
          </p>
        </div>
      ) : (
        <>
          <p className="text-sm text-gray-500">
            Showing <strong className="text-violet-600">{filtered.length}</strong> of {data?.predictions?.length ?? 0} products
          </p>
          <div className="space-y-3">
            {filtered.map((p) => (
              <PredictionCard key={p.productId} p={p} />
            ))}
          </div>
        </>
      )}

      {/* ── Footer note ─────────────────────────────────────────────────── */}
      {data?.generatedAt && (
        <p className="text-xs text-gray-400 text-center pt-2">
          Predictions generated at {new Date(data.generatedAt).toLocaleString()} · Based on last {days} days of sales data
        </p>
      )}
    </div>
  );
}
