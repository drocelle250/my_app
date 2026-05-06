import React, { useEffect, useState, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import API from "../api";
import { useInventory } from "../hooks/useInventory";

const BACKEND = import.meta.env.VITE_API_URL?.replace("/api", "") || "http://localhost:5000";

// ─── File size formatter ──────────────────────────────────────────────────────
const fmtSize = (bytes) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
};

// ─── Drag-and-drop upload zone ────────────────────────────────────────────────
function DropZone({ accept, label, icon, hint, onFile, preview, onRemove, type = "image" }) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef(null);

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) onFile(file);
  };

  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-2">{label}</label>

      {/* Preview area */}
      {preview ? (
        <div className="relative rounded-2xl overflow-hidden border-2 border-violet-200 bg-gray-50 shadow-sm">
          {type === "image" ? (
            <img src={preview.src} alt="preview"
              className="w-full h-52 object-cover" />
          ) : (
            <video src={preview.src} controls
              className="w-full h-52 object-contain bg-black" />
          )}
          {/* Overlay info bar */}
          <div className="absolute bottom-0 left-0 right-0 bg-black/60 backdrop-blur-sm px-3 py-2 flex items-center justify-between">
            <div className="text-white text-xs truncate max-w-[70%]">
              <span className="font-medium">{preview.name}</span>
              {preview.size && <span className="ml-2 opacity-70">{fmtSize(preview.size)}</span>}
            </div>
            <button type="button" onClick={onRemove}
              className="bg-red-500 hover:bg-red-600 text-white text-xs px-2.5 py-1 rounded-lg font-semibold transition flex items-center gap-1">
              🗑 Remove
            </button>
          </div>
          {/* Re-upload button */}
          <button type="button" onClick={() => inputRef.current?.click()}
            className="absolute top-2 right-2 bg-white/80 hover:bg-white text-gray-700 text-xs px-2.5 py-1 rounded-lg font-medium shadow transition">
            ✏️ Change
          </button>
        </div>
      ) : (
        /* Drop zone */
        <div
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          className={`cursor-pointer rounded-2xl border-2 border-dashed transition flex flex-col items-center justify-center py-10 px-4 text-center
            ${dragging
              ? "border-violet-500 bg-violet-50 scale-[1.01]"
              : "border-gray-300 bg-gray-50 hover:border-violet-400 hover:bg-violet-50/50"
            }`}
        >
          <span className="text-4xl mb-3">{icon}</span>
          <p className="text-sm font-semibold text-gray-700">
            {dragging ? "Drop it here!" : `Click or drag & drop ${type}`}
          </p>
          <p className="text-xs text-gray-400 mt-1">{hint}</p>
        </div>
      )}

      {/* Hidden file input */}
      <input ref={inputRef} type="file" accept={accept} className="hidden"
        onChange={(e) => { const f = e.target.files[0]; if (f) onFile(f); e.target.value = ""; }} />
    </div>
  );
}

