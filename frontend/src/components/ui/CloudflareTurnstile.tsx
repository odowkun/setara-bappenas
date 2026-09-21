"use client";

import React, { useEffect, useRef, useState } from "react";
import { ShieldCheck, AlertCircle, RefreshCw } from "lucide-react";

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: HTMLElement | string,
        params: {
          sitekey: string;
          callback?: (token: string) => void;
          "error-callback"?: () => void;
          "expired-callback"?: () => void;
          theme?: "light" | "dark" | "auto";
          size?: "normal" | "flexible" | "compact";
          language?: string;
        }
      ) => string;
      reset: (widgetId?: string) => void;
      remove: (widgetId?: string) => void;
    };
    onloadTurnstileCallback?: () => void;
  }
}

interface CloudflareTurnstileProps {
  onVerify: (token: string) => void;
  onExpire?: () => void;
  onError?: () => void;
  siteKey?: string;
  theme?: "light" | "dark" | "auto";
  className?: string;
}

export const CloudflareTurnstile: React.FC<CloudflareTurnstileProps> = ({
  onVerify,
  onExpire,
  onError,
  siteKey = process.env.NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY || "0x4AAAAAAAE-ZwI9f5kc3-XTA",
  theme = "light",
  className = "",
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [verified, setVerified] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const renderWidget = () => {
      if (!isMounted || !containerRef.current || !window.turnstile) return;

      try {
        if (widgetIdRef.current) {
          try {
            window.turnstile.remove(widgetIdRef.current);
          } catch {
            // ignore remove error
          }
          widgetIdRef.current = null;
        }

        const id = window.turnstile.render(containerRef.current, {
          sitekey: siteKey,
          theme,
          size: "flexible",
          language: "id",
          callback: (token: string) => {
            if (!isMounted) return;
            setVerified(true);
            setError(false);
            setLoading(false);
            onVerify(token);
          },
          "error-callback": () => {
            if (!isMounted) return;
            setError(true);
            setVerified(false);
            setLoading(false);
            onError?.();
          },
          "expired-callback": () => {
            if (!isMounted) return;
            setVerified(false);
            onExpire?.();
          },
        });

        widgetIdRef.current = id;
        setLoading(false);
      } catch (err) {
        console.warn("[Cloudflare Turnstile] Render error:", err);
        if (isMounted) {
          setError(true);
          setLoading(false);
        }
      }
    };

    // Load Turnstile Script if not already present
    const scriptId = "cloudflare-turnstile-script";
    const existingScript = document.getElementById(scriptId);

    if (window.turnstile) {
      renderWidget();
    } else if (!existingScript) {
      const script = document.createElement("script");
      script.id = scriptId;
      script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
      script.async = true;
      script.defer = true;
      script.onload = () => {
        if (isMounted) renderWidget();
      };
      script.onerror = () => {
        if (isMounted) {
          setError(true);
          setLoading(false);
        }
      };
      document.head.appendChild(script);
    } else {
      const interval = setInterval(() => {
        if (window.turnstile) {
          clearInterval(interval);
          if (isMounted) renderWidget();
        }
      }, 100);

      return () => {
        isMounted = false;
        clearInterval(interval);
      };
    }

    return () => {
      isMounted = false;
      if (widgetIdRef.current && window.turnstile) {
        try {
          window.turnstile.remove(widgetIdRef.current);
        } catch {
          // ignore
        }
      }
    };
  }, [siteKey, theme]);

  const handleReset = () => {
    if (widgetIdRef.current && window.turnstile) {
      window.turnstile.reset(widgetIdRef.current);
      setVerified(false);
      setError(false);
      onExpire?.();
    }
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center justify-between text-[11px] font-bold text-slate-600">
        <span className="flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
          <span>Verifikasi Keamanan Akses SPBE</span>
        </span>
        {verified ? (
          <span className="text-emerald-600 font-extrabold flex items-center gap-1">
            Terverifikasi
          </span>
        ) : error ? (
          <button
            type="button"
            onClick={handleReset}
            className="text-blue-600 hover:text-blue-700 underline flex items-center gap-1 cursor-pointer"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Muat Ulang</span>
          </button>
        ) : (
          <span className="text-slate-400 font-medium">Cloudflare Turnstile</span>
        )}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-2.5 overflow-hidden transition-all duration-300 min-h-[72px] flex items-center justify-center relative">
        {loading && (
          <div className="flex items-center gap-2 text-slate-400 text-xs py-2 font-medium">
            <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-600" />
            <span>Menghubungkan ke Cloudflare Turnstile...</span>
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 text-rose-600 text-xs py-2 font-medium">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>Gagal memuat verifikasi keamanan. Silakan klik muat ulang.</span>
          </div>
        )}

        <div
          ref={containerRef}
          className={`w-full flex justify-center ${error ? "hidden" : "block"}`}
        />
      </div>
    </div>
  );
};

export default CloudflareTurnstile;
