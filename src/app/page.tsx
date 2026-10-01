"use client";

import Link from "next/link";
import { Sparkles, Shirt, CloudSun, ShieldCheck, ArrowRight, Wand2, Compass, Layers } from "lucide-react";

export default function Home() {
  return (
    <div className="app-container" style={{ paddingTop: "40px" }}>
      {/* Hero Section */}
      <section
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
          maxWidth: "880px",
          margin: "0 auto",
          padding: "60px 0 40px",
        }}
      >
        <div
          className="chip"
          style={{
            marginBottom: "20px",
            borderColor: "var(--border-accent)",
            background: "rgba(229, 185, 95, 0.1)",
            color: "var(--gold-primary)",
            padding: "6px 16px",
          }}
        >
          <Sparkles size={14} />
          <span>Next-Generation Multimodal Wardrobe AI</span>
        </div>

        <h1
          style={{
            fontSize: "clamp(2.5rem, 5vw, 4.2rem)",
            fontWeight: 800,
            lineHeight: 1.1,
            marginBottom: "24px",
            letterSpacing: "-0.03em",
          }}
        >
          Your Physical Wardrobe.{" "}
          <span
            style={{
              background: "linear-gradient(135deg, var(--gold-primary) 20%, #ffffff 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            Endlessly Styled.
          </span>
        </h1>

        <p
          style={{
            fontSize: "clamp(1.05rem, 2vw, 1.25rem)",
            color: "var(--text-secondary)",
            lineHeight: 1.6,
            marginBottom: "36px",
            maxWidth: "680px",
          }}
        >
          Digitize your clothes in seconds. Our AI isolates garments, extracts fashion attributes, and creates editorial flat-lay outfits tuned to your weather, occasion, and style.
        </p>

        <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", justifyContent: "center" }}>
          <Link href="/wardrobe/upload" className="btn-primary" style={{ padding: "14px 30px", fontSize: "1.05rem" }}>
            <Shirt size={20} />
            <span>Digitize Your Clothes</span>
            <ArrowRight size={18} />
          </Link>
          <Link href="/outfits" className="btn-secondary" style={{ padding: "14px 28px", fontSize: "1.05rem" }}>
            <Wand2 size={20} color="var(--gold-primary)" />
            <span>Generate Outfits</span>
          </Link>
        </div>

        {/* Privacy Callout */}
        <div
          style={{
            marginTop: "30px",
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            fontSize: "0.85rem",
            color: "var(--text-muted)",
          }}
        >
          <ShieldCheck size={16} color="var(--accent-emerald)" />
          <span>100% Private Vault: EXIF stripped, face-shielded, isolated per-user storage.</span>
        </div>
      </section>

      {/* Feature Highlights Grid */}
      <section
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: "24px",
          marginTop: "50px",
        }}
      >
        <div className="glass-panel glass-panel-hover" style={{ padding: "30px" }}>
          <div
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "14px",
              background: "rgba(229, 185, 95, 0.15)",
              border: "1px solid var(--border-accent)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: "20px",
              color: "var(--gold-primary)",
            }}
          >
            <Layers size={24} />
          </div>
          <h3 style={{ fontSize: "1.25rem", marginBottom: "12px" }}>Background-Free Closet</h3>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem", lineHeight: 1.6 }}>
            Snap quick photos on your bed or hanger. Our pipeline cuts out backgrounds and standardizes lighting for an editorial flat-lay catalog.
          </p>
        </div>

        <div className="glass-panel glass-panel-hover" style={{ padding: "30px" }}>
          <div
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "14px",
              background: "rgba(99, 102, 241, 0.15)",
              border: "1px solid rgba(99, 102, 241, 0.3)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: "20px",
              color: "var(--accent-indigo)",
            }}
          >
            <CloudSun size={24} />
          </div>
          <h3 style={{ fontSize: "1.25rem", marginBottom: "12px" }}>Weather & Occasion Logic</h3>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem", lineHeight: 1.6 }}>
            Combines color harmony rules and live meteorological forecasts so you never get recommended boots in a heatwave or white linen in the rain.
          </p>
        </div>

        <div className="glass-panel glass-panel-hover" style={{ padding: "30px" }}>
          <div
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "14px",
              background: "rgba(52, 211, 153, 0.15)",
              border: "1px solid rgba(52, 211, 153, 0.3)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: "20px",
              color: "var(--accent-emerald)",
            }}
          >
            <Compass size={24} />
          </div>
          <h3 style={{ fontSize: "1.25rem", marginBottom: "12px" }}>Wardrobe Gap Analysis</h3>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem", lineHeight: 1.6 }}>
            Calculates cost-per-wear and reveals exactly which staple item to acquire next to unlock the maximum number of new outfit permutations.
          </p>
        </div>
      </section>
    </div>
  );
}
