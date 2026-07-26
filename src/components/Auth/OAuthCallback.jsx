import React, { useEffect, useState } from 'react';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

export default function OAuthCallback() {
  const [status, setStatus] = useState('processing');
  const [message, setMessage] = useState('Processing Zoho OAuth authorization...');
  const [error, setError] = useState(null);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Get authorization code and state from URL
        const params = new URLSearchParams(window.location.search);
        const code = params.get('code');
        const state = params.get('state');
        const error = params.get('error');
        const errorDescription = params.get('error_description');

        // Handle errors from Zoho
        if (error) {
          console.error('OAuth error from Zoho:', error, errorDescription);
          setStatus('error');
          setError(`${error}: ${errorDescription || 'Authorization failed at Zoho'}`);
          setMessage('');
          
          // Close popup after delay
          setTimeout(() => {
            window.close();
          }, 3000);
          return;
        }

        if (!code) {
          throw new Error('No authorization code received from Zoho');
        }

        // Validate state (optional, mainly for popup flow)
        const storedState = sessionStorage.getItem('zoho_oauth_state');
        if (state && storedState && state !== storedState) {
          throw new Error('State parameter mismatch - potential CSRF attack');
        }

        setMessage('Exchanging authorization code for access token...');

        // Get backend base URL
        const isLocal = window.location.hostname === 'localhost' || 
                       window.location.hostname === '127.0.0.1';
        const baseUrl = isLocal ? 'http://localhost:3000' : '/server/police_fir_api';

        // Exchange code for token via backend
        const response = await fetch(`${baseUrl}/api/oauth/callback`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include', // Include cookies
          body: JSON.stringify({ code, state })
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || data.message || 'Token exchange failed');
        }

        setStatus('success');
        setMessage('Authentication successful! Redirecting...');

        // Store token info in sessionStorage for parent window
        sessionStorage.setItem('zoho_oauth_result', JSON.stringify({
          success: true,
          access_token: data.access_token,
          expires_in: data.expires_in
        }));

        // Clean up
        sessionStorage.removeItem('zoho_oauth_state');

        // Notify parent window and close
        if (window.opener && !window.opener.closed) {
          window.opener.postMessage({
            type: 'ZOHO_OAUTH_COMPLETE',
            success: true,
            data: data
          }, window.location.origin);
        }

        // Close popup after short delay
        setTimeout(() => {
          window.close();
        }, 1500);
      } catch (err) {
        console.error('OAuth callback error:', err);
        setStatus('error');
        setError(err.message || 'An error occurred during authentication');
        setMessage('');

        // Close popup after delay
        setTimeout(() => {
          if (window.opener && !window.opener.closed) {
            window.opener.postMessage({
              type: 'ZOHO_OAUTH_COMPLETE',
              success: false,
              error: err.message
            }, window.location.origin);
          }
          window.close();
        }, 3000);
      }
    };

    handleCallback();
  }, []);

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'radial-gradient(circle at 50% 30%, #0F172A 0%, #070B14 100%)',
      fontFamily: '"Inter", "San Francisco", sans-serif',
      color: '#F8FAFC'
    }}>
      <div style={{
        textAlign: 'center',
        padding: '2rem',
        maxWidth: '400px'
      }}>
        {status === 'processing' && (
          <>
            <div style={{ marginBottom: '1.5rem' }}>
              <Loader2 
                size={48} 
                style={{
                  margin: '0 auto',
                  color: '#38BDF8',
                  animation: 'spin 1s linear infinite'
                }}
              />
            </div>
            <h2 style={{
              fontSize: '1.25rem',
              fontWeight: 700,
              margin: '0 0 0.75rem 0'
            }}>
              {message}
            </h2>
            <style>{`
              @keyframes spin {
                from { transform: rotate(0deg); }
                to { transform: rotate(360deg); }
              }
            `}</style>
          </>
        )}

        {status === 'success' && (
          <>
            <div style={{ marginBottom: '1.5rem' }}>
              <CheckCircle2 
                size={48} 
                style={{
                  margin: '0 auto',
                  color: '#10B981'
                }}
              />
            </div>
            <h2 style={{
              fontSize: '1.25rem',
              fontWeight: 700,
              margin: '0 0 0.75rem 0',
              color: '#10B981'
            }}>
              {message}
            </h2>
            <p style={{
              fontSize: '0.9rem',
              color: '#94A3B8',
              margin: 0
            }}>
              This window will close automatically.
            </p>
          </>
        )}

        {status === 'error' && (
          <>
            <div style={{ marginBottom: '1.5rem' }}>
              <AlertCircle 
                size={48} 
                style={{
                  margin: '0 auto',
                  color: '#EF4444'
                }}
              />
            </div>
            <h2 style={{
              fontSize: '1.25rem',
              fontWeight: 700,
              margin: '0 0 0.75rem 0',
              color: '#EF4444'
            }}>
              Authentication Error
            </h2>
            <p style={{
              fontSize: '0.9rem',
              color: '#FCA5A5',
              margin: '0 0 0.5rem 0',
              wordBreak: 'break-word'
            }}>
              {error}
            </p>
            <p style={{
              fontSize: '0.85rem',
              color: '#94A3B8',
              margin: 0
            }}>
              This window will close automatically.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
