import React, {
  createContext, useContext, useState,
  useCallback, useRef, useEffect,
} from "react";

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

  // Inject the shrink keyframe safely inside the component lifecycle
  useEffect(() => {
    const id = "smartstock-toast-styles";
    if (document.getElementById(id)) return; // already injected
    const style = document.createElement("style");
    style.id = id;
    style.textContent = `
      @keyframes shrink {
        from { width: 100%; }
        to   { width: 0%; }
      }
      @keyframes toastIn {
        from { opacity: 0; transform: translateX(110%); }
        to   { opacity: 1; transform: translateX(0); }
      }
      .animate-toast-in {
        animation: toastIn 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
      }
    `;
    document.head.appendChild(style);
  }, []);

  // Core toast function — stable reference via useRef
  const addToastRef = useRef(null);

  const addToast = useCallback((message, type = "info", duration = 4000) => {
    const id = ++counterRef.current;
    setToasts((prev) => [...prev, { id, message, type, duration }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration + 400);
    return id;
  }, []);

  addToastRef.current = addToast;

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Build a stable API object that won't change between renders
  const api = useRef({
    show:    (msg, type, dur) => addToastRef.current(msg, type, dur),
    success: (msg, dur)       => addToastRef.current(msg, "success", dur),
    error:   (msg, dur)       => addToastRef.current(msg, "error",   dur),
    warning: (msg, dur)       => addToastRef.current(msg, "warning", dur),
    info:    (msg, dur)       => addToastRef.current(msg, "info",    dur),
  }).current;

  return (
    <ToastContext.Provider value={api}>
      {children}
      {/* Toast container — top-right on desktop, top-center on mobile */}
      <div className="fixed top-4 left-4 right-4 sm:left-auto sm:right-4 z-[9999] flex flex-col gap-2 pointer-events-none sm:max-w-sm w-auto sm:w-full">
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
      className={`pointer-events-auto relative flex items-start gap-3 px-4 py-3 rounded-2xl border shadow-xl
        animate-toast-in overflow-hidden ${STYLES[t.type]}`}
      role="alert"
    >
      <span className="text-lg flex-shrink-0 mt-0.5">{ICONS[t.type]}</span>
      <p className="flex-1 text-sm font-medium leading-snug">{t.message}</p>
      <button
        onClick={() => onDismiss(t.id)}
        className="flex-shrink-0 opacity-50 hover:opacity-100 transition text-lg leading-none mt-0.5"
        aria-label="Dismiss"
      >
        ✕
      </button>
      {/* Progress bar */}
      <div className="absolute bottom-0 left-0 right-0 h-0.5 overflow-hidden">
        <div
          className={`h-full ${BAR_STYLES[t.type]}`}
          style={{ animation: `shrink ${t.duration}ms linear forwards` }}
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
