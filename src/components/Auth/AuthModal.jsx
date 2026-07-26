import React, { useState } from 'react';
import { Shield, Key, X, Lock, LogIn, CheckCircle2, UserCheck } from 'lucide-react';
import { useAuth } from './AuthContext';

export default function AuthModal({ lang = 'en' }) {
  const { isAuthModalOpen, setIsAuthModalOpen, login, demoOfficers = [], user } = useAuth();
  const [ssoLaunched, setSsoLaunched] = useState(false);

  if (!isAuthModalOpen) return null;

  // Zoho OAuth Configuration
  const ZOHO_OAUTH_CLIENT_ID = process.env.REACT_APP_ZOHO_CLIENT_ID || 'your_zoho_client_id';
  const ZOHO_OAUTH_REDIRECT_URI = process.env.REACT_APP_ZOHO_REDIRECT_URI || 
    (window.location.hostname === 'localhost' 
      ? 'http://localhost:5173/auth/callback'
      : `${window.location.origin}/auth/callback`);
  const ZOHO_ACCOUNTS_URL = 'https://accounts.zoho.com/oauth/v2/auth';
  
  // Generate state for CSRF protection
  const generateState = () => {
    const state = Math.random().toString(36).substring(2, 15) + 
                  Math.random().toString(36).substring(2, 15);
    sessionStorage.setItem('zoho_oauth_state', state);
    return state;
  };

  const handleLaunchSSO = () => {
    try {
      // Generate state parameter for CSRF protection
      const state = generateState();
      
      // Build OAuth 2.0 Authorization URL
      // Removed prompt=login to allow session reuse
      const params = new URLSearchParams({
        client_id: ZOHO_OAUTH_CLIENT_ID,
        response_type: 'code',
        scope: 'ZohoMail.accounts.READ ZohoMail.messages.READ',
        redirect_uri: ZOHO_OAUTH_REDIRECT_URI,
        state: state,
        access_type: 'offline'
      });
      
      const authUrl = `${ZOHO_ACCOUNTS_URL}?${params.toString()}`;
      window.open(authUrl, '_blank', 'width=520,height=680');
      setSsoLaunched(true);
    } catch (err) {
      console.error('SSO launch error:', err);
    }
  };

  const handleConfirmSSO = () => {
    login(demoOfficers[0]);
    setIsAuthModalOpen(false);
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        background: 'rgba(0, 0, 0, 0.82)',
        backdropFilter: 'blur(8px)',
        zIndex: 999999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem'
      }}
      onClick={() => setIsAuthModalOpen(false)}
    >
      <div
        className="glass-panel"
        style={{
          width: '420px',
          maxWidth: '92vw',
          background: 'var(--bg-surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-lg)',
          overflow: 'hidden',
          position: 'relative'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ background: '#1E293B', padding: '1.25rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ background: '#0F172A', padding: '0.5rem', borderRadius: '50%', display: 'flex', border: '1px solid #334155' }}>
              <Shield size={22} style={{ color: '#38BDF8' }} />
            </div>
            <div>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 800, margin: 0, color: '#F8FAFC', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                {lang === 'kn' ? 'ಅಧಿಕಾರಿ ದೃಢೀಕರಣ' : 'Switch Officer Account'}
              </h3>
              <span style={{ fontSize: '0.68rem', color: '#94A3B8' }}>
                Karnataka State Police Secure Portal
              </span>
            </div>
          </div>
          <button
            onClick={() => setIsAuthModalOpen(false)}
            style={{ background: 'transparent', border: 'none', color: '#94A3B8', cursor: 'pointer', padding: '4px' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
          
          {user && (
            <div style={{ background: 'var(--bg-inset)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '0.75rem 1rem' }}>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                Currently Authenticated Officer
              </div>
              <div style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '2px' }}>
                {user.name} ({user.badge})
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--primary-light)' }}>
                {user.role} • {user.district}
              </div>
            </div>
          )}

          {/* Quick Officer Selection */}
          <div>
            <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', display: 'block', marginBottom: '0.5rem' }}>
              Select Officer Profile:
            </span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {demoOfficers.map((officer) => (
                <div
                  key={officer.id}
                  onClick={() => { login(officer); setIsAuthModalOpen(false); }}
                  style={{
                    background: 'var(--bg-inset)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-md)',
                    padding: '0.6rem 0.8rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                  className="hover-panel"
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <UserCheck size={16} style={{ color: 'var(--primary-light)' }} />
                    <div>
                      <div style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-primary)' }}>{officer.name}</div>
                      <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{officer.badge} • {officer.kgid}</div>
                    </div>
                  </div>
                  <span style={{ fontSize: '0.62rem', background: 'rgba(59,130,246,0.15)', color: 'var(--primary-light)', padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}>
                    {officer.rank}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
            {!ssoLaunched ? (
              <button
                onClick={handleLaunchSSO}
                style={{
                  width: '100%',
                  padding: '0.8rem 1.25rem',
                  fontSize: '0.88rem',
                  fontWeight: 800,
                  background: 'linear-gradient(135deg, #4F46E5 0%, #3B82F6 100%)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: 'var(--radius-md)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.65rem',
                  boxShadow: '0 4px 16px rgba(79, 70, 229, 0.40)'
                }}
              >
                <LogIn size={16} />
                <span>{lang === 'kn' ? 'Catalyst SSO ಪ್ರಾರಂಭಿಸಿ' : 'Authenticate via Catalyst SSO'}</span>
              </button>
            ) : (
              <button
                onClick={handleConfirmSSO}
                style={{
                  width: '100%',
                  padding: '0.8rem 1.25rem',
                  fontSize: '0.88rem',
                  fontWeight: 800,
                  background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: 'var(--radius-md)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.65rem'
                }}
              >
                <CheckCircle2 size={16} />
                <span>Confirm SSO & Switch</span>
              </button>
            )}
          </div>

          {/* Footer Security Notice */}
          <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '0.6rem 0.8rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.68rem', color: 'var(--text-secondary)' }}>
            <Lock size={14} style={{ color: 'var(--primary-light)', flexShrink: 0 }} />
            <span>Protected by Karnataka State Police Single Sign-On Infrastructure.</span>
          </div>

        </div>
      </div>
    </div>
  );
}
