export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--background)",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 400,
          border: "1px solid var(--border)",
          borderRadius: 8,
          padding: 32,
          background: "var(--surface)",
        }}
      >
        {children}
      </div>
    </div>
  );
}
