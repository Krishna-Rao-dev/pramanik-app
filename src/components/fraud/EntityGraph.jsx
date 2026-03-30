import { useRef, useEffect, useState } from "react";

// ── SVG icon paths (proper icons, no emoji) ──────────────────
const ICONS = {
  person: (cx, cy, r) => `
    M${cx} ${cy - r * 0.3} 
    m-${r*0.28} 0 
    a${r*0.28} ${r*0.28} 0 1 1 ${r*0.56} 0 
    a${r*0.28} ${r*0.28} 0 1 1 -${r*0.56} 0
    M${cx - r*0.45} ${cy + r*0.65} 
    q0 -${r*0.55} ${r*0.45} -${r*0.55} 
    q${r*0.45} 0 ${r*0.45} ${r*0.55}
  `,
  company: (cx, cy, r) => `
    M${cx - r*0.45} ${cy + r*0.5}
    L${cx - r*0.45} ${cy - r*0.1}
    L${cx} ${cy - r*0.6}
    L${cx + r*0.45} ${cy - r*0.1}
    L${cx + r*0.45} ${cy + r*0.5}
    Z
    M${cx - r*0.15} ${cy + r*0.5} L${cx - r*0.15} ${cy + r*0.1} L${cx + r*0.15} ${cy + r*0.1} L${cx + r*0.15} ${cy + r*0.5}
  `,
  bank: (cx, cy, r) => `
    M${cx - r*0.5} ${cy - r*0.1} L${cx} ${cy - r*0.6} L${cx + r*0.5} ${cy - r*0.1} Z
    M${cx - r*0.45} ${cy - r*0.05} L${cx - r*0.45} ${cy + r*0.35}
    M${cx - r*0.15} ${cy - r*0.05} L${cx - r*0.15} ${cy + r*0.35}
    M${cx + r*0.15} ${cy - r*0.05} L${cx + r*0.15} ${cy + r*0.35}
    M${cx + r*0.45} ${cy - r*0.05} L${cx + r*0.45} ${cy + r*0.35}
    M${cx - r*0.5} ${cy + r*0.4} L${cx + r*0.5} ${cy + r*0.4}
    M${cx - r*0.5} ${cy + r*0.55} L${cx + r*0.5} ${cy + r*0.55}
  `,
};

const TYPE_COLORS = {
  person:  { fill: "#dbeafe", stroke: "#2563eb", icon: "#1d4ed8" },
  company: { fill: "#dcfce7", stroke: "#16a34a", icon: "#15803d" },
  bank:    { fill: "#fef9c3", stroke: "#ca8a04", icon: "#92400e" },
};

const EDGE_STYLES = {
  ownership:    { color: "#2563eb", dash: [],       label: true  },
  directorship: { color: "#16a34a", dash: [5,3],    label: true  },
  beneficial:   { color: "#dc2626", dash: [8,4],    label: true  },
  financial:    { color: "#ca8a04", dash: [3,3],    label: true  },
};

// Fixed positions for our 6 nodes
const POSITIONS = {
  company:  { x: 310, y: 200 },
  dir1:     { x: 150, y:  80 },
  dir2:     { x: 470, y:  80 },
  companyB: { x:  90, y: 310 },
  companyC: { x: 195, y: 340 },
  bank1:    { x: 490, y: 310 },
};

