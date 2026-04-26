import React, { useState } from 'react';
import { useInventory } from '../hooks/useInventory';

export default function CategoryPage() {
  const { state, dispatch } = useInventory();
  const [newCategoryName, setNewCategoryName] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');

  const handleAdd = (e) => {
    e.preventDefault();
    if (newCategoryName.trim()) {
      dispatch({
        type: 'ADD_CATEGORY',
        payload: { id: Date.now(), name: newCategoryName.trim() }
      });
      setNewCategoryName('');
    }
  };

  const handleEdit = (cat) => {
    setEditingId(cat.id);
    setEditName(cat.name);
  };

  const handleUpdate = (id) => {
    dispatch({
      type: 'EDIT_CATEGORY',
      payload: { id, name: editName.trim() }
    });
    setEditingId(null);
    setEditName('');
  };

  const handleDelete = (id) => {
    if (confirm('Delete category? Products will be uncategorized.')) {
      dispatch({ type: 'DELETE_CATEGORY', payload: id });
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8">Categories</h1>
      
      <form onSubmit={handleAdd} className="mb-8 p-4 bg-gray-50 rounded-lg">
        <div className="flex gap-2">
          <input
            type="text"
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            placeholder="New category name"
            className="flex-1 border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700"
          >
            Add
          </button>
        </div>
      </form>

      <div className="space-y-2">
        {state.categories.map(category => (
          <div key={category.id} className="flex items-center justify-between p-4 bg-white border rounded-lg shadow-sm">
            {editingId === category.id ? (
              <>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="flex-1 border rounded px-3 py-1 mr-2"
                  autoFocus
                />
                <div className="space-x-2">
                  <button
                    onClick={() => handleUpdate(category.id)}
                    className="text-green-600 hover:underline"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => { setEditingId(null); setEditName(''); }}
                    className="text-gray-500 hover:underline"
                  >
                    Cancel
                  </button>
                </div>
              </>
            ) : (
              <>
                <span className="font-medium">{category.name}</span>
                <div className="space-x-2">
                  <button
                    onClick={() => handleEdit(category)}
                    className="text-blue-600 hover:underline"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(category.id)}
                    className="text-red-600 hover:underline"
                  >
                    Delete
                  </button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
      
      {state.categories.length === 0 && (
        <p className="text-gray-500 text-center mt-8">No categories yet. Add one above!</p>
      )}
    </div>
  );
}

