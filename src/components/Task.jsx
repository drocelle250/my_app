import React, { useReducer, useEffect, useState } from "react";

// ---------------- REDUCER ----------------
const initialState = {
  products: JSON.parse(localStorage.getItem("products")) || [
    { id: 1, name: "Laptop", category: "Electronics", quantity: 10, price: 800 },
    { id: 2, name: "USB Cable", category: "Accessories", quantity: 3, price: 10 },
  ],
};

function reducer(state, action) {
  switch (action.type) {
    case "ADD_PRODUCT":
      return { ...state, products: [...state.products, action.payload] };

    case "DELETE_PRODUCT":
      return {
        ...state,
        products: state.products.filter((p) => p.id !== action.payload),
      };

    default:
      return state;
  }
}

// ---------------- APP ----------------
export default function App() {
  const [state, dispatch] = useReducer(reducer, initialState);

  const [form, setForm] = useState({
    name: "",
    category: "",
    quantity: "",
    price: "",
  });

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem("products", JSON.stringify(state.products));
  }, [state.products]);

  // ---------------- FUNCTIONS ----------------
  const addProduct = () => {
    if (!form.name || !form.category) return;

    const newProduct = {
      id: Date.now(),
      name: form.name,
      category: form.category,
      quantity: Number(form.quantity),
      price: Number(form.price),
    };

    dispatch({ type: "ADD_PRODUCT", payload: newProduct });

    setForm({ name: "", category: "", quantity: "", price: "" });
  };

  const deleteProduct = (id) => {
    if (window.confirm("Delete this product?")) {
      dispatch({ type: "DELETE_PRODUCT", payload: id });
    }
  };

  // ---------------- CALCULATIONS ----------------
  const totalProducts = state.products.length;

  const totalValue = state.products.reduce(
    (acc, p) => acc + p.price * p.quantity,
    0
  );

  const categories = new Set(state.products.map((p) => p.category)).size;

  const lowStock = state.products.filter((p) => p.quantity < 5).length;

  // ---------------- UI ----------------
  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      {/* HEADER */}
      <header className="flex justify-between items-center bg-blue-900 p-4 rounded-xl text-white">
        <h1 className="text-xl font-bold">🛑 Inventory System</h1>
      </header>

      {/* ALERT */}
      {lowStock > 0 && (
        <div className="bg-red-100 text-red-700 p-3 mt-4 rounded">
          ⚠ {lowStock} products have low stock!
        </div>
      )}

      {/* STATS */}
      <div className="grid grid-cols-4 gap-4 mt-6">
        <div className="bg-blue-200 p-4 rounded text-center">
          <p>Total Products</p>
          <h1 className="text-3xl font-bold">{totalProducts}</h1>
        </div>

        <div className="bg-green-200 p-4 rounded text-center">
          <p>Total Value</p>
          <h1 className="text-3xl font-bold">${totalValue}</h1>
        </div>

        <div className="bg-yellow-200 p-4 rounded text-center">
          <p>Categories</p>
          <h1 className="text-3xl font-bold">{categories}</h1>
        </div>

        <div className="bg-red-200 p-4 rounded text-center">
          <p>Low Stock</p>
          <h1 className="text-3xl font-bold">{lowStock}</h1>
        </div>
      </div>

      {/* FORM */}
      <div className="bg-white p-4 mt-6 rounded shadow">
        <h2 className="font-bold mb-2">Add Product</h2>

        <div className="grid grid-cols-4 gap-2">
          <input
            placeholder="Name"
            className="border p-2"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />

          <input
            placeholder="Category"
            className="border p-2"
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
          />

          <input
            placeholder="Qty"
            type="number"
            className="border p-2"
            value={form.quantity}
            onChange={(e) => setForm({ ...form, quantity: e.target.value })}
          />

          <input
            placeholder="Price"
            type="number"
            className="border p-2"
            value={form.price}
            onChange={(e) => setForm({ ...form, price: e.target.value })}
          />
        </div>

        <button
          onClick={addProduct}
          className="mt-3 bg-blue-600 text-white px-4 py-2 rounded"
        >
          + Add Product
        </button>
      </div>

      {/* TABLE */}
      <div className="bg-white mt-6 rounded shadow overflow-hidden">
        <table className="w-full text-center">
          <thead className="bg-gray-200">
            <tr>
              <th>PRODUCT</th>
              <th>CATEGORY</th>
              <th>QTY</th>
              <th>PRICE</th>
              <th>STATUS</th>
              <th>ACTION</th>
            </tr>
          </thead>

          <tbody>
            {state.products.map((p) => (
              <tr
                key={p.id}
                className={p.quantity < 5 ? "bg-red-50" : ""}
              >
                <td>{p.name}</td>
                <td>{p.category}</td>
                <td
                  className={
                    p.quantity < 5 ? "text-red-600 font-bold" : ""
                  }
                >
                  {p.quantity}
                </td>
                <td>${p.price}</td>

                <td>
                  <span
                    className={`px-2 py-1 rounded text-sm ${
                      p.quantity < 5
                        ? "bg-red-200 text-red-700"
                        : "bg-green-200 text-green-700"
                    }`}
                  >
                    {p.quantity < 5 ? "Low Stock" : "In Stock"}
                  </span>
                </td>

                <td>
                  <div className="flex justify-center gap-2">
                    <button className="bg-blue-500 text-white px-2 py-1 rounded text-xs">
                      ✏️
                    </button>

                    <button
                      onClick={() => deleteProduct(p.id)}
                      className="bg-red-500 text-white px-2 py-1 rounded text-xs"
                    >
                      🗑️
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}