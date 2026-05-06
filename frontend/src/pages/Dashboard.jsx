import React, { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import API from "../api";
import { useInventory } from "../hooks/useInventory";

export default function Dashboard() {
  const { state } = useInventory();
  const isAdmin   = state.user?.role === "admin";
  const canEdit   = state.user?.role === "admin" || state.user?.role === "manager";

  const [stats, setStats]           = useState(null);
  const [lowStockItems, setLowStockItems] = useState([]);
  const [loading, setLoading]       = useState(true);

  // inline edit state
  const [editCard, setEditCard]     = useState(null); // which card is being edited
  const [editValue, setEditValue]   = useState("");
  const [saving, setSaving]         = useState(false);
  const [flashMsg, setFlashMsg]     = useState("");

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

  const flash = (msg) => {
    setFlashMsg(msg);
    setTimeout(() => setFlashMsg(""), 3000);
  };

  if (loading) return (
    <div className="flex justify-center items-center h-64 text-gray-500">
      Loading dashboard...
    </div>
  );

  return (
    <div className="p-6 max-w-7xl mx-auto">

      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">
            Welcome back, <strong>{state.user?.name}</strong>
            <span className="ml-2 text-xs bg-violet-100 text-violet-700 px-2 py-0.5 rounded-full">
              {state.user?.role}
            </span>
          </p>
        </div>
        {canEdit && (
          <div className="flex gap-2">
            <Link to="/stock" className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 font-medium text-sm">
              📦 Manage Stock
            </Link>
            <Link to="/products/add" className="bg-violet-600 text-white px-4 py-2 rounded-lg hover:bg-violet-700 font-medium text-sm">
              + Add Product
            </Link>
          </div>
        )}
      </div>

      {/* Flash message */}
      {flashMsg && (
        <div className="bg-green-50 border border-green-300 text-green-700 px-4 py-3 rounded-lg mb-4 text-sm">
          {flashMsg}
        </div>
      )}

      {/* Low stock banner */}
      {lowStockItems.length > 0 && (
        <div className="bg-red-50 border border-red-300 text-red-700 px-4 py-3 rounded-lg mb-6 flex items-center gap-2">
          ⚠️ <span><strong>{lowStockItems.length} products</strong> have low stock!</span>
          <Link to="/stock" className="ml-auto text-sm underline font-medium">Manage Stock →</Link>
        </div>
      )}

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard title="Total Products"  value={stats?.totalProducts ?? 0}        icon="📦" color="blue"   />
        <StatCard title="Inventory Value" value={`$${Number(stats?.totalInventoryValue ?? 0).toLocaleString()}`} icon="💰" color="green" raw />
        <StatCard title="Categories"      value={stats?.totalCategories ?? 0}       icon="📂" color="yellow" />
        <StatCard title="Low Stock"       value={stats?.lowStockCount ?? 0}         icon="⚠️" color="red"    />
      </div>

      {/* Admin quick-action panel */}
      {isAdmin && (
        <div className="bg-white rounded-xl shadow p-6 mb-8 border border-violet-100">
          <h2 className="text-lg font-semibold text-gray-800 mb-1">🛠️ Admin Quick Actions</h2>
          <p className="text-sm text-gray-500 mb-4">Manage every part of the system from here.</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <Link to="/products/add"
              className="flex flex-col items-center justify-center bg-violet-50 hover:bg-violet-100 border border-violet-200 rounded-xl p-4 text-center transition">
              <span className="text-2xl mb-1">➕</span>
              <span className="text-sm font-medium text-violet-700">Add Product</span>
            </Link>
            <Link to="/categories"
              className="flex flex-col items-center justify-center bg-yellow-50 hover:bg-yellow-100 border border-yellow-200 rounded-xl p-4 text-center transition">
              <span className="text-2xl mb-1">📂</span>
              <span className="text-sm font-medium text-yellow-700">Categories</span>
            </Link>
            <Link to="/stock"
              className="flex flex-col items-center justify-center bg-green-50 hover:bg-green-100 border border-green-200 rounded-xl p-4 text-center transition">
              <span className="text-2xl mb-1">📦</span>
              <span className="text-sm font-medium text-green-700">Stock</span>
            </Link>
            <Link to="/orders"
              className="flex flex-col items-center justify-center bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl p-4 text-center transition">
              <span className="text-2xl mb-1">🧾</span>
              <span className="text-sm font-medium text-blue-700">Orders</span>
            </Link>
            <Link to="/analytics"
              className="flex flex-col items-center justify-center bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-xl p-4 text-center transition">
              <span className="text-2xl mb-1">📊</span>
              <span className="text-sm font-medium text-indigo-700">Analytics</span>
            </Link>
            <Link to="/ai-predictions"
              className="flex flex-col items-center justify-center bg-gradient-to-br from-violet-50 to-pink-50 hover:from-violet-100 hover:to-pink-100 border border-violet-200 rounded-xl p-4 text-center transition">
              <span className="text-2xl mb-1">🤖</span>
              <span className="text-sm font-medium text-violet-700">AI Predict</span>
            </Link>
          </div>
        </div>
      )}

      {/* Low stock table */}
      {lowStockItems.length > 0 && (
        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-red-600">⚠️ Low Stock Items</h2>
            {canEdit && (
              <Link to="/stock" className="text-sm text-violet-600 hover:underline font-medium">
                Restock items →
              </Link>
            )}
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left text-gray-600 border-b">
                <th className="px-4 py-2">Product</th>
                <th className="px-4 py-2">SKU</th>
                <th className="px-4 py-2">Category</th>
                <th className="px-4 py-2">Qty</th>
                <th className="px-4 py-2">Threshold</th>
                {canEdit && <th className="px-4 py-2">Action</th>}
              </tr>
            </thead>
            <tbody>
              {lowStockItems.map((p) => (
                <tr key={p.id} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-2 font-medium">{p.name}</td>
                  <td className="px-4 py-2 text-gray-400 text-xs">{p.sku}</td>
                  <td className="px-4 py-2 text-gray-500">{p.category?.name}</td>
                  <td className="px-4 py-2 text-red-600 font-bold">{p.quantity}</td>
                  <td className="px-4 py-2 text-gray-400">{p.lowStockThreshold}</td>
                  {canEdit && (
                    <td className="px-4 py-2">
                      <Link to="/stock" className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded hover:bg-green-200">
                        Restock
                      </Link>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {lowStockItems.length === 0 && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-4 rounded-xl text-center">
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
    <div className={`border rounded-xl p-6 ${colors[color]}`}>
      <div className="text-3xl mb-2">{icon}</div>
      <p className="text-sm font-medium opacity-75">{title}</p>
      <p className="text-3xl font-bold mt-1">{raw ? value : Number(value).toLocaleString()}</p>
    </div>
  );
}
