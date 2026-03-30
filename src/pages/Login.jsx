import { useState } from "react";
import { useTheme } from "../hooks/useTheme";

export default function Login({ onLogin }) {
  const { theme, toggle } = useTheme();
  const [form,  setForm]  = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) { setError("Please enter email and password."); return; }
    setLoading(true);
    setError("");
    // TODO: POST /api/v1/auth/login
    setTimeout(() => {
      if (form.email === "analyst@pramanik.in" && form.password === "password") {
        onLogin({ id: "USR001", name: "Arjun Menon", email: form.email, role: "Compliance Analyst", org: "NBFC Trust Ltd" });
      } else {
        setError("Invalid credentials. Try analyst@pramanik.in / password");
        setLoading(false);
      }
    }, 800);
  };

  const s = styles(theme);

  return (
    <div style={s.page}>
      <div style={s.card}>
        {/* Logo */}
        <div style={s.logoRow}>
          <div style={s.logoIcon}>P</div>
          <div>
            <div style={s.logoName}>Pramanik</div>
            <div style={s.logoSub}>RegTech Platform</div>
          </div>
          <button onClick={toggle} style={s.themeBtn} title="Toggle theme">
            {theme === "light" ? "🌙" : "☀️"}
          </button>
        </div>

        <h1 style={s.heading}>Sign in to your account</h1>
        <p style={s.subheading}>NBFC Compliance & Fraud Detection Suite</p>

        <form onSubmit={handleSubmit} style={{ marginTop: 24 }}>
          <div style={s.fieldGroup}>
            <label style={s.label}>Email Address</label>
            <input style={s.input} type="email" placeholder="you@organisation.in"
              value={form.email} onChange={e => setForm(p => ({...p, email: e.target.value}))} />
          </div>
          <div style={s.fieldGroup}>
            <label style={s.label}>Password</label>
            <input style={s.input} type="password" placeholder="Enter your password"
              value={form.password} onChange={e => setForm(p => ({...p, password: e.target.value}))} />
          </div>

          {error && <div style={s.errorBox}>{error}</div>}

          <button type="submit" disabled={loading} style={s.submitBtn}>
            {loading ? "Signing in..." : "Sign In →"}
          </button>
        </form>

        <div style={s.hint}>
          <strong>Demo credentials:</strong> analyst@pramanik.in / password
        </div>

        <div style={s.footer}>
          Pramanik RegTech · v1.0.0 · Confidential
        </div>
      </div>
    </div>
  );
}

const styles = (theme) => ({
  page: {
    minHeight: "100vh", background: "var(--bg-base)",
    display: "flex", alignItems: "center", justifyContent: "center", padding: 24,
  },
  card: {
    width: "100%", maxWidth: 420, background: "var(--bg-card)",
    border: "1px solid var(--border)", borderRadius: 10,
    padding: "32px 36px", boxShadow: "var(--shadow-md)",
  },
  logoRow: {
    display: "flex", alignItems: "center", gap: 10, marginBottom: 28,
  },
  logoIcon: {
    width: 36, height: 36, background: "var(--accent)", borderRadius: 8,
    display: "flex", alignItems: "center", justifyContent: "center",
    fontWeight: 700, fontSize: 16, color: "#fff", flexShrink: 0,
  },
  logoName: { fontSize: 16, fontWeight: 700, color: "var(--text-primary)" },
  logoSub:  { fontSize: 11, color: "var(--text-muted)" },
  themeBtn: {
    marginLeft: "auto", background: "var(--bg-input)", border: "1px solid var(--border)",
    borderRadius: 6, padding: "4px 10px", fontSize: 14, cursor: "pointer",
  },
  heading:    { fontSize: 20, fontWeight: 700, color: "var(--text-primary)" },
  subheading: { fontSize: 13, color: "var(--text-muted)", marginTop: 4 },
  fieldGroup: { marginBottom: 16 },
  label:      { display: "block", fontSize: 13, fontWeight: 500, color: "var(--text-secondary)", marginBottom: 6 },
  input:      { width: "100%", padding: "10px 12px", fontSize: 14 },
  errorBox:   { padding: "10px 12px", background: "var(--danger-bg)", border: "1px solid var(--danger-border)", borderRadius: 6, color: "var(--danger)", fontSize: 13, marginBottom: 16 },
  submitBtn:  {
    width: "100%", padding: "11px", background: "var(--accent)", border: "none",
    borderRadius: 7, color: "#fff", fontWeight: 600, fontSize: 14, cursor: "pointer",
    marginBottom: 16,
  },
  hint: {
    fontSize: 12, color: "var(--text-muted)", background: "var(--bg-input)",
    border: "1px solid var(--border)", borderRadius: 6, padding: "10px 12px", marginBottom: 20,
  },
  footer: { fontSize: 11, color: "var(--text-faint)", textAlign: "center" },
});
