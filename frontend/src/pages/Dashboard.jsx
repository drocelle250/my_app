import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import API from "../api";
import { useInventory } from "../hooks/useInventory";

export default function Dashboard() {
  const { state } = useInventory();
  const isAdmin = state.user?.role === "admin";
  const canEdit = state.user?.role === "admin" || state.user?.role === "manager";

  const [stats, setStats]             = useState(null);
  const [lowStockItems, setLowStockItems] = useState([]);
  const [loading, setLoading]         = useState(true);
  const [flashMsg, setFlashMsg]       = useState("");

  const fetchData = async () => {
    try {
      const [dashRes, lowRes] = await Promise.all([
        API.get("/stock/dashboard"),
        API.get("/stock/low-stock"),
      ]);
      setStats(dashRes.data);
      setLowStockItems(lowRes.data.products || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  if (loading) return (
    <div className="flex justify-center items-center h-64 text-gray-500">
      <div className="text-center">
        <div className="w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        Loading dashboard...
      </div>
    </div>
  );

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-6 sm:mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">
            Welcome back, <strong>{state.user?.name}</strong>
            <span className="ml-2 text-xs bg-violet-100 text-violet-700 px-2 py-0.5 rounded-full capitalize">
              {state.user?.role}
            </span>
          </p>
        </div>
        {canEdit && (
          <div className="flex gap-2 flex-wrap">
            <Link to="/stock"
              className="bg-green-600 text-white px-4 py-2.5 rounded-xl hover:bg-green-700 font-medium text-sm transition flex items-center gap-1.5">
              📦 Stock
            </Link>
            <Link to="/products/add"
              className="bg-violet-600 text-white px-4 py-2.5 rounded-xl hover:bg-violet-700 font-medium text-sm transition flex items-center gap-1.5">
              ➕ Add Product
            </Link>
          </div>
        )}
      </div>

      {/* Flash */}
      {flashMsg && (
        <div className="bg-green-50 border border-green-300 text-green-700 px-4 py-3 rounded-xl mb-4 text-sm">
          {flashMsg}
        </div>
      )}

      {/* Low stock banner */}
      {lowStockItems.length > 0 && (
        <div className="bg-red-50 border border-red-300 text-red-700 px-4 py-3 rounded-xl mb-5 flex items-center gap-2 flex-wrap">
          <span>⚠️ <strong>{lowStockItems.length} products</strong> have low stock!</span>
          <Link to="/stock" className="ml-auto text-sm underline font-medium whitespace-nowrap">Manage Stock →</Link>
        </div>
      )}

      {/* Stat Cards — 2 cols on mobile, 4 on desktop */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-6 sm:mb-8">
        <StatCard title="Products"  value={stats?.totalProducts ?? 0}        icon="📦" color="blue"   />
        <StatCard title="Value"     value={`$${Number(stats?.totalInventoryValue ?? 0).toLocaleString()}`} icon="💰" color="green" raw />
        <StatCard title="Categories" value={stats?.totalCategories ?? 0}     icon="📂" color="yellow" />
        <StatCard title="Low Stock" value={stats?.lowStockCount ?? 0}         icon="⚠️" color="red"    />
      </div>

      {/* Admin quick-action panel */}
      {isAdmin && (
        <div className="bg-white rounded-2xl shadow p-4 sm:p-6 mb-6 sm:mb-8 border border-violet-100">
          <h2 className="text-base sm:text-lg font-semibold text-gray-800 mb-1">🛠️ Quick Actions</h2>
          <p className="text-xs sm:text-sm text-gray-500 mb-4">Manage every part of the system.</p>
          <div className="grid grid-cols-3 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3">
            {[
              { to: "/products/add", icon: "➕", label: "Add Product", bg: "bg-violet-50 hover:bg-violet-100 border-violet-200", text: "text-violet-700" },
              { to: "/categories",   icon: "📂", label: "Categories",  bg: "bg-yellow-50 hover:bg-yellow-100 border-yellow-200", text: "text-yellow-700" },
              { to: "/stock",        icon: "📦", label: "Stock",       bg: "bg-green-50 hover:bg-green-100 border-green-200",   text: "text-green-700" },
              { to: "/orders",       icon: "🧾", label: "Orders",      bg: "bg-blue-50 hover:bg-blue-100 border-blue-200",     text: "text-blue-700" },
              { to: "/analytics",    icon: "📊", label: "Analytics",   bg: "bg-indigo-50 hover:bg-indigo-100 border-indigo-200", text: "text-indigo-700" },
              { to: "/ai-predictions", icon: "🤖", label: "AI",        bg: "bg-pink-50 hover:bg-pink-100 border-pink-200",     text: "text-violet-700" },
            ].map((item) => (
              <Link key={item.to} to={item.to}
                className={`flex flex-col items-center justify-center ${item.bg} border rounded-xl p-3 sm:p-4 text-center transition`}>
                <span className="text-xl sm:text-2xl mb-1">{item.icon}</span>
                <span className={`text-xs font-medium ${item.text} leading-tight`}>{item.label}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Low stock table */}
      {lowStockItems.length > 0 && (
        <div className="bg-white rounded-2xl shadow p-4 sm:p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-base sm:text-xl font-semibold text-red-600">⚠️ Low Stock Items</h2>
            {canEdit && (
              <Link to="/stock" className="text-sm text-violet-600 hover:underline font-medium">
                Restock →
              </Link>
            )}
          </div>
          <div className="overflow-x-auto -mx-4 sm:mx-0">
            <table className="w-full text-sm min-w-[500px]">
              <thead>
                <tr className="bg-gray-50 text-left text-gray-600 border-b">
                  <th className="px-4 py-2.5">Product</th>
                  <th className="px-4 py-2.5 hidden sm:table-cell">SKU</th>
                  <th className="px-4 py-2.5">Category</th>
                  <th className="px-4 py-2.5">Qty</th>
                  <th className="px-4 py-2.5 hidden sm:table-cell">Threshold</th>
                  {canEdit && <th className="px-4 py-2.5">Action</th>}
                </tr>
              </thead>
              <tbody>
                {lowStockItems.map((p) => (
                  <tr key={p.id} className="border-t hover:bg-gray-50">
                    <td className="px-4 py-2.5 font-medium">{p.name}</td>
                    <td className="px-4 py-2.5 text-gray-400 text-xs hidden sm:table-cell">{p.sku}</td>
                    <td className="px-4 py-2.5 text-gray-500">{p.category?.name}</td>
                    <td className="px-4 py-2.5 text-red-600 font-bold">{p.quantity}</td>
                    <td className="px-4 py-2.5 text-gray-400 hidden sm:table-cell">{p.lowStockThreshold}</td>
                    {canEdit && (
                      <td className="px-4 py-2.5">
                        <Link to="/stock" className="text-xs bg-green-100 text-green-700 px-2.5 py-1.5 rounded-lg hover:bg-green-200 whitespace-nowrap">
                          Restock
                        </Link>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {lowStockItems.length === 0 && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-4 rounded-2xl text-center text-sm sm:text-base">
          ✅ All products are well stocked!
        </div>
      )}
    </div>
  );
}

function StatCard({ title, value, icon, color, raw }) {
  const colors = {
    blue:   "bg-blue-50 border-blue-200 text-blue-700",
    green:  "bg-green-50 border-green-200 text-green-700",
    yellow: "bg-yellow-50 border-yellow-200 text-yellow-700",
    red:    "bg-red-50 border-red-200 text-red-700",
  };
  return (
    <div className={`border rounded-2xl p-4 sm:p-6 ${colors[color]}`}>
      <div className="text-2xl sm:text-3xl mb-1 sm:mb-2">{icon}</div>
      <p className="text-xs sm:text-sm font-medium opacity-75">{title}</p>
      <p className="text-xl sm:text-3xl font-bold mt-1 truncate">{raw ? value : Number(value).toLocaleString()}</p>
    </div>
  );
}
