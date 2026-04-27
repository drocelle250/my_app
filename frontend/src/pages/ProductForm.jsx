import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import API from "../api";
import { useInventory } from "../hooks/useInventory";

export default function ProductForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const { dispatch } = useInventory();

  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState({
    name: "", sku: "", price: "", quantity: "", description: "",
    categoryId: "", lowStockThreshold: 10,
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [catLoading, setCatLoading] = useState(true);

  useEffect(() => {
    // Load categories for the dropdown
    API.get("/categories")
      .then((r) => {
        setCategories(r.data);
        setCatLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load categories:", err);
        setError("Failed to load categories. Make sure the backend is running.");
        setCatLoading(false);
      });

    // If editing, load existing product data
    if (isEdit) {
      API.get(`/products/${id}`)
        .then((r) => {
          const p = r.data;
          setForm({
            name: p.name,
            sku: p.sku,
            price: p.price,
            quantity: p.quantity,
            description: p.description || "",
            categoryId: p.categoryId,
            lowStockThreshold: p.lowStockThreshold,
          });
        })
        .catch(() => setError("Failed to load product data."));
    }
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Validate category is selected
    if (!form.categoryId) {
      setError("Please select a category.");
      return;
    }

    setLoading(true);
    try {
      if (isEdit) {
        const res = await API.put(`/products/${id}`, form);
        dispatch({ type: "EDIT_PRODUCT", payload: res.data });
      } else {
        const res = await API.post("/products", form);
        dispatch({ type: "ADD_PRODUCT", payload: res.data });
      }
      navigate("/products");
    } catch (err) {
      setError(
        err.response?.data?.message ||
        err.response?.data?.errors?.[0]?.msg ||
        "Failed to save product. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">
        {isEdit ? "Edit Product" : "Add New Product"}
      </h1>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow p-6 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

          <Field label="Product Name" required>
            <input
              type="text" required value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="input" placeholder="e.g. Laptop Pro"
            />
          </Field>

          <Field label="SKU" required>
            <input
              type="text" required value={form.sku}
              onChange={(e) => setForm({ ...form, sku: e.target.value })}
              className="input" placeholder="e.g. ELEC-LAP-001"
            />
          </Field>

          <Field label="Price ($)" required>
            <input
              type="number" required min="0" step="0.01" value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
              className="input" placeholder="0.00"
            />
          </Field>

          <Field label="Quantity" required>
            <input
              type="number" required min="0" value={form.quantity}
              onChange={(e) => setForm({ ...form, quantity: e.target.value })}
              className="input" placeholder="0"
            />
          </Field>

          <Field label="Category" required>
            {catLoading ? (
              <div className="input bg-gray-50 text-gray-400">Loading categories...</div>
            ) : categories.length === 0 ? (
              <div className="input bg-red-50 text-red-500 text-sm">
                No categories found. <a href="/categories" className="underline font-medium">Add a category first</a>
              </div>
            ) : (
              <select
                required
                value={form.categoryId}
                onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                className="input"
              >
                <option value="">-- Select category --</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            )}
          </Field>

          <Field label="Low Stock Threshold">
            <input
              type="number" min="0" value={form.lowStockThreshold}
              onChange={(e) => setForm({ ...form, lowStockThreshold: e.target.value })}
              className="input"
            />
          </Field>

        </div>

        <Field label="Description">
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="input h-24 resize-none"
            placeholder="Optional description..."
          />
        </Field>

        <div className="flex gap-3 pt-2">
          <button
            type="submit" disabled={loading || catLoading || categories.length === 0}
            className="bg-violet-600 text-white px-6 py-2 rounded-lg hover:bg-violet-700 font-medium disabled:opacity-50"
          >
            {loading ? "Saving..." : isEdit ? "Update Product" : "Add Product"}
          </button>
          <button
            type="button" onClick={() => navigate("/products")}
            className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300 font-medium"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({ label, required, children }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
    </div>
  );
}
