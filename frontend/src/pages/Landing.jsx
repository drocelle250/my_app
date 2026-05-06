import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import API from "../api";
import useVoiceSearch from "../hooks/useVoiceSearch";

const BACKEND = import.meta.env.VITE_API_URL?.replace("/api", "") || "http://localhost:5000";

function getImg(p) {
  if (p.imageUrl) return BACKEND + p.imageUrl;
  return null;
}

function getCategoryColor(name) {
  if (!name) return { bg: "from-violet-400 to-purple-500", emoji: "📦" };
  const n = name.toLowerCase();
  if (n.includes("electron") || n.includes("tech"))  return { bg: "from-blue-400 to-cyan-500",    emoji: "💻" };
  if (n.includes("food") || n.includes("drink"))     return { bg: "from-green-400 to-emerald-500", emoji: "🍎" };
  if (n.includes("cloth") || n.includes("fashion"))  return { bg: "from-pink-400 to-rose-500",     emoji: "👕" };
  if (n.includes("phone") || n.includes("mobile"))   return { bg: "from-indigo-400 to-blue-500",   emoji: "📱" };
  if (n.includes("book"))                            return { bg: "from-yellow-400 to-orange-400",  emoji: "📚" };
  if (n.includes("sport"))                           return { bg: "from-orange-400 to-red-400",     emoji: "⚽" };
  if (n.includes("home") || n.includes("furniture")) return { bg: "from-teal-400 to-green-500",    emoji: "🏠" };
  if (n.includes("beauty") || n.includes("health"))  return { bg: "from-fuchsia-400 to-pink-500",  emoji: "💄" };
  if (n.includes("toy"))                             return { bg: "from-yellow-300 to-amber-400",   emoji: "🧸" };
  return { bg: "from-violet-400 to-purple-500", emoji: "📦" };
}

