"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Cookie, ShieldCheck, X } from "lucide-react";

export default function CookieConsent() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Check if user previously made a cookie consent selection
    try {
      const consent = localStorage.getItem("closetmix_cookie_consent");
      if (!consent) {
        // Small delay so it smoothly appears
        const timer = setTimeout(() => setIsOpen(true), 1200);
        return () => clearTimeout(timer);
      }
    } catch {
      // Ignore localStorage exceptions in private browsing
    }
  }, []);

  const handleConsent = (level: "all" | "essential") => {
    try {
      localStorage.setItem("closetmix_cookie_consent", level);
    } catch {
      // Ignore
    }
    setIsOpen(false);
  };

  if (!isOpen) return null;

  return (
    <aside
      role="region"
      aria-label="Cookie and Privacy Consent"
      style={{
        position: "fixed",
        bottom: "20px",
        left: "50%",
        transform: "translateX(-50%)",
        width: "calc(100% - 40px)",
        maxWidth: "680px",
        zIndex: 9999,
        background: "rgba(16, 18, 26, 0.95)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        border: "1px solid var(--border-accent)",
        boxShadow: "0 12px 40px rgba(0, 0, 0, 0.65), 0 0 20px var(--gold-glow)",
        borderRadius: "var(--radius-md)",
        padding: "20px 24px",
        display: "flex",
        flexDirection: "column",
        gap: "14px",
        animation: "fadeIn 0.3s ease-out",
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "12px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "10px",
              background: "rgba(229, 185, 95, 0.15)",
              border: "1px solid var(--border-accent)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--gold-primary)",
              flexShrink: 0,
            }}
          >
            <Cookie size={20} />
          </div>
          <div>
            <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>
              Privacy &amp; Cookie Preferences
            </h3>
            <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
              No third-party ad trackers or data broker cookies.
            </span>
          </div>
        </div>

        <button
          onClick={() => handleConsent("essential")}
          aria-label="Dismiss cookie notice"
          style={{
            background: "transparent",
            border: "none",
            color: "var(--text-muted)",
            cursor: "pointer",
            padding: "4px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <X size={18} />
        </button>
      </div>

      <p style={{ fontSize: "0.88rem", color: "var(--text-secondary)", lineHeight: 1.5, margin: 0 }}>
        Closetmix uses strictly necessary session cookies (<code style={{ color: "var(--gold-primary)", background: "rgba(0,0,0,0.3)", padding: "1px 5px", borderRadius: "4px" }}>closetmix_session</code>) to keep you securely signed in and functional local storage for theme/styling preferences. We do not track your activity across other websites. Read our{" "}
        <Link href="/cookies" style={{ color: "var(--gold-primary)", textDecoration: "underline" }}>
          Cookie Policy
        </Link>{" "}
        and{" "}
        <Link href="/privacy" style={{ color: "var(--gold-primary)", textDecoration: "underline" }}>
          Privacy Policy
        </Link>.
      </p>

      <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", justifyContent: "flex-end", alignItems: "center" }}>
        <button
          type="button"
          onClick={() => handleConsent("essential")}
          className="btn-secondary"
          style={{ fontSize: "0.85rem", padding: "8px 16px" }}
        >
          Strictly Necessary Only
        </button>
        <button
          type="button"
          onClick={() => handleConsent("all")}
          className="btn-primary"
          style={{ fontSize: "0.85rem", padding: "8px 18px" }}
        >
          <ShieldCheck size={16} />
          <span>Accept &amp; Continue</span>
        </button>
      </div>
    </aside>
  );
}
