"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const supabase = createClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        setError(signInError.message);
        return;
      }

      router.push("/upload");
    } catch {
      setError("Unable to connect to authentication service.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1
        style={{
          fontSize: 18,
          fontWeight: 600,
          color: "var(--text-primary)",
          marginBottom: 4,
        }}
      >
        Sign in to Monterosa
      </h1>
      <p
        style={{
          fontSize: 13,
          color: "var(--text-secondary)",
          marginBottom: 24,
        }}
      >
        Enter your credentials to continue
      </p>

      {error && (
        <div
          style={{
            padding: "8px 12px",
            marginBottom: 16,
            borderRadius: 4,
            background: "rgba(239,68,68,0.1)",
            border: "1px solid rgba(239,68,68,0.2)",
            color: "#ef4444",
            fontSize: 13,
          }}
        >
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <label
          style={{
            display: "block",
            fontSize: 13,
            color: "var(--text-secondary)",
            marginBottom: 6,
          }}
        >
          Email
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={{
            width: "100%",
            padding: "8px 12px",
            marginBottom: 16,
            borderRadius: 4,
            border: "1px solid var(--border)",
            background: "var(--surface-raised)",
            color: "var(--text-primary)",
            outline: "none",
          }}
        />

        <label
          style={{
            display: "block",
            fontSize: 13,
            color: "var(--text-secondary)",
            marginBottom: 6,
          }}
        >
          Password
        </label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          style={{
            width: "100%",
            padding: "8px 12px",
            marginBottom: 24,
            borderRadius: 4,
            border: "1px solid var(--border)",
            background: "var(--surface-raised)",
            color: "var(--text-primary)",
            outline: "none",
          }}
        />

        <button
          type="submit"
          disabled={loading}
          style={{
            width: "100%",
            padding: "8px 12px",
            borderRadius: 4,
            border: "none",
            background: "var(--accent)",
            color: "#0a0a0a",
            fontWeight: 600,
            fontSize: 14,
            cursor: loading ? "not-allowed" : "pointer",
            opacity: loading ? 0.6 : 1,
          }}
        >
          {loading ? "Signing in..." : "Sign in"}
        </button>
      </form>

      <p
        style={{
          marginTop: 16,
          fontSize: 13,
          color: "var(--text-secondary)",
          textAlign: "center",
        }}
      >
        No account?{" "}
        <Link
          href="/register"
          style={{ color: "var(--accent)", fontWeight: 500 }}
        >
          Create one
        </Link>
      </p>
    </div>
  );
}
