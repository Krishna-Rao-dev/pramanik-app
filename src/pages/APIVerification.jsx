import { useState } from "react";
import { MOCK } from "../services/api";
import { PageHeader, Card, CardHeader, Badge, ConfidenceBar, Btn } from "../components/layout/UI";

const DOC_LABEL = {
  PAN_CARD:"PAN Card", GST_CERTIFICATE:"GST Certificate", LEI_CERTIFICATE:"LEI Certificate",
  INCORPORATION_CERTIFICATE:"Incorporation", MOA:"MOA", AOA:"AOA",
  REGISTERED_ADDRESS:"Reg. Address", ELECTRICITY_BILL:"Electricity Bill", TELEPHONE_BILL:"Telephone Bill",
};

function DocCard({ doc, apiResult, expanded, onToggle }) {
  const fields = Object.entries(doc.fields||{}).filter(([,v])=>v && typeof v!=="object");
  const nested = Object.entries(doc.fields||{}).filter(([,v])=>typeof v==="object"&&v!==null);

  return (
    <div style={{ background:"var(--bg-card)", border:"1px solid var(--border)", borderRadius:8, overflow:"hidden", boxShadow:"var(--shadow-sm)" }}>
      <div onClick={onToggle} style={{ padding:"12px 16px", cursor:"pointer", display:"flex", alignItems:"center", gap:12 }}>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:13, fontWeight:600, color:"var(--text-primary)" }}>{DOC_LABEL[doc.doc_type]||doc.doc_type}</div>
          <div style={{ fontSize:11, color:"var(--text-muted)", marginTop:2 }}>{doc.source_file}</div>
        </div>
        <div style={{ display:"flex", gap:6, alignItems:"center" }}>
          {apiResult && <Badge color={apiResult.verified?"green":"red"}>{apiResult.status}</Badge>}
          <Badge color={doc.status==="EXTRACTED"?"green":"red"}>{doc.status}</Badge>
          <span style={{ fontSize:12, color:"var(--text-muted)" }}>{expanded?"▲":"▼"}</span>
        </div>
      </div>
      <div style={{ padding:"0 16px 10px" }}>
        <ConfidenceBar value={doc.confidence||0.9} />
      </div>
      {expanded && (
        <div style={{ borderTop:"1px solid var(--border)", padding:16 }}>
          <div style={{ fontSize:11, fontWeight:600, color:"var(--text-muted)", marginBottom:8, textTransform:"uppercase", letterSpacing:"0.06em" }}>Extracted Fields</div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:6, marginBottom:12 }}>
            {fields.map(([k,v])=>(
              <div key={k} style={{ padding:"6px 10px", background:"var(--bg-base)", borderRadius:5, border:"1px solid var(--border)" }}>
                <div style={{ fontSize:10, color:"var(--text-muted)", marginBottom:2, textTransform:"uppercase", letterSpacing:"0.06em" }}>{k.replace(/_/g," ")}</div>
                <div style={{ fontSize:12, color:"var(--text-primary)", fontFamily:"var(--font-mono)" }}>{String(v)}</div>
              </div>
            ))}
          </div>
          {nested.map(([k,v])=>(
            <div key={k} style={{ marginBottom:10 }}>
              <div style={{ fontSize:11, fontWeight:600, color:"var(--text-muted)", marginBottom:5, textTransform:"uppercase", letterSpacing:"0.06em" }}>{k.replace(/_/g," ")}</div>
              <pre style={{ fontSize:11, color:"var(--text-secondary)", fontFamily:"var(--font-mono)", background:"var(--bg-base)", padding:"8px 10px", borderRadius:5, border:"1px solid var(--border)", overflowX:"auto" }}>
                {JSON.stringify(v,null,2)}
              </pre>
            </div>
          ))}
          {apiResult && (
            <div style={{ padding:"10px 12px", background:"var(--success-bg)", border:"1px solid var(--success-border)", borderRadius:6 }}>
              <div style={{ fontSize:11, fontWeight:600, color:"var(--success)", marginBottom:6 }}>API Verification · {apiResult.source}</div>
              <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
                {Object.entries(apiResult).filter(([k])=>!["status","verified"].includes(k)).map(([k,v])=>(
                  <div key={k} style={{ padding:"3px 8px", background:"var(--bg-card)", borderRadius:4, border:"1px solid var(--border)" }}>
                    <span style={{ fontSize:10, color:"var(--text-muted)" }}>{k.replace(/_/g," ")}: </span>
                    <span style={{ fontSize:11, color:"var(--text-primary)", fontFamily:"var(--font-mono)" }}>{String(v)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function APIVerification({ session, allResults }) {
  const [expanded, setExpanded] = useState({});
  const [running,  setRunning]  = useState(false);
  const [done,     setDone]     = useState(false);
  const docs = allResults?.documents || MOCK.documents;
  const apiv = MOCK.apiVerification;
  const avg  = Math.round(docs.reduce((a,d)=>a+(d.confidence||0.9),0)/docs.length*100);

  const apiChecks = [
    { label:"PAN",     source:"SANDBOX",    result:apiv.pan   },
    { label:"GST",     source:"GST Portal", result:apiv.gst   },
    { label:"LEI",     source:"GLEIF",      result:apiv.lei   },
    { label:"CIN",     source:"MCA21",      result:apiv.cin   },
    { label:"Pincode", source:"Postal API", result:apiv.pincode},
  ];

  return (
    <div style={{ padding:"28px 32px" }}>
      <PageHeader breadcrumb={["Compliance","API Verification"]} title="API Verification"
        subtitle="Verify extracted data against GLEIF, GST Portal, MCA21, and Sandbox APIs." />

      {/* Summary row */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:10, marginBottom:20 }}>
        {apiChecks.map(c=>(
          <Card key={c.label} style={{ textAlign:"center", padding:"12px 10px" }}>
            <div style={{ fontSize:13, fontWeight:700, color:done?(c.result.verified?"var(--success)":"var(--danger)"):"var(--text-muted)" }}>
              {done?(c.result.verified?"✓ Valid":"✗ Fail"):"—"}
            </div>
            <div style={{ fontSize:12, fontWeight:500, color:"var(--text-primary)", margin:"4px 0 2px" }}>{c.label}</div>
            <div style={{ fontSize:10, color:"var(--text-muted)" }}>{c.source}</div>
          </Card>
        ))}
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 280px", gap:18 }}>
        {/* Docs */}
        <div>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
            <span style={{ fontSize:13, color:"var(--text-secondary)", fontWeight:500 }}>{docs.length} Documents · Avg confidence {avg}%</span>
            <div style={{ display:"flex", gap:6 }}>
              <Btn size="sm" variant="ghost" onClick={()=>setExpanded(Object.fromEntries(docs.map(d=>[d.doc_type,true])))}>Expand All</Btn>
              <Btn size="sm" variant="ghost" onClick={()=>setExpanded({})}>Collapse</Btn>
            </div>
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
            {docs.map(doc=>(
              <DocCard key={doc.doc_type} doc={doc}
                apiResult={done?apiv[doc.doc_type==="PAN_CARD"?"pan":doc.doc_type==="GST_CERTIFICATE"?"gst":doc.doc_type==="LEI_CERTIFICATE"?"lei":doc.doc_type==="INCORPORATION_CERTIFICATE"?"cin":null]:null}
                expanded={!!expanded[doc.doc_type]}
                onToggle={()=>setExpanded(p=>({...p,[doc.doc_type]:!p[doc.doc_type]}))}
              />
            ))}
          </div>
        </div>

        {/* Right panel */}
        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
          {/* API panel */}
          <Card noPad>
            <CardHeader title="API Verification" subtitle="Run checks against all sources" />
            {!done && !running && (
              <div style={{ padding:14 }}>
                <p style={{ fontSize:13, color:"var(--text-muted)", marginBottom:12, lineHeight:1.5 }}>
                  Calls GLEIF (LEI), India Postal API (pincode), and sandbox endpoints for PAN, GST, CIN.
                </p>
                <Btn onClick={()=>{setRunning(true);setTimeout(()=>{setRunning(false);setDone(true);},1800);}} style={{ width:"100%" }}>
                  Run Verification
                </Btn>
              </div>
            )}
            {running && (
              <div style={{ padding:14, textAlign:"center" }}>
                <div style={{ fontSize:22, marginBottom:6 }}>⟳</div>
                <div style={{ fontSize:13, color:"var(--text-muted)" }}>Calling APIs...</div>
              </div>
            )}
            {done && (
              <div>
                {apiChecks.map(c=>(
                  <div key={c.label} style={{ display:"flex", alignItems:"center", gap:10, padding:"9px 14px", borderBottom:"1px solid var(--border)" }}>
                    <div style={{ width:8, height:8, borderRadius:"50%", background:c.result.verified?"var(--success)":"var(--danger)", flexShrink:0 }} />
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:12, fontWeight:500, color:"var(--text-primary)" }}>{c.label}</div>
                      <div style={{ fontSize:11, color:"var(--text-muted)" }}>{c.source}</div>
                    </div>
                    <Badge color={c.result.verified?"green":"red"}>{c.result.verified?"Valid":"Fail"}</Badge>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* DB info */}
          <Card>
            <div style={{ fontSize:13, fontWeight:600, color:"var(--text-primary)", marginBottom:10 }}>Database</div>
            {[
              ["Session",    session?.id||"SESS_001"],
              ["Collection", "compliance_records"],
              ["Documents",  `${docs.length} saved`],
              ["Status",     "MongoDB ✓"],
            ].map(([k,v])=>(
              <div key={k} style={{ display:"flex", justifyContent:"space-between", marginBottom:7, fontSize:12 }}>
                <span style={{ color:"var(--text-muted)" }}>{k}</span>
                <span style={{ color:"var(--text-secondary)", fontFamily:k==="Session"?"var(--font-mono)":undefined }}>{v}</span>
              </div>
            ))}
          </Card>

          {/* Extraction quality */}
          <Card>
            <div style={{ fontSize:13, fontWeight:600, color:"var(--text-primary)", marginBottom:12 }}>Extraction Quality</div>
            {docs.map(d=>(
              <div key={d.doc_type} style={{ marginBottom:9 }}>
                <div style={{ fontSize:11, color:"var(--text-muted)", marginBottom:3 }}>{DOC_LABEL[d.doc_type]||d.doc_type}</div>
                <ConfidenceBar value={d.confidence||0.9} />
              </div>
            ))}
          </Card>
        </div>
      </div>
    </div>
  );
}
