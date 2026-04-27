import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useInventory } from '../hooks/useInventory';

export default function ProductForm() {
  const { state, dispatch } = useInventory();
  const { id: editId } = useParams();
  const navigate = useNavigate();
  const isEdit = !!editId;
  const editingProduct = state.products.find(p => p.id === parseInt(editId));

  const [formData, setFormData] = useState({
    name: '',
    categoryId: '',
    quantity: '',
    price: ''
  });

  useEffect(() => {
    if (isEdit && editingProduct) {
      setFormData({
        name: editingProduct.name,
        categoryId: editingProduct.categoryId || '',
        quantity: editingProduct.quantity.toString(),
        price: editingProduct.price.toString()
      });
    } else {
      setFormData({
        name: '',
        categoryId: '',
        quantity: '',
        price: ''
      });
    }
  }, [editId, editingProduct, isEdit]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const numId = Date.now();
    const productData = {
      ...formData,
      id: isEdit ? parseInt(editId) : numId,
      quantity: parseInt(formData.quantity),
      price: parseFloat(formData.price)
    };
    if (isEdit) {
      dispatch({ type: 'EDIT_PRODUCT', payload: productData });
    } else {
      dispatch({ type: 'ADD_PRODUCT', payload: productData });
    }
    navigate('/products');
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
      <Link to="/products" className="inline-block mb-6 text-blue-600 hover:underline">&larr; Back to Products</Link>
      <h1 className="text-2xl font-bold mb-6">{isEdit ? 'Edit Product' : 'Add New Product'}</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Name</label>
          <input
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Category</label>
          <select
            name="categoryId"
            value={formData.categoryId}
            onChange={handleChange}
            required
            className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select Category</option>
            {state.categories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Quantity</label>
          <input
            type="number"
            name="quantity"
            value={formData.quantity}
            onChange={handleChange}
            min="0"
            required
            className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Price</label>
          <input
            type="number"
            name="price"
            value={formData.price}
            onChange={handleChange}
            min="0"
            step="0.01"
            required
            className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 font-medium"
        >
          {isEdit ? 'Update Product' : 'Add Product'}
        </button>
      </form>
    </div>
  );
}

