import { useState, useRef } from "react";
import { MOCK } from "../services/api";
import { PageHeader, Card, CardHeader, Badge, StepIndicator, Btn, ConfidenceBar } from "../components/layout/UI";

const DOC_SLOTS = [
  { key: "pan",    label: "Company PAN Card",             accept: ".png,.jpg,.jpeg", required: true  },
  { key: "gst",    label: "GST Certificate",              accept: ".pdf",            required: true  },
  { key: "lei",    label: "LEI Certificate",              accept: ".pdf",            required: false },
  { key: "incorp", label: "Certificate of Incorporation", accept: ".pdf",            required: true  },
  { key: "moa",    label: "MOA",                          accept: ".pdf",            required: true  },
  { key: "aoa",    label: "AOA",                          accept: ".pdf",            required: true  },
  { key: "addr",   label: "Registered Address (INC-22)",  accept: ".pdf",            required: true  },
  { key: "elec",   label: "Electricity Bill",             accept: ".pdf",            required: true  },
  { key: "tel",    label: "Telephone Bill",               accept: ".pdf",            required: false },
];

const DOC_LABEL = {
  PAN_CARD:"PAN Card", GST_CERTIFICATE:"GST Certificate", LEI_CERTIFICATE:"LEI Certificate",
  INCORPORATION_CERTIFICATE:"Incorporation", MOA:"MOA", AOA:"AOA",
  REGISTERED_ADDRESS:"Reg. Address", ELECTRICITY_BILL:"Electricity Bill", TELEPHONE_BILL:"Telephone Bill",
};

// ── Step 1 ─────────────────────────────────────────────────────
function StepPAN({ onNext }) {
  const [pan, setPan] = useState("");
  const [err, setErr] = useState("");

  const go = () => {
    const p = pan.trim().toUpperCase();
    if (!/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(p)) { setErr("Invalid PAN format. Expected: AAKCM1234C (10 characters)"); return; }
    if (p[3] !== "C") { setErr(`4th character is '${p[3]}' — must be 'C' for a Company PAN.`); return; }
    setErr(""); onNext(p);
  };

  return (
    <div style={{ maxWidth: 500 }}>
      <Card>
        <div style={{ marginBottom: 18 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)", marginBottom: 4 }}>Company PAN Number</div>
          <div style={{ fontSize: 13, color: "var(--text-muted)" }}>Enter the 10-character Company PAN. The 4th character must be 'C' to identify a company entity.</div>
        </div>
        <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
          <input value={pan} onChange={e => { setPan(e.target.value.toUpperCase()); setErr(""); }}
            onKeyDown={e => e.key === "Enter" && go()}
            placeholder="e.g. AAKCM1234C" maxLength={10}
            style={{ flex: 1, padding: "10px 12px", letterSpacing: "0.1em", fontFamily: "var(--font-mono)", fontSize: 15 }}
          />
          <Btn onClick={go}>Next →</Btn>
        </div>
        {err && <div style={{ fontSize: 13, color: "var(--danger)", padding: "8px 10px", background: "var(--danger-bg)", borderRadius: 5, border: "1px solid var(--danger-border)" }}>{err}</div>}

        <div style={{ marginTop: 14, padding: "12px", background: "var(--bg-input)", borderRadius: 6, border: "1px solid var(--border)" }}>
          <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 6, fontWeight: 500 }}>PAN FORMAT GUIDE</div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 14, letterSpacing: "0.15em", marginBottom: 4 }}>
            {["A","A","K","C","M","1","2","3","4","C"].map((ch, i) => (
              <span key={i} style={{ color: i===3 ? "var(--accent)" : i<5 ? "var(--text-secondary)" : i<9 ? "var(--warning)" : "var(--success)" }}>{ch}</span>
            ))}
          </div>
          <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
            Positions 1–3: Sequence · <span style={{ color: "var(--accent)", fontWeight: 600 }}>4th: Entity type (C = Company)</span> · 5: Initial · 6–9: Number · 10: Check
          </div>
        </div>
      </Card>
    </div>
  );
}

