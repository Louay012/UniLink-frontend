import React, { createContext, useCallback, useContext, useRef, useState } from "react";

const ToastContext = createContext(null);

let _nextId = 1;

/**
 * ToastProvider — wrap your app with this once (in App.jsx).
 * Provides the useToast() hook everywhere below it.
 */
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  // Track per-toast timeout IDs so we can clear on early dismiss
  const timers = useRef({});

  const dismiss = useCallback((id) => {
    // Mark as exiting for leave animation
    setToasts(prev => prev.map(t => t.id === id ? { ...t, exiting: true } : t));
    // Remove from DOM after animation completes (300ms)
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
      clearTimeout(timers.current[id]);
      delete timers.current[id];
    }, 320);
  }, []);

  const show = useCallback(({ type = "info", title, message, duration = 4000 }) => {
    const id = _nextId++;
    setToasts(prev => [...prev, { id, type, title, message, exiting: false }]);
    if (duration > 0) {
      timers.current[id] = setTimeout(() => dismiss(id), duration);
    }
    return id;
  }, [dismiss]);

  // Convenience helpers
  const toast = {
    success: (message, title = "Success") => show({ type: "success", title, message }),
    error:   (message, title = "Error")   => show({ type: "error",   title, message }),
    warning: (message, title = "Warning") => show({ type: "warning", title, message }),
    info:    (message, title = "Info")    => show({ type: "info",    title, message }),
    show,
    dismiss,
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
}

/** useToast — returns the toast helpers */
export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider>");
  return ctx;
}

// ── Internal container (rendered once at the root) ────────────────────
const ICONS = {
  success: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="8" fill="#22c55e" fillOpacity=".15"/>
      <path d="M4.5 8.5l2.5 2.5 4.5-5" stroke="#22c55e" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  error: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="8" fill="#ef4444" fillOpacity=".15"/>
      <path d="M5.5 5.5l5 5M10.5 5.5l-5 5" stroke="#ef4444" strokeWidth="1.8" strokeLinecap="round"/>
    </svg>
  ),
  warning: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="8" fill="#f59e0b" fillOpacity=".15"/>
      <path d="M8 5v3.5M8 10.5v.5" stroke="#f59e0b" strokeWidth="1.8" strokeLinecap="round"/>
    </svg>
  ),
  info: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="8" fill="#6366f1" fillOpacity=".15"/>
      <path d="M8 7v4.5M8 5v.5" stroke="#6366f1" strokeWidth="1.8" strokeLinecap="round"/>
    </svg>
  ),
};

const ACCENT = {
  success: "#22c55e",
  error:   "#ef4444",
  warning: "#f59e0b",
  info:    "#6366f1",
};

function ToastContainer({ toasts, onDismiss }) {
  if (!toasts.length) return null;
  return (
    <div
      style={{
        position: "fixed",
        top: 64,
        right: 20,
        zIndex: 9999,
        display: "flex",
        flexDirection: "column",
        gap: 10,
        pointerEvents: "none",
      }}
    >
      {toasts.map(toast => (
        <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
}

function ToastItem({ toast, onDismiss }) {
  const accent = ACCENT[toast.type] || ACCENT.info;

  return (
    <div
      style={{
        pointerEvents: "auto",
        background: "#fff",
        border: "1px solid #f1f5f9",
        borderLeft: `3px solid ${accent}`,
        borderRadius: 14,
        boxShadow: "0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.08)",
        minWidth: 280,
        maxWidth: 360,
        padding: "12px 14px",
        display: "flex",
        alignItems: "flex-start",
        gap: 10,
        animation: toast.exiting
          ? "toast-leave 300ms ease forwards"
          : "toast-enter 300ms cubic-bezier(0.34,1.56,0.64,1) forwards",
      }}
    >
      {/* Icon */}
      <span style={{ flexShrink: 0, marginTop: 1 }}>{ICONS[toast.type]}</span>

      {/* Text */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {toast.title && (
          <p style={{ margin: 0, fontSize: "0.82rem", fontWeight: 700, color: "#1e293b", lineHeight: 1.3 }}>
            {toast.title}
          </p>
        )}
        {toast.message && (
          <p style={{ margin: 0, fontSize: "0.78rem", color: "#64748b", marginTop: toast.title ? 2 : 0, lineHeight: 1.4 }}>
            {toast.message}
          </p>
        )}
      </div>

      {/* Close button */}
      <button
        onClick={() => onDismiss(toast.id)}
        style={{
          flexShrink: 0, background: "none", border: "none", cursor: "pointer",
          color: "#94a3b8", padding: "0 0 0 4px", lineHeight: 1,
          fontSize: 16, marginTop: -1, display: "flex", alignItems: "center",
        }}
        aria-label="Dismiss"
      >
        ×
      </button>
    </div>
  );
}
