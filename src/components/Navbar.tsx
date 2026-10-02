"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Sparkles,
  Shirt,
  Calendar,
  BarChart2,
  Plus,
  User,
  ShieldCheck,
  Sun,
  Moon,
} from "lucide-react";

interface UserState {
  id: string;
  name?: string;
  email?: string;
  isGuest: boolean;
}

export default function Navbar() {
  const pathname = usePathname();
  const [user, setUser] = useState<UserState | null>(null);
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.authenticated && data.user) {
          setUser(data.user);
        } else {
          fetch("/api/auth/guest", { method: "POST" })
            .then((r) => r.json())
            .then((gData) => {
              if (gData.success) setUser(gData.user);
            })
            .catch(console.error);
        }
      })
      .catch(console.error);

    // Initial theme check
    const currentTheme = document.documentElement.getAttribute("data-theme") as "dark" | "light" || "dark";
    setTheme(currentTheme);
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    document.documentElement.setAttribute("data-theme", nextTheme);
  };

  const navLinks = [
    { label: "Wardrobe", href: "/wardrobe", icon: Shirt },
    { label: "Outfit Studio", href: "/outfits", icon: Sparkles },
    { label: "Planner", href: "/planner", icon: Calendar },
    { label: "Insights", href: "/insights", icon: BarChart2 },
  ];

  return (
    <>
      <header
        role="banner"
        style={{
          position: "sticky",
          top: 0,
          zIndex: 50,
          background: "rgba(8, 9, 13, 0.8)",
          backdropFilter: "blur(18px)",
          WebkitBackdropFilter: "blur(18px)",
          borderBottom: "1px solid var(--border-subtle)",
          padding: "14px 0",
        }}
      >
        <div
          className="app-container"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "20px",
          }}
        >
          {/* Brand Logo */}
          <Link
            href="/"
            aria-label="Closetmix AI Atelier Homepage"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              textDecoration: "none",
            }}
          >
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "10px",
                background: "linear-gradient(135deg, var(--gold-primary), #a67c1e)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#08090d",
                boxShadow: "0 0 16px var(--gold-glow)",
              }}
            >
              <Sparkles size={20} />
            </div>
            <div>
              <span
                style={{
                  fontFamily: "var(--font-serif)",
                  fontSize: "1.45rem",
                  fontWeight: 700,
                  letterSpacing: "0.04em",
                  color: "var(--text-primary)",
                }}
              >
                CLOSETMIX
              </span>
              <span
                style={{
                  display: "block",
                  fontSize: "0.65rem",
                  letterSpacing: "0.15em",
                  textTransform: "uppercase",
                  color: "var(--gold-primary)",
                  fontWeight: 600,
                  marginTop: "-2px",
                }}
              >
                AI Atelier
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav
            role="navigation"
            aria-label="Main Navigation"
            className="desktop-nav-links"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              background: "rgba(255, 255, 255, 0.03)",
              padding: "4px 6px",
              borderRadius: "var(--radius-full)",
              border: "1px solid var(--border-subtle)",
            }}
          >
            {navLinks.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={isActive ? "page" : undefined}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "8px 16px",
                    borderRadius: "var(--radius-full)",
                    fontSize: "0.88rem",
                    fontWeight: isActive ? 600 : 500,
                    color: isActive ? "var(--gold-primary)" : "var(--text-secondary)",
                    background: isActive ? "rgba(229, 185, 95, 0.12)" : "transparent",
                    border: isActive ? "1px solid var(--border-accent)" : "1px solid transparent",
                    transition: "all var(--transition-fast)",
                  }}
                >
                  <Icon size={16} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Actions & Utilities */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "50%",
                background: "rgba(255, 255, 255, 0.05)",
                border: "1px solid var(--border-subtle)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--gold-primary)",
                cursor: "pointer",
              }}
            >
              {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
            </button>

            <Link
              href="/wardrobe/upload"
              className="btn-primary"
              style={{ padding: "8px 16px", fontSize: "0.85rem" }}
            >
              <Plus size={16} />
              <span>Add Garment</span>
            </Link>

            {user && (
              <Link
                href="/settings"
                aria-label="User Account Settings"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "6px 12px",
                  borderRadius: "var(--radius-full)",
                  background: "rgba(255, 255, 255, 0.05)",
                  border: "1px solid var(--border-subtle)",
                  fontSize: "0.8rem",
                  color: "var(--text-secondary)",
                }}
              >
                {user.isGuest ? (
                  <>
                    <span
                      style={{
                        width: "8px",
                        height: "8px",
                        borderRadius: "50%",
                        backgroundColor: "var(--accent-amber)",
                      }}
                    />
                    <span>Guest</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck size={14} color="var(--accent-emerald)" />
                    <span>{user.name || user.email?.split("@")[0]}</span>
                  </>
                )}
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation Dock */}
      <nav role="navigation" aria-label="Mobile Bottom Navigation" className="mobile-nav-dock">
        {navLinks.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`mobile-nav-item ${isActive ? "active" : ""}`}
              aria-current={isActive ? "page" : undefined}
            >
              <Icon size={18} />
              <span>{item.label}</span>
            </Link>
          );
        })}
        <Link
          href="/wardrobe/upload"
          className="mobile-nav-item"
          aria-label="Upload Clothes"
        >
          <Plus size={18} color="var(--gold-primary)" />
          <span>Upload</span>
        </Link>
      </nav>
    </>
  );
}
