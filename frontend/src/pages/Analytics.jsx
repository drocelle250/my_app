import React, { useState, useEffect } from "react";
import API from "../api";
import { useInventory } from "../hooks/useInventory";

// ─── Type badge config (matches Stock.jsx) ────────────────────────────────────
const TYPE_LABELS = {
  restock:    { label: "Restock",    color: "bg-green-100 text-green-700"   },
  sale:       { label: "Sale",       color: "bg-blue-100 text-blue-700"     },
  removal:    { label: "Removal",    color: "bg-red-100 text-red-700"       },
  adjustment: { label: "Adjustment", color: "bg-yellow-100 text-yellow-700" },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (n) => Number(n ?? 0).toLocaleString();
const fmtMoney = (n) =>
  "$" + Number(n ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtDate = (iso) => {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
};

// ─── Restock urgency helper ───────────────────────────────────────────────────
function urgency(days) {
  if (days === null || days === undefined) return "ok";
  if (days <= 3) return "urgent";
  if (days <= 7) return "soon";
  return "ok";
}
const URGENCY_ROW = {
  urgent: "bg-red-50",
  soon:   "bg-orange-50",
  ok:     "",
};
const URGENCY_BADGE = {
  urgent: "bg-red-100 text-red-700",
  soon:   "bg-orange-100 text-orange-700",
  ok:     "bg-green-100 text-green-700",
};
const URGENCY_LABEL = {
  urgent: "Urgent",
  soon:   "Soon",
  ok:     "OK",
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function SummaryCard({ icon, title, value, sub, color }) {
  const palette = {
    violet: "from-violet-500 to-violet-700",
    indigo: "from-indigo-500 to-indigo-700",
    green:  "from-green-500 to-green-700",
    red:    "from-red-500 to-red-700",
  };
  return (
    <div className={`rounded-2xl bg-gradient-to-br ${palette[color]} text-white p-6 shadow-lg flex flex-col gap-2`}>
      <div className="text-3xl">{icon}</div>
      <p className="text-sm font-medium opacity-80">{title}</p>
      <p className="text-3xl font-bold tracking-tight">{value}</p>
      {sub && <p className="text-xs opacity-70 mt-1">{sub}</p>}
    </div>
  );
}

function SectionHeader({ children }) {
  return (
    <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
      {children}
    </h2>
  );
}

// ─── Daily Flow Bar Chart (pure CSS) ─────────────────────────────────────────
function DailyFlowChart({ data }) {
  if (!data || data.length === 0) {
    return <p className="text-gray-400 text-sm py-8 text-center">No flow data for this period.</p>;
  }

  const maxVal = Math.max(...data.map((d) => Math.max(d.inflow, d.outflow)), 1);

  // Show at most 30 bars; if more, sample evenly
  const visible = data.length > 30 ? data.filter((_, i) => i % Math.ceil(data.length / 30) === 0) : data;

  return (
    <div className="overflow-x-auto">
      <div className="flex items-end gap-1 min-w-0" style={{ minHeight: "160px" }}>
        {visible.map((d) => {
          const inH  = Math.round((d.inflow  / maxVal) * 140);
          const outH = Math.round((d.outflow / maxVal) * 140);
          return (
            <div key={d.date} className="flex flex-col items-center flex-1 min-w-[18px] group relative">
              {/* Tooltip */}
              <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 z-10 hidden group-hover:flex flex-col items-center pointer-events-none">
                <div className="bg-gray-900 text-white text-xs rounded-lg px-3 py-2 whitespace-nowrap shadow-xl">
                  <p className="font-semibold">{d.date}</p>
                  <p className="text-green-300">▲ In: {fmt(d.inflow)}</p>
                  <p className="text-red-300">▼ Out: {fmt(d.outflow)}</p>
                  {d.revenue > 0 && <p className="text-yellow-300">💰 {fmtMoney(d.revenue)}</p>}
                </div>
                <div className="w-2 h-2 bg-gray-900 rotate-45 -mt-1" />
              </div>

              {/* Bars */}
              <div className="flex items-end gap-0.5 w-full justify-center">
                <div
                  className="bg-indigo-400 rounded-t w-2 transition-all duration-300"
                  style={{ height: `${inH}px` }}
                  title={`Inflow: ${d.inflow}`}
                />
                <div
                  className="bg-red-400 rounded-t w-2 transition-all duration-300"
                  style={{ height: `${outH}px` }}
                  title={`Outflow: ${d.outflow}`}
                />
              </div>

              {/* Date label — show every ~5th */}
              <span className="text-gray-400 mt-1 leading-none" style={{ fontSize: "9px" }}>
                {fmtDate(d.date)}
              </span>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex gap-4 mt-3 text-xs text-gray-500">
        <span className="flex items-center gap-1">
          <span className="inline-block w-3 h-3 rounded bg-indigo-400" /> Inflow
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-3 h-3 rounded bg-red-400" /> Outflow
        </span>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function Analytics() {
  const { state } = useInventory();
  const role = state.user?.role;
  const canView = role === "admin" || role === "manager";

  const [days, setDays]       = useState(30);
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");

  useEffect(() => {
    if (!canView) return;
    setLoading(true);
    setError("");
    API.get(`/stock/analytics?days=${days}`)
      .then((res) => setData(res.data))
      .catch((err) => setError(err.response?.data?.message || "Failed to load analytics"))
      .finally(() => setLoading(false));
  }, [days, canView]);

  // ── Access guard ─────────────────────────────────────────────────────────
  if (!canView) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <span className="text-5xl">🔒</span>
        <p className="text-gray-600 font-medium text-lg">Access Restricted</p>
        <p className="text-gray-400 text-sm">Only <strong>Admin</strong> and <strong>Manager</strong> can view analytics.</p>
      </div>
    );
  }

  // ── Loading ───────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <div className="w-10 h-10 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-500 text-sm">Loading analytics…</p>
      </div>
    );
  }

  // ── Error ─────────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <span className="text-5xl">⚠️</span>
        <p className="text-red-600 font-medium">{error}</p>
        <button
          onClick={() => setDays((d) => d)}
          className="text-sm text-violet-600 underline"
        >
          Retry
        </button>
      </div>
    );
  }

  const { summary, dailyFlow, topSelling, productAnalytics, needsRestock, recentHistory } = data || {};

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">

      {/* ── Page Header ──────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">📊 Analytics</h1>
          <p className="text-gray-500 text-sm mt-1">
            Inventory insights for the last <strong>{days} days</strong>
          </p>
        </div>

        {/* Period selector */}
        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl p-1 shadow-sm self-start">
          {[7, 30, 90].map((d) => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition ${
                days === d
                  ? "bg-violet-600 text-white shadow"
                  : "text-gray-500 hover:bg-gray-100"
              }`}
            >
              {d}d
            </button>
          ))}
        </div>
      </div>

      {/* ── Summary Cards ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <SummaryCard
          icon="📥"
          title="Total Inflow"
          value={fmt(summary?.totalIn)}
          sub="units received"
          color="indigo"
        />
        <SummaryCard
          icon="📤"
          title="Total Outflow"
          value={fmt(summary?.totalOut)}
          sub="units dispatched"
          color="red"
        />
        <SummaryCard
          icon="💰"
          title="Revenue from Sales"
          value={fmtMoney(summary?.revenueFromSales)}
          sub={`over ${days} days`}
          color="green"
        />
        <SummaryCard
          icon="🏦"
          title="Current Stock Value"
          value={fmtMoney(summary?.currentStockValue)}
          sub={`${fmt(summary?.totalProducts)} products`}
          color="violet"
        />
      </div>

      {/* ── Daily Flow Chart ─────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl shadow border border-gray-100 p-6">
        <SectionHeader>📈 Daily Stock Flow</SectionHeader>
        <DailyFlowChart data={dailyFlow} />
      </div>

      {/* ── Top Selling Products ─────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl shadow border border-gray-100 p-6">
        <SectionHeader>🏆 Top Selling Products</SectionHeader>
        {!topSelling || topSelling.length === 0 ? (
          <p className="text-gray-400 text-sm">No sales recorded in this period.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left text-gray-600 border-b">
                  <th className="px-4 py-3">#</th>
                  <th className="px-4 py-3">Product</th>
                  <th className="px-4 py-3">Units Sold</th>
                  <th className="px-4 py-3">Revenue</th>
                  <th className="px-4 py-3">Share</th>
                </tr>
              </thead>
              <tbody>
                {topSelling.map((item, i) => {
                  const totalSold = topSelling.reduce((s, x) => s + x.sold, 0);
                  const pct = totalSold > 0 ? Math.round((item.sold / totalSold) * 100) : 0;
                  return (
                    <tr key={item.product?.id ?? i} className="border-t hover:bg-gray-50">
                      <td className="px-4 py-3 text-gray-400 font-bold">#{i + 1}</td>
                      <td className="px-4 py-3 font-semibold text-gray-800">
                        {item.product?.name ?? "—"}
                        <span className="ml-2 text-xs text-gray-400">{item.product?.sku}</span>
                      </td>
                      <td className="px-4 py-3 text-indigo-700 font-bold">{fmt(item.sold)}</td>
                      <td className="px-4 py-3 text-green-700 font-semibold">{fmtMoney(item.revenue)}</td>
                      <td className="px-4 py-3 w-40">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                            <div
                              className="bg-violet-500 h-2 rounded-full transition-all duration-500"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="text-xs text-gray-500 w-8 text-right">{pct}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Needs Restock / Prediction ───────────────────────────────────── */}
      <div className="bg-white rounded-2xl shadow border border-gray-100 p-6">
        <SectionHeader>🔮 Needs Restock / Prediction</SectionHeader>
        {!needsRestock || needsRestock.length === 0 ? (
          <div className="flex items-center gap-2 text-green-700 bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-sm">
            ✅ All products have sufficient stock for the foreseeable future.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left text-gray-600 border-b">
                  <th className="px-4 py-3">Product</th>
                  <th className="px-4 py-3">Current Qty</th>
                  <th className="px-4 py-3">Avg Daily Sales</th>
                  <th className="px-4 py-3">Days Until Stockout</th>
                  <th className="px-4 py-3">Recommended Restock</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {needsRestock.map((p) => {
                  const u = urgency(p.daysUntilStockout);
                  return (
                    <tr key={p.id} className={`border-t ${URGENCY_ROW[u]}`}>
                      <td className="px-4 py-3 font-semibold text-gray-800">
                        {p.name}
                        <span className="ml-2 text-xs text-gray-400">{p.sku}</span>
                      </td>
                      <td className={`px-4 py-3 font-bold ${p.currentQty <= (p.lowStockThreshold ?? 5) ? "text-red-600" : "text-gray-700"}`}>
                        {fmt(p.currentQty)}
                      </td>
                      <td className="px-4 py-3 text-gray-600">{p.avgDailySales ?? 0}</td>
                      <td className="px-4 py-3 font-bold">
                        {p.daysUntilStockout === null || p.daysUntilStockout === undefined
                          ? <span className="text-gray-400">—</span>
                          : <span className={u === "urgent" ? "text-red-600" : u === "soon" ? "text-orange-600" : "text-green-600"}>
                              {p.daysUntilStockout}d
                            </span>
                        }
                      </td>
                      <td className="px-4 py-3 text-indigo-700 font-semibold">
                        {p.recommendedRestock > 0 ? `+${fmt(p.recommendedRestock)}` : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${URGENCY_BADGE[u]}`}>
                          {URGENCY_LABEL[u]}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Color legend */}
        <div className="flex gap-4 mt-4 text-xs text-gray-500">
          <span className="flex items-center gap-1">
            <span className="inline-block w-3 h-3 rounded bg-red-100 border border-red-300" /> Urgent (≤ 3 days)
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block w-3 h-3 rounded bg-orange-100 border border-orange-300" /> Soon (≤ 7 days)
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block w-3 h-3 rounded bg-green-100 border border-green-300" /> OK
          </span>
        </div>
      </div>

      {/* ── Recent Stock History ─────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl shadow border border-gray-100 p-6">
        <SectionHeader>🕒 Recent Stock History <span className="text-sm font-normal text-gray-400">(last 50 entries)</span></SectionHeader>
        {!recentHistory || recentHistory.length === 0 ? (
          <p className="text-gray-400 text-sm">No stock movements in this period.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left text-gray-600 border-b">
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Product</th>
                  <th className="px-4 py-3">Qty Change</th>
                  <th className="px-4 py-3">Note</th>
                  <th className="px-4 py-3">By</th>
                  <th className="px-4 py-3">Date</th>
                </tr>
              </thead>
              <tbody>
                {recentHistory.map((h) => {
                  const t = TYPE_LABELS[h.type] || { label: h.type, color: "bg-gray-100 text-gray-600" };
                  return (
                    <tr key={h.id} className="border-t hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${t.color}`}>
                          {t.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-800">
                        {h.product?.name ?? "—"}
                        <span className="ml-1 text-xs text-gray-400">{h.product?.sku}</span>
                      </td>
                      <td className={`px-4 py-3 font-bold ${h.quantity > 0 ? "text-green-600" : "text-red-600"}`}>
                        {h.quantity > 0 ? `+${h.quantity}` : h.quantity}
                      </td>
                      <td className="px-4 py-3 text-gray-500 max-w-xs truncate">{h.note || "—"}</td>
                      <td className="px-4 py-3 text-gray-500">{h.performedBy?.name ?? "—"}</td>
                      <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">
                        {new Date(h.createdAt).toLocaleString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Per-Product Analytics ────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl shadow border border-gray-100 p-6">
        <SectionHeader>📦 Per-Product Analytics</SectionHeader>
        {!productAnalytics || productAnalytics.length === 0 ? (
          <p className="text-gray-400 text-sm">No product data available.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left text-gray-600 border-b">
                  <th className="px-4 py-3">Product</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Current Qty</th>
                  <th className="px-4 py-3">Stock Value</th>
                  <th className="px-4 py-3">Total Sold</th>
                  <th className="px-4 py-3">Revenue Generated</th>
                </tr>
              </thead>
              <tbody>
                {productAnalytics.map((p) => (
                  <tr key={p.id} className="border-t hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <p className="font-semibold text-gray-800">{p.name}</p>
                      <p className="text-xs text-gray-400">{p.sku}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full font-medium">
                        {p.category}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`font-bold ${p.isLow ? "text-red-600" : "text-green-600"}`}>
                        {fmt(p.currentQty)}
                      </span>
                      {p.isLow && (
                        <span className="ml-1 text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full">Low</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-violet-700 font-semibold">{fmtMoney(p.stockValue)}</td>
                    <td className="px-4 py-3 text-gray-700 font-medium">{fmt(p.soldTotal)}</td>
                    <td className="px-4 py-3 text-green-700 font-semibold">{fmtMoney(p.revenueGenerated)}</td>
                  </tr>
                ))}
              </tbody>
              {/* Totals footer */}
              <tfoot>
                <tr className="bg-gray-50 border-t-2 border-gray-200 font-bold text-gray-700">
                  <td className="px-4 py-3" colSpan={3}>Totals</td>
                  <td className="px-4 py-3 text-violet-700">
                    {fmtMoney(productAnalytics.reduce((s, p) => s + p.stockValue, 0))}
                  </td>
                  <td className="px-4 py-3">
                    {fmt(productAnalytics.reduce((s, p) => s + p.soldTotal, 0))}
                  </td>
                  <td className="px-4 py-3 text-green-700">
                    {fmtMoney(productAnalytics.reduce((s, p) => s + p.revenueGenerated, 0))}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
