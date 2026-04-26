import React from "react";
import ProductTable from './ProductTable';

export default function ProductList() {
  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Products</h1>
        <a href="/products/new" className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700">Add New</a>
      </div>
      <ProductTable />
    </div>
  );
}

