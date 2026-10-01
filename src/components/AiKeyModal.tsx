"use client";

import React, { useState, useEffect } from "react";
import { Sparkles, Key, Check, AlertCircle, X, ExternalLink, Trash2 } from "lucide-react";

interface AiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onKeyUpdated?: (hasKey: boolean) => void;
}

export default function AiKeyModal({ isOpen, onClose, onKeyUpdated }: AiKeyModalProps) {
  const [apiKey, setApiKey] = useState("");
  const [hasKey, setHasKey] = useState(false);
  const [keyPreview, setKeyPreview] = useState<string | undefined>();
  const [source, setSource] = useState<string>("none");
  const [isLoading, setIsLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadKeyStatus();
    }
  }, [isOpen]);

  const loadKeyStatus = async () => {
    try {
      const res = await fetch("/api/user/ai-key");
      const data = await res.json();
      if (data.success) {
        setHasKey(data.hasKey);
        setKeyPreview(data.keyPreview);
        setSource(data.source);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSaveKey = async () => {
    if (!apiKey.trim()) {
      setStatusMsg({ type: "error", text: "Please paste your Google Gemini API key." });
      return;
    }

    setIsLoading(true);
    setStatusMsg(null);

    try {
      const res = await fetch("/api/user/ai-key", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey: apiKey.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to verify API key");
      }

      setHasKey(true);
      setKeyPreview(data.keyPreview);
      setApiKey("");
      setStatusMsg({ type: "success", text: "Key verified & connected! Gemini Vision is now active." });
      if (onKeyUpdated) onKeyUpdated(true);
    } catch (err: any) {
      setStatusMsg({ type: "error", text: err.message || "Failed to verify key" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearKey = async () => {
    setIsLoading(true);
    setStatusMsg(null);
    try {
      const res = await fetch("/api/user/ai-key", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey: "" }),
      });
      const data = await res.json();
      setHasKey(false);
      setKeyPreview(undefined);
      setStatusMsg({ type: "success", text: data.message || "Key cleared. Using built-in computer vision." });
      if (onKeyUpdated) onKeyUpdated(false);
    } catch (err: any) {
      setStatusMsg({ type: "error", text: err.message });
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(5, 7, 12, 0.85)",
        backdropFilter: "blur(12px)",
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
      }}
      onClick={onClose}
    >
      <div
        className="glass-panel"
        style={{
          width: "100%",
          maxWidth: "540px",
          padding: "30px",
          position: "relative",
          boxShadow: "0 25px 60px rgba(0,0,0,0.7)",
          border: "1px solid var(--border-card)",
          animation: "modalFadeIn 0.25s ease-out",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            top: "20px",
            right: "20px",
            background: "none",
            border: "none",
            color: "var(--text-muted)",
            cursor: "pointer",
          }}
        >
          <X size={20} />
        </button>

        {/* Modal Header */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
          <div
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "10px",
              background: "rgba(217, 119, 6, 0.15)",
              border: "1px solid rgba(217, 119, 6, 0.3)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--accent-gold)",
            }}
          >
            <Sparkles size={22} />
          </div>
          <div>
            <h3 style={{ fontSize: "1.25rem", fontWeight: 700, margin: 0 }}>AI Vision & Styling Engine</h3>
            <p style={{ fontSize: "0.82rem", color: "var(--text-muted)", margin: 0 }}>
              Powered by OpenRouter (Gemini 2.5 Flash / Claude / GPT-4o) or direct Google Gemini
            </p>
          </div>
        </div>

        {/* Current Status Box */}
        <div
          style={{
            marginTop: "20px",
            padding: "16px",
            borderRadius: "var(--radius-sm)",
            background: hasKey ? "rgba(16, 185, 129, 0.08)" : "rgba(30, 36, 52, 0.6)",
            border: `1px solid ${hasKey ? "rgba(16, 185, 129, 0.25)" : "var(--border-subtle)"}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div
              style={{
                width: "10px",
                height: "10px",
                borderRadius: "50%",
                background: hasKey ? "var(--accent-emerald)" : "var(--accent-gold)",
                boxShadow: hasKey ? "0 0 10px var(--accent-emerald)" : "none",
              }}
            />
            <div>
              <div style={{ fontSize: "0.9rem", fontWeight: 600 }}>
                {hasKey ? "Multimodal AI Vision Active" : "Built-in Fast Computer Vision Active"}
              </div>
              <div style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
                {hasKey
                  ? `Active Key: ${keyPreview || "••••••••••••"} (${source === "env" ? "Server Env" : "Account Settings"})`
                  : "Using foreground color & silhouette aspect ratio analysis (no key required)"}
              </div>
            </div>
          </div>

          {hasKey && source === "user" && (
            <button
              onClick={handleClearKey}
              disabled={isLoading}
              style={{
                background: "rgba(239, 68, 68, 0.12)",
                border: "1px solid rgba(239, 68, 68, 0.3)",
                color: "var(--accent-rose)",
                padding: "6px 12px",
                borderRadius: "var(--radius-sm)",
                fontSize: "0.78rem",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "4px",
              }}
            >
              <Trash2 size={13} />
              <span>Remove</span>
            </button>
          )}
        </div>

        {/* Input Form */}
        <div style={{ marginTop: "24px" }}>
          <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "8px" }}>
            Connect OpenRouter or Google Gemini API Key
          </label>
          <div style={{ display: "flex", gap: "10px" }}>
            <div style={{ position: "relative", flex: 1 }}>
              <input
                type="password"
                placeholder="sk-or-v1-... or AIzaSy..."
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px 14px 10px 38px",
                  background: "rgba(10, 12, 18, 0.6)",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: "var(--radius-sm)",
                  color: "var(--text-primary)",
                  fontSize: "0.9rem",
                  fontFamily: "monospace",
                }}
              />
              <Key
                size={16}
                style={{
                  position: "absolute",
                  left: "12px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "var(--text-muted)",
                }}
              />
            </div>
            <button
              className="btn btn-primary"
              onClick={handleSaveKey}
              disabled={isLoading || !apiKey.trim()}
              style={{ minWidth: "100px", padding: "10px 16px", fontSize: "0.88rem" }}
            >
              {isLoading ? "Verifying..." : "Connect"}
            </button>
          </div>

          {/* Feedback message */}
          {statusMsg && (
            <div
              style={{
                marginTop: "12px",
                padding: "10px 14px",
                borderRadius: "var(--radius-sm)",
                background: statusMsg.type === "success" ? "rgba(16, 185, 129, 0.1)" : "rgba(239, 68, 68, 0.1)",
                border: `1px solid ${statusMsg.type === "success" ? "rgba(16, 185, 129, 0.3)" : "rgba(239, 68, 68, 0.3)"}`,
                color: statusMsg.type === "success" ? "var(--accent-emerald)" : "var(--accent-rose)",
                fontSize: "0.82rem",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              {statusMsg.type === "success" ? <Check size={16} /> : <AlertCircle size={16} />}
              <span>{statusMsg.text}</span>
            </div>
          )}

          <div
            style={{
              marginTop: "20px",
              padding: "14px",
              background: "rgba(15, 23, 42, 0.5)",
              borderRadius: "var(--radius-sm)",
              border: "1px solid var(--border-subtle)",
              fontSize: "0.8rem",
              color: "var(--text-muted)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" }}>
              <span style={{ fontWeight: 600, color: "var(--text-secondary)" }}>Don't have a Gemini API key?</span>
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noreferrer"
                style={{
                  color: "var(--accent-gold)",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  textDecoration: "none",
                  fontWeight: 600,
                }}
              >
                <span>Get Free Key</span>
                <ExternalLink size={12} />
              </a>
            </div>
            <p style={{ margin: 0, lineHeight: 1.4 }}>
              Google provides free Gemini API access through Google AI Studio. Keys are stored encrypted in your private session and only used to analyze your clothing images.
            </p>
          </div>
        </div>

        {/* Modal Footer */}
        <div style={{ marginTop: "24px", display: "flex", justifyContent: "flex-end" }}>
          <button className="btn btn-secondary" onClick={onClose} style={{ padding: "8px 20px" }}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
