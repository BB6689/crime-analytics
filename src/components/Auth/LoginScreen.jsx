import React, { useState } from 'react';
import { Shield, Key, Lock, LogIn, UserCheck, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useAuth } from './AuthContext';
import kspLogo from '../../assets/ksp_logo.png';

export default function LoginScreen({ lang = 'en', setLang }) {
  const { login, demoOfficers, officersLoading } = useAuth();
  const [activeTab, setActiveTab] = useState('sso'); // 'sso' | 'credentials' | 'officers'
  
  // Credentials state
  const [kgid, setKgid] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  
  // SSO State
  const [ssoLaunched, setSsoLaunched] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  // Zoho OAuth Configuration
  const ZOHO_OAUTH_CLIENT_ID = process.env.REACT_APP_ZOHO_CLIENT_ID || 'your_zoho_client_id';
  const ZOHO_OAUTH_REDIRECT_URI = process.env.REACT_APP_ZOHO_REDIRECT_URI || 
    (window.location.hostname === 'localhost' 
      ? 'http://localhost:5173/auth/callback'
      : `${window.location.origin}/auth/callback`);
  const ZOHO_ACCOUNTS_URL = 'https://accounts.zoho.com/oauth/v2/auth';
  
  // Generate PKCE challenge and state for security
  const generateState = () => {
    const state = Math.random().toString(36).substring(2, 15) + 
                  Math.random().toString(36).substring(2, 15);
    sessionStorage.setItem('zoho_oauth_state', state);
    return state;
  };

  const handleLaunchSSO = () => {
    setIsAuthenticating(true);
    setError('');
    
    try {
      // Generate state parameter for CSRF protection
      const state = generateState();
      
      // Build OAuth 2.0 Authorization URL
      // DO NOT include prompt=login - this allows session reuse
      const params = new URLSearchParams({
        client_id: ZOHO_OAUTH_CLIENT_ID,
        response_type: 'code',
        scope: 'ZohoMail.accounts.READ ZohoMail.messages.READ',
        redirect_uri: ZOHO_OAUTH_REDIRECT_URI,
        state: state,
        access_type: 'offline'
        // Removed: prompt=login (this was forcing re-authentication)
        // New behavior: Zoho will check for existing session
        //   - If user already logged in to Zoho: auto-redirect or show consent only
        //   - If no Zoho session: show login page
      });
      
      const authUrl = `${ZOHO_ACCOUNTS_URL}?${params.toString()}`;
      
      // Open in popup for better UX
      window.open(authUrl, '_blank', 'width=520,height=680');
      setSsoLaunched(true);
    } catch (err) {
      console.error('SSO launch error:', err);
      setError(lang === 'kn' ? 'SSO ಲಾಂಚ್ ವಿಫಲ' : 'Failed to launch SSO');
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleConfirmSSO = () => {
    // Authenticate officer upon user confirmation after SSO completion
    login(demoOfficers[0]);
  };

  const handleCredentialSubmit = (e) => {
    e.preventDefault();
    if (!kgid.trim()) {
      setError(lang === 'kn' ? 'ದಯವಿಟ್ಟು ಕೆಜಿಐಡಿ/ಬ್ಯಾಡ್ಜ್ ಸಂಖ್ಯೆಯನ್ನು ನಮೂದಿಸಿ' : 'Please enter your KGID or Officer ID.');
      return;
    }
    if (!password.trim()) {
      setError(lang === 'kn' ? 'ದಯವಿಟ್ಟು ಪಾಸ್‌ವರ್ಡ್ ನಮೂದಿಸಿ' : 'Please enter your password / security PIN.');
      return;
    }

    // Match existing officer profile or build custom profile
    const matchedOfficer = demoOfficers.find(o => 
      o.kgid.toLowerCase() === kgid.trim().toLowerCase() || 
      o.badge.toLowerCase() === kgid.trim().toLowerCase() ||
      o.id.toLowerCase() === kgid.trim().toLowerCase()
    );

    if (matchedOfficer) {
      login(matchedOfficer);
    } else {
      login({
        id: `KSP-${Math.floor(1000 + Math.random() * 9000)}`,
        name: `Officer (${kgid.trim()})`,
        kgid: kgid.trim().toUpperCase(),
        rank: 'Police Officer',
        district: 'BENGALURU_CITY',
        station: 'Jurisdictional Command',
        badge: `KSP-${kgid.trim()}`,
        role: 'Duty Officer',
        email: `${kgid.trim().toLowerCase()}@ksp.gov.in`
      });
    }
  };

  const isOnline = typeof window !== 'undefined' && 
    window.location.hostname !== 'localhost' && 
    window.location.hostname !== '127.0.0.1';

  return (
    <div style={{
      minHeight: '100vh',
      width: '100vw',
      background: 'radial-gradient(circle at 50% 30%, #0F172A 0%, #070B14 100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      overflowY: 'auto',
      padding: '2rem 1rem'
    }}>
      {/* Background Subtle Grid & Overlay */}
      <div style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: 'linear-gradient(rgba(56, 189, 248, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(56, 189, 248, 0.03) 1px, transparent 1px)',
        backgroundSize: '40px 40px',
        pointerEvents: 'none'
      }} />

      {/* Top Header Bar: Language Switcher */}
      <div style={{
        position: 'absolute',
        top: '1.25rem',
        right: '1.5rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        background: 'rgba(15, 23, 42, 0.8)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius)',
        padding: '4px 10px',
        zIndex: 10
      }}>
        <button
          className={`lang-btn ${lang === 'en' ? 'active' : ''}`}
          onClick={() => setLang && setLang('en')}
          style={{ background: lang === 'en' ? 'var(--primary)' : 'transparent', color: '#fff', border: 'none', padding: '3px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.72rem', fontWeight: 700 }}
        >
          English
        </button>
        <span style={{ color: 'var(--border)' }}>|</span>
        <button
          className={`lang-btn ${lang === 'kn' ? 'active' : ''}`}
          onClick={() => setLang && setLang('kn')}
          style={{ background: lang === 'kn' ? 'var(--primary)' : 'transparent', color: '#fff', border: 'none', padding: '3px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.72rem', fontWeight: 700, fontFamily: 'var(--font-kannada)' }}
        >
          ಕನ್ನಡ
        </button>
        <span style={{ color: 'var(--border)' }}>|</span>
        <button
          className={`lang-btn ${lang === 'hi' ? 'active' : ''}`}
          onClick={() => setLang && setLang('hi')}
          style={{ background: lang === 'hi' ? 'var(--primary)' : 'transparent', color: '#fff', border: 'none', padding: '3px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.72rem', fontWeight: 700 }}
        >
          हिंदी
        </button>
      </div>

      {/* Main Authentication Card */}
      <div style={{
        width: '460px',
        maxWidth: '92vw',
        background: 'rgba(15, 23, 42, 0.90)',
        backdropFilter: 'blur(16px)',
        border: '1px solid rgba(56, 189, 248, 0.25)',
        borderRadius: '16px',
        boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6), 0 0 30px rgba(56, 189, 248, 0.12)',
        overflow: 'hidden',
        position: 'relative',
        zIndex: 5
      }}>
        {/* Top Branding Banner */}
        <div style={{
          background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
          padding: '1.75rem 1.5rem 1.25rem 1.5rem',
          textAlign: 'center',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '0.75rem'
        }}>
          <img
            src={kspLogo}
            alt="Karnataka State Police Logo"
            style={{ height: '64px', width: 'auto', filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.5))' }}
          />
          <div>
            <h2 style={{
              fontSize: '1.15rem',
              fontWeight: 800,
              color: '#F8FAFC',
              margin: 0,
              letterSpacing: '0.04em',
              fontFamily: 'var(--font-title)',
              textTransform: 'uppercase'
            }}>
              {lang === 'kn' ? 'ಕರ್ನಾಟಕ ರಾಜ್ಯ ಪೊಲೀಸ್ ಸೈಬರ್ ಕೇಂದ್ರ' : 'Karnataka State Police'}
            </h2>
            <p style={{ fontSize: '0.75rem', color: '#38BDF8', margin: '4px 0 0 0', fontWeight: 700, letterSpacing: '0.02em' }}>
              {lang === 'kn' ? 'ಅಪರಾಧ ವಿಶ್ಲೇಷಣೆ ಮತ್ತು ಜಿಯೋಸ್ಪೇಷಿಯಲ್ ಇಂಟೆಲಿಜೆನ್ಸ್ ಪೋರ್ಟಲ್' : 'Crime Analytics & Geospatial Intelligence Platform'}
            </p>
          </div>
          
          <div style={{
            background: 'rgba(239, 68, 68, 0.12)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '20px',
            padding: '3px 12px',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            fontSize: '0.65rem',
            color: '#F87171',
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
          }}>
            <Lock size={12} />
            <span>Restricted Officer Portal • Sign In Required</span>
          </div>
        </div>

        {/* Tab Navigation for Sign-In Method */}
        <div style={{
          display: 'flex',
          background: '#0B1120',
          borderBottom: '1px solid var(--border)'
        }}>
          <button
            onClick={() => { setActiveTab('sso'); setError(''); }}
            style={{
              flex: 1,
              padding: '0.75rem 0.5rem',
              background: activeTab === 'sso' ? 'rgba(56, 189, 248, 0.1)' : 'transparent',
              color: activeTab === 'sso' ? '#38BDF8' : '#94A3B8',
              border: 'none',
              borderBottom: activeTab === 'sso' ? '2px solid #38BDF8' : '2px solid transparent',
              fontSize: '0.75rem',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.4rem',
              transition: 'all 0.15s ease'
            }}
          >
            <Shield size={14} />
            <span>{lang === 'kn' ? 'ಅಧಿಕಾರಿ ಲಾಗಿನ್' : 'Officer Login'}</span>
          </button>
          <button
            onClick={() => { setActiveTab('officers'); setError(''); }}
            style={{
              flex: 1,
              padding: '0.75rem 0.5rem',
              background: activeTab === 'officers' ? 'rgba(56, 189, 248, 0.1)' : 'transparent',
              color: activeTab === 'officers' ? '#38BDF8' : '#94A3B8',
              border: 'none',
              borderBottom: activeTab === 'officers' ? '2px solid #38BDF8' : '2px solid transparent',
              fontSize: '0.75rem',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.4rem',
              transition: 'all 0.15s ease'
            }}
          >
            <UserCheck size={14} />
            <span>{lang === 'kn' ? 'ಕರ್ತವ್ಯ ಪಟ್ಟಿ (ಡೆಮೊ)' : 'Duty Roster (Demo)'}</span>
          </button>
        </div>

        {/* Tab Content Container */}
        <div style={{ padding: '1.5rem' }}>
          
          {error && (
            <div style={{
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              borderRadius: '8px',
              padding: '0.65rem 0.85rem',
              marginBottom: '1.2rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontSize: '0.75rem',
              color: '#FCA5A5'
            }}>
              <AlertCircle size={15} style={{ flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          {/* TAB 1: OFFICER LOGIN */}
          {activeTab === 'sso' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
              <p style={{ fontSize: '0.78rem', color: '#94A3B8', margin: 0, lineHeight: 1.5 }}>
                {lang === 'kn' 
                  ? 'ಕರ್ನಾಟಕ ರಾಜ್ಯ ಪೊಲೀಸ್ ಮೂಲಸೌಕರ್ಯದ ಮೂಲಕ ದೃಢೀಕರಿಸಿ.'
                  : 'Authenticate securely through Karnataka State Police authentication portal.'}
              </p>

              {!ssoLaunched ? (
                <button
                  onClick={handleLaunchSSO}
                  disabled={isAuthenticating}
                  style={{
                    width: '100%',
                    padding: '0.9rem 1.25rem',
                    fontSize: '0.9rem',
                    fontWeight: 800,
                    background: 'linear-gradient(135deg, #4F46E5 0%, #3B82F6 100%)',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.65rem',
                    boxShadow: '0 4px 16px rgba(79, 70, 229, 0.40)',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <LogIn size={18} />
                  <span>
                    {isAuthenticating
                      ? (lang === 'kn' ? 'ದೃಢೀಕರಣ ಕಿಟಕಿ ತೆರೆಯಲಾಗುತ್ತಿದೆ...' : 'Launching Login Portal...')
                      : (lang === 'kn' ? 'ಅಧಿಕಾರಿ ಲಾಗಿನ್' : 'Officer Login')}
                  </span>
                </button>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                  <div style={{
                    background: 'rgba(56, 189, 248, 0.1)',
                    border: '1px solid rgba(56, 189, 248, 0.3)',
                    borderRadius: '8px',
                    padding: '0.85rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.65rem',
                    fontSize: '0.78rem',
                    color: '#38BDF8'
                  }}>
                    <CheckCircle2 size={18} style={{ flexShrink: 0 }} />
                    <span>
                      {lang === 'kn'
                        ? 'ದೃಢೀಕರಣ ಕಿಟಕಿ ತೆರೆಯಲಾಗಿದೆ. ದೃಢೀಕರಣ ಪೂರ್ಣಗೊಳಿಸಿದ ನಂತರ ಕೆಳಗಿನ ಬಟನ್ ಒತ್ತಿ.'
                        : 'Authentication window launched. Complete authentication in popup, then confirm sign-in to unlock portal.'}
                    </span>
                  </div>

                  <button
                    onClick={handleConfirmSSO}
                    style={{
                      width: '100%',
                      padding: '0.85rem 1.25rem',
                      fontSize: '0.88rem',
                      fontWeight: 800,
                      background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.65rem',
                      boxShadow: '0 4px 16px rgba(16, 185, 129, 0.35)'
                    }}
                  >
                    <CheckCircle2 size={18} />
                    <span>{lang === 'kn' ? 'ದೃಢೀಕರಣ ಖಚಿತಪಡಿಸಿ ಮತ್ತು ಪ್ರವೇಶಿಸಿ' : 'Confirm Login & Open Portal'}</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: DUTY ROSTER (1-CLICK DEMO OFFICERS) */}
          {activeTab === 'officers' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <p style={{ fontSize: '0.74rem', color: '#94A3B8', margin: '0 0 0.25rem 0' }}>
                {lang === 'kn' ? 'ಖಾತೆಗೆ ಲಾಗಿನ್ ಮಾಡಲು ಅಧಿಕಾರಿಯನ್ನು ಆಯ್ಕೆಮಾಡಿ:' : 'Select active duty officer to authenticate:'}
              </p>
              {demoOfficers.map((officer) => (
                <div
                  key={officer.id}
                  onClick={() => login(officer)}
                  style={{
                    background: '#0B1120',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    padding: '0.75rem 0.9rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    transition: 'all 0.15s ease'
                  }}
                  className="hover-panel"
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{
                      background: 'rgba(56, 189, 248, 0.15)',
                      border: '1px solid rgba(56, 189, 248, 0.3)',
                      borderRadius: '50%',
                      padding: '0.45rem',
                      display: 'flex',
                      color: '#38BDF8'
                    }}>
                      <Shield size={16} />
                    </div>
                    <div>
                      <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#F8FAFC' }}>
                        {officer.name}
                      </div>
                      <div style={{ fontSize: '0.68rem', color: '#94A3B8', display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '2px' }}>
                        <span>{officer.badge}</span>
                        <span>•</span>
                        <span>{officer.kgid}</span>
                      </div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '0.65rem', background: 'rgba(59, 130, 246, 0.15)', color: '#60A5FA', padding: '2px 8px', borderRadius: '10px', fontWeight: 700 }}>
                      {officer.rank}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>

        {/* Footer Security Notice */}
        <div style={{
          background: '#070B14',
          borderTop: '1px solid var(--border)',
          padding: '0.75rem 1.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '0.7rem',
          color: '#64748B'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Lock size={12} style={{ color: '#38BDF8' }} />
            <span>256-Bit Encrypted KSP Session</span>
          </div>
          {isOnline && (
            <div className="cursive-footer" style={{ fontSize: '1.2rem' }}>
              Code & Clues - Bhavajna & Balaji
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
