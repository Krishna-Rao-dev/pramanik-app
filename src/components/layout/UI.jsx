// ── Shared reusable UI components ────────────────────────────

export function PageHeader({ breadcrumb, title, subtitle }) {
  return (
    <div style={{ marginBottom: 24 }}>
      {breadcrumb && (
        <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 6, display: "flex", alignItems: "center", gap: 6 }}>
          {breadcrumb.map((b, i) => (
            <span key={i} style={{ display: "flex", alignItems: "center", gap: 6 }}>
              {i > 0 && <span style={{ color: "var(--border-strong)" }}>›</span>}
              <span style={{ color: i === breadcrumb.length - 1 ? "var(--text-secondary)" : "var(--text-muted)" }}>{b}</span>
            </span>
          ))}
        </div>
      )}
      <h1 style={{ fontSize: 22, fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>{title}</h1>
      {subtitle && <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 4 }}>{subtitle}</p>}
    </div>
  );
}

export function Card({ children, style = {}, noPad = false }) {
  return (
    <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8, padding: noPad ? 0 : 18, boxShadow: "var(--shadow-sm)", ...style }}>
      {children}
    </div>
  );
}

export function CardHeader({ title, subtitle, right, style = {} }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", padding: "14px 16px", borderBottom: "1px solid var(--border)", ...style }}>
      <div>
        <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>{title}</div>
        {subtitle && <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>{subtitle}</div>}
      </div>
      {right && <div>{right}</div>}
    </div>
  );
}

export function Badge({ color = "grey", children, size = "sm" }) {
  const map = {
    green:  { bg: "var(--success-bg)",  border: "var(--success-border)",  text: "var(--success)"  },
    red:    { bg: "var(--danger-bg)",   border: "var(--danger-border)",   text: "var(--danger)"   },
    amber:  { bg: "var(--warning-bg)",  border: "var(--warning-border)",  text: "var(--warning)"  },
    blue:   { bg: "var(--accent-light)",border: "var(--accent)",          text: "var(--accent)"   },
    grey:   { bg: "var(--bg-input)",    border: "var(--border)",          text: "var(--text-muted)"},
  };
  const c   = map[color] || map.grey;
  const pad = size === "sm" ? "2px 8px" : "4px 12px";
  return (
    <span style={{ fontSize: 11, fontWeight: 600, padding: pad, borderRadius: 4, background: c.bg, border: `1px solid ${c.border}`, color: c.text, letterSpacing: "0.04em", display: "inline-block" }}>
      {children}
    </span>
  );
}

export function StatusDot({ status }) {
  const map = { PASS: "green", FAIL: "red", PARTIAL: "amber", PENDING: "grey", LOW: "green", MEDIUM: "amber", HIGH: "red" };
  const colorMap = { green: "var(--success)", red: "var(--danger)", amber: "var(--warning)", grey: "var(--text-faint)" };
  const c = colorMap[map[status]] || colorMap.grey;
  return <span style={{ display: "inline-block", width: 8, height: 8, borderRadius: "50%", background: c, flexShrink: 0 }} />;
}

export function ConfidenceBar({ value, label = true }) {
  const pct   = Math.round((value || 0) * 100);
  const color = pct >= 90 ? "var(--success)" : pct >= 75 ? "var(--warning)" : "var(--danger)";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div style={{ flex: 1, height: 5, background: "var(--bg-base)", borderRadius: 3, overflow: "hidden" }}>
        <div style={{ height: 5, width: `${pct}%`, background: color, borderRadius: 3, transition: "width 0.5s ease" }} />
      </div>
      {label && <span style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "var(--font-mono)", minWidth: 30 }}>{pct}%</span>}
    </div>
  );
}

export function StepIndicator({ steps, current }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 0, marginBottom: 28 }}>
      {steps.map((s, i) => (
        <div key={s} style={{ display: "flex", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
            <div style={{
              width: 24, height: 24, borderRadius: "50%", fontSize: 11, fontWeight: 600,
              display: "flex", alignItems: "center", justifyContent: "center",
              background: current > i + 1 ? "var(--success)" : current === i + 1 ? "var(--accent)" : "var(--bg-input)",
              color: current > i + 1 ? "#fff" : current === i + 1 ? "#fff" : "var(--text-muted)",
              border: `2px solid ${current > i + 1 ? "var(--success)" : current === i + 1 ? "var(--accent)" : "var(--border)"}`,
              transition: "all 0.3s",
            }}>
              {current > i + 1 ? "✓" : i + 1}
            </div>
            <span style={{ fontSize: 12, color: current === i + 1 ? "var(--text-primary)" : "var(--text-muted)", fontWeight: current === i + 1 ? 600 : 400 }}>{s}</span>
          </div>
          {i < steps.length - 1 && <div style={{ width: 28, height: 1, background: "var(--border)", margin: "0 8px" }} />}
        </div>
      ))}
    </div>
  );
}

export function Btn({ children, onClick, disabled, variant = "primary", size = "md", style = {} }) {
  const variants = {
    primary:   { background: "var(--accent)",    color: "#fff",                  border: "1px solid var(--accent)"        },
    secondary: { background: "var(--bg-input)",  color: "var(--text-secondary)", border: "1px solid var(--border)"        },
    danger:    { background: "var(--danger-bg)", color: "var(--danger)",         border: "1px solid var(--danger-border)" },
    ghost:     { background: "transparent",      color: "var(--text-muted)",     border: "1px solid var(--border)"        },
  };
  const sizes = {
    sm: { padding: "6px 14px",  fontSize: 12 },
    md: { padding: "9px 20px",  fontSize: 13 },
    lg: { padding: "11px 28px", fontSize: 14 },
  };
  const v = variants[variant] || variants.primary;
  const z = sizes[size]       || sizes.md;
  return (
    <button onClick={onClick} disabled={disabled} style={{
      ...v, ...z, borderRadius: 7, fontWeight: 600, cursor: disabled ? "not-allowed" : "pointer",
      opacity: disabled ? 0.5 : 1, transition: "all 0.15s", ...style
    }}>
      {children}
    </button>
  );
}

export function Table({ columns, rows, emptyMsg = "No data" }) {
  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
        <thead>
          <tr style={{ background: "var(--bg-base)" }}>
            {columns.map(col => (
              <th key={col.key} style={{ padding: "10px 14px", textAlign: "left", fontSize: 11, fontWeight: 600, color: "var(--text-muted)", letterSpacing: "0.06em", textTransform: "uppercase", borderBottom: "1px solid var(--border)", whiteSpace: "nowrap" }}>
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr><td colSpan={columns.length} style={{ padding: "24px 14px", textAlign: "center", color: "var(--text-muted)", fontSize: 13 }}>{emptyMsg}</td></tr>
          ) : rows.map((row, i) => (
            <tr key={i} style={{ borderBottom: "1px solid var(--border)" }}
              onMouseEnter={e => e.currentTarget.style.background = "var(--bg-hover)"}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
              {columns.map(col => (
                <td key={col.key} style={{ padding: "10px 14px", color: "var(--text-secondary)", verticalAlign: "middle" }}>
                  {col.render ? col.render(row[col.key], row) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
