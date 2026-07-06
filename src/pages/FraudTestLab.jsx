import { useState, useRef } from "react";
import { api } from "../services/api";
import { Card, CardHeader, Badge, Table, Btn } from "../components/layout/UI";
import EntityGraph from "../components/fraud/EntityGraph";

// ── Standalone session creator ────────────────────────────────
// Creates a ghost session with a test PAN so fraud pipeline can run
// without requiring a full compliance flow first.

const FRAUD_DOCS = [
  { key: "board",     label: "Board of Directors",      icon: "👥", required: true  },
  { key: "kmp",       label: "KMP List",                icon: "🏛", required: true  },
  { key: "benef",     label: "Beneficial Owners (UBO)", icon: "🔗", required: true  },
  { key: "rpt",       label: "RPT Documents",           icon: "📋", required: true  },
  { key: "pep",       label: "PEP Declaration",         icon: "🛡", required: false },
  { key: "promoter",  label: "Promoter KYC",            icon: "📄", required: false },
  { key: "guarantor", label: "Guarantor KYC",           icon: "📄", required: false },
  { key: "fatca",     label: "FATCA Compliance",        icon: "🌐", required: false },
];

const PROC_STEPS = [
  "Parsing director & KMP documents",
  "Building entity relationship graph",
  "Running beneficial ownership analysis",
  "Checking PEP & sanctions databases",
  "Analysing related party transactions",
  "Running NLP summary via Qwen2.5",
  "Computing risk score",
];

function RiskGauge({ score }) {
  const color  = score < 40 ? "var(--success)" : score < 70 ? "var(--warning)" : "var(--danger)";
  const label  = score < 40 ? "LOW RISK" : score < 70 ? "MEDIUM RISK" : "HIGH RISK";
  const r      = 52;
  const circ   = 2 * Math.PI * r;
  const filled = (score / 100) * circ;

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
      <div style={{ position: "relative", width: 128, height: 128 }}>
        <svg width="128" height="128" style={{ transform: "rotate(-90deg)" }}>
          <circle cx="64" cy="64" r={r} fill="none" stroke="var(--bg-base)" strokeWidth="10" />
          <circle cx="64" cy="64" r={r} fill="none" stroke={color} strokeWidth="10"
            strokeDasharray={`${filled} ${circ}`} strokeLinecap="round"
            style={{ transition: "stroke-dasharray 1.2s cubic-bezier(0.4,0,0.2,1)" }} />
        </svg>
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
          <div style={{ fontSize: 28, fontWeight: 800, color, fontFamily: "var(--font-mono)", lineHeight: 1 }}>{score}</div>
          <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 2 }}>/100</div>
        </div>
      </div>
      <div style={{ fontSize: 11, fontWeight: 700, color, letterSpacing: "0.1em" }}>{label}</div>
    </div>
  );
}

function FileDropZone({ slot, file, onFile }) {
  const [over, setOver] = useState(false);
  const ref = useRef();
  const done = !!file;

  return (
    <div
      onClick={() => ref.current?.click()}
      onDragOver={e => { e.preventDefault(); setOver(true); }}
      onDragLeave={() => setOver(false)}
      onDrop={e => { e.preventDefault(); setOver(false); const f = e.dataTransfer.files[0]; if (f) onFile(f); }}
      style={{
        padding: "14px 12px",
        borderRadius: 8,
        border: `1.5px dashed ${done ? "var(--success-border)" : over ? "var(--accent)" : "var(--border)"}`,
        background: done ? "var(--success-bg)" : over ? "var(--accent-light)" : "var(--bg-card)",
        cursor: "pointer",
        transition: "all 0.15s",
        display: "flex",
        alignItems: "center",
        gap: 12,
      }}
    >
      <input ref={ref} type="file" accept=".pdf,.png,.jpg,.jpeg" style={{ display: "none" }}
        onChange={e => { if (e.target.files[0]) onFile(e.target.files[0]); }} />
      <span style={{ fontSize: 20 }}>{done ? "✓" : slot.icon}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: done ? "var(--success)" : "var(--text-secondary)" }}>
          {slot.label}
          {slot.required && <span style={{ color: "var(--danger)", marginLeft: 3 }}>*</span>}
        </div>
        <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {done ? file.name : "Click or drag to upload"}
        </div>
      </div>
      {done && (
        <button onClick={e => { e.stopPropagation(); onFile(null); }}
          style={{ background: "none", border: "none", color: "var(--text-muted)", fontSize: 14, cursor: "pointer", padding: "2px 4px" }}>
          ✕
        </button>
      )}
    </div>
  );
}

