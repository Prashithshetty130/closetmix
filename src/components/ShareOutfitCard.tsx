"use client";

import { useState, useRef } from "react";
import { Download, Share2, Check, Sparkles, X, Shield, Eye } from "lucide-react";

interface ClothingItem {
  id: string;
  name: string;
  category: string;
  primaryColor: string;
  primaryColorHex: string;
  processedImageUrl: string;
  thumbnailUrl: string;
}

interface OutfitSlot {
  slot: string;
  item: ClothingItem;
}

interface GeneratedOutfit {
  id: string;
  name: string;
  occasion: string;
  weatherSuitability: string;
  confidenceScore: number;
  stylingExplanation: string;
  colorHarmony: string;
  items: OutfitSlot[];
}

interface ShareOutfitCardProps {
  outfit: GeneratedOutfit;
  onClose: () => void;
}

export default function ShareOutfitCard({ outfit, onClose }: ShareOutfitCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [includeNames, setIncludeNames] = useState(true);
  const [includeExplanation, setIncludeExplanation] = useState(true);
  const [includeWatermark, setIncludeWatermark] = useState(true);
  const [cardTheme, setCardTheme] = useState<"dark" | "light">("dark");
  const [isExporting, setIsExporting] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const handleExportPng = async () => {
    setIsExporting(true);
    try {
      // Create high-resolution offscreen canvas
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const width = 800;
      const height = includeExplanation ? 1000 : 750;
      canvas.width = width;
      canvas.height = height;

      // Draw background
      ctx.fillStyle = cardTheme === "dark" ? "#0c0e14" : "#fdfbf7";
      ctx.fillRect(0, 0, width, height);

      // Draw subtle border
      ctx.strokeStyle = cardTheme === "dark" ? "rgba(229, 185, 95, 0.4)" : "#d4af37";
      ctx.lineWidth = 4;
      ctx.strokeRect(20, 20, width - 40, height - 40);

      // Header Brand
      ctx.fillStyle = cardTheme === "dark" ? "#e5b95f" : "#a67c1e";
      ctx.font = "bold 24px 'Playfair Display', serif";
      ctx.textAlign = "center";
      ctx.fillText(includeWatermark ? "VESTIQ AI ATELIER" : "CURATED OUTFIT EDIT", width / 2, 70);

      // Outfit Title
      ctx.fillStyle = cardTheme === "dark" ? "#ffffff" : "#1a1a1a";
      ctx.font = "bold 28px 'Plus Jakarta Sans', sans-serif";
      ctx.fillText(outfit.name, width / 2, 120);

      // Occasion & Match badge
      ctx.font = "16px 'Plus Jakarta Sans', sans-serif";
      ctx.fillStyle = cardTheme === "dark" ? "#94a3b8" : "#666666";
      ctx.fillText(`${outfit.occasion} • ${outfit.confidenceScore}% Match Score`, width / 2, 150);

      // Load garment images onto canvas
      const itemCount = outfit.items.length;
      const cols = itemCount <= 3 ? itemCount : 2;
      const rows = Math.ceil(itemCount / cols);
      const imgWidth = 260;
      const imgHeight = 220;

      const startY = 190;
      for (let i = 0; i < itemCount; i++) {
        const slot = outfit.items[i];
        const col = i % cols;
        const row = Math.floor(i / cols);
        const x = cols === 2 ? 100 + col * 320 : 60 + col * 240;
        const y = startY + row * 240;

        // Draw image frame
        ctx.fillStyle = cardTheme === "dark" ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)";
        ctx.fillRect(x, y, imgWidth, imgHeight);

        // Load image element
        const img = new Image();
        img.crossOrigin = "anonymous";
        await new Promise((resolve) => {
          img.onload = resolve;
          img.onerror = resolve;
          img.src = slot.item.processedImageUrl || slot.item.thumbnailUrl;
        });

        try {
          ctx.drawImage(img, x + 30, y + 20, imgWidth - 60, imgHeight - 60);
        } catch {}

        if (includeNames) {
          ctx.fillStyle = cardTheme === "dark" ? "#f8fafc" : "#111111";
          ctx.font = "bold 14px 'Plus Jakarta Sans', sans-serif";
          ctx.textAlign = "center";
          ctx.fillText(slot.item.name, x + imgWidth / 2, y + imgHeight - 12);
        }
      }

      // Explanation box
      if (includeExplanation) {
        const boxY = height - 160;
        ctx.fillStyle = cardTheme === "dark" ? "rgba(229,185,95,0.08)" : "rgba(180,130,30,0.08)";
        ctx.fillRect(60, boxY, width - 120, 90);

        ctx.fillStyle = cardTheme === "dark" ? "#e5b95f" : "#8d6411";
        ctx.font = "bold 14px 'Plus Jakarta Sans', sans-serif";
        ctx.textAlign = "left";
        ctx.fillText("STYLIST HARMONY NOTE:", 80, boxY + 30);

        ctx.fillStyle = cardTheme === "dark" ? "#cbd5e1" : "#333333";
        ctx.font = "14px 'Plus Jakarta Sans', sans-serif";
        ctx.fillText(outfit.colorHarmony, 80, boxY + 60);
      }

      // Convert to blob and download
      const dataUrl = canvas.toDataURL("image/png");
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `vestiq-outfit-${outfit.id}.png`;
      a.click();
    } catch (err) {
      alert("Failed to export image.");
    } finally {
      setIsExporting(false);
    }
  };

  const handleCopyLink = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Share Outfit Card Modal"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(0, 0, 0, 0.85)",
        backdropFilter: "blur(12px)",
        zIndex: 150,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
      }}
      onClick={onClose}
    >
      <div
        className="glass-panel"
        style={{
          maxWidth: "750px",
          width: "100%",
          maxHeight: "92vh",
          overflowY: "auto",
          padding: "32px",
          borderRadius: "var(--radius-lg)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <Share2 size={20} color="var(--gold-primary)" />
            <h3 style={{ fontSize: "1.3rem" }}>Export & Share Outfit Card</h3>
          </div>
          <button onClick={onClose} aria-label="Close modal" style={{ color: "var(--text-muted)", cursor: "pointer" }}>
            <X size={20} />
          </button>
        </div>

        {/* Customization Options Bar */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "14px",
            padding: "16px",
            background: "rgba(255, 255, 255, 0.03)",
            borderRadius: "var(--radius-md)",
            border: "1px solid var(--border-subtle)",
            marginBottom: "24px",
            fontSize: "0.85rem",
          }}
        >
          <label style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={includeNames}
              onChange={(e) => setIncludeNames(e.target.checked)}
            />
            <span>Show Item Titles</span>
          </label>

          <label style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={includeExplanation}
              onChange={(e) => setIncludeExplanation(e.target.checked)}
            />
            <span>Show Stylist Notes</span>
          </label>

          <label style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={includeWatermark}
              onChange={(e) => setIncludeWatermark(e.target.checked)}
            />
            <span>Vestiq Brandmark</span>
          </label>

          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginLeft: "auto" }}>
            <span style={{ color: "var(--text-muted)" }}>Theme:</span>
            <button
              onClick={() => setCardTheme(cardTheme === "dark" ? "light" : "dark")}
              className="chip"
            >
              {cardTheme === "dark" ? "Obsidian Dark" : "Champagne Light"}
            </button>
          </div>
        </div>

        {/* Live Card Preview */}
        <div
          ref={cardRef}
          style={{
            borderRadius: "var(--radius-md)",
            border: "2px solid var(--border-accent)",
            background: cardTheme === "dark" ? "#0c0e14" : "#fdfbf7",
            color: cardTheme === "dark" ? "#ffffff" : "#111111",
            padding: "28px",
            textAlign: "center",
            boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
            marginBottom: "28px",
          }}
        >
          {includeWatermark && (
            <p
              style={{
                fontFamily: "var(--font-serif)",
                fontSize: "1.1rem",
                letterSpacing: "0.1em",
                color: cardTheme === "dark" ? "var(--gold-primary)" : "#a67c1e",
                fontWeight: 700,
                marginBottom: "6px",
              }}
            >
              VESTIQ AI ATELIER
            </p>
          )}

          <h4 style={{ fontSize: "1.4rem", fontWeight: 700, marginBottom: "4px" }}>{outfit.name}</h4>
          <p style={{ fontSize: "0.85rem", color: cardTheme === "dark" ? "var(--text-secondary)" : "#666666", marginBottom: "20px" }}>
            {outfit.occasion} • {outfit.confidenceScore}% Match Score
          </p>

          {/* Garments Collage Preview */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: `repeat(${outfit.items.length <= 3 ? outfit.items.length : 2}, 1fr)`,
              gap: "14px",
              marginBottom: "20px",
            }}
          >
            {outfit.items.map((slot, i) => (
              <div
                key={i}
                style={{
                  background: cardTheme === "dark" ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)",
                  borderRadius: "var(--radius-sm)",
                  padding: "12px",
                }}
              >
                <div style={{ height: "110px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <img
                    src={slot.item.processedImageUrl || slot.item.thumbnailUrl}
                    alt={slot.item.name}
                    style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }}
                  />
                </div>
                {includeNames && (
                  <p style={{ fontSize: "0.8rem", fontWeight: 600, marginTop: "6px" }}>{slot.item.name}</p>
                )}
              </div>
            ))}
          </div>

          {includeExplanation && (
            <div
              style={{
                padding: "12px 16px",
                background: cardTheme === "dark" ? "rgba(229,185,95,0.08)" : "rgba(180,130,30,0.08)",
                borderRadius: "var(--radius-sm)",
                textAlign: "left",
                fontSize: "0.85rem",
              }}
            >
              <strong style={{ color: cardTheme === "dark" ? "var(--gold-primary)" : "#8d6411" }}>
                Harmony Analysis:{" "}
              </strong>
              <span>{outfit.colorHarmony}</span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
          <button onClick={handleCopyLink} className="btn-secondary" style={{ padding: "10px 18px" }}>
            {copiedLink ? <Check size={16} /> : <Share2 size={16} />}
            <span>{copiedLink ? "Link Copied!" : "Copy Page Link"}</span>
          </button>

          <button
            onClick={handleExportPng}
            disabled={isExporting}
            className="btn-primary"
            style={{ padding: "10px 22px" }}
          >
            <Download size={16} />
            <span>{isExporting ? "Rendering Image..." : "Download High-Res Card"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
