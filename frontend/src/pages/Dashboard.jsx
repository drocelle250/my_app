import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import API from "../api";
import { useInventory } from "../hooks/useInventory";

export default function Dashboard() {
  const { state } = useInventory();
  const [stats, setStats] = useState(null);
  const [lowStockItems, setLowStockItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
    fetchData();
  }, []);

  if (loading) return <div className="flex justify-center items-center h-64 text-gray-500">Loading dashboard...</div>;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
          <p className="text-gray-500">Welcome back, {state.user?.name}</p>
        </div>
        <Link to="/products/add" className="bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 font-medium">
          + Add Product
        </Link>
      </div>

      {/* Low stock banner */}
      {lowStockItems.length > 0 && (
        <div className="bg-red-50 border border-red-300 text-red-700 px-4 py-3 rounded-lg mb-6 flex items-center gap-2">
          ⚠️ <span><strong>{lowStockItems.length} products</strong> have low stock!</span>
          <Link to="/products?lowStock=true" className="ml-auto text-sm underline">View all</Link>
        </div>
      )}

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard title="Total Products" value={stats?.totalProducts ?? 0} icon="📦" color="blue" />
        <StatCard title="Inventory Value" value={`$${Number(stats?.totalInventoryValue ?? 0).toLocaleString()}`} icon="💰" color="green" raw />
        <StatCard title="Categories" value={stats?.totalCategories ?? 0} icon="📂" color="yellow" />
        <StatCard title="Low Stock" value={stats?.lowStockCount ?? 0} icon="⚠️" color="red" />
      </div>

      {/* Low stock table */}
      {lowStockItems.length > 0 && (
        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-xl font-semibold mb-4 text-red-600">⚠️ Low Stock Items</h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-100 text-left">
                <th className="px-4 py-2">Product</th>
                <th className="px-4 py-2">SKU</th>
                <th className="px-4 py-2">Category</th>
                <th className="px-4 py-2">Quantity</th>
                <th className="px-4 py-2">Threshold</th>
              </tr>
            </thead>
            <tbody>
              {lowStockItems.map((p) => (
                <tr key={p.id} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-2 font-medium">{p.name}</td>
                  <td className="px-4 py-2 text-gray-500">{p.sku}</td>
                  <td className="px-4 py-2">{p.category?.name}</td>
                  <td className="px-4 py-2 text-red-600 font-bold">{p.quantity}</td>
                  <td className="px-4 py-2 text-gray-500">{p.lowStockThreshold}</td>
                </tr>
              ))}
            </tbody>
          </table>
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
      <p className="text-3xl font-bold mt-1">{raw ? value : value.toLocaleString()}</p>
    </div>
  );
}
