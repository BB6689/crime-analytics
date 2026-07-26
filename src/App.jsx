import React, { useState, useEffect } from 'react';
import {
  Map as MapIcon, BarChart2, Users, Shield,
  Database as DatabaseIcon, Cpu, Search, Building2, Sun, Moon, FileText,
  UserCheck, LogOut, Key, Globe, Activity
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
import CriminalIntelligence from './components/NetworkAnalysis/CriminalIntelligence';
import OffenderList from './components/OffenderTracker/OffenderList';
import RiskProfiler from './components/OffenderTracker/RiskProfiler';
import StationBrowser from './components/StationBrowser/StationBrowser';
import ZiaScanner from './components/ZiaScanner/ZiaScanner';

// Auth & API Gateway
import { AuthProvider, useAuth } from './components/Auth/AuthContext';
import AuthModal from './components/Auth/AuthModal';
import APIGatewayInfoModal from './components/Auth/APIGatewayInfoModal';
import LoginScreen from './components/Auth/LoginScreen';

import { translations } from './translations';
import { POLICE_STATIONS, DISTRICTS, DISTRICT_IDS, INCIDENTS } from './mockData/incidentData';

const DEMO_MODE = true;

function buildDemoData() {
  return {
    incidents: [
      {
        id: 'DEMO-1001',
        crimeNo: '104430006202600001',
        caseNo: '202600001',
        crimeRegisteredDate: '2026-01-15',
        district: 'BENGALURU_CITY',
        policeStationId: 'BENGALURU_CITY',
        type: 'HOMICIDE',
        BriefFacts: 'Murder investigation registered for a business dispute in the city limits.',
        status: 'Under Investigation',
        latitude: 12.9716,
        longitude: 77.5946,
        accused: { name: 'Ravi M', age: 31, gender: 'Male' },
        policePersonName: 'Inspector S. Kumar'
      },
      {
        id: 'DEMO-1002',
        crimeNo: '204430006202600002',
        caseNo: '202600002',
        crimeRegisteredDate: '2026-02-10',
        district: 'MYSURU_CITY',
        policeStationId: 'MYSURU_CITY',
        type: 'THEFT',
        BriefFacts: 'Vehicle theft reported at a residential complex near the city centre.',
        status: 'Charge Sheeted',
        latitude: 12.2958,
        longitude: 76.6394,
        accused: { name: 'Arjun P', age: 28, gender: 'Male' },
        policePersonName: 'PSI N. Swamy'
      }
    ],
    schema: [
      { table: 'CaseMaster', columns: 16, purpose: 'Stores FIR registration and core case metadata' },
      { table: 'ComplainantDetails', columns: 7, purpose: 'Stores complainant demographics and identity data' },
      { table: 'Victim', columns: 5, purpose: 'Tracks victim details linked to each case' },
      { table: 'Accused', columns: 6, purpose: 'Tracks accused persons linked to each case' },
      { table: 'ActSectionAssociation', columns: 5, purpose: 'Maps legal acts and sections to a case' },
      { table: 'Employee', columns: 10, purpose: 'Stores police employee, rank, and designation information' }
    ]
  };
}

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
    const incidentNodeId = `I-${inc.crimeNo || inc.id}`;
    const caseNo = inc.caseNo || inc.case_no || inc.CaseNo || inc.crimeNo || inc.id || 'N/A';
    nodesMap.set(incidentNodeId, {
      id: incidentNodeId,
      label: `Case #${caseNo}`,
      type: "INCIDENT",
      color: "#3B82F6",
      summary: inc.BriefFacts || inc.briefFacts || inc.description || "",
      district: inc.district || "BENGALURU_CITY"
    });

    // Support accused as both array (from live API) and single object (demo/legacy)
    const accusedRaw = inc.accused;
    const accusedList = Array.isArray(accusedRaw)
      ? accusedRaw
      : (accusedRaw && accusedRaw.name ? [accusedRaw] : []);

    // Real arrest count from API (or estimate from accused involvement)
    const realArrestCount = typeof inc.arrestCount === 'number' ? inc.arrestCount : null;

    accusedList.forEach((accusedPerson, accusedIdx) => {
      if (!accusedPerson || !accusedPerson.name || accusedPerson.name === "Unidentified Assailants") return;

      const accusedName = accusedPerson.name.trim();
      const suspectId = `P-${accusedName.replace(/\s+/g, '-').toLowerCase()}`;

      const existingProfile = profilesMap.get(suspectId);
      // For multi-accused, each new case increments their arrest count
      const caseArrestsContribution = realArrestCount !== null ? realArrestCount : 1;
      const totalArrests = (existingProfile ? existingProfile.totalArrests : 0) + caseArrestsContribution;

      const riskScore = Math.min(95, 45 + totalArrests * 12 + (accusedList.length > 1 ? 8 : 0));
      const recidivism = Math.round(riskScore * 0.9);
      const status = inc.status === 'Closed' || inc.Status === 'Charge Sheeted' ? 'In Custody' : 'Wanted';

      links.push({
        source: suspectId,
        target: incidentNodeId,
        label: accusedPerson.personId || `A${accusedIdx + 1}`,
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
          alias: `Suspect-${accusedName.split(' ')[0]}`,
          riskScore,
          recidivismProbability: recidivism,
          recidivismRisk: recidivism,
          totalArrests,
          primaryGang: accusedList.length > 1 ? "Gang Operation" : "Independent Operative",
          status,
          age: accusedPerson.age || 32,
          gender: accusedPerson.gender || 'Male',
          district: inc.district || "BENGALURU_CITY",
          supervisingOfficer: inc.policePersonName || inc.OfficerName || "Insp. R. Patil",
          demographics: {
            employmentStatus: 'Unemployed',
            residenceDistrict: inc.district || 'BENGALURU_CITY'
          },
          riskFactors: {
            substanceAbuseHistory: riskScore > 70 ? 'Severe' : riskScore > 50 ? 'Moderate' : 'None',
            gangAffiliation: accusedList.length > 1 ? 'Active' : 'None'
          },
          timeline: [timelineEvent]
        };
        profilesMap.set(suspectId, newProfile);

        nodesMap.set(suspectId, {
          id: suspectId,
          label: accusedName,
          type: "SUSPECT",
          color: "#EF4444",
          riskScore,
          district: inc.district || "BENGALURU_CITY"
        });
      }
    });
  });

  return {
    network: { nodes: Array.from(nodesMap.values()), links },
    profiles: Array.from(profilesMap.values())
  };
}


