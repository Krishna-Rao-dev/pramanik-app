import { useTheme } from "../../hooks/useTheme";

const NAV = [
  {
    section: "COMPLIANCE",
    items: [
      { id: "basic",  label: "Basic Verification",  sub: "OCR & consistency checks" },
      { id: "verify", label: "API Verification",     sub: "GLEIF · GST · Sandbox"    },
    ]
  },
  {
    section: "FRAUD ANALYTICS",
    items: [
      { id: "fraud", label: "Fraud Detection",       sub: "Graph · NLP · Risk score"  },
    ]
  },
];

// Simple SVG icons (no emoji, clean)
const Icon = ({ name, size = 16, color = "currentColor" }) => {
  const icons = {
    shield:   <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.955 11.955 0 01.458 10c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.572-.608-3.75h-.152c-3.196 0-6.1-1.25-8.25-3.286z" />,
    check:    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />,
    alert:    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />,
    history:  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />,
    logout:   <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />,
    sun:      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />,
    moon:     <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />,
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8">
      {icons[name]}
    </svg>
  );
};

const navIcons = { basic: "shield", verify: "check", fraud: "alert" };

export default function Sidebar({ activePage, setActivePage, session, user, onLogout }) {
  const { theme, toggle } = useTheme();

  return (
    <aside style={{
      width: 228, background: "var(--bg-sidebar)", borderRight: "1px solid var(--border)",
      display: "flex", flexDirection: "column", flexShrink: 0,
    }}>
      {/* Logo */}
      <div style={{ padding: "18px 16px 14px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ width: 32, height: 32, background: "var(--accent)", borderRadius: 7, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 15, color: "#fff", flexShrink: 0 }}>P</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>Pramanik</div>
          <div style={{ fontSize: 10, color: "var(--text-muted)" }}>RegTech Platform</div>
        </div>
        <button onClick={toggle} style={{ background: "var(--bg-input)", border: "1px solid var(--border)", borderRadius: 6, padding: "4px 6px", display: "flex", alignItems: "center", color: "var(--text-muted)" }} title={theme === "light" ? "Dark mode" : "Light mode"}>
          <Icon name={theme === "light" ? "moon" : "sun"} size={14} />
        </button>
      </div>

      {/* Session badge */}
      {session && (
        <div style={{ margin: "10px 12px", padding: "8px 10px", background: "var(--accent-light)", border: "1px solid var(--accent)", borderRadius: 6, opacity: 0.9 }}>
          <div style={{ fontSize: 10, color: "var(--accent)", fontWeight: 600, marginBottom: 2 }}>ACTIVE SESSION</div>
          <div style={{ fontSize: 12, color: "var(--text-secondary)", fontFamily: "var(--font-mono)" }}>{session.pan}</div>
        </div>
      )}

      {/* Nav */}
      <nav style={{ flex: 1, padding: "8px 0", overflowY: "auto" }}>
        {NAV.map(group => (
          <div key={group.section} style={{ marginBottom: 4 }}>
            <div style={{ padding: "10px 16px 5px", fontSize: 10, fontWeight: 600, color: "var(--text-faint)", letterSpacing: "0.1em", textTransform: "uppercase" }}>
              {group.section}
            </div>
            {group.items.map(item => {
              const active = activePage === item.id;
              return (
                <button key={item.id} onClick={() => setActivePage(item.id)} style={{
                  width: "100%", display: "flex", alignItems: "center", gap: 10,
                  padding: "9px 16px", background: active ? "var(--accent-light)" : "transparent",
                  border: "none", borderLeft: `3px solid ${active ? "var(--accent)" : "transparent"}`,
                  cursor: "pointer", textAlign: "left",
                }}>
                  <span style={{ color: active ? "var(--accent)" : "var(--text-muted)" }}>
                    <Icon name={navIcons[item.id] || "shield"} size={15} />
                  </span>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: active ? 600 : 400, color: active ? "var(--text-primary)" : "var(--text-secondary)" }}>{item.label}</div>
                    <div style={{ fontSize: 11, color: "var(--text-faint)", marginTop: 1 }}>{item.sub}</div>
                  </div>
                </button>
              );
            })}
          </div>
        ))}

        {/* Past Records */}
        <div style={{ borderTop: "1px solid var(--border)", marginTop: 8, paddingTop: 8 }}>
          <button onClick={() => setActivePage("records")} style={{
            width: "100%", display: "flex", alignItems: "center", gap: 10,
            padding: "9px 16px", background: activePage === "records" ? "var(--accent-light)" : "transparent",
            border: "none", borderLeft: `3px solid ${activePage === "records" ? "var(--accent)" : "transparent"}`,
            cursor: "pointer", textAlign: "left",
          }}>
            <span style={{ color: activePage === "records" ? "var(--accent)" : "var(--text-muted)" }}>
              <Icon name="history" size={15} />
            </span>
            <div>
              <div style={{ fontSize: 13, fontWeight: activePage === "records" ? 600 : 400, color: activePage === "records" ? "var(--text-primary)" : "var(--text-secondary)" }}>Past Records</div>
              <div style={{ fontSize: 11, color: "var(--text-faint)", marginTop: 1 }}>Search by PAN number</div>
            </div>
          </button>
        </div>
      </nav>

      {/* User + logout */}
      <div style={{ padding: "12px 16px", borderTop: "1px solid var(--border)" }}>
        {user && (
          <div style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 13, fontWeight: 500, color: "var(--text-primary)" }}>{user.name}</div>
            <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{user.role} · {user.org}</div>
          </div>
        )}
        <button onClick={onLogout} style={{
          display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--text-muted)",
          background: "none", border: "none", padding: 0, cursor: "pointer",
        }}>
          <Icon name="logout" size={13} /> Sign out
        </button>
      </div>
    </aside>
  );
}
