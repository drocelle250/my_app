import React, { useEffect, useState } from "react";
import API from "../api";
import { useInventory } from "../hooks/useInventory";

const TYPE_LABELS = {
  restock:    { label: "Restock",    color: "bg-green-100 text-green-700"  },
  sale:       { label: "Sale",       color: "bg-blue-100 text-blue-700"    },
  removal:    { label: "Removal",    color: "bg-red-100 text-red-700"      },
  adjustment: { label: "Adjustment", color: "bg-yellow-100 text-yellow-700"},
};

export default function Stock() {
  const { state } = useInventory();
  const canEdit = state.user?.role === "admin" || state.user?.role === "manager";

  const [products, setProducts]   = useState([]);
  const [history, setHistory]     = useState([]);
  const [loading, setLoading]     = useState(true);
  const [histLoading, setHistLoading] = useState(false);
  const [flash, setFlash]         = useState({ msg: "", type: "success" });

  // Stock adjustment form
  const [form, setForm] = useState({
    productId: "",
    action: "restock",   // restock | deduct
    type: "restock",     // restock | sale | removal | adjustment
    quantity: "",
    note: "",
  });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError]     = useState("");

  // Selected product for history
  const [selectedProduct, setSelectedProduct] = useState(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await API.get("/products", { params: { limit: 100 } });
      setProducts(res.data.products || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchHistory = async (productId) => {
    setHistLoading(true);
    try {
      const res = await API.get(`/stock/history/${productId}`);
      setHistory(res.data.history || []);
    } catch (err) {
      console.error(err);
    } finally {
      setHistLoading(false);
    }
  };

  const handleProductSelect = (e) => {
    const id = e.target.value;
    setForm({ ...form, productId: id });
    if (id) {
      const p = products.find((x) => String(x.id) === String(id));
      setSelectedProduct(p || null);
      fetchHistory(id);
    } else {
      setSelectedProduct(null);
      setHistory([]);
    }
  };

  const handleActionChange = (action) => {
    setForm({
      ...form,
      action,
      type: action === "restock" ? "restock" : "sale",
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");
    if (!form.productId) return setFormError("Please select a product.");
    if (!form.quantity || Number(form.quantity) < 1) return setFormError("Quantity must be at least 1.");

    setFormLoading(true);
    try {
      const endpoint = form.action === "restock" ? "/stock/restock" : "/stock/deduct";
      await API.post(endpoint, {
        productId: form.productId,
        quantity:  Number(form.quantity),
        type:      form.type,
        note:      form.note,
      });

      // Refresh product list and history
      await fetchProducts();
      await fetchHistory(form.productId);

      setForm({ ...form, quantity: "", note: "" });
      showFlash(`✅ Stock ${form.action === "restock" ? "added" : "deducted"} successfully!`, "success");
    } catch (err) {
      setFormError(err.response?.data?.message || "Failed to update stock");
    } finally {
      setFormLoading(false);
    }
  };

  const showFlash = (msg, type = "success") => {
    setFlash({ msg, type });
    setTimeout(() => setFlash({ msg: "", type: "success" }), 3000);
  };

  const selectedProductData = products.find((p) => String(p.id) === String(form.productId));

  return (
    <div className="p-6 max-w-7xl mx-auto">

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Stock Management</h1>
        <p className="text-gray-500 text-sm mt-1">Add stock, deduct stock, and view stock history</p>
      </div>

      {/* Flash */}
      {flash.msg && (
        <div className={`px-4 py-3 rounded-lg mb-4 text-sm border ${
          flash.type === "success"
            ? "bg-green-50 border-green-300 text-green-700"
            : "bg-red-50 border-red-300 text-red-700"
        }`}>
          {flash.msg}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── LEFT: Stock Form ── */}
        <div className="lg:col-span-1">
          {canEdit ? (
            <div className="bg-white rounded-xl shadow p-6 border border-gray-100">
              <h2 className="text-lg font-semibold mb-4">📥 Update Stock</h2>

              {formError && (
                <div className="bg-red-50 border border-red-300 text-red-700 px-4 py-2 rounded mb-4 text-sm">
                  {formError}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">

                {/* Product select */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Product <span className="text-red-500">*</span>
                  </label>
                  {loading ? (
                    <div className="text-gray-400 text-sm">Loading products...</div>
                  ) : (
                    <select
                      value={form.productId}
                      onChange={handleProductSelect}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-500"
                    >
                      <option value="">-- Select product --</option>
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} (Qty: {p.quantity})
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {/* Current stock info */}
                {selectedProductData && (
                  <div className={`rounded-lg px-4 py-3 text-sm border ${
                    selectedProductData.quantity <= selectedProductData.lowStockThreshold
                      ? "bg-red-50 border-red-200 text-red-700"
                      : "bg-green-50 border-green-200 text-green-700"
                  }`}>
                    Current stock: <strong>{selectedProductData.quantity}</strong> units
                    {selectedProductData.quantity <= selectedProductData.lowStockThreshold && (
                      <span className="ml-2 font-semibold">⚠️ Low stock!</span>
                    )}
                  </div>
                )}

                {/* Action: Restock or Deduct */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Action</label>
                  <div className="flex rounded-lg overflow-hidden border border-gray-300">
                    <button
                      type="button"
                      onClick={() => handleActionChange("restock")}
                      className={`flex-1 py-2 text-sm font-medium transition ${
                        form.action === "restock"
                          ? "bg-green-600 text-white"
                          : "bg-white text-gray-600 hover:bg-gray-50"
                      }`}
                    >
                      ➕ Add Stock
                    </button>
                    <button
                      type="button"
                      onClick={() => handleActionChange("deduct")}
                      className={`flex-1 py-2 text-sm font-medium transition ${
                        form.action === "deduct"
                          ? "bg-red-600 text-white"
                          : "bg-white text-gray-600 hover:bg-gray-50"
                      }`}
                    >
                      ➖ Deduct Stock
                    </button>
                  </div>
                </div>

                {/* Type (only for deduct) */}
                {form.action === "deduct" && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
                    <select
                      value={form.type}
                      onChange={(e) => setForm({ ...form, type: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-500"
                    >
                      <option value="sale">Sale</option>
                      <option value="removal">Removal / Damaged</option>
                      <option value="adjustment">Adjustment</option>
                    </select>
                  </div>
                )}

                {/* Quantity */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Quantity <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number" min="1" required
                    value={form.quantity}
                    onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-500"
                    placeholder="e.g. 10"
                  />
                </div>

                {/* Note */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Note (optional)</label>
                  <textarea
                    value={form.note}
                    onChange={(e) => setForm({ ...form, note: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none h-20"
                    placeholder="e.g. Received from supplier..."
                  />
                </div>

                <button
                  type="submit" disabled={formLoading}
                  className={`w-full py-2.5 rounded-lg font-semibold text-white transition disabled:opacity-50 ${
                    form.action === "restock"
                      ? "bg-green-600 hover:bg-green-700"
                      : "bg-red-600 hover:bg-red-700"
                  }`}
                >
                  {formLoading
                    ? "Saving..."
                    : form.action === "restock"
                    ? "➕ Add Stock"
                    : "➖ Deduct Stock"}
                </button>
              </form>
            </div>
          ) : (
            <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 rounded-xl p-6 text-sm">
              🔒 Only <strong>Admin</strong> and <strong>Manager</strong> can update stock.
            </div>
          )}
        </div>

        {/* ── RIGHT: Stock Items + History ── */}
        <div className="lg:col-span-2 space-y-6">

          {/* All Stock Items */}
          <div className="bg-white rounded-xl shadow overflow-hidden">
            <div className="px-6 py-4 border-b bg-gray-50 flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-800">📋 Stock Items</h2>
              <span className="text-sm text-gray-400">{products.length} products</span>
            </div>
            {loading ? (
              <div className="text-center py-8 text-gray-400">Loading...</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 text-left text-gray-600 border-b">
                      <th className="px-4 py-3">Product</th>
                      <th className="px-4 py-3">Category</th>
                      <th className="px-4 py-3">Price</th>
                      <th className="px-4 py-3">Qty</th>
                      <th className="px-4 py-3">Status</th>
                      {canEdit && <th className="px-4 py-3">Select</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {products.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="text-center py-8 text-gray-400">No products found</td>
                      </tr>
                    ) : products.map((p) => {
                      const isLow = p.quantity <= p.lowStockThreshold;
                      const isSelected = String(form.productId) === String(p.id);
                      return (
                        <tr
                          key={p.id}
                          className={`border-t transition ${
                            isSelected ? "bg-violet-50" : "hover:bg-gray-50"
                          }`}
                        >
                          <td className="px-4 py-3 font-medium">{p.name}</td>
                          <td className="px-4 py-3 text-gray-500 text-xs">{p.category?.name || "—"}</td>
                          <td className="px-4 py-3">${Number(p.price).toFixed(2)}</td>
                          <td className={`px-4 py-3 font-bold ${isLow ? "text-red-600" : "text-green-600"}`}>
                            {p.quantity}
                          </td>
                          <td className="px-4 py-3">
                            {isLow ? (
                              <span className="bg-red-100 text-red-600 text-xs px-2 py-0.5 rounded-full font-medium">
                                Low Stock
                              </span>
                            ) : (
                              <span className="bg-green-100 text-green-600 text-xs px-2 py-0.5 rounded-full font-medium">
                                In Stock
                              </span>
                            )}
                          </td>
                          {canEdit && (
                            <td className="px-4 py-3">
                              <button
                                onClick={() => handleProductSelect({ target: { value: String(p.id) } })}
                                className={`text-xs px-3 py-1 rounded-lg font-medium transition ${
                                  isSelected
                                    ? "bg-violet-600 text-white"
                                    : "bg-gray-100 text-gray-600 hover:bg-violet-100 hover:text-violet-700"
                                }`}
                              >
                                {isSelected ? "Selected" : "Select"}
                              </button>
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Stock History for selected product */}
          {selectedProduct && (
            <div className="bg-white rounded-xl shadow overflow-hidden">
              <div className="px-6 py-4 border-b bg-gray-50">
                <h2 className="text-lg font-semibold text-gray-800">
                  🕒 Stock History — <span className="text-violet-600">{selectedProduct.name}</span>
                </h2>
              </div>
              {histLoading ? (
                <div className="text-center py-8 text-gray-400">Loading history...</div>
              ) : history.length === 0 ? (
                <div className="text-center py-8 text-gray-400">No history yet for this product.</div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 text-left text-gray-600 border-b">
                      <th className="px-4 py-3">Type</th>
                      <th className="px-4 py-3">Qty Change</th>
                      <th className="px-4 py-3">Note</th>
                      <th className="px-4 py-3">By</th>
                      <th className="px-4 py-3">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.map((h) => {
                      const t = TYPE_LABELS[h.type] || { label: h.type, color: "bg-gray-100 text-gray-600" };
                      return (
                        <tr key={h.id} className="border-t hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${t.color}`}>
                              {t.label}
                            </span>
                          </td>
                          <td className={`px-4 py-3 font-bold ${h.quantity > 0 ? "text-green-600" : "text-red-600"}`}>
                            {h.quantity > 0 ? `+${h.quantity}` : h.quantity}
                          </td>
                          <td className="px-4 py-3 text-gray-500">{h.note || "—"}</td>
                          <td className="px-4 py-3 text-gray-500">{h.performedBy?.name || "—"}</td>
                          <td className="px-4 py-3 text-gray-400 text-xs">
                            {new Date(h.createdAt).toLocaleString()}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
