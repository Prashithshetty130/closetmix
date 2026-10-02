import Link from "next/link";
import { Sparkles, Shield, Lock, Mail } from "lucide-react";

export default function Footer() {
  return (
    <footer
      role="contentinfo"
      style={{
        borderTop: "1px solid var(--border-subtle)",
        background: "rgba(8, 9, 13, 0.95)",
        marginTop: "80px",
        padding: "48px 24px 36px",
      }}
    >
      <div
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          display: "flex",
          flexDirection: "column",
          gap: "36px",
        }}
      >
        {/* Top Tier: Brand, Trust Badges, and Navigation Columns */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "32px",
          }}
        >
          {/* Brand Info */}
          <div style={{ maxWidth: "340px" }}>
            <Link
              href="/"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "10px",
                textDecoration: "none",
                marginBottom: "14px",
              }}
            >
              <div
                style={{
                  width: "32px",
                  height: "32px",
                  borderRadius: "8px",
                  background: "linear-gradient(135deg, var(--gold-primary), #a67c1e)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#08090d",
                  boxShadow: "0 0 12px var(--gold-glow)",
                }}
              >
                <Sparkles size={18} />
              </div>
              <span
                style={{
                  fontFamily: "var(--font-serif)",
                  fontSize: "1.3rem",
                  fontWeight: 700,
                  letterSpacing: "0.04em",
                  color: "var(--text-primary)",
                }}
              >
                CLOSETMIX
              </span>
            </Link>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.88rem", lineHeight: 1.6, marginBottom: "16px" }}>
              Intelligent digital wardrobe curation and multimodal AI outfit atelier. Zero ad tracking, private cloud vaults, and color harmony algorithms.
            </p>
            <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "0.8rem", color: "var(--accent-emerald)" }}>
              <Shield size={14} />
              <span>GDPR &amp; CCPA/CPRA Privacy Certified</span>
            </div>
          </div>

          {/* Product Links */}
          <div>
            <h4 style={{ fontSize: "0.95rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "16px", letterSpacing: "0.04em" }}>
              ATELIER
            </h4>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "10px", fontSize: "0.9rem" }}>
              <li>
                <Link href="/wardrobe" style={{ color: "var(--text-secondary)", textDecoration: "none" }}>
                  Digital Wardrobe
                </Link>
              </li>
              <li>
                <Link href="/wardrobe/upload" style={{ color: "var(--text-secondary)", textDecoration: "none" }}>
                  Upload &amp; Cutout Garments
                </Link>
              </li>
              <li>
                <Link href="/outfits" style={{ color: "var(--text-secondary)", textDecoration: "none" }}>
                  Outfit Generator
                </Link>
              </li>
              <li>
                <Link href="/planner" style={{ color: "var(--text-secondary)", textDecoration: "none" }}>
                  Weekly Outfit Planner
                </Link>
              </li>
              <li>
                <Link href="/insights" style={{ color: "var(--text-secondary)", textDecoration: "none" }}>
                  Wardrobe Gap Analysis &amp; Capsule
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal & Compliance */}
          <div>
            <h4 style={{ fontSize: "0.95rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "16px", letterSpacing: "0.04em" }}>
              LEGAL &amp; COMPLIANCE
            </h4>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "10px", fontSize: "0.9rem" }}>
              <li>
                <Link href="/privacy" style={{ color: "var(--text-secondary)", textDecoration: "none" }}>
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" style={{ color: "var(--text-secondary)", textDecoration: "none" }}>
                  Terms &amp; Conditions
                </Link>
              </li>
              <li>
                <Link href="/cookies" style={{ color: "var(--text-secondary)", textDecoration: "none" }}>
                  Cookie Policy
                </Link>
              </li>
              <li>
                <Link href="/refunds" style={{ color: "var(--text-secondary)", textDecoration: "none" }}>
                  Refund &amp; Cancellation Policy
                </Link>
              </li>
              <li>
                <Link href="/settings" style={{ color: "var(--text-secondary)", textDecoration: "none" }}>
                  Account &amp; GDPR Data Purge
                </Link>
              </li>
            </ul>
          </div>

          {/* Business & Support */}
          <div>
            <h4 style={{ fontSize: "0.95rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "16px", letterSpacing: "0.04em" }}>
              BUSINESS &amp; SUPPORT
            </h4>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.88rem", lineHeight: 1.6, marginBottom: "10px" }}>
              <strong>Closetmix AI Studio</strong><br />
              Digital Styling &amp; Fashion AI Services
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "0.88rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--text-secondary)" }}>
                <Mail size={15} color="var(--gold-primary)" />
                <a href="mailto:support@closetmix.com" style={{ color: "var(--gold-primary)", textDecoration: "none" }}>
                  support@closetmix.com
                </a>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--text-secondary)" }}>
                <Lock size={15} color="var(--accent-emerald)" />
                <a href="mailto:privacy@closetmix.com" style={{ color: "var(--text-secondary)", textDecoration: "none" }}>
                  privacy@closetmix.com
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Tier: Copyright & Disclaimers */}
        <div
          style={{
            borderTop: "1px solid var(--border-subtle)",
            paddingTop: "24px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "16px",
            fontSize: "0.82rem",
            color: "var(--text-muted)",
          }}
        >
          <div>
            © {new Date().getFullYear()} Closetmix AI Studio. All rights reserved. Registered trademark pending.
          </div>
          <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
            <span>Built with privacy-first neural vision</span>
            <span>•</span>
            <span>Zero Third-Party Advertising</span>
            <span>•</span>
            <Link href="/privacy" style={{ color: "var(--text-muted)", textDecoration: "underline" }}>
              GDPR Verified
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
