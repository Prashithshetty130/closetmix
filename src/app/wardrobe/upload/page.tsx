"use client";

import { useState, useRef, ChangeEvent, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  UploadCloud,
  Camera,
  CheckCircle2,
  Sparkles,
  AlertTriangle,
  Layers,
  ArrowRight,
  Trash2,
  Eye,
  SlidersHorizontal,
  Save,
  Loader2,
  Key,
  Sun,
  Moon,
} from "lucide-react";
import AiKeyModal from "@/components/AiKeyModal";

interface UploadedGarment {
  itemId: string;
  originalFileName: string;
  originalImageUrl: string;
  processedImageUrl: string;
  thumbnailUrl: string;
  showOriginalPreview?: boolean;
  useOriginalImage?: boolean;
  tags: {
    name: string;
    category: string;
    subcategory: string;
    primaryColor: string;
    primaryColorHex: string;
    secondaryColor?: string;
    secondaryColorHex?: string;
    pattern: string;
    material: string;
    fit: string;
    season: string;
    formality: string;
    faceDetected: boolean;
    stylingNotes: string;
  };
}

const CATEGORIES = ["TOP", "BOTTOM", "DRESS", "OUTERWEAR", "SHOES", "BAG", "ACCESSORY"];
const PATTERNS = ["Solid", "Striped", "Plaid", "Floral", "Graphic", "Polka Dot", "Houndstooth", "Geometric", "Animal Print", "Abstract"];
const MATERIALS = ["Cotton", "Denim", "Wool", "Linen", "Silk", "Leather", "Knit", "Corduroy", "Synthetic / Polyester", "Other"];
const FITS = ["Slim", "Regular", "Relaxed", "Oversized", "Tailored", "Cropped", "Skinny"];
const SEASONS = ["All-Season", "Summer", "Winter", "Spring/Fall"];
const FORMALITIES = ["Casual", "Smart Casual", "Business Casual", "Formal", "Athletic"];

