import React, { createContext, useContext, useState, useCallback, useRef } from "react";

// ─── Context ──────────────────────────────────────────────────────────────────
const ToastContext = createContext(null);

const ICONS = {
  success: "✅",
  error:   "❌",
  warning: "⚠️",
  info:    "ℹ️",
};

const STYLES = {
  success: "bg-green-50  border-green-300  text-green-800",
  error:   "bg-red-50    border-red-300    text-red-800",
  warning: "bg-amber-50  border-amber-300  text-amber-800",
  info:    "bg-blue-50   border-blue-300   text-blue-800",
};

const BAR_STYLES = {
  success: "bg-green-400",
  error:   "bg-red-400",
  warning: "bg-amber-400",
  info:    "bg-blue-400",
};

// ─── Provider ─────────────────────────────────────────────────────────────────
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const counterRef = useRef(0);

  const toast = useCallback((message, type = "info", duration = 4000) => {
    const id = ++counterRef.current;
    setToasts((prev) => [...prev, { id, message, type, duration }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration + 400); // extra time for exit animation
    return id;
  }, []);

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Convenience methods
  toast.success = (msg, dur) => toast(msg, "success", dur);
  toast.error   = (msg, dur) => toast(msg, "error",   dur);
  toast.warning = (msg, dur) => toast(msg, "warning", dur);
  toast.info    = (msg, dur) => toast(msg, "info",    dur);

  return (
    <ToastContext.Provider value={toast}>
      {children}
      {/* Toast container */}
      <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none max-w-sm w-full">
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onDismiss={dismiss} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

// ─── Single Toast ─────────────────────────────────────────────────────────────
function ToastItem({ toast: t, onDismiss }) {
  return (
    <div
      className={`pointer-events-auto flex items-start gap-3 px-4 py-3 rounded-2xl border shadow-xl
        animate-toast-in ${STYLES[t.type]}`}
      role="alert"
    >
      <span className="text-lg flex-shrink-0 mt-0.5">{ICONS[t.type]}</span>
      <p className="flex-1 text-sm font-medium leading-snug">{t.message}</p>
      <button
        onClick={() => onDismiss(t.id)}
        className="flex-shrink-0 opacity-50 hover:opacity-100 transition text-lg leading-none mt-0.5"
      >
        ✕
      </button>
      {/* Progress bar */}
      <div className="absolute bottom-0 left-0 right-0 h-0.5 rounded-b-2xl overflow-hidden">
        <div
          className={`h-full ${BAR_STYLES[t.type]} rounded-b-2xl`}
          style={{
            animation: `shrink ${t.duration}ms linear forwards`,
          }}
        />
      </div>
    </div>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

// Add shrink keyframe via a style tag (avoids needing to add to tailwind config)
const style = document.createElement("style");
style.textContent = `
  @keyframes shrink {
    from { width: 100%; }
    to   { width: 0%; }
  }
`;
document.head.appendChild(style);