// ── Step 2 ─────────────────────────────────────────────────────
function StepUpload({ pan, onProcess }) {
  const [files, setFiles]   = useState({});
  const [drag,  setDrag]    = useState(null);
  const refs = useRef({});
  const reqCount   = DOC_SLOTS.filter(d => d.required).length;
  const uploaded   = DOC_SLOTS.filter(d => d.required && files[d.key]).length;
  const canProcess = uploaded === reqCount;

  return (
    <div style={{ maxWidth: 720 }}>
      <Card style={{ marginBottom: 14, padding: "12px 16px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, fontSize: 13, color: "var(--text-secondary)" }}>
          <span>Required documents uploaded</span>
          <span style={{ fontFamily: "var(--font-mono)", fontWeight: 600, color: canProcess ? "var(--success)" : "var(--text-primary)" }}>{uploaded}/{reqCount}</span>
        </div>
        <div style={{ height: 6, background: "var(--bg-base)", borderRadius: 3 }}>
          <div style={{ height: 6, background: canProcess ? "var(--success)" : "var(--accent)", borderRadius: 3, width: `${(uploaded/reqCount)*100}%`, transition: "width 0.3s" }} />
        </div>
      </Card>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 16 }}>
        {DOC_SLOTS.map(slot => {
          const done = !!files[slot.key];
          const over = drag === slot.key;
          return (
            <div key={slot.key}
              onClick={() => refs.current[slot.key]?.click()}
              onDragOver={e => { e.preventDefault(); setDrag(slot.key); }}
              onDragLeave={() => setDrag(null)}
              onDrop={e => { e.preventDefault(); setDrag(null); const f = e.dataTransfer.files[0]; if(f) setFiles(p=>({...p,[slot.key]:f})); }}
              style={{
                padding: "12px 10px", textAlign: "center", cursor: "pointer", borderRadius: 7,
                border: `1px dashed ${done ? "var(--success-border)" : over ? "var(--accent)" : "var(--border)"}`,
                background: done ? "var(--success-bg)" : over ? "var(--accent-light)" : "var(--bg-card)",
                transition: "all 0.15s",
              }}>
              <input ref={el => refs.current[slot.key] = el} type="file" accept={slot.accept} style={{ display:"none" }}
                onChange={e => setFiles(p=>({...p,[slot.key]:e.target.files[0]}))} />
              <div style={{ fontSize: 18, marginBottom: 5, color: done ? "var(--success)" : "var(--text-muted)" }}>{done ? "✓" : "+"}</div>
              <div style={{ fontSize: 12, fontWeight: 500, color: done ? "var(--success)" : "var(--text-secondary)" }}>
                {slot.label}{slot.required && <span style={{ color: "var(--danger)" }}> *</span>}
              </div>
              {done && <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{files[slot.key].name}</div>}
              {!done && <div style={{ fontSize: 10, color: "var(--text-faint)", marginTop: 2 }}>Click or drag to upload</div>}
            </div>
          );
        })}
      </div>
      <Btn onClick={() => onProcess(files)} disabled={!canProcess} size="lg">Run OCR Pipeline →</Btn>
    </div>
  );
}

// ── Step 3 ─────────────────────────────────────────────────────
function StepProcessing({ onComplete }) {
  const [step, setStep] = useState(0);
  const steps = ["Converting PDFs to images","Preprocessing with OpenCV","Running Tesseract OCR","Extracting fields via Qwen3","Running cross-checks","Saving to MongoDB"];

  useState(() => {
    let i = 0;
    const iv = setInterval(() => { i++; setStep(i); if(i >= steps.length) { clearInterval(iv); setTimeout(onComplete, 500); } }, 700);
    return () => clearInterval(iv);
  }, []);

  return (
    <div style={{ maxWidth: 460 }}>
      <Card>
        <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)", marginBottom: 18 }}>Processing documents...</div>
        {steps.map((s, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
            <div style={{
              width: 22, height: 22, borderRadius: "50%", flexShrink: 0,
              background: step>i ? "var(--success)" : step===i ? "var(--accent)" : "var(--bg-input)",
              border: `2px solid ${step>i ? "var(--success)" : step===i ? "var(--accent)" : "var(--border)"}`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 10, color: "#fff", fontWeight: 600, transition: "all 0.3s",
            }}>
              {step > i ? "✓" : ""}
            </div>
            <span style={{ fontSize: 13, color: step>i ? "var(--text-primary)" : step===i ? "var(--accent)" : "var(--text-muted)", transition: "color 0.3s" }}>{s}</span>
          </div>
        ))}
      </Card>
    </div>
  );
}

