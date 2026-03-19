"use client";

import { Sidebar } from "@/components/sidebar";
import { CompanyProvider } from "@/lib/company-context";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <CompanyProvider>
      <div style={{ display: "flex", minHeight: "100vh" }}>
        <Sidebar />
        <main
          style={{
            marginLeft: 220,
            flex: 1,
            padding: 32,
            minHeight: "100vh",
          }}
        >
          {children}
        </main>
      </div>
    </CompanyProvider>
  );
}
