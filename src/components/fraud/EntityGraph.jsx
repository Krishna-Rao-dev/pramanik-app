import { useRef, useEffect, useState, useCallback } from "react";

const TYPE_COLORS = {
  person:  { fill: "#1e3a5f", stroke: "#4d8eff", text: "#93c5fd" },
  company: { fill: "#14532d", stroke: "#22c55e", text: "#86efac" },
  bank:    { fill: "#451a03", stroke: "#f59e0b", text: "#fcd34d" },
};

const EDGE_COLORS = {
  ownership:    "#4d8eff",
  directorship: "#22c55e",
  beneficial:   "#f87171",
  financial:    "#f59e0b",
};

const NODE_R = 32;

// Simple force simulation
function useForceLayout(nodes, edges, W, H) {
  const [positions, setPositions] = useState({});
  const frameRef = useRef(null);
  const posRef   = useRef({});
  const velRef   = useRef({});

  useEffect(() => {
    if (!nodes.length) return;

    // Init positions in a circle
    const cx = W / 2, cy = H / 2;
    const r  = Math.min(W, H) * 0.32;
    const init = {};
    const vel  = {};
    nodes.forEach((n, i) => {
      const angle = (2 * Math.PI * i) / nodes.length - Math.PI / 2;
      init[n.id] = posRef.current[n.id] || {
        x: cx + r * Math.cos(angle),
        y: cy + r * Math.sin(angle),
      };
      vel[n.id] = { x: 0, y: 0 };
    });
    posRef.current = init;
    velRef.current = vel;

    let alpha = 1.0;

    const tick = () => {
      if (alpha < 0.005) return;
      alpha *= 0.96;

      const pos = posRef.current;
      const v   = velRef.current;

      // Repulsion between all node pairs
      const ids = nodes.map(n => n.id);
      for (let i = 0; i < ids.length; i++) {
        for (let j = i + 1; j < ids.length; j++) {
          const a = pos[ids[i]], b = pos[ids[j]];
          const dx = b.x - a.x, dy = b.y - a.y;
          const dist = Math.max(Math.sqrt(dx * dx + dy * dy), 1);
          const force = (6000 / (dist * dist)) * alpha;
          const fx = (dx / dist) * force;
          const fy = (dy / dist) * force;
          v[ids[i]].x -= fx; v[ids[i]].y -= fy;
          v[ids[j]].x += fx; v[ids[j]].y += fy;
        }
      }

      // Attraction along edges
      edges.forEach(e => {
        const a = pos[e.from], b = pos[e.to];
        if (!a || !b) return;
        const dx = b.x - a.x, dy = b.y - a.y;
        const dist = Math.max(Math.sqrt(dx * dx + dy * dy), 1);
        const ideal = 160;
        const force = ((dist - ideal) / dist) * 0.06 * alpha;
        const fx = dx * force, fy = dy * force;
        v[e.from].x += fx; v[e.from].y += fy;
        v[e.to].x   -= fx; v[e.to].y   -= fy;
      });

      // Center gravity
      ids.forEach(id => {
        v[id].x += (cx - pos[id].x) * 0.008 * alpha;
        v[id].y += (cy - pos[id].y) * 0.008 * alpha;
      });

      // Apply velocity + boundary
      const newPos = {};
      ids.forEach(id => {
        v[id].x *= 0.7;
        v[id].y *= 0.7;
        newPos[id] = {
          x: Math.max(NODE_R + 10, Math.min(W - NODE_R - 10, pos[id].x + v[id].x)),
          y: Math.max(NODE_R + 10, Math.min(H - NODE_R - 10, pos[id].y + v[id].y)),
        };
      });
      posRef.current = newPos;
      setPositions({ ...newPos });

      frameRef.current = requestAnimationFrame(tick);
    };

    frameRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameRef.current);
  }, [nodes.map(n => n.id).join(","), edges.length]);

  return { positions: posRef.current, setPositions, posRef };
}