// ── Step 4 ─────────────────────────────────────────────────────
function StepResults({ results, onNext }) {
  const { crossCheck, documents } = results;
  const [aiErrors, setAiErrors]   = useState({});
  const allAcknowledged = crossCheck.failed.every(f => aiErrors[f.parameter] !== undefined);
  const canProceed      = crossCheck.failed.length === 0 || allAcknowledged;

  return (
    <div style={{ maxWidth: 800 }}>
      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10, marginBottom: 18 }}>
        {[
          { label: "Documents",      value: documents.length,                                     color: "var(--text-primary)" },
          { label: "Extracted OK",   value: documents.filter(d=>d.status==="EXTRACTED").length,   color: "var(--success)"      },
          { label: "Checks Passed",  value: crossCheck.passed.length,                             color: "var(--success)"      },
          { label: "Anomalies",      value: crossCheck.failed.length,                             color: crossCheck.failed.length>0 ? "var(--danger)" : "var(--success)" },
        ].map(m => (
          <Card key={m.label} style={{ textAlign: "center", padding: "12px 10px" }}>
            <div style={{ fontSize: 24, fontWeight: 700, color: m.color, fontFamily: "var(--font-mono)" }}>{m.value}</div>
            <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>{m.label}</div>
          </Card>
        ))}
      </div>

      {/* Passed */}
      {crossCheck.passed.length > 0 && (
        <Card style={{ marginBottom: 12, padding: "14px 16px" }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: "var(--success)", marginBottom: 10 }}>Consistent Parameters ({crossCheck.passed.length})</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {crossCheck.passed.map(p => (
              <div key={p.parameter} style={{ padding: "5px 10px", background: "var(--success-bg)", border: "1px solid var(--success-border)", borderRadius: 5 }}>
                <span style={{ fontSize: 12, fontWeight: 500, color: "var(--success)" }}>{p.parameter}</span>
                <span style={{ fontSize: 11, color: "var(--text-muted)", marginLeft: 8, fontFamily: "var(--font-mono)" }}>{p.value}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Anomalies */}
      {crossCheck.failed.map(f => (
        <Card key={f.parameter} style={{ marginBottom: 12, borderColor: "var(--danger-border)", background: "var(--danger-bg)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
            <span style={{ fontSize: 16, color: "var(--danger)" }}>⚠</span>
            <span style={{ fontSize: 14, fontWeight: 600, color: "var(--danger)" }}>Inconsistency Detected</span>
            <Badge color="red">{f.parameter}</Badge>
          </div>
          <div style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.65, marginBottom: 12 }}>
            The <strong>{f.parameter}</strong> value <span style={{ fontFamily: "var(--font-mono)", background: "var(--danger-bg)", border: "1px solid var(--danger-border)", padding: "1px 6px", borderRadius: 3, color: "var(--danger)" }}>"{f.inconsistent_values[0]}"</span> found
            in <strong>{f.inconsistent_docs.join(", ")}</strong> does not match the expected value <span style={{ fontFamily: "var(--font-mono)", background: "var(--success-bg)", border: "1px solid var(--success-border)", padding: "1px 6px", borderRadius: 3, color: "var(--success)" }}>"{f.majority_value}"</span> across
            the other {Object.keys(f.all_values).length - f.inconsistent_docs.length} document(s).
          </div>
          <div style={{ fontSize: 13, color: "var(--warning)", fontWeight: 500, marginBottom: 12 }}>
            Kindly physically verify the consistency for <strong>{f.parameter}</strong> across {f.inconsistent_docs.join(", ")}.
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
            {Object.entries(f.all_values).map(([doc, val]) => {
              const bad = f.inconsistent_docs.includes(doc);
              return (
                <div key={doc} style={{ padding: "6px 10px", borderRadius: 5, border: `1px solid ${bad?"var(--danger-border)":"var(--success-border)"}`, background: bad?"var(--danger-bg)":"var(--success-bg)" }}>
                  <div style={{ fontSize: 10, color: "var(--text-muted)", marginBottom: 2 }}>{DOC_LABEL[doc]||doc}</div>
                  <div style={{ fontSize: 12, fontFamily: "var(--font-mono)", color: bad?"var(--danger)":"var(--success)" }}>{val}</div>
                </div>
              );
            })}
          </div>
          <div style={{ padding: "10px 12px", background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 6, display: "flex", alignItems: "center", gap: 14 }}>
            <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>Was this an AI/OCR extraction error?</span>
            {["Yes", "No"].map(opt => (
              <label key={opt} style={{ display: "flex", alignItems: "center", gap: 5, cursor: "pointer", fontSize: 13 }}>
                <input type="radio" name={`ai_${f.parameter}`} value={opt}
                  checked={aiErrors[f.parameter]===opt}
                  onChange={()=>setAiErrors(p=>({...p,[f.parameter]:opt}))}
                  style={{ accentColor: "var(--accent)", width: 14, height: 14 }} />
                {opt}
              </label>
            ))}
          </div>
        </Card>
      ))}

      {/* Warnings */}
      {crossCheck.warnings.map(w => (
        <Card key={w.parameter} style={{ marginBottom: 12, borderColor: "var(--warning-border)" }}>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <span style={{ fontSize: 14, color: "var(--warning)" }}>⚡</span>
            <span style={{ fontSize: 13, color: "var(--warning)", fontWeight: 500 }}>{w.parameter} — Not extracted from: {w.missing_from?.join(", ")}</span>
          </div>
          <p style={{ margin: "6px 0 0 22px", fontSize: 12, color: "var(--text-muted)" }}>{w.issue}</p>
        </Card>
      ))}

      {/* Next btn */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 6 }}>
        <button onClick={onNext} disabled={!canProceed} style={{
          padding: "11px 28px", background: canProceed ? "#1a56db" : "var(--bg-input)",
          border: `1px solid ${canProceed?"#1a56db":"var(--border)"}`,
          borderRadius: 7, color: canProceed?"#fff":"var(--text-muted)",
          fontWeight: 600, fontSize: 14, cursor: canProceed?"pointer":"not-allowed",
          transition: "all 0.2s",
          boxShadow: canProceed ? "0 2px 8px rgba(26,86,219,0.3)" : "none",
        }}>
          Verify Details →
        </button>
        {!canProceed && <span style={{ fontSize: 13, color: "var(--text-muted)" }}>Acknowledge all anomalies above to proceed.</span>}
        {canProceed && crossCheck.failed.length>0 && <span style={{ fontSize: 13, color: "var(--success)" }}>✓ All anomalies acknowledged</span>}
      </div>
    </div>
  );
}

// ── Main ────────────────────────────────────────────────────────
export default function BasicVerification({ session, setSession, setAllResults, allResults, setActivePage }) {
  const [step, setStep] = useState(session ? 4 : 1);
  const [pan,  setPan]  = useState(session?.pan || "");
  const STEPS = ["PAN Input","Upload Docs","Processing","Results"];

  return (
    <div style={{ padding: "28px 32px" }}>
      <PageHeader breadcrumb={["Compliance","Basic Verification"]} title="KYC Document Verification"
        subtitle="OCR extraction and cross-consistency checks across all compliance documents." />
      <StepIndicator steps={STEPS} current={step} />

      {step===1 && <StepPAN onNext={p=>{setPan(p);setSession({id:`SESS_${p}`,pan:p});setStep(2);}} />}
      {step===2 && <StepUpload pan={pan} onProcess={()=>setStep(3)} />}
      {step===3 && <StepProcessing onComplete={()=>{setAllResults({crossCheck:MOCK.crossCheck,documents:MOCK.documents});setStep(4);}} />}
      {step===4 && allResults && <StepResults results={allResults} onNext={()=>setActivePage("verify")} />}
    </div>
  );
}
