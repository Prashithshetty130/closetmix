"use client";

import { useEffect, useState, useTransition, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Sparkles,
  Wand2,
  CloudSun,
  Lock,
  Unlock,
  RefreshCw,
  Heart,
  Bookmark,
  Share2,
  Check,
  AlertCircle,
  PackagePlus,
  ArrowRight,
  Shirt,
  Calendar,
  ThumbsUp,
  ThumbsDown,
} from "lucide-react";

import ShareOutfitCard from "@/components/ShareOutfitCard";

interface ClothingItem {
  id: string;
  name: string;
  category: string;
  subcategory: string;
  primaryColor: string;
  primaryColorHex: string;
  processedImageUrl: string;
  thumbnailUrl: string;
  formality: string;
}

interface OutfitSlot {
  slot: string;
  item: ClothingItem;
  isLocked: boolean;
}

interface GeneratedOutfit {
  id: string;
  name: string;
  occasion: string;
  weatherSuitability: string;
  confidenceScore: number;
  stylingExplanation: string;
  colorHarmony: string;
  proportionNote: string;
  items: OutfitSlot[];
}

interface WeatherInfo {
  city: string;
  temperatureC: number;
  condition: string;
  isRaining: boolean;
  recommendation: string;
}

const OCCASIONS = ["Casual", "Date Night", "Business", "Gym", "Travel", "Party / Evening"];
const MOODS = ["Effortless Casual", "Parisian Chic", "Minimalist Clean", "Old Money Preppy", "Modern Streetwear", "Monochrome"];

