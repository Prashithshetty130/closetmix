"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Shirt,
  Search,
  SlidersHorizontal,
  Heart,
  Plus,
  Clock,
  Sparkles,
  Layers,
  Wand2,
  Trash2,
  Edit3,
  Calendar,
  X,
  ExternalLink,
  Check,
  PackagePlus,
  RefreshCw,
  Key,
  Sun,
  Moon,
} from "lucide-react";
import AiKeyModal from "@/components/AiKeyModal";

interface ClothingItem {
  id: string;
  name: string;
  originalImageUrl: string;
  processedImageUrl: string;
  thumbnailUrl: string;
  category: string;
  subcategory: string;
  primaryColor: string;
  primaryColorHex: string;
  secondaryColor?: string | null;
  secondaryColorHex?: string | null;
  pattern: string;
  material: string;
  fit: string;
  season: string;
  formality: string;
  isFavorite: boolean;
  wearCount: number;
  lastWornAt?: string | null;
  notes?: string | null;
  createdAt: string;
}

const CATEGORIES = [
  { id: "ALL", label: "All Items" },
  { id: "TSHIRT", label: "T-Shirts" },
  { id: "TOP", label: "Shirts & Tops" },
  { id: "BOTTOM", label: "Bottoms" },
  { id: "DRESS", label: "Dresses" },
  { id: "OUTERWEAR", label: "Outerwear" },
  { id: "SHOES", label: "Shoes" },
  { id: "BAG", label: "Bags" },
  { id: "ACCESSORY", label: "Accessories" },
];

/**
 * Accurately determines if a TOP item is specifically a T-shirt vs a collared shirt/sweater/knit.
 */
export function isTshirtItem(item: { category: string; subcategory?: string | null; name?: string | null }): boolean {
  if (item.category !== "TOP") return false;
  const sub = (item.subcategory || "").toLowerCase();
  const nm = (item.name || "").toLowerCase();

  const nonTshirtKeywords = [
    "button-down",
    "button down",
    "oxford",
    "dress shirt",
    "polo",
    "flannel",
    "blouse",
    "sweater",
    "cardigan",
    "hoodie",
    "sweatshirt",
    "turtleneck",
    "knitwear",
    "tank top",
  ];
  if (nonTshirtKeywords.some((k) => sub.includes(k) || nm.includes(k))) {
    return false;
  }

  return (
    sub.includes("t-shirt") ||
    sub.includes("tshirt") ||
    sub.includes("tee") ||
    nm.includes("t-shirt") ||
    nm.includes("tshirt") ||
    nm.includes("tee")
  );
}

