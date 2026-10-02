import Link from "next/link";
import { Cookie, XCircle, ArrowLeft, RefreshCw, Lock, HelpCircle } from "lucide-react";

export const metadata = {
  title: "Cookie Policy — Closetmix",
  description: "Learn about how Closetmix uses strictly necessary cookies and local storage without third-party tracking.",
};

export default function CookiesPage() {
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
        <div className="chip" style={{ background: "rgba(56, 189, 248, 0.15)", color: "var(--accent-cyan)", marginBottom: "12px", border: "1px solid rgba(56, 189, 248, 0.3)" }}>
          <Cookie size={14} />
          <span>Zero Tracking • Privacy-First Technical Cookies</span>
        </div>
        <h1 style={{ fontSize: "2.4rem", marginBottom: "8px", fontWeight: 700 }}>Cookie Policy</h1>
        <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem" }}>
          Last Updated: October 2, 2026 • Transparent breakdown of session tokens and local storage usage.
        </p>
      </div>

      <div className="glass-panel" style={{ padding: "36px", display: "flex", flexDirection: "column", gap: "32px" }}>
        {/* Intro */}
        <section>
          <p style={{ color: "var(--text-primary)", lineHeight: 1.7, fontSize: "1rem" }}>
            This Cookie Policy explains what cookies and local storage technologies <strong>Closetmix</strong> uses, why we use them, and how you can control them. We operate with a strict privacy-first architecture: <strong>we do not use cross-site advertising cookies, tracking pixels, or data broker beacons</strong>.
          </p>
        </section>

        {/* 1. What Are Cookies */}
        <section>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
            <HelpCircle size={20} color="var(--gold-primary)" />
            <h2 style={{ fontSize: "1.3rem", fontWeight: 600 }}>1. What Are Cookies and Local Storage?</h2>
          </div>
          <p style={{ color: "var(--text-secondary)", lineHeight: 1.6, fontSize: "0.95rem" }}>
            A cookie is a small piece of data stored on your device by your web browser. Local Storage is a modern web standard that allows web applications to store key-value data directly in the browser. These technologies allow Closetmix to remember that you are logged in and retain your selected user preferences.
          </p>
        </section>

        {/* 2. Detailed Cookie Inventory */}
        <section>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
            <Lock size={20} color="var(--accent-emerald)" />
            <h2 style={{ fontSize: "1.3rem", fontWeight: 600 }}>2. Cookies Used by Closetmix</h2>
          </div>

          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.9rem", textAlign: "left" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border-subtle)", color: "var(--text-muted)" }}>
                  <th style={{ padding: "12px 10px" }}>Cookie / Storage Key</th>
                  <th style={{ padding: "12px 10px" }}>Category</th>
                  <th style={{ padding: "12px 10px" }}>Duration</th>
                  <th style={{ padding: "12px 10px" }}>Purpose</th>
                </tr>
              </thead>
              <tbody style={{ color: "var(--text-secondary)" }}>
                <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                  <td style={{ padding: "14px 10px", fontFamily: "monospace", color: "var(--gold-primary)" }}>closetmix_session</td>
                  <td style={{ padding: "14px 10px" }}>Strictly Necessary</td>
                  <td style={{ padding: "14px 10px" }}>30 Days / Until Logout</td>
                  <td style={{ padding: "14px 10px" }}>Stores an encrypted, HTTP-Only JWT token allowing you to securely access your personal wardrobe without re-authenticating on every page load.</td>
                </tr>
                <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                  <td style={{ padding: "14px 10px", fontFamily: "monospace", color: "var(--gold-primary)" }}>closetmix_cookie_consent</td>
                  <td style={{ padding: "14px 10px" }}>Strictly Necessary</td>
                  <td style={{ padding: "14px 10px" }}>1 Year</td>
                  <td style={{ padding: "14px 10px" }}>Remembers your cookie consent choice so the banner does not re-appear on subsequent visits.</td>
                </tr>
                <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                  <td style={{ padding: "14px 10px", fontFamily: "monospace", color: "var(--gold-primary)" }}>theme (localStorage)</td>
                  <td style={{ padding: "14px 10px" }}>Functional</td>
                  <td style={{ padding: "14px 10px" }}>Persistent</td>
                  <td style={{ padding: "14px 10px" }}>Remembers your Obsidian Dark or Champagne Light display mode.</td>
                </tr>
                <tr>
                  <td style={{ padding: "14px 10px", fontFamily: "monospace", color: "var(--gold-primary)" }}>stylingPerspective (localStorage)</td>
                  <td style={{ padding: "14px 10px" }}>Functional</td>
                  <td style={{ padding: "14px 10px" }}>Persistent</td>
                  <td style={{ padding: "14px 10px" }}>Caches your active Menswear or Womenswear styling mode across navigation sessions.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* 3. What We Do NOT Use */}
        <section>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
            <XCircle size={20} color="var(--accent-rose)" />
            <h2 style={{ fontSize: "1.3rem", fontWeight: 600 }}>3. What We Do NOT Use</h2>
          </div>
          <div style={{ background: "rgba(244, 63, 94, 0.08)", border: "1px solid rgba(244, 63, 94, 0.25)", padding: "18px", borderRadius: "var(--radius-sm)", marginBottom: "12px" }}>
            <ul style={{ paddingLeft: "20px", color: "var(--text-secondary)", lineHeight: 1.7, fontSize: "0.95rem" }}>
              <li><strong>NO Advertising Cookies:</strong> We do not track you across the internet or monetize your attention.</li>
              <li><strong>NO Third-Party Trackers:</strong> We do not embed Facebook/Meta pixels, Google Ads tags, or affiliate beacons.</li>
              <li><strong>NO Cookie Selling:</strong> We never transmit cookie or session data to marketing exchanges.</li>
            </ul>
          </div>
        </section>

        {/* 4. Managing & Disabling */}
        <section>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
            <RefreshCw size={20} color="var(--accent-indigo)" />
            <h2 style={{ fontSize: "1.3rem", fontWeight: 600 }}>4. How to Manage and Block Cookies</h2>
          </div>
          <p style={{ color: "var(--text-secondary)", lineHeight: 1.6, fontSize: "0.95rem", marginBottom: "12px" }}>
            You can configure your browser to block or alert you about cookies at any time:
          </p>
          <ul style={{ paddingLeft: "24px", color: "var(--text-secondary)", lineHeight: 1.7, fontSize: "0.95rem" }}>
            <li><strong>Google Chrome:</strong> Settings $\rightarrow$ Privacy and Security $\rightarrow$ Third-Party Cookies.</li>
            <li><strong>Apple Safari:</strong> Preferences $\rightarrow$ Privacy $\rightarrow$ Block all cookies.</li>
            <li><strong>Mozilla Firefox:</strong> Settings $\rightarrow$ Privacy & Security $\rightarrow$ Cookies and Site Data.</li>
            <li><strong>Microsoft Edge:</strong> Settings $\rightarrow$ Cookies and Site Permissions $\rightarrow$ Manage and delete cookies.</li>
          </ul>
          <p style={{ color: "var(--text-muted)", fontSize: "0.88rem", marginTop: "12px" }}>
            <em>Note: Blocking strictly necessary session cookies will prevent you from logging in or maintaining a digital wardrobe catalog.</em>
          </p>
        </section>

        {/* 5. Contact */}
        <section style={{ borderTop: "1px solid var(--border-subtle)", paddingTop: "24px" }}>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem" }}>
            For questions regarding our cookie practices, contact us at <a href="mailto:privacy@closetmix.com" style={{ color: "var(--gold-primary)" }}>privacy@closetmix.com</a>.
          </p>
        </section>
      </div>
    </div>
  );
}
