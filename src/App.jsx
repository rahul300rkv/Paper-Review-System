import { useState } from "react";
import PaperReviewSystem from "./PaperReviewSystem.jsx";

export default function App() {
  const [apiKey, setApiKey] = useState(() => localStorage.getItem("groq_key") || "");
  const [inputKey, setInputKey] = useState("");
  const [keyError, setKeyError] = useState("");

  const handleSave = () => {
    const k = inputKey.trim();
    if (!k.startsWith("gsk_")) {
      setKeyError("Key should start with gsk_...");
      return;
    }
    localStorage.setItem("groq_key", k);
    setApiKey(k);
  };

  const handleClear = () => {
    localStorage.removeItem("groq_key");
    setApiKey("");
    setInputKey("");
  };

  if (!apiKey) {
    return (
      <div style={{
        minHeight: "100vh",
        background: "var(--color-background-tertiary)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        fontFamily: "'EB Garamond', Georgia, serif"
      }}>
        <style>{`@import url('https://fonts.googleapis.com/css2?family=EB+Garamond:ital,wght@0,400;0,500;1,400&family=DM+Sans:wght@300;400;500&display=swap');`}</style>
        <div style={{
          background: "var(--color-background-primary)",
          border: "0.5px solid var(--color-border-secondary)",
          borderRadius: 16,
          padding: "48px 40px",
          maxWidth: 440,
          width: "100%",
          textAlign: "center"
        }}>
          <div style={{ fontSize: 32, marginBottom: 4, fontStyle: "italic", fontWeight: 500, letterSpacing: "-0.02em" }}>
            Scholaris
          </div>
          <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: "var(--color-text-secondary)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 32 }}>
            Pre-Submission Review
          </div>

          <p style={{ fontSize: 15, color: "var(--color-text-secondary)", lineHeight: 1.7, marginBottom: 32, fontStyle: "italic" }}>
            Enter your Groq API key to start analyzing research papers.
          </p>

          <div style={{ textAlign: "left", marginBottom: 16 }}>
            <label style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--color-text-secondary)", display: "block", marginBottom: 8 }}>
              Groq API Key
            </label>
            <input
              type="password"
              value={inputKey}
              onChange={e => { setInputKey(e.target.value); setKeyError(""); }}
              onKeyDown={e => e.key === "Enter" && handleSave()}
              placeholder="gsk_..."
              style={{
                width: "100%",
                padding: "11px 14px",
                border: "0.5px solid var(--color-border-secondary)",
                borderRadius: 8,
                background: "var(--color-background-primary)",
                color: "var(--color-text-primary)",
                fontSize: 14,
                fontFamily: "'DM Sans', sans-serif",
                outline: "none"
              }}
            />
            {keyError && (
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: "#b53a3a", marginTop: 6 }}>{keyError}</p>
            )}
          </div>

          <button
            onClick={handleSave}
            style={{
              width: "100%",
              background: "#1a1a1a",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              padding: "12px",
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 14,
              fontWeight: 500,
              cursor: "pointer",
              letterSpacing: "0.02em",
              marginBottom: 16
            }}
          >
            Continue →
          </button>

          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: "var(--color-text-secondary)", lineHeight: 1.6 }}>
            Your key is stored locally in your browser and never sent anywhere except directly to Groq's API.{" "}
            <a href="https://console.groq.com/keys" target="_blank" rel="noreferrer" style={{ color: "inherit", textDecoration: "underline" }}>
              Get a key →
            </a>
          </p>
        </div>
      </div>
    );
  }

  return <PaperReviewSystem apiKey={apiKey} onClearKey={handleClear} />;
}