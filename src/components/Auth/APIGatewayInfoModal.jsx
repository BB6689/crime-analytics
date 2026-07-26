import React from 'react';
import { Cpu, ShieldCheck, Activity, Key, Globe, Lock, CheckCircle, RefreshCw, X, Server } from 'lucide-react';
import { useAuth } from './AuthContext';

export default function APIGatewayInfoModal({ lang = 'en' }) {
  const { isGatewayModalOpen, setIsGatewayModalOpen, user } = useAuth();

  if (!isGatewayModalOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        background: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(8px)',
        zIndex: 999999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem'
      }}
      onClick={() => setIsGatewayModalOpen(false)}
    >
      <div
        className="glass-panel"
        style={{
          width: '540px',
          maxWidth: '94vw',
          maxHeight: '90vh',
          overflowY: 'auto',
          background: 'var(--bg-surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-lg)',
          position: 'relative'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ background: 'var(--bg-deep)', padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Cpu size={22} style={{ color: 'var(--primary-light)' }} />
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                {lang === 'kn' ? 'ಕ್ಯಾಟಲಿಸ್ಟ್ ಎಪಿಐ ಗೇಟ್‌ವೇ ಮತ್ತು ಸಂಪರ್ಕಗಳು' : 'Catalyst API Gateway & Connections'}
              </h3>
              <span style={{ fontSize: '0.68rem', color: 'var(--text-secondary)' }}>
                API Throttling • Authorization Routing • OAuth Token Pool
              </span>
            </div>
          </div>
          <button
            onClick={() => setIsGatewayModalOpen(false)}
            style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          {/* Section 1: Throttling & Health */}
          <div style={{ background: 'var(--bg-inset)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.82rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                <Activity size={16} style={{ color: 'var(--green)' }} />
                <span>API Gateway Health & Rate Limits</span>
              </div>
              <span style={{ fontSize: '0.65rem', background: 'rgba(16,185,129,0.15)', color: 'var(--green)', padding: '2px 8px', borderRadius: '10px', fontWeight: 700 }}>
                Status: ACTIVE (100%)
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.6rem', textAlign: 'center' }}>
              <div style={{ background: 'var(--bg-surface)', padding: '0.6rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>RATE LIMIT</div>
                <div style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--primary-light)' }}>100 req/min</div>
              </div>
              <div style={{ background: 'var(--bg-surface)', padding: '0.6rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>REMAINING</div>
                <div style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--green)' }}>98 / 100</div>
              </div>
              <div style={{ background: 'var(--bg-surface)', padding: '0.6rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>LATENCY</div>
                <div style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--gold)' }}>18 ms</div>
              </div>
            </div>
          </div>

          {/* Section 2: Catalyst Connections OAuth Tokens */}
          <div>
            <h4 style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-primary)', textTransform: 'uppercase', marginBottom: '0.6rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Globe size={14} style={{ color: 'var(--primary-light)' }} />
              Catalyst OAuth Connections & 3rd-Party Integrations
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div style={{ background: 'var(--bg-inset)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-primary)' }}>Zoho CRM / KSP Crime Registry Sync</div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Connection ID: `conn_ksp_zoho_oauth2` • Token Scope: Read / Write</div>
                </div>
                <span style={{ fontSize: '0.65rem', background: 'rgba(127,109,242,0.15)', color: 'var(--primary-light)', padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}>
                  CONNECTED
                </span>
              </div>

              <div style={{ background: 'var(--bg-inset)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-primary)' }}>NCRB / CCTNS National Database Connector</div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Connection ID: `conn_ncrb_national_v2` • OAuth Token Refresh: Auto</div>
                </div>
                <span style={{ fontSize: '0.65rem', background: 'rgba(16,185,129,0.15)', color: 'var(--green)', padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}>
                  SYNCED
                </span>
              </div>
            </div>
          </div>

          {/* Section 3: Protected API Endpoints Routing */}
          <div>
            <h4 style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-primary)', textTransform: 'uppercase', marginBottom: '0.6rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Lock size={14} style={{ color: 'var(--accent)' }} />
              API Gateway Route Policies
            </h4>
            <div style={{ background: 'var(--bg-inset)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '0.75rem', fontSize: '0.72rem', fontFamily: 'var(--font-mono)' }}>
              <div style={{ color: 'var(--green)', marginBottom: '0.2rem' }}>GET /server/police_fir_api/api/cases → Auth: Public / Officer</div>
              <div style={{ color: 'var(--green)', marginBottom: '0.2rem' }}>GET /server/police_fir_api/api/tables → Auth: Public / Officer</div>
              <div style={{ color: 'var(--accent)', marginBottom: '0.2rem' }}>POST /server/police_fir_api/api/cases → Auth: Officer Token Required</div>
              <div style={{ color: 'var(--accent)' }}>POST /server/police_fir_api/api/auth/login → Auth: Public Gateway</div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
