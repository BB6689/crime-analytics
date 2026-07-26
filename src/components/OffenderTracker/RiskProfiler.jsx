import React, { useState, useEffect } from 'react';
import { ShieldCheck, Heart, User, Briefcase, Sliders, Calendar } from 'lucide-react';
import { translations } from '../../translations';

export default function RiskProfiler({ lang = 'en', offenderId, offenderProfiles }) {
  const originalProfile = (offenderProfiles || []).find(o => o.id === offenderId);

  if (!originalProfile) {
    return (
      <div className="glass-panel" style={{ height: '100%', padding: '1.5rem', display: 'flex', justifyContent: 'center', alignItems: 'center', textAlign: 'center', color: 'var(--text-secondary)', fontFamily: lang === 'kn' ? 'var(--font-kannada)' : 'inherit' }}>
        <p>{translations[lang].riskProfiler.placeholder}</p>
      </div>
    );
  }

  // Simulator States
  const [employment, setEmployment] = useState('Unemployed');
  const [substanceAbuse, setSubstanceAbuse] = useState('Active');
  const [gangAssociation, setGangAssociation] = useState('Active');
  const [housing, setHousing] = useState('Unstable');
  const [supervision, setSupervision] = useState('Standard');

  // Recalculated outputs
  const [riskScore, setRiskScore] = useState(originalProfile.riskScore);
  const [recidivismProb, setRecidivismProb] = useState(originalProfile.recidivismProbability);

  // Sync simulator states when selected offender changes
  useEffect(() => {
    // Map demographics.employmentStatus
    const emp = originalProfile.demographics.employmentStatus.toLowerCase();
    if (emp.includes('unemployed')) {
      setEmployment('Unemployed');
    } else if (emp.includes('part-time') || emp.includes('self-employed')) {
      setEmployment('Part-time');
    } else {
      setEmployment('Full-time');
    }

    // Map substanceAbuseHistory
    const sub = originalProfile.riskFactors.substanceAbuseHistory.toLowerCase();
    if (sub.includes('severe') || sub.includes('moderate')) {
      setSubstanceAbuse('Active');
    } else if (sub.includes('light') || sub.includes('yes')) {
      setSubstanceAbuse('Rehab');
    } else {
      setSubstanceAbuse('None');
    }

    // Map gangAffiliation
    const gang = originalProfile.riskFactors.gangAffiliation.toLowerCase();
    if (gang.includes('active')) {
      setGangAssociation('Active');
    } else {
      setGangAssociation('None');
    }

    // Map housing based on district poverty levels
    const dist = originalProfile.demographics.residenceDistrict;
    if (dist === 'KALABURAGI' || dist === 'MANGALURU') {
      setHousing('Unstable');
    } else {
      setHousing('Stable');
    }

    // Map probation / supervision level
    const viol = originalProfile.riskFactors.probationViolations;
    if (viol >= 3) {
      setSupervision('Standard');
    } else if (viol > 0) {
      setSupervision('Intensive');
    } else {
      setSupervision('None');
    }
  }, [offenderId]);

  // Recalculate Risk Scores on factor changes
  useEffect(() => {
    // Start with a baseline score derived from fixed parameters
    // (arrest record length, violence history, etc.)
    const baseScore = originalProfile.totalArrests * 3.5 + (originalProfile.riskFactors.priorViolentConvictions * 5);
    
    let score = baseScore;

    // Apply modifiers based on selected simulator states
    if (employment === 'Unemployed') score += 12;
    if (employment === 'Part-time') score += 5;
    if (employment === 'Full-time') score -= 8;

    if (substanceAbuse === 'Active') score += 15;
    if (substanceAbuse === 'Rehab') score += 4;
    if (substanceAbuse === 'None') score -= 5;

    if (gangAssociation === 'Active') score += 20;
    if (gangAssociation === 'None') score -= 12;

    if (housing === 'Unstable') score += 8;
    if (housing === 'Stable') score -= 4;

    if (supervision === 'None') score += 10;
    if (supervision === 'Standard') score += 3;
    if (supervision === 'Intensive') score -= 10;

    // Clamp values
    const finalScore = Math.max(15, Math.min(99, Math.round(score)));
    // Recidivism probability is closely correlated but has statistical variance
    const finalRecidivism = Math.max(10, Math.min(99, Math.round(finalScore * 0.95 + (housing === 'Unstable' ? 4 : 0))));

    setRiskScore(finalScore);
    setRecidivismProb(finalRecidivism);
  }, [employment, substanceAbuse, gangAssociation, housing, supervision, offenderId]);

  const riskColorClass = riskScore >= 80 ? '#ff4a6b' : riskScore >= 60 ? '#eab308' : '#10b981';

  const translateTimelineType = (type) => {
    if (lang === 'kn') {
      if (type.includes('Homicide') || type.includes('Murder')) return 'ಕೊಲೆ / ನರಹತ್ಯೆ';
      if (type.includes('Assault') || type.includes('Attack')) return 'ದೈಹಿಕ ದಾಳಿ';
      if (type.includes('Burglary') || type.includes('Break-in')) return 'ಕನ್ನಗಳವು';
      if (type.includes('Theft') || type.includes('Larceny')) return 'ಕಳ್ಳತನ';
      if (type.includes('Drugs') || type.includes('NDPS')) return 'ಮಾದಕ ದ್ರವ್ಯ ತಡೆ ಕಾಯ್ದೆ (NDPS)';
    }
    return type;
  };

  return (
    <div className="glass-panel" style={{ height: '100%', display: 'flex', flexDirection: 'column', fontFamily: lang === 'kn' ? 'var(--font-kannada)' : 'inherit' }}>
      <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-cyan)' }}>
            <User size={20} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '700', fontFamily: 'var(--font-title)' }}>
              {originalProfile.name}
            </h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              {translations[lang].riskProfiler.alias} <strong>{originalProfile.alias}</strong> | {translations[lang].riskProfiler.age} {originalProfile.age} | {translations[lang].riskProfiler.supervision} {originalProfile.supervisingOfficer}
            </span>
          </div>
        </div>
        <span className={`badge badge-${originalProfile.status.toLowerCase().replace(' ', '-')}`}>
          {originalProfile.status === 'Wanted' ? translations[lang].mapControls.wanted : originalProfile.status === 'Bail' ? translations[lang].mapControls.bail : originalProfile.status === 'Parole' ? translations[lang].mapControls.parole : originalProfile.status === 'On Probation' || originalProfile.status === 'Probation' ? translations[lang].mapControls.probation : originalProfile.status}
        </span>
      </div>

      <div className="panel-body" style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1.25rem', flex: 1, minHeight: 0, overflowY: 'auto' }}>
        {/* Left Side: Risk meters & Arrest Timeline */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          {/* Predictive Metrics Row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="glass-panel" style={{ padding: '1rem', background: 'rgba(0,0,0,0.15)', position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
              <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>{translations[lang].riskProfiler.threatIndex}</span>
              <div style={{ position: 'relative', width: '80px', height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {/* Simulated circular progress */}
                <svg width="100%" height="100%" viewBox="0 0 36 36" style={{ transform: 'rotate(-90deg)' }}>
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="var(--bg-tertiary)"
                    strokeWidth="2.5"
                  />
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke={riskColorClass}
                    strokeDasharray={`${riskScore}, 100`}
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    style={{ transition: 'stroke-dasharray 0.5s ease-in-out' }}
                  />
                </svg>
                <div style={{ position: 'absolute', fontFamily: 'var(--font-title)', fontSize: '1.25rem', fontWeight: 800, color: riskColorClass }}>
                  {riskScore}
                </div>
              </div>
              <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>{translations[lang].riskProfiler.compositeRating}</span>
            </div>

            <div className="glass-panel" style={{ padding: '1rem', background: 'rgba(0,0,0,0.15)', position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
              <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>{translations[lang].riskProfiler.recidivism}</span>
              <div style={{ position: 'relative', width: '80px', height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="100%" height="100%" viewBox="0 0 36 36" style={{ transform: 'rotate(-90deg)' }}>
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="var(--bg-tertiary)"
                    strokeWidth="2.5"
                  />
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="var(--accent-purple)"
                    strokeDasharray={`${recidivismProb}, 100`}
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    style={{ transition: 'stroke-dasharray 0.5s ease-in-out' }}
                  />
                </svg>
                <div style={{ position: 'absolute', fontFamily: 'var(--font-title)', fontSize: '1.25rem', fontWeight: 800, color: 'var(--accent-purple)' }}>
                  {recidivismProb}%
                </div>
              </div>
              <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>{translations[lang].riskProfiler.prognosis}</span>
            </div>
          </div>

          {/* Offender Timeline */}
          <div>
            <h4 style={{ fontSize: '0.8rem', fontWeight: '600', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <Calendar size={14} />
              {translations[lang].riskProfiler.timelineTitle}
            </h4>
            <div className="timeline-container">
              {originalProfile.timeline.map((item, idx) => (
                <div key={idx} className={`timeline-event ${item.type.includes('Homicide') || item.type.includes('Weapons') ? 'critical' : ''}`}>
                  <div className="timeline-marker" />
                  <div className="timeline-date">{new Date(item.date).toLocaleDateString(lang === 'kn' ? 'kn-IN' : 'en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</div>
                  <div className="timeline-title">{translations[lang].crimeTypes[item.type] || translateTimelineType(item.type)}</div>
                  <div className="timeline-desc">{item.description}</div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Right Side: Risk factors simulator */}
        <div className="glass-panel" style={{ padding: '1rem', background: 'rgba(0,0,0,0.1)' }}>
          <h4 style={{ fontSize: '0.8rem', fontWeight: '600', textTransform: 'uppercase', color: 'var(--text-primary)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Sliders size={14} className="brand-logo" />
            {translations[lang].riskProfiler.simulatorTitle}
          </h4>
          <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', lineHeight: '1.4', marginBottom: '1rem' }}>
            {translations[lang].riskProfiler.simulatorDesc}
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="filter-group">
              <label className="filter-label">{translations[lang].riskProfiler.employmentLabel}</label>
              <select
                className="form-select"
                value={employment}
                onChange={(e) => setEmployment(e.target.value)}
              >
                <option value="Unemployed">{translations[lang].riskProfiler.unemployed}</option>
                <option value="Part-time">{translations[lang].riskProfiler.partTimeEmp}</option>
                <option value="Full-time">{translations[lang].riskProfiler.fullTimeEmp}</option>
              </select>
            </div>

            <div className="filter-group">
              <label className="filter-label">{translations[lang].riskProfiler.substanceLabel}</label>
              <select
                className="form-select"
                value={substanceAbuse}
                onChange={(e) => setSubstanceAbuse(e.target.value)}
              >
                <option value="Active">{translations[lang].riskProfiler.activeAbuse}</option>
                <option value="Rehab">{translations[lang].riskProfiler.rehabAbuse}</option>
                <option value="None">{translations[lang].riskProfiler.noneAbuse}</option>
              </select>
            </div>

            <div className="filter-group">
              <label className="filter-label">{translations[lang].riskProfiler.gangLabel}</label>
              <select
                className="form-select"
                value={gangAssociation}
                onChange={(e) => setGangAssociation(e.target.value)}
              >
                <option value="Active">{translations[lang].riskProfiler.activeGang}</option>
                <option value="None">{translations[lang].riskProfiler.noneGang}</option>
              </select>
            </div>

            <div className="filter-group">
              <label className="filter-label">{translations[lang].riskProfiler.housingLabel}</label>
              <select
                className="form-select"
                value={housing}
                onChange={(e) => setHousing(e.target.value)}
              >
                <option value="Unstable">{translations[lang].riskProfiler.unstableHousing}</option>
                <option value="Stable">{translations[lang].riskProfiler.stableHousing}</option>
              </select>
            </div>

            <div className="filter-group">
              <label className="filter-label">{translations[lang].riskProfiler.probationLabel}</label>
              <select
                className="form-select"
                value={supervision}
                onChange={(e) => setSupervision(e.target.value)}
              >
                <option value="None">{translations[lang].riskProfiler.noneSupervision}</option>
                <option value="Standard">{translations[lang].riskProfiler.standardSupervision}</option>
                <option value="Intensive">{translations[lang].riskProfiler.intensiveSupervision}</option>
              </select>
            </div>
          </div>

          <div style={{ marginTop: '1.25rem', padding: '0.75rem', borderLeft: '3px solid var(--accent-emerald)', background: 'rgba(16, 185, 129, 0.03)', borderRadius: '4px', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <ShieldCheck size={20} style={{ color: 'var(--accent-emerald)', flexShrink: 0 }} />
            <p style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', lineHeight: '1.3' }}>
              {translations[lang].riskProfiler.rehabDesc}
            </p>
          </div>

          {/* MO Analysis Panel */}
          <div style={{ marginTop: '1rem', padding: '0.85rem', background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.18)', borderRadius: '8px' }}>
            <div style={{ fontSize: '0.68rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#818cf8', marginBottom: '0.65rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              🔬 MO Pattern Analysis
            </div>
            {/* Crime type frequency bars */}
            {(() => {
              const timeline = originalProfile.timeline || [];
              const typeCount = {};
              timeline.forEach(t => { typeCount[t.type] = (typeCount[t.type] || 0) + 1; });
              const types = Object.entries(typeCount).sort((a,b) => b[1] - a[1]).slice(0, 5);
              const maxCount = types[0]?.[1] || 1;
              const moColors = ['#f43f5e','#f59e0b','#a78bfa','#00f5ff','#10b981'];
              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginBottom: '0.75rem' }}>
                  <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>Offence Frequency Pattern</div>
                  {types.map(([type, count], i) => (
                    <div key={i}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.62rem', marginBottom: '2px' }}>
                        <span style={{ color: 'var(--text-secondary)', maxWidth: '75%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{type}</span>
                        <span style={{ color: moColors[i], fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{count}x</span>
                      </div>
                      <div style={{ height: '3px', background: 'rgba(255,255,255,0.06)', borderRadius: 2, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${(count/maxCount)*100}%`, background: moColors[i], borderRadius: 2, boxShadow: `0 0 4px ${moColors[i]}66` }}/>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()}

            {/* Behavioral fingerprint tags */}
            <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>Behavioral Fingerprint</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
              {[
                originalProfile.riskFactors?.gangAffiliation !== 'None' && 'Gang-linked',
                originalProfile.riskFactors?.priorViolentConvictions > 0 && 'Violent History',
                originalProfile.riskFactors?.substanceAbuseHistory?.includes('Severe') && 'Substance Dependent',
                originalProfile.riskFactors?.probationViolations > 0 && 'Supervision Violator',
                originalProfile.demographics?.employmentStatus?.includes('Unemployed') && 'Economically Marginalised',
                originalProfile.totalArrests > 3 && 'Habitual Offender',
              ].filter(Boolean).map((tag, i) => (
                <span key={i} style={{ background: 'rgba(244,63,94,0.12)', border: '1px solid rgba(244,63,94,0.25)', color: '#f43f5e', borderRadius: 4, padding: '1px 6px', fontSize: '0.58rem', fontWeight: 700 }}>{tag}</span>
              ))}
            </div>

            {/* Jurisdiction spread indicator */}
            <div style={{ marginTop: '0.65rem', fontSize: '0.62rem', color: 'var(--text-muted)' }}>
              Jurisdiction Spread: <strong style={{ color: 'var(--accent)', fontFamily: 'var(--font-mono)' }}>
                {originalProfile.demographics?.residenceDistrict || 'Multi-District'}
              </strong> — {originalProfile.timeline?.length || 0} incident(s) on record
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
