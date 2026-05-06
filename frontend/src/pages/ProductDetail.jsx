import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API from "../api";
import { useInventory } from "../hooks/useInventory";
import { ProductGridSkeleton } from "../components/Skeleton";
import { useToast } from "../components/Toast";

const BACKEND = import.meta.env.VITE_API_URL?.replace("/api", "") || "http://localhost:5000";

function getImg(p) {
  if (p?.imageUrl) return BACKEND + p.imageUrl;
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

export default function ProductDetail() {
  const { id }    = useParams();
  const navigate  = useNavigate();
  const toast     = useToast();
  const { state } = useInventory();

  const [product,  setProduct]  = useState(null);
  const [related,  setRelated]  = useState({ sameCategory: [], priceSimilar: [], topSelling: [], all: [] });
  const [loading,  setLoading]  = useState(true);
  const [relLoading, setRelLoading] = useState(true);
  const [qty,      setQty]      = useState(1);
  const [mediaTab, setMediaTab] = useState("image");
  const [cart,     setCart]     = useState(() => {
    try { return JSON.parse(sessionStorage.getItem("shop_cart") || "[]"); }
    catch { return []; }
  });

  // ── Load product + recommendations ─────────────────────────────────────────
  useEffect(() => {
    setLoading(true);
    setRelLoading(true);
    setQty(1);
    setMediaTab("image");

    // Load product and recommendations in parallel
    Promise.all([
      API.get(`/products/${id}`),
      API.get(`/products/${id}/recommendations`),
    ])
      .then(([prodRes, recRes]) => {
        setProduct(prodRes.data);
        const recs = recRes.data.recommendations || {};
        // Merge all recommendation lists, deduplicated
        const seen = new Set([Number(id)]);
        const merge = (...lists) => lists.flat().filter((p) => {
          if (seen.has(p.id)) return false;
          seen.add(p.id);
          return true;
        });
        setRelated({
          sameCategory: recs.sameCategory || [],
          priceSimilar: recs.priceSimilar || [],
          topSelling:   recs.topSelling   || [],
          all:          merge(recs.sameCategory || [], recs.priceSimilar || [], recs.topSelling || []),
        });
      })
      .catch(() => { toast.error("Product not found"); navigate("/shop"); })
      .finally(() => { setLoading(false); setRelLoading(false); });
  }, [id]);

  // ── Sync cart to sessionStorage ─────────────────────────────────────────────
  useEffect(() => {
    sessionStorage.setItem("shop_cart", JSON.stringify(cart));
  }, [cart]);

  const addToCart = (p, quantity = 1) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.product.id === p.id);
      if (existing) {
        return prev.map((i) =>
          i.product.id === p.id
            ? { ...i, qty: Math.min(i.qty + quantity, p.quantity) }
            : i
        );
      }
      return [...prev, { product: p, qty: Math.min(quantity, p.quantity) }];
    });
    toast.success(`"${p.name}" added to cart!`);
  };

  const cartQty = cart.find((i) => i.product.id === product?.id)?.qty || 0;
  const cartCount = cart.reduce((s, i) => s + i.qty, 0);

  // ── Recommendation lists from API ──────────────────────────────────────────
  const sameCategoryRecs = related?.sameCategory || [];
  const priceSimilarRecs = related?.priceSimilar || [];
  const topSellingRecs   = related?.topSelling   || [];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-violet-50">
        <ShopNav cartCount={cartCount} onBack={() => navigate("/shop")} onCart={() => navigate("/shop")} />
        <div className="max-w-6xl mx-auto px-4 py-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            <div className="skeleton h-96 rounded-3xl" />
            <div className="space-y-4">
              <div className="skeleton h-8 w-3/4 rounded-xl" />
              <div className="skeleton h-4 w-1/3 rounded-xl" />
              <div className="skeleton h-20 w-full rounded-xl" />
              <div className="skeleton h-12 w-1/2 rounded-xl" />
              <div className="skeleton h-14 w-full rounded-xl" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) return null;

  const inStock = product.quantity > 0;
  const isLow   = inStock && product.quantity <= (product.lowStockThreshold || 5);
  const img     = getImg(product);
  const videoSrc = product.videoUrl ? BACKEND + product.videoUrl : null;
  const { bg, emoji } = getCategoryColor(product.category?.name);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-violet-50">

      {/* ── Nav ── */}
      <ShopNav
        cartCount={cartCount}
        onBack={() => navigate("/shop")}
        onCart={() => navigate("/shop")}
      />

      <div className="max-w-6xl mx-auto px-4 py-8 animate-fade-in">

        {/* ── Breadcrumb ── */}
        <nav className="flex items-center gap-2 text-sm text-gray-400 mb-6">
          <button onClick={() => navigate("/shop")} className="hover:text-violet-600 transition">
            🛍️ Shop
          </button>
          <span>/</span>
          {product.category?.name && (
            <>
              <span className="hover:text-violet-600 transition cursor-pointer"
                onClick={() => navigate(`/shop?category=${product.categoryId}`)}>
                {product.category.name}
              </span>
              <span>/</span>
            </>
          )}
          <span className="text-gray-600 font-medium truncate max-w-xs">{product.name}</span>
        </nav>

        {/* ── Main product section ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mb-16">

          {/* Left: Media */}
          <div className="space-y-3">
            {/* Media tabs */}
            {videoSrc && (
              <div className="flex gap-2">
                {["image", "video"].map((tab) => (
                  <button key={tab} onClick={() => setMediaTab(tab)}
                    className={`px-4 py-1.5 rounded-xl text-sm font-semibold transition border ${
                      mediaTab === tab
                        ? "bg-violet-600 text-white border-violet-600 shadow"
                        : "bg-white text-gray-600 border-gray-200 hover:border-violet-400"
                    }`}>
                    {tab === "image" ? "🖼️ Photo" : "🎬 Video"}
                  </button>
                ))}
              </div>
            )}

            {/* Main media */}
            <div className="rounded-3xl overflow-hidden shadow-xl bg-white border border-gray-100">
              {mediaTab === "video" && videoSrc ? (
                <video src={videoSrc} controls autoPlay
                  className="w-full aspect-square object-contain bg-black" />
              ) : img ? (
                <img src={img} alt={product.name}
                  className="w-full aspect-square object-cover" />
              ) : (
                <div className={`w-full aspect-square bg-gradient-to-br ${bg} flex items-center justify-center`}>
                  <span className="text-9xl drop-shadow">{emoji}</span>
                </div>
              )}
            </div>

            {/* Thumbnail strip — show both if available */}
            {img && videoSrc && (
              <div className="flex gap-3">
                <button onClick={() => setMediaTab("image")}
                  className={`w-20 h-20 rounded-xl overflow-hidden border-2 transition ${
                    mediaTab === "image" ? "border-violet-500 shadow-md" : "border-gray-200 hover:border-violet-300"
                  }`}>
                  <img src={img} alt="thumb" className="w-full h-full object-cover" />
                </button>
                <button onClick={() => setMediaTab("video")}
                  className={`w-20 h-20 rounded-xl overflow-hidden border-2 transition bg-black flex items-center justify-center ${
                    mediaTab === "video" ? "border-violet-500 shadow-md" : "border-gray-200 hover:border-violet-300"
                  }`}>
                  <span className="text-3xl">▶️</span>
                </button>
              </div>
            )}
          </div>

          {/* Right: Details */}
          <div className="flex flex-col">
            {/* Category + SKU */}
            <div className="flex items-center gap-2 mb-3 flex-wrap">
              {product.category?.name && (
                <span className="badge bg-violet-100 text-violet-700">
                  {product.category.name}
                </span>
              )}
              <span className="text-xs text-gray-400">SKU: {product.sku}</span>
            </div>

            {/* Name */}
            <h1 className="text-3xl font-extrabold text-gray-900 mb-3 leading-tight">
              {product.name}
            </h1>

            {/* Stock status */}
            <div className="flex items-center gap-2 mb-4">
              <span className={`badge ${
                !inStock ? "bg-gray-100 text-gray-500"
                : isLow  ? "bg-orange-100 text-orange-700"
                         : "bg-green-100 text-green-700"
              }`}>
                {!inStock ? "❌ Out of Stock"
                : isLow  ? `⚡ Only ${product.quantity} left!`
                         : `✅ In Stock (${product.quantity} available)`}
              </span>
            </div>

            {/* Price */}
            <div className="mb-5">
              <span className="text-4xl font-extrabold text-violet-700">
                ${Number(product.price).toFixed(2)}
              </span>
            </div>

            {/* Description */}
            {product.description && (
              <p className="text-gray-600 text-sm leading-relaxed mb-6 border-t border-gray-100 pt-4">
                {product.description}
              </p>
            )}

            {/* Quantity selector */}
            {inStock && (
              <div className="flex items-center gap-4 mb-5">
                <span className="text-sm font-semibold text-gray-700">Quantity:</span>
                <div className="flex items-center gap-2 bg-gray-100 rounded-xl p-1">
                  <button onClick={() => setQty(q => Math.max(1, q - 1))}
                    className="w-9 h-9 rounded-lg bg-white shadow-sm font-bold text-lg hover:bg-violet-50 hover:text-violet-600 transition flex items-center justify-center">
                    −
                  </button>
                  <span className="w-10 text-center font-bold text-lg">{qty}</span>
                  <button onClick={() => setQty(q => Math.min(product.quantity, q + 1))}
                    className="w-9 h-9 rounded-lg bg-white shadow-sm font-bold text-lg hover:bg-violet-50 hover:text-violet-600 transition flex items-center justify-center">
                    +
                  </button>
                </div>
                <span className="text-sm text-gray-500 font-medium">
                  = <strong className="text-violet-700">${(product.price * qty).toFixed(2)}</strong>
                </span>
              </div>
            )}

            {/* Add to cart */}
            <button
              disabled={!inStock}
              onClick={() => addToCart(product, qty)}
              className={`w-full py-4 rounded-2xl font-bold text-base transition mb-3 ${
                !inStock
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : cartQty > 0
                  ? "bg-violet-100 text-violet-700 border-2 border-violet-300 hover:bg-violet-200"
                  : "bg-gradient-to-r from-violet-600 to-indigo-600 text-white hover:from-violet-700 hover:to-indigo-700 shadow-lg hover:shadow-xl"
              }`}
            >
              {!inStock ? "Out of Stock"
                : cartQty > 0 ? `🛒 In Cart (${cartQty}) — Add More`
                : `🛒 Add to Cart — $${(product.price * qty).toFixed(2)}`}
            </button>

            {/* Go to cart */}
            {cartQty > 0 && (
              <button onClick={() => navigate("/shop")}
                className="w-full py-3 rounded-2xl font-semibold text-sm border-2 border-violet-200 text-violet-600 hover:bg-violet-50 transition">
                View Cart ({cartCount} items) →
              </button>
            )}

            {/* Product meta */}
            <div className="mt-6 pt-5 border-t border-gray-100 grid grid-cols-2 gap-3 text-sm">
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-gray-400 text-xs mb-0.5">Category</p>
                <p className="font-semibold text-gray-700">{product.category?.name || "—"}</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-gray-400 text-xs mb-0.5">SKU</p>
                <p className="font-semibold text-gray-700 font-mono text-xs">{product.sku}</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-gray-400 text-xs mb-0.5">Price</p>
                <p className="font-semibold text-violet-700">${Number(product.price).toFixed(2)}</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-gray-400 text-xs mb-0.5">Availability</p>
                <p className={`font-semibold ${inStock ? "text-green-600" : "text-red-500"}`}>
                  {inStock ? `${product.quantity} units` : "Unavailable"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Same Category ── */}
        {sameCategoryRecs.length > 0 && (
          <RecommendationSection
            title="🔗 More from this Category"
            subtitle={`Other ${product.category?.name} products you might like`}
            products={sameCategoryRecs}
            onAddToCart={addToCart}
            onView={(p) => navigate(`/shop/product/${p.id}`)}
            cart={cart}
          />
        )}

        {/* ── Price Similar ── */}
        {priceSimilarRecs.length > 0 && (
          <RecommendationSection
            title="💰 Similar Price Range"
            subtitle={`Products around $${Number(product.price).toFixed(0)} from other categories`}
            products={priceSimilarRecs}
            onAddToCart={addToCart}
            onView={(p) => navigate(`/shop/product/${p.id}`)}
            cart={cart}
          />
        )}

        {/* ── Top Selling ── */}
        {topSellingRecs.length > 0 && (
          <RecommendationSection
            title="🏆 Trending This Month"
            subtitle="Most popular products across the store"
            products={topSellingRecs}
            onAddToCart={addToCart}
            onView={(p) => navigate(`/shop/product/${p.id}`)}
            cart={cart}
          />
        )}
      </div>
    </div>
  );
}