export default function EntityGraph({ nodes, edges }) {
  const W = 760, H = 500;
  const svgRef  = useRef(null);
  const { positions, setPositions, posRef } = useForceLayout(nodes, edges, W, H);
  const [dragging, setDragging] = useState(null);
  const [hovered,  setHovered]  = useState(null);
  const dragOffset = useRef({ x: 0, y: 0 });

  // Drag handlers
  const onMouseDown = useCallback((e, nodeId) => {
    e.preventDefault();
    const svg    = svgRef.current;
    const pt     = svg.createSVGPoint();
    pt.x = e.clientX; pt.y = e.clientY;
    const svgP   = pt.matrixTransform(svg.getScreenCTM().inverse());
    const pos    = posRef.current[nodeId] || { x: W / 2, y: H / 2 };
    dragOffset.current = { x: svgP.x - pos.x, y: svgP.y - pos.y };
    setDragging(nodeId);
  }, []);

  const onMouseMove = useCallback((e) => {
    if (!dragging) return;
    const svg  = svgRef.current;
    const pt   = svg.createSVGPoint();
    pt.x = e.clientX; pt.y = e.clientY;
    const svgP = pt.matrixTransform(svg.getScreenCTM().inverse());
    const newX = Math.max(NODE_R + 10, Math.min(W - NODE_R - 10, svgP.x - dragOffset.current.x));
    const newY = Math.max(NODE_R + 10, Math.min(H - NODE_R - 10, svgP.y - dragOffset.current.y));
    posRef.current = { ...posRef.current, [dragging]: { x: newX, y: newY } };
    setPositions({ ...posRef.current });
  }, [dragging]);

  const onMouseUp = useCallback(() => setDragging(null), []);

  const handleDownloadPNG = () => {
    const svgElement = svgRef.current;
    if (!svgElement) return;

    const serializer = new XMLSerializer();
    let source = serializer.serializeToString(svgElement);
    
    if(!source.match(/^<svg[^>]+xmlns="http\:\/\/www\.w3\.org\/2000\/svg"/)){
        source = source.replace(/^<svg/, '<svg xmlns="http://www.w3.org/2000/svg"');
    }
    
    source = source.replace(/var\(--bg-sidebar\)/gi, '#1e293b');
    source = source.replace(/var\(--text-muted\)/gi, '#94a3b8');
    source = source.replace(/var\(--text-faint\)/gi, '#475569');

    const svgBlob = new Blob([source], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(svgBlob);
    
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = W * 2;
      canvas.height = H * 2;
      const ctx = canvas.getContext("2d");
      
      ctx.fillStyle = "#0f172a";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      ctx.scale(2, 2);
      ctx.drawImage(img, 0, 0, W, H);
      
      const pngUrl = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.href = pngUrl;
      link.download = "fraud_graph_snapshot.png";
      link.click();
      URL.revokeObjectURL(url);
    };
    img.src = url;
  };

  if (!nodes.length) {
    return (
      <div style={{ padding: 40, textAlign: "center", color: "var(--text-muted)", fontSize: 13 }}>
        No entity graph data available.
      </div>
    );
  }

  return (
    <div style={{ position: "relative", userSelect: "none" }}>
      {/* Top right actions */}
      <div style={{ position: "absolute", top: 10, right: 14, display: "flex", gap: "10px", zIndex: 10 }}>
        <button
          onClick={handleDownloadPNG}
          style={{
            background: "var(--bg-sidebar, #1e293b)", border: "1px solid var(--border)", borderRadius: "4px",
            color: "var(--text-muted)", padding: "4px 8px", fontSize: "11px", cursor: "pointer",
            display: "flex", alignItems: "center", gap: "4px"
          }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
          </svg>
          Snapshot
        </button>
        <div style={{ fontSize: 11, color: "var(--text-faint)", pointerEvents: "none", alignSelf: "center", display: "flex", alignItems: "center" }}>
          drag nodes to rearrange
        </div>
      </div>

      <svg
        ref={svgRef}
        width="100%"
        viewBox={`0 0 ${W} ${H}`}
        style={{ display: "block", cursor: dragging ? "grabbing" : "default" }}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
      >
        <defs>
          {/* Drop shadow filter */}
          <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="2" stdDeviation="4" floodOpacity="0.4" />
          </filter>
        </defs>

        {/* Edges */}
        {edges.map((edge, i) => {
          if (!positions[edge.from] || !positions[edge.to]) return null;
          const a = positions[edge.from], b = positions[edge.to];
          const color  = EDGE_COLORS[edge.type] || EDGE_COLORS.ownership;
          const dash   = edge.type === "directorship" ? "6,3" :
                         edge.type === "beneficial"    ? "10,4" :
                         edge.type === "financial"     ? "3,3" : "";
          const active = hovered === edge.from || hovered === edge.to;

          const samePair = edges.filter(e => 
            (e.from === edge.from && e.to === edge.to) || 
            (e.from === edge.to && e.to === edge.from)
          );
          const edgeIndex = samePair.indexOf(edge);
          let curveVal = samePair.length === 1 ? 0 : (edgeIndex - (samePair.length - 1) / 2) * 60;

          const dx = b.x - a.x, dy = b.y - a.y;
          const dist = Math.max(Math.sqrt(dx * dx + dy * dy), 1);
          
          const ux = dx / dist, uy = dy / dist;
          const x1 = a.x + ux * (NODE_R + 2);
          const y1 = a.y + uy * (NODE_R + 2);
          const x2 = b.x - ux * (NODE_R + 8);
          const y2 = b.y - uy * (NODE_R + 8);

          const nx = -dy / dist, ny = dx / dist; // Perpendicular vector
          const cx = (a.x + b.x) / 2 + nx * curveVal;
          const cy = (a.y + b.y) / 2 + ny * curveVal;

          const midX = 0.25 * x1 + 0.5 * cx + 0.25 * x2;
          const midY = 0.25 * y1 + 0.5 * cy + 0.25 * y2;

          const labelW = ((edge.label || "").length * 6.2) + 14;

          const tx = x2 - cx, ty = y2 - cy;
          const tDist = Math.max(Math.sqrt(tx * tx + ty * ty), 1);
          const tux = tx / tDist, tuy = ty / tDist;
          
          const angle = Math.atan2(tuy, tux);
          const p1x = x2 - 10 * Math.cos(angle - 0.4);
          const p1y = y2 - 10 * Math.sin(angle - 0.4);
          const p2x = x2 - 10 * Math.cos(angle + 0.4);
          const p2y = y2 - 10 * Math.sin(angle + 0.4);
          const arrowPath = `M${x2},${y2} L${p1x},${p1y} L${p2x},${p2y} Z`;

          return (
            <g key={i}>
              {curveVal === 0 ? (
                <line
                  x1={x1} y1={y1} x2={x2} y2={y2}
                  stroke={color} strokeWidth={1.8}
                  strokeDasharray={dash}
                  opacity={active ? 1 : 0.4}
                  style={{ transition: "opacity 0.2s" }}
                />
              ) : (
                <path
                  d={`M${x1},${y1} Q${cx},${cy} ${x2},${y2}`}
                  fill="none"
                  stroke={color} strokeWidth={1.8}
                  strokeDasharray={dash}
                  opacity={active ? 1 : 0.4}
                  style={{ transition: "opacity 0.2s" }}
                />
              )}
              <path d={arrowPath} fill={color} opacity={active ? 1 : 0.4} />
              {edge.label && (active || (edge.label || "").length < 18) && (
                <g opacity={active ? 1 : 0.6} style={{ transition: "opacity 0.2s" }}>
                  <rect
                    x={midX - labelW / 2} y={midY - 9}
                    width={labelW} height={17} rx={5}
                    fill="var(--bg-sidebar)" stroke={color} strokeWidth={0.8} opacity={0.95}
                  />
                  <text
                    x={midX} y={midY + 4} textAnchor="middle"
                    fontSize="10" fill={color}
                    fontFamily="'JetBrains Mono', monospace" fontWeight="600"
                  >
                    {edge.label}
                  </text>
                </g>
              )}
            </g>
          );
        })}

                {/* Nodes */}
        {nodes.map(node => {
          const pos    = positions[node.id];
          if (!pos) return null;
          const colors = TYPE_COLORS[node.type] || TYPE_COLORS.person;
          const isHov  = hovered === node.id;
          const isDrag = dragging === node.id;
          // Label: clean, no newlines in the node circle — show below
          const label  = (node.label || "").replace(/\n/g, " ").trim();
          // Truncate long labels
          const short  = label.length > 22 ? label.slice(0, 20) + "…" : label;

          return (
            <g
              key={node.id}
              style={{ cursor: isDrag ? "grabbing" : "grab" }}
              onMouseDown={e => onMouseDown(e, node.id)}
              onMouseEnter={() => setHovered(node.id)}
              onMouseLeave={() => setHovered(null)}
            >
              {/* Glow ring on hover */}
              {isHov && (
                <circle cx={pos.x} cy={pos.y} r={NODE_R + 10}
                  fill={colors.stroke} opacity={0.15} />
              )}

              {/* Node circle */}
              <circle
                cx={pos.x} cy={pos.y} r={NODE_R}
                fill={colors.fill}
                stroke={colors.stroke}
                strokeWidth={isHov || isDrag ? 2.5 : 1.5}
                filter={isDrag ? "url(#shadow)" : undefined}
                style={{ transition: "stroke-width 0.15s" }}
              />

              {/* Icon — person */}
              {node.type === "person" && (
                <g stroke={colors.stroke} strokeWidth="1.6" fill="none" strokeLinecap="round">
                  <circle cx={pos.x} cy={pos.y - 9} r={7} />
                  <path d={`M${pos.x - 13} ${pos.y + 18} Q${pos.x - 13} ${pos.y + 6} ${pos.x} ${pos.y + 6} Q${pos.x + 13} ${pos.y + 6} ${pos.x + 13} ${pos.y + 18}`} />
                </g>
              )}

              {/* Icon — company (building) */}
              {node.type === "company" && (
                <g stroke={colors.stroke} strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round">
                  <path d={`M${pos.x - 13} ${pos.y + 14} L${pos.x - 13} ${pos.y - 4} L${pos.x} ${pos.y - 16} L${pos.x + 13} ${pos.y - 4} L${pos.x + 13} ${pos.y + 14} Z`} />
                  <rect x={pos.x - 5} y={pos.y + 4} width={10} height={10} rx={1} />
                </g>
              )}

              {/* Icon — bank */}
              {node.type === "bank" && (
                <g stroke={colors.stroke} strokeWidth="1.6" fill="none" strokeLinecap="round">
                  <path d={`M${pos.x - 14} ${pos.y - 2} L${pos.x} ${pos.y - 16} L${pos.x + 14} ${pos.y - 2} Z`} />
                  <line x1={pos.x - 12} y1={pos.y - 1} x2={pos.x - 12} y2={pos.y + 12} />
                  <line x1={pos.x - 4}  y1={pos.y - 1} x2={pos.x - 4}  y2={pos.y + 12} />
                  <line x1={pos.x + 4}  y1={pos.y - 1} x2={pos.x + 4}  y2={pos.y + 12} />
                  <line x1={pos.x + 12} y1={pos.y - 1} x2={pos.x + 12} y2={pos.y + 12} />
                  <line x1={pos.x - 14} y1={pos.y + 13} x2={pos.x + 14} y2={pos.y + 13} />
                </g>
              )}

              {/* Label BELOW the node — never inside */}
              <text
                x={pos.x}
                y={pos.y + NODE_R + 16}
                textAnchor="middle"
                fontSize="11"
                fontWeight={isHov ? "700" : "500"}
                fill={colors.text}
                fontFamily="'Inter', sans-serif"
                style={{ transition: "font-weight 0.15s", pointerEvents: "none" }}
              >
                {short}
              </text>

              {/* Risk badge */}
              {node.risk && node.risk !== "low" && (
                <circle
                  cx={pos.x + NODE_R - 6}
                  cy={pos.y - NODE_R + 6}
                  r={6}
                  fill={node.risk === "high" ? "#ef4444" : "#f59e0b"}
                />
              )}
            </g>
          );
        })}
      </svg>

      {/* Legend */}
      <div style={{ padding: "10px 16px", borderTop: "1px solid var(--border)", display: "flex", gap: 20, flexWrap: "wrap", alignItems: "center" }}>
        <span style={{ fontSize: 11, color: "var(--text-faint)", marginRight: 4 }}>Nodes:</span>
        {Object.entries(TYPE_COLORS).map(([type, c]) => (
          <div key={type} style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <svg width="12" height="12"><circle cx="6" cy="6" r="5" fill={c.fill} stroke={c.stroke} strokeWidth="1.5" /></svg>
            <span style={{ fontSize: 11, color: "var(--text-muted)", textTransform: "capitalize" }}>{type}</span>
          </div>
        ))}
        <span style={{ fontSize: 11, color: "var(--text-faint)", marginLeft: 8, marginRight: 4 }}>Edges:</span>
        {Object.entries(EDGE_COLORS).map(([type, color]) => (
          <div key={type} style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <svg width="20" height="8">
              <line x1="1" y1="4" x2="19" y2="4" stroke={color} strokeWidth="1.5"
                strokeDasharray={type === "directorship" ? "4,2" : type === "beneficial" ? "6,3" : type === "financial" ? "2,2" : ""} />
            </svg>
            <span style={{ fontSize: 11, color: "var(--text-muted)", textTransform: "capitalize" }}>{type}</span>
          </div>
        ))}
      </div>
    </div>
  );
}