const TABS = [
  { id: "graph",   label: "Entity Graph"  },
  { id: "nlp",     label: "NLP Summary"   },
  { id: "persons", label: "Persons"       },
  { id: "rpt",     label: "RPT"           },
  { id: "risk",    label: "Risk Overview" },
];

export default function FraudTestLab() {
  // ── State ─────────────────────────────────────────────────
  const [pan,       setPan]       = useState("");
  const [panErr,    setPanErr]    = useState("");
  const [files,     setFiles]     = useState({});
  const [stage,     setStage]     = useState("setup");   // setup | processing | results
  const [procStep,  setProcStep]  = useState(0);
  const [procLabel, setProcLabel] = useState("");
  const [fraudData, setFraudData] = useState(null);
  const [error,     setError]     = useState("");
  const [tab,       setTab]       = useState("graph");
  const [exporting, setExporting] = useState(false);
  const sessionRef = useRef(null);

  const reqCount  = FRAUD_DOCS.filter(d => d.required).length;
  const uploaded  = FRAUD_DOCS.filter(d => d.required && files[d.key]).length;
  const canRun    = uploaded === reqCount && pan.trim().length === 10;

  const setFile = (key, file) => setFiles(p => ({ ...p, [key]: file }));

  // ── Validate PAN ──────────────────────────────────────────
  const validatePAN = (p) => {
    p = p.trim().toUpperCase();
    if (!/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(p)) return "Invalid PAN format. Expected: AAKCM1234C";
    return "";
  };

  // ── Run pipeline ──────────────────────────────────────────
  const handleRun = async () => {
    const err = validatePAN(pan);
    if (err) { setPanErr(err); return; }
    setPanErr("");
    setError("");
    setStage("processing");
    setProcStep(0);

    try {
      // 1. Create a ghost session for this PAN
      const sessRes = await api.createSession({ pan: pan.trim().toUpperCase() });
      const sessData = await sessRes.json();
      if (!sessRes.ok) {
        // Session may already exist — that's fine, reuse it
        if (!sessData?.id) throw new Error(sessData?.detail || "Session creation failed");
      }
      const sessionId = sessData.id;
      sessionRef.current = sessionId;

      // 2. Upload fraud documents
      const formData = new FormData();
      formData.append("session_id", sessionId);
      for (const slot of FRAUD_DOCS) {
        if (files[slot.key]) formData.append(slot.key, files[slot.key]);
      }
      const upRes = await api.uploadFraudDocs(formData);
      if (!upRes.ok) {
        const d = await upRes.json();
        throw new Error(d.detail || "Upload failed");
      }

      // 3. Stream fraud analysis SSE
      const analysisRes = await fetch(
        `http://13.232.162.208:8000/api/v1/fraud/analyze/${sessionId}`,
        { method: "POST", headers: { Authorization: `Bearer ${localStorage.getItem("pramanik_token")}` } }
      );
      if (!analysisRes.ok) throw new Error("Analysis failed to start");

      const reader  = analysisRes.body.getReader();
      const decoder = new TextDecoder();

      const read = () => {
        reader.read().then(({ done, value }) => {
          if (done) return;
          const lines = decoder.decode(value).split("\n").filter(l => l.startsWith("data: "));
          for (const line of lines) {
            try {
              const data = JSON.parse(line.slice(6));
              setProcStep(data.index);
              setProcLabel(data.step);
              if (data.status === "done") {
                setFraudData(data.result);
                setStage("results");
                return;
              }
              if (data.status === "error") {
                throw new Error(data.step);
              }
            } catch (e) {
              if (e.message !== "done") {
                setError(e.message);
                setStage("setup");
              }
            }
          }
          read();
        });
      };
      read();

    } catch (e) {
      setError(e.message);
      setStage("setup");
    }
  };

  const handleReset = () => {
    setStage("setup");
    setFiles({});
    setFraudData(null);
    setError("");
    setTab("graph");
    setProcStep(0);
    setProcLabel("");
    sessionRef.current = null;
  };

  const handleExport = async () => {
    if (!sessionRef.current) return;
    setExporting(true);
    try {
      await api.downloadPDF(sessionRef.current, "fraud");
    } catch (e) {
      setError("Export failed: " + e.message);
    } finally {
      setExporting(false);
    }
  };

  const fd = fraudData || {};

  // ─────────────────────────────────────────────────────────
  return (
    <div style={{ padding: "28px 32px", maxWidth: 1100 }}>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 }}>
        <div>
          <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 6, display: "flex", gap: 6 }}>
            <span>Fraud Analytics</span>
            <span style={{ color: "var(--border-strong)" }}>›</span>
            <span style={{ color: "var(--text-secondary)" }}>Test Lab</span>
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>Fraud Detection Test Lab</h1>
          <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 4 }}>
            Run fraud analysis directly — no compliance verification required.
          </p>
        </div>
        <div>
          <button className="">Ok</button>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {stage === "results" && (
            <>
              <Btn onClick={handleReset} variant="secondary" size="sm">↻ New Test</Btn>
              <Btn onClick={handleExport} disabled={exporting} variant="secondary" size="sm" className="px-10">
                {exporting ? "Generating..." : "⬇ Export PDF"}
              </Btn>
            </>
          )}
          {stage !== "results" && (
            <div className="px-10" style={{ padding: "6px 12px", background: "var(--warning-bg)", border: "1px solid var(--warning-border)", borderRadius: 6, fontSize: 11, color: "var(--warning)", fontWeight: 600 }}>
              ⚗ STANDALONE MODE
            </div>
          )}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div style={{ padding: "10px 14px", background: "var(--danger-bg)", border: "1px solid var(--danger-border)", borderRadius: 6, color: "var(--danger)", fontSize: 13, marginBottom: 20 }}>
          {error}
        </div>
      )}

      {/* ── SETUP ── */}
      {stage === "setup" && (
        <div style={{ display: "grid", gridTemplateColumns: "340px 1fr", gap: 20 }}>

          {/* Left — PAN + config */}
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <Card>
              <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", marginBottom: 12 }}>Company PAN</div>
              <input
                value={pan}
                onChange={e => { setPan(e.target.value.toUpperCase()); setPanErr(""); }}
                placeholder="e.g. AAKCM1234C"
                maxLength={10}
                style={{ width: "100%", padding: "10px 12px", fontFamily: "var(--font-mono)", fontSize: 14, letterSpacing: "0.1em", marginBottom: 8 }}
              />
              {panErr && <div style={{ fontSize: 12, color: "var(--danger)" }}>{panErr}</div>}
              <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>
                Used to create a test session. Can be any valid company PAN.
              </div>
            </Card>

            {/* Progress */}
            <Card>
              <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", marginBottom: 10 }}>Upload Progress</div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "var(--text-muted)", marginBottom: 6 }}>
                <span>Required files</span>
                <span style={{ fontFamily: "var(--font-mono)", fontWeight: 600, color: uploaded === reqCount ? "var(--success)" : "var(--text-primary)" }}>
                  {uploaded}/{reqCount}
                </span>
              </div>
              <div style={{ height: 6, background: "var(--bg-base)", borderRadius: 3, marginBottom: 14 }}>
                <div style={{ height: 6, background: uploaded === reqCount ? "var(--success)" : "var(--accent)", borderRadius: 3, width: `${(uploaded / reqCount) * 100}%`, transition: "width 0.3s" }} />
              </div>
              <Btn onClick={handleRun} disabled={!canRun} style={{ width: "100%" }} size="md">
                Run Fraud Analysis →
              </Btn>
              {!canRun && (
                <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 8, textAlign: "center" }}>
                  {pan.trim().length !== 10 ? "Enter a valid 10-char PAN" : `Upload ${reqCount - uploaded} more required file(s)`}
                </div>
              )}
            </Card>

            {/* What runs */}
            <Card style={{ background: "var(--bg-base)" }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.08em" }}>Pipeline Steps</div>
              {PROC_STEPS.map((s, i) => (
                <div key={i} style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 7, fontSize: 12, color: "var(--text-muted)" }}>
                  <span style={{ width: 18, height: 18, borderRadius: "50%", background: "var(--bg-input)", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 600, color: "var(--text-faint)", flexShrink: 0 }}>{i + 1}</span>
                  {s}
                </div>
              ))}
            </Card>
          </div>

          {/* Right — file uploads */}
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 12 }}>
              Upload Fraud Documents
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {FRAUD_DOCS.map(slot => (
                <FileDropZone key={slot.key} slot={slot} file={files[slot.key] || null}
                  onFile={f => setFile(slot.key, f)} />
              ))}
            </div>
            <div style={{ marginTop: 12, padding: "10px 12px", background: "var(--bg-base)", borderRadius: 6, border: "1px solid var(--border)", fontSize: 12, color: "var(--text-muted)", lineHeight: 1.6 }}>
              <strong style={{ color: "var(--text-secondary)" }}>How it works:</strong> A temporary session is created with your PAN.
              Uploaded docs go through OCR → specialized extraction agents → entity graph →
              PEP screening → RPT analysis → NLP risk summary → risk score.
              No compliance verification step needed.
            </div>
          </div>
        </div>
      )}

      {/* ── PROCESSING ── */}
      {stage === "processing" && (
        <div style={{ maxWidth: 480 }}>
          <Card>
            <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)", marginBottom: 4 }}>Running fraud analysis...</div>
            <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 20 }}>
              PAN: <span style={{ fontFamily: "var(--font-mono)" }}>{pan}</span>
            </div>
            {PROC_STEPS.map((s, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
                <div style={{
                  width: 24, height: 24, borderRadius: "50%", flexShrink: 0,
                  background: procStep > i + 1 ? "var(--success)" : procStep === i + 1 ? "var(--accent)" : "var(--bg-input)",
                  border: `2px solid ${procStep > i + 1 ? "var(--success)" : procStep === i + 1 ? "var(--accent)" : "var(--border)"}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 10, color: "#fff", fontWeight: 700, transition: "all 0.3s",
                }}>
                  {procStep > i + 1 ? "✓" : procStep === i + 1 ? (
                    <span style={{ fontSize: 8 }}>●</span>
                  ) : ""}
                </div>
                <span style={{
                  fontSize: 13,
                  color: procStep > i + 1 ? "var(--text-primary)" : procStep === i + 1 ? "var(--accent)" : "var(--text-muted)",
                  fontWeight: procStep === i + 1 ? 600 : 400,
                  transition: "all 0.3s",
                }}>{s}</span>
                {procStep === i + 1 && (
                  <span style={{ fontSize: 11, color: "var(--accent)", animation: "pulse 1s infinite" }}>...</span>
                )}
              </div>
            ))}
            {procLabel && !PROC_STEPS.includes(procLabel) && (
              <div style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "var(--font-mono)", marginTop: 4, padding: "6px 8px", background: "var(--bg-base)", borderRadius: 4 }}>
                {procLabel}
              </div>
            )}
          </Card>
        </div>
      )}

      {/* ── RESULTS ── */}
      {stage === "results" && fd && (
        <div>
          {/* Banner */}
          <Card style={{ marginBottom: 20, display: "flex", alignItems: "center", gap: 28, flexWrap: "wrap" }}>
            <RiskGauge score={fd.riskScore || 0} />
            <div style={{ flex: 1, minWidth: 260 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 6 }}>
                Analysis Complete · PAN: <span style={{ fontFamily: "var(--font-mono)" }}>{pan}</span>
              </div>
              <div style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.65, marginBottom: 14 }}>
                {(fd.nlpSummary || []).slice(-1)[0] || "Analysis complete."}
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {[
                  { label: `${(fd.entityGraph?.nodes || []).length} Entities`,           color: "blue"  },
                  { label: `${(fd.entityGraph?.edges || []).length} Relationships`,       color: "grey"  },
                  { label: `${(fd.persons || []).filter(p => p.pep).length} PEP Flags`,  color: (fd.persons || []).filter(p => p.pep).length > 0 ? "red" : "green" },
                  { label: `${(fd.rpt || []).length} RPT Flags`,                         color: (fd.rpt || []).length > 0 ? "amber" : "green" },
                ].map(t => (
                  <Badge key={t.label} color={t.color}>{t.label}</Badge>
                ))}
              </div>
              {(fd.flags || []).length > 0 && (
                <div style={{ marginTop: 10, display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {fd.flags.map(f => (
                    <span key={f} style={{ fontSize: 11, padding: "2px 8px", background: "var(--danger-bg)", border: "1px solid var(--danger-border)", color: "var(--danger)", borderRadius: 4, fontWeight: 600 }}>
                      {f}
                    </span>
                  ))}
                </div>
              )}
            </div>
            <div style={{ padding: "14px 20px", background: "var(--bg-base)", borderRadius: 8, border: "1px solid var(--border)", textAlign: "center", minWidth: 140 }}>
              <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>Recommendation</div>
              <div style={{ fontSize: 12, fontWeight: 700, color: fd.riskLevel === "HIGH" ? "var(--danger)" : fd.riskLevel === "MEDIUM" ? "var(--warning)" : "var(--success)", lineHeight: 1.4 }}>
                {fd.riskLevel === "HIGH"   ? "REJECT" :
                 fd.riskLevel === "MEDIUM" ? "ENHANCED DUE DILIGENCE" :
                 "STANDARD DUE DILIGENCE"}
              </div>
            </div>
          </Card>

          {/* Tabs */}
          <div style={{ display: "flex", gap: 2, marginBottom: 18, borderBottom: "1px solid var(--border)" }}>
            {TABS.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)} style={{
                padding: "8px 18px", background: "none", border: "none",
                borderBottom: `2px solid ${tab === t.id ? "var(--accent)" : "transparent"}`,
                color: tab === t.id ? "var(--accent)" : "var(--text-muted)",
                fontSize: 13, fontWeight: tab === t.id ? 600 : 400, cursor: "pointer", marginBottom: -1,
              }}>{t.label}</button>
            ))}
          </div>

          {/* Entity Graph */}
          {tab === "graph" && (
            <Card noPad>
              <CardHeader title="Entity Relationship Graph"
                subtitle="Ownership · Directorships · Beneficial ownership · Financial links" />
              {(fd.entityGraph?.nodes || []).length > 0
                ? <EntityGraph nodes={fd.entityGraph.nodes} edges={fd.entityGraph.edges} />
                : <div style={{ padding: 32, textAlign: "center", color: "var(--text-muted)" }}>No entity graph data — check if board/beneficial owner docs were extracted correctly.</div>
              }
            </Card>
          )}

          {/* NLP Summary */}
          {tab === "nlp" && (
            <Card noPad>
              <CardHeader title="AI-Generated Risk Summary"
                subtitle="Qwen2.5:3b via Ollama"
                right={<Badge color="blue">QWEN2.5</Badge>} />
              <div style={{ padding: 18, display: "flex", flexDirection: "column", gap: 10 }}>
                {(fd.nlpSummary || []).length === 0
                  ? <div style={{ color: "var(--text-muted)", fontSize: 13 }}>No NLP summary generated.</div>
                  : (fd.nlpSummary || []).map((pt, i) => (
                    <div key={i} style={{ display: "flex", gap: 12, padding: "10px 14px", background: i === (fd.nlpSummary.length - 1) ? "var(--success-bg)" : "var(--bg-base)", borderRadius: 7, border: `1px solid ${i === (fd.nlpSummary.length - 1) ? "var(--success-border)" : "var(--border)"}` }}>
                      <div style={{ width: 22, height: 22, borderRadius: "50%", background: i === (fd.nlpSummary.length - 1) ? "var(--success)" : "var(--accent)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, flexShrink: 0, marginTop: 1 }}>{i + 1}</div>
                      <p style={{ margin: 0, fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.7 }}>{pt}</p>
                    </div>
                  ))
                }
              </div>
            </Card>
          )}

          {/* Persons */}
          {tab === "persons" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {(fd.persons || []).length === 0
                ? <Card><div style={{ color: "var(--text-muted)", fontSize: 13, textAlign: "center" }}>No person data extracted. Check if board documents were uploaded and OCR succeeded.</div></Card>
                : (fd.persons || []).map((p, i) => {
                  const risk = p.riskScore < 30 ? "var(--success)" : p.riskScore < 60 ? "var(--warning)" : "var(--danger)";
                  return (
                    <Card key={i} style={{ display: "flex", gap: 16 }}>
                      <div style={{ width: 48, height: 48, borderRadius: "50%", background: "var(--bg-base)", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 18 }}>
                        👤
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                          <div>
                            <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>{p.name || "—"}</div>
                            <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{p.role || "Director"}</div>
                          </div>
                          <div style={{ textAlign: "right" }}>
                            <div style={{ fontSize: 22, fontWeight: 700, color: risk, fontFamily: "var(--font-mono)" }}>{p.riskScore}</div>
                            <div style={{ fontSize: 10, color: "var(--text-muted)" }}>Risk Score</div>
                          </div>
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 6, marginBottom: 10 }}>
                          {[["DIN", p.din], ["PAN", p.pan], ["DOB", p.dob], ["Address", p.address]].map(([k, v]) => (
                            <div key={k} style={{ padding: "5px 8px", background: "var(--bg-base)", borderRadius: 5, border: "1px solid var(--border)" }}>
                              <div style={{ fontSize: 9, color: "var(--text-muted)", marginBottom: 1, textTransform: "uppercase" }}>{k}</div>
                              <div style={{ fontSize: 11, color: "var(--text-primary)", fontFamily: "var(--font-mono)" }}>{v || "—"}</div>
                            </div>
                          ))}
                        </div>
                        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                          <Badge color={p.pep ? "red" : "green"}>{p.pep ? "PEP Flagged" : "Not PEP"}</Badge>
                          <Badge color={p.sanctions ? "red" : "green"}>{p.sanctions ? "Sanctions Hit" : "No Sanctions"}</Badge>
                          {(p.otherDirectorships || []).length > 0 && (
                            <Badge color="amber">{p.otherDirectorships.length} Other Directorship(s)</Badge>
                          )}
                        </div>
                        {(p.otherDirectorships || []).length > 0 && (
                          <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 6 }}>
                            Also director in: {p.otherDirectorships.join(", ")}
                          </div>
                        )}
                      </div>
                    </Card>
                  );
                })
              }
            </div>
          )}

          {/* RPT */}
          {tab === "rpt" && (
            <Card noPad>
              <CardHeader title="Related Party Transactions"
                right={<Badge color={(fd.rpt || []).length > 0 ? "amber" : "green"}>{(fd.rpt || []).length} Transactions</Badge>} />
              <Table
                columns={[
                  { key: "entity",          label: "Entity",       render: v => <span style={{ fontWeight: 500, color: "var(--text-primary)" }}>{v || "—"}</span> },
                  { key: "relationship",    label: "Relationship", render: v => <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{v || "—"}</span> },
                  { key: "transactionType", label: "Type",         render: v => v || "—" },
                  { key: "amount",          label: "Amount",       render: v => <span style={{ fontFamily: "var(--font-mono)", fontSize: 12 }}>{v || "—"}</span> },
                  { key: "riskLevel",       label: "Risk",         render: v => <Badge color={v === "LOW" ? "green" : v === "MEDIUM" ? "amber" : "red"}>{v || "—"}</Badge> },
                  { key: "flagReason",      label: "Flag Reason",  render: v => <span style={{ fontSize: 11, color: "var(--text-muted)" }}>{v || "—"}</span> },
                ]}
                rows={fd.rpt || []}
                emptyMsg="No RPT data extracted."
              />
            </Card>
          )}

          {/* Risk Overview */}
          {tab === "risk" && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
              {[
                { label: "Risk Score",       value: `${fd.riskScore || 0}/100`,         color: fd.riskScore >= 70 ? "var(--danger)" : fd.riskScore >= 40 ? "var(--warning)" : "var(--success)" },
                { label: "Risk Level",       value: fd.riskLevel || "—",                color: fd.riskLevel === "HIGH" ? "var(--danger)" : fd.riskLevel === "MEDIUM" ? "var(--warning)" : "var(--success)" },
                { label: "PEP Flags",        value: (fd.persons || []).filter(p => p.pep).length, color: "var(--text-primary)" },
                { label: "RPT Transactions", value: (fd.rpt || []).length,              color: "var(--text-primary)" },
                { label: "Entity Nodes",     value: (fd.entityGraph?.nodes || []).length, color: "var(--text-primary)" },
                { label: "Active Flags",     value: (fd.flags || []).length || "None",  color: (fd.flags || []).length > 0 ? "var(--danger)" : "var(--success)" },
              ].map(m => (
                <Card key={m.label} style={{ textAlign: "center" }}>
                  <div style={{ fontSize: typeof m.value === "number" ? 28 : 16, fontWeight: 700, color: m.color, fontFamily: "var(--font-mono)", marginBottom: 6, wordBreak: "break-word" }}>
                    {m.value}
                  </div>
                  <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{m.label}</div>
                </Card>
              ))}
              {(fd.flags || []).length > 0 && (
                <Card style={{ gridColumn: "1 / -1" }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "var(--danger)", marginBottom: 10 }}>Active Risk Flags</div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {(fd.flags || []).map(f => (
                      <span key={f} style={{ padding: "4px 12px", background: "var(--danger-bg)", border: "1px solid var(--danger-border)", color: "var(--danger)", borderRadius: 5, fontSize: 12, fontWeight: 600 }}>
                        {f}
                      </span>
                    ))}
                  </div>
                </Card>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
