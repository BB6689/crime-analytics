import React, { useEffect, useRef, useState } from 'react';
import { Search, Users } from 'lucide-react';
import { translations } from '../../translations';

// ── Empty state: animated SVG skeleton network ──────────────────────────────
function NetworkEmptyState() {
  const nodes = [
    { cx: 325, cy: 225, r: 18, color: '#ff4a6b', label: 'Suspect' },
    { cx: 155, cy: 130, r: 14, color: '#ff4a6b', label: 'Accused' },
    { cx: 500, cy: 140, r: 14, color: '#ff4a6b', label: 'Co-accused' },
    { cx: 200, cy: 310, r: 11, color: '#a855f7', label: 'Incident' },
    { cx: 455, cy: 300, r: 11, color: '#a855f7', label: 'Case #001' },
    { cx: 325, cy: 90, r: 14, color: '#f97316', label: 'Gang' },
    { cx: 100, cy: 240, r: 10, color: '#10b981', label: 'Victim' },
    { cx: 550, cy: 250, r: 10, color: '#10b981', label: 'Victim' },
  ];
  const links = [
    [0, 1], [0, 2], [0, 3], [0, 4], [0, 5], [1, 3], [2, 4], [5, 1], [5, 2], [6, 3], [7, 4]
  ];

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1.5rem', padding: '2rem' }}>
      {/* Animated skeleton graph */}
      <svg viewBox="0 50 650 340" style={{ width: '100%', maxHeight: 260, opacity: 0.18 }}>
        <defs>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>
        {links.map(([s, t], i) => (
          <line key={i} x1={nodes[s].cx} y1={nodes[s].cy} x2={nodes[t].cx} y2={nodes[t].cy}
            stroke="rgba(255,255,255,0.3)" strokeWidth={1.5} strokeDasharray="5 4">
            <animate attributeName="stroke-dashoffset" from="0" to="-18" dur="2s" repeatCount="indefinite" />
          </line>
        ))}
        {nodes.map((n, i) => (
          <g key={i}>
            <circle cx={n.cx} cy={n.cy} r={n.r + 5} fill="none" stroke={n.color} strokeWidth={0.8} strokeDasharray="3 3" opacity={0.3}>
              <animate attributeName="r" values={`${n.r + 4};${n.r + 8};${n.r + 4}`} dur={`${2 + i * 0.3}s`} repeatCount="indefinite" />
            </circle>
            <circle cx={n.cx} cy={n.cy} r={n.r} fill={n.color} opacity={0.7} filter="url(#glow)" />
          </g>
        ))}
      </svg>

      {/* Instruction text */}
      <div style={{ textAlign: 'center', maxWidth: 480 }}>
        <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.4rem', fontFamily: 'var(--font-title)' }}>
          Criminal Network Graph
        </div>
        <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
          Register FIRs with named accused to see a live force-directed network mapping suspects, co-accused, gang affiliations, and incident links.
        </div>
        <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          {[
            { color: '#ff4a6b', label: 'Suspect / Accused' },
            { color: '#f97316', label: 'Gang Nexus' },
            { color: '#a855f7', label: 'Incident Node' },
            { color: '#10b981', label: 'Victim' },
          ].map(item => (
            <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.68rem', color: 'var(--text-secondary)' }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: item.color, flexShrink: 0 }} />
              {item.label}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function CriminalNetwork({ lang = 'en', selectedNode, setSelectedNode, networkData, setNetworkData }) {
  const svgRef = useRef(null);
  const draggedNodeRef = useRef(null);

  const [nodes, setNodes] = useState([]);
  const [links, setLinks] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [hoveredNode, setHoveredNode] = useState(null);

  const hasData = networkData?.nodes?.length > 0;

  const width = 650;
  const height = 450;

  // Initialize and run simulation
  useEffect(() => {
    if (!hasData) {
      setNodes([]);
      setLinks([]);
      return;
    }

    // Position nodes in a circle initially
    const initializedNodes = (networkData?.nodes || []).map((n, idx) => {
      const angle = (idx / (networkData?.nodes || []).length) * 2 * Math.PI;
      const radius = 130 + Math.random() * 40;
      return {
        ...n,
        x: width / 2 + Math.cos(angle) * radius,
        y: height / 2 + Math.sin(angle) * radius,
        vx: 0,
        vy: 0
      };
    });

    let localNodes = [...initializedNodes];
    setNodes(localNodes);
    setLinks(networkData?.links || []);

    let animId;
    const tick = () => {
      // 1. Repulsion between all node pairs
      const repulsionK = 3500;
      for (let i = 0; i < localNodes.length; i++) {
        for (let j = i + 1; j < localNodes.length; j++) {
          const ni = localNodes[i];
          const nj = localNodes[j];
          const dx = nj.x - ni.x;
          const dy = nj.y - ni.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          if (dist < 220) {
            const force = repulsionK / (dist * dist);
            const fx = force * (dx / dist);
            const fy = force * (dy / dist);
            ni.vx -= fx;
            ni.vy -= fy;
            nj.vx += fx;
            nj.vy += fy;
          }
        }
      }

      // 2. Attraction along link lines
      const springStrength = 0.06;
      const restLength = 110;
      (networkData?.links || []).forEach((link) => {
        const sNode = localNodes.find(n => n.id === link.source);
        const tNode = localNodes.find(n => n.id === link.target);
        if (!sNode || !tNode) return;
        const dx = tNode.x - sNode.x;
        const dy = tNode.y - sNode.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const force = (dist - restLength) * springStrength;
        const fx = force * (dx / dist);
        const fy = force * (dy / dist);
        sNode.vx += fx;
        sNode.vy += fy;
        tNode.vx -= fx;
        tNode.vy -= fy;
      });

      // 3. Central Gravity pull
      const gravityStrength = 0.015;
      const centerX = width / 2;
      const centerY = height / 2;
      localNodes.forEach((n) => {
        const dx = centerX - n.x;
        const dy = centerY - n.y;
        n.vx += dx * gravityStrength;
        n.vy += dy * gravityStrength;
      });

      // 4. Update coordinates with friction
      const friction = 0.75;
      localNodes = localNodes.map((n) => {
        if (draggedNodeRef.current && n.id === draggedNodeRef.current.id) {
          return { ...n, x: draggedNodeRef.current.x, y: draggedNodeRef.current.y, vx: 0, vy: 0 };
        }
        let nextX = Math.max(30, Math.min(width - 30, n.x + n.vx * friction));
        let nextY = Math.max(30, Math.min(height - 30, n.y + n.vy * friction));
        return { ...n, x: nextX, y: nextY, vx: n.vx * friction, vy: n.vy * friction };
      });

      setNodes([...localNodes]);
      animId = requestAnimationFrame(tick);
    };

    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, [networkData]);

  const handleMouseDown = (node, e) => {
    e.preventDefault();
    const rect = svgRef.current.getBoundingClientRect();
    draggedNodeRef.current = { id: node.id, x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const handleMouseMove = (e) => {
    if (!draggedNodeRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    draggedNodeRef.current = {
      id: draggedNodeRef.current.id,
      x: Math.max(10, Math.min(width - 10, e.clientX - rect.left)),
      y: Math.max(10, Math.min(height - 10, e.clientY - rect.top))
    };
  };

  const handleMouseUp = () => { draggedNodeRef.current = null; };

  const getLineCoordinates = (link) => {
    const s = nodes.find(n => n.id === link.source);
    const t = nodes.find(n => n.id === link.target);
    if (!s || !t) return { x1: 0, y1: 0, x2: 0, y2: 0 };
    return { x1: s.x, y1: s.y, x2: t.x, y2: t.y };
  };

  const isHighlighted = (node) => {
    if (searchQuery) {
      return node.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (node.role && node.role.toLowerCase().includes(searchQuery.toLowerCase()));
    }
    if (selectedNode) {
      if (node.id === selectedNode.id) return true;
      return links.some(l =>
        (l.source === selectedNode.id && l.target === node.id) ||
        (l.target === selectedNode.id && l.source === node.id)
      );
    }
    return true;
  };

  return (
    <div className="glass-panel" style={{ height: '100%', display: 'flex', flexDirection: 'column', position: 'relative', fontFamily: lang === 'kn' ? 'var(--font-kannada)' : 'inherit' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.25rem', borderBottom: '1px solid var(--glass-border)' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.5rem', fontFamily: 'var(--font-title)' }}>
          <Users size={18} className="brand-logo" />
          {translations[lang].criminalNetwork.title}
        </h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {hasData && (
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              {[
                { color: '#ff4a6b', label: 'Suspect' },
                { color: '#f97316', label: 'Gang' },
                { color: '#a855f7', label: 'Incident' },
                { color: '#10b981', label: 'Victim' },
              ].map(item => (
                <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.63rem', color: 'var(--text-secondary)' }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: item.color }} />
                  {item.label}
                </div>
              ))}
            </div>
          )}
          <div style={{ position: 'relative', width: '180px' }}>
            <Search size={14} style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
            <input
              className="form-input"
              style={{ paddingLeft: '1.75rem', paddingRight: '0.5rem', paddingTop: '0.35rem', paddingBottom: '0.35rem', fontSize: '0.75rem' }}
              placeholder={translations[lang].criminalNetwork.placeholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Body */}
      <div
        className="panel-body"
        style={{ padding: 0, overflow: 'hidden', backgroundColor: 'rgba(0,0,0,0.1)', flex: 1 }}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {!hasData ? (
          <NetworkEmptyState />
        ) : (
          <svg ref={svgRef} className="network-svg" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMidYMid meet" style={{ width: '100%', height: '100%' }}>
            <g>
              {links.map((link, idx) => {
                const coords = getLineCoordinates(link);
                const sourceNode = nodes.find(n => n.id === link.source);
                const targetNode = nodes.find(n => n.id === link.target);
                const isLinkHighlighted = sourceNode && targetNode && isHighlighted(sourceNode) && isHighlighted(targetNode);
                return (
                  <line
                    key={`link-${idx}`}
                    x1={coords.x1} y1={coords.y1} x2={coords.x2} y2={coords.y2}
                    className={`link-line ${link.type}`}
                    strokeWidth={selectedNode && (link.source === selectedNode.id || link.target === selectedNode.id) ? 2.5 : 1}
                    style={{ opacity: isLinkHighlighted ? 0.7 : 0.08 }}
                  />
                );
              })}
            </g>
            <g>
              {nodes.map((node) => {
                const highlighted = isHighlighted(node);
                const isSelected = selectedNode && selectedNode.id === node.id;
                const radius = node.type === 'GANG' ? 18 : node.type === 'INCIDENT' ? 11 : 14;
                return (
                  <g
                    key={node.id}
                    transform={`translate(${node.x || 0}, ${node.y || 0})`}
                    className="node-element"
                    onMouseDown={(e) => handleMouseDown(node, e)}
                    onClick={() => setSelectedNode(node)}
                    onMouseEnter={() => setHoveredNode(node)}
                    onMouseLeave={() => setHoveredNode(null)}
                    style={{ opacity: highlighted ? 1 : 0.2 }}
                  >
                    {isSelected && (
                      <circle r={radius + 6} fill="none" stroke="var(--accent-cyan)" strokeWidth={1.5} strokeDasharray="4 2"
                        style={{ animation: 'spin 12s linear infinite' }} />
                    )}
                    <circle r={radius} fill={node.color}
                      stroke={isSelected ? '#ffffff' : 'rgba(255,255,255,0.1)'}
                      strokeWidth={isSelected ? 2 : 1}
                      style={{ filter: isSelected ? `drop-shadow(0 0 8px ${node.color}cc)` : 'none' }}
                    />
                    <text className="node-text" y={radius + 11}>{node.label}</text>
                  </g>
                );
              })}
            </g>
          </svg>
        )}

        {/* Hover tooltip */}
        {hoveredNode && (
          <div className="glass-panel" style={{ position: 'absolute', bottom: '10px', left: '10px', padding: '0.6rem 0.8rem', pointerEvents: 'none', maxWidth: '280px', zIndex: 100, fontSize: '0.75rem', borderLeft: `3px solid ${hoveredNode.color}` }}>
            <strong style={{ color: 'var(--text-primary)', fontSize: '0.8rem' }}>{hoveredNode.label}</strong>
            <div style={{ color: 'var(--accent-cyan)', fontSize: '0.65rem', textTransform: 'uppercase', fontWeight: 600, marginTop: '2px' }}>
              {hoveredNode.type} {hoveredNode.role ? `• ${hoveredNode.role}` : ''}
            </div>
            <p style={{ color: 'var(--text-secondary)', marginTop: '4px', lineHeight: '1.3' }}>
              {hoveredNode.summary || `${translations[lang].criminalNetwork.threatScore} ${hoveredNode.riskScore || 'N/A'}. ${translations[lang].criminalNetwork.status} ${hoveredNode.status === 'Wanted' ? (translations[lang].mapControls.wanted || 'Wanted') : hoveredNode.status || 'Active'}.`}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
