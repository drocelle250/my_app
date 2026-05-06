
import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api";
import { useInventory } from "../hooks/useInventory";
import useVoiceSearch from "../hooks/useVoiceSearch";
import { useToast } from "../components/Toast";
import { ProductGridSkeleton } from "../components/Skeleton";

const BACKEND = import.meta.env.VITE_API_URL?.replace("/api", "") || "http://localhost:5000";

// ─── helpers ────────────────────────────────────────────────────────────────
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

// ─── Main Component ──────────────────────────────────────────────────────────
export default function Shop() {
  const { state } = useInventory();
  const navigate  = useNavigate();
  const toast     = useToast();

  const [products, setProducts]         = useState([]);
  const [categories, setCategories]     = useState([]);
  const [loading, setLoading]           = useState(true);
  const [search, setSearch]             = useState("");
  const [selCategory, setSelCategory]   = useState("");
  const [sortBy, setSortBy]             = useState("default"); // default | price_asc | price_desc | name

  // ── Voice search ──
  const voice = useVoiceSearch({
    onResult: (text) => {
      setSearch(text);
      setVoiceFlash(text);
      setTimeout(() => setVoiceFlash(""), 3000);
    },
  });
  const [voiceFlash, setVoiceFlash] = useState("");
  const [cart, setCart]                 = useState([]);          // [{product, qty}]
  const [cartOpen, setCartOpen]         = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null); // detail modal
  const [orderSuccess, setOrderSuccess] = useState(null);
  const [orderLoading, setOrderLoading] = useState(false);
  const [orderError, setOrderError]     = useState("");
  const [orderNote, setOrderNote]       = useState("");

  useEffect(() => {
    Promise.all([
      API.get("/products", { params: { limit: 100 } }),
      API.get("/categories"),
    ])
      .then(([pr, cr]) => {
        setProducts(pr.data.products || []);
        setCategories(cr.data || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // ── cart helpers ──
  const addToCart = (product, qty = 1) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.product.id === product.id);
      if (existing) {
        const newQty = Math.min(existing.qty + qty, product.quantity);
        return prev.map((i) => i.product.id === product.id ? { ...i, qty: newQty } : i);
      }
      return [...prev, { product, qty: Math.min(qty, product.quantity) }];
    });
    toast.success(`"${product.name}" added to cart!`);
    setCartOpen(true);
  };

  const removeFromCart = (productId) =>
    setCart((prev) => prev.filter((i) => i.product.id !== productId));

  const updateQty = (productId, qty) => {
    if (qty < 1) return removeFromCart(productId);
    setCart((prev) =>
      prev.map((i) =>
        i.product.id === productId
          ? { ...i, qty: Math.min(qty, i.product.quantity) }
          : i
      )
    );
  };

  const cartTotal = cart.reduce((s, i) => s + i.product.price * i.qty, 0);
  const cartCount = cart.reduce((s, i) => s + i.qty, 0);

  // ── place order ──
  const handleCheckout = async () => {
    if (cart.length === 0) return;
    setOrderLoading(true);
    setOrderError("");
    try {
      const res = await API.post("/orders", {
        items: cart.map((i) => ({ productId: i.product.id, quantity: i.qty })),
        note: orderNote,
      });
      setOrderSuccess(res.data);
      setCart([]);
      setCartOpen(false);
      setOrderNote("");
      toast.success(`🎉 Order #${res.data.id} placed! Total: $${Number(res.data.totalAmount).toFixed(2)}`);
    } catch (err) {
      const msg = err.response?.data?.message || "Order failed. Please try again.";
      setOrderError(msg);
      toast.error(msg);
    } finally {
      setOrderLoading(false);
    }
  };

  // ── filter ──
  const filtered = products.filter((p) => {
    const ms = p.name.toLowerCase().includes(search.toLowerCase()) ||
               (p.sku || "").toLowerCase().includes(search.toLowerCase());
    const mc = selCategory ? String(p.categoryId) === String(selCategory) : true;
    return ms && mc;
  }).sort((a, b) => {
    if (sortBy === "price_asc")  return a.price - b.price;
    if (sortBy === "price_desc") return b.price - a.price;
    if (sortBy === "name")       return a.name.localeCompare(b.name);
    return 0; // default: server order
  });

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-violet-50">

      {/* ══ TOP NAV ══ */}
      <nav className="bg-gradient-to-r from-violet-700 via-purple-600 to-indigo-600 shadow-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🛍️</span>
            <div>
              <p className="text-white font-bold text-lg leading-none">Our Store</p>
              <p className="text-violet-200 text-xs">Welcome, {state.user?.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/my-orders")}
              className="text-violet-200 hover:text-white text-sm transition hidden sm:block"
            >
              📋 My Orders
            </button>
            <button
              onClick={() => navigate("/dashboard")}
              className="text-violet-200 hover:text-white text-sm transition hidden sm:block"
            >
              ← Dashboard
            </button>
            {/* Cart button */}
            <button
              onClick={() => setCartOpen(true)}
              className="relative bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-xl font-semibold text-sm transition flex items-center gap-2 border border-white/30"
            >
              🛒 Cart
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold shadow">
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </nav>

      {/* ══ ORDER SUCCESS BANNER ══ */}
      {orderSuccess && (
        <div className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-4 py-4 shadow-lg">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-3xl">🎉</span>
              <div>
                <p className="font-bold text-lg">Order Placed Successfully!</p>
                <p className="text-green-100 text-sm">
                  Order #{orderSuccess.id} · Total: ${Number(orderSuccess.totalAmount).toFixed(2)} · Status: {orderSuccess.status}
                </p>
              </div>
            </div>
            <button onClick={() => setOrderSuccess(null)} className="text-white/70 hover:text-white text-xl">✕</button>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 py-8">

        {/* ══ HERO SEARCH BAR ══ */}
        <div className="bg-gradient-to-r from-violet-600 to-indigo-600 rounded-3xl p-8 mb-8 text-white shadow-2xl">
          <h1 className="text-3xl font-extrabold mb-1">Browse Our Products</h1>
          <p className="text-violet-200 mb-5 text-sm">Find what you need, add to cart, and order instantly</p>

          {/* Voice flash banner */}
          {voiceFlash && (
            <div className="mb-3 bg-white/20 backdrop-blur-sm border border-white/30 rounded-xl px-4 py-2 flex items-center gap-2 text-sm">
              <span className="text-lg">🎤</span>
              <span>Searching for: <strong>"{voiceFlash}"</strong></span>
            </div>
          )}
          {voice.error && (
            <div className="mb-3 bg-red-500/20 border border-red-300/40 rounded-xl px-4 py-2 flex items-center gap-2 text-sm">
              <span>⚠️</span>
              <span>{voice.error}</span>
              <button onClick={voice.reset} className="ml-auto text-white/70 hover:text-white">✕</button>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search input with voice button */}
            <div className="relative flex-1">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">🔍</span>
              <input
                type="text"
                placeholder={voice.listening ? "🎤 Listening..." : "Search products..."}
                value={voice.listening ? voice.transcript || "" : search}
                onChange={(e) => { if (!voice.listening) setSearch(e.target.value); }}
                className={`w-full pl-10 pr-14 py-3 rounded-xl text-gray-800 focus:outline-none focus:ring-2 shadow transition ${
                  voice.listening
                    ? "ring-2 ring-red-400 bg-red-50 placeholder-red-400"
                    : "focus:ring-white/50"
                }`}
              />
              {/* Voice button inside input */}
              <button
                type="button"
                onClick={voice.listening ? voice.stop : voice.start}
                title={
                  !voice.supported
                    ? "Voice search not supported in this browser"
                    : voice.listening
                    ? "Stop listening"
                    : "Search by voice"
                }
                disabled={!voice.supported}
                className={`absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg flex items-center justify-center transition text-base
                  ${!voice.supported
                    ? "text-gray-300 cursor-not-allowed"
                    : voice.listening
                    ? "bg-red-500 text-white animate-pulse shadow-lg shadow-red-300"
                    : "bg-violet-100 text-violet-600 hover:bg-violet-200"
                  }`}
              >
                {voice.listening ? "⏹" : "🎤"}
              </button>
            </div>

            <select
              value={selCategory}
              onChange={(e) => setSelCategory(e.target.value)}
              className="px-4 py-3 rounded-xl text-gray-800 focus:outline-none focus:ring-2 focus:ring-white/50 shadow min-w-[160px]"
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-3 rounded-xl text-gray-800 focus:outline-none focus:ring-2 focus:ring-white/50 shadow min-w-[150px]"
            >
              <option value="default">Sort: Default</option>
              <option value="price_asc">Price: Low → High</option>
              <option value="price_desc">Price: High → Low</option>
              <option value="name">Name: A → Z</option>
            </select>
          </div>

          {/* Voice hint */}
          {voice.supported && !voice.listening && (
            <p className="text-violet-200 text-xs mt-3 flex items-center gap-1">
              🎤 <span>Click the mic to search by voice — try <em>"show me electronics"</em> or <em>"cheap shoes"</em></span>
            </p>
          )}
        </div>

        {/* ══ CATEGORY PILLS ══ */}
        {categories.length > 0 && (
          <div className="flex gap-2 flex-wrap mb-6">
            <button
              onClick={() => setSelCategory("")}
              className={`px-4 py-1.5 rounded-full text-sm font-semibold transition border ${
                selCategory === ""
                  ? "bg-violet-600 text-white border-violet-600 shadow"
                  : "bg-white text-gray-600 border-gray-200 hover:border-violet-400 hover:text-violet-600"
              }`}
            >
              All
            </button>
            {categories.map((c) => {
              const { emoji } = getCategoryColor(c.name);
              return (
                <button
                  key={c.id}
                  onClick={() => setSelCategory(String(c.id))}
                  className={`px-4 py-1.5 rounded-full text-sm font-semibold transition border ${
                    selCategory === String(c.id)
                      ? "bg-violet-600 text-white border-violet-600 shadow"
                      : "bg-white text-gray-600 border-gray-200 hover:border-violet-400 hover:text-violet-600"
                  }`}
                >
                  {emoji} {c.name}
                </button>
              );
            })}
          </div>
        )}

        {/* ══ PRODUCT GRID ══ */}
        {loading ? (
          <ProductGridSkeleton count={8} />
        ) : filtered.length === 0 ? (
          <div className="text-center py-24 animate-fade-in">
            <div className="text-6xl mb-4">📭</div>
            <p className="text-gray-500 text-lg font-medium">No products found</p>
            <p className="text-gray-400 text-sm mt-1">Try a different search or category</p>
          </div>
        ) : (
          <div className="animate-fade-in">
            <p className="text-sm text-gray-500 mb-4">
              <strong className="text-violet-600">{filtered.length}</strong> product{filtered.length !== 1 ? "s" : ""} found
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {filtered.map((p) => (
                <ProductCard
                  key={p.id}
                  product={p}
                  onAddToCart={addToCart}
                  onViewDetail={() => navigate(`/shop/product/${p.id}`)}
                  cartQty={cart.find((i) => i.product.id === p.id)?.qty || 0}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ══ CART SIDEBAR ══ */}
      {cartOpen && (
        <CartSidebar
          cart={cart}
          total={cartTotal}
          note={orderNote}
          onNoteChange={setOrderNote}
          onUpdateQty={updateQty}
          onRemove={removeFromCart}
          onClose={() => setCartOpen(false)}
          onCheckout={handleCheckout}
          loading={orderLoading}
          error={orderError}
        />
      )}

      {/* ══ PRODUCT DETAIL MODAL ══ */}
      {selectedProduct && (
        <ProductModal
          product={selectedProduct}
          cartQty={cart.find((i) => i.product.id === selectedProduct.id)?.qty || 0}
          onAddToCart={addToCart}
          onClose={() => setSelectedProduct(null)}
        />
      )}

      {/* ══ AI CHATBOT ══ */}
      <ChatBot onAddToCart={addToCart} cart={cart} />
    </div>
  );
}

// ─── Product Card ─────────────────────────────────────────────────────────────
function ProductCard({ product: p, onAddToCart, onViewDetail, cartQty }) {
  const inStock = p.quantity > 0;
  const isLow   = inStock && p.quantity <= (p.lowStockThreshold || 5);
  const img     = getImg(p);
  const { bg, emoji } = getCategoryColor(p.category?.name);

  return (
    <div className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col group border border-gray-100">

      {/* Image */}
      <div
        className="relative h-48 cursor-pointer overflow-hidden"
        onClick={onViewDetail}
      >
        {img ? (
          <img
            src={img}
            alt={p.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className={`w-full h-full bg-gradient-to-br ${bg} flex items-center justify-center`}>
            <span className="text-6xl drop-shadow">{emoji}</span>
          </div>
        )}

        {/* Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {!inStock && (
            <span className="bg-gray-800/80 text-white text-xs px-2 py-0.5 rounded-full font-semibold backdrop-blur-sm">
              Out of Stock
            </span>
          )}
          {isLow && (
            <span className="bg-orange-500/90 text-white text-xs px-2 py-0.5 rounded-full font-semibold backdrop-blur-sm">
              ⚡ Only {p.quantity} left!
            </span>
          )}
        </div>

        {/* Cart badge */}
        {cartQty > 0 && (
          <div className="absolute top-2 right-2 bg-violet-600 text-white text-xs w-6 h-6 rounded-full flex items-center justify-center font-bold shadow-lg">
            {cartQty}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-4 flex flex-col flex-1">
        {p.category?.name && (
          <span className="text-xs font-semibold text-violet-600 bg-violet-50 px-2 py-0.5 rounded-full self-start mb-2">
            {p.category.name}
          </span>
        )}

        <h3
          className="font-bold text-gray-800 text-base mb-1 line-clamp-2 cursor-pointer hover:text-violet-600 transition"
          onClick={onViewDetail}
        >
          {p.name}
        </h3>

        {p.description && (
          <p className="text-xs text-gray-400 line-clamp-2 mb-2">{p.description}</p>
        )}

        <div className="mt-auto pt-3 border-t border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <span className="text-2xl font-extrabold text-violet-700">
              ${Number(p.price).toFixed(2)}
            </span>
            <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
              !inStock ? "bg-gray-100 text-gray-400"
              : isLow  ? "bg-orange-100 text-orange-600"
                       : "bg-green-100 text-green-600"
            }`}>
              {!inStock ? "Unavailable" : isLow ? "Low Stock" : "✓ In Stock"}
            </span>
          </div>

          <button
            disabled={!inStock}
            onClick={() => onAddToCart(p)}
            className={`w-full py-2.5 rounded-xl font-bold text-sm transition ${
              !inStock
                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                : cartQty > 0
                ? "bg-violet-100 text-violet-700 hover:bg-violet-200 border-2 border-violet-300"
                : "bg-gradient-to-r from-violet-600 to-indigo-600 text-white hover:from-violet-700 hover:to-indigo-700 shadow-md hover:shadow-lg"
            }`}
          >
            {!inStock ? "Out of Stock" : cartQty > 0 ? `🛒 In Cart (${cartQty})` : "🛒 Add to Cart"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Cart Sidebar ─────────────────────────────────────────────────────────────
function CartSidebar({ cart, total, note, onNoteChange, onUpdateQty, onRemove, onClose, onCheckout, loading, error }) {
  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm" onClick={onClose} />

      {/* Drawer */}
      <div className="fixed right-0 top-0 h-full w-full max-w-md bg-white z-50 shadow-2xl flex flex-col">

        {/* Header */}
        <div className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold">🛒 Your Cart</h2>
            <p className="text-violet-200 text-xs">{cart.length} item{cart.length !== 1 ? "s" : ""}</p>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white text-2xl transition">✕</button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {cart.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <div className="text-5xl mb-3">🛒</div>
              <p className="font-medium">Your cart is empty</p>
              <p className="text-sm mt-1">Add some products to get started</p>
            </div>
          ) : (
            cart.map(({ product: p, qty }) => {
              const img = getImg(p);
              const { bg, emoji } = getCategoryColor(p.category?.name);
              return (
                <div key={p.id} className="flex items-center gap-3 bg-gray-50 rounded-xl p-3 border border-gray-100">
                  {/* Thumbnail */}
                  <div className="w-14 h-14 rounded-lg overflow-hidden flex-shrink-0">
                    {img ? (
                      <img src={img} alt={p.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className={`w-full h-full bg-gradient-to-br ${bg} flex items-center justify-center text-2xl`}>
                        {emoji}
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-800 text-sm truncate">{p.name}</p>
                    <p className="text-violet-600 font-bold text-sm">${Number(p.price).toFixed(2)}</p>
                    <p className="text-gray-400 text-xs">Subtotal: ${(p.price * qty).toFixed(2)}</p>
                  </div>

                  {/* Qty controls */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button onClick={() => onUpdateQty(p.id, qty - 1)}
                      className="w-7 h-7 rounded-lg bg-gray-200 hover:bg-red-100 hover:text-red-600 font-bold text-sm transition flex items-center justify-center">
                      −
                    </button>
                    <span className="w-7 text-center font-bold text-sm">{qty}</span>
                    <button onClick={() => onUpdateQty(p.id, qty + 1)}
                      disabled={qty >= p.quantity}
                      className="w-7 h-7 rounded-lg bg-gray-200 hover:bg-green-100 hover:text-green-600 font-bold text-sm transition flex items-center justify-center disabled:opacity-40">
                      +
                    </button>
                    <button onClick={() => onRemove(p.id)}
                      className="w-7 h-7 rounded-lg bg-red-50 hover:bg-red-100 text-red-400 hover:text-red-600 text-sm transition flex items-center justify-center ml-1">
                      🗑
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        {cart.length > 0 && (
          <div className="border-t bg-white p-4 space-y-3">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-3 py-2 rounded-lg text-sm">
                ❌ {error}
              </div>
            )}

            <textarea
              value={note}
              onChange={(e) => onNoteChange(e.target.value)}
              placeholder="Add a note to your order (optional)..."
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm resize-none h-16 focus:outline-none focus:ring-2 focus:ring-violet-400"
            />

            <div className="flex items-center justify-between text-lg font-bold text-gray-800">
              <span>Total</span>
              <span className="text-violet-700 text-2xl">${total.toFixed(2)}</span>
            </div>

            <button
              onClick={onCheckout}
              disabled={loading}
              className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 text-white py-3.5 rounded-xl font-bold text-base hover:from-violet-700 hover:to-indigo-700 transition disabled:opacity-50 shadow-lg"
            >
              {loading ? "⏳ Placing Order..." : "✅ Place Order"}
            </button>
          </div>
        )}
      </div>
    </>
  );
}

// ─── Product Detail Modal ─────────────────────────────────────────────────────
function ProductModal({ product: p, cartQty, onAddToCart, onClose }) {
  const [qty, setQty] = useState(1);
  const inStock = p.quantity > 0;
  const img = getImg(p);
  const { bg, emoji } = getCategoryColor(p.category?.name);

  return (
    <>
      <div className="fixed inset-0 bg-black/60 z-40 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden">

          {/* Image */}
          <div className="relative h-64">
            {img ? (
              <img src={img} alt={p.name} className="w-full h-full object-cover" />
            ) : (
              <div className={`w-full h-full bg-gradient-to-br ${bg} flex items-center justify-center`}>
                <span className="text-8xl drop-shadow">{emoji}</span>
              </div>
            )}
            <button onClick={onClose}
              className="absolute top-3 right-3 bg-black/40 hover:bg-black/60 text-white w-9 h-9 rounded-full flex items-center justify-center text-lg transition backdrop-blur-sm">
              ✕
            </button>
            {p.category?.name && (
              <span className="absolute bottom-3 left-3 bg-white/90 text-violet-700 text-xs font-bold px-3 py-1 rounded-full backdrop-blur-sm">
                {p.category.name}
              </span>
            )}
          </div>

          {/* Details */}
          <div className="p-6">
            <h2 className="text-2xl font-extrabold text-gray-800 mb-1">{p.name}</h2>
            <p className="text-gray-400 text-xs mb-3">SKU: {p.sku}</p>

            {p.description && (
              <p className="text-gray-600 text-sm mb-4 leading-relaxed">{p.description}</p>
            )}

            <div className="flex items-center justify-between mb-5">
              <span className="text-3xl font-extrabold text-violet-700">
                ${Number(p.price).toFixed(2)}
              </span>
              <span className={`text-sm font-semibold px-3 py-1 rounded-full ${
                !inStock ? "bg-gray-100 text-gray-400"
                : p.quantity <= (p.lowStockThreshold || 5) ? "bg-orange-100 text-orange-600"
                : "bg-green-100 text-green-600"
              }`}>
                {!inStock ? "Out of Stock" : `${p.quantity} in stock`}
              </span>
            </div>

            {inStock && (
              <div className="flex items-center gap-3 mb-4">
                <span className="text-sm font-medium text-gray-600">Quantity:</span>
                <div className="flex items-center gap-2">
                  <button onClick={() => setQty(q => Math.max(1, q - 1))}
                    className="w-9 h-9 rounded-xl bg-gray-100 hover:bg-gray-200 font-bold text-lg transition flex items-center justify-center">
                    −
                  </button>
                  <span className="w-10 text-center font-bold text-lg">{qty}</span>
                  <button onClick={() => setQty(q => Math.min(p.quantity, q + 1))}
                    className="w-9 h-9 rounded-xl bg-gray-100 hover:bg-gray-200 font-bold text-lg transition flex items-center justify-center">
                    +
                  </button>
                </div>
                <span className="text-sm text-gray-400">= ${(p.price * qty).toFixed(2)}</span>
              </div>
            )}

            <button
              disabled={!inStock}
              onClick={() => { onAddToCart(p, qty); onClose(); }}
              className={`w-full py-3.5 rounded-xl font-bold text-base transition ${
                !inStock
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : "bg-gradient-to-r from-violet-600 to-indigo-600 text-white hover:from-violet-700 hover:to-indigo-700 shadow-lg"
              }`}
            >
              {!inStock ? "Out of Stock" : `🛒 Add ${qty} to Cart — $${(p.price * qty).toFixed(2)}`}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// ─── AI ChatBot Widget ────────────────────────────────────────────────────────
const QUICK_REPLIES = [
  { label: "🏆 Popular",       msg: "what's popular?" },
  { label: "💰 Cheapest",      msg: "show cheapest products" },
  { label: "💎 Premium",       msg: "show premium products" },
  { label: "📦 All products",  msg: "show all products" },
  { label: "❓ Help",          msg: "help" },
];

function ChatBot({ onAddToCart, cart }) {
  const [open, setOpen]         = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      from: "bot",
      type: "text",
      text: "👋 Hi! I'm your shopping assistant.\n\nAsk me to find products, filter by price, or get recommendations!",
      products: [],
    },
  ]);
  const [input, setInput]       = useState("");
  const [loading, setLoading]   = useState(false);
  const [unread, setUnread]     = useState(0);
  const bottomRef               = useRef(null);
  const inputRef                = useRef(null);

  // Auto-scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100);
      setUnread(0);
    }
  }, [open]);

  const sendMessage = async (text) => {
    const userMsg = text || input.trim();
    if (!userMsg || loading) return;
    setInput("");

    // Add user message
    const userBubble = { id: Date.now(), from: "user", type: "text", text: userMsg, products: [] };
    setMessages((prev) => [...prev, userBubble]);
    setLoading(true);

    try {
      const res = await API.post("/ai/chat", { message: userMsg });
      const botBubble = {
        id: Date.now() + 1,
        from: "bot",
        type: res.data.type,
        text: res.data.text,
        products: res.data.products || [],
        total: res.data.total,
      };
      setMessages((prev) => [...prev, botBubble]);
      if (!open) setUnread((n) => n + 1);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          from: "bot",
          type: "text",
          text: "❌ Sorry, I'm having trouble right now. Please try again.",
          products: [],
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Parse **bold** markdown in text
  const renderText = (text) => {
    const parts = text.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((part, i) =>
      part.startsWith("**") && part.endsWith("**")
        ? <strong key={i}>{part.slice(2, -2)}</strong>
        : part.split("\n").map((line, j) => (
            <span key={`${i}-${j}`}>{line}{j < part.split("\n").length - 1 && <br />}</span>
          ))
    );
  };

  return (
    <>
      {/* ── Floating Button ── */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-gradient-to-br from-violet-600 to-indigo-600 text-white rounded-full shadow-2xl flex items-center justify-center text-2xl hover:scale-110 transition-transform"
        title="Chat with AI Assistant"
      >
        {open ? "✕" : "🤖"}
        {!open && unread > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold shadow">
            {unread}
          </span>
        )}
      </button>

      {/* ── Chat Window ── */}
      {open && (
        <div className="fixed bottom-24 right-6 z-50 w-96 max-w-[calc(100vw-2rem)] bg-white rounded-3xl shadow-2xl border border-gray-100 flex flex-col overflow-hidden"
          style={{ height: "520px" }}>

          {/* Header */}
          <div className="bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-3 flex items-center gap-3">
            <div className="w-9 h-9 bg-white/20 rounded-full flex items-center justify-center text-xl">🤖</div>
            <div className="flex-1">
              <p className="text-white font-bold text-sm leading-none">Shopping Assistant</p>
              <p className="text-violet-200 text-xs mt-0.5 flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-green-400 rounded-full inline-block" />
                Online · AI-powered
              </p>
            </div>
            <button onClick={() => setOpen(false)} className="text-white/60 hover:text-white text-lg transition">✕</button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.from === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[85%] ${msg.from === "user" ? "" : "w-full"}`}>

                  {/* Text bubble */}
                  <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                    msg.from === "user"
                      ? "bg-gradient-to-br from-violet-600 to-indigo-600 text-white rounded-br-sm"
                      : "bg-white text-gray-800 shadow-sm border border-gray-100 rounded-bl-sm"
                  }`}>
                    {renderText(msg.text)}
                  </div>

                  {/* Product cards from bot */}
                  {msg.from === "bot" && msg.products?.length > 0 && (
                    <div className="mt-2 space-y-2">
                      {msg.products.map((p) => (
                        <ChatProductCard
                          key={p.id}
                          product={p}
                          onAddToCart={onAddToCart}
                          inCart={cart.some((i) => i.product.id === p.id)}
                        />
                      ))}
                      {msg.total > msg.products.length && (
                        <p className="text-xs text-gray-400 text-center pt-1">
                          Showing {msg.products.length} of {msg.total} results
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Typing indicator */}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-white border border-gray-100 shadow-sm px-4 py-3 rounded-2xl rounded-bl-sm flex items-center gap-1">
                  <span className="w-2 h-2 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-2 h-2 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-2 h-2 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Quick replies */}
          <div className="px-3 py-2 bg-white border-t border-gray-100 flex gap-1.5 overflow-x-auto scrollbar-hide">
            {QUICK_REPLIES.map((q) => (
              <button
                key={q.msg}
                onClick={() => sendMessage(q.msg)}
                disabled={loading}
                className="flex-shrink-0 text-xs bg-violet-50 hover:bg-violet-100 text-violet-700 border border-violet-200 px-3 py-1.5 rounded-full font-medium transition disabled:opacity-50"
              >
                {q.label}
              </button>
            ))}
          </div>

          {/* Input */}
          <div className="px-3 pb-3 pt-2 bg-white border-t border-gray-100">
            <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-2xl px-3 py-2 focus-within:border-violet-400 focus-within:ring-2 focus-within:ring-violet-100 transition">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKey}
                placeholder="Ask me anything..."
                disabled={loading}
                className="flex-1 bg-transparent text-sm text-gray-800 placeholder-gray-400 focus:outline-none disabled:opacity-50"
              />
              <button
                onClick={() => sendMessage()}
                disabled={!input.trim() || loading}
                className="w-8 h-8 bg-gradient-to-br from-violet-600 to-indigo-600 text-white rounded-xl flex items-center justify-center text-sm font-bold disabled:opacity-40 hover:scale-105 transition-transform flex-shrink-0"
              >
                ➤
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ─── Chat Product Card ────────────────────────────────────────────────────────
function ChatProductCard({ product: p, onAddToCart, inCart }) {
  const img = p.imageUrl ? (import.meta.env.VITE_API_URL?.replace("/api", "") || "http://localhost:5000") + p.imageUrl : null;
  const { bg, emoji } = getCategoryColor(p.category);

  return (
    <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden flex items-center gap-3 p-2.5 hover:border-violet-200 transition">
      {/* Thumbnail */}
      <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
        {img
          ? <img src={img} alt={p.name} className="w-full h-full object-cover" />
          : <div className={`w-full h-full bg-gradient-to-br ${bg} flex items-center justify-center text-xl`}>{emoji}</div>
        }
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-gray-800 text-xs truncate">{p.name}</p>
        <p className="text-xs text-gray-400">{p.category}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-violet-700 font-bold text-sm">${p.price.toFixed(2)}</span>
          <span className={`text-xs ${p.inStock ? "text-green-600" : "text-gray-400"}`}>
            {p.stockLabel}
          </span>
        </div>
      </div>

      {/* Add to cart */}
      <button
        disabled={!p.inStock}
        onClick={() => onAddToCart({ ...p, category: { name: p.category } })}
        className={`flex-shrink-0 text-xs font-bold px-2.5 py-1.5 rounded-lg transition ${
          !p.inStock
            ? "bg-gray-100 text-gray-400 cursor-not-allowed"
            : inCart
            ? "bg-violet-100 text-violet-700 border border-violet-300"
            : "bg-gradient-to-r from-violet-600 to-indigo-600 text-white hover:from-violet-700 hover:to-indigo-700"
        }`}
      >
        {!p.inStock ? "—" : inCart ? "✓" : "🛒"}
      </button>
    </div>
  );
}
