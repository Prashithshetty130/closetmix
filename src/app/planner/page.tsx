"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  CheckCircle2,
  Clock,
  Sparkles,
  Trash2,
  X,
  Wand2,
} from "lucide-react";

interface ClothingItem {
  id: string;
  name: string;
  category: string;
  processedImageUrl: string;
  thumbnailUrl: string;
}

interface OutfitItem {
  slot: string;
  clothingItem: ClothingItem;
}

interface Outfit {
  id: string;
  name: string;
  occasion: string;
  confidenceScore: number;
  items: OutfitItem[];
}

interface CalendarEntry {
  id: string;
  date: string;
  notes?: string | null;
  wasWorn: boolean;
  outfit: Outfit;
}

export default function PlannerPage() {
  const [entries, setEntries] = useState<CalendarEntry[]>([]);
  const [savedOutfits, setSavedOutfits] = useState<Outfit[]>([]);
  const [loading, setLoading] = useState(true);

  // Week navigation (base date is Monday of current week)
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(() => {
    const d = new Date();
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
    const monday = new Date(d.setDate(diff));
    monday.setHours(0, 0, 0, 0);
    return monday;
  });

  // Assign modal state
  const [schedulingDate, setSchedulingDate] = useState<string | null>(null);

  useEffect(() => {
    fetchPlannerData();
  }, []);

  const fetchPlannerData = async () => {
    setLoading(true);
    try {
      const [calRes, outfitsRes] = await Promise.all([
        fetch("/api/planner"),
        fetch("/api/outfits"),
      ]);
      const calData = await calRes.json();
      const outfitsData = await outfitsRes.json();

      if (calData.success) setEntries(calData.entries);
      if (outfitsData.success) setSavedOutfits(outfitsData.outfits);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAssignOutfit = async (outfitId: string) => {
    if (!schedulingDate) return;
    try {
      const res = await fetch("/api/planner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ outfitId, date: schedulingDate }),
      });
      if (res.ok) {
        await fetchPlannerData();
        setSchedulingDate(null);
      }
    } catch (err) {
      alert("Failed to assign outfit.");
    }
  };

  const handleToggleWorn = async (entryId: string, currentWorn: boolean) => {
    try {
      const res = await fetch(`/api/planner/${entryId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wasWorn: !currentWorn }),
      });
      if (res.ok) {
        setEntries((prev) =>
          prev.map((e) => (e.id === entryId ? { ...e, wasWorn: !currentWorn } : e))
        );
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteEntry = async (entryId: string) => {
    try {
      const res = await fetch(`/api/planner/${entryId}`, { method: "DELETE" });
      if (res.ok) {
        setEntries((prev) => prev.filter((e) => e.id !== entryId));
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Generate 7 days for current week
  const weekDays = Array.from({ length: 7 }).map((_, idx) => {
    const d = new Date(currentWeekStart);
    d.setDate(currentWeekStart.getDate() + idx);
    const dateStr = d.toISOString().split("T")[0];
    const isToday = new Date().toISOString().split("T")[0] === dateStr;

    // Find entry matching this date
    const dayEntry = entries.find((e) => e.date.startsWith(dateStr));

    return {
      date: d,
      dateStr,
      dayName: d.toLocaleDateString("en-US", { weekday: "short" }),
      dayNumber: d.getDate(),
      monthName: d.toLocaleDateString("en-US", { month: "short" }),
      isToday,
      entry: dayEntry,
    };
  });

  const shiftWeek = (deltaDays: number) => {
    const newStart = new Date(currentWeekStart);
    newStart.setDate(currentWeekStart.getDate() + deltaDays);
    setCurrentWeekStart(newStart);
  };

  return (
    <div className="app-container" style={{ paddingTop: "36px" }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          marginBottom: "28px",
          flexWrap: "wrap",
          gap: "16px",
        }}
      >
        <div>
          <h1 style={{ fontSize: "2.2rem", marginBottom: "6px" }}>Weekly Outfit Planner</h1>
          <p style={{ color: "var(--text-secondary)" }}>
            Schedule your looks in advance, avoid morning decision fatigue, and log garment wear history.
          </p>
        </div>

        {/* Week navigation buttons */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <button onClick={() => shiftWeek(-7)} className="btn-secondary" style={{ padding: "8px 14px" }}>
            <ChevronLeft size={16} />
            <span>Prev Week</span>
          </button>
          <span style={{ fontSize: "0.95rem", fontWeight: 600 }}>
            {weekDays[0].monthName} {weekDays[0].dayNumber} – {weekDays[6].monthName} {weekDays[6].dayNumber}
          </span>
          <button onClick={() => shiftWeek(7)} className="btn-secondary" style={{ padding: "8px 14px" }}>
            <span>Next Week</span>
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* 7-Day Planner Strip */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
          gap: "14px",
          marginBottom: "40px",
        }}
      >
        {weekDays.map((day) => {
          return (
            <div
              key={day.dateStr}
              className="glass-panel"
              style={{
                borderRadius: "var(--radius-md)",
                padding: "16px",
                display: "flex",
                flexDirection: "column",
                border: day.isToday ? "1px solid var(--gold-primary)" : "1px solid var(--border-card)",
                background: day.isToday ? "rgba(229, 185, 95, 0.04)" : "var(--bg-card)",
                minHeight: "340px",
              }}
            >
              {/* Day Header */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  paddingBottom: "10px",
                  borderBottom: "1px solid var(--border-subtle)",
                  marginBottom: "12px",
                }}
              >
                <div>
                  <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", textTransform: "uppercase" }}>
                    {day.dayName}
                  </span>
                  <p style={{ fontSize: "1.2rem", fontWeight: 700, color: day.isToday ? "var(--gold-primary)" : "var(--text-primary)" }}>
                    {day.dayNumber}
                  </p>
                </div>
                {day.isToday && (
                  <span
                    className="chip"
                    style={{
                      fontSize: "0.7rem",
                      padding: "2px 6px",
                      background: "rgba(229, 185, 95, 0.2)",
                      color: "var(--gold-primary)",
                      borderColor: "var(--border-accent)",
                    }}
                  >
                    Today
                  </span>
                )}
              </div>

              {/* Day Content */}
              {day.entry ? (
                <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
                  {/* Status Badge */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                    <button
                      onClick={() => handleToggleWorn(day.entry!.id, day.entry!.wasWorn)}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "4px",
                        fontSize: "0.75rem",
                        fontWeight: 600,
                        padding: "3px 8px",
                        borderRadius: "var(--radius-full)",
                        background: day.entry.wasWorn ? "rgba(52, 211, 153, 0.2)" : "rgba(255, 255, 255, 0.08)",
                        color: day.entry.wasWorn ? "var(--accent-emerald)" : "var(--text-secondary)",
                        border: "none",
                        cursor: "pointer",
                      }}
                    >
                      {day.entry.wasWorn ? (
                        <>
                          <CheckCircle2 size={12} />
                          <span>Worn</span>
                        </>
                      ) : (
                        <>
                          <Clock size={12} />
                          <span>Planned</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => handleDeleteEntry(day.entry!.id)}
                      style={{ color: "var(--text-muted)", background: "transparent", border: "none", cursor: "pointer" }}
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>

                  {/* Garment Visual Flatlay Thumbnails */}
                  <div
                    style={{
                      background: "rgba(0,0,0,0.3)",
                      borderRadius: "var(--radius-sm)",
                      padding: "8px",
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: "6px",
                      marginBottom: "10px",
                    }}
                  >
                    {day.entry.outfit.items.slice(0, 4).map((slot, i) => (
                      <div key={i} style={{ height: "45px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <img
                          src={slot.clothingItem.processedImageUrl || slot.clothingItem.thumbnailUrl}
                          alt={slot.clothingItem.name}
                          style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }}
                        />
                      </div>
                    ))}
                  </div>

                  <p style={{ fontSize: "0.85rem", fontWeight: 600, lineHeight: 1.3, marginBottom: "4px" }}>
                    {day.entry.outfit.name}
                  </p>
                  <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                    {day.entry.outfit.occasion}
                  </span>

                  <button
                    onClick={() => handleToggleWorn(day.entry!.id, day.entry!.wasWorn)}
                    className="btn-secondary"
                    style={{ marginTop: "auto", padding: "6px", fontSize: "0.75rem", width: "100%", justifyContent: "center" }}
                  >
                    {day.entry.wasWorn ? "Mark as Unworn" : "Mark as Worn Today"}
                  </button>
                </div>
              ) : (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    height: "100%",
                    border: "1px dashed var(--border-subtle)",
                    borderRadius: "var(--radius-sm)",
                    padding: "16px 8px",
                    textAlign: "center",
                  }}
                >
                  <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "12px" }}>
                    No outfit planned
                  </p>
                  <button
                    onClick={() => setSchedulingDate(day.dateStr)}
                    className="btn-secondary"
                    style={{ padding: "6px 12px", fontSize: "0.8rem" }}
                  >
                    <Plus size={14} />
                    <span>Plan Look</span>
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Select Saved Outfit Modal */}
      {schedulingDate && (
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
          onClick={() => setSchedulingDate(null)}
        >
          <div
            className="glass-panel"
            style={{ maxWidth: "650px", width: "100%", padding: "30px", maxHeight: "85vh", overflowY: "auto" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h3 style={{ fontSize: "1.3rem" }}>Schedule Outfit for {schedulingDate}</h3>
              <button onClick={() => setSchedulingDate(null)} style={{ color: "var(--text-muted)" }}>
                <X size={20} />
              </button>
            </div>

            {savedOutfits.length === 0 ? (
              <div style={{ textAlign: "center", padding: "40px 0" }}>
                <p style={{ color: "var(--text-secondary)", marginBottom: "16px" }}>
                  You have no saved outfits yet. Generate an outfit in the Outfit Studio to save it!
                </p>
                <Link href="/outfits" className="btn-primary">
                  <Wand2 size={16} />
                  <span>Go to Outfit Studio</span>
                </Link>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                {savedOutfits.map((outfit) => (
                  <div
                    key={outfit.id}
                    onClick={() => handleAssignOutfit(outfit.id)}
                    className="glass-panel glass-panel-hover"
                    style={{
                      padding: "16px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      cursor: "pointer",
                      gap: "16px",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                      {/* Mini thumbs */}
                      <div style={{ display: "flex", gap: "4px" }}>
                        {outfit.items.slice(0, 3).map((slot, i) => (
                          <div key={i} style={{ width: "36px", height: "36px", background: "rgba(0,0,0,0.3)", borderRadius: "4px", padding: "2px" }}>
                            <img
                              src={slot.clothingItem.processedImageUrl || slot.clothingItem.thumbnailUrl}
                              alt={slot.clothingItem.name}
                              style={{ width: "100%", height: "100%", objectFit: "contain" }}
                            />
                          </div>
                        ))}
                      </div>
                      <div>
                        <h4 style={{ fontSize: "0.95rem" }}>{outfit.name}</h4>
                        <span style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>{outfit.occasion}</span>
                      </div>
                    </div>

                    <button className="btn-secondary" style={{ padding: "6px 14px", fontSize: "0.85rem" }}>
                      Select
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
