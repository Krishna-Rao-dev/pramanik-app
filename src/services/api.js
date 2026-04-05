const BASE = "http://localhost:8000/api/v1";

// ── Token management ──────────────────────────────────────────
export const token = {
  get:    ()      => localStorage.getItem("pramanik_token"),
  set:    (t)     => localStorage.setItem("pramanik_token", t),
  clear:  ()      => localStorage.removeItem("pramanik_token"),
};

const authHeaders = () => ({
  "Content-Type": "application/json",
  ...(token.get() ? { Authorization: `Bearer ${token.get()}` } : {}),
});

const authHeadersNoContent = () => ({
  ...(token.get() ? { Authorization: `Bearer ${token.get()}` } : {}),
});

// ── Generic fetch wrapper ─────────────────────────────────────
async function apiFetch(path, opts = {}) {
  const res = await fetch(`${BASE}${path}`, opts);
  if (res.status === 401) {
    token.clear();
    window.location.reload();
  }
  return res;
}

export const api = {
  // ── Auth ──────────────────────────────────────────────────
  login:  (data)  => apiFetch("/auth/login",  { method: "POST", body: JSON.stringify(data), headers: authHeaders() }),
  logout: ()      => apiFetch("/auth/logout",  { method: "POST", headers: authHeaders() }),
  me:     ()      => apiFetch("/auth/me",      { headers: authHeaders() }),
  seed:   ()      => apiFetch("/auth/seed",    { method: "POST" }),

  // ── Sessions ──────────────────────────────────────────────
  createSession: (pan) =>
    apiFetch("/session/create", { method: "POST", body: JSON.stringify({ pan }), headers: authHeaders() }),
  getSession:    (id)  =>
    apiFetch(`/session/${id}`,  { headers: authHeaders() }),
  listSessions:  ()    =>
    apiFetch("/session/list/all", { headers: authHeaders() }),

  // ── Compliance OCR (multipart) ─────────────────────────────
  uploadDocuments: (formData) =>
    apiFetch("/compliance/upload", { method: "POST", body: formData, headers: authHeadersNoContent() }),

  // OCR SSE — returns EventSource-compatible URL
  ocrSSEUrl: (sessionId) => `${BASE}/compliance/ocr/${sessionId}`,

  getCrossCheck:  (sessionId) =>
    apiFetch(`/compliance/crosscheck/${sessionId}`, { headers: authHeaders() }),
  flagAIError: (sessionId, parameter, isAiError) =>
    apiFetch(`/compliance/aierror/${sessionId}`, {
      method: "PATCH",
      body: JSON.stringify({ parameter, is_ai_error: isAiError }),
      headers: authHeaders(),
    }),

  // ── API Verification ────────────────────────────────────────
  runVerification: (sessionId) =>
    apiFetch(`/verify/run/${sessionId}`, { method: "POST", headers: authHeaders() }),
  getVerification: (sessionId) =>
    apiFetch(`/verify/result/${sessionId}`, { headers: authHeaders() }),
  verifyPAN:       (pan)    => apiFetch(`/verify/pan/${pan}`,    { headers: authHeaders() }),
  verifyGST:       (gstin)  => apiFetch(`/verify/gst/${gstin}`,  { headers: authHeaders() }),
  verifyLEI:       (lei)    => apiFetch(`/verify/lei/${lei}`,    { headers: authHeaders() }),
  verifyCIN:       (cin)    => apiFetch(`/verify/cin/${cin}`,    { headers: authHeaders() }),
  verifyPincode:   (pin)    => apiFetch(`/verify/pincode/${pin}`,{ headers: authHeaders() }),

  // ── Fraud Analytics ─────────────────────────────────────────
  uploadFraudDocs: (formData) =>
    apiFetch("/fraud/upload", { method: "POST", body: formData, headers: authHeadersNoContent() }),

  // Fraud SSE
  fraudSSEUrl: (sessionId) => `${BASE}/fraud/analyze/${sessionId}`,

  getFraudResult:  (sessionId) =>
    apiFetch(`/fraud/result/${sessionId}`,   { headers: authHeaders() }),
  getEntityGraph:  (sessionId) =>
    apiFetch(`/fraud/graph/${sessionId}`,    { headers: authHeaders() }),
  getNLPSummary:   (sessionId) =>
    apiFetch(`/fraud/summary/${sessionId}`,  { headers: authHeaders() }),
  getRiskScore:    (sessionId) =>
    apiFetch(`/fraud/riskscore/${sessionId}`,{ headers: authHeaders() }),

  // ── Past Records ─────────────────────────────────────────────
  searchRecords: (q)   =>
    apiFetch(`/records/search?q=${encodeURIComponent(q)}`, { headers: authHeaders() }),
  searchByPAN:   (pan) =>
    apiFetch(`/records/search?pan=${encodeURIComponent(pan)}`, { headers: authHeaders() }),
  listRecords:   (page = 1, limit = 20) =>
    apiFetch(`/records/list?page=${page}&limit=${limit}`, { headers: authHeaders() }),
  getRecord:     (sessionId) =>
    apiFetch(`/records/${sessionId}`, { headers: authHeaders() }),
  getComplianceReport: (sessionId) =>
    apiFetch(`/records/${sessionId}/compliance`, { headers: authHeaders() }),
  getFraudReport:      (sessionId) =>
    apiFetch(`/records/${sessionId}/fraud`,      { headers: authHeaders() }),

  // ── Export (PDF download) ────────────────────────────────────
  exportCompliancePDF: (sessionId) =>
    `${BASE}/export/compliance/${sessionId}?token=${token.get()}`,
  exportFraudPDF:      (sessionId) =>
    `${BASE}/export/fraud/${sessionId}?token=${token.get()}`,
  exportFullPDF:       (sessionId) =>
    `${BASE}/export/full/${sessionId}?token=${token.get()}`,

  // Authenticated PDF download helper
  downloadPDF: async (sessionId, type = "compliance") => {
    const res = await apiFetch(`/export/${type}/${sessionId}`, { headers: authHeadersNoContent() });
    if (!res.ok) throw new Error("PDF generation failed");
    const blob = await res.blob();
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = `${type}_${sessionId}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  },
};

// ── SSE helper — opens authenticated SSE stream ───────────────
export function openSSE(url, onMessage, onComplete, onError) {
  // Attach token as query param since EventSource doesn't support headers
  const fullUrl = `${url}?token=${token.get()}`;
  const es      = new EventSource(fullUrl);

  es.onmessage = (e) => {
    const data = JSON.parse(e.data);
    onMessage(data);
    if (data.status === "done" || data.status === "error") {
      es.close();
      if (data.status === "done")  onComplete(data);
      if (data.status === "error") onError?.(data);
    }
  };

  es.onerror = (err) => {
    es.close();
    onError?.(err);
  };

  return es;
}

// ── Keep MOCK for reference / fallback during dev ─────────────
export const MOCK = {
  user: { id: "USR001", name: "Arjun Menon", email: "arjun.menon@pramanik.in", role: "Compliance Analyst", org: "NBFC Trust Ltd" },

  crossCheck: {
    passed: [
      { parameter: "Company Name", value: "MANIKANDAN CONSTRUCTIONS PVT LTD", docs: ["PAN_CARD","GST_CERTIFICATE","LEI_CERTIFICATE","INCORPORATION_CERTIFICATE","MOA","AOA","REGISTERED_ADDRESS","ELECTRICITY_BILL","TELEPHONE_BILL"] },
      { parameter: "Pincode",      value: "600018",                            docs: ["GST_CERTIFICATE","REGISTERED_ADDRESS","ELECTRICITY_BILL","TELEPHONE_BILL"] },
      { parameter: "GSTIN",        value: "33AAKCM1234C1ZP",                   docs: ["GST_CERTIFICATE","REGISTERED_ADDRESS"] },
      { parameter: "CIN",          value: "U45200TN2015PTC123456",             docs: ["INCORPORATION_CERTIFICATE","MOA","AOA","REGISTERED_ADDRESS"] },
    ],
    failed: [
      { parameter: "PAN Number", majority_value: "AAKCM1234C", inconsistent_docs: ["PAN_CARD"], inconsistent_values: ["AKCM1234C"],
        all_values: { PAN_CARD: "AKCM1234C", GST_CERTIFICATE: "AAKCM1234C", LEI_CERTIFICATE: "AAKCM1234C", INCORPORATION_CERTIFICATE: "AAKCM1234C", REGISTERED_ADDRESS: "AAKCM1234C" } },
    ],
    warnings: [
      { parameter: "Address", missing_from: ["INCORPORATION_CERTIFICATE"], issue: "Field not extracted — possible OCR issue" }
    ]
  },

  documents: [
    { doc_type: "PAN_CARD",                  source_file: "01_Company_PAN_Card.png",             status: "EXTRACTED", confidence: 0.97, fields: { pan_number: "AAKCM1234C", entity_name: "MANIKANDAN CONSTRUCTIONS PVT LTD", date_of_reg: "15/04/2015", entity_type: "COMPANY" } },
    { doc_type: "GST_CERTIFICATE",           source_file: "02_GST_Certificate.pdf",              status: "EXTRACTED", confidence: 0.94, fields: { gstin: "33AAKCM1234C1ZP", legal_name: "MANIKANDAN CONSTRUCTIONS PVT LTD", status: "ACTIVE", state: "Tamil Nadu", registration_date: "15/04/2015" } },
    { doc_type: "LEI_CERTIFICATE",           source_file: "03_LEI_Certificate.pdf",              status: "EXTRACTED", confidence: 0.96, fields: { lei_code: "335800AAKCM12345678X", legal_name: "MANIKANDAN CONSTRUCTIONS PVT LTD", status: "ACTIVE", renewal_date: "01/04/2025" } },
    { doc_type: "INCORPORATION_CERTIFICATE", source_file: "04_Certificate_of_Incorporation.pdf", status: "EXTRACTED", confidence: 0.93, fields: { company_name: "MANIKANDAN CONSTRUCTIONS PVT LTD", cin: "U45200TN2015PTC123456", date_of_incorp: "15/04/2015", authorized_capital: "2500000" } },
    { doc_type: "MOA",                       source_file: "05_MOA.pdf",                          status: "EXTRACTED", confidence: 0.89, fields: { company_name: "MANIKANDAN CONSTRUCTIONS PVT LTD", authorized_capital: "2500000" } },
    { doc_type: "AOA",                       source_file: "06_AOA.pdf",                          status: "EXTRACTED", confidence: 0.88, fields: { company_name: "MANIKANDAN CONSTRUCTIONS PVT LTD", directors: [{ name: "D MANIKANDAN", din: "06712345" },{ name: "S RAJESHWARI", din: "07823456" }] } },
    { doc_type: "REGISTERED_ADDRESS",        source_file: "07_Registered_Address_INC22.pdf",     status: "EXTRACTED", confidence: 0.95, fields: { company_name: "MANIKANDAN CONSTRUCTIONS PVT LTD", city: "Chennai", pincode: "600018", status: "APPROVED" } },
    { doc_type: "ELECTRICITY_BILL",          source_file: "08_Electricity_Bill.pdf",             status: "EXTRACTED", confidence: 0.91, fields: { consumer_name: "MANIKANDAN CONSTRUCTIONS PVT LTD", bill_date: "20/11/2024", total_amount: "4693.70", units_consumed: "552" } },
    { doc_type: "TELEPHONE_BILL",            source_file: "09_Telephone_Landline_Bill.pdf",      status: "EXTRACTED", confidence: 0.87, fields: { account_name: "MANIKANDAN CONSTRUCTIONS PVT LTD", telephone_number: "044-28140055", bill_date: "25/11/2024", total_amount: "786.65" } },
  ],

  apiVerification: {
    pan:     { verified: true,  status: "ACTIVE",   source: "SANDBOX",     name: "MANIKANDAN CONSTRUCTIONS PVT LTD", type: "Company" },
    gst:     { verified: true,  status: "Active",   source: "GST_PORTAL",  legal_name: "MANIKANDAN CONSTRUCTIONS PVT LTD", state: "Tamil Nadu" },
    lei:     { verified: true,  status: "ISSUED",   source: "GLEIF",       legal_name: "MANIKANDAN CONSTRUCTIONS PVT LTD", corroboration: "FULLY_CORROBORATED" },
    cin:     { verified: true,  status: "Active",   source: "MCA21",       company_name: "MANIKANDAN CONSTRUCTIONS PVT LTD", roc: "ROC Chennai" },
    pincode: { verified: true,  state: "Tamil Nadu",source: "POSTAL_API",  district: "Chennai" },
  },

  fraudAnalysis: {
    riskScore: 34, riskLevel: "LOW",
    entityGraph: {
      nodes: [
        { id: "company",  label: "MANIKANDAN\nCONSTRUCTIONS PVT LTD", type: "company",  risk: "low"    },
        { id: "dir1",     label: "D MANIKANDAN",                        type: "person",   risk: "low"    },
        { id: "dir2",     label: "S RAJESHWARI",                        type: "person",   risk: "low"    },
        { id: "companyB", label: "RAJESH INFRA\nPVT LTD",               type: "company",  risk: "medium" },
        { id: "companyC", label: "DURAISAMY\nHOLDINGS",                 type: "company",  risk: "low"    },
        { id: "bank1",    label: "HDFC BANK LTD",                       type: "bank",     risk: "low"    },
      ],
      edges: [
        { from: "dir1",    to: "company",  label: "Director 50%",    type: "ownership"    },
        { from: "dir2",    to: "company",  label: "Director 50%",    type: "ownership"    },
        { from: "dir1",    to: "companyB", label: "Director",        type: "directorship" },
        { from: "companyC",to: "company",  label: "Owns 20%",        type: "ownership"    },
        { from: "dir1",    to: "companyC", label: "Beneficial Owner",type: "beneficial"   },
        { from: "company", to: "bank1",    label: "Loan Account",    type: "financial"    },
      ]
    },
    nlpSummary: [
      "MANIKANDAN CONSTRUCTIONS PVT LTD is a Chennai-based private limited company incorporated in April 2015 with an authorized capital of Rs. 25 Lakhs.",
      "The company has two directors — D MANIKANDAN (DIN: 06712345) and S RAJESHWARI (DIN: 07823456), both holding equal 50% ownership.",
      "D MANIKANDAN also holds directorship in RAJESH INFRA PVT LTD, indicating potential related party exposure that warrants further review.",
      "DURAISAMY HOLDINGS holds 20% indirect stake through D MANIKANDAN's beneficial ownership — this creates a layered ownership structure.",
      "All primary compliance documents (PAN, GST, LEI, CIN) are verified and active. No adverse media or sanctions matches found.",
      "One minor OCR inconsistency detected in PAN card — likely an extraction error, not a fraud signal.",
      "Overall risk classification: LOW. Recommended action: Standard due diligence with periodic RPT monitoring.",
    ],
    persons: [
      { name: "D MANIKANDAN", role: "Director & Promoter", din: "06712345", pan: "BNZPM2501F", dob: "16/07/1986", address: "Chennai, TN", pep: false, sanctions: false, otherDirectorships: ["RAJESH INFRA PVT LTD"], riskScore: 28 },
      { name: "S RAJESHWARI",  role: "Director",           din: "07823456", pan: "ZZZZR8765K", dob: "22/03/1989", address: "Chennai, TN", pep: false, sanctions: false, otherDirectorships: [], riskScore: 12 },
    ],
    rpt: [
      { entity: "RAJESH INFRA PVT LTD",  relationship: "D MANIKANDAN is Director",      transactionType: "Potential Sub-contract", amount: "Unknown",    riskLevel: "MEDIUM", flagReason: "Common director — monitor for fund diversion" },
      { entity: "DURAISAMY HOLDINGS",    relationship: "Beneficial Owner via D MANIKANDAN", transactionType: "Indirect Ownership",  amount: "20% stake",  riskLevel: "LOW",    flagReason: "Layered ownership — standard disclosure required" },
    ],
  },

  pastRecords: [
    { id: "REC001", pan: "AAKCM1234C", company: "MANIKANDAN CONSTRUCTIONS PVT LTD", date: "2024-11-20", complianceStatus: "PASS", fraudRisk: "LOW",    analyst: "Arjun Menon"   },
    { id: "REC002", pan: "AABCS1429B", company: "SUNRISE REAL ESTATE PVT LTD",      date: "2024-11-18", complianceStatus: "FAIL", fraudRisk: "MEDIUM", analyst: "Priya Sharma"  },
    { id: "REC003", pan: "AAFCA5809E", company: "COASTAL INFRA LTD",                date: "2024-11-15", complianceStatus: "PASS", fraudRisk: "LOW",    analyst: "Arjun Menon"   },
    { id: "REC004", pan: "ZZZZZ9999Z", company: "SHELL CORP LTD",                   date: "2024-11-10", complianceStatus: "FAIL", fraudRisk: "HIGH",   analyst: "Rahul Verma"   },
    { id: "REC005", pan: "AABCF1234D", company: "FORWARD BUILDERS PVT LTD",         date: "2024-11-05", complianceStatus: "PASS", fraudRisk: "LOW",    analyst: "Priya Sharma"  },
  ]
};