"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  BarChart2,
  PieChart,
  Luggage,
  Sparkles,
  ArrowRight,
  ShieldAlert,
  Shirt,
  Calendar,
  Layers,
  CheckCircle2,
  AlertCircle,
  Copy,
} from "lucide-react";

interface WardrobeGap {
  id: string;
  type: string;
  title: string;
  description: string;
  suggestedItem: string;
  potentialOutfitsUnlocked: number;
}

interface TravelDay {
  dayNumber: number;
  label: string;
  outfitItems: any[];
  stylingNote: string;
}

interface TravelCapsule {
  totalPieces: number;
  pieces: any[];
  schedule: TravelDay[];
  versatilityScore: number;
}

interface InsightsData {
  totalGarments: number;
  totalWears: number;
  categoryDistribution: Record<string, number>;
  formalityDistribution: Record<string, number>;
  gaps: WardrobeGap[];
  mostWorn: any[];
  unwornCount: number;
  unwornItems: any[];
}

export default function InsightsPage() {
  const [data, setData] = useState<InsightsData | null>(null);
  const [loading, setLoading] = useState(true);

  // Travel Capsule Generator state
  const [tripDays, setTripDays] = useState(5);
  const [capsulePieces, setCapsulePieces] = useState(8);
  const [capsuleResult, setCapsuleResult] = useState<TravelCapsule | null>(null);
  const [isBuildingCapsule, setIsBuildingCapsule] = useState(false);
  const [copiedChecklist, setCopiedChecklist] = useState(false);

  useEffect(() => {
    fetch("/api/insights")
      .then((res) => res.json())
      .then((d) => {
        if (d.success) setData(d);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleGenerateCapsule = async () => {
    setIsBuildingCapsule(true);
    try {
      const res = await fetch(`/api/insights?mode=capsule&days=${tripDays}&pieces=${capsulePieces}`);
      const json = await res.json();
      if (json.success) {
        setCapsuleResult(json.capsule);
      }
    } catch (err) {
      alert("Failed to build capsule packing list.");
    } finally {
      setIsBuildingCapsule(false);
    }
  };

  const copyPackingChecklist = () => {
    if (!capsuleResult) return;
    const text = `🧳 VESTIQ TRAVEL CAPSULE (${capsuleResult.totalPieces} Pieces for ${tripDays} Days):\n\n` +
      capsuleResult.pieces.map((p, i) => `${i + 1}. [ ] ${p.name} (${p.category})`).join("\n") +
      `\n\nVersatility Score: ${capsuleResult.versatilityScore}%`;

    navigator.clipboard.writeText(text);
    setCopiedChecklist(true);
    setTimeout(() => setCopiedChecklist(false), 2500);
  };

  if (loading) {
    return (
      <div className="app-container" style={{ paddingTop: "60px", textAlign: "center" }}>
        <p style={{ color: "var(--text-muted)" }}>Analyzing wardrobe dynamics & combinations...</p>
      </div>
    );
  }

  return (
    <div className="app-container" style={{ paddingTop: "36px" }}>
      {/* Page Title */}
      <div style={{ marginBottom: "28px" }}>
        <h1 style={{ fontSize: "2.2rem", marginBottom: "6px" }}>Wardrobe Analytics & Gap Inspector</h1>
        <p style={{ color: "var(--text-secondary)" }}>
          Uncover closet imbalances, identify missing staples that multiply combinations, and pack smart travel capsules.
        </p>
      </div>

      {/* Metric Cards Top Row */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "18px",
          marginBottom: "36px",
        }}
      >
        <div className="glass-panel" style={{ padding: "24px" }}>
          <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", textTransform: "uppercase" }}>
            Total Garments
          </span>
          <p style={{ fontSize: "2.2rem", fontWeight: 800, color: "var(--text-primary)", marginTop: "4px" }}>
            {data?.totalGarments ?? 0}
          </p>
          <span style={{ fontSize: "0.85rem", color: "var(--gold-primary)" }}>Digitized & cataloged</span>
        </div>

        <div className="glass-panel" style={{ padding: "24px" }}>
          <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", textTransform: "uppercase" }}>
            Total Wears Logged
          </span>
          <p style={{ fontSize: "2.2rem", fontWeight: 800, color: "var(--accent-indigo)", marginTop: "4px" }}>
            {data?.totalWears ?? 0}
          </p>
          <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>Wear tracking active</span>
        </div>

        <div className="glass-panel" style={{ padding: "24px" }}>
          <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", textTransform: "uppercase" }}>
            Dormant / Unworn
          </span>
          <p style={{ fontSize: "2.2rem", fontWeight: 800, color: "var(--accent-amber)", marginTop: "4px" }}>
            {data?.unwornCount ?? 0}
          </p>
          <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>Unworn for 30+ days</span>
        </div>

        <div className="glass-panel" style={{ padding: "24px" }}>
          <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", textTransform: "uppercase" }}>
            Identified Closet Gaps
          </span>
          <p style={{ fontSize: "2.2rem", fontWeight: 800, color: "var(--gold-primary)", marginTop: "4px" }}>
            {data?.gaps.length ?? 0}
          </p>
          <span style={{ fontSize: "0.85rem", color: "var(--gold-primary)" }}>High-leverage additions</span>
        </div>
      </div>

      {/* Gap Analysis Recommendations */}
      <div style={{ marginBottom: "40px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
          <Sparkles size={22} color="var(--gold-primary)" />
          <h2 style={{ fontSize: "1.45rem" }}>High-Leverage Wardrobe Gap Analysis</h2>
        </div>

        {data?.gaps.length === 0 ? (
          <div className="glass-panel" style={{ padding: "30px", textAlign: "center" }}>
            <CheckCircle2 size={36} color="var(--accent-emerald)" style={{ marginBottom: "12px" }} />
            <h3 style={{ fontSize: "1.2rem", marginBottom: "6px" }}>Optimal Closet Balance</h3>
            <p style={{ color: "var(--text-secondary)" }}>
              Your wardrobe demonstrates balanced top-to-bottom ratios and adequate seasonal coverage!
            </p>
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
              gap: "20px",
            }}
          >
            {data?.gaps.map((gap) => (
              <div
                key={gap.id}
                className="glass-panel"
                style={{
                  padding: "24px",
                  borderRadius: "var(--radius-md)",
                  border: "1px solid var(--border-accent)",
                  background:
                    "linear-gradient(135deg, rgba(229, 185, 95, 0.06) 0%, rgba(18, 21, 30, 0.7) 100%)",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "10px" }}>
                  <h3 style={{ fontSize: "1.15rem", fontWeight: 700 }}>{gap.title}</h3>
                  <span
                    className="chip"
                    style={{
                      background: "rgba(52, 211, 153, 0.15)",
                      color: "var(--accent-emerald)",
                      borderColor: "rgba(52, 211, 153, 0.3)",
                    }}
                  >
                    +{gap.potentialOutfitsUnlocked} Outfits
                  </span>
                </div>

                <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", lineHeight: 1.5, marginBottom: "16px" }}>
                  {gap.description}
                </p>

                <div
                  style={{
                    padding: "12px 14px",
                    background: "rgba(0,0,0,0.3)",
                    borderRadius: "var(--radius-sm)",
                    border: "1px solid var(--border-subtle)",
                  }}
                >
                  <span style={{ fontSize: "0.75rem", color: "var(--gold-primary)", textTransform: "uppercase", fontWeight: 700 }}>
                    Recommended Next Acquisition:
                  </span>
                  <p style={{ fontSize: "0.95rem", fontWeight: 600, marginTop: "2px" }}>
                    {gap.suggestedItem}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Travel Capsule & Packing List Generator */}
      <div
        className="glass-panel"
        style={{
          padding: "32px",
          borderRadius: "var(--radius-lg)",
          marginBottom: "40px",
          border: "1px solid rgba(99, 102, 241, 0.3)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
          <Luggage size={24} color="var(--accent-indigo)" />
          <h2 style={{ fontSize: "1.45rem" }}>Travel Capsule Wardrobe & Packing Optimizer</h2>
        </div>
        <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem", marginBottom: "24px" }}>
          Going on a trip? Let AI select the minimum number of garments that combine interchangeably into fresh daily outfits without overpacking.
        </p>

        {/* Controls */}
        <div
          style={{
            display: "flex",
            gap: "18px",
            alignItems: "flex-end",
            flexWrap: "wrap",
            marginBottom: "28px",
          }}
        >
          <div>
            <label style={{ display: "block", fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "6px" }}>
              Trip Duration
            </label>
            <select
              value={tripDays}
              onChange={(e) => setTripDays(parseInt(e.target.value, 10))}
              style={{
                padding: "10px 14px",
                background: "#161922",
                border: "1px solid var(--border-subtle)",
                borderRadius: "var(--radius-md)",
                color: "var(--text-primary)",
              }}
            >
              <option value={3}>3 Days (Weekend Getaway)</option>
              <option value={5}>5 Days (Work / City Break)</option>
              <option value={7}>7 Days (Full Week)</option>
            </select>
          </div>

          <div>
            <label style={{ display: "block", fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "6px" }}>
              Luggage Target Size
            </label>
            <select
              value={capsulePieces}
              onChange={(e) => setCapsulePieces(parseInt(e.target.value, 10))}
              style={{
                padding: "10px 14px",
                background: "#161922",
                border: "1px solid var(--border-subtle)",
                borderRadius: "var(--radius-md)",
                color: "var(--text-primary)",
              }}
            >
              <option value={6}>6 Pieces (Ultralight Carry-on)</option>
              <option value={8}>8 Pieces (Standard Capsule)</option>
              <option value={10}>10 Pieces (Comfort Capsule)</option>
            </select>
          </div>

          <button
            onClick={handleGenerateCapsule}
            disabled={isBuildingCapsule}
            className="btn-primary"
            style={{ padding: "10px 24px" }}
          >
            <Luggage size={18} />
            <span>{isBuildingCapsule ? "Synthesizing Capsule..." : "Build Packing Capsule"}</span>
          </button>
        </div>

        {/* Capsule Results */}
        {capsuleResult && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <h3 style={{ fontSize: "1.2rem" }}>
                  Optimized {capsuleResult.totalPieces}-Piece Capsule
                </h3>
                <span className="chip" style={{ background: "rgba(99, 102, 241, 0.15)", color: "var(--accent-indigo)" }}>
                  {capsuleResult.versatilityScore}% Versatility Synergy
                </span>
              </div>

              <button onClick={copyPackingChecklist} className="btn-secondary" style={{ padding: "6px 14px", fontSize: "0.85rem" }}>
                <Copy size={14} />
                <span>{copiedChecklist ? "Copied to Clipboard!" : "Copy Packing Checklist"}</span>
              </button>
            </div>

            {/* Pieces Grid */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))",
                gap: "12px",
                marginBottom: "28px",
              }}
            >
              {capsuleResult.pieces.map((piece) => (
                <div
                  key={piece.id}
                  style={{
                    background: "rgba(0,0,0,0.3)",
                    border: "1px solid var(--border-subtle)",
                    borderRadius: "var(--radius-md)",
                    padding: "10px",
                    textAlign: "center",
                  }}
                >
                  <div style={{ height: "90px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <img
                      src={piece.processedImageUrl || piece.thumbnailUrl}
                      alt={piece.name}
                      style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }}
                    />
                  </div>
                  <span style={{ fontSize: "0.7rem", color: "var(--gold-primary)", textTransform: "uppercase" }}>
                    {piece.category}
                  </span>
                  <p style={{ fontSize: "0.8rem", fontWeight: 600, marginTop: "2px", lineHeight: 1.2 }}>
                    {piece.name}
                  </p>
                </div>
              ))}
            </div>

            {/* Daily Schedule */}
            <h4 style={{ fontSize: "1rem", marginBottom: "12px", color: "var(--text-muted)", textTransform: "uppercase" }}>
              Daily Itinerary Outfits
            </h4>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "14px" }}>
              {capsuleResult.schedule.map((day) => (
                <div
                  key={day.dayNumber}
                  style={{
                    background: "rgba(255, 255, 255, 0.03)",
                    border: "1px solid var(--border-subtle)",
                    borderRadius: "var(--radius-md)",
                    padding: "14px",
                  }}
                >
                  <p style={{ fontSize: "0.9rem", fontWeight: 700, color: "var(--gold-primary)", marginBottom: "8px" }}>
                    {day.label}
                  </p>
                  <div style={{ display: "flex", gap: "6px", marginBottom: "8px" }}>
                    {day.outfitItems.map((item, idx) => (
                      <div key={idx} style={{ width: "36px", height: "36px", background: "rgba(0,0,0,0.3)", borderRadius: "4px", padding: "2px" }}>
                        <img
                          src={item.processedImageUrl || item.thumbnailUrl}
                          alt={item.name}
                          style={{ width: "100%", height: "100%", objectFit: "contain" }}
                        />
                      </div>
                    ))}
                  </div>
                  <p style={{ fontSize: "0.78rem", color: "var(--text-secondary)", lineHeight: 1.4 }}>
                    {day.stylingNote}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
