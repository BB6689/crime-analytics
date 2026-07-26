import fs from 'fs';

const appCode = `import React, { useState, useEffect } from 'react';
import { 
  Map as MapIcon, BarChart2, Users, FileText, Shield, Database as DatabaseIcon, 
  Cpu, Search, BookOpen, ClipboardList, Building2, Bell, ChevronDown, Sparkles, AlertCircle, ArrowUpRight
} from 'lucide-react';
import kspLogo from './assets/ksp_logo.png';

// Components
import DatabaseRegistry from './components/DatabaseRegistry/DatabaseRegistry';
import CrimeMap from './components/Geospatial/CrimeMap';
import MapControls from './components/Geospatial/MapControls';
import SCRBBoard from './components/SCRBBoard/SCRBBoard';
import CaseRegister from './components/CaseRegister/CaseRegister';
import FIRRegistration from './components/FIRRegistration/FIRRegistration';
import CriminalNetwork from './components/NetworkAnalysis/CriminalNetwork';
import NetworkInspector from './components/NetworkAnalysis/NetworkInspector';
import OffenderList from './components/OffenderTracker/OffenderList';
import RiskProfiler from './components/OffenderTracker/RiskProfiler';
import StationBrowser from './components/StationBrowser/StationBrowser';
import ZiaScanner from './components/ZiaScanner/ZiaScanner';

import { translations } from './translations';
import { POLICE_STATIONS, DISTRICTS, DISTRICT_IDS, INCIDENTS } from './mockData/incidentData';

function generateCaseLocations(c, stationCoords) {
  const baseLat = parseFloat(c.latitude || c.lat);
  const baseLng = parseFloat(c.longitude || c.lng);

  const locs = [
    {
      id: 'loc-1',
      stage: 'PRIMARY_CRIME_SCENE',
      label: 'Crime Scene Location',
      type: 'SCENE',
      lat: baseLat,
      lng: baseLng,
      address: c.BriefFacts ? c.BriefFacts.slice(0, 45) + '...' : 'Incident Location',
      notes: 'Primary reported crime scene.'
    }
  ];

  if (stationCoords && Array.isArray(stationCoords) && stationCoords.length === 2) {
    locs.push({
      id: 'loc-station',
      stage: 'POLICE_STATION_HQ',
      label: 'Jurisdictional Police Station',
      type: 'STATION',
      lat: stationCoords[0],
      lng: stationCoords[1],
      address: c.UnitName || 'Jurisdictional Police Station',
      notes: 'Handling Police Precinct.'
    });
  }

  return locs;
}

function buildNetworkAndProfilesFromIncidents(incidents) {
  const nodesMap = new Map();
  const links = [];
  const profilesMap = new Map();

  const sortedIncidents = [...incidents].sort((a, b) => new Date(a.crimeRegisteredDate || a.date) - new Date(b.crimeRegisteredDate || b.date));

  sortedIncidents.forEach(inc => {
    const incidentNodeId = \`I-\${inc.crimeNo || inc.id}\`;
    const caseNo = inc.caseNo || inc.case_no || inc.CaseNo || inc.crimeNo || inc.id || 'N/A';
    nodesMap.set(incidentNodeId, {
      id: incidentNodeId,
      label: \`Case #\${caseNo}\`,
      type: "INCIDENT",
      color: "#3B82F6",
      summary: inc.BriefFacts || inc.briefFacts || inc.description || "",
      district: inc.district || "BENGALURU_CITY"
    });

    if (inc.accused && inc.accused.name && inc.accused.name !== "Unidentified Assailants") {
      const accusedName = inc.accused.name.trim();
      const suspectId = \`P-\${accusedName.replace(/\\s+/g, '-').toLowerCase()}\`;
      
      const existingProfile = profilesMap.get(suspectId);
      const totalArrests = (existingProfile ? existingProfile.totalArrests : 0) + 1;
      
      const riskScore = Math.min(95, 55 + totalArrests * 10);
      const recidivism = Math.round(riskScore * 0.9);
      const status = inc.status === 'Closed' ? 'In Custody' : 'Wanted';

      links.push({
        source: suspectId,
        target: incidentNodeId,
        label: "Suspect",
        type: "involvement"
      });

      const timelineEvent = {
        date: inc.crimeRegisteredDate || inc.date,
        type: inc.crimeMajorHeadId || inc.type,
        description: inc.BriefFacts || inc.briefFacts || inc.description || ""
      };

      if (existingProfile) {
        existingProfile.totalArrests = totalArrests;
        existingProfile.riskScore = riskScore;
        existingProfile.recidivismRisk = recidivism;
        existingProfile.timeline.push(timelineEvent);
      } else {
        const newProfile = {
          id: suspectId,
          name: accusedName,
          alias: \`Suspect-\${accusedName.split(' ')[0]}\`,
          riskScore: riskScore,
          recidivismRisk: recidivism,
          totalArrests: totalArrests,
          primaryGang: "Independent Operative",
          status: status,
          age: inc.accused.age || 32,
          district: inc.district || "BENGALURU_CITY",
          supervisingOfficer: inc.policePersonName || "Insp. R. Patil",
          timeline: [timelineEvent]
        };
        profilesMap.set(suspectId, newProfile);

        nodesMap.set(suspectId, {
          id: suspectId,
          label: accusedName,
          type: "SUSPECT",
          color: "#EF4444",
          district: inc.district || "BENGALURU_CITY"
        });
      }
    }
  });

  return {
    network: {
      nodes: Array.from(nodesMap.values()),
      links: links
    },
    profiles: Array.from(profilesMap.values())
  };
}

export default function App() {
  const [lang, setLang] = useState('en');
  const [activeTab, setActiveTab] = useState('map');
  const [selectedDistrict, setSelectedDistrict] = useState(null);
  const [selectedPoliceStationId, setSelectedPoliceStationId] = useState(null);
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [incidentsList, setIncidentsList] = useState([]);
  const [networkData, setNetworkData] = useState({ nodes: [], links: [] });
  const [offenderProfiles, setOffenderProfiles] = useState([]);
  const [selectedOffenderId, setSelectedOffenderId] = useState(null);
  const [selectedNetworkNode, setSelectedNetworkNode] = useState(null);

  const refreshData = async () => {
    try {
      let rawData = [];
      try {
        const response = await fetch('/server/police_fir_api/api/cases');
        if (response.ok) {
          const resJson = await response.json();
          if (Array.isArray(resJson)) rawData = resJson;
        }
      } catch (err) {
        console.warn("API cases endpoint unavailable, using seed dataset:", err);
      }

      let mappedData = [];

      if (rawData.length > 0) {
        const stationUnitMap = new Map();
        Object.keys(POLICE_STATIONS).forEach(key => {
          stationUnitMap.set(POLICE_STATIONS[key].unitId, key);
        });

        const districtIdToKeyMap = new Map();
        Object.keys(DISTRICT_IDS).forEach(key => {
          districtIdToKeyMap.set(parseInt(DISTRICT_IDS[key]), key);
        });

        const minorHeadToType = {
          "Murder": "HOMICIDE",
          "Robbery": "ASSAULT",
          "House Breaking": "BURGLARY",
          "Cheating / Fraud": "THEFT",
          "Assault": "ASSAULT",
          "Theft": "THEFT",
          "Vandalism": "VANDALISM",
          "Narcotics (NDPS)": "DRUG_TRAFFICKING"
        };

        mappedData = rawData.map(c => {
          const paddedUnitId = String(c.PoliceStationID).padStart(4, '0');
          const stationKey = stationUnitMap.get(paddedUnitId) || String(c.PoliceStationID);
          const districtKey = districtIdToKeyMap.get(c.DistrictID) || "BENGALURU_CITY";
          const typeKey = minorHeadToType[c.CrimeMinorHeadName] || "THEFT";
          const stationObj = POLICE_STATIONS[stationKey];

          const item = {
            ...c,
            id: c.CrimeNo || String(c.CaseMasterID),
            crimeNo: c.CrimeNo,
            caseNo: c.CaseNo,
            crimeRegisteredDate: c.CrimeRegisteredDate,
            date: c.CrimeRegisteredDate ? c.CrimeRegisteredDate.split(' ')[0] : new Date().toISOString().split('T')[0],
            policeStationId: stationKey,
            district: districtKey,
            type: typeKey,
            lat: parseFloat(c.latitude),
            lng: parseFloat(c.longitude),
            briefFacts: c.BriefFacts,
            description: c.BriefFacts,
            status: c.CaseStatusName === 'Closed' ? 'Closed' : 'Active',
            accused: c.accused || (c.AccusedName ? {
              name: c.AccusedName,
              age: c.AccusedAge || 30,
              gender: c.AccusedGenderID === 2 ? 'Female' : c.AccusedGenderID === 3 ? 'Transgender' : 'Male'
            } : null),
            policePersonName: c.OfficerName || c.policePersonName || "Unassigned"
          };

          item.locations = generateCaseLocations(item, stationObj ? stationObj.coords : null);
          return item;
        });
      } else {
        mappedData = [];
      }

      const { network, profiles } = buildNetworkAndProfilesFromIncidents(mappedData);
      setIncidentsList(mappedData);
      setNetworkData(network);
      setOffenderProfiles(profiles);
    } catch (e) {
      console.error("Failed to refresh data:", e);
    }
  };

  useEffect(() => {
    refreshData();
  }, []);

  const [mapFilters, setMapFilters] = useState({
    type: 'ALL',
    severity: 'ALL',
    status: 'ALL',
    timeRange: 'ALL'
  });

  const handleResetFilters = () => {
    setMapFilters({
      type: 'ALL',
      severity: 'ALL',
      status: 'ALL',
      timeRange: 'ALL'
    });
    setSelectedDistrict(null);
    setSelectedPoliceStationId(null);
    setSelectedIncident(null);
  };

  const handleViewProfileFromNetwork = (offenderId) => {
    setSelectedOffenderId(offenderId);
    setActiveTab('offenders');
  };

  return (
    <div className="app-container">
      {/* LEFT SIDEBAR NAVIGATION (MATCHING REFERENCE DESIGN) */}
      <aside className="app-sidebar">
        {/* User / Brand Header Block */}
        <div className="sidebar-user-header">
          <img
            src={kspLogo}
            alt="KSP Crest"
            className="sidebar-user-avatar"
            onError={(e) => { e.target.src = '/ksp_logo.png'; }}
          />
          <div className="sidebar-user-info">
            <div className="sidebar-user-name" style={{ fontFamily: lang === 'kn' ? 'var(--font-kannada)' : 'var(--font-body)' }}>
              {translations[lang].title}
            </div>
            <div className="sidebar-user-role">
              {translations[lang].subtitle}
            </div>
          </div>
          <ChevronDown size={14} style={{ color: 'var(--text-muted)' }} />
        </div>

        {/* Sidebar Quick Search */}
        <div className="sidebar-search-box">
          <Search size={14} style={{ color: 'var(--text-muted)' }} />
          <input type="text" placeholder={translations[lang].searchPlaceholder} />
        </div>

        {/* Navigation Section 1: Main */}
        <div className="sidebar-nav-section">
          <div className="sidebar-section-title">MAIN NAVIGATION</div>
          <nav className="nav-tabs">
            <button
              className={\`tab-btn \${activeTab === 'map' ? 'active' : ''}\`}
              onClick={() => setActiveTab('map')}
            >
              <MapIcon size={16} />
              {translations[lang].tabs.map}
            </button>
            <button
              className={\`tab-btn \${activeTab === 'scrb' ? 'active' : ''}\`}
              onClick={() => setActiveTab('scrb')}
            >
              <Shield size={16} />
              SCRB Intelligence
            </button>
            <button
              className={\`tab-btn \${activeTab === 'caseregister' ? 'active' : ''}\`}
              onClick={() => setActiveTab('caseregister')}
            >
              <FileText size={16} />
              Case Register
            </button>
          </nav>
        </div>

        {/* Navigation Section 2: Analytics & Investigation */}
        <div className="sidebar-nav-section">
          <div className="sidebar-section-title">ANALYTICS &amp; INVESTIGATION</div>
          <nav className="nav-tabs">
            <button
              className={\`tab-btn \${activeTab === 'network' ? 'active' : ''}\`}
              onClick={() => setActiveTab('network')}
            >
              <BarChart2 size={16} />
              {translations[lang].tabs.network}
            </button>
            <button
              className={\`tab-btn \${activeTab === 'offenders' ? 'active' : ''}\`}
              onClick={() => setActiveTab('offenders')}
            >
              <Users size={16} />
              Accused Dossiers
            </button>
            <button
              className={\`tab-btn \${activeTab === 'stations' ? 'active' : ''}\`}
              onClick={() => setActiveTab('stations')}
            >
              <Building2 size={16} />
              {translations[lang].tabs.stations}
            </button>
          </nav>
        </div>

        {/* Navigation Section 3: Registry & AI */}
        <div className="sidebar-nav-section">
          <div className="sidebar-section-title">REGISTRY &amp; AI SUITE</div>
          <nav className="nav-tabs">
            <button
              className={\`tab-btn \${activeTab === 'firreg' ? 'active' : ''}\`}
              onClick={() => setActiveTab('firreg')}
            >
              <ClipboardList size={16} />
              FIR Registration
            </button>
            <button
              className={\`tab-btn \${activeTab === 'dbExplorer' ? 'active' : ''}\`}
              onClick={() => setActiveTab('dbExplorer')}
            >
              <DatabaseIcon size={16} />
              {translations[lang].tabs.dbExplorer}
            </button>
            <button
              className={\`tab-btn \${activeTab === 'ziaAI' ? 'active' : ''}\`}
              onClick={() => setActiveTab('ziaAI')}
            >
              <Cpu size={16} />
              {translations[lang].tabs.ziaAI}
            </button>
          </nav>
        </div>

        {/* Bottom Banner Card (Matching Image Callout) */}
        <div className="sidebar-promo-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Sparkles size={16} style={{ color: '#FCD34D' }} />
            <span className="sidebar-promo-title">Zia AI Engine Active</span>
          </div>
          <div className="sidebar-promo-desc">
            Realtime cognitive intelligence, face analytics &amp; instant multi-language translation.
          </div>
          <button className="sidebar-promo-btn" onClick={() => setActiveTab('ziaAI')}>
            Open AI Desk <ArrowUpRight size={13} />
          </button>
        </div>
      </aside>

      {/* RIGHT MAIN CONTAINER */}
      <div className="app-main">
        {/* Main Top Header Bar */}
        <header className="main-top-header">
          {/* Top Search Input */}
          <div className="top-header-search">
            <Search size={15} style={{ color: 'var(--text-muted)' }} />
            <input type="text" placeholder={translations[lang].searchPlaceholder} />
          </div>

          {/* Right Action Utilities */}
          <div className="top-header-actions">
            {/* Notification Bell */}
            <button style={{ background: '#FFFFFF', border: '1px solid var(--border)', borderRadius: '50%', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', position: 'relative' }}>
              <Bell size={16} style={{ color: 'var(--text-secondary)' }} />
              <span style={{ position: 'absolute', top: 6, right: 6, width: 8, height: 8, background: '#EF4444', borderRadius: '50%' }} />
            </button>

            {/* Language Switcher Pill */}
            <div style={{ background: '#FFFFFF', border: '1px solid var(--border)', borderRadius: '20px', padding: '0.35rem 0.85rem', fontSize: '0.75rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.4rem', boxShadow: '0 2px 6px rgba(0,0,0,0.02)' }}>
              <span 
                style={{ color: lang === 'en' ? 'var(--primary)' : 'var(--text-secondary)', cursor: 'pointer', fontWeight: lang === 'en' ? '800' : '600' }}
                onClick={() => setLang('en')}
              >
                English
              </span>
              <span style={{ color: 'var(--border)' }}>|</span>
              <span 
                style={{ color: lang === 'kn' ? 'var(--primary)' : 'var(--text-secondary)', cursor: 'pointer', fontFamily: 'var(--font-kannada)', fontWeight: lang === 'kn' ? '800' : '600' }}
                onClick={() => setLang('kn')}
              >
                ಕನ್ನಡ
              </span>
              <span style={{ color: 'var(--border)' }}>|</span>
              <span 
                style={{ color: lang === 'hi' ? 'var(--primary)' : 'var(--text-secondary)', cursor: 'pointer', fontWeight: lang === 'hi' ? '800' : '600' }}
                onClick={() => setLang('hi')}
              >
                हिंदी
              </span>
            </div>

            {/* Status Badge */}
            <div className="badge badge-active">
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10B981' }} />
              KSP Active
            </div>
          </div>
        </header>

        {/* Page Workspace Title Bar */}
        <div className="workspace-title-bar">
          <div className="workspace-title" style={{ fontFamily: lang === 'kn' ? 'var(--font-kannada)' : 'var(--font-title)' }}>
            {activeTab === 'map' && <MapIcon size={20} style={{ color: 'var(--primary)' }} />}
            {activeTab === 'scrb' && <Shield size={20} style={{ color: 'var(--primary)' }} />}
            {activeTab === 'caseregister' && <FileText size={20} style={{ color: 'var(--primary)' }} />}
            {activeTab === 'network' && <BarChart2 size={20} style={{ color: 'var(--primary)' }} />}
            {activeTab === 'offenders' && <Users size={20} style={{ color: 'var(--primary)' }} />}
            {activeTab === 'stations' && <Building2 size={20} style={{ color: 'var(--primary)' }} />}
            {activeTab === 'firreg' && <ClipboardList size={20} style={{ color: 'var(--primary)' }} />}
            {activeTab === 'dbExplorer' && <DatabaseIcon size={20} style={{ color: 'var(--primary)' }} />}
            {activeTab === 'ziaAI' && <Cpu size={20} style={{ color: 'var(--primary)' }} />}

            {translations[lang].tabs[activeTab] || activeTab.toUpperCase()}
          </div>

          <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span>CLASSIFICATION: <strong style={{ color: 'var(--text-primary)' }}>INTERNAL KSP USE ONLY</strong></span>
          </div>
        </div>

        {/* Workspace Main Frame */}
        <main className="app-content">
          {/* TAB 1: GEOSPATIAL MAP VIEW */}
          {activeTab === 'map' && (
            <div className="visualizer-split">
              <div className="glass-panel scrollable" style={{ padding: "0.75rem", position: "relative", overflow: "hidden" }}>
                <div style={{ position: 'absolute', top: '1rem', left: '1rem', zIndex: 1000, pointerEvents: 'none' }}>
                  <div style={{
                    padding: '0.45rem 0.85rem',
                    pointerEvents: 'auto',
                    display: 'flex',
                    gap: '0.75rem',
                    alignItems: 'center',
                    background: '#FFFFFF',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-md)',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.06)'
                  }}>
                    <span style={{ fontSize: '0.72rem', fontWeight: 'bold', color: 'var(--primary)', textTransform: 'uppercase', fontFamily: lang === 'kn' ? 'var(--font-kannada)' : 'var(--font-title)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <MapIcon size={13} style={{ color: 'var(--primary)' }} />
                      {translations[lang].districtLabel}
                    </span>
                    <select
                      className="form-select"
                      style={{ width: 'auto', padding: '0.25rem 0.5rem', fontSize: '0.75rem', fontFamily: lang === 'kn' ? 'var(--font-kannada)' : 'inherit' }}
                      value={selectedDistrict || ''}
                      onChange={(e) => {
                        setSelectedDistrict(e.target.value || null);
                        setSelectedPoliceStationId(null);
                      }}
                    >
                      <option value="">{translations[lang].selectDistrict}</option>
                      {Object.keys(DISTRICTS).map(key => (
                        <option key={key} value={key}>
                          {translations[lang].districts[key] || DISTRICTS[key].name.replace(' (District)', '')}
                        </option>
                      ))}
                    </select>

                    {selectedDistrict && (
                      <>
                        <span style={{ fontSize: '0.72rem', fontWeight: 'bold', color: 'var(--primary)', textTransform: 'uppercase', fontFamily: lang === 'kn' ? 'var(--font-kannada)' : 'var(--font-title)' }}>
                          {translations[lang].precinctLabel}
                        </span>
                        <select
                          className="form-select"
                          style={{ width: 'auto', padding: '0.25rem 0.5rem', fontSize: '0.75rem', fontFamily: lang === 'kn' ? 'var(--font-kannada)' : 'inherit' }}
                          value={selectedPoliceStationId || ''}
                          onChange={(e) => setSelectedPoliceStationId(e.target.value || null)}
                        >
                          <option value="">{translations[lang].allStations}</option>
                          {Object.values(POLICE_STATIONS)
                            .filter(s => s.district === selectedDistrict)
                            .map(s => (
                              <option key={s.id} value={s.id}>{s.name}</option>
                            ))
                          }
                        </select>
                      </>
                    )}
                  </div>
                </div>
                <CrimeMap
                  lang={lang}
                  selectedDistrict={selectedDistrict}
                  setSelectedDistrict={setSelectedDistrict}
                  selectedPoliceStationId={selectedPoliceStationId}
                  setSelectedPoliceStationId={setSelectedPoliceStationId}
                  selectedIncident={selectedIncident}
                  setSelectedIncident={setSelectedIncident}
                  activeFilters={mapFilters}
                  incidentsList={incidentsList}
                />
              </div>
              
              <MapControls
                lang={lang}
                selectedDistrict={selectedDistrict}
                selectedPoliceStationId={selectedPoliceStationId}
                setSelectedPoliceStationId={setSelectedPoliceStationId}
                selectedIncident={selectedIncident}
                setSelectedIncident={setSelectedIncident}
                filters={mapFilters}
                setFilters={setMapFilters}
                onReset={handleResetFilters}
                incidentsList={incidentsList}
                refreshData={refreshData}
                networkData={networkData}
                offenderProfiles={offenderProfiles}
              />
            </div>
          )}

          {/* TAB 2: SCRB INTELLIGENCE BOARD */}
          {activeTab === 'scrb' && (
            <div className="full-size-panel">
              <SCRBBoard lang={lang} incidentsList={incidentsList} />
            </div>
          )}

          {/* TAB 3: CASE REGISTER */}
          {activeTab === 'caseregister' && (
            <div className="full-size-panel" style={{ padding: 0, overflow: 'hidden' }}>
              <CaseRegister lang={lang} incidentsList={incidentsList} />
            </div>
          )}

          {/* TAB 4: NETWORK & LINK ANALYSIS */}
          {activeTab === 'network' && (
            <div className="visualizer-split">
              <CriminalNetwork
                lang={lang}
                selectedNode={selectedNetworkNode}
                setSelectedNode={setSelectedNetworkNode}
                networkData={networkData}
                setNetworkData={setNetworkData}
              />
              <NetworkInspector
                lang={lang}
                selectedNode={selectedNetworkNode}
                onViewProfile={handleViewProfileFromNetwork}
                networkData={networkData}
              />
            </div>
          )}

          {/* TAB 5: ACCUSED DOSSIERS */}
          {activeTab === 'offenders' && (
            <div className="visualizer-split">
              <OffenderList
                lang={lang}
                selectedOffenderId={selectedOffenderId}
                setSelectedOffenderId={setSelectedOffenderId}
                offenderProfiles={offenderProfiles}
              />
              <RiskProfiler
                lang={lang}
                offenderId={selectedOffenderId}
                offenderProfiles={offenderProfiles}
              />
            </div>
          )}

          {/* TAB 6: PRECINCT COMMAND DIRECTORY */}
          {activeTab === 'stations' && (
            <StationBrowser
              lang={lang}
              onLocate={(station) => {
                setSelectedDistrict(station.district);
                setSelectedPoliceStationId(station.id);
                setActiveTab('map');
              }}
            />
          )}

          {/* TAB 7: FIR REGISTRATION */}
          {activeTab === 'firreg' && (
            <div className="full-size-panel" style={{ padding: 0 }}>
              <FIRRegistration lang={lang} />
            </div>
          )}

          {/* TAB 8: DATABASE REGISTRY */}
          {activeTab === 'dbExplorer' && (
            <DatabaseRegistry lang={lang} />
          )}

          {/* TAB 9: ZIA AI SUITE ASSISTANT */}
          {activeTab === 'ziaAI' && (
            <ZiaScanner lang={lang} />
          )}
        </main>

        {/* Footer */}
        <footer className="app-footer">
          <span style={{ fontWeight: 700, color: 'var(--primary)' }}>KARNATAKA STATE POLICE</span>
          <span>•</span>
          <span>Crime Analytics &amp; Intelligence Hub</span>
        </footer>
      </div>
    </div>
  );
}
\`;

fs.writeFileSync('./src/App.jsx', appCode);
console.log("Updated src/App.jsx with clean sidebar + main dashboard layout!");
