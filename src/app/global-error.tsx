"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="fr">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "1rem",
          padding: "1rem",
          fontFamily: "system-ui, sans-serif",
          background: "#fbfaed",
          color: "#231f20",
        }}
      >
        <h1 style={{ fontSize: "1.5rem", margin: 0 }}>Erreur JAMILA</h1>
        <p style={{ margin: 0, opacity: 0.7, textAlign: "center" }}>
          {error.message}
        </p>
        <button
          type="button"
          onClick={() => reset()}
          style={{
            padding: "0.75rem 1.5rem",
            borderRadius: "0.75rem",
            border: "none",
            background: "#d6cb72",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Réessayer
        </button>
      </body>
    </html>
  );
}
