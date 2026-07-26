import React, { useState } from 'react';
import { Search, ShieldAlert, AlertTriangle, FileText, UserCheck, ArrowRight } from 'lucide-react';
import { translations } from '../../translations';

function OffenderEmptyState({ lang }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'60%', gap:'1.25rem', padding:'2rem', textAlign:'center' }}>
      {/* Silhouette icon stack */}
      <div style={{ position:'relative', width:72, height:72 }}>
        {/* Background circle */}
        <div style={{ position:'absolute', inset:0, borderRadius:'50%', background:'rgba(239,68,68,0.06)', border:'1px solid rgba(239,68,68,0.15)' }}/>
        {/* SVG person icon */}
        <svg viewBox="0 0 24 24" width={36} height={36} fill="none" stroke="rgba(239,68,68,0.4)" strokeWidth={1.5}
          style={{ position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%)' }}>
          <circle cx="12" cy="7" r="4"/>
          <path d="M20 21a8 8 0 0 0-16 0"/>
          <path d="M16 17l2 2 4-4" opacity="0"/>
        </svg>
        {/* Question mark badge */}
        <div style={{ position:'absolute', bottom:2, right:2, width:22, height:22, borderRadius:'50%', background:'rgba(239,68,68,0.15)', border:'1px solid rgba(239,68,68,0.3)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'0.7rem', fontWeight:900, color:'#ef4444' }}>?</div>
      </div>

      <div>
        <div style={{ fontSize:'0.92rem', fontWeight:700, color:'var(--text-primary)', marginBottom:'0.35rem', fontFamily:'var(--font-title)' }}>
          No Offender Records
        </div>
        <div style={{ fontSize:'0.75rem', color:'var(--text-secondary)', lineHeight:1.6, maxWidth:260 }}>
          Accused profiles are automatically created when FIRs are registered with named offenders.
        </div>
      </div>

      {/* How it works mini-steps */}
      <div style={{ background:'rgba(255,255,255,0.03)', border:'1px solid var(--glass-border)', borderRadius:'var(--radius-md)', padding:'0.75rem 1rem', textAlign:'left', width:'100%', maxWidth:280 }}>
        <div style={{ fontSize:'0.63rem', fontWeight:800, textTransform:'uppercase', letterSpacing:'0.07em', color:'var(--text-secondary)', marginBottom:'0.5rem' }}>
          How Profiles Are Created
        </div>
        {[
          { icon: FileText, text: 'Register a FIR in FIR Registration tab' },
          { icon: UserCheck, text: 'Add accused name in the Accused section' },
          { icon: ShieldAlert, text: 'Profile appears here automatically' },
        ].map(({ icon: Icon, text }, i) => (
          <div key={i} style={{ display:'flex', alignItems:'center', gap:'0.5rem', marginBottom:'0.35rem' }}>
            <div style={{ width:18, height:18, borderRadius:'50%', background:'rgba(0,240,255,0.08)', border:'1px solid rgba(0,240,255,0.15)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              <Icon size={10} color="#00f0ff"/>
            </div>
            <span style={{ fontSize:'0.68rem', color:'var(--text-secondary)' }}>{text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function OffenderList({ lang = 'en', selectedOffenderId, setSelectedOffenderId, offenderProfiles }) {
  const [search, setSearch] = useState('');

  const filteredOffenders = (offenderProfiles || []).filter(o =>
    o.name.toLowerCase().includes(search.toLowerCase()) ||
    o.alias.toLowerCase().includes(search.toLowerCase()) ||
    o.primaryOffenseType.toLowerCase().includes(search.toLowerCase())
  );

  const hasProfiles = (offenderProfiles || []).length > 0;

  return (
    <div className="glass-panel scrollable" style={{ fontFamily: lang === 'kn' ? 'var(--font-kannada)' : 'inherit' }}>
      <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--glass-border)' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontFamily: 'var(--font-title)' }}>
          <ShieldAlert size={18} style={{ color: 'var(--accent-red)' }} />
          {translations[lang].offenderList.title}
          {hasProfiles && (
            <span style={{ marginLeft: 'auto', background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444', borderRadius: 4, padding: '1px 8px', fontSize: '0.65rem', fontWeight: 800 }}>
              {(offenderProfiles || []).length}
            </span>
          )}
        </h3>
        <div style={{ position: 'relative' }}>
          <Search size={14} style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
          <input
            className="form-input"
            style={{ paddingLeft: '1.75rem', fontSize: '0.8rem' }}
            placeholder={translations[lang].offenderList.placeholder}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="panel-body">
        {!hasProfiles ? (
          <OffenderEmptyState lang={lang} />
        ) : filteredOffenders.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem', padding: '2rem' }}>
            <AlertTriangle size={28} style={{ margin:'0 auto 0.5rem', display:'block', color:'var(--text-secondary)' }}/>
            No offenders match your search
          </div>
        ) : (
          filteredOffenders.map((offender) => {
            const isSelected = selectedOffenderId === offender.id;
            const riskColorClass = offender.riskScore >= 85 ? 'high' : offender.riskScore >= 65 ? 'medium' : 'low';
            const riskColor = offender.riskScore >= 85 ? '#ef4444' : offender.riskScore >= 65 ? '#eab308' : '#10b981';

            return (
              <div
                key={offender.id}
                className={`offender-row ${isSelected ? 'selected' : ''}`}
                onClick={() => setSelectedOffenderId(offender.id)}
              >
                {/* Colored status stripe */}
                <div style={{ position:'absolute', left:0, top:0, bottom:0, width:3, background:riskColor, borderRadius:'2px 0 0 2px' }}/>
                <div className="offender-info" style={{ paddingLeft:'0.5rem' }}>
                  <div className="offender-name" style={{ color: isSelected ? 'var(--accent-cyan)' : 'var(--text-primary)' }}>
                    {offender.name}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', display: 'flex', gap: '0.5rem', flexWrap:'wrap' }}>
                    <span>{translations[lang].offenderList.arrests} <strong>{offender.totalArrests}</strong></span>
                    <span>•</span>
                    <span>{translations[lang].crimeTypes[offender.primaryOffenseType] || offender.primaryOffenseType.split('/')[0]}</span>
                    <span style={{ color: offender.status === 'Wanted' ? '#ef4444' : '#10b981', fontWeight:700 }}>
                      {offender.status === 'Wanted' ? '⚠ Wanted' : '✓ In Custody'}
                    </span>
                  </div>
                </div>

                <div className="offender-risk-badge">
                  <span className={`risk-num ${riskColorClass}`}>{offender.riskScore}</span>
                  <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase' }}>{translations[lang].offenderList.risk}</span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
