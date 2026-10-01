"use client";

import React, { useEffect } from "react";
import "./globals.css";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Otomatis refresh jika terjadi ChunkLoadError akibat pembaruan build baru di server
    const errorMsg = error?.message || "";
    const isChunkError =
      errorMsg.includes("Loading chunk") ||
      errorMsg.includes("Failed to fetch dynamically imported module") ||
      error?.name === "ChunkLoadError";

    if (isChunkError && typeof window !== "undefined") {
      const storageKey = `global_chunk_reload_${window.location.pathname}`;
      const lastReload = sessionStorage.getItem(storageKey);
      const now = Date.now();
      if (!lastReload || now - parseInt(lastReload, 10) > 10000) {
        sessionStorage.setItem(storageKey, String(now));
        window.location.reload();
      }
    }
  }, [error]);

  const handleReload = () => {
    if (typeof window !== "undefined") {
      window.location.reload();
    } else {
      reset();
    }
  };

  const handleGoHome = () => {
    if (typeof window !== "undefined") {
      window.location.href = "/dashboard";
    }
  };

  return (
    <html lang="id">
      <head>
        <title>Pembaruan Sistem — BAPPEDA Halmahera Utara</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body
        style={{
          margin: 0,
          padding: "16px",
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#f8fafc",
          fontFamily:
            "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
          color: "#0f172a",
          boxSizing: "border-box",
        }}
      >
        <div
          style={{
            maxWidth: "460px",
            width: "100%",
            backgroundColor: "#ffffff",
            borderRadius: "24px",
            border: "1px solid #e2e8f0",
            boxShadow:
              "0 20px 25px -5px rgba(15, 23, 42, 0.08), 0 8px 10px -6px rgba(15, 23, 42, 0.04)",
            padding: "32px 28px",
            textAlign: "center",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "18px",
            boxSizing: "border-box",
          }}
        >
          {/* Official Emblem */}
          <div
            style={{
              width: "68px",
              height: "68px",
              borderRadius: "20px",
              backgroundColor: "#f1f5f9",
              border: "1px solid #e2e8f0",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "10px",
              boxSizing: "border-box",
            }}
          >
            <img
              src="/images/bappeda/logo-halut.png"
              alt="Logo Halmahera Utara"
              style={{
                width: "100%",
                height: "100%",
                objectFit: "contain",
              }}
            />
          </div>

          {/* Badge */}
          <div
            style={{
              display: "inline-block",
              padding: "4px 12px",
              borderRadius: "9999px",
              backgroundColor: "#eff6ff",
              border: "1px solid #bfdbfe",
              color: "#1d4ed8",
              fontSize: "11px",
              fontWeight: 800,
              letterSpacing: "0.05em",
              textTransform: "uppercase",
            }}
          >
            BAPPEDA KAB. HALMAHERA UTARA
          </div>

          {/* Headings */}
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <h1
              style={{
                fontSize: "20px",
                fontWeight: 900,
                color: "#0f172a",
                margin: 0,
                letterSpacing: "-0.02em",
              }}
            >
              Sinkronisasi Pembaruan Sistem
            </h1>
            <p
              style={{
                fontSize: "13px",
                color: "#64748b",
                margin: 0,
                lineHeight: "1.5",
                fontWeight: 500,
              }}
            >
              Aplikasi telah diperbarui dengan versi terbaru di server. Silakan segarkan halaman untuk memuat aset dan data terkini.
            </p>
          </div>

          {/* Action Buttons */}
          <div
            style={{
              width: "100%",
              display: "flex",
              flexDirection: "column",
              gap: "10px",
              marginTop: "4px",
            }}
          >
            <button
              type="button"
              onClick={handleReload}
              style={{
                width: "100%",
                padding: "13px 20px",
                borderRadius: "16px",
                backgroundColor: "#2563eb",
                color: "#ffffff",
                border: "none",
                fontSize: "13px",
                fontWeight: 800,
                cursor: "pointer",
                boxShadow: "0 4px 6px -1px rgba(37, 99, 235, 0.25)",
                transition: "background-color 0.15s ease",
              }}
            >
              Segarkan Halaman Sekarang
            </button>

            <button
              type="button"
              onClick={handleGoHome}
              style={{
                width: "100%",
                padding: "12px 20px",
                borderRadius: "16px",
                backgroundColor: "#f8fafc",
                color: "#475569",
                border: "1px solid #e2e8f0",
                fontSize: "12px",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Kembali ke Dashboard Utama
            </button>
          </div>

          {/* Security & System Footer */}
          <div
            style={{
              paddingTop: "8px",
              borderTop: "1px solid #f1f5f9",
              width: "100%",
              fontSize: "11px",
              color: "#94a3b8",
              fontWeight: 500,
            }}
          >
            Smart Digital Portal &bull; Sistem Terlindungi
          </div>
        </div>
      </body>
    </html>
  );
}