export default function WardrobePage() {
  const router = useRouter();
  const [items, setItems] = useState<ClothingItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFormality, setSelectedFormality] = useState("ALL");
  const [selectedSeason, setSelectedSeason] = useState("ALL");
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [unwornOnly, setUnwornOnly] = useState(false);

  // Detail Modal
  const [activeItem, setActiveItem] = useState<ClothingItem | null>(null);
  const [viewOriginal, setViewOriginal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);

  // AI & Display Enhancements
  const [isAiKeyModalOpen, setIsAiKeyModalOpen] = useState(false);
  const [isReprocessing, setIsReprocessing] = useState(false);
  const [reprocessToast, setReprocessToast] = useState<string | null>(null);
  const [cardViewOverrides, setCardViewOverrides] = useState<Record<string, boolean>>({});
  const [globalStudioLight, setGlobalStudioLight] = useState(false);
  const [hasAiKey, setHasAiKey] = useState(false);

  useEffect(() => {
    fetchItems();
    fetch("/api/user/ai-key")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setHasAiKey(data.hasKey);
      })
      .catch(() => {});
  }, []);

  const handleReprocessAll = async () => {
    if (items.length === 0) return;
    setIsReprocessing(true);
    setReprocessToast("Re-analyzing garments with high-precision cutouts & AI tagging...");
    try {
      const res = await fetch("/api/wardrobe/reprocess", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to reprocess");
      await fetchItems();
      setReprocessToast(`✨ Successfully refreshed ${data.count || items.length} wardrobe items!`);
      setTimeout(() => setReprocessToast(null), 4000);
    } catch (err: any) {
      setReprocessToast(`❌ ${err.message || "Reprocessing failed"}`);
      setTimeout(() => setReprocessToast(null), 4000);
    } finally {
      setIsReprocessing(false);
    }
  };

  const toggleCardView = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setCardViewOverrides((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleSetDefaultImage = async (itemId: string, useOriginal: boolean) => {
    try {
      const targetItem = items.find((i) => i.id === itemId);
      if (!targetItem) return;

      const newImageUrl = useOriginal ? targetItem.originalImageUrl : targetItem.processedImageUrl;
      const res = await fetch(`/api/wardrobe/items/${itemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ processedImageUrl: newImageUrl }),
      });
      if (res.ok) {
        setItems((prev) =>
          prev.map((i) => (i.id === itemId ? { ...i, processedImageUrl: newImageUrl } : i))
        );
        if (activeItem) {
          setActiveItem((prev) => (prev ? { ...prev, processedImageUrl: newImageUrl } : null));
        }
        setReprocessToast(`Saved as default wardrobe image!`);
        setTimeout(() => setReprocessToast(null), 3000);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchItems = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/wardrobe/items");
      const data = await res.json();
      if (data.success) {
        setItems(data.items);
      }
    } catch (err) {
      console.error("Failed to load wardrobe items:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFavorite = async (id: string, currentFav: boolean, e?: React.MouseEvent) => {
    e?.stopPropagation();
    try {
      const res = await fetch(`/api/wardrobe/items/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isFavorite: !currentFav }),
      });
      if (res.ok) {
        setItems((prev) =>
          prev.map((item) => (item.id === id ? { ...item, isFavorite: !currentFav } : item))
        );
        if (activeItem && activeItem.id === id) {
          setActiveItem((prev) => (prev ? { ...prev, isFavorite: !currentFav } : null));
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogWear = async (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const item = items.find((i) => i.id === id);
    if (!item) return;

    try {
      const newCount = item.wearCount + 1;
      const res = await fetch(`/api/wardrobe/items/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wearCount: newCount, lastWornAt: new Date().toISOString() }),
      });
      if (res.ok) {
        const nowIso = new Date().toISOString();
        setItems((prev) =>
          prev.map((i) => (i.id === id ? { ...i, wearCount: newCount, lastWornAt: nowIso } : i))
        );
        if (activeItem && activeItem.id === id) {
          setActiveItem((prev) => (prev ? { ...prev, wearCount: newCount, lastWornAt: nowIso } : null));
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteItem = async (id: string) => {
    if (!confirm("Are you sure you want to delete this garment from your wardrobe?")) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/wardrobe/items/${id}`, { method: "DELETE" });
      if (res.ok) {
        setItems((prev) => prev.filter((i) => i.id !== id));
        setActiveItem(null);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleLoadSampleCapsule = async () => {
    setIsSeeding(true);
    try {
      const res = await fetch("/api/wardrobe/sample", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        await fetchItems();
      }
    } catch (err) {
      alert("Failed to load sample capsule.");
    } finally {
      setIsSeeding(false);
    }
  };

  // Filtered Items Computation
  const filteredItems = useMemo(() => {
    const now = Date.now();
    const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

    return items.filter((item) => {
      if (selectedCategory === "TSHIRT") {
        if (!isTshirtItem(item)) return false;
      } else if (selectedCategory === "TOP") {
        // Mutually exclusive: TOP tab shows non-t-shirt tops (collared shirts, polos, knits, sweaters)
        if (item.category !== "TOP" || isTshirtItem(item)) return false;
      } else if (selectedCategory !== "ALL" && item.category !== selectedCategory) {
        return false;
      }

      if (selectedFormality !== "ALL" && item.formality !== selectedFormality) return false;
      if (selectedSeason !== "ALL" && item.season !== selectedSeason) return false;
      if (favoritesOnly && !item.isFavorite) return false;

      if (unwornOnly) {
        if (!item.lastWornAt) return true; // never worn
        const diff = now - new Date(item.lastWornAt).getTime();
        if (diff < THIRTY_DAYS_MS) return false;
      }

      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const match =
          item.name.toLowerCase().includes(query) ||
          item.subcategory.toLowerCase().includes(query) ||
          item.primaryColor.toLowerCase().includes(query) ||
          item.material.toLowerCase().includes(query);
        if (!match) return false;
      }

      return true;
    });
  }, [items, selectedCategory, selectedFormality, selectedSeason, favoritesOnly, unwornOnly, searchQuery]);

  // Category counts (mutually exclusive between T-Shirts and Shirts/Tops)
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { ALL: items.length };
    let tshirtCount = 0;
    let nonTshirtTopCount = 0;

    items.forEach((i) => {
      if (i.category === "TOP") {
        if (isTshirtItem(i)) {
          tshirtCount++;
        } else {
          nonTshirtTopCount++;
        }
      } else {
        counts[i.category] = (counts[i.category] || 0) + 1;
      }
    });

    counts["TSHIRT"] = tshirtCount;
    counts["TOP"] = nonTshirtTopCount;
    return counts;
  }, [items]);

  return (
    <div className="app-container" style={{ paddingTop: "36px" }}>
      {/* Page Header & Actions */}
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
          <h1 style={{ fontSize: "2.2rem", marginBottom: "6px" }}>Digital Closet</h1>
          <p style={{ color: "var(--text-secondary)" }}>
            {items.length} {items.length === 1 ? "garment" : "garments"} curated •{" "}
            {items.filter((i) => i.isFavorite).length} favorites
          </p>
        </div>

        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center" }}>
          {/* Studio Backdrop Switcher */}
          <button
            onClick={() => setGlobalStudioLight(!globalStudioLight)}
            className="btn-secondary"
            title="Toggle Studio Lighting / Dark Backdrop"
            style={{ padding: "8px 14px", fontSize: "0.85rem", cursor: "pointer" }}
          >
            {globalStudioLight ? <Moon size={15} /> : <Sun size={15} />}
            <span>{globalStudioLight ? "Dark Studio" : "Light Studio"}</span>
          </button>

          {/* AI Vision Settings */}
          <button
            onClick={() => setIsAiKeyModalOpen(true)}
            className="btn-secondary"
            style={{
              padding: "8px 14px",
              fontSize: "0.85rem",
              color: hasAiKey ? "var(--accent-emerald)" : "var(--accent-gold)",
              border: hasAiKey ? "1px solid rgba(16, 185, 129, 0.3)" : "1px solid rgba(229, 185, 95, 0.3)",
              background: hasAiKey ? "rgba(16, 185, 129, 0.1)" : "rgba(229, 185, 95, 0.1)",
              cursor: "pointer",
            }}
          >
            <Key size={15} />
            <span>{hasAiKey ? "Gemini Vision Active" : "AI Vision Settings"}</span>
          </button>

          {/* Reprocess Wardrobe Items */}
          {items.length > 0 && (
            <button
              onClick={handleReprocessAll}
              disabled={isReprocessing}
              className="btn-secondary"
              title="Re-run background removal & AI tagging on all garments"
              style={{ padding: "8px 14px", fontSize: "0.85rem", cursor: "pointer" }}
            >
              <RefreshCw size={15} className={isReprocessing ? "animate-spin" : ""} />
              <span>{isReprocessing ? "Re-analyzing..." : "Refresh AI Tags"}</span>
            </button>
          )}

          {items.length === 0 && (
            <button
              onClick={handleLoadSampleCapsule}
              disabled={isSeeding}
              className="btn-secondary"
            >
              <PackagePlus size={18} color="var(--gold-primary)" />
              <span>{isSeeding ? "Curating Capsule..." : "Load Sample Capsule"}</span>
            </button>
          )}

          <Link href="/wardrobe/upload" className="btn-primary">
            <Plus size={18} />
            <span>Add Clothes</span>
          </Link>
        </div>
      </div>

      {/* Reprocess Notification Toast */}
      {reprocessToast && (
        <div
          style={{
            marginBottom: "20px",
            padding: "12px 18px",
            borderRadius: "var(--radius-sm)",
            background: "rgba(229, 185, 95, 0.12)",
            border: "1px solid rgba(229, 185, 95, 0.3)",
            color: "var(--accent-gold)",
            fontSize: "0.9rem",
            display: "flex",
            alignItems: "center",
            gap: "10px",
          }}
        >
          <Sparkles size={16} />
          <span>{reprocessToast}</span>
        </div>
      )}

      {/* Category Navigation Strip */}
      <div
        style={{
          display: "flex",
          gap: "8px",
          overflowX: "auto",
          paddingBottom: "12px",
          marginBottom: "20px",
        }}
      >
        {CATEGORIES.map((cat) => {
          const isActive = selectedCategory === cat.id;
          const count = categoryCounts[cat.id] || 0;
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "8px 18px",
                borderRadius: "var(--radius-full)",
                fontSize: "0.9rem",
                fontWeight: isActive ? 600 : 500,
                background: isActive ? "rgba(229, 185, 95, 0.15)" : "rgba(255, 255, 255, 0.04)",
                color: isActive ? "var(--gold-primary)" : "var(--text-secondary)",
                border: isActive ? "1px solid var(--border-accent)" : "1px solid var(--border-subtle)",
                whiteSpace: "nowrap",
                transition: "all var(--transition-fast)",
              }}
            >
              <span>{cat.label}</span>
              <span
                style={{
                  fontSize: "0.75rem",
                  padding: "2px 6px",
                  borderRadius: "var(--radius-full)",
                  background: isActive ? "rgba(229, 185, 95, 0.25)" : "rgba(255, 255, 255, 0.08)",
                  color: isActive ? "#ffffff" : "var(--text-muted)",
                }}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Filter and Search Toolbar */}
      <div
        className="glass-panel"
        style={{
          padding: "16px 20px",
          display: "flex",
          alignItems: "center",
          gap: "16px",
          flexWrap: "wrap",
          marginBottom: "32px",
        }}
      >
        {/* Search Input */}
        <div style={{ position: "relative", flex: "1 1 240px" }}>
          <Search
            size={18}
            style={{
              position: "absolute",
              left: "12px",
              top: "50%",
              transform: "translateY(-50%)",
              color: "var(--text-muted)",
            }}
          />
          <input
            type="text"
            placeholder="Search by color, subcategory, material..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: "100%",
              padding: "10px 14px 10px 38px",
              background: "rgba(0, 0, 0, 0.3)",
              border: "1px solid var(--border-subtle)",
              borderRadius: "var(--radius-md)",
              color: "var(--text-primary)",
              fontSize: "0.9rem",
              outline: "none",
            }}
          />
        </div>

        {/* Formality Filter */}
        <select
          value={selectedFormality}
          onChange={(e) => setSelectedFormality(e.target.value)}
          style={{
            padding: "10px 14px",
            background: "#161922",
            border: "1px solid var(--border-subtle)",
            borderRadius: "var(--radius-md)",
            color: "var(--text-primary)",
            fontSize: "0.88rem",
          }}
        >
          <option value="ALL">All Formalities</option>
          <option value="Casual">Casual</option>
          <option value="Smart Casual">Smart Casual</option>
          <option value="Business Casual">Business Casual</option>
          <option value="Formal">Formal</option>
          <option value="Athletic">Athletic</option>
        </select>

        {/* Season Filter */}
        <select
          value={selectedSeason}
          onChange={(e) => setSelectedSeason(e.target.value)}
          style={{
            padding: "10px 14px",
            background: "#161922",
            border: "1px solid var(--border-subtle)",
            borderRadius: "var(--radius-md)",
            color: "var(--text-primary)",
            fontSize: "0.88rem",
          }}
        >
          <option value="ALL">All Seasons</option>
          <option value="All-Season">All-Season</option>
          <option value="Summer">Summer</option>
          <option value="Winter">Winter</option>
          <option value="Spring/Fall">Spring/Fall</option>
        </select>

        {/* Favorites Filter Chip */}
        <button
          onClick={() => setFavoritesOnly(!favoritesOnly)}
          className={`chip ${favoritesOnly ? "active" : ""}`}
          style={{ padding: "8px 14px" }}
        >
          <Heart size={14} fill={favoritesOnly ? "currentColor" : "none"} />
          <span>Favorites</span>
        </button>

        {/* Unworn >30d Filter Chip */}
        <button
          onClick={() => setUnwornOnly(!unwornOnly)}
          className={`chip ${unwornOnly ? "active" : ""}`}
          style={{ padding: "8px 14px" }}
        >
          <Clock size={14} />
          <span>Unworn &gt;30d</span>
        </button>
      </div>

      {/* Grid of Garment Cards */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "80px 0" }}>
          <p style={{ color: "var(--text-muted)" }}>Loading your digital wardrobe...</p>
        </div>
      ) : filteredItems.length === 0 ? (
        <div
          className="glass-panel"
          style={{
            textAlign: "center",
            padding: "80px 20px",
            maxWidth: "600px",
            margin: "0 auto",
          }}
        >
          <Shirt size={48} color="var(--gold-primary)" style={{ marginBottom: "16px" }} />
          <h2 style={{ fontSize: "1.4rem", marginBottom: "8px" }}>No Clothes Found</h2>
          <p style={{ color: "var(--text-secondary)", marginBottom: "24px" }}>
            {items.length === 0
              ? "Your wardrobe is currently empty. Drop in photos of your clothes or load our sample capsule."
              : "No garments match your active search and filter criteria."}
          </p>
          <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
            {items.length === 0 && (
              <button
                onClick={handleLoadSampleCapsule}
                disabled={isSeeding}
                className="btn-secondary"
              >
                <PackagePlus size={18} color="var(--gold-primary)" />
                <span>{isSeeding ? "Loading..." : "Load Sample Capsule"}</span>
              </button>
            )}
            <Link href="/wardrobe/upload" className="btn-primary">
              <Plus size={18} />
              <span>Upload Clothes</span>
            </Link>
          </div>
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
            gap: "24px",
          }}
        >
          {filteredItems.map((item) => {
            const isUnworn30d =
              !item.lastWornAt ||
              Date.now() - new Date(item.lastWornAt).getTime() > 30 * 24 * 60 * 60 * 1000;

            return (
              <div
                key={item.id}
                onClick={() => {
                  setActiveItem(item);
                  setViewOriginal(false);
                }}
                className="glass-panel glass-panel-hover"
                style={{
                  borderRadius: "var(--radius-lg)",
                  overflow: "hidden",
                  cursor: "pointer",
                  display: "flex",
                  flexDirection: "column",
                  position: "relative",
                }}
              >
                {/* Favorite Heart Button */}
                <button
                  onClick={(e) => handleToggleFavorite(item.id, item.isFavorite, e)}
                  style={{
                    position: "absolute",
                    top: "14px",
                    right: "14px",
                    zIndex: 10,
                    width: "36px",
                    height: "36px",
                    borderRadius: "50%",
                    background: "rgba(10, 12, 18, 0.7)",
                    backdropFilter: "blur(8px)",
                    border: "1px solid var(--border-subtle)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: item.isFavorite ? "var(--accent-rose)" : "var(--text-muted)",
                    transition: "all var(--transition-fast)",
                  }}
                >
                  <Heart size={18} fill={item.isFavorite ? "currentColor" : "none"} />
                </button>

                {/* Garment Image Canvas */}
                <div
                  style={{
                    width: "100%",
                    height: "260px",
                    background: globalStudioLight
                      ? "radial-gradient(circle at center, #f8fafc 0%, #cbd5e1 100%)"
                      : "radial-gradient(circle at center, rgba(30, 36, 52, 0.8) 0%, rgba(12, 14, 20, 0.95) 100%)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "20px",
                    position: "relative",
                    transition: "background 0.3s ease",
                  }}
                >
                  {/* Quick Toggle Original / Cutout on card */}
                  <button
                    onClick={(e) => toggleCardView(item.id, e)}
                    title={cardViewOverrides[item.id] ? "Showing original photo (Click for cutout)" : "Showing studio cutout (Click for original)"}
                    style={{
                      position: "absolute",
                      top: "14px",
                      left: "14px",
                      zIndex: 2,
                      background: "rgba(10, 12, 18, 0.75)",
                      backdropFilter: "blur(8px)",
                      border: "1px solid var(--border-subtle)",
                      borderRadius: "var(--radius-full)",
                      padding: "4px 10px",
                      fontSize: "0.75rem",
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                      color: cardViewOverrides[item.id] ? "var(--accent-gold)" : "var(--text-secondary)",
                      cursor: "pointer",
                    }}
                  >
                    <Layers size={12} />
                    <span>{cardViewOverrides[item.id] ? "Original" : "Cutout"}</span>
                  </button>

                  <img
                    src={cardViewOverrides[item.id] ? item.originalImageUrl : (item.processedImageUrl || item.thumbnailUrl)}
                    alt={item.name}
                    style={{
                      maxWidth: "100%",
                      maxHeight: "100%",
                      objectFit: "contain",
                      filter: globalStudioLight
                        ? "drop-shadow(0 8px 14px rgba(0,0,0,0.18))"
                        : "drop-shadow(0 12px 18px rgba(0,0,0,0.55))",
                    }}
                  />

                  {/* Status Badges */}
                  <div
                    style={{
                      position: "absolute",
                      bottom: "12px",
                      left: "14px",
                      display: "flex",
                      gap: "6px",
                      alignItems: "center",
                    }}
                  >
                    {isUnworn30d ? (
                      <span
                        style={{
                          fontSize: "0.75rem",
                          fontWeight: 600,
                          padding: "3px 8px",
                          borderRadius: "var(--radius-full)",
                          background: "rgba(251, 191, 36, 0.18)",
                          color: "var(--accent-amber)",
                          border: "1px solid rgba(251, 191, 36, 0.3)",
                        }}
                      >
                        Unworn &gt;30d
                      </span>
                    ) : (
                      <span
                        style={{
                          fontSize: "0.75rem",
                          fontWeight: 500,
                          padding: "3px 8px",
                          borderRadius: "var(--radius-full)",
                          background: "rgba(255, 255, 255, 0.08)",
                          color: "var(--text-secondary)",
                        }}
                      >
                        Worn {item.wearCount}x
                      </span>
                    )}
                  </div>
                </div>

                {/* Garment Info */}
                <div style={{ padding: "18px", flex: 1, display: "flex", flexDirection: "column" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "6px" }}>
                    <span
                      style={{
                        width: "10px",
                        height: "10px",
                        borderRadius: "50%",
                        backgroundColor: item.primaryColorHex || "#94a3b8",
                        border: "1px solid rgba(255,255,255,0.2)",
                        display: "inline-block",
                      }}
                    />
                    <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                      {item.subcategory}
                    </span>
                  </div>

                  <h3
                    style={{
                      fontSize: "1.05rem",
                      fontWeight: 600,
                      marginBottom: "12px",
                      color: "var(--text-primary)",
                      lineHeight: 1.3,
                    }}
                  >
                    {item.name}
                  </h3>

                  <div style={{ marginTop: "auto", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span className="chip" style={{ fontSize: "0.75rem", padding: "2px 8px" }}>
                      {item.formality}
                    </span>

                    <button
                      onClick={(e) => handleLogWear(item.id, e)}
                      style={{
                        fontSize: "0.78rem",
                        color: "var(--gold-primary)",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "4px",
                        fontWeight: 600,
                        padding: "4px 8px",
                        borderRadius: "var(--radius-sm)",
                        background: "rgba(229, 185, 95, 0.08)",
                      }}
                    >
                      <span>+1 Wear</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Item Detail & Tag Inspection Modal */}
      {activeItem && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0, 0, 0, 0.82)",
            backdropFilter: "blur(12px)",
            zIndex: 100,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
          }}
          onClick={() => setActiveItem(null)}
        >
          <div
            className="glass-panel"
            style={{
              maxWidth: "850px",
              width: "100%",
              maxHeight: "90vh",
              overflowY: "auto",
              padding: "36px",
              position: "relative",
              borderRadius: "var(--radius-lg)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={() => setActiveItem(null)}
              style={{
                position: "absolute",
                top: "20px",
                right: "20px",
                color: "var(--text-muted)",
              }}
            >
              <X size={24} />
            </button>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
                gap: "32px",
              }}
            >
              {/* Image Preview Canvas */}
              <div>
                <div
                  style={{
                    width: "100%",
                    height: "380px",
                    borderRadius: "var(--radius-md)",
                    position: "relative",
                    background:
                      "radial-gradient(circle at center, rgba(30, 36, 52, 0.9) 0%, rgba(14, 16, 24, 0.95) 100%)",
                    border: "1px solid var(--border-card)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "20px",
                  }}
                >
                  <img
                    src={viewOriginal ? activeItem.originalImageUrl : activeItem.processedImageUrl}
                    alt={activeItem.name}
                    style={{
                      maxWidth: "100%",
                      maxHeight: "100%",
                      objectFit: "contain",
                      filter: "drop-shadow(0 15px 25px rgba(0,0,0,0.6))",
                    }}
                  />

                  {/* Cutout / Original Switch */}
                  <div style={{ position: "absolute", bottom: "16px", left: "16px", display: "flex", gap: "8px" }}>
                    <button
                      onClick={() => setViewOriginal(!viewOriginal)}
                      style={{
                        background: "rgba(10, 12, 18, 0.8)",
                        border: "1px solid var(--border-subtle)",
                        borderRadius: "var(--radius-full)",
                        padding: "6px 14px",
                        fontSize: "0.8rem",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        color: "var(--text-secondary)",
                        cursor: "pointer",
                      }}
                    >
                      <Layers size={14} />
                      <span>{viewOriginal ? "Showing Original" : "Showing Cutout"}</span>
                    </button>

                    <button
                      onClick={() => handleSetDefaultImage(activeItem.id, viewOriginal)}
                      title="Set current image as the default wardrobe display"
                      style={{
                        background: "rgba(229, 185, 95, 0.15)",
                        border: "1px solid rgba(229, 185, 95, 0.3)",
                        borderRadius: "var(--radius-full)",
                        padding: "6px 14px",
                        fontSize: "0.8rem",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        color: "var(--accent-gold)",
                        cursor: "pointer",
                      }}
                    >
                      <Check size={13} />
                      <span>Set as Default</span>
                    </button>
                  </div>
                </div>

                {/* Quick Styling Trigger */}
                <div style={{ marginTop: "20px" }}>
                  <Link
                    href={`/outfits?buildAround=${activeItem.id}`}
                    className="btn-primary"
                    style={{ width: "100%", padding: "12px", justifyContent: "center" }}
                  >
                    <Wand2 size={18} />
                    <span>Generate Outfits Around This</span>
                  </Link>
                </div>
              </div>

              {/* Tag Details */}
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                  <span className="chip" style={{ background: "rgba(229, 185, 95, 0.15)", color: "var(--gold-primary)", fontWeight: 600 }}>
                    {isTshirtItem(activeItem) ? "T-SHIRT" : activeItem.category === "TOP" ? "SHIRT / TOP" : activeItem.category}
                  </span>
                  <span className="chip">{activeItem.subcategory}</span>
                </div>

                <h2 style={{ fontSize: "1.6rem", marginBottom: "16px" }}>{activeItem.name}</h2>

                {/* Wear Metrics */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "12px",
                    padding: "16px",
                    background: "rgba(255, 255, 255, 0.03)",
                    borderRadius: "var(--radius-md)",
                    border: "1px solid var(--border-subtle)",
                    marginBottom: "20px",
                  }}
                >
                  <div>
                    <span style={{ fontSize: "0.78rem", color: "var(--text-muted)", textTransform: "uppercase" }}>
                      Wear Frequency
                    </span>
                    <p style={{ fontSize: "1.3rem", fontWeight: 700, color: "var(--gold-primary)" }}>
                      {activeItem.wearCount} times
                    </p>
                  </div>
                  <div>
                    <span style={{ fontSize: "0.78rem", color: "var(--text-muted)", textTransform: "uppercase" }}>
                      Last Worn
                    </span>
                    <p style={{ fontSize: "0.95rem", fontWeight: 600, color: "var(--text-secondary)", marginTop: "4px" }}>
                      {activeItem.lastWornAt ? new Date(activeItem.lastWornAt).toLocaleDateString() : "Never worn"}
                    </p>
                  </div>
                </div>

                {/* Tag Grid Attributes */}
                <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "24px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>Primary Color:</span>
                    <span style={{ display: "flex", alignItems: "center", gap: "6px", fontWeight: 500 }}>
                      <span
                        style={{
                          width: "12px",
                          height: "12px",
                          borderRadius: "50%",
                          backgroundColor: activeItem.primaryColorHex,
                        }}
                      />
                      {activeItem.primaryColor}
                    </span>
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>Material:</span>
                    <span style={{ fontWeight: 500 }}>{activeItem.material}</span>
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>Pattern:</span>
                    <span style={{ fontWeight: 500 }}>{activeItem.pattern}</span>
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>Fit / Silhouette:</span>
                    <span style={{ fontWeight: 500 }}>{activeItem.fit}</span>
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>Season:</span>
                    <span style={{ fontWeight: 500 }}>{activeItem.season}</span>
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>Formality:</span>
                    <span style={{ fontWeight: 500 }}>{activeItem.formality}</span>
                  </div>
                </div>

                {/* Notes */}
                {activeItem.notes && (
                  <div style={{ marginBottom: "24px" }}>
                    <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", display: "block", marginBottom: "4px" }}>
                      Stylist Notes
                    </span>
                    <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", fontStyle: "italic" }}>
                      &ldquo;{activeItem.notes}&rdquo;
                    </p>
                  </div>
                )}

                {/* Action Buttons */}
                <div style={{ display: "flex", gap: "10px", marginTop: "auto" }}>
                  <button
                    onClick={() => handleLogWear(activeItem.id)}
                    className="btn-secondary"
                    style={{ flex: 1 }}
                  >
                    <span>Log Wear (+1)</span>
                  </button>

                  <button
                    onClick={() => handleToggleFavorite(activeItem.id, activeItem.isFavorite)}
                    className="btn-secondary"
                    style={{
                      color: activeItem.isFavorite ? "var(--accent-rose)" : "inherit",
                    }}
                  >
                    <Heart size={16} fill={activeItem.isFavorite ? "currentColor" : "none"} />
                  </button>

                  <button
                    onClick={() => handleDeleteItem(activeItem.id)}
                    disabled={isDeleting}
                    style={{
                      padding: "10px",
                      borderRadius: "var(--radius-md)",
                      background: "rgba(251, 113, 133, 0.1)",
                      border: "1px solid rgba(251, 113, 133, 0.2)",
                      color: "var(--accent-rose)",
                    }}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* AI Vision Configuration Modal */}
      <AiKeyModal
        isOpen={isAiKeyModalOpen}
        onClose={() => setIsAiKeyModalOpen(false)}
        onKeyUpdated={setHasAiKey}
      />
    </div>
  );
}