function OutfitStudioContent() {
  const searchParams = useSearchParams();
  const buildAroundParam = searchParams.get("buildAround");

  // Generator inputs
  const [occasion, setOccasion] = useState("Casual");
  const [mood, setMood] = useState("Effortless Casual");
  const [city, setCity] = useState("New York");
  const [gender, setGender] = useState<"male" | "female">("male");
  const [excludeColor, setExcludeColor] = useState("");
  const [colorExclusions, setColorExclusions] = useState<string[]>([]);
  const [buildAroundId, setBuildAroundId] = useState<string | null>(buildAroundParam);

  // Studio State
  const [wardrobe, setWardrobe] = useState<ClothingItem[]>([]);
  const [weather, setWeather] = useState<WeatherInfo | null>(null);
  const [outfits, setOutfits] = useState<GeneratedOutfit[]>([]);
  const [activeOutfitIndex, setActiveOutfitIndex] = useState(0);
  const [lockedItemIds, setLockedItemIds] = useState<string[]>(buildAroundParam ? [buildAroundParam] : []);

  // UI state
  const [isGenerating, setIsGenerating] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [regenSuccessMsg, setRegenSuccessMsg] = useState<string | null>(null);
  const [coldStartError, setColdStartError] = useState<string | null>(null);
  const [savedSuccessId, setSavedSuccessId] = useState<string | null>(null);
  const [feedbackGiven, setFeedbackGiven] = useState<Record<string, boolean>>({});
  const [swapModalSlot, setSwapModalSlot] = useState<string | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);

  useEffect(() => {
    // Fetch user preferences (gender, styling aesthetics)
    fetch("/api/user/preferences")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.preferences?.gender) {
          setGender(data.preferences.gender);
        }
      })
      .catch(() => {});

    // Load wardrobe items and initial weather
    fetch("/api/wardrobe/items")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setWardrobe(data.items);
          if (data.items.length >= 3) {
            // Auto generate initial outfits if user has pieces
            handleGenerate([], false, data.items);
          }
        }
      });

    fetchWeather(city);
  }, []);

  const handleGenderChange = async (newGender: "male" | "female") => {
    setGender(newGender);
    fetch("/api/user/preferences", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ gender: newGender }),
    }).catch(() => {});
    // Immediately regenerate with newly selected gender styling aesthetic
    handleGenerate(undefined, true, undefined, newGender);
  };

  const fetchWeather = async (targetCity: string) => {
    try {
      const res = await fetch(`/api/weather?city=${encodeURIComponent(targetCity)}`);
      const data = await res.json();
      if (data.success) {
        setWeather(data.weather);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleGenerate = async (
    explicitLockedIds?: string[],
    isRegen: boolean = false,
    explicitWardrobe?: ClothingItem[],
    overrideGender?: "male" | "female"
  ) => {
    if (isRegen) {
      setIsRegenerating(true);
    } else {
      setIsGenerating(true);
    }
    setColdStartError(null);
    setSavedSuccessId(null);
    setRegenSuccessMsg(null);

    try {
      const activeIds = outfits[activeOutfitIndex]
        ? outfits[activeOutfitIndex].items.map((s) => s.item.id)
        : [];
      const currentLocks = explicitLockedIds !== undefined ? explicitLockedIds : lockedItemIds;

      const res = await fetch("/api/outfits/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          occasion,
          mood,
          gender: overrideGender || gender,
          city,
          colorExclusions,
          buildAroundItemId: buildAroundId,
          lockedItemIds: currentLocks,
          currentOutfitItemIds: isRegen ? activeIds : [],
          seed: Date.now(),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        if (data.coldStartSuggestion) {
          setColdStartError(data.coldStartSuggestion);
        } else {
          throw new Error(data.error || "Failed to generate outfits");
        }
      } else {
        const newOutfits: GeneratedOutfit[] = data.outfits || [];
        setOutfits(newOutfits);
        setActiveOutfitIndex(0);
        if (data.weather) setWeather(data.weather);

        if (isRegen) {
          setRegenSuccessMsg("✓ Fresh styling generated!");
          setTimeout(() => setRegenSuccessMsg(null), 3000);
        }
      }
    } catch (err: any) {
      alert(`Generation error: ${err.message}`);
    } finally {
      setIsGenerating(false);
      setIsRegenerating(false);
    }
  };

  const toggleLockItem = (itemId: string) => {
    setLockedItemIds((prev) =>
      prev.includes(itemId) ? prev.filter((id) => id !== itemId) : [...prev, itemId]
    );
  };

  const handleSwapItem = (slot: string, newItem: ClothingItem) => {
    setOutfits((prev) => {
      const copy = [...prev];
      const cur = copy[activeOutfitIndex];
      if (cur) {
        cur.items = cur.items.map((s) =>
          s.slot === slot ? { ...s, item: newItem } : s
        );
      }
      return copy;
    });
    setSwapModalSlot(null);
  };

  const handleSaveOutfit = async () => {
    const current = outfits[activeOutfitIndex];
    if (!current) return;

    try {
      const slotMap: Record<string, string> = {};
      current.items.forEach((s) => {
        slotMap[s.item.id] = s.slot;
      });

      const res = await fetch("/api/outfits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: current.name,
          occasion: current.occasion,
          weatherSuitability: current.weatherSuitability,
          confidenceScore: current.confidenceScore,
          stylingExplanation: current.stylingExplanation,
          itemIds: current.items.map((s) => s.item.id),
          slotMapping: slotMap,
        }),
      });

      if (res.ok) {
        setSavedSuccessId(current.id);
      }
    } catch (err) {
      alert("Failed to save outfit.");
    }
  };

  const handleAddColorExclusion = () => {
    if (!excludeColor.trim()) return;
    setColorExclusions((prev) => [...prev, excludeColor.trim().toLowerCase()]);
    setExcludeColor("");
  };

  const removeColorExclusion = (color: string) => {
    setColorExclusions((prev) => prev.filter((c) => c !== color));
  };

  const currentOutfit = outfits[activeOutfitIndex];

  return (
    <div className="app-container" style={{ paddingTop: "36px" }}>
      {/* Page Title */}
      <div style={{ marginBottom: "28px" }}>
        <h1 style={{ fontSize: "2.2rem", marginBottom: "6px" }}>AI Outfit Studio</h1>
        <p style={{ color: "var(--text-secondary)" }}>
          Synthesizes color theory, silhouette proportion rules, and live local weather with multimodal AI styling.
        </p>
      </div>

      {/* Control Bar: Requirements & Weather */}
      <div
        className="glass-panel"
        style={{
          padding: "24px",
          borderRadius: "var(--radius-lg)",
          marginBottom: "36px",
          display: "flex",
          flexDirection: "column",
          gap: "20px",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "18px",
          }}
        >
          {/* Occasion */}
          <div>
            <label style={{ display: "block", fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "6px" }}>
              Occasion Setting
            </label>
            <select
              value={occasion}
              onChange={(e) => setOccasion(e.target.value)}
              style={{
                width: "100%",
                padding: "10px 14px",
                background: "#161922",
                border: "1px solid var(--border-subtle)",
                borderRadius: "var(--radius-md)",
                color: "var(--text-primary)",
              }}
            >
              {OCCASIONS.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
          </div>

          {/* Mood / Aesthetic */}
          <div>
            <label style={{ display: "block", fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "6px" }}>
              Aesthetic Mood
            </label>
            <select
              value={mood}
              onChange={(e) => setMood(e.target.value)}
              style={{
                width: "100%",
                padding: "10px 14px",
                background: "#161922",
                border: "1px solid var(--border-subtle)",
                borderRadius: "var(--radius-md)",
                color: "var(--text-primary)",
              }}
            >
              {MOODS.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          {/* Aesthetic / Gender Preference Toggle */}
          <div>
            <label style={{ display: "block", fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "6px" }}>
              Styling Aesthetic
            </label>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                background: "#161922",
                border: "1px solid var(--border-subtle)",
                borderRadius: "var(--radius-md)",
                padding: "3px",
                gap: "4px",
              }}
            >
              <button
                type="button"
                onClick={() => handleGenderChange("male")}
                title="Calibrate styling for masculine tailoring & proportions"
                style={{
                  padding: "8px 10px",
                  borderRadius: "var(--radius-sm)",
                  border: "none",
                  background: gender === "male" ? "var(--gold-primary, #e5b95f)" : "transparent",
                  color: gender === "male" ? "#0a0c12" : "var(--text-secondary)",
                  fontWeight: gender === "male" ? 700 : 500,
                  fontSize: "0.82rem",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "5px",
                }}
              >
                <span>♂ Menswear</span>
              </button>
              <button
                type="button"
                onClick={() => handleGenderChange("female")}
                title="Calibrate styling for feminine drape & chic proportions"
                style={{
                  padding: "8px 10px",
                  borderRadius: "var(--radius-sm)",
                  border: "none",
                  background: gender === "female" ? "var(--gold-primary, #e5b95f)" : "transparent",
                  color: gender === "female" ? "#0a0c12" : "var(--text-secondary)",
                  fontWeight: gender === "female" ? 700 : 500,
                  fontSize: "0.82rem",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "5px",
                }}
              >
                <span>♀ Womenswear</span>
              </button>
            </div>
          </div>

          {/* City / Weather */}
          <div>
            <label style={{ display: "block", fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "6px" }}>
              Live Weather Location
            </label>
            <div style={{ display: "flex", gap: "8px" }}>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                onBlur={() => fetchWeather(city)}
                placeholder="e.g. London, Tokyo"
                style={{
                  flex: 1,
                  padding: "10px 12px",
                  background: "rgba(0,0,0,0.3)",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: "var(--radius-md)",
                  color: "var(--text-primary)",
                }}
              />
              <button
                type="button"
                onClick={() => fetchWeather(city)}
                className="btn-secondary"
                style={{ padding: "0 12px" }}
              >
                <CloudSun size={18} color="var(--gold-primary)" />
              </button>
            </div>
          </div>

          {/* Color Exclusions */}
          <div>
            <label style={{ display: "block", fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "6px" }}>
              Color Exclusions
            </label>
            <div style={{ display: "flex", gap: "8px" }}>
              <input
                type="text"
                placeholder="e.g. Black, Neon"
                value={excludeColor}
                onChange={(e) => setExcludeColor(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddColorExclusion()}
                style={{
                  flex: 1,
                  padding: "10px 12px",
                  background: "rgba(0,0,0,0.3)",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: "var(--radius-md)",
                  color: "var(--text-primary)",
                }}
              />
              <button type="button" onClick={handleAddColorExclusion} className="btn-secondary">
                Add
              </button>
            </div>
          </div>
        </div>

        {/* Weather Forecast Badge & Exclusion Chips */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
          {weather && (
            <div style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "0.88rem", color: "var(--text-secondary)" }}>
              <span className="chip" style={{ background: "rgba(56, 189, 248, 0.15)", color: "var(--accent-cyan)", borderColor: "rgba(56, 189, 248, 0.3)" }}>
                {weather.city}: {weather.temperatureC}°C • {weather.condition}
              </span>
              <span>{weather.recommendation}</span>
            </div>
          )}

          {colorExclusions.length > 0 && (
            <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
              <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Excluded:</span>
              {colorExclusions.map((c) => (
                <span
                  key={c}
                  onClick={() => removeColorExclusion(c)}
                  className="chip"
                  style={{ cursor: "pointer", background: "rgba(251, 113, 133, 0.15)", color: "var(--accent-rose)" }}
                >
                  No {c} ✕
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Generate CTA Button */}
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <button
            onClick={() => handleGenerate()}
            disabled={isGenerating}
            className="btn-primary"
            style={{ padding: "12px 32px", fontSize: "1rem" }}
          >
            <Sparkles size={18} />
            <span>{isGenerating ? "Synthesizing Combinations..." : "Generate Outfits"}</span>
          </button>
        </div>
      </div>

      {/* Cold Start / Insufficient Wardrobe Handler */}
      {coldStartError && (
        <div
          className="glass-panel"
          style={{
            padding: "36px",
            textAlign: "center",
            maxWidth: "650px",
            margin: "0 auto 40px",
            borderColor: "rgba(229, 185, 95, 0.4)",
          }}
        >
          <AlertCircle size={44} color="var(--gold-primary)" style={{ marginBottom: "16px" }} />
          <h2 style={{ fontSize: "1.4rem", marginBottom: "10px" }}>Closet Needs More Staples</h2>
          <p style={{ color: "var(--text-secondary)", lineHeight: 1.6, marginBottom: "24px" }}>
            {coldStartError}
          </p>
          <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
            <Link href="/wardrobe/upload" className="btn-primary">
              <Shirt size={18} />
              <span>Upload Garments</span>
            </Link>
            <button
              onClick={async () => {
                await fetch("/api/wardrobe/sample", { method: "POST" });
                const r = await fetch("/api/wardrobe/items");
                const d = await r.json();
                if (d.success) setWardrobe(d.items);
                setColdStartError(null);
                handleGenerate();
              }}
              className="btn-secondary"
            >
              <PackagePlus size={18} color="var(--gold-primary)" />
              <span>Load Starter Capsule</span>
            </button>
          </div>
        </div>
      )}

      {/* Generated Outfits Display */}
      {outfits.length > 0 && currentOutfit && (
        <div>
          {/* Outfit Navigation Tabs */}
          <div style={{ display: "flex", gap: "10px", marginBottom: "20px", overflowX: "auto", paddingBottom: "8px" }}>
            {outfits.map((outfit, idx) => {
              const isSelected = idx === activeOutfitIndex;
              return (
                <button
                  key={outfit.id}
                  onClick={() => setActiveOutfitIndex(idx)}
                  style={{
                    padding: "10px 20px",
                    borderRadius: "var(--radius-md)",
                    background: isSelected ? "rgba(229, 185, 95, 0.15)" : "rgba(255, 255, 255, 0.04)",
                    border: isSelected ? "1px solid var(--border-accent)" : "1px solid var(--border-subtle)",
                    color: isSelected ? "var(--gold-primary)" : "var(--text-secondary)",
                    fontWeight: isSelected ? 600 : 500,
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  <span>{outfit.name}</span>
                  <span
                    style={{
                      fontSize: "0.75rem",
                      padding: "2px 6px",
                      borderRadius: "var(--radius-full)",
                      background: isSelected ? "var(--gold-primary)" : "rgba(255, 255, 255, 0.1)",
                      color: isSelected ? "#08090d" : "var(--text-muted)",
                      fontWeight: 700,
                    }}
                  >
                    {outfit.confidenceScore}%
                  </span>
                </button>
              );
            })}
          </div>

          {/* Active Outfit Studio Stage */}
          <div
            className="glass-panel"
            style={{
              padding: "36px",
              borderRadius: "var(--radius-lg)",
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))",
              gap: "36px",
            }}
          >
            {/* Flat-Lay Collage Canvas */}
            <div>
              <div
                style={{
                  width: "100%",
                  minHeight: "480px",
                  borderRadius: "var(--radius-md)",
                  background:
                    "radial-gradient(circle at center, rgba(28, 33, 48, 0.9) 0%, rgba(12, 14, 20, 0.95) 100%)",
                  border: "1px solid var(--border-card)",
                  padding: "24px",
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
                  gap: "16px",
                  alignItems: "center",
                }}
              >
                {currentOutfit.items.map((slot) => {
                  const isLocked = lockedItemIds.includes(slot.item.id);
                  return (
                    <div
                      key={slot.item.id}
                      style={{
                        position: "relative",
                        background: isLocked ? "rgba(229, 185, 95, 0.05)" : "rgba(255, 255, 255, 0.03)",
                        border: isLocked ? "1.5px solid var(--gold-primary)" : "1px solid var(--border-subtle)",
                        borderRadius: "var(--radius-md)",
                        padding: "12px",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        textAlign: "center",
                        transition: "all 0.25s ease",
                      }}
                    >
                      {/* Lock / Unlock Toggle Button */}
                      <button
                        onClick={() => toggleLockItem(slot.item.id)}
                        style={{
                          position: "absolute",
                          top: "8px",
                          right: "8px",
                          zIndex: 10,
                          background: isLocked ? "var(--gold-primary)" : "rgba(0,0,0,0.6)",
                          color: isLocked ? "#08090d" : "var(--text-muted)",
                          border: isLocked ? "none" : "1px solid rgba(255,255,255,0.15)",
                          borderRadius: "50%",
                          padding: "6px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          cursor: "pointer",
                          transition: "all 0.2s ease",
                        }}
                        title={isLocked ? "Item is locked! Click to unlock for regeneration." : "Lock this item so it stays fixed when regenerating."}
                      >
                        {isLocked ? <Lock size={12} /> : <Unlock size={12} />}
                      </button>

                      {isLocked && (
                        <span
                          style={{
                            position: "absolute",
                            top: "8px",
                            left: "8px",
                            fontSize: "0.65rem",
                            fontWeight: 700,
                            letterSpacing: "0.06em",
                            padding: "2px 6px",
                            borderRadius: "var(--radius-full)",
                            background: "rgba(229, 185, 95, 0.2)",
                            color: "var(--gold-primary)",
                            border: "1px solid rgba(229, 185, 95, 0.4)",
                          }}
                        >
                          LOCKED
                        </span>
                      )}

                      <div style={{ height: "130px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <img
                          src={slot.item.processedImageUrl || slot.item.thumbnailUrl}
                          alt={slot.item.name}
                          style={{
                            maxWidth: "100%",
                            maxHeight: "100%",
                            objectFit: "contain",
                            filter: "drop-shadow(0 10px 15px rgba(0,0,0,0.5))",
                          }}
                        />
                      </div>

                      <span style={{ fontSize: "0.75rem", color: "var(--gold-primary)", textTransform: "uppercase", marginTop: "6px" }}>
                        {slot.slot}
                      </span>
                      <p style={{ fontSize: "0.85rem", fontWeight: 600, marginTop: "2px", lineHeight: 1.2 }}>
                        {slot.item.name}
                      </p>

                      {/* Swap Item Trigger */}
                      <button
                        onClick={() => setSwapModalSlot(slot.slot)}
                        style={{
                          marginTop: "8px",
                          fontSize: "0.75rem",
                          color: "var(--text-secondary)",
                          textDecoration: "underline",
                          cursor: "pointer",
                        }}
                      >
                        Swap
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* Regenerate with Locked Items */}
              <div
                style={{
                  marginTop: "16px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: "12px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
                    {lockedItemIds.length} {lockedItemIds.length === 1 ? "item" : "items"} locked
                  </span>
                  {regenSuccessMsg && (
                    <span
                      style={{
                        fontSize: "0.8rem",
                        color: "var(--accent-emerald)",
                        background: "rgba(52, 211, 153, 0.15)",
                        padding: "3px 10px",
                        borderRadius: "var(--radius-full)",
                        border: "1px solid rgba(52, 211, 153, 0.3)",
                        fontWeight: 600,
                      }}
                    >
                      {regenSuccessMsg}
                    </span>
                  )}
                </div>

                <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                  {outfits.length > 1 && (
                    <button
                      onClick={() => setActiveOutfitIndex((prev) => (prev + 1) % outfits.length)}
                      className="btn-secondary"
                      style={{ padding: "8px 14px", fontSize: "0.84rem" }}
                      title="Cycle to next generated outfit variation"
                    >
                      <span>Next Option ({activeOutfitIndex + 1}/{outfits.length})</span>
                    </button>
                  )}

                  <button
                    onClick={() => handleGenerate(lockedItemIds, true)}
                    disabled={
                      isGenerating ||
                      isRegenerating ||
                      (Boolean(currentOutfit) &&
                        currentOutfit.items.length > 0 &&
                        currentOutfit.items.every((s) => lockedItemIds.includes(s.item.id)))
                    }
                    className="btn-secondary"
                    style={{
                      padding: "8px 18px",
                      fontSize: "0.88rem",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "8px",
                      borderColor: "rgba(229, 185, 95, 0.4)",
                    }}
                  >
                    <RefreshCw
                      size={14}
                      className={isRegenerating ? "spin-animation" : ""}
                    />
                    <span>
                      {isRegenerating
                        ? "Synthesizing Look..."
                        : currentOutfit &&
                          currentOutfit.items.length > 0 &&
                          currentOutfit.items.every((s) => lockedItemIds.includes(s.item.id))
                        ? "All Pieces Locked"
                        : "Regenerate (Keep Locked)"}
                    </span>
                  </button>
                </div>
              </div>
            </div>

            {/* Styling Rationale & Action Dock */}
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
                <span className="chip" style={{ background: "rgba(229, 185, 95, 0.15)", color: "var(--gold-primary)" }}>
                  {currentOutfit.confidenceScore}% Match Score
                </span>
                <span className="chip">{currentOutfit.occasion}</span>
              </div>

              <h2 style={{ fontSize: "1.8rem", marginBottom: "12px" }}>{currentOutfit.name}</h2>

              {/* Weather suitability */}
              <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", marginBottom: "20px" }}>
                ⛅ {currentOutfit.weatherSuitability}
              </p>

              {/* Why this works card */}
              <div
                style={{
                  padding: "20px",
                  borderRadius: "var(--radius-md)",
                  background: "rgba(255, 255, 255, 0.03)",
                  border: "1px solid var(--border-subtle)",
                  marginBottom: "24px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
                  <Sparkles size={16} color="var(--gold-primary)" />
                  <span style={{ fontSize: "0.85rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--gold-primary)" }}>
                    Stylist Analysis
                  </span>
                </div>
                <p style={{ color: "var(--text-primary)", fontSize: "0.95rem", lineHeight: 1.6, marginBottom: "14px" }}>
                  {currentOutfit.stylingExplanation}
                </p>

                <div style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "0.88rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "var(--text-muted)" }}>Color Theory:</span>
                    <span style={{ fontWeight: 500 }}>{currentOutfit.colorHarmony}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "var(--text-muted)" }}>Proportions:</span>
                    <span style={{ fontWeight: 500 }}>{currentOutfit.proportionNote}</span>
                  </div>
                </div>
              </div>

              {/* Feedback Likes */}
              <div style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "24px" }}>
                <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>Train AI Taste:</span>
                <button
                  onClick={() => setFeedbackGiven((prev) => ({ ...prev, [currentOutfit.id]: true }))}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "6px 12px",
                    borderRadius: "var(--radius-full)",
                    background: feedbackGiven[currentOutfit.id] === true ? "rgba(52, 211, 153, 0.2)" : "rgba(255, 255, 255, 0.04)",
                    color: feedbackGiven[currentOutfit.id] === true ? "var(--accent-emerald)" : "var(--text-secondary)",
                    border: "1px solid var(--border-subtle)",
                  }}
                >
                  <ThumbsUp size={14} />
                  <span>Like</span>
                </button>
                <button
                  onClick={() => setFeedbackGiven((prev) => ({ ...prev, [currentOutfit.id]: false }))}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "6px 12px",
                    borderRadius: "var(--radius-full)",
                    background: feedbackGiven[currentOutfit.id] === false ? "rgba(251, 113, 133, 0.2)" : "rgba(255, 255, 255, 0.04)",
                    color: feedbackGiven[currentOutfit.id] === false ? "var(--accent-rose)" : "var(--text-secondary)",
                    border: "1px solid var(--border-subtle)",
                  }}
                >
                  <ThumbsDown size={14} />
                  <span>Dislike</span>
                </button>
              </div>

              {/* Primary Actions */}
              <div style={{ display: "flex", gap: "12px", marginTop: "auto" }}>
                <button
                  onClick={handleSaveOutfit}
                  className="btn-primary"
                  style={{ flex: 1, padding: "12px" }}
                >
                  {savedSuccessId === currentOutfit.id ? (
                    <>
                      <Check size={18} />
                      <span>Saved to Wardrobe!</span>
                    </>
                  ) : (
                    <>
                      <Bookmark size={18} />
                      <span>Save Outfit</span>
                    </>
                  )}
                </button>

                <button
                  onClick={() => setShowShareModal(true)}
                  className="btn-secondary"
                  style={{ padding: "12px 18px" }}
                  title="Share / Export Outfit Card"
                >
                  <Share2 size={18} />
                </button>

                <Link
                  href="/planner"
                  className="btn-secondary"
                  style={{ padding: "12px 18px" }}
                  title="Schedule in Calendar"
                >
                  <Calendar size={18} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Share Card Modal */}
      {showShareModal && currentOutfit && (
        <ShareOutfitCard
          outfit={currentOutfit}
          onClose={() => setShowShareModal(false)}
        />
      )}

      {/* Swap Item Modal */}
      {swapModalSlot && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0, 0, 0, 0.8)",
            backdropFilter: "blur(8px)",
            zIndex: 100,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
          }}
          onClick={() => setSwapModalSlot(null)}
        >
          <div
            className="glass-panel"
            style={{ maxWidth: "600px", width: "100%", padding: "28px" }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ fontSize: "1.25rem", marginBottom: "16px" }}>
              Swap {swapModalSlot} with Closet Alternate
            </h3>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(110px, 1fr))",
                gap: "14px",
                maxHeight: "360px",
                overflowY: "auto",
              }}
            >
              {wardrobe
                .filter((item) => item.category === swapModalSlot)
                .map((item) => (
                  <div
                    key={item.id}
                    onClick={() => handleSwapItem(swapModalSlot, item)}
                    style={{
                      background: "rgba(255, 255, 255, 0.04)",
                      border: "1px solid var(--border-subtle)",
                      borderRadius: "var(--radius-md)",
                      padding: "10px",
                      cursor: "pointer",
                      textAlign: "center",
                    }}
                  >
                    <img
                      src={item.processedImageUrl || item.thumbnailUrl}
                      alt={item.name}
                      style={{ width: "100%", height: "90px", objectFit: "contain" }}
                    />
                    <p style={{ fontSize: "0.75rem", fontWeight: 600, marginTop: "6px" }}>{item.name}</p>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function OutfitStudioPage() {
  return (
    <Suspense
      fallback={
        <div className="app-container" style={{ paddingTop: "60px", textAlign: "center" }}>
          <p style={{ color: "var(--text-muted)" }}>Loading Outfit Studio...</p>
        </div>
      }
    >
      <OutfitStudioContent />
    </Suspense>
  );
}
