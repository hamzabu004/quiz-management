"use client";

import { Toaster } from "react-hot-toast";

export function ToastProvider() {
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        style: {
          background: "#111827",
          color: "#f9fafb",
          border: "1px solid #1f2937",
        },
      }}
    />
  );
}

