import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export const DEFAULT_OFFICER_PROFILE = {
  id: 'KSP-8842',
  name: 'Insp. R. Patil',
  kgid: 'KGID-74920',
  rank: 'Inspector of Police',
  district: 'BENGALURU_CITY',
  station: 'HAL Police Station',
  badge: 'KSP-8842',
  role: 'Station House Officer (SHO)',
  email: 'r.patil@ksp.gov.in'
};

export const DEMO_OFFICERS = [
  {
    id: 'KSP-8842',
    name: 'Insp. R. Patil',
    kgid: 'KGID-74920',
    rank: 'Inspector of Police',
    district: 'BENGALURU_CITY',
    station: 'HAL Police Station',
    badge: 'KSP-8842',
    role: 'Station House Officer (SHO)',
    email: 'r.patil@ksp.gov.in'
  },
  {
    id: 'KSP-4410',
    name: 'DySP V. Kumar',
    kgid: 'KGID-88319',
    rank: 'Deputy Superintendent of Police',
    district: 'MYSOURU',
    station: 'Devaraja Police Precinct',
    badge: 'KSP-4410',
    role: 'Sub-Divisional Officer',
    email: 'v.kumar@ksp.gov.in'
  },
  {
    id: 'KSP-1092',
    name: 'SP Ananya Sharma',
    kgid: 'KGID-99104',
    rank: 'Superintendent of Police',
    district: 'MANGALURU_CITY',
    station: 'District HQ Command',
    badge: 'KSP-1092',
    role: 'District Police Chief',
    email: 'a.sharma@ksp.gov.in'
  }
];

/** Map a raw Employee DB record to the officer profile shape used by the app */
function mapEmployeeToOfficer(emp) {
  return {
    id: `KSP-${emp.EmployeeID}`,
    name: emp.FirstName || `Officer ${emp.EmployeeID}`,
    kgid: emp.KGID || `KGID-${emp.EmployeeID}`,
    rank: emp.RankName || 'Police Officer',
    district: emp.DistrictName || 'BENGALURU_CITY',
    station: emp.UnitName || 'Unknown Station',
    badge: `KSP-${emp.EmployeeID}`,
    role: emp.DesignationName || 'Investigating Officer',
    email: `${(emp.FirstName || '').toLowerCase().replace(/\s+/g, '.')}@ksp.gov.in`,
    employeeId: emp.EmployeeID
  };
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('ksp_zoho_auth_user');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return null;
  });

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isGatewayModalOpen, setIsGatewayModalOpen] = useState(false);
  const [demoOfficers, setDemoOfficers] = useState(DEMO_OFFICERS);
  const [officersLoading, setOfficersLoading] = useState(false);

  useEffect(() => {
    if (user) {
      localStorage.setItem('ksp_zoho_auth_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('ksp_zoho_auth_user');
    }
  }, [user]);

  // Fetch live officer list from /api/employees on mount
  useEffect(() => {
    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const baseUrl = isLocal ? 'http://localhost:3000' : '/server/police_fir_api';
    setOfficersLoading(true);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    fetch(`${baseUrl}/api/employees`, { signal: controller.signal })
      .then(r => r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`)))
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          // Map top 20 officers by rank hierarchy, fallback to hardcoded if empty
          const liveOfficers = data.slice(0, 20).map(mapEmployeeToOfficer);
          setDemoOfficers(liveOfficers);
        }
      })
      .catch(err => {
        console.warn('Could not fetch live officers, using defaults:', err.message);
        setDemoOfficers(DEMO_OFFICERS);
      })
      .finally(() => { setOfficersLoading(false); clearTimeout(timeout); });
    return () => { controller.abort(); clearTimeout(timeout); };
  }, []);

  const login = (officerData = DEFAULT_OFFICER_PROFILE) => {
    const activeProfile = officerData || DEFAULT_OFFICER_PROFILE;
    setUser(activeProfile);
    setIsAuthModalOpen(false);
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('ksp_zoho_auth_user');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        login,
        logout,
        isAuthModalOpen,
        setIsAuthModalOpen,
        isGatewayModalOpen,
        setIsGatewayModalOpen,
        demoOfficers,
        officersLoading
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
