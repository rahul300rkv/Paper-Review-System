import { useState, useRef, useCallback } from "react";

const SECTIONS = [
  { key: "abstract", label: "Abstract & Title", icon: "◈" },
  { key: "introduction", label: "Introduction", icon: "◎" },
  { key: "methodology", label: "Methodology", icon: "⬡" },
  { key: "results", label: "Results & Analysis", icon: "◇" },
  { key: "conclusion", label: "Conclusion", icon: "◉" },
  { key: "references", label: "References", icon: "⊡" },
];

const REVIEW_DIMENSIONS = [
  { key: "clarity", label: "Clarity", color: "#4F7FBF" },
  { key: "novelty", label: "Novelty", color: "#7B5CB8" },
  { key: "methodology", label: "Methodology", color: "#2E9E75" },
  { key: "completeness", label: "Completeness", color: "#D4753A" },
  { key: "citations", label: "Citations", color: "#B85C7B" },
];

const ScoreBar = ({ score, color }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
    <div style={{ flex: 1, height: 6, background: "#e8e8e4", borderRadius: 3, overflow: "hidden" }}>
      <div style={{ width: `${score}%`, height: "100%", background: color, borderRadius: 3, transition: "width 1s ease" }} />
    </div>
    <span style={{ fontSize: 13, fontWeight: 600, color, minWidth: 32, textAlign: "right" }}>
      {score}/100
    </span>
  </div>
);

const SeverityBadge = ({ level }) => {
  const map = {
    critical: { bg: "#fceaea", color: "#b53a3a", label: "Critical" },
    major: { bg: "#fef3e2", color: "#b86010", label: "Major" },
    minor: { bg: "#edf6ff", color: "#2d6fa8", label: "Minor" },
    positive: { bg: "#eaf5ee", color: "#2a7d4f", label: "Strength" },
  };
  const s = map[level] || map.minor;
  return (
    <span style={{
      fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 4,
      background: s.bg, color: s.color, letterSpacing: "0.04em", textTransform: "uppercase"
    }}>{s.label}</span>
  );
};

function extractJSON(text) {
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fence) return JSON.parse(fence[1].trim());
  const brace = text.match(/\{[\s\S]*\}/);
  if (brace) return JSON.parse(brace[0]);
  throw new Error("No JSON found");
}

