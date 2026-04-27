import React, { useState } from 'react';
import { useInventory } from '../hooks/useInventory';
import { Link } from 'react-router-dom';

function getCategoryName(categories, categoryId) {
  const cat = categories.find(c => c.id === categoryId);
  return cat ? cat.name : 'Uncategorized';
}

export default function ProductTable({ showActions = true }) {
  const { state, dispatch } = useInventory();
  const [localSort, setLocalSort] = useState(state.sort);
  const [localFilter, setLocalFilter] = useState(state.filter);

  // Filter
  const filteredProducts = state.products.filter(p => 
    p.name.toLowerCase().includes(localFilter.toLowerCase()) ||
    getCategoryName(state.categories, p.categoryId).toLowerCase().includes(localFilter.toLowerCase())
  );

  // Sort
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    let aVal, bVal;
    switch (localSort.key) {
      case 'name':
        aVal = a.name; bVal = b.name;
        break;
      case 'quantity':
        aVal = a.quantity; bVal = b.quantity;
        break;
      case 'price':
        aVal = a.price; bVal = b.price;
        break;
      case 'category':
        aVal = getCategoryName(state.categories, a.categoryId);
        bVal = getCategoryName(state.categories, b.categoryId);
        break;
      default:
        return 0;
    }
    if (typeof aVal === 'string') {
      return localSort.dir === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
    }
    return localSort.dir === 'asc' ? aVal - bVal : bVal - aVal;
  });

  const handleSort = (key) => {
    const dir = localSort.key === key && localSort.dir === 'asc' ? 'desc' : 'asc';
    const newSort = { key, dir };
    setLocalSort(newSort);
    dispatch({ type: 'SET_SORT', payload: newSort.key });
  };

  const handleDelete = (id) => {
    if (confirm('Delete this product?')) {
      dispatch({ type: 'DELETE_PRODUCT', payload: id });
    }
  };

  const sortIcon = (key) => {
    if (localSort.key !== key) return '↕️';
    return localSort.dir === 'asc' ? '↑' : '↓';
  };

  return (
    <div className="overflow-x-auto">
      <div className="mb-4">
        <label className="mr-2">Filter:</label>
        <input
          type="text"
          value={localFilter}
          onChange={(e) => setLocalFilter(e.target.value)}
          className="border p-2 rounded"
          placeholder="Search name or category"
        />
      </div>
      <table className="min-w-full bg-white border border-gray-300 rounded-lg shadow-md">
        <thead>
          <tr className="bg-gray-200">
            <th className="px-4 py-2 cursor-pointer" onClick={() => handleSort('name')}>
              Name {sortIcon('name')}
            </th>
            <th className="px-4 py-2 cursor-pointer" onClick={() => handleSort('category')}>
              Category {sortIcon('category')}
            </th>
            <th className="px-4 py-2 cursor-pointer" onClick={() => handleSort('quantity')}>
              Quantity {sortIcon('quantity')}
            </th>
            <th className="px-4 py-2 cursor-pointer" onClick={() => handleSort('price')}>
              Price {sortIcon('price')}
            </th>
            {showActions && <th className="px-4 py-2">Actions</th>}
          </tr>
        </thead>
        <tbody>
          {sortedProducts.map(product => {
            const isLowStock = product.quantity < 5;
            const categoryName = getCategoryName(state.categories, product.categoryId);
            return (
              <tr key={product.id} className="border-t hover:bg-gray-50">
                <td className="px-4 py-2 font-medium">{product.name}</td>
                <td className="px-4 py-2">{categoryName}</td>
                <td className={`px-4 py-2 font-bold ${isLowStock ? 'text-red-600' : ''}`}>
                  {product.quantity}
                </td>
                <td className="px-4 py-2">${product.price.toFixed(2)}</td>
                {showActions && (
                  <td className="px-4 py-2 space-x-2">
                    <Link to={`/products/${product.id}/edit`} className="text-blue-600 hover:underline">Edit</Link>
                    <button onClick={() => handleDelete(product.id)} className="text-red-600 hover:underline">Delete</button>
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
      <p className="mt-2 text-sm text-gray-500">Showing {sortedProducts.length} of {state.products.length} products</p>
    </div>
  );
}