export default function EntityGraph({ nodes, edges }) {
  const [hovered, setHovered] = useState(null);
  const [tooltip, setTooltip] = useState(null);
  const svgRef = useRef(null);

  const W = 620, H = 440;
  const R = 36; // node radius

  const getPos = (id) => POSITIONS[id] || { x: W/2, y: H/2 };

  // Arrow at end of edge
  const arrowHead = (fromId, toId, color) => {
    const from = getPos(fromId);
    const to   = getPos(toId);
    const angle= Math.atan2(to.y - from.y, to.x - from.x);
    const ax   = to.x - (R + 4) * Math.cos(angle);
    const ay   = to.y - (R + 4) * Math.sin(angle);
    const p1x  = ax - 9 * Math.cos(angle - 0.4);
    const p1y  = ay - 9 * Math.sin(angle - 0.4);
    const p2x  = ax - 9 * Math.cos(angle + 0.4);
    const p2y  = ay - 9 * Math.sin(angle + 0.4);
    return `M${ax},${ay} L${p1x},${p1y} L${p2x},${p2y} Z`;
  };

  return (
    <div style={{ position: "relative", background: "var(--bg-base)", borderRadius: 8 }}>
      <svg ref={svgRef} width="100%" viewBox={`0 0 ${W} ${H}`} style={{ display: "block" }}>
        {/* Edges */}
        {edges.map((edge, i) => {
          const from  = getPos(edge.from);
          const to    = getPos(edge.to);
          const style = EDGE_STYLES[edge.type] || EDGE_STYLES.ownership;
          const mx    = (from.x + to.x) / 2;
          const my    = (from.y + to.y) / 2;
          const angle = Math.atan2(to.y - from.y, to.x - from.x) * 180 / Math.PI;

          // Shorten line to not overlap node circles
          const dist  = Math.hypot(to.x - from.x, to.y - from.y);
          const ux    = (to.x - from.x) / dist;
          const uy    = (to.y - from.y) / dist;
          const x1    = from.x + ux * (R + 2);
          const y1    = from.y + uy * (R + 2);
          const x2    = to.x   - ux * (R + 6);
          const y2    = to.y   - uy * (R + 6);

          return (
            <g key={i}>
              <line x1={x1} y1={y1} x2={x2} y2={y2}
                stroke={style.color} strokeWidth={1.5}
                strokeDasharray={style.dash.join(",")}
                opacity={0.7}
              />
              <path d={arrowHead(edge.from, edge.to, style.color)} fill={style.color} opacity={0.7} />
              {/* Edge label */}
              <text x={mx} y={my - 5} textAnchor="middle"
                fontSize="9" fill={style.color} fontFamily="Inter, sans-serif"
                transform={`rotate(${Math.abs(angle) > 90 ? angle + 180 : angle}, ${mx}, ${my - 5})`}>
                {edge.label}
              </text>
            </g>
          );
        })}

        {/* Nodes */}
        {nodes.map(node => {
          const pos    = getPos(node.id);
          const colors = TYPE_COLORS[node.type] || TYPE_COLORS.person;
          const isHov  = hovered === node.id;
          const lines  = node.label.split("\n");

          return (
            <g key={node.id}
              onMouseEnter={() => setHovered(node.id)}
              onMouseLeave={() => setHovered(null)}
              style={{ cursor: "pointer" }}
            >
              {/* Glow on hover */}
              {isHov && (
                <circle cx={pos.x} cy={pos.y} r={R + 8}
                  fill={colors.stroke} opacity={0.12} />
              )}
              {/* Circle */}
              <circle cx={pos.x} cy={pos.y} r={R}
                fill={colors.fill}
                stroke={colors.stroke}
                strokeWidth={isHov ? 2.5 : 1.8}
              />
              {/* Icon */}
              <path d={ICONS[node.type]?.(pos.x, pos.y, R) || ""}
                fill="none" stroke={colors.icon} strokeWidth="1.5"
                strokeLinecap="round" strokeLinejoin="round"
              />
              {/* Label below node */}
              {lines.map((line, li) => (
                <text key={li}
                  x={pos.x} y={pos.y + R + 14 + li * 12}
                  textAnchor="middle" fontSize="10"
                  fill="var(--text-secondary)"
                  fontFamily="Inter, sans-serif"
                  fontWeight={isHov ? "600" : "400"}
                >
                  {line}
                </text>
              ))}
            </g>
          );
        })}
      </svg>

      {/* Legend */}
      <div style={{ padding: "10px 16px", borderTop: "1px solid var(--border)", display: "flex", gap: 20, flexWrap: "wrap" }}>
        {Object.entries(TYPE_COLORS).map(([type, c]) => (
          <div key={type} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <svg width="14" height="14" viewBox="0 0 14 14">
              <circle cx="7" cy="7" r="6" fill={c.fill} stroke={c.stroke} strokeWidth="1.5" />
            </svg>
            <span style={{ fontSize: 11, color: "var(--text-muted)", textTransform: "capitalize" }}>{type}</span>
          </div>
        ))}
        {Object.entries(EDGE_STYLES).map(([type, s]) => (
          <div key={type} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <svg width="22" height="8" viewBox="0 0 22 8">
              <line x1="1" y1="4" x2="21" y2="4" stroke={s.color} strokeWidth="1.5" strokeDasharray={s.dash.join(",")} />
            </svg>
            <span style={{ fontSize: 11, color: "var(--text-muted)", textTransform: "capitalize" }}>{type}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
