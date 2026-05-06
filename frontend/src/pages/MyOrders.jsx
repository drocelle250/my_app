import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api";
import { useInventory } from "../hooks/useInventory";

const BACKEND = import.meta.env.VITE_API_URL?.replace("/api", "") || "http://localhost:5000";

const STATUS_STYLE = {
  pending:   { badge: "bg-yellow-100 text-yellow-700 border border-yellow-200", icon: "⏳" },
  confirmed: { badge: "bg-green-100  text-green-700  border border-green-200",  icon: "✅" },
  cancelled: { badge: "bg-red-100    text-red-700    border border-red-200",    icon: "❌" },
};

function getImg(p) {
  if (p?.imageUrl) return BACKEND + p.imageUrl;
  return null;
}

export default function MyOrders() {
  const { state } = useInventory();
  const navigate  = useNavigate();
  const [orders, setOrders]     = useState([]);
  const [loading, setLoading]   = useState(true);
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    API.get("/orders/my")
      .then((r) => setOrders(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const toggle = (id) => setExpanded((prev) => (prev === id ? null : id));

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-violet-50">

      {/* Nav */}
      <nav className="bg-gradient-to-r from-violet-700 via-purple-600 to-indigo-600 shadow-xl sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">📋</span>
            <div>
              <p className="text-white font-bold text-lg leading-none">My Orders</p>
              <p className="text-violet-200 text-xs">Track your purchase history</p>
            </div>
          </div>
          <button
            onClick={() => navigate("/shop")}
            className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-xl text-sm font-semibold border border-white/30 transition"
          >
            🛍️ Back to Shop
          </button>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800">
            Hello, {state.user?.name} 👋
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            {orders.length === 0 ? "You haven't placed any orders yet." : `You have ${orders.length} order${orders.length !== 1 ? "s" : ""}.`}
          </p>
        </div>

        {loading ? (
          <div className="text-center py-24">
            <div className="w-10 h-10 border-4 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-500">Loading your orders…</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-24 bg-white rounded-3xl shadow border border-gray-100">
            <div className="text-6xl mb-4">🛒</div>
            <p className="text-xl font-bold text-gray-700 mb-2">No orders yet</p>
            <p className="text-gray-400 mb-6">Start shopping and your orders will appear here.</p>
            <button
              onClick={() => navigate("/shop")}
              className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white px-8 py-3 rounded-xl font-bold hover:from-violet-700 hover:to-indigo-700 transition shadow-lg"
            >
              🛍️ Browse Products
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => {
              const s = STATUS_STYLE[order.status] || STATUS_STYLE.pending;
              const isOpen = expanded === order.id;
              return (
                <div key={order.id} className="bg-white rounded-2xl shadow border border-gray-100 overflow-hidden">

                  {/* Order header — click to expand */}
                  <button
                    className="w-full text-left px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition"
                    onClick={() => toggle(order.id)}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-violet-100 rounded-xl flex items-center justify-center text-violet-600 font-bold text-sm">
                        #{order.id}
                      </div>
                      <div>
                        <p className="font-bold text-gray-800 text-sm">
                          Order #{order.id}
                          <span className={`ml-2 text-xs px-2 py-0.5 rounded-full font-semibold ${s.badge}`}>
                            {s.icon} {order.status}
                          </span>
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {new Date(order.createdAt).toLocaleString()} · {order.items?.length ?? 0} item{(order.items?.length ?? 0) !== 1 ? "s" : ""}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-lg font-extrabold text-violet-700">
                        ${Number(order.totalAmount).toFixed(2)}
                      </span>
                      <span className={`text-gray-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}>
                        ▼
                      </span>
                    </div>
                  </button>

                  {/* Expanded items */}
                  {isOpen && (
                    <div className="border-t border-gray-100 px-6 py-4 bg-gray-50">
                      {order.note && (
                        <div className="mb-3 text-sm text-gray-500 bg-white rounded-xl px-4 py-2 border border-gray-100">
                          📝 Note: {order.note}
                        </div>
                      )}
                      <div className="space-y-3">
                        {(order.items || []).map((item) => {
                          const img = getImg(item.product);
                          return (
                            <div key={item.id} className="flex items-center gap-3 bg-white rounded-xl p-3 border border-gray-100">
                              <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-violet-50 flex items-center justify-center">
                                {img
                                  ? <img src={img} alt={item.product?.name} className="w-full h-full object-cover" />
                                  : <span className="text-2xl">📦</span>
                                }
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-semibold text-gray-800 text-sm truncate">{item.product?.name ?? "—"}</p>
                                <p className="text-xs text-gray-400">SKU: {item.product?.sku}</p>
                              </div>
                              <div className="text-right flex-shrink-0">
                                <p className="text-sm font-bold text-gray-700">
                                  {item.quantity} × ${Number(item.unitPrice).toFixed(2)}
                                </p>
                                <p className="text-xs text-violet-600 font-semibold">
                                  ${(item.quantity * item.unitPrice).toFixed(2)}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      <div className="mt-4 flex justify-end">
                        <div className="bg-white rounded-xl px-5 py-3 border border-gray-100 text-right">
                          <p className="text-xs text-gray-400">Order Total</p>
                          <p className="text-xl font-extrabold text-violet-700">${Number(order.totalAmount).toFixed(2)}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
