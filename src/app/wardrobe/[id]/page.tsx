import { notFound } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ArrowLeft, Wand2, Heart, Clock, Tag } from "lucide-react";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function GarmentDetailPage({ params }: PageProps) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) return notFound();

  const item = await prisma.clothingItem.findUnique({
    where: { id },
  });

  if (!item || item.userId !== user.id) {
    return notFound();
  }

  return (
    <div className="app-container" style={{ paddingTop: "40px", maxWidth: "900px" }}>
      <Link
        href="/wardrobe"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "8px",
          color: "var(--text-secondary)",
          marginBottom: "24px",
          fontSize: "0.9rem",
        }}
      >
        <ArrowLeft size={16} />
        <span>Back to Wardrobe</span>
      </Link>

      <div
        className="glass-panel"
        style={{
          padding: "36px",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
          gap: "36px",
          borderRadius: "var(--radius-lg)",
        }}
      >
        {/* Garment Visual */}
        <div
          style={{
            height: "420px",
            borderRadius: "var(--radius-md)",
            background: "radial-gradient(circle at center, rgba(30, 36, 52, 0.9) 0%, rgba(14, 16, 24, 0.95) 100%)",
            border: "1px solid var(--border-card)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "24px",
          }}
        >
          <img
            src={item.processedImageUrl}
            alt={item.name}
            style={{
              maxWidth: "100%",
              maxHeight: "100%",
              objectFit: "contain",
              filter: "drop-shadow(0 15px 25px rgba(0,0,0,0.6))",
            }}
          />
        </div>

        {/* Details & Attributes */}
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", gap: "8px", marginBottom: "8px" }}>
            <span className="chip" style={{ background: "rgba(229, 185, 95, 0.15)", color: "var(--gold-primary)" }}>
              {item.category}
            </span>
            <span className="chip">{item.subcategory}</span>
          </div>

          <h1 style={{ fontSize: "1.8rem", marginBottom: "16px" }}>{item.name}</h1>

          {/* Metric cards */}
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
                Total Wears
              </span>
              <p style={{ fontSize: "1.3rem", fontWeight: 700, color: "var(--gold-primary)" }}>
                {item.wearCount}x
              </p>
            </div>
            <div>
              <span style={{ fontSize: "0.78rem", color: "var(--text-muted)", textTransform: "uppercase" }}>
                Last Worn
              </span>
              <p style={{ fontSize: "0.95rem", fontWeight: 600, color: "var(--text-secondary)", marginTop: "4px" }}>
                {item.lastWornAt ? new Date(item.lastWornAt).toLocaleDateString() : "Never worn"}
              </p>
            </div>
          </div>

          {/* Attributes List */}
          <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "28px" }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "var(--text-muted)" }}>Color:</span>
              <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: item.primaryColorHex }} />
                {item.primaryColor}
              </span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "var(--text-muted)" }}>Material:</span>
              <span>{item.material}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "var(--text-muted)" }}>Pattern:</span>
              <span>{item.pattern}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "var(--text-muted)" }}>Fit:</span>
              <span>{item.fit}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "var(--text-muted)" }}>Season:</span>
              <span>{item.season}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "var(--text-muted)" }}>Formality:</span>
              <span>{item.formality}</span>
            </div>
          </div>

          {/* CTA */}
          <div style={{ marginTop: "auto" }}>
            <Link
              href={`/outfits?buildAround=${item.id}`}
              className="btn-primary"
              style={{ width: "100%", justifyContent: "center", padding: "12px" }}
            >
              <Wand2 size={18} />
              <span>Generate Outfits Around This</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