export default function Landing() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [voiceFlash, setVoiceFlash] = useState("");

  const voice = useVoiceSearch({
    onResult: (text) => {
      setSearch(text);
      setVoiceFlash(text);
      setTimeout(() => setVoiceFlash(""), 3000);
    },
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPublicData();
  }, []);

  const fetchPublicData = async () => {
    try {
      const [prodRes, catRes] = await Promise.all([
        API.get("/products", { params: { limit: 50 } }),
        API.get("/categories"),
      ]);
      setProducts(prodRes.data.products || []);
      setCategories(catRes.data || []);
    } catch {
      // If backend not running, show empty state gracefully
    } finally {
      setLoading(false);
    }
  };

  const filtered = products.filter((p) => {
    const matchSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.sku && p.sku.toLowerCase().includes(search.toLowerCase()));
    const matchCat = selectedCategory
      ? String(p.categoryId) === String(selectedCategory)
      : true;
    return matchSearch && matchCat;
  });

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ── NAVBAR ── */}
      <nav className="bg-gradient-to-r from-violet-600 to-indigo-500 shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="text-xl font-bold text-white flex items-center gap-2">
            <img src="/logo-icon.svg" alt="SmartStock" className="w-8 h-8" />
            <span className="font-extrabold tracking-tight">
              Smart<span className="text-blue-300">Stock</span>
              <span className="ml-1 text-xs bg-green-500 text-white px-1.5 py-0.5 rounded font-bold align-middle">U.D</span>
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="text-white border border-white/50 hover:bg-white/10 px-4 py-1.5 rounded-lg text-sm font-medium transition"
            >
              Sign In
            </Link>
            <Link
              to="/register"
              className="bg-white text-violet-600 hover:bg-violet-50 px-4 py-1.5 rounded-lg text-sm font-semibold transition shadow"
            >
              Register
            </Link>
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="bg-gradient-to-br from-violet-600 via-indigo-500 to-purple-600 text-white py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="text-6xl mb-4">🛍️</div>
          <h1 className="text-4xl sm:text-5xl font-extrabold mb-4 leading-tight">
            Discover Our Products
          </h1>
          <p className="text-violet-100 text-lg mb-8 max-w-xl mx-auto">
            Browse our full catalog of quality products. Sign in to manage inventory or register for an account.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to="/register"
              className="bg-white text-violet-600 font-bold px-8 py-3 rounded-xl hover:bg-violet-50 transition shadow-lg text-base"
            >
              🚀 Get Started — Register
            </Link>
            <Link
              to="/login"
              className="border-2 border-white text-white font-semibold px-8 py-3 rounded-xl hover:bg-white/10 transition text-base"
            >
              Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* ── STATS BAR ── */}
      {!loading && products.length > 0 && (
        <section className="bg-white border-b shadow-sm">
          <div className="max-w-7xl mx-auto px-4 py-4 flex flex-wrap justify-center gap-8 text-center">
            <div>
              <p className="text-2xl font-bold text-violet-600">{products.length}</p>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Products</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-indigo-600">{categories.length}</p>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Categories</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-green-600">
                {products.filter((p) => p.quantity > 0).length}
              </p>
              <p className="text-xs text-gray-500 uppercase tracking-wide">In Stock</p>
            </div>
          </div>
        </section>
      )}

      {/* ── SEARCH & FILTER ── */}
      <section className="max-w-7xl mx-auto px-4 py-8">

        {/* Voice flash */}
        {voiceFlash && (
          <div className="mb-4 bg-violet-50 border border-violet-200 text-violet-700 rounded-xl px-4 py-2.5 flex items-center gap-2 text-sm shadow-sm">
            <span className="text-lg">🎤</span>
            <span>Voice search: <strong>"{voiceFlash}"</strong></span>
            <button onClick={() => { setVoiceFlash(""); setSearch(""); voice.reset(); }}
              className="ml-auto text-violet-400 hover:text-violet-600">✕</button>
          </div>
        )}
        {voice.error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-600 rounded-xl px-4 py-2.5 flex items-center gap-2 text-sm">
            <span>⚠️ {voice.error}</span>
            <button onClick={voice.reset} className="ml-auto text-red-400 hover:text-red-600">✕</button>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 mb-8">
          {/* Search with voice button */}
          <div className="relative flex-1">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none text-sm">🔍</span>
            <input
              type="text"
              placeholder={voice.listening ? "🎤 Listening..." : "Search products by name or SKU..."}
              value={voice.listening ? voice.transcript || "" : search}
              onChange={(e) => { if (!voice.listening) setSearch(e.target.value); }}
              className={`w-full pl-10 pr-14 py-2.5 border rounded-xl focus:outline-none focus:ring-2 shadow-sm transition ${
                voice.listening
                  ? "border-red-300 ring-2 ring-red-300 bg-red-50 placeholder-red-400"
                  : "border-gray-300 focus:ring-violet-400"
              }`}
            />
            <button
              type="button"
              onClick={voice.listening ? voice.stop : voice.start}
              disabled={!voice.supported}
              title={
                !voice.supported
                  ? "Voice search not supported in this browser"
                  : voice.listening
                  ? "Stop listening"
                  : "Click to search by voice"
              }
              className={`absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg flex items-center justify-center transition text-sm
                ${!voice.supported
                  ? "text-gray-300 cursor-not-allowed"
                  : voice.listening
                  ? "bg-red-500 text-white animate-pulse shadow-md shadow-red-200"
                  : "bg-violet-100 text-violet-600 hover:bg-violet-200"
                }`}
            >
              {voice.listening ? "⏹" : "🎤"}
            </button>
          </div>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="border border-gray-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-violet-400 shadow-sm bg-white min-w-[160px]"
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        {/* Voice hint */}
        {voice.supported && !voice.listening && (
          <p className="text-xs text-gray-400 -mt-5 mb-6 flex items-center gap-1">
            🎤 <span>Try voice search — say <em>"show electronics"</em> or <em>"cheap shoes"</em></span>
          </p>
        )}

        {/* ── PRODUCT GRID ── */}
        {loading ? (
          <div className="text-center py-20 text-gray-400">
            <div className="text-5xl mb-3">⏳</div>
            <p>Loading products...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <div className="text-5xl mb-3">📭</div>
            <p className="text-lg font-medium">No products found</p>
            <p className="text-sm mt-1">Try a different search or category</p>
          </div>
        ) : (
          <>
            <p className="text-sm text-gray-500 mb-4">
              Showing <strong>{filtered.length}</strong> product{filtered.length !== 1 ? "s" : ""}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {filtered.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </>
        )}
      </section>

      {/* ── CTA FOOTER BANNER ── */}
      <section className="bg-gradient-to-r from-violet-600 to-indigo-500 text-white py-14 px-4 mt-10">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-3">Ready to manage your inventory?</h2>
          <p className="text-violet-100 mb-6">
            Create an account to start tracking products, managing stock, and more.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to="/register"
              className="bg-white text-violet-600 font-bold px-8 py-3 rounded-xl hover:bg-violet-50 transition shadow"
            >
              Create Account
            </Link>
            <Link
              to="/login"
              className="border-2 border-white text-white font-semibold px-8 py-3 rounded-xl hover:bg-white/10 transition"
            >
              Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="bg-gray-800 text-gray-400 text-center py-5 text-sm">
        © {new Date().getFullYear()} Inventory Store. All rights reserved.
      </footer>
    </div>
  );
}

