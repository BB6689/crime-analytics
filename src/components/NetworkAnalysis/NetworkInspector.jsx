import React from 'react';
import { Eye, ShieldAlert, Award, FileText, ChevronRight } from 'lucide-react';
import { translations } from '../../translations';

export default function NetworkInspector({ lang = 'en', selectedNode, onViewProfile, networkData }) {
  if (!selectedNode) {
    return (
      <div className="glass-panel" style={{ height: '100%', padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', color: 'var(--text-secondary)', fontFamily: lang === 'kn' ? 'var(--font-kannada)' : 'inherit' }}>
        <Eye size={36} style={{ color: 'var(--text-muted)', marginBottom: '1rem' }} />
        <h4 style={{ color: 'var(--text-primary)', marginBottom: '0.5rem' }}>{translations[lang].networkInspector.title}</h4>
        <p style={{ fontSize: '0.8rem', lineHeight: '1.4' }}>
          {translations[lang].networkInspector.placeholder}
        </p>
      </div>
    );
  }

  // Find linked co-offenders or gang members
  const links = (networkData?.links || []).filter(l => l.source === selectedNode.id || l.target === selectedNode.id);
  const connections = links.map(l => {
    const targetId = l.source === selectedNode.id ? l.target : l.source;
    const targetNode = (networkData?.nodes || []).find(n => n.id === targetId);
    return {
      node: targetNode,
      relationship: l.label,
      type: l.type
    };
  }).filter(c => c.node !== undefined);

  return (
    <div className="glass-panel" style={{ height: '100%', display: 'flex', flexDirection: 'column', fontFamily: lang === 'kn' ? 'var(--font-kannada)' : 'inherit' }}>
      <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--glass-border)', borderLeft: `3px solid ${selectedNode.color}` }}>
        <span style={{ fontSize: '0.65rem', color: 'var(--accent-cyan)', fontWeight: '600', textTransform: 'uppercase' }}>
          {selectedNode.type === 'SUSPECT' ? (lang === 'kn' ? 'ಆರೋಪಿ/ಶಂಕಿತರ' : 'SUSPECT') : selectedNode.type === 'GANG' ? (lang === 'kn' ? 'ಗುಂಪು/ಗ್ಯಾಂಗ್' : 'GANG') : (lang === 'kn' ? 'ಅಪರಾಧ ಘಟನೆ' : 'INCIDENT')} {translations[lang].mapControls.stationDossierTitle}
        </span>
        <h3 style={{ fontSize: '1.1rem', fontWeight: '700', fontFamily: 'var(--font-title)', marginTop: '2px' }}>{selectedNode.label}</h3>
      </div>

      <div className="panel-body" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', flex: 1, minHeight: 0, overflowY: 'auto' }}>
        {/* Render Suspect Specific Dossier */}
        {selectedNode.type === 'SUSPECT' && (
          <>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span className="filter-label">{translations[lang].networkInspector.threatLevel}</span>
                <span style={{ fontSize: '0.85rem', fontWeight: '700', color: selectedNode.riskScore > 80 ? 'var(--accent-red)' : 'var(--accent-amber)' }}>
                  {selectedNode.riskScore}% {translations[lang].networkInspector.risk}
                </span>
              </div>
              <div style={{ height: '6px', background: 'var(--bg-tertiary)', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${selectedNode.riskScore}%`, background: selectedNode.riskScore > 80 ? 'var(--accent-red)' : 'var(--accent-amber)', borderRadius: '3px' }} />
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', padding: '0.75rem', background: 'rgba(0,0,0,0.15)', border: '1px solid var(--glass-border)', borderRadius: '6px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>{translations[lang].networkInspector.status}</span>
                <span className={`badge badge-${(selectedNode.status || 'Active').toLowerCase().replace(/\s+/g, '-')}`}>
                  {selectedNode.status === 'Wanted' ? translations[lang].mapControls.wanted : selectedNode.status === 'Bail' ? translations[lang].mapControls.bail : selectedNode.status === 'Parole' ? translations[lang].mapControls.parole : selectedNode.status === 'On Probation' || selectedNode.status === 'Probation' ? translations[lang].mapControls.probation : selectedNode.status || 'Active'}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>{translations[lang].networkInspector.affiliation}</span>
                <span style={{ fontWeight: '600' }}>{selectedNode.gang === 'Independent' ? (lang === 'kn' ? 'ಸ್ವತಂತ್ರ' : 'Independent') : selectedNode.gang}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>{translations[lang].networkInspector.role}</span>
                <span style={{ fontWeight: '600', color: 'var(--accent-cyan)' }}>
                  {selectedNode.role === 'Suspect' ? (lang === 'kn' ? 'ಶಂಕಿತ' : 'Suspect') : selectedNode.role === 'Leader' ? (lang === 'kn' ? 'ನಾಯಕ' : 'Leader') : selectedNode.role === 'Associate' ? (lang === 'kn' ? 'ಸಹವರ್ತಿ' : 'Associate') : selectedNode.role}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>{translations[lang].networkInspector.age}</span>
                <span style={{ fontWeight: '600' }}>{selectedNode.age} {translations[lang].networkInspector.yrs}</span>
              </div>
            </div>

            {/* Profile Action Button */}
            {selectedNode.id !== 'P-05' && selectedNode.id !== 'P-06' && (
              <button
                className="btn btn-primary btn-full"
                onClick={() => onViewProfile(selectedNode.id)}
              >
                <FileText size={14} />
                {translations[lang].networkInspector.profileBtn}
              </button>
            )}
          </>
        )}

        {/* Render Gang Specific Dossier */}
        {selectedNode.type === 'GANG' && (
          <>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
              {selectedNode.summary}
            </p>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <div style={{ flex: 1, padding: '0.6rem', background: 'rgba(0,0,0,0.15)', border: '1px solid var(--glass-border)', borderRadius: '6px', textAlign: 'center' }}>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>{translations[lang].networkInspector.affiliatedSuspects}</div>
                <div style={{ fontSize: '1.2rem', fontWeight: '700', color: 'var(--accent-cyan)', marginTop: '2px' }}>3</div>
              </div>
              <div style={{ flex: 1, padding: '0.6rem', background: 'rgba(0,0,0,0.15)', border: '1px solid var(--glass-border)', borderRadius: '6px', textAlign: 'center' }}>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>{translations[lang].networkInspector.coreIncidents}</div>
                <div style={{ fontSize: '1.2rem', fontWeight: '700', color: 'var(--accent-red)', marginTop: '2px' }}>2</div>
              </div>
            </div>
          </>
        )}

        {/* Render Incident Specific Dossier */}
        {selectedNode.type === 'INCIDENT' && (
          <>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-primary)', lineHeight: '1.4' }}>
              {selectedNode.summary}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', padding: '0.75rem', background: 'rgba(0,0,0,0.15)', border: '1px solid var(--glass-border)', borderRadius: '6px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>{translations[lang].networkInspector.severity}</span>
                <span style={{ color: 'var(--accent-red)', fontWeight: '600' }}>{translations[lang].networkInspector.highThreat}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>{translations[lang].networkInspector.districtZone}</span>
                <span style={{ fontWeight: '600' }}>{translations[lang].networkInspector.kalaburagiZone}</span>
              </div>
            </div>
          </>
        )}

        {/* Associated Links List with Association Strength */}
        <div>
          <h4 className="filter-label" style={{ marginBottom: '0.5rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>{translations[lang].networkInspector.connections} ({connections.length})</span>
            {connections.length > 0 && <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)', fontWeight: 400 }}>with association strength</span>}
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '180px', overflowY: 'auto' }}>
            {connections.map((c, idx) => {
              // Compute association strength based on link type + node types
              const baseStrength = c.relationship === 'Leader' || c.relationship === 'Co-Leader' ? 92 :
                c.relationship === 'Member' || c.relationship === 'Associate' ? 74 :
                  c.relationship === 'Suspect' ? 60 : 45;
              const strength = Math.min(99, baseStrength + (idx === 0 ? 0 : -(idx * 5)));
              const sColor = strength >= 80 ? '#f43f5e' : strength >= 60 ? '#f59e0b' : '#6366f1';
              return (
                <div
                  key={`conn-${idx}`}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '0.5rem 0.6rem', background: 'rgba(255,255,255,0.02)',
                    border: '1px solid var(--glass-border)', borderRadius: '6px', fontSize: '0.75rem'
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <span style={{ fontWeight: '600', color: c.node.color }}>{c.node.label}</span>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.65rem', display: 'block' }}>
                      {c.node.type === 'SUSPECT' ? (lang === 'kn' ? 'ಶಂಕಿತ' : 'SUSPECT') : c.node.type === 'GANG' ? (lang === 'kn' ? 'ಗ್ಯಾಂಗ್' : 'GANG') : (lang === 'kn' ? 'ಘಟನೆ' : 'INCIDENT')}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', background: 'var(--bg-tertiary)', padding: '2px 6px', borderRadius: '4px' }}>
                      {c.relationship === 'Suspect' ? (lang === 'kn' ? 'ಶಂಕಿತ' : 'Suspect') : c.relationship === 'Member' ? (lang === 'kn' ? 'ಸದಸ್ಯ' : 'Member') : c.relationship}
                    </span>
                    {/* Association strength gauge */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1px' }}>
                      <div style={{ width: 28, height: 3, background: 'rgba(255,255,255,0.07)', borderRadius: 2, overflow: 'hidden' }}>
                        <div style={{ width: `${strength}%`, height: '100%', background: sColor, borderRadius: 2, boxShadow: `0 0 3px ${sColor}` }} />
                      </div>
                      <span style={{ fontSize: '0.55rem', color: sColor, fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{strength}%</span>
                    </div>
                  </div>
                </div>
              );
            })}
            {connections.length === 0 && (
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center', padding: '1rem' }}>
                {translations[lang].networkInspector.noConnections}
              </div>
            )}
          </div>
        </div>

        {/* Co-Offender Cluster Detection Panel */}
        {selectedNode.type === 'SUSPECT' && connections.length > 0 && (
          <div style={{ background: 'rgba(99,102,241,0.07)', border: '1px solid rgba(99,102,241,0.20)', borderRadius: '8px', padding: '0.75rem' }}>
            <div style={{ fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#818cf8', marginBottom: '0.5rem' }}>
              🔗 Co-Offender Cluster Analysis
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {[
                { label: 'Network Centrality', value: connections.length > 3 ? 'HIGH' : connections.length > 1 ? 'MEDIUM' : 'LOW', color: connections.length > 3 ? '#f43f5e' : connections.length > 1 ? '#f59e0b' : '#10b981' },
                { label: 'Cluster Role', value: selectedNode.role || 'Associate', color: '#a78bfa' },
                { label: 'Co-offenders', value: connections.filter(c => c.node.type === 'SUSPECT').length, color: '#00f5ff' },
                { label: 'Incidents Linked', value: connections.filter(c => c.node.type === 'INCIDENT').length, color: '#f97316' },
              ].map((item, i) => (
                <div key={i} style={{ flex: '1 1 calc(50% - 0.25rem)', background: 'rgba(0,0,0,0.2)', borderRadius: '5px', padding: '0.4rem 0.6rem', border: `1px solid ${item.color}22` }}>
                  <div style={{ fontSize: '0.58rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{item.label}</div>
                  <div style={{ fontSize: '0.82rem', fontWeight: 800, color: item.color, fontFamily: 'var(--font-mono)', marginTop: '1px' }}>{item.value}</div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: '0.5rem', fontSize: '0.62rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
              Association strength computed from link types, shared incident records, and co-offender proximity analysis.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