export default function PaperReviewSystem({ apiKey, onClearKey }) {
  const [tab, setTab] = useState("upload");
  const [paperText, setPaperText] = useState("");
  const [paperTitle, setPaperTitle] = useState("");
  const [field, setField] = useState("Computer Science");
  const [venue, setVenue] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressLabel, setProgressLabel] = useState("");
  const [review, setReview] = useState(null);
  const [error, setError] = useState("");
  const [activeSection, setActiveSection] = useState(null);
  const [chatInput, setChatInput] = useState("");
  const [chatHistory, setChatHistory] = useState([]);
  const [chatLoading, setChatLoading] = useState(false);
  const fileRef = useRef();
  const chatEndRef = useRef();

  const handleFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.type === "application/pdf") {
      setPaperText("[PDF: " + file.name + "]\n\nFor best results, paste the paper text directly.");
      setPaperTitle(file.name.replace(".pdf", ""));
    } else {
      const text = await file.text();
      setPaperText(text);
      if (!paperTitle) setPaperTitle(file.name.replace(/\.[^.]+$/, ""));
    }
  };

  const analyzePhases = [
    { label: "Parsing paper structure...", pct: 15 },
    { label: "Analyzing abstract & introduction...", pct: 30 },
    { label: "Evaluating methodology & rigor...", pct: 50 },
    { label: "Checking results & claims...", pct: 65 },
    { label: "Retrieving relevant literature standards...", pct: 80 },
    { label: "Synthesizing reviewer feedback...", pct: 92 },
    { label: "Generating report...", pct: 100 },
  ];

  const runAnalysis = useCallback(async () => {
    if (!paperText.trim()) {
      setError("Please provide your paper text or upload a file.");
      return;
    }
    setError("");
    setIsAnalyzing(true);
    setProgress(0);
    setReview(null);

    let currentPct = 0;
    const phaseInterval = setInterval(() => {
      const next = analyzePhases.find(ph => ph.pct > currentPct);
      if (next) {
        currentPct = next.pct;
        setProgress(next.pct);
        setProgressLabel(next.label);
      }
    }, 700);

    const systemPrompt = `You are an expert academic peer reviewer with deep knowledge across research domains. You perform rigorous, constructive pre-submission paper reviews. Always respond with valid JSON only — no prose before or after.`;

    const userPrompt = `Review this research paper for pre-submission quality assessment.

Paper title: ${paperTitle || "Untitled"}
Research field: ${field}
Target venue: ${venue || "General academic journal"}

Paper content:
---
${paperText.substring(0, 8000)}
---

Return a detailed review as JSON with this EXACT structure:
{
  "overall_score": <0-100 integer>,
  "recommendation": "<Accept | Minor Revision | Major Revision | Reject>",
  "summary": "<2-3 sentence executive summary of the paper and its main contribution>",
  "scores": {
    "clarity": <0-100>,
    "novelty": <0-100>,
    "methodology": <0-100>,
    "completeness": <0-100>,
    "citations": <0-100>
  },
  "sections": {
    "abstract": {
      "score": <0-100>,
      "issues": [
        {"severity": "<critical|major|minor|positive>", "issue": "<title>", "detail": "<explanation>", "suggestion": "<how to fix>"}
      ]
    },
    "introduction": { "score": <0-100>, "issues": [...] },
    "methodology": { "score": <0-100>, "issues": [...] },
    "results": { "score": <0-100>, "issues": [...] },
    "conclusion": { "score": <0-100>, "issues": [...] },
    "references": { "score": <0-100>, "issues": [...] }
  },
  "strengths": ["<strength 1>", "<strength 2>", "<strength 3>"],
  "critical_gaps": ["<gap 1>", "<gap 2>"],
  "checklist": {
    "research_question_clear": <true|false>,
    "hypothesis_stated": <true|false>,
    "methodology_reproducible": <true|false>,
    "statistical_analysis_sound": <true|false>,
    "limitations_discussed": <true|false>,
    "related_work_adequate": <true|false>,
    "contribution_clear": <true|false>,
    "ethical_considerations": <true|false>
  },
  "revision_priority": [
    {"priority": 1, "action": "<most urgent action>", "rationale": "<why>"},
    {"priority": 2, "action": "<second action>", "rationale": "<why>"},
    {"priority": 3, "action": "<third action>", "rationale": "<why>"}
  ]
}`;

    try {
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "llama-3.1-8b-instant",
          max_tokens: 4000,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt }
          ]
        })
      });
      clearInterval(phaseInterval);
      setProgress(100);
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error?.message || `API error ${res.status}`);
      }
      const data = await res.json();
      const raw = data.choices[0].message.content;
      const parsed = extractJSON(raw);
      setReview(parsed);
      setTab("overview");
      setChatHistory([{
        role: "assistant",
        text: `Review complete for "${paperTitle || 'your paper'}". Overall score: ${parsed.overall_score}/100 — ${parsed.recommendation}. Ask me anything about the feedback or how to improve specific sections.`
      }]);
    } catch (e) {
      clearInterval(phaseInterval);
      setError("Analysis failed: " + e.message);
    } finally {
      setIsAnalyzing(false);
    }
  }, [paperText, paperTitle, field, venue, apiKey]);

  const sendChat = async () => {
    if (!chatInput.trim() || chatLoading) return;
    const userMsg = chatInput.trim();
    setChatInput("");
    setChatHistory(h => [...h, { role: "user", text: userMsg }]);
    setChatLoading(true);

    const context = `You reviewed this paper: "${paperTitle}". Review result: ${JSON.stringify(review)}. Answer the author's question concisely and helpfully.`;
    try {
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "mixtral-8x7b-32768",
          max_tokens: 600,
          messages: [
            { role: "system", content: context },
            ...chatHistory.map(m => ({ role: m.role === "user" ? "user" : "assistant", content: m.text })),
            { role: "user", content: userMsg }
          ]
        })
      });
      const data = await res.json();
      const reply = data.choices[0].message.content;
      setChatHistory(h => [...h, { role: "assistant", text: reply }]);
    } catch {
      setChatHistory(h => [...h, { role: "assistant", text: "Sorry, I couldn't process that. Please try again." }]);
    } finally {
      setChatLoading(false);
      setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    }
  };

  const recColor = {
    "Accept": "#2a7d4f",
    "Minor Revision": "#2d6fa8",
    "Major Revision": "#b86010",
    "Reject": "#b53a3a"
  };

  const tabs = review
    ? [
        { key: "upload", label: "Paper" },
        { key: "overview", label: "Overview" },
        { key: "sections", label: "Sections" },
        { key: "checklist", label: "Checklist" },
        { key: "chat", label: "Ask Reviewer" },
      ]
    : [{ key: "upload", label: "Paper" }];

  return (
    <div style={{ fontFamily: "'EB Garamond', Georgia, serif", background: "var(--color-background-tertiary)", minHeight: "100vh" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=EB+Garamond:ital,wght@0,400;0,500;0,600;1,400&family=DM+Sans:wght@300;400;500&display=swap');
        .dm { font-family: 'DM Sans', sans-serif; }
        textarea, input, select { font-family: 'DM Sans', sans-serif; }
        .tab-btn { background: none; border: none; cursor: pointer; padding: 10px 18px; font-family: 'DM Sans', sans-serif; font-size: 13px; color: var(--color-text-secondary); border-bottom: 2px solid transparent; transition: all 0.2s; letter-spacing: 0.02em; }
        .tab-btn:hover { color: var(--color-text-primary); }
        .tab-btn.active { color: var(--color-text-primary); border-bottom-color: #3a3a3a; font-weight: 500; }
        .issue-card { padding: 14px 16px; border-radius: 8px; border: 0.5px solid var(--color-border-tertiary); background: var(--color-background-primary); margin-bottom: 10px; }
        .issue-card:hover { border-color: var(--color-border-secondary); }
        .section-btn { background: none; border: 0.5px solid var(--color-border-tertiary); border-radius: 8px; padding: 12px 14px; cursor: pointer; text-align: left; width: 100%; transition: all 0.15s; color: var(--color-text-primary); }
        .section-btn:hover, .section-btn.active { border-color: var(--color-border-primary); background: var(--color-background-secondary); }
        .chat-bubble { padding: 10px 14px; border-radius: 10px; max-width: 85%; font-family: 'DM Sans', sans-serif; font-size: 13.5px; line-height: 1.6; }
        .send-btn { background: var(--color-text-primary); color: var(--color-background-primary); border: none; border-radius: 8px; padding: 8px 18px; cursor: pointer; font-family: 'DM Sans', sans-serif; font-size: 13px; font-weight: 500; transition: opacity 0.2s; }
        .send-btn:hover { opacity: 0.8; }
        .send-btn:disabled { opacity: 0.35; cursor: not-allowed; }
        .checklist-row { display: flex; align-items: center; gap: 12px; padding: 10px 0; border-bottom: 0.5px solid var(--color-border-tertiary); font-family: 'DM Sans', sans-serif; font-size: 13.5px; color: var(--color-text-primary); }
        .analyze-btn { background: #1a1a1a; color: #fff; border: none; border-radius: 8px; padding: 13px 32px; font-family: 'DM Sans', sans-serif; font-size: 14px; font-weight: 500; cursor: pointer; letter-spacing: 0.02em; transition: background 0.2s; }
        .analyze-btn:hover { background: #333; }
        .analyze-btn:disabled { background: #aaa; cursor: not-allowed; }
        .quick-q { background: none; border: 0.5px solid var(--color-border-secondary); border-radius: 16px; padding: 5px 12px; cursor: pointer; font-size: 12px; color: var(--color-text-secondary); font-family: 'DM Sans', sans-serif; transition: all 0.15s; }
        .quick-q:hover { border-color: var(--color-border-primary); color: var(--color-text-primary); }
      `}</style>

      {/* Header */}
      <div style={{
        background: "var(--color-background-primary)",
        borderBottom: "0.5px solid var(--color-border-tertiary)",
        padding: "18px 32px",
        display: "flex", alignItems: "center", justifyContent: "space-between"
      }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
          <span style={{ fontSize: 22, fontStyle: "italic", fontWeight: 500, letterSpacing: "-0.02em" }}>Scholaris</span>
          <span className="dm" style={{ fontSize: 11, color: "var(--color-text-secondary)", letterSpacing: "0.12em", textTransform: "uppercase" }}>
            Pre-Submission Review
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          {review && (
            <div style={{
              background: (recColor[review.recommendation] || "#888") + "18",
              border: `1px solid ${(recColor[review.recommendation] || "#888")}35`,
              borderRadius: 20, padding: "5px 14px",
              display: "flex", alignItems: "center", gap: 8
            }}>
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: recColor[review.recommendation], display: "inline-block" }} />
              <span className="dm" style={{ fontSize: 12, fontWeight: 600, color: recColor[review.recommendation], letterSpacing: "0.04em" }}>
                {review.recommendation}
              </span>
            </div>
          )}
          <button className="dm" onClick={onClearKey} style={{
            background: "none", border: "none", cursor: "pointer", fontSize: 12,
            color: "var(--color-text-secondary)", padding: "4px 8px"
          }}>
            Change key
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{
        background: "var(--color-background-primary)",
        borderBottom: "0.5px solid var(--color-border-tertiary)",
        padding: "0 28px", display: "flex", gap: 2
      }}>
        {tabs.map(t => (
          <button key={t.key} className={`tab-btn ${tab === t.key ? "active" : ""}`} onClick={() => setTab(t.key)}>
            {t.label}
          </button>
        ))}
      </div>

      <div style={{ maxWidth: 920, margin: "0 auto", padding: "32px 24px" }}>

        {/* ── UPLOAD TAB ── */}
        {tab === "upload" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            <div style={{ gridColumn: "1 / -1" }}>
              <p style={{ fontSize: 15, color: "var(--color-text-secondary)", marginBottom: 24, fontStyle: "italic", lineHeight: 1.7 }}>
                Receive expert peer-review quality feedback on your research paper before submission — identify critical gaps, improve clarity, and strengthen your methodology.
              </p>
            </div>

            <div style={{ gridColumn: "1 / -1" }}>
              <label className="dm" style={{ fontSize: 11, fontWeight: 500, color: "var(--color-text-secondary)", textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: 8 }}>
                Paper Text *
              </label>
              <textarea
                value={paperText}
                onChange={e => setPaperText(e.target.value)}
                placeholder="Paste your full paper here — abstract, introduction, methodology, results, conclusion, and references..."
                style={{
                  width: "100%", height: 280, padding: 16,
                  border: "0.5px solid var(--color-border-secondary)",
                  borderRadius: 10, background: "var(--color-background-primary)",
                  color: "var(--color-text-primary)", resize: "vertical", lineHeight: 1.7,
                  outline: "none", fontSize: 13
                }}
              />
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 10 }}>
                <button className="dm" onClick={() => fileRef.current.click()} style={{
                  background: "none", border: "0.5px solid var(--color-border-secondary)", borderRadius: 7,
                  padding: "7px 14px", cursor: "pointer", fontSize: 12, color: "var(--color-text-secondary)"
                }}>
                  ↑ Upload file (.txt, .md, .pdf)
                </button>
                <input ref={fileRef} type="file" accept=".txt,.pdf,.md" onChange={handleFile} style={{ display: "none" }} />
                {paperText.length > 0 && (
                  <span className="dm" style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>
                    {paperText.length.toLocaleString()} characters
                  </span>
                )}
              </div>
            </div>

            <div>
              <label className="dm" style={{ fontSize: 11, fontWeight: 500, color: "var(--color-text-secondary)", textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: 8 }}>
                Paper Title
              </label>
              <input
                value={paperTitle}
                onChange={e => setPaperTitle(e.target.value)}
                placeholder="e.g., A Novel Approach to..."
                style={{ width: "100%", padding: "10px 14px", border: "0.5px solid var(--color-border-secondary)", borderRadius: 8, background: "var(--color-background-primary)", color: "var(--color-text-primary)", fontSize: 14, outline: "none" }}
              />
            </div>

            <div>
              <label className="dm" style={{ fontSize: 11, fontWeight: 500, color: "var(--color-text-secondary)", textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: 8 }}>
                Research Field
              </label>
              <select
                value={field}
                onChange={e => setField(e.target.value)}
                style={{ width: "100%", padding: "10px 14px", border: "0.5px solid var(--color-border-secondary)", borderRadius: 8, background: "var(--color-background-primary)", color: "var(--color-text-primary)", fontSize: 14, outline: "none" }}
              >
                {["Computer Science","Medicine / Healthcare","Biology / Life Sciences","Physics","Chemistry","Social Sciences","Economics","Engineering","Mathematics","Psychology","Environmental Science","Other"].map(f => (
                  <option key={f}>{f}</option>
                ))}
              </select>
            </div>

            <div style={{ gridColumn: "1 / -1" }}>
              <label className="dm" style={{ fontSize: 11, fontWeight: 500, color: "var(--color-text-secondary)", textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: 8 }}>
                Target Venue (optional)
              </label>
              <input
                value={venue}
                onChange={e => setVenue(e.target.value)}
                placeholder="e.g., NeurIPS, Nature, EMNLP, IEEE Transactions..."
                style={{ width: "100%", padding: "10px 14px", border: "0.5px solid var(--color-border-secondary)", borderRadius: 8, background: "var(--color-background-primary)", color: "var(--color-text-primary)", fontSize: 14, outline: "none" }}
              />
            </div>

            {error && (
              <div style={{ gridColumn: "1 / -1", padding: "12px 16px", background: "#fceaea", border: "0.5px solid #e5a5a5", borderRadius: 8 }}>
                <span className="dm" style={{ fontSize: 13, color: "#b53a3a" }}>{error}</span>
              </div>
            )}

            <div style={{ gridColumn: "1 / -1" }}>
              {isAnalyzing ? (
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                    <span className="dm" style={{ fontSize: 13, color: "var(--color-text-secondary)" }}>{progressLabel}</span>
                    <span className="dm" style={{ fontSize: 13, color: "var(--color-text-secondary)" }}>{progress}%</span>
                  </div>
                  <div style={{ height: 4, background: "var(--color-border-tertiary)", borderRadius: 2, overflow: "hidden" }}>
                    <div style={{ width: `${progress}%`, height: "100%", background: "#1a1a1a", borderRadius: 2, transition: "width 0.6s ease" }} />
                  </div>
                </div>
              ) : (
                <button className="analyze-btn" onClick={runAnalysis} disabled={!paperText.trim()}>
                  Analyze Paper →
                </button>
              )}
            </div>
          </div>
        )}

        {/* ── OVERVIEW TAB ── */}
        {tab === "overview" && review && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            <div style={{
              background: "var(--color-background-primary)", border: "0.5px solid var(--color-border-tertiary)",
              borderRadius: 14, padding: "28px", gridColumn: "1 / -1",
              display: "flex", gap: 32, alignItems: "flex-start", flexWrap: "wrap"
            }}>
              <div style={{ textAlign: "center", minWidth: 100 }}>
                <div style={{ fontSize: 52, fontWeight: 600, letterSpacing: "-0.04em", lineHeight: 1, marginBottom: 4, color: "var(--color-text-primary)" }}>
                  {review.overall_score}
                </div>
                <div className="dm" style={{ fontSize: 11, color: "var(--color-text-secondary)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Overall</div>
                <div style={{ marginTop: 10, padding: "5px 12px", borderRadius: 16, background: (recColor[review.recommendation] || "#888") + "18", border: `1px solid ${(recColor[review.recommendation] || "#888")}30` }}>
                  <span className="dm" style={{ fontSize: 12, fontWeight: 600, color: recColor[review.recommendation] }}>{review.recommendation}</span>
                </div>
              </div>
              <div style={{ flex: 1, minWidth: 260 }}>
                <p style={{ fontSize: 15.5, lineHeight: 1.75, color: "var(--color-text-primary)", fontStyle: "italic", marginBottom: 16 }}>
                  "{review.summary}"
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {REVIEW_DIMENSIONS.map(d => (
                    <div key={d.key} style={{ display: "grid", gridTemplateColumns: "110px 1fr", alignItems: "center", gap: 12 }}>
                      <span className="dm" style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>{d.label}</span>
                      <ScoreBar score={review.scores[d.key]} color={d.color} />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ background: "var(--color-background-primary)", border: "0.5px solid var(--color-border-tertiary)", borderRadius: 12, padding: 24 }}>
              <h3 className="dm" style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--color-text-secondary)", marginBottom: 16 }}>Strengths</h3>
              {(review.strengths || []).map((s, i) => (
                <div key={i} style={{ display: "flex", gap: 10, marginBottom: 12, alignItems: "flex-start" }}>
                  <span style={{ color: "#2a7d4f", fontSize: 16, marginTop: 1, flexShrink: 0 }}>✓</span>
                  <p className="dm" style={{ fontSize: 13.5, lineHeight: 1.6, color: "var(--color-text-primary)" }}>{s}</p>
                </div>
              ))}
            </div>

            <div style={{ background: "var(--color-background-primary)", border: "0.5px solid var(--color-border-tertiary)", borderRadius: 12, padding: 24 }}>
              <h3 className="dm" style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--color-text-secondary)", marginBottom: 16 }}>Critical Gaps</h3>
              {(review.critical_gaps || []).map((g, i) => (
                <div key={i} style={{ display: "flex", gap: 10, marginBottom: 12, alignItems: "flex-start" }}>
                  <span style={{ color: "#b53a3a", fontSize: 16, marginTop: 1, flexShrink: 0 }}>!</span>
                  <p className="dm" style={{ fontSize: 13.5, lineHeight: 1.6, color: "var(--color-text-primary)" }}>{g}</p>
                </div>
              ))}
            </div>

            <div style={{ gridColumn: "1 / -1", background: "var(--color-background-primary)", border: "0.5px solid var(--color-border-tertiary)", borderRadius: 12, padding: 24 }}>
              <h3 className="dm" style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--color-text-secondary)", marginBottom: 16 }}>Revision Priorities</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {(review.revision_priority || []).map((r, i) => (
                  <div key={i} style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
                    <div className="dm" style={{ width: 28, height: 28, borderRadius: "50%", background: i === 0 ? "#b53a3a" : i === 1 ? "#b86010" : "#2d6fa8", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, flexShrink: 0, marginTop: 2 }}>
                      {i + 1}
                    </div>
                    <div>
                      <p className="dm" style={{ fontSize: 14, fontWeight: 500, color: "var(--color-text-primary)", marginBottom: 3 }}>{r.action}</p>
                      <p className="dm" style={{ fontSize: 13, color: "var(--color-text-secondary)", lineHeight: 1.5 }}>{r.rationale}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── SECTIONS TAB ── */}
        {tab === "sections" && review && (
          <div style={{ display: "grid", gridTemplateColumns: "220px 1fr", gap: 20 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {SECTIONS.map(s => {
                const sec = review.sections?.[s.key];
                const score = sec?.score || 0;
                return (
                  <button key={s.key} className={`section-btn ${activeSection === s.key ? "active" : ""}`} onClick={() => setActiveSection(activeSection === s.key ? null : s.key)}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                      <span style={{ display: "flex", alignItems: "center", gap: 7 }}>
                        <span style={{ color: "var(--color-text-secondary)", fontSize: 14 }}>{s.icon}</span>
                        <span className="dm" style={{ fontWeight: 500, fontSize: 13, color: "var(--color-text-primary)" }}>{s.label}</span>
                      </span>
                      <span className="dm" style={{ fontSize: 12, fontWeight: 600, color: score >= 75 ? "#2a7d4f" : score >= 50 ? "#b86010" : "#b53a3a" }}>
                        {score}
                      </span>
                    </div>
                    <div style={{ height: 3, background: "var(--color-border-tertiary)", borderRadius: 2, overflow: "hidden" }}>
                      <div style={{ width: `${score}%`, height: "100%", background: score >= 75 ? "#2a7d4f" : score >= 50 ? "#b86010" : "#b53a3a", borderRadius: 2 }} />
                    </div>
                  </button>
                );
              })}
            </div>

            <div>
              {activeSection ? (() => {
                const sec = review.sections?.[activeSection];
                const s = SECTIONS.find(s => s.key === activeSection);
                if (!sec) return <p className="dm" style={{ color: "var(--color-text-secondary)", fontSize: 14 }}>No data for this section.</p>;
                return (
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 20, paddingBottom: 16, borderBottom: "0.5px solid var(--color-border-tertiary)" }}>
                      <span style={{ fontSize: 28 }}>{s.icon}</span>
                      <div>
                        <h2 style={{ fontSize: 20, fontStyle: "italic", fontWeight: 500, marginBottom: 2, color: "var(--color-text-primary)" }}>{s.label}</h2>
                        <span className="dm" style={{ fontSize: 13, color: "var(--color-text-secondary)" }}>
                          Section score: <strong>{sec.score}/100</strong> · {(sec.issues || []).length} annotations
                        </span>
                      </div>
                    </div>
                    {(sec.issues || []).length === 0 ? (
                      <p className="dm" style={{ color: "var(--color-text-secondary)", fontSize: 14, fontStyle: "italic" }}>No specific issues found in this section.</p>
                    ) : (
                      (sec.issues || []).map((issue, i) => (
                        <div key={i} className="issue-card">
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                            <span className="dm" style={{ fontSize: 14, fontWeight: 500, color: "var(--color-text-primary)", flex: 1, marginRight: 12 }}>{issue.issue}</span>
                            <SeverityBadge level={issue.severity} />
                          </div>
                          <p className="dm" style={{ fontSize: 13, color: "var(--color-text-secondary)", lineHeight: 1.6, marginBottom: 8 }}>{issue.detail}</p>
                          {issue.suggestion && (
                            <div style={{ background: "var(--color-background-secondary)", borderRadius: 6, padding: "8px 12px", borderLeft: "2px solid #2d6fa8" }}>
                              <span className="dm" style={{ fontSize: 11, fontWeight: 600, color: "#2d6fa8", textTransform: "uppercase", letterSpacing: "0.06em" }}>Suggestion: </span>
                              <span className="dm" style={{ fontSize: 12.5, color: "var(--color-text-primary)" }}>{issue.suggestion}</span>
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                );
              })() : (
                <div style={{ textAlign: "center", padding: "60px 0", color: "var(--color-text-secondary)" }}>
                  <p style={{ fontSize: 32, marginBottom: 12 }}>◈</p>
                  <p className="dm" style={{ fontSize: 14 }}>Select a section to view detailed annotations</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── CHECKLIST TAB ── */}
        {tab === "checklist" && review && (
          <div style={{ background: "var(--color-background-primary)", border: "0.5px solid var(--color-border-tertiary)", borderRadius: 14, padding: 32 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 24, paddingBottom: 16, borderBottom: "0.5px solid var(--color-border-tertiary)" }}>
              <h2 style={{ fontSize: 20, fontStyle: "italic", fontWeight: 500, color: "var(--color-text-primary)" }}>Review Checklist</h2>
              <span className="dm" style={{ fontSize: 13, color: "var(--color-text-secondary)" }}>
                {Object.values(review.checklist || {}).filter(Boolean).length} / {Object.keys(review.checklist || {}).length} passed
              </span>
            </div>
            {Object.entries(review.checklist || {}).map(([key, value]) => {
              const labels = {
                research_question_clear: "Research question is clearly stated",
                hypothesis_stated: "Hypothesis or research objective is explicitly stated",
                methodology_reproducible: "Methodology is sufficiently detailed for reproducibility",
                statistical_analysis_sound: "Statistical analysis is appropriate and correctly applied",
                limitations_discussed: "Study limitations are acknowledged and discussed",
                related_work_adequate: "Related work / literature review is adequately covered",
                contribution_clear: "Paper contribution and novelty are clearly articulated",
                ethical_considerations: "Ethical considerations are addressed (where applicable)",
              };
              return (
                <div key={key} className="checklist-row">
                  <div style={{ width: 22, height: 22, borderRadius: 5, flexShrink: 0, background: value ? "#eaf5ee" : "#fceaea", border: `1px solid ${value ? "#7bc9a0" : "#e5a5a5"}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <span style={{ fontSize: 12, color: value ? "#2a7d4f" : "#b53a3a" }}>{value ? "✓" : "✗"}</span>
                  </div>
                  <span>{labels[key] || key.replace(/_/g, " ")}</span>
                  {!value && (
                    <span className="dm" style={{ marginLeft: "auto", fontSize: 11, fontWeight: 600, color: "#b86010", background: "#fef3e2", padding: "2px 8px", borderRadius: 4, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                      Missing
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ── CHAT TAB ── */}
        {tab === "chat" && review && (
          <div style={{ background: "var(--color-background-primary)", border: "0.5px solid var(--color-border-tertiary)", borderRadius: 14, overflow: "hidden", display: "flex", flexDirection: "column" }}>
            <div style={{ padding: "16px 20px", borderBottom: "0.5px solid var(--color-border-tertiary)" }}>
              <h2 style={{ fontSize: 17, fontStyle: "italic", fontWeight: 500, color: "var(--color-text-primary)" }}>Ask the Reviewer</h2>
              <p className="dm" style={{ fontSize: 12, color: "var(--color-text-secondary)", marginTop: 2 }}>Discuss feedback, clarify suggestions, or get detailed improvement advice</p>
            </div>
            <div style={{ overflowY: "auto", padding: 20, display: "flex", flexDirection: "column", gap: 14, minHeight: 320, maxHeight: 420 }}>
              {chatHistory.map((m, i) => (
                <div key={i} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start" }}>
                  <div className="chat-bubble" style={{ background: m.role === "user" ? "var(--color-text-primary)" : "var(--color-background-secondary)", color: m.role === "user" ? "var(--color-background-primary)" : "var(--color-text-primary)" }}>
                    {m.text}
                  </div>
                </div>
              ))}
              {chatLoading && (
                <div style={{ display: "flex", justifyContent: "flex-start" }}>
                  <div className="chat-bubble dm" style={{ background: "var(--color-background-secondary)", color: "var(--color-text-secondary)", fontStyle: "italic" }}>Thinking...</div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>
            <div style={{ padding: "16px 20px", borderTop: "0.5px solid var(--color-border-tertiary)", display: "flex", gap: 10 }}>
              <input
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && !e.shiftKey && sendChat()}
                placeholder="Ask about the feedback, request elaboration, or get rewriting tips..."
                style={{ flex: 1, padding: "10px 14px", border: "0.5px solid var(--color-border-secondary)", borderRadius: 8, background: "var(--color-background-primary)", color: "var(--color-text-primary)", fontSize: 13.5, outline: "none" }}
              />
              <button className="send-btn" onClick={sendChat} disabled={chatLoading || !chatInput.trim()}>Send</button>
            </div>
            <div style={{ padding: "10px 20px 16px", display: "flex", flexWrap: "wrap", gap: 8 }}>
              {["How do I improve the methodology section?", "What citations are missing?", "Explain the clarity issues"].map(q => (
                <button key={q} className="quick-q" onClick={() => setChatInput(q)}>{q}</button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