function ProductCard({ product: p }) {
  const inStock = p.quantity > 0;
  const isLow = p.quantity > 0 && p.quantity <= (p.lowStockThreshold || 5);
  const img = getImg(p);
  const { bg, emoji } = getCategoryColor(p.category?.name);

  return (
    <div className="bg-white rounded-2xl shadow hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 flex flex-col group">
      {/* Image */}
      <div className="relative h-44 overflow-hidden">
        {img ? (
          <img
            src={img}
            alt={p.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className={`w-full h-full bg-gradient-to-br ${bg} flex items-center justify-center`}>
            <span className="text-5xl drop-shadow">{emoji}</span>
          </div>
        )}
        {!inStock && (
          <span className="absolute top-2 left-2 bg-gray-800/80 text-white text-xs px-2 py-0.5 rounded-full font-semibold backdrop-blur-sm">
            Out of Stock
          </span>
        )}
        {isLow && inStock && (
          <span className="absolute top-2 left-2 bg-orange-500/90 text-white text-xs px-2 py-0.5 rounded-full font-semibold backdrop-blur-sm">
            ⚡ Only {p.quantity} left!
          </span>
        )}
      </div>

      <div className="p-4 flex flex-col flex-1">
        {p.category?.name && (
          <span className="text-xs text-violet-600 font-medium bg-violet-50 px-2 py-0.5 rounded-full self-start mb-2">
            {p.category.name}
          </span>
        )}

        <h3 className="font-semibold text-gray-800 text-base mb-1 line-clamp-2">{p.name}</h3>

        {p.description && (
          <p className="text-xs text-gray-400 mb-2 line-clamp-2">{p.description}</p>
        )}

        <div className="mt-auto pt-3 border-t border-gray-100 flex items-center justify-between">
          <span className="text-lg font-bold text-violet-700">
            ${Number(p.price).toFixed(2)}
          </span>
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
            !inStock ? "bg-gray-100 text-gray-400"
            : isLow  ? "bg-orange-100 text-orange-600"
                     : "bg-green-100 text-green-600"
          }`}>
            {!inStock ? "Out of Stock" : isLow ? `Only ${p.quantity} left` : "In Stock"}
          </span>
        </div>

        <Link
          to="/login"
          className="mt-3 w-full text-center bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white text-sm font-semibold py-2.5 rounded-xl transition shadow"
        >
          🛒 Sign In to Order
        </Link>
      </div>
    </div>
  );
}

function getCategoryEmoji(name) {
  if (!name) return "📦";
  const n = name.toLowerCase();
  if (n.includes("electron")) return "💻";
  if (n.includes("food") || n.includes("drink")) return "🍎";
  if (n.includes("cloth") || n.includes("fashion")) return "👕";
  if (n.includes("phone") || n.includes("mobile")) return "📱";
  if (n.includes("book")) return "📚";
  if (n.includes("sport")) return "⚽";
  if (n.includes("home") || n.includes("furniture")) return "🏠";
  if (n.includes("beauty") || n.includes("health")) return "💄";
  if (n.includes("toy")) return "🧸";
  if (n.includes("tool")) return "🔧";
  return "📦";
}
