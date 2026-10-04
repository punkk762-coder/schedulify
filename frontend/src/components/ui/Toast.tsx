"use client";

import React, { createContext, useContext, useState, useCallback } from "react";

export type ToastType = "success" | "info" | "warning" | "error";

export interface ToastMessage {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
}

interface ToastContextType {
  toast: (message: string, type?: ToastType, title?: string) => void;
  success: (message: string, title?: string) => void;
  info: (message: string, title?: string) => void;
  warning: (message: string, title?: string) => void;
  error: (message: string, title?: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    (message: string, type: ToastType = "info", title?: string) => {
      const id = Math.random().toString(36).substring(2, 9);
      const newToast: ToastMessage = { id, type, title, message };
      setToasts((prev) => [...prev.slice(-3), newToast]); // Keep max 4 visible

      setTimeout(() => {
        removeToast(id);
      }, 3500);
    },
    [removeToast]
  );

  const value = {
    toast: addToast,
    success: (msg: string, title?: string) => addToast(msg, "success", title),
    info: (msg: string, title?: string) => addToast(msg, "info", title),
    warning: (msg: string, title?: string) => addToast(msg, "warning", title),
    error: (msg: string, title?: string) => addToast(msg, "error", title),
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      {/* Toast Notification Container */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm pointer-events-none">
        {toasts.map((t) => {
          const isSuccess = t.type === "success";
          const isWarning = t.type === "warning";
          const isError = t.type === "error";

          return (
            <div
              key={t.id}
              className={`pointer-events-auto p-4 rounded-2xl border shadow-lg backdrop-blur-md transition-all duration-300 transform translate-y-0 opacity-100 flex items-start gap-3 bg-white/95 ${
                isSuccess
                  ? "border-[#52652a]/40 text-[#1f1b14]"
                  : isWarning
                  ? "border-[#f59e0b]/40 text-[#1f1b14]"
                  : isError
                  ? "border-[#ba1a1a]/40 text-[#1f1b14]"
                  : "border-[#a43716]/30 text-[#1f1b14]"
              }`}
            >
              <span className="text-lg shrink-0 mt-0.5">
                {isSuccess ? "✓" : isWarning ? "⚠️" : isError ? "✕" : "⚡"}
              </span>
              <div className="flex-1">
                {t.title && (
                  <h5 className="font-serif font-bold text-xs uppercase tracking-wider text-[#a43716] mb-0.5">
                    {t.title}
                  </h5>
                )}
                <p className="text-xs text-[#1f1b14] leading-relaxed font-medium">
                  {t.message}
                </p>
              </div>
              <button
                type="button"
                onClick={() => removeToast(t.id)}
                className="text-[#8b716a] hover:text-[#1f1b14] text-xs p-1"
              >
                ✕
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    return {
      toast: () => {},
      success: () => {},
      info: () => {},
      warning: () => {},
      error: () => {},
    };
  }
  return context;
}
