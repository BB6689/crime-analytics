import React from 'react';
import { 
  CRIME_TYPES, 
  POLICE_STATIONS, 
  DISTRICTS, 
  DISTRICT_IDS,
  CASE_CATEGORIES, 
  GRAVITY_LEVELS, 
  CASE_STATUSES, 
  ACTS_SECTIONS, 
  generateCrimeNumber, 
  generateCaseNumber 
} from '../../mockData/incidentData';
import { 
  RefreshCw, Filter, ShieldAlert, Shield, ExternalLink, Users, UserCheck,
  Building2, ScrollText, Clock, Scale, FileText, MapPin, Copy, Target,
  Lightbulb, Folder, Check, Calendar
} from 'lucide-react';
import { translations } from '../../translations';
import { ZiaText } from '../../utils/translator';

export default function MapControls({
  lang = 'en',
  selectedDistrict,
  selectedPoliceStationId,
  setSelectedPoliceStationId,
  selectedIncident,
  setSelectedIncident,
  filters,
  setFilters,
  onReset,
  incidentsList,
  refreshData,
  networkData,
  offenderProfiles
}) {
  const handleChange = (key, val) => {
    setFilters(prev => ({
      ...prev,
      [key]: val
    }));
  };

  const [copyFeedback, setCopyFeedback] = React.useState('');

  const handleCopyCoords = (text, label) => {
    navigator.clipboard.writeText(text);
    setCopyFeedback(label);
    setTimeout(() => setCopyFeedback(''), 2500);
  };

  // Form States for Pinning Real Cases
  const [formDist, setFormDist] = React.useState('');
  const [formStation, setFormStation] = React.useState('');
  const [formCaseCategoryId, setFormCaseCategoryId] = React.useState('1'); // 1=FIR, 3=UDR, 4=PAR, 8=Zero FIR
  const [formRunningSerial, setFormRunningSerial] = React.useState('1');
  const [formType, setFormType] = React.useState('THEFT');
  const [formDate, setFormDate] = React.useState(new Date().toISOString().split('T')[0]);
  const [formOfficer, setFormOfficer] = React.useState('');
  const [formGravityId, setFormGravityId] = React.useState('2'); // 1=Heinous, 2=Non-Heinous
  const [formMinorHead, setFormMinorHead] = React.useState('');
  const [formCourtName, setFormCourtName] = React.useState('First Class Judicial Magistrate Court, Bengaluru');
  const [formIncidentFromDate, setFormIncidentFromDate] = React.useState(new Date().toISOString().split('T')[0] + 'T10:00');
  const [formIncidentToDate, setFormIncidentToDate] = React.useState(new Date().toISOString().split('T')[0] + 'T12:00');
  const [formInfoReceivedPsDate, setFormInfoReceivedPsDate] = React.useState(new Date().toISOString().split('T')[0] + 'T13:00');
  const [formAct, setFormAct] = React.useState('IPC');
  const [formSection, setFormSection] = React.useState('379');
  const [formDesc, setFormDesc] = React.useState('');

  // Relational details
  const [formCompName, setFormCompName] = React.useState('');
  const [formCompAge, setFormCompAge] = React.useState('');
  const [formCompGender, setFormCompGender] = React.useState('Male');
  const [formCompOccupation, setFormCompOccupation] = React.useState('Business');
  const [formCompReligion, setFormCompReligion] = React.useState('Hindu');
  const [formCompCaste, setFormCompCaste] = React.useState('General');

  const [formVictimName, setFormVictimName] = React.useState('');
  const [formVictimAge, setFormVictimAge] = React.useState('');
  const [formVictimGender, setFormVictimGender] = React.useState('Male');
  const [formVictimPolice, setFormVictimPolice] = React.useState('No');

  const [formAccusedName, setFormAccusedName] = React.useState('');
  const [formAccusedAge, setFormAccusedAge] = React.useState('');
  const [formAccusedGender, setFormAccusedGender] = React.useState('Male');
  const [formAccusedPersonId, setFormAccusedPersonId] = React.useState('A1');
  const [formSuspectStatus, setFormSuspectStatus] = React.useState('Wanted');
  const [formRiskScore, setFormRiskScore] = React.useState('75');

  const [sidebarTab, setSidebarTab] = React.useState('filters');

  React.useEffect(() => {
    if (selectedIncident || selectedPoliceStationId) {
      setSidebarTab('dossier');
    }
  }, [selectedIncident, selectedPoliceStationId]);

  const [openSections, setOpenSections] = React.useState({
    sec1: true,
    sec2: true,
    sec3: false,
    sec4: false,
    sec5: false,
    sec6: true
  });

  const toggleSection = (key) => {
    setOpenSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const [lookups, setLookups] = React.useState(null);

  React.useEffect(() => {
    const fetchLookups = async () => {
      try {
        const res = await fetch('/server/police_fir_api/api/lookups');
        const data = await res.json();
        setLookups(data);
      } catch (e) {
        console.error("Failed to fetch lookups:", e);
      }
    };
    fetchLookups();
  }, []);

  const formStationsList = Object.values(POLICE_STATIONS).filter(s => s.district === formDist);

  React.useEffect(() => {
    if (formStationsList.length > 0) {
      setFormStation(formStationsList[0].id);
    } else {
      setFormStation('');
    }
  }, [formDist]);

  const handlePinCase = async (e) => {
    e.preventDefault();
    if (!formDist || !formStation || !formRunningSerial) {
      alert(lang === 'kn' ? "ದಯವಿಟ್ಟು ಜಿಲ್ಲೆ, ಠಾಣೆ ಮತ್ತು ಸರಣಿ ಸಂಖ್ಯೆಯನ್ನು ಭರ್ತಿ ಮಾಡಿ." : "Please fill in District, Station, and Running Serial.");
      return;
    }

    const station = POLICE_STATIONS[formStation];
    if (!station) return;

    const distId = DISTRICT_IDS[formDist] || "0443";
    const stationUnitId = station.unitId || "0001";
    const year = new Date(formDate).getFullYear();
    const serial = parseInt(formRunningSerial) || 1;

    // Generate Official CrimeNo and CaseNo according to KSP Rules
    const crimeNo = generateCrimeNumber(formCaseCategoryId, distId, stationUnitId, year, serial);
    const caseNo = generateCaseNumber(year, serial);

    // Map frontend string inputs to backend integers using lookups/mappings
    const unitIdInt = parseInt(stationUnitId);
    
    // Find matching employee or default
    let employeeId = 1;
    if (lookups && lookups.employees) {
      const match = lookups.employees.find(emp => emp.UnitID === unitIdInt);
      if (match) employeeId = match.EmployeeID;
    }

    // Find matching court or default
    let courtId = 1;
    if (lookups && lookups.courts) {
      const parsedDistId = parseInt(distId);
      const match = lookups.courts.find(c => c.DistrictID === parsedDistId);
      if (match) courtId = match.CourtID;
    }

    // Map major head / minor head
    let crimeMajorHeadId = 2; // Crimes Against Property
    let crimeMinorHeadId = 60; // Theft
    
    if (formType === 'HOMICIDE') {
      crimeMajorHeadId = 1; // Crimes Against Body
      crimeMinorHeadId = 10; // Murder
    } else if (formType === 'ASSAULT') {
      crimeMajorHeadId = 1; // Crimes Against Body
      crimeMinorHeadId = 50; // Assault
    } else if (formType === 'BURGLARY') {
      crimeMajorHeadId = 2; // Crimes Against Property
      crimeMinorHeadId = 30; // House Breaking
    } else if (formType === 'THEFT') {
      crimeMajorHeadId = 2; // Crimes Against Property
      crimeMinorHeadId = 60; // Theft
    } else if (formType === 'VANDALISM') {
      crimeMajorHeadId = 2; // Crimes Against Property
      crimeMinorHeadId = 70; // Vandalism
    } else if (formType === 'DRUG_TRAFFICKING') {
      crimeMajorHeadId = 3; // White Collar/Special Act
      crimeMinorHeadId = 80; // Narcotics
    }

    // Map complainant details
    const occupationMap = { 'Business': 2, 'Farmer': 1, 'Software': 3, 'Service': 4, 'Unemployed': 5 };
    const religionMap = { 'Hindu': 1, 'Muslim': 2, 'Christian': 3, 'Sikh': 4 };
    const casteMap = { 'General': 1, 'SC': 2, 'ST': 3, 'OBC': 4 };

    const compOccupationId = occupationMap[formCompOccupation] || 4;
    const compReligionId = religionMap[formCompReligion] || 1;
    const compCasteId = casteMap[formCompCaste] || 1;

    const payload = {
      PoliceStationID: unitIdInt,
      PolicePersonID: employeeId,
      CourtID: courtId,
      CaseCategoryID: parseInt(formCaseCategoryId),
      GravityOffenceID: parseInt(formGravityId),
      CrimeMajorHeadID: crimeMajorHeadId,
      CrimeMinorHeadID: crimeMinorHeadId,
      CaseStatusID: 1, // Under Investigation
      IncidentFromDate: formIncidentFromDate ? formIncidentFromDate.replace('T', ' ') : `${formDate} 10:00:00`,
      IncidentToDate: formIncidentToDate ? formIncidentToDate.replace('T', ' ') : `${formDate} 12:00:00`,
      InfoReceivedPSDate: formInfoReceivedPsDate ? formInfoReceivedPsDate.replace('T', ' ') : `${formDate} 13:00:00`,
      latitude: station.coords[0] + (Math.random() - 0.5) * 0.008,
      longitude: station.coords[1] + (Math.random() - 0.5) * 0.008,
      BriefFacts: formDesc || `Reported case at ${station.name}.`,
      ComplainantName: formCompName || "Unknown Complainant",
      ComplainantAge: parseInt(formCompAge) || 35,
      ComplainantOccupationID: compOccupationId,
      ComplainantReligionID: compReligionId,
      ComplainantCasteID: compCasteId,
      ComplainantGenderID: formCompGender === 'Male' ? 1 : 2,
      VictimName: formVictimName || "State of Karnataka",
      VictimAge: parseInt(formVictimAge) || 0,
      VictimGenderID: formVictimGender === 'Male' ? 1 : 2,
      VictimPolice: formVictimPolice === 'Yes' ? '1' : '0',
      AccusedName: formAccusedName || "Unidentified Assailants",
      AccusedAge: parseInt(formAccusedAge) || 30,
      AccusedGenderID: formAccusedGender === 'Male' ? 1 : 2,
      ActCode: formAct,
      SectionCode: formSection
    };

    try {
      const response = await fetch('/server/police_fir_api/api/cases', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errObj = await response.json();
        throw new Error(errObj.error || "Failed to register case in database");
      }

      const result = await response.json();
      console.log("Registered case successfully in DB:", result);

      if (refreshData) {
        await refreshData();
      }

      // Reset forms (auto increment serial for convenience)
      setFormRunningSerial(prev => String(parseInt(prev) + 1));
      setFormOfficer('');
      setFormMinorHead('');
      setFormDesc('');
      setFormCompName('');
      setFormCompAge('');
      setFormVictimName('');
      setFormVictimAge('');
      setFormAccusedName('');
      setFormAccusedAge('');
      
      alert(lang === 'kn' ? `✅ ಎಫ್.ಐ.ಆರ್ ಪ್ರಕರಣವನ್ನು ಯಶಸ್ವಿಯಾಗಿ ಪಿನ್ ಮಾಡಲಾಗಿದೆ!\nಅಪರಾಧ ಸಂಖ್ಯೆ: ${crimeNo}\nಪ್ರಕರಣ ಸಂಖ್ಯೆ: ${caseNo} ಡೇಟಾಬೇಸ್‌ಗೆ ಸೇರಿಸಲಾಗಿದೆ.` : `✅ FIR Case Pinned Successfully!\nCrime No: ${crimeNo}\nCase No: ${caseNo} added to database.`);
    } catch (err) {
      console.error(err);
      alert(`Error registering case in database: ${err.message}`);
    }
  };

  // Filter police stations based on selected district
  const activeStations = Object.values(POLICE_STATIONS).filter(station =>
    !selectedDistrict || station.district === selectedDistrict
  );

  const activeStationInfo = POLICE_STATIONS[selectedPoliceStationId];

  const districtIdForPreview = DISTRICT_IDS[formDist] || "0000";
  const stationUnitIdForPreview = POLICE_STATIONS[formStation]?.unitId || "0000";
  const yearForPreview = new Date(formDate).getFullYear() || new Date().getFullYear();
  const serialForPreview = String(parseInt(formRunningSerial) || 1).padStart(5, '0');
  const liveCrimeNo = `${formCaseCategoryId}${districtIdForPreview}${stationUnitIdForPreview}${yearForPreview}${serialForPreview}`;
  const liveCaseNo = `${yearForPreview}${serialForPreview}`;

  return (
    <div className="glass-panel scrollable" style={{ height: '100%', fontFamily: lang === 'kn' ? 'var(--font-kannada)' : 'inherit', borderTop: '4px solid var(--primary)' }}>
      {/* Mode Header Tabs */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr 1fr',
        background: 'var(--bg-elevated)',
        borderBottom: '1px solid var(--border)',
        padding: '0.4rem 0.5rem',
        gap: '0.35rem'
      }}>
        <button
          type="button"
          onClick={() => setSidebarTab('filters')}
          style={{
            padding: '0.5rem 0.2rem',
            fontSize: '0.72rem',
            fontWeight: 'bold',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid ' + (sidebarTab === 'filters' ? 'var(--primary)' : 'var(--border)'),
            background: sidebarTab === 'filters' ? 'var(--primary)' : 'var(--bg-surface)',
            color: sidebarTab === 'filters' ? '#ffffff' : 'var(--text-secondary)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.35rem',
            transition: 'all 0.2s ease'
          }}
        >
          <Filter size={13} />
          {lang === 'kn' ? 'ಫಿಲ್ಟರ್‌ಗಳು' : 'Filters'}
        </button>

        <button
          type="button"
          onClick={() => setSidebarTab('pin')}
          style={{
            padding: '0.5rem 0.2rem',
            fontSize: '0.72rem',
            fontWeight: 'bold',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid ' + (sidebarTab === 'pin' ? 'var(--accent)' : 'var(--border)'),
            background: sidebarTab === 'pin' ? 'var(--accent)' : 'var(--bg-surface)',
            color: sidebarTab === 'pin' ? '#ffffff' : 'var(--text-secondary)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.35rem',
            transition: 'all 0.2s ease'
          }}
        >
          <ShieldAlert size={13} />
          {lang === 'kn' ? 'ಪ್ರಕರಣ ದಾಖಲಿಸಿ' : 'Pin Case'}
        </button>

        <button
          type="button"
          onClick={() => setSidebarTab('dossier')}
          style={{
            padding: '0.5rem 0.2rem',
            fontSize: '0.72rem',
            fontWeight: 'bold',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid ' + (sidebarTab === 'dossier' ? 'var(--primary-light)' : 'var(--border)'),
            background: sidebarTab === 'dossier' ? 'var(--primary-light)' : 'var(--bg-surface)',
            color: sidebarTab === 'dossier' ? '#ffffff' : 'var(--text-secondary)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.35rem',
            transition: 'all 0.2s ease'
          }}
        >
          <Shield size={13} />
          {lang === 'kn' ? 'ದಾಖಲೆಗಳು' : 'Dossier'}
        </button>
      </div>

      {/* Scrollable Panel Body */}
      <div className="panel-body" style={{ padding: '1rem', flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        
        {/* TAB 1: FILTERS & FEED CONTROL */}
        {sidebarTab === 'filters' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h3 className="filter-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', color: 'var(--text-primary)', fontSize: '0.85rem' }}>
              <Filter size={16} className="brand-logo" />
              {translations[lang].mapControls.filterTitle}
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Police Station Dropdown */}
              <div className="filter-group">
                <label className="filter-label">{translations[lang].mapControls.precinctLabel}</label>
                <select
                  className="form-select"
                  value={selectedPoliceStationId || ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (!val) {
                      setSelectedPoliceStationId(null);
                    } else {
                      setSelectedPoliceStationId(val);
                      const st = POLICE_STATIONS[val];
                      if (st) setSelectedDistrict(st.district);
                    }
                  }}
                >
                  {selectedDistrict ? (
                    <>
                      <option value="">{translations[lang].mapControls.allStationsCount} ({activeStations.length})</option>
                      {activeStations.map(station => (
                        <option key={station.id} value={station.id}>{station.name}</option>
                      ))}
                    </>
                  ) : (
                    <>
                      <option value="">{translations[lang].mapControls.selectDistrictFirst}</option>
                    </>
                  )}
                </select>
              </div>

              <div className="filter-group">
                <label className="filter-label">{translations[lang].mapControls.offenseType}</label>
                <select
                  className="form-select"
                  value={filters.type}
                  onChange={(e) => handleChange('type', e.target.value)}
                >
                  <option value="ALL">{translations[lang].mapControls.allOffenses}</option>
                  {Object.keys(CRIME_TYPES).map(key => (
                    <option key={key} value={key}>{translations[lang].crimeTypes[key] || CRIME_TYPES[key].label}</option>
                  ))}
                </select>
              </div>

              <div className="filter-group">
                <label className="filter-label">{translations[lang].mapControls.severityLevel}</label>
                <select
                  className="form-select"
                  value={filters.severity}
                  onChange={(e) => handleChange('severity', e.target.value)}
                >
                  <option value="ALL">{translations[lang].mapControls.allSeverities}</option>
                  <option value="Critical">{translations[lang].mapControls.severityCritical}</option>
                  <option value="High">{translations[lang].mapControls.severityHigh}</option>
                  <option value="Medium">{translations[lang].mapControls.severityMedium}</option>
                  <option value="Low">{translations[lang].mapControls.severityLow}</option>
                </select>
              </div>

              <div className="filter-group">
                <label className="filter-label">{translations[lang].mapControls.incidentStatus}</label>
                <select
                  className="form-select"
                  value={filters.status}
                  onChange={(e) => handleChange('status', e.target.value)}
                >
                  <option value="ALL">{translations[lang].mapControls.allStatuses}</option>
                  <option value="Active">{translations[lang].mapControls.statusActive}</option>
                  <option value="Investigating">{translations[lang].mapControls.statusInvestigating}</option>
                  <option value="Closed">{translations[lang].mapControls.statusClosed}</option>
                </select>
              </div>

              <div className="filter-group">
                <label className="filter-label">{translations[lang].mapControls.timeFrame}</label>
                <select
                  className="form-select"
                  value={filters.timeRange}
                  onChange={(e) => handleChange('timeRange', e.target.value)}
                >
                  <option value="ALL">{translations[lang].mapControls.historicalArchives}</option>
                  <option value="7D">{translations[lang].mapControls.past7Days}</option>
                  <option value="30D">{translations[lang].mapControls.past30Days}</option>
                  <option value="90D">{translations[lang].mapControls.past90Days}</option>
                  <option value="180D">{translations[lang].mapControls.past180Days || 'Past 6 Months (180 Days)'}</option>
                  <option value="1Y">{translations[lang].mapControls.past1Year || 'Past 1 Year (365 Days)'}</option>
                </select>
              </div>
            </div>

            <button
              onClick={onReset}
              className="btn btn-ghost btn-full"
              style={{ marginTop: '1rem', gap: '0.5rem' }}
            >
              <RefreshCw size={14} />
              {translations[lang].mapControls.resetFilters}
            </button>
          </div>
        )}

        {/* TAB 2: PIN REAL FIR CASE */}
        {sidebarTab === 'pin' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <form onSubmit={handlePinCase} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Integrated Live Key Registry Generator Header Box */}
              <div style={{ 
                background: 'var(--bg-inset)', 
                padding: '0.75rem 0.85rem', 
                borderRadius: 'var(--radius-sm)', 
                border: '1px solid var(--border)',
                borderLeft: '4px solid var(--accent)',
                fontSize: '0.75rem',
                fontFamily: 'var(--font-mono)',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-muted)', paddingBottom: '4px' }}>
                  <span style={{ color: 'var(--text-primary)', fontWeight: '800', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '0.4rem', fontFamily: 'var(--font-title)' }}>
                    <ShieldAlert size={15} style={{ color: 'var(--accent)' }} />
                    {translations[lang].mapControls.pinTitle}
                  </span>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.62rem', textTransform: 'uppercase', fontWeight: 'bold', fontFamily: 'var(--font-title)' }}>
                    {translations[lang].mapControls.liveKeyRegistry}
                  </span>
                </div>
                <div>{translations[lang].mapControls.crimeRegNo} <span style={{ color: 'var(--accent)', fontWeight: 'bold' }}>{liveCrimeNo}</span></div>
                <div>{translations[lang].mapControls.caseMasterRef} <span style={{ color: 'var(--text-primary)', fontWeight: 'bold' }}>{liveCaseNo}</span></div>
              </div>

              {/* SECTION I: JURISDICTIONAL PRECINCT */}
              <div className="dossier-section-card">
                <div 
                  className="section-header" 
                  onClick={() => toggleSection('sec1')} 
                  style={{ cursor: 'pointer', justifyContent: 'space-between', userSelect: 'none' }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Building2 size={13} style={{ color: 'var(--accent)' }} />
                    {translations[lang].mapControls.secIPrecinct}
                  </span>
                  <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>{openSections.sec1 ? '▲' : '▼'}</span>
                </div>
                {openSections.sec1 && (
                  <div className="section-body" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                      <div className="filter-group">
                        <label className="filter-label">{translations[lang].mapControls.districtDivisionAst}</label>
                        <select
                          className="form-select"
                          value={formDist}
                          onChange={(e) => setFormDist(e.target.value)}
                          required
                        >
                          <option value="">{translations[lang].mapControls.selectDistrict}</option>
                          {Object.keys(DISTRICTS).map(key => (
                            <option key={key} value={key}>{translations[lang].districts[key] || DISTRICTS[key].name}</option>
                          ))}
                        </select>
                      </div>

                      <div className="filter-group">
                        <label className="filter-label">{translations[lang].mapControls.precinctPsAst}</label>
                        <select
                          className="form-select"
                          value={formStation}
                          onChange={(e) => setFormStation(e.target.value)}
                          required
                          disabled={!formDist}
                        >
                          <option value="">{translations[lang].mapControls.selectStation}</option>
                          {formStationsList.map(station => (
                            <option key={station.id} value={station.id}>{station.name} ({station.unitId})</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* SECTION II: CASE METADATA */}
              <div className="dossier-section-card">
                <div 
                  className="section-header" 
                  onClick={() => toggleSection('sec2')} 
                  style={{ cursor: 'pointer', justifyContent: 'space-between', userSelect: 'none' }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <ScrollText size={13} style={{ color: 'var(--accent)' }} />
                    {translations[lang].mapControls.secIICaseId}
                  </span>
                  <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>{openSections.sec2 ? '▲' : '▼'}</span>
                </div>
                {openSections.sec2 && (
                  <div className="section-body" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '0.5rem' }}>
                      <div className="filter-group">
                        <label className="filter-label">{translations[lang].mapControls.caseCategoryAst}</label>
                        <select
                          className="form-select"
                          value={formCaseCategoryId}
                          onChange={(e) => setFormCaseCategoryId(e.target.value)}
                          required
                        >
                          {Object.entries(CASE_CATEGORIES).map(([code, value]) => (
                            <option key={code} value={code}>
                              {translations[lang].categories[code] || value.name} ({value.label})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="filter-group">
                        <label className="filter-label">{translations[lang].mapControls.runningSerialAst}</label>
                        <input
                          type="number"
                          className="form-input"
                          min="1"
                          max="99999"
                          value={formRunningSerial}
                          onChange={(e) => setFormRunningSerial(e.target.value)}
                          required
                        />
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                      <div className="filter-group">
                        <label className="filter-label">{translations[lang].mapControls.majorHeadOffense}</label>
                        <select
                          className="form-select"
                          value={formType}
                          onChange={(e) => setFormType(e.target.value)}
                        >
                          {Object.keys(CRIME_TYPES).map(key => (
                            <option key={key} value={key}>{translations[lang].crimeTypes[key] || CRIME_TYPES[key].label}</option>
                          ))}
                        </select>
                      </div>

                      <div className="filter-group">
                        <label className="filter-label">{translations[lang].mapControls.registeredDateAst}</label>
                        <input
                          type="date"
                          className="form-input"
                          value={formDate}
                          onChange={(e) => setFormDate(e.target.value)}
                          required
                        />
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                      <div className="filter-group">
                        <label className="filter-label">{translations[lang].mapControls.offenseGravityForm}</label>
                        <select
                          className="form-select"
                          value={formGravityId}
                          onChange={(e) => setFormGravityId(e.target.value)}
                        >
                          <option value="1">{translations[lang].mapControls.heinous}</option>
                          <option value="2">{translations[lang].mapControls.nonHeinous}</option>
                        </select>
                      </div>

                      <div className="filter-group">
                        <label className="filter-label">{translations[lang].mapControls.minorHeadDetails}</label>
                        <input
                          type="text"
                          className="form-input"
                          placeholder="e.g. Day Burglary"
                          value={formMinorHead}
                          onChange={(e) => setFormMinorHead(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="filter-group">
                      <label className="filter-label">{translations[lang].mapControls.courtNameForm}</label>
                      <input
                        type="text"
                        className="form-input"
                        value={formCourtName}
                        onChange={(e) => setFormCourtName(e.target.value)}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* SECTION III: CHRONOLOGY & TIMELINE */}
              <div className="dossier-section-card">
                <div 
                  className="section-header" 
                  onClick={() => toggleSection('sec3')} 
                  style={{ cursor: 'pointer', justifyContent: 'space-between', userSelect: 'none' }}
                >
                  <span>⏱️ {translations[lang].mapControls.secIIIChronology}</span>
                  <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>{openSections.sec3 ? '▲' : '▼'}</span>
                </div>
                {openSections.sec3 && (
                  <div className="section-body" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                      <div className="filter-group">
                        <label className="filter-label">{translations[lang].mapControls.occFrom}</label>
                        <input
                          type="datetime-local"
                          className="form-input"
                          style={{ fontSize: '0.75rem' }}
                          value={formIncidentFromDate}
                          onChange={(e) => setFormIncidentFromDate(e.target.value)}
                        />
                      </div>
                      <div className="filter-group">
                        <label className="filter-label">{translations[lang].mapControls.occTo}</label>
                        <input
                          type="datetime-local"
                          className="form-input"
                          style={{ fontSize: '0.75rem' }}
                          value={formIncidentToDate}
                          onChange={(e) => setFormIncidentToDate(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="filter-group">
                      <label className="filter-label">{translations[lang].mapControls.receivedPsTime}</label>
                      <input
                        type="datetime-local"
                        className="form-input"
                        style={{ fontSize: '0.75rem' }}
                        value={formInfoReceivedPsDate}
                        onChange={(e) => setFormInfoReceivedPsDate(e.target.value)}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* SECTION IV: LEGAL ACTS & SECTIONS */}
              <div className="dossier-section-card">
                <div 
                  className="section-header" 
                  onClick={() => toggleSection('sec4')} 
                  style={{ cursor: 'pointer', justifyContent: 'space-between', userSelect: 'none' }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Scale size={13} style={{ color: 'var(--accent)' }} />
                    {translations[lang].mapControls.secIVActs}
                  </span>
                  <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>{openSections.sec4 ? '▲' : '▼'}</span>
                </div>
                {openSections.sec4 && (
                  <div className="section-body" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                      <div className="filter-group">
                        <label className="filter-label">{translations[lang].mapControls.actInvoked}</label>
                        <select
                          className="form-select"
                          value={formAct}
                          onChange={(e) => {
                            const act = e.target.value;
                            setFormAct(act);
                            setFormSection(Object.keys(ACTS_SECTIONS[act].sections)[0]);
                          }}
                        >
                          {Object.keys(ACTS_SECTIONS).map(key => (
                            <option key={key} value={key}>{key} - {ACTS_SECTIONS[key].name}</option>
                          ))}
                        </select>
                      </div>

                      <div className="filter-group">
                        <label className="filter-label">{translations[lang].mapControls.sectionInvoked}</label>
                        <select
                          className="form-select"
                          value={formSection}
                          onChange={(e) => setFormSection(e.target.value)}
                        >
                          {Object.entries(ACTS_SECTIONS[formAct].sections).map(([sec, desc]) => (
                            <option key={sec} value={sec}>{sec} - {desc.substring(0, 20)}...</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* SECTION V: PARTIES INVOLVED */}
              <div className="dossier-section-card">
                <div 
                  className="section-header" 
                  onClick={() => toggleSection('sec5')} 
                  style={{ cursor: 'pointer', justifyContent: 'space-between', userSelect: 'none' }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Users size={13} style={{ color: 'var(--accent)' }} />
                    {translations[lang].mapControls.secVParties}
                  </span>
                  <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>{openSections.sec5 ? '▲' : '▼'}</span>
                </div>
                {openSections.sec5 && (
                  <div className="section-body" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {/* Complainant sub-grid */}
                    <div style={{ border: '1px solid var(--border-muted)', padding: '0.6rem', borderRadius: 'var(--radius-sm)', background: 'var(--bg-elevated)', borderLeft: '3px solid var(--accent)' }}>
                      <span style={{ fontSize: '0.68rem', color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: '0.25rem', marginBottom: '0.4rem', textTransform: 'uppercase', fontWeight: 'bold', fontFamily: 'var(--font-title)' }}>
                        <Users size={12} />
                        {translations[lang].mapControls.partyComplainant}
                      </span>
                      <div className="filter-group">
                        <input
                          type="text"
                          className="form-input"
                          placeholder={translations[lang].mapControls.fullName}
                          value={formCompName}
                          onChange={(e) => setFormCompName(e.target.value)}
                        />
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem', marginTop: '0.4rem' }}>
                        <input
                          type="number"
                          className="form-input"
                          placeholder={translations[lang].mapControls.age}
                          value={formCompAge}
                          onChange={(e) => setFormCompAge(e.target.value)}
                        />
                        <select
                          className="form-select"
                          value={formCompGender}
                          onChange={(e) => setFormCompGender(e.target.value)}
                        >
                          <option value="Male">{lang === 'kn' ? 'ಪುರುಷ' : 'Male'}</option>
                          <option value="Female">{lang === 'kn' ? 'ಮಹಿಳೆ' : 'Female'}</option>
                          <option value="Transgender">{lang === 'kn' ? 'ಇತರ' : 'Transgender'}</option>
                        </select>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.3rem', marginTop: '0.4rem' }}>
                        <input
                          type="text"
                          className="form-input"
                          style={{ fontSize: '0.7rem' }}
                          placeholder={translations[lang].mapControls.occupation}
                          value={formCompOccupation}
                          onChange={(e) => setFormCompOccupation(e.target.value)}
                        />
                        <input
                          type="text"
                          className="form-input"
                          style={{ fontSize: '0.7rem' }}
                          placeholder={translations[lang].mapControls.religion}
                          value={formCompReligion}
                          onChange={(e) => setFormCompReligion(e.target.value)}
                        />
                        <input
                          type="text"
                          className="form-input"
                          style={{ fontSize: '0.7rem' }}
                          placeholder={translations[lang].mapControls.caste}
                          value={formCompCaste}
                          onChange={(e) => setFormCompCaste(e.target.value)}
                        />
                      </div>
                    </div>

                    {/* Victim sub-grid */}
                    <div style={{ border: '1px solid var(--border-muted)', padding: '0.6rem', borderRadius: 'var(--radius-sm)', background: 'var(--bg-elevated)', borderLeft: '3px solid var(--red)' }}>
                      <span style={{ fontSize: '0.68rem', color: 'var(--red)', display: 'flex', alignItems: 'center', gap: '0.25rem', marginBottom: '0.4rem', textTransform: 'uppercase', fontWeight: 'bold', fontFamily: 'var(--font-title)' }}>
                        <Users size={12} />
                        {translations[lang].mapControls.victimDetails}
                      </span>
                      <div className="filter-group">
                        <input
                          type="text"
                          className="form-input"
                          placeholder={translations[lang].mapControls.victimNameBlank}
                          value={formVictimName}
                          onChange={(e) => setFormVictimName(e.target.value)}
                        />
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.4rem', marginTop: '0.4rem' }}>
                        <input
                          type="number"
                          className="form-input"
                          placeholder={translations[lang].mapControls.age}
                          value={formVictimAge}
                          onChange={(e) => setFormVictimAge(e.target.value)}
                        />
                        <select
                          className="form-select"
                          value={formVictimGender}
                          onChange={(e) => setFormVictimGender(e.target.value)}
                        >
                          <option value="Male">{lang === 'kn' ? 'ಪುರುಷ' : 'Male'}</option>
                          <option value="Female">{lang === 'kn' ? 'ಮಹಿಳೆ' : 'Female'}</option>
                          <option value="Transgender">{lang === 'kn' ? 'ಇತರ' : 'Transgender'}</option>
                        </select>
                        <select
                          className="form-select"
                          style={{ fontSize: '0.7rem' }}
                          value={formVictimPolice}
                          onChange={(e) => setFormVictimPolice(e.target.value)}
                        >
                          <option value="No">{translations[lang].mapControls.notPolice}</option>
                          <option value="Yes">{translations[lang].mapControls.isPolice}</option>
                        </select>
                      </div>
                    </div>

                    {/* Accused sub-grid */}
                    <div style={{ border: '1px solid var(--border-muted)', padding: '0.6rem', borderRadius: 'var(--radius-sm)', background: 'var(--bg-elevated)', borderLeft: '3px solid var(--amber)' }}>
                      <span style={{ fontSize: '0.68rem', color: 'var(--amber)', display: 'flex', alignItems: 'center', gap: '0.25rem', marginBottom: '0.4rem', textTransform: 'uppercase', fontWeight: 'bold', fontFamily: 'var(--font-title)' }}>
                        <UserCheck size={12} />
                        {translations[lang].mapControls.accusedSuspectProfile}
                      </span>
                      <div className="filter-group">
                        <input
                          type="text"
                          className="form-input"
                          placeholder={translations[lang].mapControls.accusedName}
                          value={formAccusedName}
                          onChange={(e) => setFormAccusedName(e.target.value)}
                        />
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr 0.8fr', gap: '0.4rem', marginTop: '0.4rem' }}>
                        <input
                          type="number"
                          className="form-input"
                          placeholder={translations[lang].mapControls.age}
                          value={formAccusedAge}
                          onChange={(e) => setFormAccusedAge(e.target.value)}
                        />
                        <select
                          className="form-select"
                          value={formAccusedGender}
                          onChange={(e) => setFormAccusedGender(e.target.value)}
                        >
                          <option value="Male">{lang === 'kn' ? 'ಪುರುಷ' : 'Male'}</option>
                          <option value="Female">{lang === 'kn' ? 'ಮಹಿಳೆ' : 'Female'}</option>
                          <option value="Transgender">{lang === 'kn' ? 'ಇತರ' : 'Transgender'}</option>
                        </select>
                        <input
                          type="text"
                          className="form-input"
                          placeholder={translations[lang].mapControls.idLabel}
                          value={formAccusedPersonId}
                          onChange={(e) => setFormAccusedPersonId(e.target.value)}
                        />
                      </div>
                      {formAccusedName.trim() && (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem', marginTop: '0.4rem' }}>
                          <div className="filter-group">
                            <label className="filter-label" style={{ fontSize: '0.6rem' }}>{translations[lang].mapControls.accusedStatus}</label>
                            <select
                              className="form-select"
                              style={{ fontSize: '0.75rem', padding: '0.2rem' }}
                              value={formSuspectStatus}
                              onChange={(e) => setFormSuspectStatus(e.target.value)}
                            >
                              <option value="Wanted">{translations[lang].mapControls.wanted}</option>
                              <option value="Bail">{translations[lang].mapControls.bail}</option>
                              <option value="Parole">{translations[lang].mapControls.parole}</option>
                              <option value="On Probation">{translations[lang].mapControls.probation}</option>
                            </select>
                          </div>
                          <div className="filter-group">
                            <label className="filter-label" style={{ fontSize: '0.6rem' }}>{translations[lang].mapControls.riskScoreLabel}</label>
                            <input
                              type="number"
                              className="form-input"
                              style={{ fontSize: '0.75rem' }}
                              placeholder={translations[lang].mapControls.riskScoreLabel}
                              value={formRiskScore}
                              onChange={(e) => setFormRiskScore(e.target.value)}
                              min="0"
                              max="100"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* SECTION VI: FACTS & INVESTIGATOR */}
              <div className="dossier-section-card">
                <div 
                  className="section-header" 
                  onClick={() => toggleSection('sec6')} 
                  style={{ cursor: 'pointer', justifyContent: 'space-between', userSelect: 'none' }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <FileText size={13} style={{ color: 'var(--accent)' }} />
                    {translations[lang].mapControls.secVICaseDetails}
                  </span>
                  <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>{openSections.sec6 ? '▲' : '▼'}</span>
                </div>
                {openSections.sec6 && (
                  <div className="section-body" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <div className="filter-group">
                      <label className="filter-label">{translations[lang].mapControls.ioName}</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder={lang === 'kn' ? 'ಉದಾ: ಪಿ.ಎಸ್.ಐ ಪಾಟೀಲ್' : 'e.g. PSI Patil'}
                        value={formOfficer}
                        onChange={(e) => setFormOfficer(e.target.value)}
                      />
                    </div>

                    <div className="filter-group">
                      <label className="filter-label">{translations[lang].mapControls.briefFactsAst}</label>
                      <textarea
                        className="form-input"
                        style={{ fontSize: '0.8rem', height: '80px', resize: 'vertical' }}
                        placeholder={lang === 'kn' ? 'ಅಪರಾಧದ ಸಾರಾಂಶವನ್ನು ನಮೂದಿಸಿ...' : 'Enter summary of offence...'}
                        value={formDesc}
                        onChange={(e) => setFormDesc(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                )}
              </div>

              <button
                type="submit"
                className="btn btn-primary btn-full"
                style={{ marginTop: "0.25rem", background: 'var(--accent)', color: 'var(--text-inverse)', fontWeight: 'bold' }}
              >
                {translations[lang].mapControls.pinButton}
              </button>
            </form>
          </div>
        )}

        {/* TAB 3: DOSSIER & THREAT INTELLIGENCE */}
        {sidebarTab === 'dossier' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            
            {/* Selected Incident Dossier */}
            {selectedIncident ? (
              <div 
                style={{ 
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid var(--border-muted)', paddingBottom: '0.5rem' }}>
                  <h4 style={{ fontSize: '0.9rem', fontWeight: '900', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem', textTransform: 'uppercase', fontFamily: 'var(--font-title)' }}>
                    <ShieldAlert size={16} style={{ color: 'var(--accent)' }} />
                    {translations[lang].mapControls.dossierTitle}
                  </h4>
                  <button 
                    onClick={() => {
                      setSelectedIncident(null);
                      setSidebarTab('filters');
                    }} 
                    className="btn btn-ghost btn-sm"
                    style={{ minHeight: '28px', padding: '0 0.6rem' }}
                  >
                    {translations[lang].mapControls.exitViewer}
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--primary-light)' }}>
                    {translations[lang].mapControls.crimeRegNo} {selectedIncident.crime_no || selectedIncident.id}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                    {translations[lang].mapControls.caseMasterRef} {selectedIncident.case_no || 'N/A'}
                  </div>
                </div>

                {/* Section I: Jurisdiction */}
                <div className="dossier-section-card">
                  <div className="section-header" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Building2 size={13} style={{ color: 'var(--accent)' }} />
                    {translations[lang].mapControls.secIPrecinct}
                  </div>
                  <div className="section-body">
                    <table className="dossier-table-frame">
                      <tbody>
                        <tr><td>{translations[lang].mapControls.districtLabel}</td><td><strong>{selectedIncident.district}</strong></td></tr>
                        <tr><td>{translations[lang].mapControls.stationLabel}</td><td><strong>{selectedIncident.police_station}</strong></td></tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Section II: Classification */}
                <div className="dossier-section-card">
                  <div className="section-header" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <ScrollText size={13} style={{ color: 'var(--accent)' }} />
                    {translations[lang].mapControls.secIICaseId}
                  </div>
                  <div className="section-body">
                    <table className="dossier-table-frame">
                      <tbody>
                        <tr><td>{translations[lang].mapControls.offenseHead}</td><td><strong style={{ color: 'var(--accent)' }}>{selectedIncident.type}</strong></td></tr>
                        <tr><td>{translations[lang].mapControls.severityLabel}</td><td><span className={`badge badge-${selectedIncident.severity ? selectedIncident.severity.toLowerCase() : 'medium'}`}>{selectedIncident.severity}</span></td></tr>
                        <tr><td>{translations[lang].mapControls.statusLabel}</td><td><span className="badge badge-active">{selectedIncident.status}</span></td></tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Section III: Chronology & Multi-Location GPS Coordinates */}
                <div className="dossier-section-card" style={{ borderLeft: '3px solid var(--accent)' }}>
                  <div className="section-header" style={{ justifyContent: 'space-between' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <MapPin size={13} style={{ color: 'var(--accent)' }} />
                      {lang === 'kn' ? 'ಅಪರಾಧದ ಸ್ಥಳಗಳು ಮತ್ತು ಜಿಪಿಎಸ್ ಸಂಯೋಜನೆಗಳು' : 'CRIME TRAJECTORY & GPS COORDINATES'}
                    </span>
                    {copyFeedback && (
                      <span style={{ fontSize: '0.62rem', color: 'var(--accent)', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '2px' }}>
                        <Check size={11} /> {copyFeedback}
                      </span>
                    )}
                  </div>
                  <div className="section-body" style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                      <span>{translations[lang].mapControls.reportedOn}: <strong>{selectedIncident.date}</strong></span>
                      <button
                        type="button"
                        onClick={() => {
                          const locList = (selectedIncident.locations || [{ label: 'Crime Scene', lat: selectedIncident.lat, lng: selectedIncident.lng }]);
                          const jsonStr = JSON.stringify(locList, null, 2);
                          handleCopyCoords(jsonStr, 'Copied All Locations (JSON)');
                        }}
                        style={{ background: 'var(--bg-inset)', border: '1px solid var(--border)', color: 'var(--accent)', fontSize: '0.62rem', fontWeight: 700, padding: '2px 6px', borderRadius: '2px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                      >
                        <Copy size={11} /> {lang === 'kn' ? 'ಎಲ್ಲಾ ಜಿಪಿಎಸ್ ನಕಲಿಸಿ' : 'Copy All GPS (JSON)'}
                      </button>
                    </div>

                    {/* Location Milestones List */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.2rem' }}>
                      {(selectedIncident.locations || [
                        {
                          id: 'loc-1',
                          label: 'Primary Crime Scene',
                          type: 'SCENE',
                          lat: selectedIncident.lat,
                          lng: selectedIncident.lng,
                          address: selectedIncident.description ? selectedIncident.description.slice(0, 40) + '...' : 'Registration Site'
                        }
                      ]).map((loc, idx) => {
                        const colorMap = { SCENE: 'var(--red)', SIGHTING: 'var(--amber)', RECOVERY: 'var(--purple)', STATION: 'var(--primary-light)' };
                        const cColor = colorMap[loc.type] || 'var(--accent)';
                        const coordsStr = `${loc.lat ? loc.lat.toFixed(6) : '0'}, ${loc.lng ? loc.lng.toFixed(6) : '0'}`;

                        return (
                          <div 
                            key={loc.id || idx}
                            style={{
                              background: 'var(--bg-inset)',
                              border: '1px solid var(--border-muted)',
                              borderLeft: `3px solid ${cColor}`,
                              borderRadius: 'var(--radius-sm)',
                              padding: '0.5rem 0.65rem',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '0.3rem'
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ fontSize: '0.72rem', fontWeight: 800, color: cColor, textTransform: 'uppercase' }}>
                                #{idx + 1}. {loc.label}
                              </span>
                              <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                                {coordsStr}
                              </span>
                            </div>
                            
                            {loc.address && (
                              <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <MapPin size={11} style={{ color: 'var(--text-muted)' }} />
                                {loc.address}
                              </div>
                            )}

                            {/* Action Row */}
                            <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.2rem' }}>
                              <button
                                type="button"
                                onClick={() => handleCopyCoords(coordsStr, `Copied Loc #${idx + 1}`)}
                                style={{
                                  flex: 1,
                                  background: 'var(--bg-elevated)',
                                  border: '1px solid var(--border)',
                                  color: 'var(--text-primary)',
                                  fontSize: '0.62rem',
                                  fontWeight: 700,
                                  padding: '0.25rem 0.4rem',
                                  borderRadius: '2px',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  gap: '0.25rem'
                                }}
                              >
                                <Copy size={11} /> {lang === 'kn' ? 'ಸಂಯೋಜನೆ ನಕಲಿಸಿ' : 'Copy Lat/Lng'}
                              </button>
                              <a
                                href={`https://www.google.com/maps?q=${loc.lat},${loc.lng}`}
                                target="_blank"
                                rel="noreferrer"
                                style={{
                                  background: 'var(--bg-elevated)',
                                  border: '1px solid var(--accent)',
                                  color: 'var(--accent)',
                                  fontSize: '0.62rem',
                                  fontWeight: 700,
                                  padding: '0.25rem 0.4rem',
                                  borderRadius: '2px',
                                  textDecoration: 'none',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  gap: '0.25rem'
                                }}
                              >
                                <ExternalLink size={11} /> {lang === 'kn' ? 'ಮ್ಯಾಪ್ಸ್' : 'Google Maps'}
                              </a>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Section IV: Legal Acts */}
                <div className="dossier-section-card">
                  <div className="section-header" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Scale size={13} style={{ color: 'var(--accent)' }} />
                    {translations[lang].mapControls.secIVActs}
                  </div>
                  <div className="section-body">
                    <table className="dossier-table-frame">
                      <tbody>
                        <tr><td>{translations[lang].mapControls.actSection}</td><td><strong>{selectedIncident.act_section || 'IPC 379 - Larceny'}</strong></td></tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Section V: Parties */}
                <div className="dossier-section-card">
                  <div className="section-header" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Users size={13} style={{ color: 'var(--accent)' }} />
                    {translations[lang].mapControls.secVParties}
                  </div>
                  <div className="section-body">
                    <table className="dossier-table-frame">
                      <tbody>
                        <tr><td>{translations[lang].mapControls.complainant}</td><td>{selectedIncident.complainant_name || 'State of Karnataka'}</td></tr>
                        <tr><td>{translations[lang].mapControls.accused}</td><td><strong style={{ color: 'var(--red)' }}>{selectedIncident.accused_name || 'Unknown Suspect'}</strong></td></tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Section VI: Facts */}
                <div className="dossier-section-card">
                  <div className="section-header" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <FileText size={13} style={{ color: 'var(--accent)' }} />
                    {translations[lang].mapControls.secVICaseDetails}
                  </div>
                  <div className="section-body">
                    <p style={{ fontSize: '0.75rem', lineHeight: '1.4', color: 'var(--text-secondary)' }}>
                      <ZiaText text={selectedIncident.description} lang={lang} />
                    </p>
                  </div>
                </div>
              </div>
            ) : activeStationInfo ? (
              /* Selected Police Station Dossier */
              <div 
                style={{ 
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem'
                }}
              >
                <h4 style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--primary-light)', display: 'flex', alignItems: 'center', gap: '0.5rem', textTransform: 'uppercase' }}>
                  <Shield size={16} />
                  {activeStationInfo.name} {translations[lang].mapControls.stationDossierTitle}
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  <div>{translations[lang].mapControls.precinctCode} <strong style={{ color: 'var(--accent)', fontFamily: 'monospace' }}>{activeStationInfo.unitId || 'N/A'}</strong></div>
                  {activeStationInfo.officerInCharge && (
                    <div>{translations[lang].mapControls.command} <strong style={{ color: 'var(--text-primary)' }}>{activeStationInfo.officerInCharge}</strong></div>
                  )}
                  {activeStationInfo.source === 'curated' ? (
                    <>
                      <div>{translations[lang].mapControls.dutyForce} <strong style={{ color: 'var(--text-primary)' }}>{activeStationInfo.activeStaff} {lang === 'kn' ? 'ಅಧಿಕಾರಿಗಳು' : 'Officers'}</strong></div>
                      <div>{translations[lang].mapControls.patrolFleet} <strong style={{ color: 'var(--text-primary)' }}>{activeStationInfo.patrolVehicles} {lang === 'kn' ? 'ಗಸ್ತು ಕಾರುಗಳು' : 'Squad Cars'}</strong></div>
                      <div>{translations[lang].mapControls.avgResponse} <strong style={{ color: 'var(--text-primary)' }}>{activeStationInfo.avgResponseTime ? (lang === 'kn' ? activeStationInfo.avgResponseTime.replace(' mins', ' ನಿಮಿಷ') : activeStationInfo.avgResponseTime) : ''}</strong></div>
                      <div>{translations[lang].mapControls.clearanceRate} <strong style={{ color: 'var(--green)' }}>{activeStationInfo.solvedRate} {translations[lang].mapControls.solved}</strong></div>
                    </>
                  ) : (
                    <>
                      <div>{translations[lang].mapControls.gpsCoords} <strong style={{ color: 'var(--primary-light)' }}>{activeStationInfo.coords[0].toFixed(5)}, {activeStationInfo.coords[1].toFixed(5)}</strong></div>
                      <div>{translations[lang].mapControls.source} <span style={{ color: 'var(--text-muted)' }}>{translations[lang].mapControls.osmVerified}</span></div>
                    </>
                  )}
                  {activeStationInfo.phone && (
                    <div>{translations[lang].mapControls.controlRoom} <span style={{ color: 'var(--text-primary)', fontFamily: 'monospace' }}>{activeStationInfo.phone}</span></div>
                  )}
                </div>
                
                <button
                  type="button"
                  onClick={() => {
                    alert(lang === 'kn' ? `🚨 ತಾಂತ್ರಿಕ ಗಸ್ತು ರವಾನೆ ಎಚ್ಚರಿಕೆ\n\nವರದಿಯಾದ ಘಟನಾ ಸ್ಥಳಗಳಿಗೆ ${activeStationInfo.name} ನಿಂದ ತುರ್ತು ಸ್ಪಂದನಾ ವಾಹನವನ್ನು ರವಾನಿಸಲಾಗುತ್ತಿದೆ. ಜಿ.ಪಿ.ಎಸ್ ಮಾರ್ಗವನ್ನು ರವಾನಿಸಲಾಗಿದೆ.` : `🚨 TACTICAL DISPATCH ALERT\n\nDeploying emergency response vehicle from ${activeStationInfo.name} to reported incident hotspots. GPS routing transmitted.`);
                  }}
                  style={{
                    width: '100%',
                    background: 'var(--primary-dim)',
                    border: '1px solid var(--primary)',
                    color: 'var(--text-primary)',
                    padding: '0.5rem',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '0.8rem',
                    fontWeight: '700',
                    marginTop: '0.25rem',
                    transition: 'var(--transition-smooth)'
                  }}
                >
                  {translations[lang].mapControls.tacticalDispatch}
                </button>

                {/* Station FIR Cases Inspector Card */}
                {(() => {
                  const stationCases = incidentsList.filter(c => {
                    const cStId = String(c.policeStationId || c.PoliceStationID || '');
                    const cStName = String(c.UnitName || c.policeStationName || '').toLowerCase();
                    const stUnitId = String(activeStationInfo.unitId || '');
                    const stName = activeStationInfo.name.toLowerCase();
                    return cStId === activeStationInfo.id || (stUnitId && cStId === stUnitId) || (stName && cStName.includes(stName));
                  });

                  return (
                    <div className="dossier-section-card" style={{ borderLeft: '3px solid var(--accent)', marginTop: '0.5rem' }}>
                      <div className="section-header" style={{ justifyContent: 'space-between' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <Folder size={13} style={{ color: 'var(--accent)' }} />
                          {lang === 'kn' ? 'ಠಾಣೆಯ ಎಫ್‌ಐಆರ್ ಪ್ರಕರಣಗಳು' : 'STATION FIR CASES'}
                        </span>
                        <span style={{ background: 'var(--accent)', color: 'var(--text-inverse)', fontSize: '0.62rem', fontWeight: 800, padding: '1px 6px', borderRadius: '10px' }}>
                          {stationCases.length} {lang === 'kn' ? 'ಪ್ರಕರಣಗಳು' : 'Cases'}
                        </span>
                      </div>
                      <div className="section-body" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {stationCases.length > 0 ? (
                          stationCases.map((c, idx) => (
                            <div
                              key={c.id || idx}
                              onClick={() => setSelectedIncident(c)}
                              style={{
                                background: 'var(--bg-inset)',
                                border: '1px solid var(--border-muted)',
                                borderRadius: 'var(--radius-sm)',
                                padding: '0.55rem 0.75rem',
                                cursor: 'pointer',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '0.3rem',
                                transition: 'all 0.15s ease'
                              }}
                            >
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--accent)' }}>
                                  {c.crimeNo || c.id}
                                </span>
                                <span className={`badge badge-${c.severity ? c.severity.toLowerCase() : 'medium'}`} style={{ fontSize: '0.6rem' }}>
                                  {c.type}
                                </span>
                              </div>
                              <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', lineHeight: 1.35 }}>
                                {c.briefFacts || c.description || 'FIR Case Details'}
                              </div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.62rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                                  <Calendar size={11} /> {c.date}
                                </span>
                                <span style={{ color: 'var(--primary-light)', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '3px' }}>
                                  <Target size={11} /> {lang === 'kn' ? 'ಮ್ಯಾಪ್‌ನಲ್ಲಿ ತೋರಿಸಿ →' : 'Map Trajectory →'}
                                </span>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textAlign: 'center', padding: '0.75rem' }}>
                            {lang === 'kn' ? 'ಈ ಪೋಲಿಸ್ ಠಾಣೆಯಲ್ಲಿ ಪ್ರಸ್ತುತ ಯಾವುದೇ ಪ್ರಕರಣಗಳಿಲ್ಲ.' : 'No active FIR cases registered for this precinct.'}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })()}
              </div>
            ) : (
              /* AI Threat Advisory default fallback */
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ padding: '0.75rem', background: 'var(--bg-inset)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                  <Lightbulb size={16} style={{ color: 'var(--accent)', flexShrink: 0, marginTop: '2px' }} />
                  <span>{lang === 'kn' ? 'ನಕ್ಷೆಯಲ್ಲಿ ಯಾವುದೇ ಘಟನೆ ಅಥವಾ ಪೋಲಿಸ್ ಠಾಣೆಯನ್ನು ಕ್ಲಿಕ್ ಮಾಡಿ ಅದರ ವಿವರವಾದ dossier ಪರಿಶೀಲಿಸಿ.' : 'Click on any incident marker or police station pin on the map to inspect its full FIR Dossier & Precinct details.'}</span>
                </div>

                <div style={{ padding: '1rem', background: 'var(--bg-surface)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', borderLeft: '3px solid var(--red)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <h4 style={{ fontSize: '0.85rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--red)', margin: 0 }}>
                    <ShieldAlert size={16} />
                    {translations[lang].mapControls.threatAdvisoryTitle}
                  </h4>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: '1.4', margin: 0 }}>
                    {translations[lang].mapControls.threatAdvisoryText}
                  </p>
                </div>
              </div>
            )}

          </div>
        )}

      </div>
    </div>
  );
}