export default function UploadPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressStatus, setProgressStatus] = useState("");
  const [items, setItems] = useState<UploadedGarment[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [isSaving, setIsSaving] = useState(false);
  const [isKeyModalOpen, setIsKeyModalOpen] = useState(false);
  const [hasAiKey, setHasAiKey] = useState(false);
  const [studioLightMode, setStudioLightMode] = useState(false);

  useEffect(() => {
    fetch("/api/user/ai-key")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setHasAiKey(data.hasKey);
      })
      .catch(() => {});
  }, []);

  const handleFiles = async (files: FileList | File[]) => {
    if (!files || files.length === 0) return;
    setIsProcessing(true);
    setProgressStatus("Uploading images & stripping EXIF metadata...");

    const formData = new FormData();
    Array.from(files).forEach((file) => {
      formData.append("files", file);
    });

    try {
      setProgressStatus("Isolating backgrounds & generating transparent cutouts...");
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to process image batch");
      }

      if (data.uploads && data.uploads.length > 0) {
        setItems((prev) => [...prev, ...data.uploads]);
        setSelectedIndex(items.length); // focus on newly added item
      }
    } catch (err: any) {
      alert(`Upload error: ${err.message}`);
    } finally {
      setIsProcessing(false);
      setProgressStatus("");
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const updateSelectedTag = (field: string, value: any) => {
    setItems((prev) => {
      const copy = [...prev];
      const current = copy[selectedIndex];
      if (current) {
        current.tags = {
          ...current.tags,
          [field]: value,
        };
      }
      return copy;
    });
  };

  const togglePreviewMode = (index: number) => {
    setItems((prev) => {
      const copy = [...prev];
      copy[index].showOriginalPreview = !copy[index].showOriginalPreview;
      return copy;
    });
  };

  const toggleUseOriginal = (index: number) => {
    setItems((prev) => {
      const copy = [...prev];
      copy[index].useOriginalImage = !copy[index].useOriginalImage;
      copy[index].showOriginalPreview = copy[index].useOriginalImage;
      return copy;
    });
  };

  const removeItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
    if (selectedIndex >= items.length - 1) {
      setSelectedIndex(Math.max(0, items.length - 2));
    }
  };

  const handleSaveAll = async () => {
    if (items.length === 0) return;
    setIsSaving(true);
    try {
      const payload = items.map((item) => ({
        id: item.itemId,
        name: item.tags.name,
        originalImageUrl: item.originalImageUrl,
        processedImageUrl: item.useOriginalImage ? item.originalImageUrl : item.processedImageUrl,
        thumbnailUrl: item.thumbnailUrl,
        category: item.tags.category,
        subcategory: item.tags.subcategory,
        primaryColor: item.tags.primaryColor,
        primaryColorHex: item.tags.primaryColorHex,
        secondaryColor: item.tags.secondaryColor || null,
        secondaryColorHex: item.tags.secondaryColorHex || null,
        pattern: item.tags.pattern,
        material: item.tags.material,
        fit: item.tags.fit,
        season: item.tags.season,
        formality: item.tags.formality,
        notes: item.tags.stylingNotes,
      }));

      const res = await fetch("/api/wardrobe/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: payload }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to save wardrobe items");
      }

      router.push("/wardrobe");
    } catch (err: any) {
      alert(`Save error: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const currentItem = items[selectedIndex];

  return (
    <div className="app-container" style={{ paddingTop: "36px" }}>
      {/* Page Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: "28px",
          flexWrap: "wrap",
          gap: "16px",
        }}
      >
        <div>
          <h1 style={{ fontSize: "2rem", marginBottom: "8px" }}>Digitize Your Wardrobe</h1>
          <p style={{ color: "var(--text-secondary)" }}>
            Upload individual clothes or batches. Our AI isolates backgrounds, extracts colors, and tags style attributes automatically.
          </p>
        </div>

        <button
          onClick={() => setIsKeyModalOpen(true)}
          className="btn-secondary"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            padding: "8px 16px",
            borderRadius: "var(--radius-full)",
            fontSize: "0.85rem",
            background: hasAiKey ? "rgba(16, 185, 129, 0.12)" : "rgba(229, 185, 95, 0.12)",
            border: hasAiKey ? "1px solid rgba(16, 185, 129, 0.3)" : "1px solid rgba(229, 185, 95, 0.3)",
            color: hasAiKey ? "var(--accent-emerald)" : "var(--accent-gold)",
            cursor: "pointer",
          }}
        >
          <Key size={15} />
          <span>{hasAiKey ? "Gemini Vision Active" : "Connect Gemini AI Key"}</span>
        </button>
      </div>

      {/* Upload Target Box */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className="glass-panel"
        style={{
          padding: "40px 20px",
          border: isDragging ? "2px dashed var(--gold-primary)" : "2px dashed var(--border-card)",
          borderRadius: "var(--radius-lg)",
          background: isDragging ? "rgba(229, 185, 95, 0.05)" : "var(--bg-glass)",
          textAlign: "center",
          marginBottom: "36px",
          transition: "all var(--transition-fast)",
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
          style={{ display: "none" }}
          onChange={(e: ChangeEvent<HTMLInputElement>) => {
            if (e.target.files) handleFiles(e.target.files);
          }}
        />

        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          style={{ display: "none" }}
          onChange={(e: ChangeEvent<HTMLInputElement>) => {
            if (e.target.files) handleFiles(e.target.files);
          }}
        />

        <div
          style={{
            width: "64px",
            height: "64px",
            borderRadius: "50%",
            background: "rgba(229, 185, 95, 0.12)",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--gold-primary)",
            marginBottom: "16px",
          }}
        >
          <UploadCloud size={32} />
        </div>

        <h3 style={{ fontSize: "1.25rem", marginBottom: "8px" }}>Drag & Drop Clothes Photos</h3>
        <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", marginBottom: "20px" }}>
          Supports JPG, PNG, WEBP, and iPhone HEIC files (up to 20 images at once)
        </p>

        <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isProcessing}
            className="btn-primary"
          >
            <UploadCloud size={18} />
            <span>Select Files</span>
          </button>

          <button
            onClick={() => cameraInputRef.current?.click()}
            disabled={isProcessing}
            className="btn-secondary"
          >
            <Camera size={18} />
            <span>Take Photo (Mobile)</span>
          </button>
        </div>

        {isProcessing && (
          <div style={{ marginTop: "24px", display: "inline-flex", alignItems: "center", gap: "10px", color: "var(--gold-primary)" }}>
            <Loader2 size={18} className="animate-pulse-glow" />
            <span style={{ fontSize: "0.95rem", fontWeight: 500 }}>{progressStatus}</span>
          </div>
        )}
      </div>

      {/* Review & Edit Workspace */}
      {items.length > 0 && (
        <div style={{ marginTop: "30px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <Sparkles size={20} color="var(--gold-primary)" />
              <h2 style={{ fontSize: "1.4rem" }}>
                Review AI Tags ({items.length} {items.length === 1 ? "garment" : "garments"})
              </h2>
            </div>

            <button
              onClick={handleSaveAll}
              disabled={isSaving}
              className="btn-primary"
              style={{ padding: "10px 24px" }}
            >
              <Save size={18} />
              <span>{isSaving ? "Saving Wardrobe..." : `Save All to Wardrobe`}</span>
              <ArrowRight size={16} />
            </button>
          </div>

          {/* Garment Selector Thumbnail Strip */}
          <div
            style={{
              display: "flex",
              gap: "12px",
              overflowX: "auto",
              paddingBottom: "14px",
              marginBottom: "24px",
            }}
          >
            {items.map((item, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={item.itemId}
                  onClick={() => setSelectedIndex(idx)}
                  style={{
                    position: "relative",
                    flex: "0 0 90px",
                    height: "90px",
                    borderRadius: "var(--radius-md)",
                    overflow: "hidden",
                    cursor: "pointer",
                    border: isSelected ? "2px solid var(--gold-primary)" : "1px solid var(--border-subtle)",
                    boxShadow: isSelected ? "0 0 14px var(--gold-glow)" : "none",
                    background: "#161922",
                    transition: "all var(--transition-fast)",
                  }}
                >
                  <img
                    src={item.processedImageUrl || item.thumbnailUrl}
                    alt={item.tags.name}
                    style={{ width: "100%", height: "100%", objectFit: "contain", padding: "4px" }}
                  />
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeItem(idx);
                    }}
                    style={{
                      position: "absolute",
                      top: "4px",
                      right: "4px",
                      background: "rgba(0,0,0,0.65)",
                      borderRadius: "50%",
                      padding: "4px",
                      color: "var(--text-secondary)",
                    }}
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              );
            })}
          </div>

          {/* Current Selected Garment Editor */}
          {currentItem && (
            <div
              className="glass-panel"
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
                gap: "30px",
                padding: "32px",
              }}
            >
              {/* Visual Studio Card */}
              <div>
                <div
                  style={{
                    width: "100%",
                    height: "420px",
                    borderRadius: "var(--radius-md)",
                    position: "relative",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: studioLightMode
                      ? "radial-gradient(circle at center, #f8fafc 0%, #cbd5e1 100%)"
                      : "radial-gradient(circle at center, rgba(30, 36, 52, 0.9) 0%, rgba(14, 16, 24, 0.95) 100%)",
                    border: "1px solid var(--border-card)",
                    overflow: "hidden",
                    transition: "background 0.3s ease",
                  }}
                >
                  <img
                    src={
                      currentItem.showOriginalPreview
                        ? currentItem.originalImageUrl
                        : currentItem.processedImageUrl
                    }
                    alt={currentItem.tags.name}
                    style={{
                      maxWidth: "90%",
                      maxHeight: "90%",
                      objectFit: "contain",
                      filter: studioLightMode
                        ? "drop-shadow(0 10px 18px rgba(0,0,0,0.18))"
                        : "drop-shadow(0 15px 25px rgba(0,0,0,0.6))",
                      transition: "all var(--transition-fast)",
                    }}
                  />

                  {/* Cutout / Original Toggle */}
                  <button
                    onClick={() => togglePreviewMode(selectedIndex)}
                    style={{
                      position: "absolute",
                      bottom: "16px",
                      left: "16px",
                      background: "rgba(10, 12, 18, 0.8)",
                      backdropFilter: "blur(10px)",
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
                    <span>{currentItem.showOriginalPreview ? "Viewing Original" : "Viewing Cutout"}</span>
                  </button>

                  {/* Studio Backdrop Toggle */}
                  <button
                    type="button"
                    onClick={() => setStudioLightMode(!studioLightMode)}
                    title="Toggle Studio Light/Dark Backdrop"
                    style={{
                      position: "absolute",
                      top: "16px",
                      right: "16px",
                      background: "rgba(10, 12, 18, 0.8)",
                      backdropFilter: "blur(10px)",
                      border: "1px solid var(--border-subtle)",
                      borderRadius: "var(--radius-full)",
                      padding: "6px 12px",
                      fontSize: "0.78rem",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      color: "var(--text-secondary)",
                      cursor: "pointer",
                    }}
                  >
                    {studioLightMode ? <Moon size={13} /> : <Sun size={13} />}
                    <span>{studioLightMode ? "Obsidian Dark" : "Studio Light"}</span>
                  </button>
                </div>

                {/* Wardrobe Display Choice Switch */}
                <div
                  style={{
                    marginTop: "16px",
                    padding: "14px 18px",
                    background: "rgba(255, 255, 255, 0.03)",
                    border: "1px solid var(--border-subtle)",
                    borderRadius: "var(--radius-sm)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <div>
                    <div style={{ fontSize: "0.88rem", fontWeight: 600 }}>Wardrobe Display Image</div>
                    <div style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
                      {currentItem.useOriginalImage ? "Saving original photograph" : "Saving transparent studio cutout"}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => toggleUseOriginal(selectedIndex)}
                    style={{
                      background: currentItem.useOriginalImage ? "rgba(229, 185, 95, 0.15)" : "rgba(16, 185, 129, 0.15)",
                      border: `1px solid ${currentItem.useOriginalImage ? "rgba(229, 185, 95, 0.4)" : "rgba(16, 185, 129, 0.4)"}`,
                      color: currentItem.useOriginalImage ? "var(--accent-gold)" : "var(--accent-emerald)",
                      padding: "6px 14px",
                      borderRadius: "var(--radius-full)",
                      fontSize: "0.8rem",
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    {currentItem.useOriginalImage ? "Switch to Cutout" : "Use Original Photo"}
                  </button>
                </div>

                {/* Privacy Face Warning Banner */}
                {currentItem.tags.faceDetected && (
                  <div
                    style={{
                      marginTop: "16px",
                      padding: "12px 16px",
                      background: "rgba(251, 191, 36, 0.1)",
                      border: "1px solid rgba(251, 191, 36, 0.3)",
                      borderRadius: "var(--radius-sm)",
                      display: "flex",
                      alignItems: "flex-start",
                      gap: "10px",
                      color: "var(--accent-amber)",
                      fontSize: "0.85rem",
                    }}
                  >
                    <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: "2px" }} />
                    <span>
                      <strong>Privacy Guard:</strong> A face was detected in this photo. We have focused exclusively on garment geometry and omitted personal likeness data.
                    </span>
                  </div>
                )}
              </div>

              {/* Tag Attribute Form */}
              <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "6px" }}>
                    Garment Name
                  </label>
                  <input
                    type="text"
                    value={currentItem.tags.name}
                    onChange={(e) => updateSelectedTag("name", e.target.value)}
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      background: "rgba(0,0,0,0.3)",
                      border: "1px solid var(--border-subtle)",
                      borderRadius: "var(--radius-sm)",
                      color: "var(--text-primary)",
                      fontSize: "1.1rem",
                      fontWeight: 600,
                      outline: "none",
                    }}
                  />
                </div>

                {/* Category Chips */}
                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "8px" }}>
                    Category
                  </label>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                    {CATEGORIES.map((cat) => {
                      const isCatActive = currentItem.tags.category === cat;
                      return (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => updateSelectedTag("category", cat)}
                          className={`chip ${isCatActive ? "active" : ""}`}
                        >
                          {cat}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Subcategory & Material */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "6px" }}>
                      Subcategory / Garment Type
                    </label>
                    <input
                      type="text"
                      list="common-subcategories"
                      value={currentItem.tags.subcategory}
                      onChange={(e) => updateSelectedTag("subcategory", e.target.value)}
                      placeholder="e.g. Crewneck T-Shirt, Chinos..."
                      style={{
                        width: "100%",
                        padding: "8px 12px",
                        background: "rgba(0,0,0,0.3)",
                        border: "1px solid var(--border-subtle)",
                        borderRadius: "var(--radius-sm)",
                        color: "var(--text-primary)",
                      }}
                    />
                    <datalist id="common-subcategories">
                      <option value="Crewneck T-Shirt" />
                      <option value="Oversized T-Shirt" />
                      <option value="Graphic T-Shirt" />
                      <option value="Classic T-Shirt" />
                      <option value="Button-Down Shirt" />
                      <option value="Polo Shirt" />
                      <option value="Hoodie" />
                      <option value="Sweater / Knit" />
                      <option value="Chino Pants" />
                      <option value="Cargo Trousers" />
                      <option value="Denim Jeans" />
                      <option value="Tailored Trousers" />
                      <option value="Minimalist Sneakers" />
                      <option value="Classic Loafers" />
                      <option value="Leather Boots" />
                      <option value="Tailored Blazer" />
                      <option value="Outer Jacket" />
                    </datalist>
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "6px" }}>
                      Material
                    </label>
                    <select
                      value={currentItem.tags.material}
                      onChange={(e) => updateSelectedTag("material", e.target.value)}
                      style={{
                        width: "100%",
                        padding: "8px 12px",
                        background: "#161922",
                        border: "1px solid var(--border-subtle)",
                        borderRadius: "var(--radius-sm)",
                        color: "var(--text-primary)",
                      }}
                    >
                      {MATERIALS.map((m) => (
                        <option key={m} value={m}>
                          {m}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Colors with Swatch */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "6px" }}>
                      Primary Color
                    </label>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <input
                        type="color"
                        value={currentItem.tags.primaryColorHex || "#000000"}
                        onChange={(e) => updateSelectedTag("primaryColorHex", e.target.value)}
                        style={{ width: "36px", height: "36px", borderRadius: "8px", border: "none", cursor: "pointer", background: "transparent" }}
                      />
                      <input
                        type="text"
                        value={currentItem.tags.primaryColor}
                        onChange={(e) => updateSelectedTag("primaryColor", e.target.value)}
                        style={{
                          flex: 1,
                          padding: "8px 12px",
                          background: "rgba(0,0,0,0.3)",
                          border: "1px solid var(--border-subtle)",
                          borderRadius: "var(--radius-sm)",
                          color: "var(--text-primary)",
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "6px" }}>
                      Pattern
                    </label>
                    <select
                      value={currentItem.tags.pattern}
                      onChange={(e) => updateSelectedTag("pattern", e.target.value)}
                      style={{
                        width: "100%",
                        padding: "8px 12px",
                        background: "#161922",
                        border: "1px solid var(--border-subtle)",
                        borderRadius: "var(--radius-sm)",
                        color: "var(--text-primary)",
                      }}
                    >
                      {PATTERNS.map((p) => (
                        <option key={p} value={p}>
                          {p}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Formality, Fit & Season */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "6px" }}>
                      Formality
                    </label>
                    <select
                      value={currentItem.tags.formality}
                      onChange={(e) => updateSelectedTag("formality", e.target.value)}
                      style={{
                        width: "100%",
                        padding: "8px 12px",
                        background: "#161922",
                        border: "1px solid var(--border-subtle)",
                        borderRadius: "var(--radius-sm)",
                        color: "var(--text-primary)",
                      }}
                    >
                      {FORMALITIES.map((f) => (
                        <option key={f} value={f}>
                          {f}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "6px" }}>
                      Season
                    </label>
                    <select
                      value={currentItem.tags.season}
                      onChange={(e) => updateSelectedTag("season", e.target.value)}
                      style={{
                        width: "100%",
                        padding: "8px 12px",
                        background: "#161922",
                        border: "1px solid var(--border-subtle)",
                        borderRadius: "var(--radius-sm)",
                        color: "var(--text-primary)",
                      }}
                    >
                      {SEASONS.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Styling Notes */}
                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "6px" }}>
                    Styling Recommendation Notes
                  </label>
                  <textarea
                    rows={2}
                    value={currentItem.tags.stylingNotes}
                    onChange={(e) => updateSelectedTag("stylingNotes", e.target.value)}
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      background: "rgba(0,0,0,0.3)",
                      border: "1px solid var(--border-subtle)",
                      borderRadius: "var(--radius-sm)",
                      color: "var(--text-secondary)",
                      fontSize: "0.9rem",
                      resize: "none",
                    }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* AI Vision Configuration Modal */}
      <AiKeyModal
        isOpen={isKeyModalOpen}
        onClose={() => setIsKeyModalOpen(false)}
        onKeyUpdated={setHasAiKey}
      />
    </div>
  );
}
