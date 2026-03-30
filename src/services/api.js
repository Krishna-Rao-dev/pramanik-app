const BASE = "http://localhost:8000/api/v1";

export const api = {
  // ── Auth ────────────────────────────────────────────────
  login:              (data)       => fetch(`${BASE}/auth/login`,        { method: "POST", body: JSON.stringify(data),       headers: { "Content-Type": "application/json" } }),
  logout:             ()           => fetch(`${BASE}/auth/logout`,       { method: "POST" }),
  me:                 ()           => fetch(`${BASE}/auth/me`),

  // ── Sessions ─────────────────────────────────────────────
  createSession:      (pan)        => fetch(`${BASE}/session/create`,    { method: "POST", body: JSON.stringify({ pan }),     headers: { "Content-Type": "application/json" } }),
  getSession:         (id)         => fetch(`${BASE}/session/${id}`),
  listSessions:       ()           => fetch(`${BASE}/session/list`),

  // ── Compliance OCR ───────────────────────────────────────
  uploadDocuments:    (formData)   => fetch(`${BASE}/compliance/upload`, { method: "POST", body: formData }),
  runOCR:             (sessionId)  => fetch(`${BASE}/compliance/ocr/${sessionId}`,              { method: "POST" }),
  getCrossCheck:      (sessionId)  => fetch(`${BASE}/compliance/crosscheck/${sessionId}`),
  flagAIError:        (id, flag)   => fetch(`${BASE}/compliance/aierror/${id}`,                 { method: "PATCH", body: JSON.stringify({ is_ai_error: flag }), headers: { "Content-Type": "application/json" } }),

  // ── API Verification ─────────────────────────────────────
  runVerification:    (sessionId)  => fetch(`${BASE}/verify/run/${sessionId}`,                  { method: "POST" }),
  getVerification:    (sessionId)  => fetch(`${BASE}/verify/result/${sessionId}`),
  // Individual checks
  verifyPAN:          (pan)        => fetch(`${BASE}/verify/pan/${pan}`),
  verifyGST:          (gstin)      => fetch(`${BASE}/verify/gst/${gstin}`),
  verifyLEI:          (lei)        => fetch(`${BASE}/verify/lei/${lei}`),           // → GLEIF (real, free)
  verifyCIN:          (cin)        => fetch(`${BASE}/verify/cin/${cin}`),
  verifyPincode:      (pin)        => fetch(`${BASE}/verify/pincode/${pin}`),       // → PostalAPI (real, free)

  // ── Fraud Analytics ──────────────────────────────────────
  uploadFraudDocs:    (formData)   => fetch(`${BASE}/fraud/upload`,                 { method: "POST", body: formData }),
  runFraudAnalysis:   (sessionId)  => fetch(`${BASE}/fraud/analyze/${sessionId}`,   { method: "POST" }),
  getFraudResult:     (sessionId)  => fetch(`${BASE}/fraud/result/${sessionId}`),
  getEntityGraph:     (sessionId)  => fetch(`${BASE}/fraud/graph/${sessionId}`),
  getNLPSummary:      (sessionId)  => fetch(`${BASE}/fraud/summary/${sessionId}`),
  getRiskScore:       (sessionId)  => fetch(`${BASE}/fraud/riskscore/${sessionId}`),

  // ── Past Records (MongoDB) ───────────────────────────────
  searchByPAN:        (pan)        => fetch(`${BASE}/records/search?pan=${pan}`),
  getRecord:          (recordId)   => fetch(`${BASE}/records/${recordId}`),
  listRecords:        (page, limit)=> fetch(`${BASE}/records/list?page=${page}&limit=${limit}`),
  getComplianceReport:(recordId)   => fetch(`${BASE}/records/${recordId}/compliance`),
  getFraudReport:     (recordId)   => fetch(`${BASE}/records/${recordId}/fraud`),
};

// ── Mock data ────────────────────────────────────────────────
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