const TABS = [
  { id: 'map', icon: MapIcon, label: 'GEOSPATIAL INTELLIGENCE', crumb: 'GEOSPATIAL INTELLIGENCE MAP' },
  { id: 'scrb', icon: BarChart2, label: 'STATISTICAL DASHBOARD', crumb: 'STATISTICAL INTELLIGENCE DASHBOARD' },
  { id: 'firreg', icon: FileText, label: 'FIR REGISTRATION', crumb: 'NEW FIR CASE REGISTRATION' },
  { id: 'network', icon: Shield, label: 'CRIMINAL LINK & OFFENDER PROFILER', crumb: 'CRIMINAL LINK NETWORK & OFFENDER PROFILER' },
  { id: 'stations', icon: Building2, label: 'PRECINCT DIRECTORY', crumb: 'PRECINCT COMMAND DIRECTORY' },
  { id: 'dbExplorer', icon: DatabaseIcon, label: 'DATABASE REGISTRY', crumb: 'DATABASE REGISTRY EXPLORER' },
  { id: 'ziaAI', icon: Cpu, label: 'AI SCANNER DESK', crumb: 'AI SCANNER DESK' },
];

function AppMain() {
  const { user, logout, setIsAuthModalOpen, setIsGatewayModalOpen } = useAuth();
  const isOnline = typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';
  const [lang, setLang] = useState('en');
  const [theme, setTheme] = useState('dark');
  const [activeTab, setActiveTab] = useState('map');
  const [demoMode, setDemoMode] = useState(false);
  const [selectedDistrict, setSelectedDistrict] = useState(null);
  const [selectedPoliceStationId, setSelectedPoliceStationId] = useState(null);
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [incidentsList, setIncidentsList] = useState([]);
  const [networkData, setNetworkData] = useState({ nodes: [], links: [] });
  const [offenderProfiles, setOffenderProfiles] = useState([]);
  const [selectedOffenderId, setSelectedOffenderId] = useState(null);
  const [selectedNetworkNode, setSelectedNetworkNode] = useState(null);
  const [firPreFillData, setFirPreFillData] = useState(null);

  // Apply theme attribute to <html>
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(t => t === 'dark' ? 'light' : 'dark');

  const launchDemo = () => {
    setDemoMode(true);
    setActiveTab('map');
    setSelectedDistrict(null);
    setSelectedPoliceStationId(null);
    setSelectedIncident(null);
  };

  const refreshData = async () => {
    try {
      let mappedData = [];

      if (demoMode) {
        const demoData = buildDemoData();
        mappedData = demoData.incidents.map(c => {
          const stationKey = c.policeStationId || 'BENGALURU_CITY';
          const stationObj = POLICE_STATIONS[stationKey];
          const item = {
            ...c,
            id: c.id || c.crimeNo,
            crimeNo: c.crimeNo,
            caseNo: c.caseNo,
            crimeRegisteredDate: c.crimeRegisteredDate,
            date: c.crimeRegisteredDate ? c.crimeRegisteredDate.split(' ')[0] : new Date().toISOString().split('T')[0],
            policeStationId: stationKey,
            district: c.district || 'BENGALURU_CITY',
            type: c.type || 'THEFT',
            lat: parseFloat(c.latitude),
            lng: parseFloat(c.longitude),
            briefFacts: c.BriefFacts,
            description: c.BriefFacts,
            status: c.status || 'Active',
            accused: c.accused || null,
            policePersonName: c.policePersonName || 'Unassigned'
          };

          item.locations = generateCaseLocations(item, stationObj ? stationObj.coords : null);
          return item;
        });
      } else {
        let rawData = [];
        try {
          const response = await fetch('/server/police_fir_api/api/cases');
          if (response.ok) {
            const resJson = await response.json();
            if (Array.isArray(resJson)) rawData = resJson;
          }
        } catch (err) {
          console.warn("API unavailable, using seed data:", err);
        }

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
        }
      }

      const { network, profiles } = buildNetworkAndProfilesFromIncidents(mappedData);
      setIncidentsList(mappedData);
      setNetworkData(network);
      setOffenderProfiles(profiles);
    } catch (e) {
      console.error("Failed to refresh data:", e);
    }
  };

  useEffect(() => { refreshData(); }, [demoMode]);

  const [mapFilters, setMapFilters] = useState({
    type: 'ALL',
    severity: 'ALL',
    status: 'ALL',
    timeRange: 'ALL'
  });

  // Allow a non-authenticated demo experience while preserving the protected portal for officers.
  if (!user && !demoMode) {
    return <LoginScreen lang={lang} setLang={setLang} />;
  }

  const handleResetFilters = () => {
    setMapFilters({ type: 'ALL', severity: 'ALL', status: 'ALL', timeRange: 'ALL' });
    setSelectedDistrict(null);
    setSelectedPoliceStationId(null);
    setSelectedIncident(null);
  };

  const handleViewProfileFromNetwork = (offenderId) => {
    setSelectedOffenderId(offenderId);
    setActiveTab('network');
  };

  const t = translations[lang] || translations.en;
  const activeTabMeta = TABS.find(tb => tb.id === activeTab) || TABS[0];

  // Mandatory Security Gate: Block access until authenticated
  if (!user) {
    return (
      <div className="app-container" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'radial-gradient(circle at center, #0F172A 0%, #020617 100%)', padding: '2rem', position: 'relative' }}>
        <AuthModal lang={lang} />

        {/* Language selector in top right of gateway */}
        <div style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div className="language-selector">
            <button className={`lang-btn ${lang === 'en' ? 'active' : ''}`} onClick={() => setLang('en')}>English</button>
            <span className="lang-divider">|</span>
            <button className={`lang-btn ${lang === 'kn' ? 'active' : ''}`} onClick={() => setLang('kn')} style={{ fontFamily: 'var(--font-kannada)' }}>ಕನ್ನಡ</button>
            <span className="lang-divider">|</span>
            <button className={`lang-btn ${lang === 'hi' ? 'active' : ''}`} onClick={() => setLang('hi')}>हिंदी</button>
          </div>
          <button className="theme-toggle" onClick={toggleTheme} title="Toggle theme">
            {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
          </button>
        </div>

        <div className="glass-panel" style={{ width: '460px', maxWidth: '94vw', padding: '2.5rem 2rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 20px 50px rgba(0,0,0,0.5)' }}>
          <img
            src={kspLogo}
            alt="KSP Crest"
            style={{ width: '88px', height: '88px', objectFit: 'contain', filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.4))' }}
            onError={(e) => { e.target.src = '/ksp_logo.png'; }}
          />

          <div>
            <h1 style={{ fontSize: '1.35rem', fontWeight: 900, color: '#F8FAFC', letterSpacing: '0.04em', margin: 0 }}>
              KARNATAKA STATE POLICE
            </h1>
            <p style={{ fontSize: '0.85rem', color: '#94A3B8', marginTop: '0.35rem', fontWeight: 600 }}>
              {t.title || 'Crime Analytics & Intelligence Portal'}
            </p>
          </div>

          <div style={{ background: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: 'var(--radius-md)', padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', gap: '0.65rem', color: '#FCA5A5', fontSize: '0.74rem', fontWeight: 700 }}>
            <Shield size={18} style={{ color: '#EF4444', flexShrink: 0 }} />
            <span>Restricted Access System • KSP Officer Authentication Required</span>
          </div>

          <button
            onClick={() => setIsAuthModalOpen(true)}
            style={{
              width: '100%',
              padding: '0.95rem 1.5rem',
              fontSize: '0.95rem',
              fontWeight: 800,
              background: 'linear-gradient(135deg, #4F46E5 0%, #3B82F6 100%)',
              color: '#ffffff',
              border: 'none',
              borderRadius: 'var(--radius-md)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.75rem',
              boxShadow: '0 6px 20px rgba(79, 70, 229, 0.45)',
              transition: 'transform 0.15s ease'
            }}
            className="hover-panel"
          >
            <Key size={18} />
            <span>{lang === 'kn' ? 'ಲಾಗಿನ್ ಮಾಡಿ ಮತ್ತು ಪೋರ್ಟಲ್ ಪ್ರವೇಶಿಸಿ' : 'Authenticate & Sign In to Access Portal'}</span>
          </button>

          <button
            onClick={launchDemo}
            style={{
              width: '100%',
              padding: '0.8rem 1.2rem',
              fontSize: '0.9rem',
              fontWeight: 700,
              background: 'linear-gradient(135deg, #0F766E 0%, #14B8A6 100%)',
              color: '#ffffff',
              border: 'none',
              borderRadius: 'var(--radius-md)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.55rem',
              boxShadow: '0 6px 20px rgba(20, 184, 166, 0.28)'
            }}
          >
            <Activity size={16} />
            <span>{lang === 'kn' ? 'ഡೈಮೋ മോಡ್ ತೆರೆಯಿರಿ' : 'Open Demo Mode'}</span>
          </button>
        </div>

        <div style={{ marginTop: '1.25rem', fontSize: '0.74rem', color: '#64748B', fontWeight: 400, textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
          <span>Official Karnataka State Police Intelligence Network</span>
          {isOnline && (
            <>
              <span>•</span>
              <span className="cursive-footer" style={{ fontSize: '1.05rem' }}>Code & Clues - Bhavajna & Balaji</span>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      <AuthModal lang={lang} />

      {/* ── HEADER ── */}
      <header className="app-header">
        {/* Row 1: Branding + Accessories */}
        <div className="header-top-row">
          <div className="brand-section">
            <img
              src={kspLogo}
              alt="KSP Crest"
              onError={(e) => { e.target.src = '/ksp_logo.png'; }}
            />
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <h1 className="brand-title">{t.title}</h1>
              <span className="brand-subtitle">{t.subtitle}</span>
            </div>
          </div>

          <div className="header-accessories">
            {/* Clean Officer Auth Profile Widget */}
            {!user && (
              <button
                onClick={launchDemo}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  background: 'linear-gradient(135deg, #0F766E 0%, #14B8A6 100%)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 'var(--radius-sm)',
                  padding: '0.45rem 0.8rem',
                  fontSize: '0.76rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  boxShadow: 'var(--shadow-sm)'
                }}
              >
                <Activity size={13} />
                <span>{lang === 'kn' ? 'ಡೈಮೋ' : 'Demo'}</span>
              </button>
            )}

            {user ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', background: 'var(--bg-elevated)', border: '1px solid var(--border)', padding: '3px 10px', borderRadius: 'var(--radius-sm)' }}>
                <Shield size={14} style={{ color: 'var(--primary-light)' }} />
                <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left' }}>
                  <span style={{ fontSize: '0.74rem', fontWeight: 800, color: 'var(--text-primary)' }}>{user.name}</span>
                  <span style={{ fontSize: '0.58rem', color: 'var(--text-muted)' }}>{user.badge} • {user.kgid}</span>
                </div>
                <button
                  onClick={() => setIsAuthModalOpen(true)}
                  style={{ background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: 'var(--radius-xs)', padding: '3px 6px', fontSize: '0.68rem', fontWeight: 700, cursor: 'pointer' }}
                  title="Switch Officer Account"
                >
                  <UserCheck size={12} />
                </button>
                <button
                  onClick={logout}
                  style={{ background: 'transparent', color: 'var(--red)', border: 'none', cursor: 'pointer', padding: '2px' }}
                  title="Sign Out"
                >
                  <LogOut size={13} />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsAuthModalOpen(true)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  background: 'var(--primary)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: 'var(--radius-sm)',
                  padding: '0.45rem 0.85rem',
                  fontSize: '0.76rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  boxShadow: 'var(--shadow-sm)'
                }}
              >
                <Key size={13} />
                <span>{lang === 'kn' ? 'ಅಧಿಕಾರಿ ಲಾಗಿನ್' : 'Officer Sign In'}</span>
              </button>
            )}

            {/* Theme Toggle */}
            <button className="theme-toggle" onClick={toggleTheme} title="Toggle theme">
              {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
            </button>

            {/* Language Switcher */}
            <div className="language-selector">
              <button
                className={`lang-btn ${lang === 'en' ? 'active' : ''}`}
                onClick={() => setLang('en')}
              >
                English
              </button>
              <span className="lang-divider">|</span>
              <button
                className={`lang-btn ${lang === 'kn' ? 'active' : ''}`}
                onClick={() => setLang('kn')}
                style={{ fontFamily: 'var(--font-kannada)' }}
              >
                ಕನ್ನಡ
              </button>
              <span className="lang-divider">|</span>
              <button
                className={`lang-btn ${lang === 'hi' ? 'active' : ''}`}
                onClick={() => setLang('hi')}
              >
                हिंदी
              </button>
            </div>

            {/* Search */}
            <div className="header-search-bar">
              <input type="text" placeholder={t.searchPlaceholder || "Search registry…"} />
              <button><Search size={14} /></button>
            </div>
          </div>
        </div>

        {/* Row 2: Navigation Tabs */}
        <div className="header-banner-row">
          <nav className="nav-tabs">
            {TABS.map(tab => {
              const Icon = tab.icon;
              const translatedLabel = t.tabs?.[tab.id] || tab.label;
              return (
                <button
                  key={tab.id}
                  className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  <Icon size={13} />
                  {translatedLabel}
                </button>
              );
            })}
          </nav>
        </div>
      </header>

      {/* ── MAIN CONTENT ── */}
      <main className="app-content">
        {/* TAB: GEOSPATIAL MAP */}
        {activeTab === 'map' && (
          <div className="visualizer-split" style={{ height: '100%' }}>
            <div style={{ position: 'relative', overflow: 'hidden', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', background: 'var(--bg-inset)' }}>
              {/* District selector overlay */}
              <div style={{ position: 'absolute', top: '0.75rem', left: '0.75rem', zIndex: 1000 }}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '0.6rem',
                  background: 'rgba(7, 11, 20, 0.90)',
                  backdropFilter: 'blur(8px)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius)',
                  padding: '0.4rem 0.75rem',
                  boxShadow: 'var(--shadow)'
                }}>
                  <MapIcon size={12} style={{ color: 'var(--primary)' }} />
                  <span style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--primary)', fontFamily: 'var(--font-title)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {t.mapLegend?.districtOverlay || 'District'}
                  </span>
                  <select
                    className="form-select"
                    style={{ width: '160px', height: '28px', padding: '0 0.5rem', fontSize: '0.72rem' }}
                    value={selectedDistrict || ''}
                    onChange={(e) => {
                      setSelectedDistrict(e.target.value || null);
                      setSelectedPoliceStationId(null);
                    }}
                  >
                    <option value="">{t.mapLegend?.allDistricts || 'All Districts'}</option>
                    {Object.keys(DISTRICTS).map(key => (
                      <option key={key} value={key}>
                        {t.districts?.[key] || DISTRICTS[key].name.replace(' (District)', '')}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <CrimeMap
                lang={lang}
                theme={theme}
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

        {activeTab === 'scrb' && (
          <div className="full-size-panel">
            <SCRBBoard lang={lang} incidentsList={incidentsList} />
          </div>
        )}

        {activeTab === 'caseregister' && (
          <div className="full-size-panel" style={{ padding: 0, overflow: 'hidden' }}>
            <CaseRegister lang={lang} incidentsList={incidentsList} />
          </div>
        )}

        {activeTab === 'network' && (
          <CriminalIntelligence
            lang={lang}
            networkData={networkData}
            setNetworkData={setNetworkData}
            selectedNetworkNode={selectedNetworkNode}
            setSelectedNetworkNode={setSelectedNetworkNode}
            offenderProfiles={offenderProfiles}
            selectedOffenderId={selectedOffenderId}
            setSelectedOffenderId={setSelectedOffenderId}
          />
        )}

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

        {activeTab === 'firreg' && (
          <div className="full-size-panel" style={{ padding: 0 }}>
            <FIRRegistration lang={lang} preFillData={firPreFillData} />
          </div>
        )}

        {activeTab === 'dbExplorer' && (
          <DatabaseRegistry lang={lang} />
        )}

        {activeTab === 'ziaAI' && (
          <ZiaScanner
            lang={lang}
            onAutoFillFIR={(extractedData) => {
              setFirPreFillData(extractedData);
              setActiveTab('firreg');
            }}
            onAutoFillEvidence={(extractedData) => {
              setActiveTab('dbExplorer');
            }}
            onAutoFillOffender={(extractedData) => {
              setActiveTab('network');
            }}
          />
        )}
      </main>

      {/* ── FOOTER ── */}
      <footer className="app-footer" style={{
        background: 'transparent',
        borderTop: '1px solid var(--border)',
        padding: '0.2rem 0.5rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0
      }}>
        {isOnline && <span className="cursive-footer">Code & Clues - Bhavajna & Balaji</span>}
      </footer>

      {/* Auth & API Gateway Modals */}
      <AuthModal lang={lang} />
      <APIGatewayInfoModal lang={lang} />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppMain />
    </AuthProvider>
  );
}
