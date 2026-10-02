import Link from "next/link";
import { ShieldCheck, Lock, EyeOff, ArrowLeft, Mail, Database, Sparkles, Scale, RefreshCw } from "lucide-react";

export const metadata = {
  title: "Privacy Policy — Closetmix",
  description: "Comprehensive privacy policy, personal data protection architecture, and GDPR/CCPA compliance.",
};

export default function PrivacyPolicyPage() {
  return (
    <div className="app-container" style={{ paddingTop: "40px", maxWidth: "880px" }}>
      <Link
        href="/"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "8px",
          color: "var(--text-secondary)",
          marginBottom: "24px",
          fontSize: "0.9rem",
          textDecoration: "none",
        }}
      >
        <ArrowLeft size={16} />
        <span>Back to Home</span>
      </Link>

      <div style={{ marginBottom: "32px" }}>
        <div className="chip" style={{ background: "rgba(52, 211, 153, 0.15)", color: "var(--accent-emerald)", marginBottom: "12px", border: "1px solid rgba(52, 211, 153, 0.3)" }}>
          <ShieldCheck size={14} />
          <span>Global Privacy Architecture • GDPR & CCPA/CPRA Compliant</span>
        </div>
        <h1 style={{ fontSize: "2.4rem", marginBottom: "8px", fontWeight: 700 }}>Privacy Policy</h1>
        <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem" }}>
          Effective Date: October 2, 2026 • Version 2.0 • Data Protection & Transparency Agreement
        </p>
      </div>

      <div className="glass-panel" style={{ padding: "36px", display: "flex", flexDirection: "column", gap: "32px" }}>
        {/* Intro */}
        <section>
          <p style={{ color: "var(--text-primary)", lineHeight: 1.7, fontSize: "1rem" }}>
            At <strong>Closetmix</strong> (&ldquo;we&rdquo;, &ldquo;our&rdquo;, or &ldquo;us&rdquo;), your personal privacy is fundamental to our product architecture. We believe your wardrobe, daily attire, and personal style decisions belong strictly to you. This Privacy Policy outlines what information we collect, why we collect it, how it is processed, and your legal rights under the <strong>General Data Protection Regulation (GDPR)</strong>, the <strong>California Consumer Privacy Act (CCPA/CPRA)</strong>, and international data protection laws.
          </p>
        </section>

        {/* Section 1: Data We Collect */}
        <section>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
            <Database size={20} color="var(--gold-primary)" />
            <h2 style={{ fontSize: "1.3rem", fontWeight: 600 }}>1. Categories of Data Collected</h2>
          </div>
          <p style={{ color: "var(--text-secondary)", lineHeight: 1.6, fontSize: "0.95rem", marginBottom: "12px" }}>
            We practice strict <strong>Data Minimization</strong> (GDPR Article 5(1)(c)). We collect only the data strictly necessary to operate your digital wardrobe and AI styling atelier:
          </p>
          <ul style={{ paddingLeft: "24px", color: "var(--text-secondary)", lineHeight: 1.7, fontSize: "0.95rem" }}>
            <li><strong>Account Information:</strong> Name, email address, and cryptographically salted password hashes (via bcrypt). For Guest users, only an anonymous pseudonymous session identifier is generated.</li>
            <li><strong>Wardrobe Imagery:</strong> Garment photographs you upload to digitize your closet.</li>
            <li><strong>Fashion Attribute Metadata:</strong> Extracted technical dimensions including category, subcategory, primary/secondary colors, fabric pattern, material, fit silhouette, and formality.</li>
            <li><strong>Styling Preferences & Logs:</strong> Stored aesthetic choices (e.g. Menswear vs. Womenswear preference, color exclusions), generated outfits, calendar wear schedules, and feedback ratings.</li>
            <li><strong>Technical Session Data:</strong> First-party authentication session cookie (<code style={{ background: "rgba(255,255,255,0.06)", padding: "2px 6px", borderRadius: "4px" }}>closetmix_session</code>) and local theme/consent states. We do <strong>not</strong> collect advertising identifiers, device fingerprints, or invasive tracking beacons.</li>
          </ul>
        </section>

        {/* Section 2: Image Processing & EXIF Sanitization */}
        <section>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
            <EyeOff size={20} color="var(--accent-cyan)" />
            <h2 style={{ fontSize: "1.3rem", fontWeight: 600 }}>2. EXIF Location Stripping & Facial Shielding</h2>
          </div>
          <p style={{ color: "var(--text-secondary)", lineHeight: 1.6, fontSize: "0.95rem", marginBottom: "12px" }}>
            We implement automated privacy filters prior to saving any uploaded image:
          </p>
          <ul style={{ paddingLeft: "24px", color: "var(--text-secondary)", lineHeight: 1.7, fontSize: "0.95rem" }}>
            <li><strong>Automated EXIF/GPS Stripping:</strong> When you upload a photo (JPG, PNG, WEBP, or iPhone HEIC), our server pipeline strips all Exchangeable Image File Format (EXIF) metadata, including geolocation coordinates, camera serial numbers, and capture timestamps before storage.</li>
            <li><strong>Facial Biometric Shield:</strong> If a wardrobe photo includes human faces or mirror selfies, our pipeline triggers a privacy alert. We never extract, train on, or store facial biometrics or identity markers. The neural segmentation engine isolates the fabric boundary only.</li>
          </ul>
        </section>

        {/* Section 3: AI Processing & Third-Party Processors */}
        <section>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
            <Sparkles size={20} color="var(--accent-indigo)" />
            <h2 style={{ fontSize: "1.3rem", fontWeight: 600 }}>3. AI Model Processing & Third-Party Sub-Processors</h2>
          </div>
          <p style={{ color: "var(--text-secondary)", lineHeight: 1.6, fontSize: "0.95rem", marginBottom: "12px" }}>
            To generate fashion recommendations and tag attributes, we partner with vetted, enterprise-grade cloud sub-processors:
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "14px", marginTop: "12px" }}>
            <div style={{ padding: "16px", background: "rgba(255,255,255,0.03)", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-subtle)" }}>
              <strong style={{ display: "block", color: "var(--text-primary)", marginBottom: "4px" }}>Supabase (PostgreSQL)</strong>
              <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>Encrypted database hosting and connection pooling. Data is encrypted in transit (TLS 1.3) and at rest (AES-256).</span>
            </div>
            <div style={{ padding: "16px", background: "rgba(255,255,255,0.03)", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-subtle)" }}>
              <strong style={{ display: "block", color: "var(--text-primary)", marginBottom: "4px" }}>OpenRouter / Google Gemini</strong>
              <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>Ephemeral multimodal AI vision inference. User imagery is strictly evaluated in-memory for attribute detection and is <strong>never used to train public foundation models</strong>.</span>
            </div>
            <div style={{ padding: "16px", background: "rgba(255,255,255,0.03)", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-subtle)" }}>
              <strong style={{ display: "block", color: "var(--text-primary)", marginBottom: "4px" }}>Open-Meteo API</strong>
              <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>Free, open meteorological service for weather-aware outfit styling. Queries are made server-side without transmitting personal user IP addresses.</span>
            </div>
          </div>
        </section>

        {/* Section 4: Storage Security */}
        <section>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
            <Lock size={20} color="var(--accent-amber)" />
            <h2 style={{ fontSize: "1.3rem", fontWeight: 600 }}>4. Cryptographic Isolation & Security Architecture</h2>
          </div>
          <p style={{ color: "var(--text-secondary)", lineHeight: 1.6, fontSize: "0.95rem" }}>
            Each user is provisioned an isolated cryptographic UUID vault. All file requests are guarded by server-side authorization checks against Insecure Direct Object References (IDOR). Only the authenticated session owner has access to view or delete their personal cutouts.
          </p>
        </section>

        {/* Section 5: User Rights */}
        <section>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
            <Scale size={20} color="var(--accent-emerald)" />
            <h2 style={{ fontSize: "1.3rem", fontWeight: 600 }}>5. Your Legal Rights (GDPR & CCPA/CPRA)</h2>
          </div>
          <p style={{ color: "var(--text-secondary)", lineHeight: 1.6, fontSize: "0.95rem", marginBottom: "12px" }}>
            Regardless of your geographic location, you enjoy the following rights:
          </p>
          <ul style={{ paddingLeft: "24px", color: "var(--text-secondary)", lineHeight: 1.7, fontSize: "0.95rem" }}>
            <li><strong>Right of Access & Portability:</strong> You may request a complete export of your wardrobe data and metadata at any time.</li>
            <li><strong>Right to Rectification:</strong> You can edit any garment tag, color, or detail directly from your wardrobe catalog.</li>
            <li><strong>Right to Erasure (GDPR Art. 17):</strong> You can delete any individual garment instantly. Furthermore, you can trigger a <strong>Complete Account & Data Purge</strong> in Settings, which permanently wipes all records, photos, cutouts, and credentials from both the database and file storage in a single transaction.</li>
            <li><strong>Right to Non-Discrimination:</strong> We do not discriminate against users who exercise their privacy rights.</li>
          </ul>
        </section>

        {/* Section 6: Cookies */}
        <section>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
            <RefreshCw size={20} color="var(--accent-cyan)" />
            <h2 style={{ fontSize: "1.3rem", fontWeight: 600 }}>6. Cookies & Tracking Technologies</h2>
          </div>
          <p style={{ color: "var(--text-secondary)", lineHeight: 1.6, fontSize: "0.95rem" }}>
            We do not use advertising or third-party behavioral tracking cookies. We utilize only strictly necessary session cookies (<code style={{ background: "rgba(255,255,255,0.06)", padding: "2px 6px", borderRadius: "4px" }}>closetmix_session</code>) to keep you securely signed in and local storage for interface preferences. For complete details, see our <Link href="/cookies" style={{ color: "var(--gold-primary)", textDecoration: "underline" }}>Cookie Policy</Link>.
          </p>
        </section>

        {/* Section 7: Business Details & Contact */}
        <section style={{ borderTop: "1px solid var(--border-subtle)", paddingTop: "24px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
            <Mail size={20} color="var(--gold-primary)" />
            <h2 style={{ fontSize: "1.3rem", fontWeight: 600 }}>7. Data Controller & Contact Information</h2>
          </div>
          <p style={{ color: "var(--text-secondary)", lineHeight: 1.6, fontSize: "0.95rem", marginBottom: "14px" }}>
            If you have questions regarding this Privacy Policy, wish to exercise your data subject rights, or have security inquiries, please contact our Data Protection Officer:
          </p>
          <div style={{ background: "rgba(255,255,255,0.03)", padding: "18px", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-subtle)", fontSize: "0.9rem", lineHeight: 1.7, color: "var(--text-secondary)" }}>
            <strong style={{ color: "var(--text-primary)" }}>Closetmix AI Studio</strong><br />
            Attn: Privacy & Data Protection Compliance<br />
            Email: <a href="mailto:privacy@closetmix.com" style={{ color: "var(--gold-primary)" }}>privacy@closetmix.com</a><br />
            Website: <a href="https://closetmix.vercel.app" style={{ color: "var(--gold-primary)" }}>https://closetmix.vercel.app</a><br />
            Response Time: Within 48 hours for all data subject requests.
          </div>
        </section>
      </div>
    </div>
  );
}
