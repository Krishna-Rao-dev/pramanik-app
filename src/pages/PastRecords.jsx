import { useState, useEffect, useRef } from "react";
import { api } from "../services/api";
import { PageHeader, Card, CardHeader, Badge, StatusDot, Table, Btn } from "../components/layout/UI";

const DOC_LABEL = {
  PAN_CARD: "PAN Card", GST_CERTIFICATE: "GST Certificate", LEI_CERTIFICATE: "LEI Certificate",
  INCORPORATION_CERTIFICATE: "Incorporation", MOA: "MOA", AOA: "AOA",
  REGISTERED_ADDRESS: "Reg. Address", ELECTRICITY_BILL: "Electricity Bill", TELEPHONE_BILL: "Telephone Bill",
};

function RecordDetail({ record, onClose }) {
  const [tab,       setTab]       = useState("compliance");
  const [loading,   setLoading]   = useState(true);
  const [data,      setData]      = useState(null);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    const sid = record.session_id || record.id;
    Promise.all([
      api.getComplianceReport(sid).then(r => r.ok ? r.json() : null),
      api.getFraudReport(sid).then(r => r.ok ? r.json() : null),
    ]).then(([comp, fraud]) => {
      setData({ comp, fraud });
      setLoading(false);
    });
  }, [record]);

  const handleExport = async (type) => {
    setExporting(true);
    try {
      const sid = record.session_id || record.id;
      await api.downloadPDF(sid, type);
    } catch (e) {
      console.error("Export failed", e);
    } finally {
      setExporting(false);
    }
  };

  const comp   = data?.comp;
  const fraud  = data?.fraud;
  const docs   = comp?.documents || [];
  const cross  = comp?.cross_check || {};
  const apiv   = comp?.api_verification || {};

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 100, display: "flex", justifyContent: "flex-end" }}>
      <div style={{ width: "65vw", maxWidth: 900, background: "var(--bg-base)", height: "100vh", overflowY: "auto", boxShadow: "-4px 0 24px rgba(0,0,0,0.15)" }}>
        {/* Header */}
        <div style={{ padding: "18px 24px", background: "var(--bg-card)", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 10 }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)" }}>{record.company}</div>
            <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>PAN: {record.pan} · {record.date} · By: {record.analyst}</div>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <Badge color={record.complianceStatus === "PASS" ? "green" : record.complianceStatus === "PARTIAL" ? "amber" : "red"}>{record.complianceStatus}</Badge>
            <Badge color={record.fraudRisk === "LOW" ? "green" : record.fraudRisk === "MEDIUM" ? "amber" : "red"}>{record.fraudRisk} RISK</Badge>
            <Btn size="sm" variant="secondary" onClick={() => handleExport("compliance")} disabled={exporting}>
              ⬇ Compliance PDF
            </Btn>
            {fraud && (
              <Btn size="sm" variant="secondary" onClick={() => handleExport("fraud")} disabled={exporting}>
                ⬇ Fraud PDF
              </Btn>
            )}
            <button onClick={onClose} style={{ background: "var(--bg-input)", border: "1px solid var(--border)", borderRadius: 6, padding: "6px 10px", cursor: "pointer", color: "var(--text-muted)", fontSize: 13 }}>✕ Close</button>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ padding: "14px 24px 0", borderBottom: "1px solid var(--border)", background: "var(--bg-card)", display: "flex", gap: 4 }}>
          {[["compliance","Compliance Report"],["fraud","Fraud Report"]].map(([id, label]) => (
            <button key={id} onClick={() => setTab(id)} style={{
              padding: "8px 16px", background: "none", border: "none",
              borderBottom: `2px solid ${tab === id ? "var(--accent)" : "transparent"}`,
              color: tab === id ? "var(--accent)" : "var(--text-muted)",
              fontSize: 13, fontWeight: tab === id ? 600 : 400, cursor: "pointer", marginBottom: -1,
            }}>{label}</button>
          ))}
        </div>

        <div style={{ padding: 24 }}>
          {loading && <div style={{ textAlign: "center", color: "var(--text-muted)", padding: 40 }}>Loading...</div>}

          {/* Compliance tab */}
          {!loading && tab === "compliance" && comp && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {/* Cross-check summary */}
              <Card noPad>
                <CardHeader title="Cross-Check Results" subtitle="Consistency across all submitted documents" />
                <div style={{ padding: 16 }}>
                  {(cross.passed||[]).length > 0 && (
                    <div style={{ marginBottom: 12 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: "var(--success)", marginBottom: 8 }}>✓ Consistent Parameters ({cross.passed.length})</div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                        {cross.passed.map(p => (
                          <div key={p.parameter} style={{ padding: "4px 10px", background: "var(--success-bg)", border: "1px solid var(--success-border)", borderRadius: 5 }}>
                            <span style={{ fontSize: 12, fontWeight: 500, color: "var(--success)" }}>{p.parameter}</span>
                            <span style={{ fontSize: 11, color: "var(--text-muted)", marginLeft: 6, fontFamily: "var(--font-mono)" }}>{p.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {(cross.failed||[]).length > 0 && (
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: "var(--danger)", marginBottom: 8 }}>✗ Anomalies Detected ({cross.failed.length})</div>
                      {cross.failed.map(f => (
                        <div key={f.parameter} style={{ padding: "10px 12px", background: "var(--danger-bg)", border: "1px solid var(--danger-border)", borderRadius: 6, marginBottom: 6 }}>
                          <div style={{ fontSize: 12, fontWeight: 600, color: "var(--danger)", marginBottom: 4 }}>{f.parameter} — Mismatch in: {(f.inconsistent_docs||[]).join(", ")}</div>
                          <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                            Expected: <span style={{ fontFamily: "var(--font-mono)", color: "var(--text-primary)" }}>{f.majority_value}</span>
                            {" "}· Found: <span style={{ fontFamily: "var(--font-mono)", color: "var(--danger)" }}>{(f.inconsistent_values||[]).join(", ")}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </Card>

              {/* API verification */}
              {Object.keys(apiv).length > 0 && (
                <Card noPad>
                  <CardHeader title="API Verification Results" />
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                    <thead>
                      <tr style={{ background: "var(--bg-base)" }}>
                        {["Check","Source","Result","Detail"].map(h => (
                          <th key={h} style={{ padding: "8px 14px", textAlign: "left", fontSize: 11, fontWeight: 600, color: "var(--text-muted)", borderBottom: "1px solid var(--border)", textTransform: "uppercase", letterSpacing: "0.06em" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        ["PAN",     apiv.pan,     "status",        "name"],
                        ["GST",     apiv.gst,     "status",        "legal_name"],
                        ["LEI",     apiv.lei,     "status",        "corroboration"],
                        ["CIN",     apiv.cin,     "status",        "roc"],
                        ["Pincode", apiv.pincode, "verified",      "district"],
                      ].filter(([,r])=>r).map(([check, r, statusKey, detailKey]) => (
                        <tr key={check} style={{ borderBottom: "1px solid var(--border)" }}>
                          <td style={{ padding: "9px 14px", fontWeight: 500, color: "var(--text-primary)" }}>{check}</td>
                          <td style={{ padding: "9px 14px" }}>
                            <span style={{ fontSize: 11, padding: "2px 7px", background: "var(--accent-light)", color: "var(--accent)", border: "1px solid var(--accent)", borderRadius: 4 }}>{r?.source||"—"}</span>
                          </td>
                          <td style={{ padding: "9px 14px" }}>
                            <Badge color={r?.[statusKey]===true||["ACTIVE","Active","ISSUED","Valid","Active"].includes(r?.[statusKey])?"green":"red"}>
                              {statusKey==="verified"?(r?.[statusKey]?"Valid":"Invalid"):r?.[statusKey]||"—"}
                            </Badge>
                          </td>
                          <td style={{ padding: "9px 14px", color: "var(--text-muted)", fontSize: 12 }}>{r?.[detailKey]||"—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </Card>
              )}

              {/* Document table */}
              {docs.length > 0 && (
                <Card noPad>
                  <CardHeader title="Extracted Documents" subtitle={`${docs.length} documents processed`} />
                  <Table
                    columns={[
                      { key: "doc_type",    label: "Document",   render: v => DOC_LABEL[v] || v },
                      { key: "status",      label: "OCR Status", render: v => <Badge color={v === "EXTRACTED" ? "green" : "red"}>{v}</Badge> },
                      { key: "confidence",  label: "Confidence", render: v => `${Math.round((v||0.9)*100)}%` },
                      { key: "source_file", label: "File" },
                    ]}
                    rows={docs}
                  />
                </Card>
              )}
            </div>
          )}

          {/* Fraud tab */}
          {!loading && tab === "fraud" && (
            fraud ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {/* Risk score */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 12 }}>
                  {[
                    { label: "Risk Score",   value: `${fraud.risk_score||0}/100`, color: "var(--success)" },
                    { label: "Risk Level",   value: fraud.risk_level||"—",        color: "var(--success)" },
                    { label: "PEP Flags",    value: (fraud.persons||[]).filter(p=>p.pep).length, color: "var(--text-primary)" },
                    { label: "RPT Entities", value: (fraud.rpt||[]).length,       color: "var(--warning)" },
                  ].map(m => (
                    <Card key={m.label} style={{ textAlign: "center", padding: "14px 12px" }}>
                      <div style={{ fontSize: 22, fontWeight: 700, color: m.color, fontFamily: "var(--font-mono)" }}>{m.value}</div>
                      <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 3 }}>{m.label}</div>
                    </Card>
                  ))}
                </div>

                {/* NLP Summary */}
                {(fraud.nlp_summary||[]).length > 0 && (
                  <Card noPad>
                    <CardHeader title="AI Analysis Summary" subtitle="Generated by Qwen2.5 · Ollama" />
                    <div style={{ padding: 16 }}>
                      {fraud.nlp_summary.map((pt, i) => (
                        <div key={i} style={{ display: "flex", gap: 12, marginBottom: 12, padding: "10px 12px", background: "var(--bg-base)", borderRadius: 6, border: "1px solid var(--border)" }}>
                          <div style={{ width: 20, height: 20, borderRadius: "50%", background: "var(--accent)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 600, flexShrink: 0, marginTop: 1 }}>{i+1}</div>
                          <p style={{ margin: 0, fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.6 }}>{pt}</p>
                        </div>
                      ))}
                    </div>
                  </Card>
                )}

                {/* RPT table */}
                {(fraud.rpt||[]).length > 0 && (
                  <Card noPad>
                    <CardHeader title="Related Party Transactions" />
                    <Table
                      columns={[
                        { key: "entity",          label: "Entity" },
                        { key: "relationship",    label: "Relationship", render: v => <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{v}</span> },
                        { key: "transactionType", label: "Type" },
                        { key: "riskLevel",       label: "Risk", render: v => <Badge color={v==="LOW"?"green":v==="MEDIUM"?"amber":"red"}>{v}</Badge> },
                      ]}
                      rows={fraud.rpt}
                    />
                  </Card>
                )}
              </div>
            ) : (
              <div style={{ padding: 24, textAlign: "center", color: "var(--text-muted)" }}>
                Fraud analysis not yet completed for this record.
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}

export default function PastRecords() {
  const [search,   setSearch]   = useState("");
  const [results,  setResults]  = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading,  setLoading]  = useState(true);
  const searchTimer = useRef(null);

  // Load all records on mount
  useEffect(() => {
    loadRecords("");
  }, []);

  // Real-time search with debounce
  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => loadRecords(search), 300);
    return () => clearTimeout(searchTimer.current);
  }, [search]);

  const loadRecords = async (q) => {
    setLoading(true);
    try {
      const res  = q.trim()
        ? await api.searchRecords(q)
        : await api.listRecords(1, 50).then(r => r.ok ? r.json().then(d => ({ ok: true, data: d.records })) : { ok: false });

      if (q.trim()) {
        const data = await res.json();
        setResults(Array.isArray(data) ? data : []);
      } else {
        const data = await res.json();
        setResults(Array.isArray(data.records) ? data.records : Array.isArray(data) ? data : []);
      }
    } catch (e) {
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    { key: "pan",              label: "PAN",        render: v => <span style={{ fontFamily: "var(--font-mono)", fontSize: 12 }}>{v}</span> },
    { key: "company",          label: "Company" },
    { key: "date",             label: "Date",       render: v => <span style={{ color: "var(--text-muted)", fontSize: 12 }}>{v}</span> },
    { key: "analyst",          label: "Analyst",    render: v => <span style={{ fontSize: 12 }}>{v}</span> },
    { key: "complianceStatus", label: "Compliance", render: v => <Badge color={v==="PASS"?"green":v==="PARTIAL"?"amber":"red"}>{v}</Badge> },
    { key: "fraudRisk",        label: "Fraud Risk", render: v => <Badge color={v==="LOW"?"green":v==="MEDIUM"?"amber":v==="HIGH"?"red":"grey"}>{v}</Badge> },
    { key: "id",               label: "",           render: (v, row) => <Btn size="sm" variant="ghost" onClick={() => setSelected(row)}>View →</Btn> },
  ];

  return (
    <div style={{ padding: "28px 32px" }}>
      <PageHeader
        breadcrumb={["Pramanik", "Past Records"]}
        title="Past Records"
        subtitle="Search and review previous compliance and fraud analysis records."
      />

      {/* Search bar */}
      <Card style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <div style={{ flex: 1, position: "relative" }}>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by PAN number or company name — results update in real time"
              style={{ width: "100%", padding: "9px 12px 9px 36px" }}
            />
            <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", fontSize: 14 }}>🔍</span>
          </div>
          <Btn variant="ghost" onClick={() => setSearch("")}>Clear</Btn>
        </div>
        <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 8 }}>
          {loading ? "Searching..." : `${results.length} record(s) found`}
        </div>
      </Card>

      {/* Results table */}
      <Card noPad>
        <CardHeader
          title="Records"
          subtitle={`${results.length} total · Sorted by most recent`}
          right={<span style={{ fontSize: 12, color: "var(--text-muted)" }}>MongoDB · compliance_records</span>}
        />
        <Table
          columns={columns}
          rows={results}
          emptyMsg={loading ? "Loading..." : "No records found."}
        />
      </Card>

      {/* Detail panel */}
      {selected && <RecordDetail record={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}