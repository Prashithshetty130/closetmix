import Link from "next/link";
import { Scale, FileText, AlertTriangle, ShieldCheck, ArrowLeft, Mail, CheckCircle2, UserCheck } from "lucide-react";

export const metadata = {
  title: "Terms and Conditions — Closetmix",
  description: "Terms of Service, acceptable use policy, intellectual property rights, and AI styling disclaimers.",
};

export default function TermsPage() {
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
        <div className="chip" style={{ background: "rgba(229, 185, 95, 0.15)", color: "var(--gold-primary)", marginBottom: "12px", border: "1px solid var(--border-accent)" }}>
          <Scale size={14} />
          <span>Legal Agreement • User Terms of Service</span>
        </div>
        <h1 style={{ fontSize: "2.4rem", marginBottom: "8px", fontWeight: 700 }}>Terms and Conditions</h1>
        <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem" }}>
          Last Updated: October 2, 2026 • Please read these terms carefully before accessing or using Closetmix.
        </p>
      </div>

      <div className="glass-panel" style={{ padding: "36px", display: "flex", flexDirection: "column", gap: "32px" }}>
        {/* 1. Acceptance */}
        <section>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
            <FileText size={20} color="var(--gold-primary)" />
            <h2 style={{ fontSize: "1.3rem", fontWeight: 600 }}>1. Acceptance of Terms</h2>
          </div>
          <p style={{ color: "var(--text-secondary)", lineHeight: 1.6, fontSize: "0.95rem" }}>
            By creating an account, browsing the application, uploading clothing photographs, or utilizing the AI outfit generation services of <strong>Closetmix</strong> (&ldquo;Service&rdquo;), you acknowledge that you have read, understood, and agree to be bound by these Terms and Conditions (&ldquo;Terms&rdquo;) and our <Link href="/privacy" style={{ color: "var(--gold-primary)", textDecoration: "underline" }}>Privacy Policy</Link>. If you do not agree to these Terms, you must immediately discontinue use of the Service.
          </p>
        </section>

        {/* 2. User Accounts & Guest Sessions */}
        <section>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
            <UserCheck size={20} color="var(--accent-indigo)" />
            <h2 style={{ fontSize: "1.3rem", fontWeight: 600 }}>2. Eligibility & Accounts</h2>
          </div>
          <p style={{ color: "var(--text-secondary)", lineHeight: 1.6, fontSize: "0.95rem", marginBottom: "10px" }}>
            You must be at least 13 years of age (or the minimum legal age in your jurisdiction) to use Closetmix.
          </p>
          <ul style={{ paddingLeft: "24px", color: "var(--text-secondary)", lineHeight: 1.7, fontSize: "0.95rem" }}>
            <li><strong>Registered Accounts:</strong> You are responsible for safeguarding your login credentials. You agree to notify us immediately of any unauthorized account access.</li>
            <li><strong>Guest Sessions:</strong> Closetmix offers anonymous Guest Sessions for rapid onboarding. Guest sessions are stored via secure cookie tokens. If you clear browser cookies or logout without upgrading, the temporary guest session cannot be recovered.</li>
          </ul>
        </section>

        {/* 3. Intellectual Property & User Content */}
        <section>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
            <ShieldCheck size={20} color="var(--accent-emerald)" />
            <h2 style={{ fontSize: "1.3rem", fontWeight: 600 }}>3. User Content & Image Ownership</h2>
          </div>
          <p style={{ color: "var(--text-secondary)", lineHeight: 1.6, fontSize: "0.95rem", marginBottom: "12px" }}>
            <strong>You retain 100% full copyright, title, and ownership of all clothing photographs and media you upload to Closetmix.</strong>
          </p>
          <ul style={{ paddingLeft: "24px", color: "var(--text-secondary)", lineHeight: 1.7, fontSize: "0.95rem" }}>
            <li><strong>Limited License to Operate:</strong> By uploading photos, you grant Closetmix a non-exclusive, worldwide, royalty-free, limited license solely to host, process, segment, resize, and display your images back to you within your personal closet interface.</li>
            <li><strong>No Model Training:</strong> We do <em>not</em> license, sell, or utilize your personal garment photos to train public generative artificial intelligence models.</li>
            <li><strong>User Representations:</strong> You represent and warrant that you own or possess all requisite rights to the images you upload, and that such content does not violate third-party intellectual property or privacy rights.</li>
          </ul>
        </section>

        {/* 4. AI Stylist Disclaimers */}
        <section>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
            <AlertTriangle size={20} color="var(--accent-amber)" />
            <h2 style={{ fontSize: "1.3rem", fontWeight: 600 }}>4. AI Styling & Algorithmic Recommendations Disclaimer</h2>
          </div>
          <div style={{ background: "rgba(245, 158, 11, 0.08)", border: "1px solid rgba(245, 158, 11, 0.25)", padding: "18px", borderRadius: "var(--radius-sm)", marginBottom: "12px" }}>
            <p style={{ color: "var(--text-primary)", lineHeight: 1.6, fontSize: "0.95rem", fontWeight: 500 }}>
              Closetmix provides automated, algorithmic fashion recommendations, color harmony pairings, and weather suitability scores based on computer heuristics and multimodal AI.
            </p>
          </div>
          <ul style={{ paddingLeft: "24px", color: "var(--text-secondary)", lineHeight: 1.7, fontSize: "0.95rem" }}>
            <li><strong>Inspirational Purpose:</strong> Outfit combinations, match percentages, and stylist notes are for personal creative inspiration and planning only. We make no warranty that outfit suggestions will meet individual comfort requirements, specific societal dress codes, or professional workplace standards.</li>
            <li><strong>Weather Advisory:</strong> Weather indicators use third-party meteorological forecast APIs (Open-Meteo). We cannot guarantee real-time localized weather accuracy or thermal safety for extreme weather conditions. Always exercise personal discretion before dressing for adverse climates.</li>
          </ul>
        </section>

        {/* 5. Acceptable Use */}
        <section>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
            <CheckCircle2 size={20} color="var(--accent-cyan)" />
            <h2 style={{ fontSize: "1.3rem", fontWeight: 600 }}>5. Acceptable Use Policy</h2>
          </div>
          <p style={{ color: "var(--text-secondary)", lineHeight: 1.6, fontSize: "0.95rem", marginBottom: "10px" }}>
            You agree not to misuse the Service. Specifically, you may not:
          </p>
          <ul style={{ paddingLeft: "24px", color: "var(--text-secondary)", lineHeight: 1.7, fontSize: "0.95rem" }}>
            <li>Upload non-wardrobe imagery that is sexually explicit, defamatory, harassing, or illegal.</li>
            <li>Attempt to probe, reverse-engineer, scan, or compromise our API endpoints or backend security controls.</li>
            <li>Scrape, harvest, or extract data from other users via automated bots or spiders.</li>
            <li>Interfere with the normal operation of our serverless background removal or AI infrastructure.</li>
          </ul>
        </section>

        {/* 6. Limitation of Liability */}
        <section>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
            <Scale size={20} color="var(--accent-rose)" />
            <h2 style={{ fontSize: "1.3rem", fontWeight: 600 }}>6. Limitation of Liability & Warranty Disclaimer</h2>
          </div>
          <p style={{ color: "var(--text-secondary)", lineHeight: 1.6, fontSize: "0.95rem" }}>
            THE SERVICE IS PROVIDED &ldquo;AS IS&rdquo; AND &ldquo;AS AVAILABLE&rdquo; WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED. TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, CLOSETMIX AND ITS AFFILIATES SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF DATA, OPPORTUNITY, OR REPUTATION ARISING OUT OF OR IN CONNECTION WITH YOUR USE OF THE SERVICE.
          </p>
        </section>

        {/* 7. Termination */}
        <section>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
            <FileText size={20} color="var(--gold-primary)" />
            <h2 style={{ fontSize: "1.3rem", fontWeight: 600 }}>7. Termination & Account Deletion</h2>
          </div>
          <p style={{ color: "var(--text-secondary)", lineHeight: 1.6, fontSize: "0.95rem" }}>
            You may terminate these Terms at any time by executing a <strong>Complete Account Purge</strong> in Settings or by deleting your account. Closetmix reserves the right to suspend or terminate accounts that breach these Terms or engage in abusive platform behavior.
          </p>
        </section>

        {/* 8. Contact & Legal Entity */}
        <section style={{ borderTop: "1px solid var(--border-subtle)", paddingTop: "24px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
            <Mail size={20} color="var(--gold-primary)" />
            <h2 style={{ fontSize: "1.3rem", fontWeight: 600 }}>8. Contact & Notice</h2>
          </div>
          <p style={{ color: "var(--text-secondary)", lineHeight: 1.6, fontSize: "0.95rem", marginBottom: "14px" }}>
            For legal inquiries, intellectual property notices, or terms questions, please contact:
          </p>
          <div style={{ background: "rgba(255,255,255,0.03)", padding: "18px", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-subtle)", fontSize: "0.9rem", lineHeight: 1.7, color: "var(--text-secondary)" }}>
            <strong style={{ color: "var(--text-primary)" }}>Closetmix Legal Operations</strong><br />
            Email: <a href="mailto:legal@closetmix.com" style={{ color: "var(--gold-primary)" }}>legal@closetmix.com</a><br />
            Website: <a href="https://closetmix.vercel.app" style={{ color: "var(--gold-primary)" }}>https://closetmix.vercel.app</a>
          </div>
        </section>
      </div>
    </div>
  );
}
