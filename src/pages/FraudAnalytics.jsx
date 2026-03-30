import { useState, useRef } from "react";
import { MOCK } from "../services/api";
import { PageHeader, Card, CardHeader, Badge, Table, Btn } from "../components/layout/UI";
import EntityGraph from "../components/fraud/EntityGraph";

const fraud = MOCK.fraudAnalysis;

const FRAUD_DOCS = [
  { key:"board",    label:"Board of Directors List",       required:true  },
  { key:"kmp",      label:"List of KMPs",                  required:true  },
  { key:"promoter", label:"KYC of Promoters & Directors",  required:true  },
  { key:"guarantor",label:"KYC of Guarantors",             required:false },
  { key:"fatca",    label:"FATCA Compliance",              required:false },
  { key:"benef",    label:"List of Beneficial Owners",     required:true  },
  { key:"pep",      label:"PEP Declaration",               required:false },
  { key:"rpt",      label:"RPT Documents",                 required:true  },
];

function RiskMeter({ score }) {
  const color = score<40?"var(--success)":score<70?"var(--warning)":"var(--danger)";
  const label = score<40?"Low Risk":score<70?"Medium Risk":"High Risk";
  const r=40, circ=2*Math.PI*r, fill=(score/100)*circ;
  return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:6 }}>
      <div style={{ position:"relative", width:100, height:100 }}>
        <svg width="100" height="100" style={{ transform:"rotate(-90deg)" }}>
          <circle cx="50" cy="50" r={r} fill="none" stroke="var(--bg-base)" strokeWidth="8" />
          <circle cx="50" cy="50" r={r} fill="none" stroke={color} strokeWidth="8"
            strokeDasharray={`${fill} ${circ}`} strokeLinecap="round"
            style={{ transition:"stroke-dasharray 1s ease" }} />
        </svg>
        <div style={{ position:"absolute", inset:0, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center" }}>
          <div style={{ fontSize:20, fontWeight:700, color, fontFamily:"var(--font-mono)" }}>{score}</div>
          <div style={{ fontSize:9, color:"var(--text-muted)" }}>/100</div>
        </div>
      </div>
      <div style={{ fontSize:12, fontWeight:600, color }}>{label}</div>
    </div>
  );
}

function PersonCard({ p }) {
  const risk = p.riskScore<30?"var(--success)":p.riskScore<60?"var(--warning)":"var(--danger)";
  return (
    <Card style={{ display:"flex", gap:14 }}>
      {/* SVG person icon */}
      <div style={{ width:48, height:48, borderRadius:"50%", background:"var(--bg-base)", border:"1px solid var(--border)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      </div>
      <div style={{ flex:1 }}>
        <div style={{ display:"flex", justifyContent:"space-between", marginBottom:8 }}>
          <div>
            <div style={{ fontSize:14, fontWeight:600, color:"var(--text-primary)" }}>{p.name}</div>
            <div style={{ fontSize:12, color:"var(--text-muted)" }}>{p.role}</div>
          </div>
          <div style={{ textAlign:"right" }}>
            <div style={{ fontSize:20, fontWeight:700, color:risk, fontFamily:"var(--font-mono)" }}>{p.riskScore}</div>
            <div style={{ fontSize:10, color:"var(--text-muted)" }}>Risk Score</div>
          </div>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:6, marginBottom:10 }}>
          {[["DIN",p.din],["PAN",p.pan],["DOB",p.dob],["Address",p.address]].map(([k,v])=>(
            <div key={k} style={{ padding:"5px 8px", background:"var(--bg-base)", borderRadius:5, border:"1px solid var(--border)" }}>
              <div style={{ fontSize:9, color:"var(--text-muted)", marginBottom:1, textTransform:"uppercase" }}>{k}</div>
              <div style={{ fontSize:11, color:"var(--text-primary)", fontFamily:"var(--font-mono)" }}>{v}</div>
            </div>
          ))}
        </div>
        <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
          <Badge color={p.pep?"red":"green"}>{p.pep?"PEP Flagged":"Not PEP"}</Badge>
          <Badge color={p.sanctions?"red":"green"}>{p.sanctions?"Sanctions Hit":"No Sanctions"}</Badge>
          {p.otherDirectorships.length>0 && <Badge color="amber">{p.otherDirectorships.length} Other Directorship(s)</Badge>}
        </div>
        {p.otherDirectorships.length>0 && (
          <div style={{ fontSize:12, color:"var(--text-muted)", marginTop:6 }}>
            Also director in: {p.otherDirectorships.join(", ")}
          </div>
        )}
      </div>
    </Card>
  );
}

