import React, { useEffect, useState } from "react";
import API from "../api";
import { useInventory } from "../hooks/useInventory";

export default function Categories() {
  const { state, dispatch } = useInventory();
  const [form, setForm] = useState({ name: "", description: "" });
  const [editId, setEditId] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    API.get("/categories").then((r) => {
      dispatch({ type: "SET_CATEGORIES", payload: r.data });
      setLoading(false);
    });
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      if (editId) {
        const res = await API.put(`/categories/${editId}`, form);
        dispatch({ type: "EDIT_CATEGORY", payload: res.data });
        setEditId(null);
      } else {
        const res = await API.post("/categories", form);
        dispatch({ type: "ADD_CATEGORY", payload: res.data });
      }
      setForm({ name: "", description: "" });
    } catch (err) {
      setError(err.response?.data?.message || "Failed");
    }
  };

  const handleEdit = (cat) => {
    setEditId(cat.id);
    setForm({ name: cat.name, description: cat.description || "" });
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this category?")) return;
    try {
      await API.delete(`/categories/${id}`);
      dispatch({ type: "DELETE_CATEGORY", payload: id });
    } catch (err) {
      alert(err.response?.data?.message || "Delete failed");
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Categories</h1>

      {/* Form */}
      <div className="bg-white rounded-xl shadow p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">{editId ? "Edit Category" : "Add Category"}</h2>
        {error && <div className="bg-red-100 text-red-700 px-4 py-2 rounded mb-3">{error}</div>}
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
          <input type="text" required placeholder="Category name" value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="border border-gray-300 rounded-lg px-4 py-2 flex-1 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          <input type="text" placeholder="Description (optional)" value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="border border-gray-300 rounded-lg px-4 py-2 flex-1 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          <button type="submit" className="bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 font-medium">
            {editId ? "Update" : "Add"}
          </button>
          {editId && (
            <button type="button" onClick={() => { setEditId(null); setForm({ name: "", description: "" }); }}
              className="bg-gray-200 text-gray-700 px-5 py-2 rounded-lg hover:bg-gray-300">
              Cancel
            </button>
          )}
        </form>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        {loading ? (
          <div className="text-center py-8 text-gray-400">Loading...</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-100 text-left text-gray-600">
                <th className="px-4 py-3">#</th>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Description</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {state.categories.length === 0 ? (
                <tr><td colSpan="4" className="text-center py-8 text-gray-400">No categories found</td></tr>
              ) : state.categories.map((cat, i) => (
                <tr key={cat.id} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-400">{i + 1}</td>
                  <td className="px-4 py-3 font-medium">{cat.name}</td>
                  <td className="px-4 py-3 text-gray-500">{cat.description || "—"}</td>
                  <td className="px-4 py-3 space-x-3">
                    <button onClick={() => handleEdit(cat)} className="text-blue-600 hover:underline text-sm">Edit</button>
                    {state.user?.role === "admin" && (
                      <button onClick={() => handleDelete(cat.id)} className="text-red-600 hover:underline text-sm">Delete</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
