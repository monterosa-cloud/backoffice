"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const navItems = [
  { href: "/upload", label: "Upload", icon: "↑" },
  { href: "/map", label: "Map", icon: "◉" },
  { href: "/companies", label: "Companies", icon: "≡" },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <aside
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: 220,
        height: "100vh",
        background: "#0d0d0d",
        borderRight: "1px solid var(--border)",
        display: "flex",
        flexDirection: "column",
        zIndex: 50,
      }}
    >
      {/* Brand */}
      <div style={{ padding: "20px 16px 24px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 18, color: "var(--accent)" }}>◆</span>
          <div>
            <div
              style={{
                fontSize: 15,
                fontWeight: 600,
                color: "var(--text-primary)",
                lineHeight: 1.2,
              }}
            >
              Monterosa
            </div>
            <div
              style={{
                fontSize: 11,
                color: "var(--text-muted)",
                letterSpacing: "0.05em",
              }}
            >
              Ventures
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, padding: "0 8px" }}>
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "8px 12px",
                marginBottom: 2,
                borderRadius: 4,
                fontSize: 13,
                color: isActive ? "#d4a843" : "var(--text-secondary)",
                background: isActive ? "rgba(212,168,67,0.12)" : "transparent",
                borderLeft: isActive ? "2px solid #d4a843" : "2px solid transparent",
                transition: "background 0.15s",
              }}
            >
              <span style={{ fontSize: 14, width: 18, textAlign: "center" }}>
                {item.icon}
              </span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* User */}
      <div
        style={{
          padding: "16px",
          borderTop: "1px solid var(--border)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginBottom: 8,
          }}
        >
          <span
            style={{
              width: 28,
              height: 28,
              borderRadius: "50%",
              background: "var(--surface-raised)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 13,
              color: "var(--text-secondary)",
            }}
          >
            ●
          </span>
          <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>
            User
          </span>
        </div>
        <button
          onClick={handleSignOut}
          style={{
            width: "100%",
            padding: "6px 0",
            border: "none",
            background: "transparent",
            color: "var(--text-muted)",
            fontSize: 12,
            cursor: "pointer",
            textAlign: "left",
          }}
        >
          Sign out
        </button>
      </div>
    </aside>
  );
}
