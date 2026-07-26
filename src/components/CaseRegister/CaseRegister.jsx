import React, { useState, useMemo } from 'react';
import { Search, ChevronRight, X, Users, Scale, FileCheck, Clock, AlertTriangle, User, Shield, BookOpen, Handshake, FilePlus, CheckCircle } from 'lucide-react';
import { ZiaText } from '../../utils/translator';

const STATUS_COLORS = {
  'Under Investigation': { text: '#eab308' },
  'Charge Sheeted': { text: '#a855f7' },
  'Closed': { text: '#10b981' },
};
const GRAVITY_COLORS = {
  'Heinous': { text: '#ef4444' },
  'Non-Heinous': { text: '#94a3b8' },
};

function Badge({ label, color = '#64748b' }) {
  return (
    <span style={{ background: color + '22', border: '1px solid ' + color + '55', color, borderRadius: 4, padding: '1px 6px', fontSize: '0.64rem', fontWeight: 700, whiteSpace: 'nowrap' }}>{label}</span>
  );
}

function DetailSection({ icon: Icon, title, children, iconColor = '#00f0ff' }) {
  return (
    <div style={{ marginBottom: '1rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.35rem' }}>
        <Icon size={13} color={iconColor}/>
        <span style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-secondary)' }}>{title}</span>
      </div>
      {children}
    </div>
  );
}

function InfoRow({ label, value }) {
  if (value === null || value === undefined || value === '') return null;
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '4px' }}>
      <span style={{ fontSize: '0.67rem', color: 'var(--text-secondary)', minWidth: '110px', flexShrink: 0 }}>{label}</span>
      <span style={{ fontSize: '0.72rem', color: 'var(--text-primary)', fontWeight: 600, flex: 1 }}>{String(value)}</span>
    </div>
  );
}

function PersonCard({ person, color = '#00f0ff', label }) {
  if (!person) return null;
  const name = person.name || person.VictimName || person.AccusedName || person.ComplainantName || '';
  const age = person.age || person.AgeYear;
  const gender = person.gender || (person.GenderID === 2 ? 'Female' : person.GenderID === 3 ? 'Transgender' : 'Male');
  return (
    <div style={{ background: 'var(--bg-elevated)', border: '1px solid ' + color + '33', borderLeft: '3px solid ' + color, borderRadius: 6, padding: '0.6rem 0.75rem', marginBottom: '0.5rem' }}>
      <div style={{ fontSize: '0.7rem', fontWeight: 700, color, marginBottom: '4px' }}>{label || ''} {name}</div>
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        {age && <span style={{ fontSize: '0.66rem', color: 'var(--text-secondary)' }}>Age: <strong style={{ color: 'var(--text-primary)' }}>{age}</strong></span>}
        {gender && <span style={{ fontSize: '0.66rem', color: 'var(--text-secondary)' }}>Gender: <strong style={{ color: 'var(--text-primary)' }}>{gender}</strong></span>}
        {person.occupation && <span style={{ fontSize: '0.66rem', color: 'var(--text-secondary)' }}>Occ: <strong style={{ color: 'var(--text-primary)' }}>{person.occupation}</strong></span>}
        {person.isPolice === 'Yes' && <Badge label="Police Victim" color="#ef4444"/>}
      </div>
    </div>
  );
}