// ─── Recommendation Section ───────────────────────────────────────────────────
function RecommendationSection({ title, subtitle, products, onAddToCart, onView, cart }) {
  return (
    <section className="mb-12 animate-fade-in">
      <div className="mb-5">
        <h2 className="text-2xl font-bold text-gray-800">{title}</h2>
        <p className="text-gray-500 text-sm mt-1">{subtitle}</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
        {products.map((p) => (
          <RecommendationCard
            key={p.id}
            product={p}
            cartQty={cart.find((i) => i.product.id === p.id)?.qty || 0}
            onAddToCart={onAddToCart}
            onView={onView}
          />
        ))}
      </div>
    </section>
  );
}

// ─── Recommendation Card ──────────────────────────────────────────────────────
function RecommendationCard({ product: p, cartQty, onAddToCart, onView }) {
  const inStock = p.quantity > 0;
  const img = getImg(p);
  const { bg, emoji } = getCategoryColor(p.category?.name);

  return (
    <div className="bg-white rounded-2xl shadow hover:shadow-lg transition-all duration-300 overflow-hidden border border-gray-100 flex flex-col group">
      {/* Image */}
      <div className="relative h-40 cursor-pointer overflow-hidden" onClick={() => onView(p)}>
        {img ? (
          <img src={img} alt={p.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        ) : (
          <div className={`w-full h-full bg-gradient-to-br ${bg} flex items-center justify-center`}>
            <span className="text-5xl drop-shadow">{emoji}</span>
          </div>
        )}
        {cartQty > 0 && (
          <div className="absolute top-2 right-2 bg-violet-600 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold shadow">
            {cartQty}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-3 flex flex-col flex-1">
        {p.category?.name && (
          <span className="text-xs text-violet-600 font-medium bg-violet-50 px-2 py-0.5 rounded-full self-start mb-1.5">
            {p.category.name}
          </span>
        )}
        <h3 className="font-semibold text-gray-800 text-sm mb-1 line-clamp-2 cursor-pointer hover:text-violet-600 transition"
          onClick={() => onView(p)}>
          {p.name}
        </h3>
        <div className="mt-auto pt-2 border-t border-gray-100 flex items-center justify-between">
          <span className="text-base font-extrabold text-violet-700">
            ${Number(p.price).toFixed(2)}
          </span>
          <button
            disabled={!inStock}
            onClick={() => onAddToCart(p)}
            className={`text-xs font-bold px-3 py-1.5 rounded-lg transition ${
              !inStock ? "bg-gray-100 text-gray-400 cursor-not-allowed"
              : cartQty > 0 ? "bg-violet-100 text-violet-700 border border-violet-300"
              : "bg-gradient-to-r from-violet-600 to-indigo-600 text-white hover:from-violet-700 hover:to-indigo-700"
            }`}
          >
            {!inStock ? "—" : cartQty > 0 ? "✓ Added" : "🛒 Add"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Shop Nav (minimal, for product detail page) ──────────────────────────────
function ShopNav({ cartCount, onBack, onCart }) {
  return (
    <nav className="bg-gradient-to-r from-violet-700 via-purple-600 to-indigo-600 shadow-xl sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <button onClick={onBack}
          className="flex items-center gap-2 text-white/80 hover:text-white transition text-sm font-medium">
          ← Back to Shop
        </button>
        <span className="text-white font-bold text-lg">🛍️ Product Details</span>
        <button onClick={onCart}
          className="relative bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-xl font-semibold text-sm transition flex items-center gap-2 border border-white/30">
          🛒 Cart
          {cartCount > 0 && (
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold shadow">
              {cartCount}
            </span>
          )}
        </button>
      </div>
    </nav>
  );
}