// ─── Main Form ────────────────────────────────────────────────────────────────
export default function ProductForm() {
  const { id }    = useParams();
  const isEdit    = Boolean(id);
  const navigate  = useNavigate();
  const { dispatch } = useInventory();

  const [categories, setCategories] = useState([]);
  const [catLoading, setCatLoading] = useState(true);
  const [form, setForm] = useState({
    name: "", sku: "", price: "", quantity: "",
    description: "", categoryId: "", lowStockThreshold: 10,
  });

  // Image state
  const [imageFile,    setImageFile]    = useState(null);
  const [imagePreview, setImagePreview] = useState(null); // { src, name, size }
  const [removeImage,  setRemoveImage]  = useState(false);

  // Video state
  const [videoFile,    setVideoFile]    = useState(null);
  const [videoPreview, setVideoPreview] = useState(null); // { src, name, size }
  const [removeVideo,  setRemoveVideo]  = useState(false);

  const [error,   setError]   = useState("");
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // ── Load categories + existing product ──────────────────────────────────────
  useEffect(() => {
    API.get("/categories")
      .then((r) => { setCategories(r.data); setCatLoading(false); })
      .catch(() => { setError("Failed to load categories."); setCatLoading(false); });

    if (isEdit) {
      API.get(`/products/${id}`)
        .then((r) => {
          const p = r.data;
          setForm({
            name: p.name, sku: p.sku, price: p.price,
            quantity: p.quantity, description: p.description || "",
            categoryId: p.categoryId, lowStockThreshold: p.lowStockThreshold,
          });
          if (p.imageUrl) setImagePreview({ src: BACKEND + p.imageUrl, name: "Current image", size: null });
          if (p.videoUrl) setVideoPreview({ src: BACKEND + p.videoUrl, name: "Current video", size: null });
        })
        .catch(() => setError("Failed to load product data."));
    }
  }, [id]);

  // ── File handlers ────────────────────────────────────────────────────────────
  const handleImageFile = (file) => {
    if (!file.type.startsWith("image/")) return setError("Please select an image file.");
    if (file.size > 8 * 1024 * 1024) return setError("Image must be under 8 MB.");
    setError("");
    setImageFile(file);
    setRemoveImage(false);
    setImagePreview({ src: URL.createObjectURL(file), name: file.name, size: file.size });
  };

  const handleVideoFile = (file) => {
    if (!file.type.startsWith("video/")) return setError("Please select a video file.");
    if (file.size > 100 * 1024 * 1024) return setError("Video must be under 100 MB.");
    setError("");
    setVideoFile(file);
    setRemoveVideo(false);
    setVideoPreview({ src: URL.createObjectURL(file), name: file.name, size: file.size });
  };

  const clearImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setRemoveImage(true);
  };

  const clearVideo = () => {
    setVideoFile(null);
    setVideoPreview(null);
    setRemoveVideo(true);
  };

  // ── Submit ───────────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.categoryId) return setError("Please select a category.");

    setLoading(true);
    setUploadProgress(0);

    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      if (imageFile) fd.append("image", imageFile);
      if (videoFile) fd.append("video", videoFile);
      if (removeImage) fd.append("removeImage", "true");
      if (removeVideo) fd.append("removeVideo", "true");

      const config = {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (e) => {
          setUploadProgress(Math.round((e.loaded * 100) / (e.total || 1)));
        },
      };

      if (isEdit) {
        const res = await API.put(`/products/${id}`, fd, config);
        dispatch({ type: "EDIT_PRODUCT", payload: res.data });
      } else {
        const res = await API.post("/products", fd, config);
        dispatch({ type: "ADD_PRODUCT", payload: res.data });
      }
      navigate("/products");
    } catch (err) {
      setError(
        err.response?.data?.message ||
        err.response?.data?.errors?.[0]?.msg ||
        "Failed to save product."
      );
    } finally {
      setLoading(false);
      setUploadProgress(0);
    }
  };

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="p-6 max-w-3xl mx-auto">

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800">
          {isEdit ? "✏️ Edit Product" : "➕ Add New Product"}
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          {isEdit ? "Update product details, image, or video" : "Fill in the details and upload media"}
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-300 text-red-700 px-4 py-3 rounded-xl mb-5 text-sm flex items-center gap-2">
          ❌ {error}
          <button onClick={() => setError("")} className="ml-auto text-red-400 hover:text-red-600">✕</button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* ── MEDIA SECTION ── */}
        <div className="bg-white rounded-2xl shadow border border-gray-100 p-6">
          <h2 className="text-base font-bold text-gray-700 mb-4 flex items-center gap-2">
            🖼️ Product Media
            <span className="text-xs font-normal text-gray-400">(image + video)</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Image */}
            <DropZone
              type="image"
              label="Product Image"
              icon="📷"
              accept="image/jpeg,image/jpg,image/png,image/webp,image/gif,image/avif"
              hint="JPG, PNG, WEBP, GIF — max 8 MB"
              preview={imagePreview}
              onFile={handleImageFile}
              onRemove={clearImage}
            />

            {/* Video */}
            <DropZone
              type="video"
              label="Product Video"
              icon="🎬"
              accept="video/mp4,video/webm,video/ogg,video/quicktime,video/x-msvideo"
              hint="MP4, WEBM, MOV — max 100 MB"
              preview={videoPreview}
              onFile={handleVideoFile}
              onRemove={clearVideo}
            />
          </div>

          {/* Upload tips */}
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 text-xs text-blue-700">
              <p className="font-semibold mb-1">📷 Image tips</p>
              <ul className="space-y-0.5 opacity-80">
                <li>• Use square images (1:1) for best display</li>
                <li>• Minimum 400×400 px recommended</li>
                <li>• White or transparent background works best</li>
              </ul>
            </div>
            <div className="bg-purple-50 border border-purple-100 rounded-xl px-4 py-3 text-xs text-purple-700">
              <p className="font-semibold mb-1">🎬 Video tips</p>
              <ul className="space-y-0.5 opacity-80">
                <li>• MP4 (H.264) has best browser support</li>
                <li>• Keep under 60 seconds for fast loading</li>
                <li>• 720p or 1080p resolution recommended</li>
              </ul>
            </div>
          </div>
        </div>

        {/* ── PRODUCT DETAILS ── */}
        <div className="bg-white rounded-2xl shadow border border-gray-100 p-6">
          <h2 className="text-base font-bold text-gray-700 mb-4">📋 Product Details</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Product Name" required>
              <input type="text" required value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="input" placeholder="e.g. Laptop Pro 15" />
            </Field>

            <Field label="SKU" required>
              <input type="text" required value={form.sku}
                onChange={(e) => setForm({ ...form, sku: e.target.value })}
                className="input" placeholder="e.g. ELEC-LAP-001" />
            </Field>

            <Field label="Price ($)" required>
              <input type="number" required min="0" step="0.01" value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                className="input" placeholder="0.00" />
            </Field>

            <Field label="Quantity" required>
              <input type="number" required min="0" value={form.quantity}
                onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                className="input" placeholder="0" />
            </Field>

            <Field label="Category" required>
              {catLoading ? (
                <div className="input bg-gray-50 text-gray-400 text-sm">Loading categories…</div>
              ) : categories.length === 0 ? (
                <div className="input bg-red-50 text-red-500 text-sm">
                  No categories. <a href="/categories" className="underline font-medium">Add one first</a>
                </div>
              ) : (
                <select required value={form.categoryId}
                  onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                  className="input">
                  <option value="">-- Select category --</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              )}
            </Field>

            <Field label="Low Stock Threshold">
              <input type="number" min="0" value={form.lowStockThreshold}
                onChange={(e) => setForm({ ...form, lowStockThreshold: e.target.value })}
                className="input" />
              <p className="text-xs text-gray-400 mt-1">Alert when stock falls below this number</p>
            </Field>
          </div>

          <div className="mt-4">
            <Field label="Description">
              <textarea value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="input h-28 resize-none"
                placeholder="Describe the product — features, materials, dimensions…" />
            </Field>
          </div>
        </div>

        {/* ── Upload progress bar ── */}
        {loading && uploadProgress > 0 && (
          <div className="bg-white rounded-2xl shadow border border-gray-100 p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">
                {uploadProgress < 100 ? "⬆️ Uploading…" : "✅ Processing…"}
              </span>
              <span className="text-sm font-bold text-violet-600">{uploadProgress}%</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
              <div
                className="bg-gradient-to-r from-violet-500 to-indigo-500 h-2.5 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
            {(imageFile || videoFile) && (
              <p className="text-xs text-gray-400 mt-2">
                {[imageFile && `Image: ${fmtSize(imageFile.size)}`, videoFile && `Video: ${fmtSize(videoFile.size)}`]
                  .filter(Boolean).join(" · ")}
              </p>
            )}
          </div>
        )}

        {/* ── Actions ── */}
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={loading || catLoading || categories.length === 0}
            className="flex-1 sm:flex-none bg-gradient-to-r from-violet-600 to-indigo-600 text-white px-8 py-3 rounded-xl font-bold hover:from-violet-700 hover:to-indigo-700 transition disabled:opacity-50 shadow-lg flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                {uploadProgress > 0 ? `Uploading ${uploadProgress}%…` : "Saving…"}
              </>
            ) : (
              isEdit ? "💾 Update Product" : "➕ Add Product"
            )}
          </button>
          <button
            type="button"
            onClick={() => navigate("/products")}
            className="px-6 py-3 rounded-xl bg-gray-100 text-gray-700 hover:bg-gray-200 font-medium transition"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({ label, required, children }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
    </div>
  );
}
