import { Link } from "react-router-dom";

export default function Navbar() {
  return (
    <nav className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-4 flex justify-between shadow-lg">
      <h1 className="text-xl font-bold">📦 Inventory Management</h1>
      <div className="space-x-6">
        <Link to="/" className="hover:underline">Dashboard</Link>
        <Link to="/products" className="hover:underline">Products</Link>
        <Link to="/categories" className="hover:underline">Categories</Link>
      </div>
    </nav>
  );
}
