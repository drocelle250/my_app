import React, { useEffect, useState } from "react";
import API from "../api";
import { useInventory } from "../hooks/useInventory";

const STATUS_OPTIONS = ["pending", "confirmed", "cancelled"];
const STATUS_STYLE = {
  pending:   { badge: "bg-yellow-100 text-yellow-700 border border-yellow-200", icon: "⏳" },
  confirmed: { badge: "bg-green-100  text-green-700  border border-green-200",  icon: "✅" },
  cancelled: { badge: "bg-red-100    text-red-700    border border-red-200",    icon: "❌" },
};

export default function OrdersAdmin() {
  const { state } = useInventory();
  const canView = state.user?.role === "admin" || state.user?.role === "manager";

  const [orders, setOrders]     = useState([]);
  const [loading, setLoading]   = useState(true);
  const [expanded, setExpanded] = useState(null);
  const [saving, setSaving]     = useState(null);
  const [flash, setFlash]       = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [search, setSearch]     = useState("");

  useEffect(() => {
    if (!canView) return;
    API.get("/orders")
      .then((r) => setOrders(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [canView]);

  const handleStatusChange = async (orderId, status) => {
    setSaving(orderId);
    try {
      const res = await API.put(`/orders/${orderId}/status`, { status });
      setOrders((prev) => prev.map((o) => (o.id === res.data.id ? { ...o, status: res.data.status } : o)));
      showFlash("✅ Order status updated!");
    } catch (err) {
      showFlash("❌ " + (err.response?.data?.message || "Failed to update"));
    } finally {
      setSaving(null);
    }
  };

  const showFlash = (msg) => {
    setFlash(msg);
    setTimeout(() => setFlash(""), 3000);
  };

  const filtered = orders.filter((o) => {
    const matchStatus = filterStatus ? o.status === filterStatus : true;
    const matchSearch = search
      ? String(o.id).includes(search) ||
        (o.user?.name || "").toLowerCase().includes(search.toLowerCase()) ||
        (o.user?.email || "").toLowerCase().includes(search.toLowerCase())
      : true;
    return matchStatus && matchSearch;
  });

  const totalRevenue = orders
    .filter((o) => o.status !== "cancelled")
    .reduce((s, o) => s + Number(o.totalAmount), 0);

  if (!canView) return (
    <div className="flex flex-col items-center justify-center h-64 gap-3">
      <span className="text-5xl">🔒</span>
      <p className="text-gray-600 font-medium">Admin / Manager access only</p>
    </div>
  );

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">🧾 Orders</h1>
          <p className="text-gray-500 text-sm mt-1">Manage and track all customer orders</p>
        </div>
        {/* Summary pills */}
        <div className="flex gap-3 flex-wrap">
          {STATUS_OPTIONS.map((s) => {
            const count = orders.filter((o) => o.status === s).length;
            const st = STATUS_STYLE[s];
            return (
              <span key={s} className={`text-xs px-3 py-1.5 rounded-full font-semibold border ${st.badge}`}>
                {st.icon} {s}: {count}
              </span>
            );
          })}
        </div>
      </div>

      {/* Revenue card */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-6">
        <div className="bg-gradient-to-br from-violet-500 to-indigo-600 text-white rounded-2xl p-5 shadow-lg">
          <p className="text-violet-200 text-sm">Total Revenue</p>
          <p className="text-3xl font-extrabold mt-1">${totalRevenue.toFixed(2)}</p>
          <p className="text-violet-200 text-xs mt-1">excluding cancelled orders</p>
        </div>
        <div className="bg-gradient-to-br from-green-500 to-emerald-600 text-white rounded-2xl p-5 shadow-lg">
          <p className="text-green-100 text-sm">Confirmed Orders</p>
          <p className="text-3xl font-extrabold mt-1">{orders.filter((o) => o.status === "confirmed").length}</p>
        </div>
        <div className="bg-gradient-to-br from-yellow-400 to-orange-500 text-white rounded-2xl p-5 shadow-lg">
          <p className="text-yellow-100 text-sm">Pending Orders</p>
          <p className="text-3xl font-extrabold mt-1">{orders.filter((o) => o.status === "pending").length}</p>
        </div>
      </div>

      {/* Flash */}
      {flash && (
        <div className={`px-4 py-3 rounded-xl mb-4 text-sm font-medium border ${
          flash.startsWith("✅") ? "bg-green-50 border-green-200 text-green-700" : "bg-red-50 border-red-200 text-red-700"
        }`}>
          {flash}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <input
          type="text"
          placeholder="🔍 Search by order ID, customer name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 border border-gray-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-violet-400 text-sm"
        />
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="border border-gray-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-violet-400 text-sm bg-white min-w-[160px]"
        >
          <option value="">All Statuses</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
          ))}
        </select>
      </div>

      {/* Orders list */}
      {loading ? (
        <div className="text-center py-20">
          <div className="w-10 h-10 border-4 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Loading orders…</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-gray-100 shadow">
          <div className="text-5xl mb-3">📭</div>
          <p className="text-gray-500 font-medium">No orders found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((order) => {
            const s = STATUS_STYLE[order.status] || STATUS_STYLE.pending;
            const isOpen = expanded === order.id;
            return (
              <div key={order.id} className="bg-white rounded-2xl shadow border border-gray-100 overflow-hidden">

                {/* Row header */}
                <div className="px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-3">

                  {/* Left: order info */}
                  <button
                    className="flex items-center gap-3 flex-1 text-left"
                    onClick={() => setExpanded(isOpen ? null : order.id)}
                  >
                    <div className="w-10 h-10 bg-violet-100 rounded-xl flex items-center justify-center text-violet-600 font-bold text-sm flex-shrink-0">
                      #{order.id}
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-gray-800 text-sm flex items-center gap-2 flex-wrap">
                        {order.user?.name ?? "Unknown"}
                        <span className="text-gray-400 font-normal text-xs">{order.user?.email}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${s.badge}`}>
                          {s.icon} {order.status}
                        </span>
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {new Date(order.createdAt).toLocaleString()} · {order.items?.length ?? 0} item{(order.items?.length ?? 0) !== 1 ? "s" : ""}
                      </p>
                    </div>
                  </button>

                  {/* Right: amount + status changer */}
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className="text-lg font-extrabold text-violet-700">
                      ${Number(order.totalAmount).toFixed(2)}
                    </span>
                    <select
                      value={order.status}
                      disabled={saving === order.id}
                      onChange={(e) => handleStatusChange(order.id, e.target.value)}
                      className="border border-gray-300 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-violet-400 disabled:opacity-50 bg-white"
                    >
                      {STATUS_OPTIONS.map((s) => (
                        <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                      ))}
                    </select>
                    {saving === order.id && (
                      <div className="w-4 h-4 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
                    )}
                    <button
                      onClick={() => setExpanded(isOpen ? null : order.id)}
                      className={`text-gray-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                    >
                      ▼
                    </button>
                  </div>
                </div>

                {/* Expanded items */}
                {isOpen && (
                  <div className="border-t border-gray-100 px-5 py-4 bg-gray-50">
                    {order.note && (
                      <div className="mb-3 text-sm text-gray-500 bg-white rounded-xl px-4 py-2 border border-gray-100">
                        📝 {order.note}
                      </div>
                    )}
                    <div className="space-y-2">
                      {(order.items || []).map((item) => (
                        <div key={item.id} className="flex items-center justify-between bg-white rounded-xl px-4 py-3 border border-gray-100 text-sm">
                          <div>
                            <span className="font-semibold text-gray-800">{item.product?.name ?? "—"}</span>
                            <span className="ml-2 text-xs text-gray-400">{item.product?.sku}</span>
                          </div>
                          <div className="text-right">
                            <span className="text-gray-600">{item.quantity} × ${Number(item.unitPrice).toFixed(2)}</span>
                            <span className="ml-3 font-bold text-violet-700">${(item.quantity * item.unitPrice).toFixed(2)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <p className="text-xs text-gray-400 mt-4 text-right">
        Showing {filtered.length} of {orders.length} orders
      </p>
    </div>
  );
}
