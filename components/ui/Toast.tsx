"use client";

import { useEffect, useState, useCallback } from "react";

interface Toast {
  id: number;
  message: string;
  exiting?: boolean;
}

let nextId = 0;
const listeners: Set<(toast: Toast) => void> = new Set();

export function showToast(message: string) {
  const toast: Toast = { id: nextId++, message };
  listeners.forEach((fn) => fn(toast));
}

export function ToastContainer() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((toast: Toast) => {
    setToasts((prev) => [...prev, toast]);
    setTimeout(() => {
      setToasts((prev) =>
        prev.map((t) => (t.id === toast.id ? { ...t, exiting: true } : t))
      );
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== toast.id));
      }, 300);
    }, 2500);
  }, []);

  useEffect(() => {
    listeners.add(addToast);
    return () => { listeners.delete(addToast); };
  }, [addToast]);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-2 items-center pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`toast ${toast.exiting ? "toast-exit" : ""}`}
        >
          <svg className="toast-icon" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
          </svg>
          {toast.message}
        </div>
      ))}
    </div>
  );
}
