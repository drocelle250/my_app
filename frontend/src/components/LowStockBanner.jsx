export default function LowStockBanner({ count }) {
  if (count === 0) return null;
  return (
    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
      ⚠️ {count} products have low stock!
    </div>
  );
}

