"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShieldAlert, Trash2, User, KeyRound, Sparkles, LogOut, CheckCircle2, AlertCircle, Key } from "lucide-react";
import AiKeyModal from "@/components/AiKeyModal";

interface UserProfile {
  id: string;
  email?: string | null;
  name?: string | null;
  isGuest: boolean;
  preferences?: string | null;
  createdAt: string;
  _count?: {
    clothingItems: number;
    outfits: number;
  };
}

export default function SettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Forms
  const [authMode, setAuthMode] = useState<"login" | "register">("register");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [authError, setAuthError] = useState("");
  const [authSuccess, setAuthSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  // Purge state
  const [showPurgeModal, setShowPurgeModal] = useState(false);
  const [isPurging, setIsPurging] = useState(false);

  // AI Key Modal state
  const [isAiKeyModalOpen, setIsAiKeyModalOpen] = useState(false);
  const [hasAiKey, setHasAiKey] = useState(false);

  // Styling Perspective state
  const [gender, setGender] = useState<"male" | "female">("male");
  const [genderSavedToast, setGenderSavedToast] = useState(false);

  useEffect(() => {
    fetchUser();
    fetch("/api/user/ai-key")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setHasAiKey(data.hasKey);
      })
      .catch(() => {});

    fetch("/api/user/preferences")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.preferences?.gender) {
          setGender(data.preferences.gender);
        }
      })
      .catch(() => {});
  }, []);

  const handleGenderToggle = async (newGender: "male" | "female") => {
    setGender(newGender);
    setGenderSavedToast(true);
    setTimeout(() => setGenderSavedToast(false), 2500);
    try {
      await fetch("/api/user/preferences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gender: newGender }),
      });
    } catch {}
  };

  const fetchUser = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/auth/me");
      const data = await res.json();
      if (data.authenticated) {
        setUser(data.user);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    setAuthSuccess("");

    if ((user?.isGuest || authMode === "register") && !agreedToTerms) {
      setAuthError("Please agree to the Terms of Service and Privacy Policy to proceed.");
      return;
    }

    setIsSubmitting(true);

    try {
      // If user is currently a guest, upgrading migrates all their items seamlessly!
      const endpoint = user?.isGuest
        ? "/api/auth/upgrade"
        : authMode === "register"
        ? "/api/auth/register"
        : "/api/auth/login";

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Authentication failed");
      }

      setAuthSuccess(
        user?.isGuest
          ? "Account upgraded! Your wardrobe and outfits are permanently saved."
          : authMode === "register"
          ? "Account created successfully!"
          : "Logged in successfully!"
      );
      await fetchUser();
      setEmail("");
      setPassword("");
    } catch (err: any) {
      setAuthError(err.message || "An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  };

  const handlePurgeAccount = async () => {
    setIsPurging(true);
    try {
      const res = await fetch("/api/auth/purge", { method: "DELETE" });
      if (res.ok) {
        alert("Your account and all uploaded wardrobe data have been permanently erased.");
        router.push("/");
        router.refresh();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to purge account.");
      }
    } catch (err) {
      alert("Error purging account.");
    } finally {
      setIsPurging(false);
      setShowPurgeModal(false);
    }
  };

  if (loading) {
    return (
      <div className="app-container" style={{ paddingTop: "60px", textAlign: "center" }}>
        <p style={{ color: "var(--text-muted)" }}>Loading account profile...</p>
      </div>
    );
  }

  return (
    <div className="app-container" style={{ paddingTop: "40px", maxWidth: "800px" }}>
      <h1 style={{ fontSize: "2rem", marginBottom: "8px" }}>Account & Privacy Settings</h1>
      <p style={{ color: "var(--text-secondary)", marginBottom: "32px" }}>
        Manage your profile, secure your wardrobe vault, and control your data.
      </p>

      {/* Profile Overview Card */}
      <div className="glass-panel" style={{ padding: "28px", marginBottom: "28px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
              <h2 style={{ fontSize: "1.4rem" }}>{user?.name || "Stylist User"}</h2>
              {user?.isGuest && (
                <span
                  className="chip"
                  style={{
                    background: "rgba(251, 191, 36, 0.15)",
                    color: "var(--accent-amber)",
                    borderColor: "rgba(251, 191, 36, 0.3)",
                  }}
                >
                  Temporary Guest
                </span>
              )}
            </div>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem" }}>
              {user?.email || "No email linked (Anonymous session)"}
            </p>
          </div>

          <button onClick={handleLogout} className="btn-secondary" style={{ padding: "8px 16px" }}>
            <LogOut size={16} />
            <span>Switch / Logout</span>
          </button>
        </div>

        {/* Stats */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: "16px",
            marginTop: "24px",
            paddingTop: "20px",
            borderTop: "1px solid var(--border-subtle)",
          }}
        >
          <div>
            <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", textTransform: "uppercase" }}>Garments Saved</span>
            <p style={{ fontSize: "1.6rem", fontWeight: 700, color: "var(--gold-primary)" }}>
              {user?._count?.clothingItems ?? 0}
            </p>
          </div>
          <div>
            <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", textTransform: "uppercase" }}>Outfits Generated</span>
            <p style={{ fontSize: "1.6rem", fontWeight: 700, color: "var(--accent-indigo)" }}>
              {user?._count?.outfits ?? 0}
            </p>
          </div>
        </div>
      </div>

      {/* Styling Perspective Card */}
      <div className="glass-panel" style={{ padding: "28px", marginBottom: "28px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
              <User size={20} color="var(--gold-primary)" />
              <h3 style={{ fontSize: "1.25rem" }}>Styling Perspective</h3>
            </div>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.92rem", maxWidth: "560px", lineHeight: 1.5 }}>
              Choose whether the AI stylist tailors outfit compositions, proportion rules, and color recommendations for Menswear (GQ tailored lines) or Womenswear (Vogue feminine drape).
            </p>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div
              style={{
                display: "flex",
                background: "rgba(0,0,0,0.4)",
                border: "1px solid var(--border-subtle)",
                borderRadius: "var(--radius-md)",
                padding: "4px",
                gap: "6px",
              }}
            >
              <button
                type="button"
                onClick={() => handleGenderToggle("male")}
                style={{
                  padding: "8px 18px",
                  borderRadius: "var(--radius-sm)",
                  border: "none",
                  background: gender === "male" ? "var(--gold-primary, #e5b95f)" : "transparent",
                  color: gender === "male" ? "#0a0c12" : "var(--text-secondary)",
                  fontWeight: gender === "male" ? 700 : 500,
                  fontSize: "0.88rem",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <span>♂ Menswear</span>
              </button>
              <button
                type="button"
                onClick={() => handleGenderToggle("female")}
                style={{
                  padding: "8px 18px",
                  borderRadius: "var(--radius-sm)",
                  border: "none",
                  background: gender === "female" ? "var(--gold-primary, #e5b95f)" : "transparent",
                  color: gender === "female" ? "#0a0c12" : "var(--text-secondary)",
                  fontWeight: gender === "female" ? 700 : 500,
                  fontSize: "0.88rem",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <span>♀ Womenswear</span>
              </button>
            </div>
          </div>
        </div>

        {genderSavedToast && (
          <div
            style={{
              marginTop: "16px",
              fontSize: "0.85rem",
              color: "var(--accent-emerald)",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <CheckCircle2 size={15} />
            <span>AI styling perspective preference updated and saved!</span>
          </div>
        )}
      </div>

      {/* Guest Account Upgrade or Login Card */}
      {user?.isGuest && (
        <div
          className="glass-panel"
          style={{
            padding: "28px",
            marginBottom: "28px",
            border: "1px solid var(--border-accent)",
            background: "linear-gradient(180deg, rgba(229, 185, 95, 0.08) 0%, rgba(18, 21, 30, 0.8) 100%)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
            <Sparkles size={20} color="var(--gold-primary)" />
            <h3 style={{ fontSize: "1.25rem" }}>Preserve Your Wardrobe</h3>
          </div>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem", marginBottom: "20px", lineHeight: 1.5 }}>
            You are currently exploring in <strong>Guest Mode</strong>. Link an email and password to securely save your items across all devices and prevent data loss.
          </p>

          <form onSubmit={handleAuthSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {authError && (
              <div
                style={{
                  padding: "10px 14px",
                  background: "rgba(251, 113, 133, 0.15)",
                  border: "1px solid rgba(251, 113, 133, 0.3)",
                  borderRadius: "var(--radius-sm)",
                  color: "var(--accent-rose)",
                  fontSize: "0.88rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <AlertCircle size={16} />
                <span>{authError}</span>
              </div>
            )}
            {authSuccess && (
              <div
                style={{
                  padding: "10px 14px",
                  background: "rgba(52, 211, 153, 0.15)",
                  border: "1px solid rgba(52, 211, 153, 0.3)",
                  borderRadius: "var(--radius-sm)",
                  color: "var(--accent-emerald)",
                  fontSize: "0.88rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <CheckCircle2 size={16} />
                <span>{authSuccess}</span>
              </div>
            )}

            <div>
              <label style={{ display: "block", fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "6px" }}>
                Your Name
              </label>
              <input
                type="text"
                placeholder="e.g. Alex Morgan"
                value={name}
                onChange={(e) => setName(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  background: "rgba(0, 0, 0, 0.3)",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: "var(--radius-sm)",
                  color: "var(--text-primary)",
                  outline: "none",
                }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "6px" }}>
                Email Address
              </label>
              <input
                type="email"
                required
                placeholder="you@domain.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  background: "rgba(0, 0, 0, 0.3)",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: "var(--radius-sm)",
                  color: "var(--text-primary)",
                  outline: "none",
                }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "6px" }}>
                Password (min. 8 characters)
              </label>
              <input
                type="password"
                required
                minLength={8}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  background: "rgba(0, 0, 0, 0.3)",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: "var(--radius-sm)",
                  color: "var(--text-primary)",
                  outline: "none",
                }}
              />
            </div>

            {(user?.isGuest || authMode === "register") && (
              <label
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "10px",
                  fontSize: "0.85rem",
                  color: "var(--text-secondary)",
                  cursor: "pointer",
                  marginTop: "6px",
                  lineHeight: 1.4,
                }}
              >
                <input
                  type="checkbox"
                  required
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                  style={{
                    marginTop: "2px",
                    accentColor: "var(--gold-primary)",
                    cursor: "pointer",
                  }}
                />
                <span>
                  I agree to the{" "}
                  <Link href="/terms" target="_blank" style={{ color: "var(--gold-primary)", textDecoration: "underline" }}>
                    Terms and Conditions
                  </Link>{" "}
                  and acknowledge the{" "}
                  <Link href="/privacy" target="_blank" style={{ color: "var(--gold-primary)", textDecoration: "underline" }}>
                    Privacy Policy
                  </Link>.
                </span>
              </label>
            )}

            <button type="submit" disabled={isSubmitting} className="btn-primary" style={{ marginTop: "8px" }}>
              {isSubmitting ? "Upgrading..." : "Save Wardrobe Permanently"}
            </button>
          </form>
        </div>
      )}

      {/* AI Vision & Styling Recognition */}
      <div
        className="glass-panel"
        style={{
          padding: "28px",
          marginBottom: "28px",
          border: "1px solid var(--border-subtle)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px", marginBottom: "12px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <Sparkles size={20} color="var(--gold-primary)" />
            <h3 style={{ fontSize: "1.2rem" }}>AI Vision & Tagging Engine</h3>
          </div>
          <span
            style={{
              fontSize: "0.78rem",
              fontWeight: 600,
              padding: "4px 10px",
              borderRadius: "var(--radius-full)",
              background: hasAiKey ? "rgba(16, 185, 129, 0.15)" : "rgba(229, 185, 95, 0.15)",
              color: hasAiKey ? "var(--accent-emerald)" : "var(--accent-gold)",
              border: `1px solid ${hasAiKey ? "rgba(16, 185, 129, 0.3)" : "rgba(229, 185, 95, 0.3)"}`,
            }}
          >
            {hasAiKey ? "Gemini Vision Active" : "Fast Built-in Vision Active"}
          </span>
        </div>
        <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", lineHeight: 1.5, marginBottom: "20px" }}>
          Closetmix isolates clothing backgrounds using edge-connected boundary sampling with 100% solid color retention. Connect your free Google Gemini API key to unlock multimodal style, fabric, and silhouette detection.
        </p>

        <button
          onClick={() => setIsAiKeyModalOpen(true)}
          className="btn-secondary"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            padding: "10px 18px",
            fontSize: "0.9rem",
            cursor: "pointer",
          }}
        >
          <Key size={16} />
          <span>{hasAiKey ? "Manage Gemini API Key" : "Connect Google Gemini API Key"}</span>
        </button>
      </div>

      {/* Privacy Vault & Complete Account Deletion */}
      <div
        className="glass-panel"
        style={{
          padding: "28px",
          border: "1px solid rgba(251, 113, 133, 0.25)",
          background: "rgba(251, 113, 133, 0.03)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
          <ShieldAlert size={20} color="var(--accent-rose)" />
          <h3 style={{ fontSize: "1.2rem", color: "var(--accent-rose)" }}>Privacy & Data Purge (GDPR)</h3>
        </div>
        <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", lineHeight: 1.5, marginBottom: "20px" }}>
          Under our zero-surveillance policy, all uploaded clothing photos, background-removed cutouts, outfits, and styling data belong solely to you. You can permanently wipe your account and all associated disk files at any time.
        </p>

        <button
          onClick={() => setShowPurgeModal(true)}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            padding: "10px 18px",
            background: "rgba(251, 113, 133, 0.15)",
            border: "1px solid rgba(251, 113, 133, 0.4)",
            borderRadius: "var(--radius-sm)",
            color: "var(--accent-rose)",
            fontSize: "0.9rem",
            fontWeight: 600,
          }}
        >
          <Trash2 size={16} />
          <span>Permanently Delete Account & Wardrobe</span>
        </button>
      </div>

      {/* Purge Confirmation Modal */}
      {showPurgeModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0, 0, 0, 0.85)",
            backdropFilter: "blur(8px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 100,
            padding: "20px",
          }}
        >
          <div className="glass-panel" style={{ maxWidth: "460px", padding: "30px", textAlign: "center" }}>
            <Trash2 size={40} color="var(--accent-rose)" style={{ marginBottom: "16px" }} />
            <h2 style={{ fontSize: "1.4rem", marginBottom: "12px" }}>Erase All Wardrobe Data?</h2>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem", lineHeight: 1.5, marginBottom: "24px" }}>
              This action is permanent and cannot be undone. All clothing cutouts, photos, and generated outfits will be immediately deleted from the database and storage disks.
            </p>
            <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
              <button onClick={() => setShowPurgeModal(false)} className="btn-secondary">
                Cancel
              </button>
              <button
                onClick={handlePurgeAccount}
                disabled={isPurging}
                style={{
                  padding: "10px 20px",
                  background: "var(--accent-rose)",
                  color: "#ffffff",
                  borderRadius: "var(--radius-md)",
                  fontWeight: 600,
                }}
              >
                {isPurging ? "Purging..." : "Confirm Purge"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI Key Modal */}
      <AiKeyModal
        isOpen={isAiKeyModalOpen}
        onClose={() => setIsAiKeyModalOpen(false)}
        onKeyUpdated={setHasAiKey}
      />
    </div>
  );
}
