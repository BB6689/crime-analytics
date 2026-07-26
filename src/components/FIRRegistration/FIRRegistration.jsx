import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Plus, Trash2, CheckCircle, AlertCircle, FileText, Users, Scale, Shield, Clock, MapPin, User, ChevronRight, Sparkles } from 'lucide-react';

const SECTION_STYLE = { background:'var(--bg-surface)', border:'1px solid var(--border)', borderRadius:'var(--radius-md)', padding:'1.25rem', marginBottom:'1rem' };
const SECTION_TITLE_STYLE = { fontSize:'0.72rem', fontWeight:800, textTransform:'uppercase', letterSpacing:'0.07em', color:'var(--text-secondary)', borderBottom:'1px solid var(--border)', paddingBottom:'0.5rem', marginBottom:'1rem', display:'flex', alignItems:'center', gap:'0.4rem' };
const GRID2 = { display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.75rem' };
const GRID3 = { display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'0.75rem' };
const LABEL_STYLE = { fontSize:'0.67rem', fontWeight:700, textTransform:'uppercase', color:'var(--text-secondary)', marginBottom:'4px', letterSpacing:'0.04em', display:'block' };

const GENDER_OPTIONS = [{ value:1, label:'Male'}, { value:2, label:'Female'}, { value:3, label:'Transgender'}];

function FormGroup({ label, children }) {
  return (
    <div style={{ display:'flex', flexDirection:'column' }}>
      <label style={LABEL_STYLE}>{label}</label>
      {children}
    </div>
  );
}

const DEFAULT_CRIME_HEADS = [
  { CrimeHeadID: 1, CrimeGroupName: 'Crimes Against Person / Body' },
  { CrimeHeadID: 2, CrimeGroupName: 'Crimes Against Property' },
  { CrimeHeadID: 3, CrimeGroupName: 'Crimes Against Women & Children' },
  { CrimeHeadID: 4, CrimeGroupName: 'Cyber Crime & Online Fraud' },
  { CrimeHeadID: 5, CrimeGroupName: 'Economic Offences & Financial Fraud' },
  { CrimeHeadID: 6, CrimeGroupName: 'Narcotics & NDPS Offences' },
  { CrimeHeadID: 7, CrimeGroupName: 'Public Order & Riot Offences' },
  { CrimeHeadID: 8, CrimeGroupName: 'Other IPC / Special & Local Laws (SLL)' }
];

const DEFAULT_CRIME_SUBHEADS = [
  { CrimeSubHeadID: 101, CrimeHeadID: 1, CrimeHeadName: 'Murder / Attempt to Murder' },
  { CrimeSubHeadID: 102, CrimeHeadID: 1, CrimeHeadName: 'Grievous Hurt / Assault' },
  { CrimeSubHeadID: 103, CrimeHeadID: 1, CrimeHeadName: 'Kidnapping & Abduction' },
  { CrimeSubHeadID: 201, CrimeHeadID: 2, CrimeHeadName: 'Robbery & Dacoity' },
  { CrimeSubHeadID: 202, CrimeHeadID: 2, CrimeHeadName: 'House Breaking / Burglary' },
  { CrimeSubHeadID: 203, CrimeHeadID: 2, CrimeHeadName: 'Theft / Vehicle Theft' },
  { CrimeSubHeadID: 301, CrimeHeadID: 3, CrimeHeadName: 'POCSO & Offences Against Children' },
  { CrimeSubHeadID: 302, CrimeHeadID: 3, CrimeHeadName: 'Dowry Harassment / Cruelty' },
  { CrimeSubHeadID: 303, CrimeHeadID: 3, CrimeHeadName: 'Sexual Harassment & Assault' },
  { CrimeSubHeadID: 401, CrimeHeadID: 4, CrimeHeadName: 'Financial Fraud & Phishing' },
  { CrimeSubHeadID: 402, CrimeHeadID: 4, CrimeHeadName: 'Identity Theft / Social Media Crime' },
  { CrimeSubHeadID: 501, CrimeHeadID: 5, CrimeHeadName: 'Cheating / Criminal Breach of Trust' },
  { CrimeSubHeadID: 502, CrimeHeadID: 5, CrimeHeadName: 'Counterfeiting & Forgery' },
  { CrimeSubHeadID: 601, CrimeHeadID: 6, CrimeHeadName: 'NDPS Drug Possession / Trafficking' },
  { CrimeSubHeadID: 701, CrimeHeadID: 7, CrimeHeadName: 'Rioting & Unlawful Assembly' },
  { CrimeSubHeadID: 801, CrimeHeadID: 8, CrimeHeadName: 'Rash Driving & Traffic Accidents' },
  { CrimeSubHeadID: 802, CrimeHeadID: 8, CrimeHeadName: 'Other IPC Violations' }
];

function emptyVictim() { return { name:'', age:'', genderId:1, isPolice:false }; }
function emptyAccused() { return { name:'', age:'', genderId:1 }; }
function emptySection() { return { actCode:'', sectionCode:'' }; }
function emptyArrest() { return { ArrestSurrenderDate:'', ArrestSurrenderTypeID:'1', ArrestSurrenderStateId:'', ArrestSurrenderDistrictId:'' }; }

function computeSubHeads(lookups, headId) {
  if (!headId) return [];
  const list = (lookups && lookups.crimeSubHeads && lookups.crimeSubHeads.length > 0)
    ? lookups.crimeSubHeads
    : DEFAULT_CRIME_SUBHEADS;
  return list.filter(s => String(s.CrimeHeadID) === String(headId));
}

export default function FIRRegistration({ lang = 'en', preFillData }) {
  const [lookups, setLookups] = useState(null);
  const [lookupsLoading, setLookupsLoading] = useState(true);
  const [lookupsError, setLookupsError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [showAiBanner, setShowAiBanner] = useState(false);

  const [form, setForm] = useState({
    CaseCategoryID:'1', PoliceStationID:'', PolicePersonID:'', CourtID:'',
    GravityOffenceID:'1', CrimeMajorHeadID:'', CrimeMinorHeadID:'',
    CrimeRegisteredDate: new Date().toISOString().split('T')[0],
    IncidentFromDate:'', IncidentToDate:'', InfoReceivedPSDate:'',
    latitude:'', longitude:'', BriefFacts:'',
    ComplainantName:'', ComplainantAge:'', ComplainantGenderID:'1',
    ComplainantOccupationID:'', ComplainantReligionID:'', ComplainantCasteID:''
  });
  const [victims, setVictims] = useState([emptyVictim()]);
  const [accused, setAccused] = useState([emptyAccused()]);
  const [actsSections, setActsSections] = useState([emptySection()]);
  const [showArrest, setShowArrest] = useState(false);
  const [arrestData, setArrestData] = useState(emptyArrest());

  useEffect(() => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout

    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const baseUrl = isLocal ? 'http://localhost:3000' : '/server/police_fir_api';

    fetch(`${baseUrl}/api/lookups`, { signal: controller.signal })
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then(data => { 
        setLookups(data); 
        setLookupsLoading(false); 
        setLookupsError(null);
      })
      .catch(err => { 
        console.warn('Failed to fetch lookups:', err.message);
        setLookups(null);
        setLookupsLoading(false);
        setLookupsError(err.message);
      })
      .finally(() => clearTimeout(timeoutId));

    return () => {
      controller.abort();
      clearTimeout(timeoutId);
    };
  }, []);

  useEffect(() => {
    if (preFillData) {
      setForm(p => ({
        ...p,
        ComplainantName: preFillData.ComplainantName || p.ComplainantName,
        ComplainantAge: preFillData.ComplainantAge || p.ComplainantAge,
        BriefFacts: preFillData.BriefFacts || p.BriefFacts
      }));

      if (Array.isArray(preFillData.accusedList) && preFillData.accusedList.length > 0) {
        setAccused(preFillData.accusedList);
      }

      if (Array.isArray(preFillData.actsSections) && preFillData.actsSections.length > 0) {
        setActsSections(preFillData.actsSections);
      }

      if (preFillData.prefilledFromAI) {
        setShowAiBanner(true);
      }
    }
  }, [preFillData]);

  const subHeads = computeSubHeads(lookups, form.CrimeMajorHeadID);
  const updateForm = (k, v) => setForm(p => ({ ...p, [k]: v }));

  // Derive station's district → filter courts
  const filteredCourts = useMemo(() => {
    const allCourts = (lookups && lookups.courts) || [];
    if (!form.PoliceStationID || !lookups) return allCourts;
    const station = (lookups.units || []).find(u => String(u.UnitID) === String(form.PoliceStationID));
    if (!station || !station.DistrictID) return allCourts;
    const districtCourts = allCourts.filter(c => String(c.DistrictID) === String(station.DistrictID));
    return districtCourts.length > 0 ? districtCourts : allCourts;
  }, [form.PoliceStationID, lookups]);

  // Suggested Act+Section combos for selected CrimeMajorHead (from CrimeHeadActSection table)
  const suggestedSections = useMemo(() => {
    if (!form.CrimeMajorHeadID || !lookups || !lookups.crimeHeadActSections) return [];
    return (lookups.crimeHeadActSections || []).filter(r => String(r.CrimeHeadID) === String(form.CrimeMajorHeadID));
  }, [form.CrimeMajorHeadID, lookups]);

  const applySuggestedSection = (actCode, sectionCode) => {
    setActsSections(prev => {
      // Don't add duplicate
      if (prev.some(s => s.actCode === actCode && s.sectionCode === sectionCode)) return prev;
      // Replace first empty row, or add
      const emptyIdx = prev.findIndex(s => !s.actCode && !s.sectionCode);
      if (emptyIdx >= 0) {
        return prev.map((s, i) => i === emptyIdx ? { actCode, sectionCode } : s);
      }
      return [...prev, { actCode, sectionCode }];
    });
  };

  const updateArrest = (k, v) => setArrestData(p => ({ ...p, [k]: v }));

  const updateVictim = (i, k, v) => setVictims(p => p.map((item, idx) => idx===i ? {...item,[k]:v} : item));
  const addVictim = () => setVictims(p => [...p, emptyVictim()]);
  const removeVictim = i => setVictims(p => p.filter((_,idx)=>idx!==i));

  const updateAccused = (i, k, v) => setAccused(p => p.map((item,idx)=>idx===i?{...item,[k]:v}:item));
  const addAccused = () => setAccused(p => [...p, emptyAccused()]);
  const removeAccused = i => setAccused(p => p.filter((_,idx)=>idx!==i));

  const updateSection = (i, k, v) => setActsSections(p => p.map((item,idx)=>idx===i?{...item,[k]:v}:item));
  const addSection = () => setActsSections(p => [...p, emptySection()]);
  const removeSection = i => setActsSections(p => p.filter((_,idx)=>idx!==i));

  const handleSubmit = async e => {
    e.preventDefault();
    setSubmitting(true);
    setResult(null);
    try {
      const payload = {
        ...form,
        CaseCategoryID: parseInt(form.CaseCategoryID)||1,
        PoliceStationID: parseInt(form.PoliceStationID)||null,
        PolicePersonID: parseInt(form.PolicePersonID)||null,
        CourtID: parseInt(form.CourtID)||null,
        GravityOffenceID: parseInt(form.GravityOffenceID)||1,
        CrimeMajorHeadID: parseInt(form.CrimeMajorHeadID)||null,
        CrimeMinorHeadID: parseInt(form.CrimeMinorHeadID)||null,
        ComplainantGenderID: parseInt(form.ComplainantGenderID)||1,
        ComplainantOccupationID: parseInt(form.ComplainantOccupationID)||null,
        ComplainantReligionID: parseInt(form.ComplainantReligionID)||null,
        ComplainantCasteID: parseInt(form.ComplainantCasteID)||null,
        victimList: victims.filter(v=>v.name).map(v=>({...v,age:parseInt(v.age)||null,genderId:parseInt(v.genderId)||1})),
        accusedList: accused.filter(a=>a.name).map(a=>({...a,age:parseInt(a.age)||null,genderId:parseInt(a.genderId)||1})),
        actsSections: actsSections.filter(s=>s.actCode&&s.sectionCode).map(s=>({actCode:s.actCode,sectionCode:s.sectionCode})),
        // ArrestSurrender (optional)
        ...(showArrest && arrestData.ArrestSurrenderDate ? {
          ArrestSurrenderDate: arrestData.ArrestSurrenderDate,
          ArrestSurrenderTypeID: parseInt(arrestData.ArrestSurrenderTypeID)||1,
          ArrestSurrenderStateId: parseInt(arrestData.ArrestSurrenderStateId)||null,
          ArrestSurrenderDistrictId: parseInt(arrestData.ArrestSurrenderDistrictId)||null
        } : {})
      };
      const res = await fetch('/server/police_fir_api/api/cases', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(payload) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Registration failed');
      setResult({ success:true, crimeNo:data.crimeNo, caseNo:data.caseNo });
    } catch(err) {
      setResult({ success:false, error:err.message });
    } finally {
      setSubmitting(false);
    }
  };

  const STEPS = [
    { id: 'case',        label: lang === 'kn' ? 'ಪ್ರಕರಣದ ವಿವರಗಳು' : lang === 'hi' ? 'मामला विवरण' : 'Case Details',       icon: FileText,  color: '#00f0ff' },
    { id: 'incident',    label: lang === 'kn' ? 'ಘಟನೆಯ ಕಾಲಾನುಕ್ರಮಣಿಕೆ' : lang === 'hi' ? 'घटना का घटनाक्रम' : 'Incident Timeline',  icon: Clock,     color: '#00f0ff' },
    { id: 'complainant', label: lang === 'kn' ? 'ದೂರುದಾರರು' : lang === 'hi' ? 'शिकायतकर्ता' : 'Complainant',        icon: User,      color: '#00f0ff' },
    { id: 'victims',     label: lang === 'kn' ? 'ಸಂತ್ರಸ್ತರು' : lang === 'hi' ? 'पीड़ित' : 'Victims',            icon: Shield,    color: '#10b981' },
    { id: 'accused',     label: lang === 'kn' ? 'ಆರೋಪಿಗಳು' : lang === 'hi' ? 'अभियुक्त' : 'Accused',            icon: Users,     color: '#f97316' },
    { id: 'legal',       label: lang === 'kn' ? 'ಕಾಯ್ದೆಗಳು ಮತ್ತು ಸೆಕ್ಷನ್‌ಗಳು' : lang === 'hi' ? 'कानूनी धाराएं' : 'Legal Sections',     icon: Scale,     color: '#ccff00' },
    { id: 'arrest',      label: lang === 'kn' ? 'ದಸ್ತಗಿರಿ' : lang === 'hi' ? 'गिरफ्तारी' : 'Arrest',            icon: Shield,    color: '#a855f7' },
  ];

  const stepRefs = { case: useRef(null), incident: useRef(null), complainant: useRef(null), victims: useRef(null), accused: useRef(null), legal: useRef(null), arrest: useRef(null) };
  const formScrollContainerRef = useRef(null);
  const isManualScrollingRef = useRef(false);
  const [activeStep, setActiveStep] = useState(0);

  const scrollToStep = (idx) => {
    isManualScrollingRef.current = true;
    setActiveStep(idx);
    const stepKey = STEPS[idx].id;
    const el = stepRefs[stepKey]?.current;
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setTimeout(() => {
      isManualScrollingRef.current = false;
    }, 800);
  };

  useEffect(() => {
    const container = formScrollContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      if (isManualScrollingRef.current) return;
      const containerTop = container.getBoundingClientRect().top;

      let currentStepIdx = 0;
      for (let i = 0; i < STEPS.length; i++) {
        const key = STEPS[i].id;
        const el = stepRefs[key]?.current;
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top - containerTop <= 160) {
            currentStepIdx = i;
          }
        }
      }
      setActiveStep(currentStepIdx);
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  if (lookupsLoading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100%', flexDirection:'column', gap:'1rem' }}>
      <div style={{ width:36, height:36, border:'3px solid var(--border)', borderTop:'3px solid #00f0ff', borderRadius:'50%', animation:'spin 1s linear infinite' }}/>
      <span style={{ color:'var(--text-secondary)', fontSize:'0.8rem' }}>Loading FIR Registration...</span>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  if (lookupsError && !lookups) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100%', flexDirection:'column', gap:'1.5rem', padding:'2rem' }}>
      <AlertCircle size={56} color="#f97316" strokeWidth={1.5}/>
      <div style={{ textAlign:'center' }}>
        <div style={{ fontSize:'1.1rem', fontWeight:800, color:'#f97316' }}>Unable to Load Lookup Data</div>
        <div style={{ fontSize:'0.8rem', color:'var(--text-secondary)', marginTop:'0.5rem' }}>The server responded slowly or is unavailable.<br/>You can continue with the FIR form using default options.</div>
      </div>
      <button 
        onClick={() => { setLookupsLoading(false); setLookupsError(null); }}
        style={{ background:'var(--primary)', border:'none', borderRadius:'var(--radius-sm)', padding:'0.6rem 2rem', color:'#000', fontWeight:800, fontSize:'0.8rem', cursor:'pointer' }}>
        Continue Anyway
      </button>
    </div>
  );

  if (result && result.success) return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'100%', gap:'1.5rem', padding:'2rem' }}>
      <CheckCircle size={56} color="#10b981" strokeWidth={1.5}/>
      <div style={{ textAlign:'center' }}>
        <div style={{ fontSize:'1.2rem', fontWeight:900, color:'#10b981', fontFamily:'var(--font-title)' }}>FIR Registered Successfully</div>
        <div style={{ fontSize:'0.8rem', color:'var(--text-secondary)', marginTop:'0.5rem' }}>Your case has been entered into the Karnataka Police FIR System</div>
      </div>
      <div style={{ background:'var(--bg-surface)', border:'1px solid #10b98144', borderRadius:'var(--radius-md)', padding:'1.5rem 2.5rem', textAlign:'center' }}>
        <div style={{ fontSize:'0.65rem', color:'var(--text-secondary)', textTransform:'uppercase', letterSpacing:'0.08em' }}>Crime Number</div>
        <div style={{ fontSize:'1.5rem', fontWeight:900, fontFamily:'var(--font-mono)', color:'#00f0ff', letterSpacing:'0.05em', marginTop:'4px' }}>{result.crimeNo}</div>
        <div style={{ fontSize:'0.8rem', color:'var(--text-secondary)', marginTop:'8px' }}>Case No: <strong style={{ color:'var(--text-primary)' }}>{result.caseNo}</strong></div>
      </div>
      <button onClick={() => setResult(null)} style={{ background:'var(--primary)', border:'none', borderRadius:'var(--radius-sm)', padding:'0.6rem 2rem', color:'#000', fontWeight:800, fontSize:'0.8rem', cursor:'pointer' }}>Register Another FIR</button>
    </div>
  );

  const L = lookups || {};

  return (
    <div style={{ height:'100%', display:'flex', flexDirection:'column', overflow:'hidden' }}>
      {showAiBanner && (
        <div style={{
          background: 'var(--primary-dim)',
          borderBottom: '1px solid var(--primary)',
          padding: '0.55rem 1.25rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '0.75rem',
          fontWeight: 700,
          color: 'var(--primary-light)',
          flexShrink: 0
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FileText size={15} style={{ color: 'var(--primary)' }} />
            <span>{lang === 'kn' ? 'ದಾಖಲೆಯಿಂದ ಪಡೆದ ಪಠ್ಯ ಮಾಹಿತಿಯನ್ನು ಎಫ್‌ಐಆರ್ ನೋಂದಣಿ ನಮೂನೆಗೆ ಭರ್ತಿ ಮಾಡಲಾಗಿದೆ' : lang === 'hi' ? 'दस्तावेज ओसीआर से निकाला गया डेटा एफआईआर फॉर्म में भरा गया है' : 'AI Document Field Extraction Applied (Complainant, Accused & Legal Sections Matched)'}</span>
          </div>
          <button onClick={() => setShowAiBanner(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontWeight: 800 }}>✕</button>
        </div>
      )}

      {/* Step Wizard Header */}
      <div style={{ background:'var(--bg-elevated)', borderBottom:'1px solid var(--border)', padding:'0.6rem 1.25rem', flexShrink:0 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', gap:'0.25rem', flex:1, maxWidth:'720px' }}>
          {STEPS.map((step, idx) => {
            const StepIcon = step.icon;
            const isActive = idx === activeStep;
            const isDone = idx < activeStep;
            return (
              <React.Fragment key={step.id}>
                <button
                  type="button"
                  onClick={() => scrollToStep(idx)}
                  style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:'3px', background:'none', border:'none', cursor:'pointer', padding:'0.3rem 0.5rem', borderRadius:6,
                    opacity: isActive ? 1 : isDone ? 0.9 : 0.45,
                    transition: 'all 0.2s'
                  }}
                >
                  <div style={{ width:26, height:26, borderRadius:'50%',
                    background: isActive ? step.color + '22' : isDone ? '#10b98122' : 'transparent',
                    border: `1.5px solid ${isActive ? step.color : isDone ? '#10b981' : 'rgba(255,255,255,0.12)'}`,
                    display:'flex', alignItems:'center', justifyContent:'center', transition:'all 0.2s'
                  }}>
                    {isDone ? <CheckCircle size={13} color="#10b981"/> : <StepIcon size={13} color={isActive ? step.color : '#64748b'}/>}
                  </div>
                  <span style={{ fontSize:'0.58rem', fontWeight: isActive ? 800 : 600, color: isActive ? step.color : isDone ? '#10b981' : '#64748b', whiteSpace:'nowrap', letterSpacing:'0.03em' }}>
                    {step.label}
                  </span>
                </button>
                {idx < STEPS.length - 1 && (
                  <div style={{ flex:1, height:1, background: idx < activeStep ? '#10b98144' : 'rgba(255,255,255,0.06)', margin:'0 2px', marginBottom:14 }}/>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Form Scroll Area */}
      <div ref={formScrollContainerRef} style={{ flex:1, overflowY:'auto', padding:'1rem 1.25rem' }}>
      <div style={{ maxWidth:'860px', margin:'0 auto' }}>

        {result && !result.success && (
          <div style={{ background:'#ef444422', border:'1px solid #ef4444', borderRadius:'var(--radius-sm)', padding:'0.75rem 1rem', marginBottom:'1rem', display:'flex', alignItems:'center', gap:'0.5rem', fontSize:'0.75rem', color:'#ef4444' }}>
            <AlertCircle size={14}/> {result.error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div ref={stepRefs.case} style={SECTION_STYLE}>
            <div style={SECTION_TITLE_STYLE}><FileText size={13} color="#00f0ff"/> Case Details</div>
            <div style={GRID2}>
              <FormGroup label="Case Category">
                <select className="form-select" value={form.CaseCategoryID} onChange={e=>updateForm('CaseCategoryID',e.target.value)}>
                  {(L.categories||[]).map(c=><option key={c.CaseCategoryID} value={c.CaseCategoryID}>{c.LookupValue}</option>)}
                  {!L.categories?.length && <>
                    <option value="1">FIR</option>
                    <option value="2">UDR</option>
                    <option value="3">Zero FIR</option>
                    <option value="4">PAR</option>
                  </>}
                </select>
              </FormGroup>
              <FormGroup label="FIR Date">
                <input className="form-input" type="date" value={form.CrimeRegisteredDate} onChange={e=>updateForm('CrimeRegisteredDate',e.target.value)} required/>
              </FormGroup>
              <FormGroup label="Police Station">
                <select className="form-select" value={form.PoliceStationID} onChange={e=>updateForm('PoliceStationID',e.target.value)} required>
                  <option value="">Select Station</option>
                  {(L.units||[]).map(u=><option key={u.UnitID} value={u.UnitID}>{u.UnitName}</option>)}
                </select>
              </FormGroup>
              <FormGroup label="Investigating Officer">
                <select className="form-select" value={form.PolicePersonID} onChange={e=>updateForm('PolicePersonID',e.target.value)}>
                  <option value="">Select Officer</option>
                  {(L.employees||[]).map(emp=><option key={emp.EmployeeID} value={emp.EmployeeID}>{emp.FirstName} (KGID: {emp.KGID})</option>)}
                </select>
              </FormGroup>
              <FormGroup label="Gravity of Offence">
                <select className="form-select" value={form.GravityOffenceID} onChange={e=>updateForm('GravityOffenceID',e.target.value)}>
                  {(L.gravities||[]).map(g=><option key={g.GravityOffenceID} value={g.GravityOffenceID}>{g.LookupValue}</option>)}
                  {!L.gravities?.length && <>
                    <option value="1">Heinous</option>
                    <option value="2">Non-Heinous</option>
                  </>}
                </select>
              </FormGroup>
              <FormGroup label="Court">
                <select className="form-select" value={form.CourtID} onChange={e=>updateForm('CourtID',e.target.value)}>
                  <option value="">Select Court{form.PoliceStationID ? ' (filtered by station district)' : ''}</option>
                  {filteredCourts.map(c=><option key={c.CourtID} value={c.CourtID}>{c.CourtName}</option>)}
                </select>
              </FormGroup>
            </div>
            <div style={GRID2}>
              <FormGroup label="Major Crime Head">
                <select className="form-select" value={form.CrimeMajorHeadID} onChange={e=>{updateForm('CrimeMajorHeadID',e.target.value);updateForm('CrimeMinorHeadID','');}} required>
                  <option value="">Select Crime Category</option>
                  {(L.crimeHeads && L.crimeHeads.length > 0 ? L.crimeHeads : DEFAULT_CRIME_HEADS).map(h => (
                    <option key={h.CrimeHeadID} value={h.CrimeHeadID}>{h.CrimeGroupName}</option>
                  ))}
                </select>
              </FormGroup>
              <FormGroup label="Minor Crime Sub-Head">
                <select className="form-select" value={form.CrimeMinorHeadID} onChange={e=>updateForm('CrimeMinorHeadID',e.target.value)} disabled={!form.CrimeMajorHeadID}>
                  <option value="">Select Sub-Category</option>
                  {subHeads.map(s=><option key={s.CrimeSubHeadID} value={s.CrimeSubHeadID}>{s.CrimeHeadName}</option>)}
                </select>
              </FormGroup>
            </div>
            {/* CrimeHeadActSection suggested sections */}
            {suggestedSections.length > 0 && (
              <div style={{ marginTop:'0.5rem', padding:'0.6rem 0.75rem', background:'rgba(204,255,0,0.06)', border:'1px solid rgba(204,255,0,0.2)', borderRadius:6 }}>
                <div style={{ fontSize:'0.62rem', fontWeight:800, color:'#ccff00', textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:'0.4rem' }}>
                  ⚡ Suggested Legal Sections for this Crime Head
                </div>
                <div style={{ display:'flex', flexWrap:'wrap', gap:'0.35rem' }}>
                  {suggestedSections.map((s, i) => (
                    <button
                      key={i} type="button"
                      onClick={() => applySuggestedSection(s.ActCode || s.actCode, s.SectionCode || s.sectionCode)}
                      style={{ background:'rgba(204,255,0,0.12)', border:'1px solid rgba(204,255,0,0.35)', borderRadius:4, padding:'2px 8px', fontSize:'0.68rem', color:'#ccff00', cursor:'pointer', fontWeight:600 }}
                    >
                      {s.ActCode || s.actCode} § {s.SectionCode || s.sectionCode}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <FormGroup label="Brief Facts of the Case">
              <textarea className="form-input" rows={3} style={{resize:'vertical'}} value={form.BriefFacts} onChange={e=>updateForm('BriefFacts',e.target.value)} placeholder="Describe the incident briefly..."/>
            </FormGroup>
          </div>

          <div ref={stepRefs.incident} style={SECTION_STYLE}>
            <div style={SECTION_TITLE_STYLE}><Clock size={13} color="#eab308"/> Incident Timeline and Location</div>
            <div style={GRID3}>
              <FormGroup label="Incident From">
                <input className="form-input" type="datetime-local" value={form.IncidentFromDate} onChange={e=>updateForm('IncidentFromDate',e.target.value)}/>
              </FormGroup>
              <FormGroup label="Incident To">
                <input className="form-input" type="datetime-local" value={form.IncidentToDate} onChange={e=>updateForm('IncidentToDate',e.target.value)}/>
              </FormGroup>
              <FormGroup label="Info Received at PS">
                <input className="form-input" type="datetime-local" value={form.InfoReceivedPSDate} onChange={e=>updateForm('InfoReceivedPSDate',e.target.value)}/>
              </FormGroup>
            </div>
            <div style={GRID2}>
              <FormGroup label="Latitude (GPS)">
                <input className="form-input" type="number" step="any" placeholder="e.g. 12.97194" value={form.latitude} onChange={e=>updateForm('latitude',e.target.value)}/>
              </FormGroup>
              <FormGroup label="Longitude (GPS)">
                <input className="form-input" type="number" step="any" placeholder="e.g. 77.59369" value={form.longitude} onChange={e=>updateForm('longitude',e.target.value)}/>
              </FormGroup>
            </div>
          </div>

          <div ref={stepRefs.complainant} style={SECTION_STYLE}>
            <div style={SECTION_TITLE_STYLE}><Shield size={13} color="#00f0ff"/> Complainant Details</div>
            <div style={GRID2}>
              <FormGroup label="Full Name">
                <input className="form-input" type="text" placeholder="Complainant full name" value={form.ComplainantName} onChange={e=>updateForm('ComplainantName',e.target.value)} required/>
              </FormGroup>
              <FormGroup label="Age">
                <input className="form-input" type="number" min="0" max="120" placeholder="Age" value={form.ComplainantAge} onChange={e=>updateForm('ComplainantAge',e.target.value)}/>
              </FormGroup>
              <FormGroup label="Gender">
                <select className="form-select" value={form.ComplainantGenderID} onChange={e=>updateForm('ComplainantGenderID',e.target.value)}>
                  {GENDER_OPTIONS.map(g=><option key={g.value} value={g.value}>{g.label}</option>)}
                </select>
              </FormGroup>
              <FormGroup label="Occupation">
                <select className="form-select" value={form.ComplainantOccupationID} onChange={e=>updateForm('ComplainantOccupationID',e.target.value)}>
                  <option value="">Select Occupation</option>
                  {(L.occupations||[]).map(o=><option key={o.OccupationID} value={o.OccupationID}>{o.OccupationName}</option>)}
                </select>
              </FormGroup>
              <FormGroup label="Religion">
                <select className="form-select" value={form.ComplainantReligionID} onChange={e=>updateForm('ComplainantReligionID',e.target.value)}>
                  <option value="">Select Religion</option>
                  {(L.religions||[]).map(r=><option key={r.ReligionID} value={r.ReligionID}>{r.ReligionName}</option>)}
                </select>
              </FormGroup>
              <FormGroup label="Caste">
                <select className="form-select" value={form.ComplainantCasteID} onChange={e=>updateForm('ComplainantCasteID',e.target.value)}>
                  <option value="">Select Caste</option>
                  {(L.castes||[]).map(c=><option key={c.caste_master_id} value={c.caste_master_id}>{c.caste_master_name}</option>)}
                </select>
              </FormGroup>
            </div>
          </div>

          <div ref={stepRefs.victims} style={SECTION_STYLE}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'0.75rem' }}>
              <div style={SECTION_TITLE_STYLE}><Shield size={13} color="#ef4444"/> Victim Details</div>
              <button type="button" onClick={addVictim} style={{ background:'#ef444422', border:'1px solid #ef444466', borderRadius:'var(--radius-sm)', padding:'4px 10px', fontSize:'0.7rem', color:'#ef4444', cursor:'pointer', display:'flex', alignItems:'center', gap:'4px' }}>
                <Plus size={11}/> Add Victim
              </button>
            </div>
            {victims.map((v,i) => (
              <div key={i} style={{ background:'var(--bg-elevated)', borderRadius:6, padding:'0.75rem', marginBottom:'0.6rem', border:'1px solid var(--border)', borderLeft:'3px solid #ef4444' }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'0.5rem' }}>
                  <span style={{ fontSize:'0.7rem', fontWeight:700, color:'#ef4444' }}>Victim {i+1}</span>
                  {victims.length>1 && <button type="button" onClick={()=>removeVictim(i)} style={{ background:'transparent', border:'none', cursor:'pointer', color:'#ef4444', padding:'2px' }}><Trash2 size={13}/></button>}
                </div>
                <div style={GRID3}>
                  <FormGroup label="Full Name"><input className="form-input" value={v.name} onChange={e=>updateVictim(i,'name',e.target.value)} placeholder="Victim name"/></FormGroup>
                  <FormGroup label="Age"><input className="form-input" type="number" min="0" max="120" value={v.age} onChange={e=>updateVictim(i,'age',e.target.value)} placeholder="Age"/></FormGroup>
                  <FormGroup label="Gender">
                    <select className="form-select" value={v.genderId} onChange={e=>updateVictim(i,'genderId',e.target.value)}>
                      {GENDER_OPTIONS.map(g=><option key={g.value} value={g.value}>{g.label}</option>)}
                    </select>
                  </FormGroup>
                </div>
                <label style={{ display:'flex', alignItems:'center', gap:'6px', fontSize:'0.7rem', color:'var(--text-secondary)', cursor:'pointer', marginTop:'4px' }}>
                  <input type="checkbox" checked={v.isPolice} onChange={e=>updateVictim(i,'isPolice',e.target.checked)}/>
                  Victim is a Police Officer
                </label>
              </div>
            ))}
          </div>

          <div ref={stepRefs.accused} style={SECTION_STYLE}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'0.75rem' }}>
              <div style={SECTION_TITLE_STYLE}><Users size={13} color="#f97316"/> Accused Details</div>
              <button type="button" onClick={addAccused} style={{ background:'#f9741622', border:'1px solid #f9741666', borderRadius:'var(--radius-sm)', padding:'4px 10px', fontSize:'0.7rem', color:'#f97316', cursor:'pointer', display:'flex', alignItems:'center', gap:'4px' }}>
                <Plus size={11}/> Add Accused
              </button>
            </div>
            {accused.map((a,i) => (
              <div key={i} style={{ background:'var(--bg-elevated)', borderRadius:6, padding:'0.75rem', marginBottom:'0.6rem', border:'1px solid var(--border)', borderLeft:'3px solid #f97316' }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'0.5rem' }}>
                  <span style={{ fontSize:'0.7rem', fontWeight:700, color:'#f97316' }}>Accused A{i+1}</span>
                  {accused.length>1 && <button type="button" onClick={()=>removeAccused(i)} style={{ background:'transparent', border:'none', cursor:'pointer', color:'#f97316', padding:'2px' }}><Trash2 size={13}/></button>}
                </div>
                <div style={GRID3}>
                  <FormGroup label="Full Name"><input className="form-input" value={a.name} onChange={e=>updateAccused(i,'name',e.target.value)} placeholder="Accused name"/></FormGroup>
                  <FormGroup label="Age"><input className="form-input" type="number" min="0" max="120" value={a.age} onChange={e=>updateAccused(i,'age',e.target.value)} placeholder="Age"/></FormGroup>
                  <FormGroup label="Gender">
                    <select className="form-select" value={a.genderId} onChange={e=>updateAccused(i,'genderId',e.target.value)}>
                      {GENDER_OPTIONS.map(g=><option key={g.value} value={g.value}>{g.label}</option>)}
                    </select>
                  </FormGroup>
                </div>
              </div>
            ))}
          </div>

          <div ref={stepRefs.legal} style={SECTION_STYLE}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'0.75rem' }}>
              <div style={SECTION_TITLE_STYLE}><Scale size={13} color="#ccff00"/> Acts and Sections Invoked</div>
              <button type="button" onClick={addSection} style={{ background:'#ccff0022', border:'1px solid #ccff0066', borderRadius:'var(--radius-sm)', padding:'4px 10px', fontSize:'0.7rem', color:'#ccff00', cursor:'pointer', display:'flex', alignItems:'center', gap:'4px' }}>
                <Plus size={11}/> Add Section
              </button>
            </div>
            {actsSections.map((s,i) => {
              const sectionsForAct = (L.sections||[]).filter(sec => String(sec.ActCode||sec.actCode) === String(s.actCode));
              return (
                <div key={i} style={{ background:'var(--bg-elevated)', borderRadius:6, padding:'0.75rem', marginBottom:'0.6rem', border:'1px solid var(--border)', borderLeft:'3px solid #ccff00' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'0.5rem' }}>
                    <span style={{ fontSize:'0.7rem', fontWeight:700, color:'#ccff00' }}>Section {i+1}</span>
                    {actsSections.length>1 && <button type="button" onClick={()=>removeSection(i)} style={{ background:'transparent', border:'none', cursor:'pointer', color:'#64748b', padding:'2px' }}><Trash2 size={13}/></button>}
                  </div>
                  <div style={GRID2}>
                    <FormGroup label="Act">
                      <select className="form-select" value={s.actCode} onChange={e=>updateSection(i,'actCode',e.target.value)}>
                        <option value="">Select Act</option>
                        {(L.acts||[]).map(a=><option key={a.ActCode||a.actCode} value={a.ActCode||a.actCode}>{a.ShortName||a.shortName}</option>)}
                      </select>
                    </FormGroup>
                    <FormGroup label="Section Code">
                      <select className="form-select" value={s.sectionCode} onChange={e=>updateSection(i,'sectionCode',e.target.value)} disabled={!s.actCode}>
                        <option value="">Select Section</option>
                        {sectionsForAct.map(sec=><option key={sec.SectionCode||sec.sectionCode} value={sec.SectionCode||sec.sectionCode}>{sec.SectionCode||sec.sectionCode} - {sec.SectionDescription||sec.sectionDescription||''}</option>)}
                      </select>
                    </FormGroup>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Optional: Arrest / Surrender Recording */}
          <div ref={stepRefs.arrest} style={{ ...SECTION_STYLE, border: showArrest ? '1px solid #a855f744' : '1px dashed rgba(168,85,247,0.3)', background: showArrest ? 'var(--bg-surface)' : 'transparent' }}>
            <div
              style={{ display:'flex', justifyContent:'space-between', alignItems:'center', cursor:'pointer', userSelect:'none' }}
              onClick={() => setShowArrest(p => !p)}
            >
              <div style={{ ...SECTION_TITLE_STYLE, marginBottom: 0, borderBottom: 'none', paddingBottom: 0 }}>
                <Shield size={13} color="#a855f7"/>
                Arrest / Surrender Recording
                <span style={{ fontSize:'0.6rem', color:'var(--text-secondary)', fontWeight:400, marginLeft:6 }}>(Optional)</span>
              </div>
              <span style={{ fontSize:'0.75rem', color:'#a855f7', fontWeight:800 }}>{showArrest ? '▲ Collapse' : '▼ Expand'}</span>
            </div>
            {showArrest && (
              <div style={{ marginTop:'1rem' }}>
                <div style={{ fontSize:'0.68rem', color:'var(--text-secondary)', marginBottom:'0.75rem', lineHeight:1.5 }}>
                  Record an arrest or surrender at FIR filing time. This writes to <strong>ArrestSurrender</strong> and <strong>inv_arrestsurrenderaccused</strong> tables, linking each accused to the event.
                </div>
                <div style={GRID3}>
                  <FormGroup label="Arrest / Surrender Date">
                    <input className="form-input" type="datetime-local" value={arrestData.ArrestSurrenderDate} onChange={e=>updateArrest('ArrestSurrenderDate', e.target.value)}/>
                  </FormGroup>
                  <FormGroup label="Type">
                    <select className="form-select" value={arrestData.ArrestSurrenderTypeID} onChange={e=>updateArrest('ArrestSurrenderTypeID', e.target.value)}>
                      <option value="1">Arrest</option>
                      <option value="2">Voluntary Surrender</option>
                    </select>
                  </FormGroup>
                  <FormGroup label="State of Arrest">
                    <select className="form-select" value={arrestData.ArrestSurrenderStateId} onChange={e=>updateArrest('ArrestSurrenderStateId', e.target.value)}>
                      <option value="">Select State</option>
                      {(L.states||[]).map(s=><option key={s.StateID} value={s.StateID}>{s.StateName}</option>)}
                    </select>
                  </FormGroup>
                </div>
                <div style={{ fontSize:'0.67rem', color:'#a855f766', marginTop:'0.25rem' }}>Note: Arrest will be linked to all accused named in this FIR.</div>
              </div>
            )}
          </div>

          <div style={{ display:'flex', justifyContent:'flex-end', paddingBottom:'1.5rem' }}>
            <button type="submit" disabled={submitting} style={{ background:'var(--primary)', border:'none', borderRadius:'var(--radius-sm)', padding:'0.65rem 2rem', color:'#000', fontWeight:800, fontSize:'0.8rem', cursor:submitting?'not-allowed':'pointer', opacity:submitting?0.7:1 }}>
              {submitting ? 'Registering...' : 'Register FIR'}
            </button>
          </div>
        </form>
      </div>
      </div>
    </div>
  );
}
