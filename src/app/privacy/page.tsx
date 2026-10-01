import Link from "next/link";
import { ShieldCheck, Lock, Trash2, EyeOff, FileText, ArrowLeft } from "lucide-react";

export default function PrivacyPolicyPage() {
  return (
    <div className="app-container" style={{ paddingTop: "40px", maxWidth: "860px" }}>
      <Link
        href="/"
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
        <span>Back to Home</span>
      </Link>

      <div style={{ marginBottom: "32px" }}>
        <div className="chip" style={{ background: "rgba(52, 211, 153, 0.15)", color: "var(--accent-emerald)", marginBottom: "12px" }}>
          <ShieldCheck size={14} />
          <span>Privacy & Personal Data Protection Architecture</span>
        </div>
        <h1 style={{ fontSize: "2.4rem", marginBottom: "8px" }}>Privacy Policy & Consent Agreement</h1>
        <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem" }}>
          Last Updated: October 2026 • Strict adherence to GDPR, CCPA, and privacy-first architectural standards.
        </p>
      </div>

      <div className="glass-panel" style={{ padding: "36px", display: "flex", flexDirection: "column", gap: "28px" }}>
        {/* Section 1 */}
        <section>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
            <Lock size={20} color="var(--gold-primary)" />
            <h2 style={{ fontSize: "1.25rem" }}>1. Clothing Photos as Personal Data</h2>
          </div>
          <p style={{ color: "var(--text-secondary)", lineHeight: 1.6, fontSize: "0.95rem" }}>
            We treat your physical wardrobe imagery with the utmost confidentiality. Clothing photos, cutouts, and styling history are classified as private personal data. We never sell, monetize, or license your personal wardrobe photographs to third-party data brokers or marketing networks.
          </p>
        </section>

        {/* Section 2 */}
        <section>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
            <EyeOff size={20} color="var(--accent-cyan)" />
            <h2 style={{ fontSize: "1.25rem" }}>2. Automated EXIF & GPS Location Stripping</h2>
          </div>
          <p style={{ color: "var(--text-secondary)", lineHeight: 1.6, fontSize: "0.95rem" }}>
            Upon uploading any photo (JPG, PNG, WEBP, or iPhone HEIC), our backend pipeline automatically sanitizes all Exchangeable Image File Format (EXIF) metadata before the image touches our permanent storage. All GPS coordinates, device serial numbers, and capture timestamps are permanently purged.
          </p>
        </section>

        {/* Section 3 */}
        <section>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
            <ShieldCheck size={20} color="var(--accent-amber)" />
            <h2 style={{ fontSize: "1.25rem" }}>3. Facial Likeness & Privacy Shield</h2>
          </div>
          <p style={{ color: "var(--text-secondary)", lineHeight: 1.6, fontSize: "0.95rem" }}>
            If a photo contains a person&apos;s face or bodily likeness (e.g. mirror selfie), our vision pipeline triggers an automated privacy warning. The AI is strictly instructed to evaluate only the garment geometry, colors, and textile attributes. Facial biometric profiles or personal likenesses are never extracted, trained on, or stored.
          </p>
        </section>

        {/* Section 4 */}
        <section>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
            <Lock size={20} color="var(--accent-indigo)" />
            <h2 style={{ fontSize: "1.25rem" }}>4. Per-User Cryptographic Storage Vaults</h2>
          </div>
          <p style={{ color: "var(--text-secondary)", lineHeight: 1.6, fontSize: "0.95rem" }}>
            Every user is assigned an isolated, cryptographically random UUID directory vault. Storage requests are guarded against Insecure Direct Object References (IDOR); only the authenticated account owner can ever request or display their personal garment cutouts.
          </p>
        </section>

        {/* Section 5 */}
        <section>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
            <Trash2 size={20} color="var(--accent-rose)" />
            <h2 style={{ fontSize: "1.25rem" }}>5. Right to Immediate Erasure (GDPR Article 17)</h2>
          </div>
          <p style={{ color: "var(--text-secondary)", lineHeight: 1.6, fontSize: "0.95rem", marginBottom: "12px" }}>
            You maintain complete ownership and sovereignty over your closet. You can:
          </p>
          <ul style={{ paddingLeft: "24px", color: "var(--text-secondary)", lineHeight: 1.7, fontSize: "0.92rem" }}>
            <li>Delete individual garments at any time (immediately removes all disk files and database records).</li>
            <li>Execute a <strong>Complete Account & Data Purge</strong> in Settings, which wipes your user profile, all wardrobe items, generated outfits, feedback logs, and permanently removes all storage folders from disk in a single transaction.</li>
          </ul>
        </section>
      </div>
    </div>
  );
}
