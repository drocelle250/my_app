import React from "react";
import { useInventory } from '../hooks/useInventory';
import StatCard from './StatCard';
import LowStockBanner from './LowStockBanner';
import ProductTable from './ProductTable';

export default function Dashboard() {
  const { state } = useInventory();
  
  // Derived values
  const totalProducts = state.products.length;
  const totalValue = state.products.reduce((sum, p) => sum + (p.quantity * p.price), 0);
  const totalCategories = state.categories.length;
  const lowStockCount = state.products.filter(p => p.quantity < 5).length;

  return (
    <div className="max-w-7xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8">Inventory Dashboard</h1>
      
      {lowStockCount > 0 && <LowStockBanner count={lowStockCount} />}
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard title="Total Products" value={totalProducts} color="blue" icon="📦" />
        <StatCard title="Total Value" value={totalValue} color="green" icon="💰" />
        <StatCard title="Categories" value={totalCategories} color="yellow" icon="📂" />
        <StatCard title="Low Stock" value={lowStockCount} color="red" icon="⚠️" />
      </div>
      
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-semibold mb-4">Products</h2>
        <ProductTable />
      </div>
    </div>
  );
}

