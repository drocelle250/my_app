import React, { useState } from "react";

export default function ProductForm() {
  const [formData, setFormData] = useState({
    product: "",
    category: "",
    qty: "",
    price: "",
    status: "In Stock",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    console.log("Product Added:", formData);

    // reset form
    setFormData({
      product: "",
      category: "",
      qty: "",
      price: "",
      status: "In Stock",
    });
  };

  return (
    <div className="max-w-md mx-auto mt-10 bg-white shadow-lg rounded-2xl p-6">
      <h2 className="text-xl font-bold mb-4 text-center">
        Add Product
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        
        {/* Product */}
        <input
          type="text"
          name="product"
          placeholder="Product Name"
          value={formData.product}
          onChange={handleChange}
          className="w-full p-2 border rounded-lg"
          required
        />

        {/* Category */}
        <input
          type="text"
          name="category"
          placeholder="Category"
          value={formData.category}
          onChange={handleChange}
          className="w-full p-2 border rounded-lg"
          required
        />

        {/* Quantity */}
        <input
          type="number"
          name="qty"
          placeholder="Quantity"
          value={formData.qty}
          onChange={handleChange}
          className="w-full p-2 border rounded-lg"
          required
        />

        {/* Price */}
        <input
          type="number"
          name="price"
          placeholder="Price"
          value={formData.price}
          onChange={handleChange}
          className="w-full p-2 border rounded-lg"
          required
        />

        {/* Status */}
        <select
          name="status"
          value={formData.status}
          onChange={handleChange}
          className="w-full p-2 border rounded-lg"
        >
          <option>In Stock</option>
          <option>Out of Stock</option>
        </select>

        {/* Button */}
        <button
          type="submit"
          className="w-full bg-blue-500 text-white p-2 rounded-lg hover:bg-blue-600"
        >
          Add Product
        </button>
      </form>
    </div>
  );
}