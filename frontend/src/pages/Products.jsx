import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import API from "../api";
import { useInventory } from "../hooks/useInventory";

export default function Products() {
  const { state, dispatch } = useInventory();
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState("");
  const [page, setPage]       = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sortKey, setSortKey] = useState("name");
  const [sortDir, setSortDir] = useState("asc");

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await API.get("/products", { params: { page, limit: 10, search } });
      dispatch({ type: "SET_PRODUCTS", payload: res.data.products });
      setTotalPages(res.data.pages);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProducts(); }, [page, search]);

  const handleDelete = async (id) => {
    if (!confirm("Delete this product?")) return;
    try {
      await API.delete(`/products/${id}`);
      dispatch({ type: "DELETE_PRODUCT", payload: id });
    } catch (err) {
      alert(err.response?.data?.message || "Delete failed");
    }
  };

  const handleSort = (key) => {
    if (sortKey === key) setSortDir(sortDir === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("asc"); }
  };

  const sorted = [...state.products].sort((a, b) => {
    let av = a[sortKey], bv = b[sortKey];
    if (sortKey === "category") { av = a.category?.name || ""; bv = b.category?.name || ""; }
    if (typeof av === "string") return sortDir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
    return sortDir === "asc" ? av - bv : bv - av;
  });

  const icon = (key) => sortKey === key ? (sortDir === "asc" ? " ↑" : " ↓") : " ↕";

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-5 sm:mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Products</h1>
        <Link to="/products/add"
          className="bg-violet-600 text-white px-4 py-2.5 rounded-xl hover:bg-violet-700 font-semibold text-sm transition self-start sm:self-auto">
          ➕ Add Product
        </Link>
      </div>

      {/* Search */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="🔍 Search by name or SKU..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="border border-gray-300 rounded-xl px-4 py-2.5 w-full focus:outline-none focus:ring-2 focus:ring-violet-400 text-sm"
        />
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500">
          <div className="w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          Loading products...
        </div>
      ) : (
        <>
          {/* Table with horizontal scroll on mobile */}
          <div className="bg-white rounded-2xl shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[560px]">
                <thead>
                  <tr className="bg-gray-100 text-left text-gray-600">
                    <th className="px-4 py-3 cursor-pointer hover:bg-gray-200 whitespace-nowrap" onClick={() => handleSort("name")}>Name{icon("name")}</th>
                    <th className="px-4 py-3 cursor-pointer hover:bg-gray-200 whitespace-nowrap hidden sm:table-cell" onClick={() => handleSort("category")}>Category{icon("category")}</th>
                    <th className="px-4 py-3 hidden md:table-cell">SKU</th>
                    <th className="px-4 py-3 cursor-pointer hover:bg-gray-200 whitespace-nowrap" onClick={() => handleSort("price")}>Price{icon("price")}</th>
                    <th className="px-4 py-3 cursor-pointer hover:bg-gray-200 whitespace-nowrap" onClick={() => handleSort("quantity")}>Qty{icon("quantity")}</th>
                    <th className="px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sorted.length === 0 ? (
                    <tr><td colSpan="6" className="text-center py-10 text-gray-400">No products found</td></tr>
                  ) : sorted.map((p) => (
                    <tr key={p.id} className="border-t hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium max-w-[160px] truncate">{p.name}</td>
                      <td className="px-4 py-3 text-gray-500 hidden sm:table-cell">{p.category?.name || "—"}</td>
                      <td className="px-4 py-3 text-gray-400 text-xs hidden md:table-cell">{p.sku}</td>
                      <td className="px-4 py-3 font-semibold">${Number(p.price).toFixed(2)}</td>
                      <td className={`px-4 py-3 font-bold ${p.quantity <= p.lowStockThreshold ? "text-red-600" : "text-green-600"}`}>
                        {p.quantity}
                        {p.quantity <= p.lowStockThreshold && (
                          <span className="ml-1 text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full">Low</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Link to={`/products/edit/${p.id}`}
                            className="text-violet-600 hover:underline text-sm font-medium">Edit</Link>
                          {state.user?.role === "admin" && (
                            <button onClick={() => handleDelete(p.id)}
                              className="text-red-500 hover:underline text-sm font-medium">Delete</button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          <div className="flex justify-between items-center mt-4 text-sm text-gray-600">
            <span>Page {page} of {totalPages}</span>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="px-4 py-2 border rounded-xl disabled:opacity-40 hover:bg-gray-100 transition font-medium">
                ← Prev
              </button>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                className="px-4 py-2 border rounded-xl disabled:opacity-40 hover:bg-gray-100 transition font-medium">
                Next →
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