function CaseDossier({ caseItem, onClose, lang = 'en' }) {
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  React.useEffect(() => {
    if (!caseItem) return;
    setDetailLoading(true);
    setDetail(null);
    fetch('/server/police_fir_api/api/cases/' + caseItem.CaseMasterID)
      .then(r => r.json())
      .then(d => { setDetail(d); setDetailLoading(false); })
      .catch(() => { setDetailLoading(false); });
  }, [caseItem && caseItem.CaseMasterID]);

  if (!caseItem) return null;
  const statusColor = (STATUS_COLORS[caseItem.Status] || { text: '#94a3b8' }).text;
  const gravityColor = (GRAVITY_COLORS[caseItem.Gravity] || GRAVITY_COLORS['Non-Heinous']).text;
  const cs = detail && detail.chargesheet;
  const csTypeLabel = cs ? (cs.cstype === 'A' ? 'Chargesheeted' : cs.cstype === 'B' ? 'False Case' : cs.cstype === 'C' ? 'Undetected' : null) : null;
  const csTypeColor = cs ? (cs.cstype === 'A' ? '#10b981' : cs.cstype === 'B' ? '#ef4444' : '#f97316') : '#64748b';

  // Chargesheet filing state
  const [csForm, setCsForm] = useState({ cstype: 'A', csdate: new Date().toISOString().split('T')[0], PolicePersonID: '' });
  const [csSubmitting, setCsSubmitting] = useState(false);
  const [csResult, setCsResult] = useState(null);
  const [showCsForm, setShowCsForm] = useState(false);

  // Lookup employees from CaseDossier detail for officer selector
  const officerOptions = detail && detail.caseDetails ? [] : [];

  const handleFileChargesheet = async () => {
    if (!caseItem || !caseItem.CaseMasterID) return;
    setCsSubmitting(true);
    setCsResult(null);
    try {
      const payload = {
        cstype: csForm.cstype,
        csdate: csForm.csdate,
        PolicePersonID: csForm.PolicePersonID ? parseInt(csForm.PolicePersonID) : (caseItem.PolicePersonID || null)
      };
      const res = await fetch(`/server/police_fir_api/api/cases/${caseItem.CaseMasterID}/chargesheet`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to file chargesheet');
      setCsResult({ success: true, message: data.message, cstype: csForm.cstype });
      // Refresh detail pane to show updated chargesheet
      setDetail(null);
      fetch('/server/police_fir_api/api/cases/' + caseItem.CaseMasterID)
        .then(r => r.json())
        .then(d => setDetail(d))
        .catch(() => {});
    } catch (err) {
      setCsResult({ success: false, message: err.message });
    } finally {
      setCsSubmitting(false);
    }
  };

  return (
    <div style={{ width: '380px', flexShrink: 0, height: '100%', overflowY: 'auto', background: 'var(--bg-surface)', borderLeft: '1px solid var(--border)', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '1rem', borderBottom: '1px solid var(--border)', background: 'var(--bg-elevated)', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', marginBottom: '2px' }}>{caseItem.CrimeNo}</div>
            <div style={{ fontSize: '0.85rem', fontWeight: 900, color: 'var(--text-primary)', fontFamily: 'var(--font-title)' }}>Case No. {caseItem.CaseNo}</div>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', padding: '4px' }}><X size={16}/></button>
        </div>
        <div style={{ display: 'flex', gap: '6px', marginTop: '0.5rem', flexWrap: 'wrap' }}>
          {caseItem.Category && <Badge label={caseItem.Category} color="#00f0ff"/>}
          {caseItem.Gravity && <Badge label={caseItem.Gravity} color={gravityColor}/>}
          {caseItem.Status && <Badge label={caseItem.Status} color={statusColor}/>}
          {csTypeLabel && <Badge label={csTypeLabel} color={csTypeColor}/>}
        </div>
      </div>

      <div style={{ padding: '1rem', flex: 1 }}>
        <DetailSection icon={Clock} title={lang === 'kn' ? 'ಪ್ರಕರಣದ ಕಾಲಾವಧಿ' : 'Case Timeline'} iconColor="#eab308">
          <InfoRow label={lang === 'kn' ? 'ಎಫ್.ಐ.ಆರ್ ನೋಂದಣಿ' : 'FIR Registered'} value={caseItem.CrimeRegisteredDate ? new Date(caseItem.CrimeRegisteredDate).toLocaleDateString('en-IN') : ''}/>
          <InfoRow label={lang === 'kn' ? 'ಘಟನೆಯಿಂದ' : 'Incident From'} value={caseItem.IncidentFromDate ? new Date(caseItem.IncidentFromDate).toLocaleString('en-IN') : ''}/>
          <InfoRow label={lang === 'kn' ? 'ಘಟನೆಯವರೆಗೆ' : 'Incident To'} value={caseItem.IncidentToDate ? new Date(caseItem.IncidentToDate).toLocaleString('en-IN') : ''}/>
          {cs && cs.csdate && <InfoRow label={lang === 'kn' ? 'ದೋಷಾರೋಪಣೆ ಪಟ್ಟಿ ದಿನಾಂಕ' : 'Chargesheet Date'} value={new Date(cs.csdate).toLocaleDateString('en-IN')}/>}
        </DetailSection>

        <DetailSection icon={Shield} title={lang === 'kn' ? 'ನ್ಯಾಯಾಂಗ ವ್ಯಾಪ್ತಿ' : 'Jurisdiction'} iconColor="#005eb8">
          <InfoRow label={lang === 'kn' ? 'ಪೊಲೀಸ್ ಠಾಣೆ' : 'Police Station'} value={caseItem.PoliceStation}/>
          <InfoRow label={lang === 'kn' ? 'ತನಿಖಾಧಿಕಾರಿ' : 'Investigating Officer'} value={caseItem.OfficerName}/>
          <InfoRow label={lang === 'kn' ? 'ನ್ಯಾಯಾಲಯ' : 'Court'} value={caseItem.Court}/>
          {caseItem.latitude && caseItem.longitude && <InfoRow label={lang === 'kn' ? 'ಜಿಪಿಎಸ್ ಸಂಯೋಜನೆ' : 'Coordinates'} value={parseFloat(caseItem.latitude).toFixed(5) + ', ' + parseFloat(caseItem.longitude).toFixed(5)}/>}
        </DetailSection>

        <DetailSection icon={BookOpen} title={lang === 'kn' ? 'ಅಪರಾಧದ ವರ್ಗೀಕರಣ' : 'Crime Classification'} iconColor="#a855f7">
          <InfoRow label={lang === 'kn' ? 'ಪ್ರಮುಖ ವಿಭಾಗ' : 'Major Head'} value={caseItem.MajorHead}/>
          <InfoRow label={lang === 'kn' ? 'ಉಪ ವಿಭಾಗ' : 'Minor Head'} value={caseItem.MinorHead}/>
          {caseItem.BriefFacts && (
            <div style={{ marginTop: '0.5rem', background: 'var(--bg-elevated)', borderRadius: 4, padding: '0.5rem 0.75rem', fontSize: '0.72rem', color: 'var(--text-secondary)', lineHeight: 1.5, borderLeft: '3px solid #a855f7' }}>
              <ZiaText text={caseItem.BriefFacts} lang={lang} />
            </div>
          )}
        </DetailSection>

        {detailLoading && <div style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', textAlign: 'center', padding: '1rem' }}>Loading details...</div>}

        {detail && (
          <div>
            {detail.complainant && (
              <DetailSection icon={User} title="Complainant" iconColor="#00f0ff">
                <PersonCard person={detail.complainant} color="#00f0ff"/>
              </DetailSection>
            )}

            {detail.victims && detail.victims.length > 0 && (
              <DetailSection icon={Users} title={'Victims (' + detail.victims.length + ')'} iconColor="#ef4444">
                {detail.victims.map((v,i) => <PersonCard key={i} person={v} color="#ef4444" label={'Victim ' + (i+1) + ':'}/>)}
              </DetailSection>
            )}

            {detail.accused && detail.accused.length > 0 && (
              <DetailSection icon={AlertTriangle} title={'Accused (' + detail.accused.length + ')'} iconColor="#f97316">
                {detail.accused.map((a,i) => (
                  <PersonCard key={i} person={{ ...a, name: a.AccusedName, age: a.AgeYear, gender: a.GenderID === 2 ? 'Female' : a.GenderID === 3 ? 'Transgender' : 'Male' }} color="#f97316" label={a.PersonID || ('A' + (i+1))}/>
                ))}
              </DetailSection>
            )}

            {detail.actsAndSections && detail.actsAndSections.length > 0 && (
              <DetailSection icon={Scale} title="Acts and Sections Invoked" iconColor="#ccff00">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                  {detail.actsAndSections.map((as,i) => (
                    <div key={i} style={{ background: 'var(--bg-elevated)', borderRadius: 4, padding: '5px 8px', display: 'flex', alignItems: 'flex-start', gap: '8px', borderLeft: '3px solid #ccff00' }}>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', fontWeight: 900, color: '#ccff00', minWidth: '80px' }}>{as.ShortName || as.ActCode} S.{as.SectionCode}</span>
                      <span style={{ fontSize: '0.67rem', color: 'var(--text-secondary)', flex: 1, lineHeight: 1.4 }}>{as.SectionDescription || ''}</span>
                    </div>
                  ))}
                </div>
              </DetailSection>
            )}

            {detail.arrests && detail.arrests.length > 0 && (
              <DetailSection icon={Handshake} title={'Arrests / Surrenders (' + detail.arrests.length + ')'} iconColor="#10b981">
                {detail.arrests.map((arr,i) => (
                  <div key={i} style={{ background: 'var(--bg-elevated)', border: '1px solid #10b98133', borderLeft: '3px solid #10b981', borderRadius: 6, padding: '0.5rem 0.75rem', marginBottom: '0.5rem' }}>
                    <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#10b981', marginBottom: '3px' }}>
                      {arr.ArrestSurrenderTypeID === 2 ? 'Surrender' : 'Arrest'} {arr.ArrestSurrenderDate ? new Date(arr.ArrestSurrenderDate).toLocaleDateString('en-IN') : ''}
                    </div>
                    {arr.AccusedName && <div style={{ fontSize: '0.67rem', color: 'var(--text-secondary)' }}>Accused: <strong style={{ color: 'var(--text-primary)' }}>{arr.AccusedName}</strong></div>}
                    {arr.OfficerName && <div style={{ fontSize: '0.67rem', color: 'var(--text-secondary)' }}>IO: <strong style={{ color: 'var(--text-primary)' }}>{arr.OfficerName}</strong></div>}
                    {arr.StateName && <div style={{ fontSize: '0.67rem', color: 'var(--text-secondary)' }}>State: <strong style={{ color: 'var(--text-primary)' }}>{arr.StateName}</strong></div>}
                    {arr.DistrictName && <div style={{ fontSize: '0.67rem', color: 'var(--text-secondary)' }}>District: <strong style={{ color: 'var(--text-primary)' }}>{arr.DistrictName}</strong></div>}
                    {arr.CourtName && <div style={{ fontSize: '0.67rem', color: 'var(--text-secondary)' }}>Court: <strong style={{ color: 'var(--text-primary)' }}>{arr.CourtName}</strong></div>}
                  </div>
                ))}
              </DetailSection>
            )}

            {/* File Chargesheet / Final Report — ChargesheetDetails */}
            <DetailSection icon={FilePlus} title={cs ? 'Final Report Filed' : 'File Final Report (Chargesheet)'} iconColor="#a855f7">
              {cs ? (
                <div style={{ background: 'var(--bg-elevated)', border: '1px solid #a855f733', borderLeft: '3px solid #a855f7', borderRadius: 6, padding: '0.75rem' }}>
                  <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginBottom: '0.35rem' }}>
                    <span style={{ fontSize: '0.7rem', fontWeight: 800, color: csTypeColor }}>
                      {cs.cstype === 'A' ? '✓ Chargesheet Filed (A)' : cs.cstype === 'B' ? '✗ False Case (B)' : '◎ Undetected/Referred (C)'}
                    </span>
                  </div>
                  {cs.csdate && <div style={{ fontSize: '0.67rem', color: 'var(--text-secondary)' }}>Date: <strong style={{ color: 'var(--text-primary)' }}>{new Date(cs.csdate).toLocaleDateString('en-IN')}</strong></div>}
                  {cs.OfficerName && <div style={{ fontSize: '0.67rem', color: 'var(--text-secondary)' }}>Filed by: <strong style={{ color: 'var(--text-primary)' }}>{cs.OfficerName}</strong></div>}
                  <button
                    onClick={() => { setShowCsForm(p => !p); setCsResult(null); }}
                    style={{ marginTop: '0.5rem', background: 'transparent', border: '1px solid #a855f766', borderRadius: 4, padding: '3px 10px', fontSize: '0.65rem', color: '#a855f7', cursor: 'pointer', fontWeight: 700 }}
                  >
                    {showCsForm ? '▲ Cancel Amendment' : '✎ Amend Final Report'}
                  </button>
                </div>
              ) : (
                <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', lineHeight: 1.5 }}>
                  This case is under investigation. File the final report to update case status.
                </div>
              )}

              {/* Filing form — shown when no chargesheet exists OR officer clicks Amend */}
              {(!cs || showCsForm) && (
                <div style={{ marginTop: cs ? '0.5rem' : '0.25rem', background: 'rgba(168,85,247,0.05)', border: '1px dashed rgba(168,85,247,0.3)', borderRadius: 6, padding: '0.75rem' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <div>
                      <label style={{ fontSize: '0.63rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-secondary)', display: 'block', marginBottom: 3 }}>Final Report Type</label>
                      <select
                        className="form-select"
                        value={csForm.cstype}
                        onChange={e => setCsForm(p => ({ ...p, cstype: e.target.value }))}
                        style={{ fontSize: '0.72rem', width: '100%' }}
                      >
                        <option value="A">A — Chargesheet Filed</option>
                        <option value="B">B — False Case / FR</option>
                        <option value="C">C — Undetected / Referred</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ fontSize: '0.63rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-secondary)', display: 'block', marginBottom: 3 }}>Date</label>
                      <input
                        className="form-input"
                        type="date"
                        value={csForm.csdate}
                        onChange={e => setCsForm(p => ({ ...p, csdate: e.target.value }))}
                        style={{ fontSize: '0.72rem', width: '100%' }}
                      />
                    </div>
                  </div>

                  {csResult && (
                    <div style={{ marginBottom: '0.5rem', padding: '5px 8px', borderRadius: 4, background: csResult.success ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', border: '1px solid ' + (csResult.success ? '#10b98133' : '#ef444433'), fontSize: '0.68rem', color: csResult.success ? '#10b981' : '#ef4444', display: 'flex', alignItems: 'center', gap: '5px' }}>
                      {csResult.success ? <CheckCircle size={12}/> : <AlertTriangle size={12}/>}
                      {csResult.message}
                    </div>
                  )}

                  <button
                    onClick={handleFileChargesheet}
                    disabled={csSubmitting}
                    style={{ background: 'linear-gradient(135deg, #7c3aed, #a855f7)', border: 'none', borderRadius: 4, padding: '0.45rem 1.25rem', color: '#fff', fontWeight: 800, fontSize: '0.7rem', cursor: csSubmitting ? 'not-allowed' : 'pointer', opacity: csSubmitting ? 0.6 : 1, display: 'flex', alignItems: 'center', gap: '5px' }}
                  >
                    <FilePlus size={12}/>
                    {csSubmitting ? 'Filing...' : (cs ? 'Submit Amendment' : 'File Final Report')}
                  </button>
                </div>
              )}
            </DetailSection>
          </div>
        )}
      </div>
    </div>
  );
}

export default function CaseRegister({ lang = 'en', incidentsList = [] }) {
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterGravity, setFilterGravity] = useState('');
  const [filterHead, setFilterHead] = useState('');
  const [filterTimeRange, setFilterTimeRange] = useState('ALL');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [selectedCase, setSelectedCase] = useState(null);

  const crimeHeads = useMemo(() => {
    const heads = new Set(incidentsList.map(i => i.MajorHead).filter(Boolean));
    return Array.from(heads).sort();
  }, [incidentsList]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    const nowTime = Date.now();
    return incidentsList.filter(c => {
      const matchSearch = !q || [c.CrimeNo, c.CaseNo, c.MajorHead, c.MinorHead, c.PoliceStation, c.OfficerName, c.BriefFacts].some(v => v && String(v).toLowerCase().includes(q));
      const matchStatus = !filterStatus || c.Status === filterStatus;
      const matchGravity = !filterGravity || c.Gravity === filterGravity;
      const matchHead = !filterHead || c.MajorHead === filterHead;
      
      let matchTime = true;
      if (filterTimeRange && filterTimeRange !== 'ALL') {
        const rawDate = c.RegisteredDate || c.date || c.IncidentFromDate || c.crimeRegisteredDate;
        if (rawDate) {
          const t = new Date(rawDate).getTime();
          if (!isNaN(t)) {
            if (filterTimeRange === 'CUSTOM') {
              if (customFrom) {
                const f = new Date(customFrom).getTime();
                if (!isNaN(f) && t < f) matchTime = false;
              }
              if (customTo) {
                const toT = new Date(customTo).getTime() + (24 * 60 * 60 * 1000 - 1);
                if (!isNaN(toT) && t > toT) matchTime = false;
              }
            } else {
              const diffDays = (nowTime - t) / (1000 * 60 * 60 * 24);
              if (filterTimeRange === '7D' && diffDays > 7) matchTime = false;
              else if (filterTimeRange === '30D' && diffDays > 30) matchTime = false;
              else if (filterTimeRange === '90D' && diffDays > 90) matchTime = false;
              else if (filterTimeRange === '180D' && diffDays > 180) matchTime = false;
              else if (filterTimeRange === '1Y' && diffDays > 365) matchTime = false;
            }
          }
        }
      }

      return matchSearch && matchStatus && matchGravity && matchHead && matchTime;
    });
  }, [incidentsList, search, filterStatus, filterGravity, filterHead, filterTimeRange, customFrom, customTo]);

  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, height: '100%', overflow: 'hidden' }}>
        <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--border)', background: 'var(--bg-elevated)', display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: '180px' }}>
            <Search size={13} style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }}/>
            <input className="form-input" style={{ paddingLeft: '2rem', width: '100%', fontSize: '0.75rem' }} placeholder="Search CrimeNo, station, crime type, officer..." value={search} onChange={e => setSearch(e.target.value)}/>
          </div>
          <select className="form-select" style={{ fontSize: '0.72rem', padding: '0.35rem 0.5rem' }} value={filterTimeRange} onChange={e => setFilterTimeRange(e.target.value)}>
            <option value="ALL">All Time</option>
            <option value="7D">Last 7 Days</option>
            <option value="30D">Last 30 Days (1 Month)</option>
            <option value="90D">Last 3 Months (90 Days)</option>
            <option value="180D">Last 6 Months (180 Days)</option>
            <option value="1Y">Last 1 Year (365 Days)</option>
            <option value="CUSTOM">📅 Custom Range...</option>
          </select>
          {filterTimeRange === 'CUSTOM' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <input type="date" className="form-input" style={{ fontSize: '0.7rem', padding: '0.25rem 0.4rem' }} value={customFrom} onChange={e => setCustomFrom(e.target.value)} title="From Date" />
              <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>to</span>
              <input type="date" className="form-input" style={{ fontSize: '0.7rem', padding: '0.25rem 0.4rem' }} value={customTo} onChange={e => setCustomTo(e.target.value)} title="To Date" />
            </div>
          )}
          <select className="form-select" style={{ fontSize: '0.72rem', padding: '0.35rem 0.5rem' }} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
            <option value="">All Statuses</option>
            <option>Under Investigation</option>
            <option>Charge Sheeted</option>
            <option>Closed</option>
          </select>
          <select className="form-select" style={{ fontSize: '0.72rem', padding: '0.35rem 0.5rem' }} value={filterGravity} onChange={e => setFilterGravity(e.target.value)}>
            <option value="">All Gravity</option>
            <option>Heinous</option>
            <option>Non-Heinous</option>
          </select>
          {crimeHeads.length > 0 && (
            <select className="form-select" style={{ fontSize: '0.72rem', padding: '0.35rem 0.5rem', maxWidth: '160px' }} value={filterHead} onChange={e => setFilterHead(e.target.value)}>
              <option value="">All Crime Heads</option>
              {crimeHeads.map(h => <option key={h}>{h}</option>)}
            </select>
          )}
          <span style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>{filtered.length} cases</span>
        </div>

        <div style={{ flex: 1, overflowY: 'auto' }}>
          {filtered.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60%', gap: '0.5rem' }}>
              <FileCheck size={36} color="var(--text-secondary)" strokeWidth={1}/>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                {incidentsList.length === 0 ? 'No cases registered yet' : 'No cases match filters'}
              </div>
              <div style={{ fontSize: '0.68rem', color: '#475569' }}>
                {incidentsList.length === 0 ? 'Register an FIR to see it appear here' : 'Adjust your search or filters'}
              </div>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'var(--bg-elevated)', position: 'sticky', top: 0, zIndex: 5 }}>
                  {['Crime No.', 'Date', 'Station', 'Crime Type', 'Sub-Type', 'Gravity', 'Status', ''].map(h => (
                    <th key={h} style={{ padding: '0.5rem 0.75rem', textAlign: 'left', fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-secondary)', borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((c, i) => {
                  const statusColor = (STATUS_COLORS[c.Status] || { text: '#94a3b8' }).text;
                  const gravityColor = (GRAVITY_COLORS[c.Gravity] || GRAVITY_COLORS['Non-Heinous']).text;
                  const isSelected = selectedCase && selectedCase.CaseMasterID === c.CaseMasterID;
                  return (
                    <tr key={c.CaseMasterID} onClick={() => setSelectedCase(isSelected ? null : c)}
                      style={{ background: isSelected ? 'rgba(0,240,255,0.06)' : i%2===0 ? 'transparent' : 'rgba(255,255,255,0.01)', borderBottom: '1px solid var(--border)', cursor: 'pointer', borderLeft: isSelected ? '3px solid #00f0ff' : '3px solid transparent', transition: 'background 0.15s' }}>
                      <td style={{ padding: '0.5rem 0.75rem', fontFamily: 'var(--font-mono)', fontSize: '0.68rem', color: 'var(--primary-light)', whiteSpace: 'nowrap' }}>{c.CrimeNo}</td>
                      <td style={{ padding: '0.5rem 0.75rem', fontSize: '0.69rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>{c.CrimeRegisteredDate ? new Date(c.CrimeRegisteredDate).toLocaleDateString('en-IN') : ''}</td>
                      <td style={{ padding: '0.5rem 0.75rem', fontSize: '0.69rem', color: 'var(--text-primary)', maxWidth: '130px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.PoliceStation}</td>
                      <td style={{ padding: '0.5rem 0.75rem', fontSize: '0.69rem', color: 'var(--text-secondary)', maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.MajorHead}</td>
                      <td style={{ padding: '0.5rem 0.75rem', fontSize: '0.69rem', color: 'var(--text-secondary)', maxWidth: '110px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.MinorHead}</td>
                      <td style={{ padding: '0.5rem 0.75rem' }}><Badge label={c.Gravity || 'Unknown'} color={gravityColor}/></td>
                      <td style={{ padding: '0.5rem 0.75rem' }}><Badge label={c.Status || 'Unknown'} color={statusColor}/></td>
                      <td style={{ padding: '0.5rem 0.5rem', color: 'var(--text-secondary)' }}><ChevronRight size={14} style={{ opacity: isSelected ? 1 : 0.4 }}/></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
      {selectedCase && <CaseDossier caseItem={selectedCase} onClose={() => setSelectedCase(null)} lang={lang}/>}
    </div>
  );
}
