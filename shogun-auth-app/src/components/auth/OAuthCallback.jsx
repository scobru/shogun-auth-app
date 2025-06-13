import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

const OAuthCallback = ({ shogun }) => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('Elaborazione dell\'autenticazione...');
  const [error, setError] = useState(null);
  const [errorDetails, setErrorDetails] = useState(null);
  const [tokenData, setTokenData] = useState(null);
  const [userInfo, setUserInfo] = useState(null);
  
  // Add a ref to track if authentication is in progress or completed
  const authInProgressRef = useRef(false);
  // Add a ref to track if redirect is scheduled
  const redirectScheduledRef = useRef(false);

  // Force redirect after 5 seconds regardless of authentication state
  useEffect(() => {
    const forceRedirectTimer = setTimeout(() => {
      console.log('Forcing redirect after timeout');
      if (!redirectScheduledRef.current) {
        redirectScheduledRef.current = true;
        navigate('/');
      }
    }, 5000);
    
    return () => clearTimeout(forceRedirectTimer);
  }, [navigate]);

  useEffect(() => {
    const processOAuthCallback = async () => {
      // Prevent duplicate authentication attempts
      if (authInProgressRef.current) {
        console.log('Authentication already in progress, skipping duplicate attempt');
        return;
      }
      
      // Mark authentication as in progress
      authInProgressRef.current = true;
      
      try {
        const code = searchParams.get('code');
        const state = searchParams.get('state');
        const provider = searchParams.get('provider') || localStorage.getItem('oauth_provider') || 'google';
        const error = searchParams.get('error');
        
        if (error) {
          throw new Error(`Errore OAuth: ${error} - ${searchParams.get('error_description') || 'Nessun dettaglio disponibile'}`);
        }
        
        if (!code) {
          throw new Error('Codice di autorizzazione mancante nella risposta OAuth');
        }

        setStatus(`Autenticazione con ${provider} in corso...`);
        
        // Verify state for CSRF protection
        const storedState = localStorage.getItem(`oauth_state_${provider}`);
        if (state && storedState && state !== storedState) {
          throw new Error('Stato OAuth non valido - possibile attacco CSRF');
        }
        
        // Get the code verifier needed for PKCE
        const codeVerifier = localStorage.getItem(`oauth_verifier_${provider}`);
        if (!codeVerifier) {
          throw new Error('Code verifier non trovato. Riprova l\'autenticazione.');
        }
        
        // Check if shogun is initialized
        if (!shogun) {
          setStatus('In attesa dell\'inizializzazione di Shogun...');
          // Wait for a bit to see if shogun initializes
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          // If still not initialized, redirect back to main page
          if (!shogun) {
            throw new Error('Shogun non inizializzato. Riprova l\'autenticazione.');
          }
        }
        
        // Get the ZK-OAuth plugin
        const zkOAuthPlugin = await shogun.getPlugin("zk-oauth");
        
        if (!zkOAuthPlugin) {
          throw new Error('Plugin ZK-OAuth non trovato.');
        }
        
        // Now store the code verifier in a location where the ZKOAuthConnector can find it
        // This fixes the CSRF error by ensuring the connector has access to the verifier
        sessionStorage.setItem(`oauth_verifier_${provider}`, codeVerifier);
        sessionStorage.setItem(`oauth_state_${provider}`, storedState);
        
        // Use the plugin's handleSimpleOAuth method instead of handleOAuthCallback
        setStatus('Completamento autenticazione con OAuth semplice...');
        const authResult = await zkOAuthPlugin.handleSimpleOAuth(provider, code, state);
        
        if (!authResult.success) {
          throw new Error(`Autenticazione fallita: ${authResult.error}`);
        }
        
        setStatus('Autenticazione completata con successo! Reindirizzamento...');
        console.log('Authentication successful, scheduling redirect');
        
        // Store additional authentication info
        if (authResult.username) {
          localStorage.setItem('shogun_username', authResult.username);
          console.log('Saved username to localStorage:', authResult.username);
        }
        
        if (authResult.userPub) {
          localStorage.setItem('shogun_userpub', authResult.userPub);
          console.log('Saved userPub to localStorage:', authResult.userPub);
        }
        
        // Set authentication method as zkoauth in localStorage
        localStorage.setItem('shogun_auth_method', 'zkoauth');
        console.log('Set auth method in localStorage: zkoauth');

        // Imposta manualmente il flag di autenticazione in sessionStorage
        // Questo verrà letto all'avvio dell'app dopo il redirect
        sessionStorage.setItem('shogun_authenticated', 'true');
        console.log('Set authentication flag in sessionStorage');
        
        // Clear stored OAuth data
        localStorage.removeItem(`oauth_verifier_${provider}`);
        localStorage.removeItem(`oauth_challenge_${provider}`);
        localStorage.removeItem(`oauth_state_${provider}`);
        localStorage.removeItem('oauth_provider');
        sessionStorage.removeItem(`oauth_verifier_${provider}`);
        sessionStorage.removeItem(`oauth_state_${provider}`);
        
        // Ensure we redirect
        if (!redirectScheduledRef.current) {
          redirectScheduledRef.current = true;
          // Try to redirect synchronously
          navigate('/');
          // Also schedule a backup redirect timer in case the navigate doesn't work immediately
          setTimeout(() => {
            window.location.href = '/';
          }, 1000);
        }
      } catch (err) {
        console.error('Errore durante il callback OAuth:', err);
        setError(err.message || 'Si è verificato un errore durante l\'autenticazione');
        setErrorDetails(err.stack || null);
        
        // Ensure we redirect even on error
        if (!redirectScheduledRef.current) {
          redirectScheduledRef.current = true;
          setTimeout(() => navigate('/'), 3000);
        }
      }
    };

    processOAuthCallback();
  }, [searchParams, shogun, navigate]);

  return (
    <div className="oauth-callback">
      <h2>🔐 Autenticazione OAuth</h2>
      
      {!error ? (
        <div className="success-message">
          <p>{status}</p>
          <div className="loading-spinner"></div>
          
          {tokenData && (
            <details className="debug-info">
              <summary>Token Data</summary>
              <pre>{JSON.stringify(tokenData, null, 2)}</pre>
            </details>
          )}
          
          {userInfo && (
            <details className="debug-info">
              <summary>User Info</summary>
              <pre>{JSON.stringify(userInfo, null, 2)}</pre>
            </details>
          )}
        </div>
      ) : (
        <div className="error-message">
          <p>❌ {error}</p>
          {errorDetails && (
            <details>
              <summary>Dettagli tecnici</summary>
              <pre>{errorDetails}</pre>
            </details>
          )}
          <p>Reindirizzamento alla pagina principale...</p>
        </div>
      )}
    </div>
  );
};

export default OAuthCallback; 