export default function FraudAnalytics({ session }) {
  const [stage,    setStage]    = useState("upload");
  const [procStep, setProcStep] = useState(0);
  const [tab,      setTab]      = useState("graph");
  const [files,    setFiles]    = useState({});
  const refs = useRef({});

  const reqCount  = FRAUD_DOCS.filter(d=>d.required).length;
  const uploaded  = FRAUD_DOCS.filter(d=>d.required&&files[d.key]).length;
  const canSubmit = uploaded===reqCount;

  const procSteps = ["Parsing director & KMP documents","Building entity relationship graph","Running beneficial ownership analysis","Checking PEP & sanctions databases","Analysing related party transactions","Running NLP summary via Qwen3","Computing risk score"];

  const handleSubmit = () => {
    setStage("processing");
    let i=0;
    const iv=setInterval(()=>{i++;setProcStep(i);if(i>=procSteps.length){clearInterval(iv);setTimeout(()=>setStage("results"),500);}},750);
  };

  const tabs = [
    {id:"graph",   label:"Entity Graph"},
    {id:"nlp",     label:"NLP Summary"},
    {id:"persons", label:"Persons"},
    {id:"rpt",     label:"RPT Analysis"},
    {id:"risk",    label:"Risk Overview"},
  ];

  return (
    <div style={{ padding:"28px 32px" }}>
      <PageHeader breadcrumb={["Fraud Analytics","Detection"]} title="Fraud Detection & Risk Analysis"
        subtitle="Entity graph · Beneficial ownership · PEP screening · RPT analysis · NLP risk summary" />

      {/* Upload */}
      {stage==="upload" && (
        <div style={{ maxWidth:700 }}>
          <div style={{ padding:"12px 14px", background:"var(--warning-bg)", border:"1px solid var(--warning-border)", borderRadius:7, marginBottom:16 }}>
            <div style={{ fontSize:13, fontWeight:600, color:"var(--warning)", marginBottom:3 }}>KYC Points 8–12</div>
            <div style={{ fontSize:13, color:"var(--text-muted)", lineHeight:1.5 }}>Upload Board of Directors, KMP list, Promoter KYC, Beneficial Owners, PEP declarations, and RPT documents for fraud analysis.</div>
          </div>
          <Card style={{ marginBottom:12, padding:"10px 14px" }}>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:5, fontSize:13 }}>
              <span style={{ color:"var(--text-secondary)" }}>Required documents</span>
              <span style={{ fontFamily:"var(--font-mono)", fontWeight:600, color:canSubmit?"var(--success)":"var(--text-primary)" }}>{uploaded}/{reqCount}</span>
            </div>
            <div style={{ height:5, background:"var(--bg-base)", borderRadius:3 }}>
              <div style={{ height:5, background:canSubmit?"var(--success)":"var(--accent)", borderRadius:3, width:`${(uploaded/reqCount)*100}%`, transition:"width 0.3s" }} />
            </div>
          </Card>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:16 }}>
            {FRAUD_DOCS.map(slot=>{
              const done=!!files[slot.key];
              return (
                <div key={slot.key} onClick={()=>refs.current[slot.key]?.click()}
                  style={{ padding:"10px 12px", background:done?"var(--success-bg)":"var(--bg-card)", border:`1px dashed ${done?"var(--success-border)":"var(--border)"}`, borderRadius:7, cursor:"pointer", display:"flex", alignItems:"center", gap:10 }}>
                  <input ref={el=>refs.current[slot.key]=el} type="file" accept=".pdf,.png,.jpg" style={{ display:"none" }}
                    onChange={e=>setFiles(p=>({...p,[slot.key]:e.target.files[0]}))} />
                  <span style={{ fontSize:16, color:done?"var(--success)":"var(--text-muted)" }}>{done?"✓":"+"}</span>
                  <div>
                    <div style={{ fontSize:12, fontWeight:500, color:done?"var(--success)":"var(--text-secondary)" }}>
                      {slot.label}{slot.required&&<span style={{ color:"var(--danger)" }}> *</span>}
                    </div>
                    {done&&<div style={{ fontSize:10, color:"var(--text-muted)", marginTop:1 }}>{files[slot.key].name}</div>}
                  </div>
                </div>
              );
            })}
          </div>
          <Btn onClick={handleSubmit} disabled={!canSubmit} size="lg">Run Fraud Analysis →</Btn>
        </div>
      )}

      {/* Processing */}
      {stage==="processing" && (
        <div style={{ maxWidth:460 }}>
          <Card>
            <div style={{ fontSize:14, fontWeight:600, color:"var(--text-primary)", marginBottom:18 }}>Running fraud analysis...</div>
            {procSteps.map((s,i)=>(
              <div key={i} style={{ display:"flex", alignItems:"center", gap:12, marginBottom:13 }}>
                <div style={{ width:22, height:22, borderRadius:"50%", flexShrink:0,
                  background:procStep>i?"var(--success)":procStep===i?"var(--accent)":"var(--bg-input)",
                  border:`2px solid ${procStep>i?"var(--success)":procStep===i?"var(--accent)":"var(--border)"}`,
                  display:"flex", alignItems:"center", justifyContent:"center",
                  fontSize:10, color:"#fff", fontWeight:600, transition:"all 0.3s" }}>
                  {procStep>i?"✓":""}
                </div>
                <span style={{ fontSize:13, color:procStep>i?"var(--text-primary)":procStep===i?"var(--accent)":"var(--text-muted)", transition:"color 0.3s" }}>{s}</span>
              </div>
            ))}
          </Card>
        </div>
      )}

      {/* Results */}
      {stage==="results" && (
        <div>
          {/* Risk banner */}
          <Card style={{ marginBottom:20, display:"flex", alignItems:"center", gap:24 }}>
            <RiskMeter score={fraud.riskScore} />
            <div style={{ flex:1 }}>
              <div style={{ fontSize:15, fontWeight:700, color:"var(--text-primary)", marginBottom:5 }}>Risk Assessment Complete</div>
              <div style={{ fontSize:13, color:"var(--text-muted)", lineHeight:1.6, maxWidth:500, marginBottom:10 }}>{fraud.nlpSummary[6]}</div>
              <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                {[`${fraud.entityGraph.nodes.length} Entities`,`${fraud.entityGraph.edges.length} Relationships`,`${fraud.rpt.length} RPT Flags`,`${fraud.persons.filter(p=>p.pep).length} PEP Flags`].map(t=>(
                  <span key={t} style={{ fontSize:12, padding:"3px 10px", background:"var(--bg-base)", border:"1px solid var(--border)", borderRadius:4, color:"var(--text-muted)" }}>{t}</span>
                ))}
              </div>
            </div>
          </Card>

          {/* Tabs */}
          <div style={{ display:"flex", gap:2, marginBottom:18, borderBottom:"1px solid var(--border)" }}>
            {tabs.map(t=>(
              <button key={t.id} onClick={()=>setTab(t.id)} style={{
                padding:"8px 16px", background:"none", border:"none",
                borderBottom:`2px solid ${tab===t.id?"var(--accent)":"transparent"}`,
                color:tab===t.id?"var(--accent)":"var(--text-muted)",
                fontSize:13, fontWeight:tab===t.id?600:400, cursor:"pointer", marginBottom:-1,
              }}>{t.label}</button>
            ))}
          </div>

          {/* Entity graph */}
          {tab==="graph" && (
            <Card noPad>
              <CardHeader title="Entity Relationship Graph" subtitle="Ownership chains · Directorship links · Beneficial ownership · Financial relationships" />
              <EntityGraph nodes={fraud.entityGraph.nodes} edges={fraud.entityGraph.edges} />
            </Card>
          )}

          {/* NLP */}
          {tab==="nlp" && (
            <Card noPad>
              <CardHeader title="AI-Generated Risk Summary" subtitle="Generated by Qwen3 via Ollama"
                right={<Badge color="blue">QWEN3</Badge>} />
              <div style={{ padding:18 }}>
                {fraud.nlpSummary.map((pt,i)=>(
                  <div key={i} style={{ display:"flex", gap:12, marginBottom:12, padding:"10px 12px", background:i===fraud.nlpSummary.length-1?"var(--success-bg)":"var(--bg-base)", borderRadius:7, border:`1px solid ${i===fraud.nlpSummary.length-1?"var(--success-border)":"var(--border)"}` }}>
                    <div style={{ width:20,height:20,borderRadius:"50%",background:"var(--accent)",color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:600,flexShrink:0,marginTop:2 }}>{i+1}</div>
                    <p style={{ margin:0, fontSize:13, color:"var(--text-secondary)", lineHeight:1.65 }}>{pt}</p>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Persons */}
          {tab==="persons" && (
            <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
              {fraud.persons.map(p=><PersonCard key={p.name} p={p} />)}
            </div>
          )}

          {/* RPT */}
          {tab==="rpt" && (
            <Card noPad>
              <CardHeader title="Related Party Transactions" right={<Badge color="amber">{fraud.rpt.length} Entities</Badge>} />
              <Table
                columns={[
                  { key:"entity",          label:"Entity",       render:v=><span style={{ fontWeight:500, color:"var(--text-primary)" }}>{v}</span> },
                  { key:"relationship",    label:"Relationship", render:v=><span style={{ fontSize:12, color:"var(--text-muted)" }}>{v}</span> },
                  { key:"transactionType", label:"Type" },
                  { key:"amount",          label:"Amount",       render:v=><span style={{ fontFamily:"var(--font-mono)", fontSize:12 }}>{v}</span> },
                  { key:"riskLevel",       label:"Risk",         render:v=><Badge color={v==="LOW"?"green":v==="MEDIUM"?"amber":"red"}>{v}</Badge> },
                  { key:"flagReason",      label:"Flag Reason",  render:v=><span style={{ fontSize:11, color:"var(--text-muted)" }}>{v}</span> },
                ]}
                rows={fraud.rpt}
              />
            </Card>
          )}

          {/* Risk overview */}
          {tab==="risk" && (
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:14 }}>
              {[
                { label:"AML Flags",         value:0,                            color:"var(--success)" },
                { label:"PEP Matches",        value:fraud.persons.filter(p=>p.pep).length, color:"var(--success)" },
                { label:"Sanctions Hits",     value:0,                            color:"var(--success)" },
                { label:"RPT Entities",       value:fraud.rpt.length,             color:"var(--warning)" },
                { label:"Graph Depth",        value:"3 levels",                   color:"var(--text-primary)" },
                { label:"Corroboration",      value:"HIGH",                       color:"var(--success)" },
              ].map(m=>(
                <Card key={m.label} style={{ textAlign:"center" }}>
                  <div style={{ fontSize:26, fontWeight:700, color:m.color, fontFamily:"var(--font-mono)", marginBottom:4 }}>{m.value}</div>
                  <div style={{ fontSize:12, color:"var(--text-muted)" }}>{m.label}</div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
