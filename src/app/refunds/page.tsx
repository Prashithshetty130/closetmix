import Link from "next/link";
import { CreditCard, CheckCircle2, ArrowLeft, Mail, Clock, AlertCircle } from "lucide-react";

export const metadata = {
  title: "Refund Policy — Closetmix",
  description: "Transparent refund, cancellation, and consumer protection policies for Closetmix.",
};

export default function RefundPolicyPage() {
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
        <div className="chip" style={{ background: "rgba(16, 185, 129, 0.15)", color: "var(--accent-emerald)", marginBottom: "12px", border: "1px solid rgba(16, 185, 129, 0.3)" }}>
          <CreditCard size={14} />
          <span>Fair Billing • Consumer Protection & Transparency</span>
        </div>
        <h1 style={{ fontSize: "2.4rem", marginBottom: "8px", fontWeight: 700 }}>Refund & Cancellation Policy</h1>
        <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem" }}>
          Last Updated: October 2, 2026 • Clear standards for billing, cancellations, and statutory rights of withdrawal.
        </p>
      </div>

      <div className="glass-panel" style={{ padding: "36px", display: "flex", flexDirection: "column", gap: "32px" }}>
        {/* Current Free Access */}
        <section>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
            <CheckCircle2 size={20} color="var(--accent-emerald)" />
            <h2 style={{ fontSize: "1.3rem", fontWeight: 600 }}>1. Current Free-Tier Service</h2>
          </div>
          <p style={{ color: "var(--text-secondary)", lineHeight: 1.6, fontSize: "0.95rem" }}>
            Closetmix is currently provided with generous free-tier access, allowing you to upload garments, generate flat-lay styling looks, and schedule weekly calendars at zero monetary cost. No payment card is required to enjoy the core platform.
          </p>
        </section>

        {/* Future Paid Subscriptions & Computing Credits */}
        <section>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
            <CreditCard size={20} color="var(--gold-primary)" />
            <h2 style={{ fontSize: "1.3rem", fontWeight: 600 }}>2. Paid Tiers & AI Compute Plans (When Applicable)</h2>
          </div>
          <p style={{ color: "var(--text-secondary)", lineHeight: 1.6, fontSize: "0.95rem", marginBottom: "12px" }}>
            Should you elect to upgrade to future high-volume studio plans or premium AI computing tiers, the following terms govern all transactions:
          </p>
          <ul style={{ paddingLeft: "24px", color: "var(--text-secondary)", lineHeight: 1.7, fontSize: "0.95rem" }}>
            <li><strong>Cancellation Anytime:</strong> You may cancel recurring subscriptions at any time through your account settings. Your access continues until the end of your prepaid billing period without renewal.</li>
            <li><strong>14-Day Statutory Cooling-Off Period (EU & UK):</strong> If you reside in the European Union or United Kingdom, you have the legal right to withdraw from a digital contract within 14 calendar days of initial purchase, provided you have not exhausted the computing credits or digital benefits.</li>
            <li><strong>Technical Failure / Defective AI Generations:</strong> If a paid AI batch fails to process due to server-side infrastructure outages, your account will be immediately credited with equivalent compute tokens or issued a full refund upon verification.</li>
          </ul>
        </section>

        {/* How to Request a Refund */}
        <section>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
            <Clock size={20} color="var(--accent-indigo)" />
            <h2 style={{ fontSize: "1.3rem", fontWeight: 600 }}>3. Refund Request Process & Timeline</h2>
          </div>
          <p style={{ color: "var(--text-secondary)", lineHeight: 1.6, fontSize: "0.95rem", marginBottom: "12px" }}>
            To initiate a refund inquiry:
          </p>
          <ol style={{ paddingLeft: "24px", color: "var(--text-secondary)", lineHeight: 1.7, fontSize: "0.95rem" }}>
            <li>Email our billing desk at <a href="mailto:billing@closetmix.com" style={{ color: "var(--gold-primary)" }}>billing@closetmix.com</a> from the email address registered to your account.</li>
            <li>Include your transaction reference number and a brief description of the issue.</li>
            <li>Our billing team reviews all requests within <strong>2 business days</strong>.</li>
            <li>Approved refunds are credited back to your original payment method within <strong>5 to 7 business days</strong>.</li>
          </ol>
        </section>

        {/* Chargebacks & Fraud Prevention */}
        <section>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
            <AlertCircle size={20} color="var(--accent-amber)" />
            <h2 style={{ fontSize: "1.3rem", fontWeight: 600 }}>4. Chargebacks & Friendly Fraud</h2>
          </div>
          <p style={{ color: "var(--text-secondary)", lineHeight: 1.6, fontSize: "0.95rem" }}>
            We encourage users to contact our support team directly before lodging bank chargebacks. We are committed to resolving legitimate billing questions promptly and fairly.
          </p>
        </section>

        {/* Contact */}
        <section style={{ borderTop: "1px solid var(--border-subtle)", paddingTop: "24px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
            <Mail size={20} color="var(--gold-primary)" />
            <h2 style={{ fontSize: "1.3rem", fontWeight: 600 }}>5. Billing Support Desk</h2>
          </div>
          <div style={{ background: "rgba(255,255,255,0.03)", padding: "18px", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-subtle)", fontSize: "0.9rem", lineHeight: 1.7, color: "var(--text-secondary)" }}>
            <strong style={{ color: "var(--text-primary)" }}>Closetmix Billing Department</strong><br />
            Email: <a href="mailto:billing@closetmix.com" style={{ color: "var(--gold-primary)" }}>billing@closetmix.com</a><br />
            Support Hours: Monday – Friday, 9:00 AM – 6:00 PM UTC
          </div>
        </section>
      </div>
    </div>
  );
}
