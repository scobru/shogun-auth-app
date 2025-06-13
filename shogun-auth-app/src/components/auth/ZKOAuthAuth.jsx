import React, { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';

// Function to generate a PKCE code verifier
const generateCodeVerifier = () => {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
  let verifier = '';
  const randomValues = new Uint8Array(128);
  window.crypto.getRandomValues(randomValues);
  
  for (let i = 0; i < 128; i++) {
    verifier += charset[randomValues[i] % charset.length];
  }
  
  return verifier;
};

// Function to base64url encode an ArrayBuffer
const base64urlEncode = (arrayBuffer) => {
  return btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
};

// Function to generate PKCE code challenge from verifier using SHA-256
const generateCodeChallenge = async (verifier) => {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const digest = await window.crypto.subtle.digest('SHA-256', data);
  
  // Convert the digest to a URL-safe base64 string (base64url encoding)
  return base64urlEncode(digest);
};

const ZKOAuthAuth = ({ onLogin, onRegister }) => {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [provider, setProvider] = useState('google');
  const [debug, setDebug] = useState('');
  const [pkceReady, setPkceReady] = useState(false);
  
  // Generate and store PKCE values on component mount
  useEffect(() => {
    const setupPKCE = async () => {
      try {
        setDebug('Setting up PKCE...');
        const codeVerifier = generateCodeVerifier();
        const codeChallenge = await generateCodeChallenge(codeVerifier);
        
        // Store these in localStorage
        localStorage.setItem('oauth_verifier_google', codeVerifier);
        localStorage.setItem('oauth_challenge_google', codeChallenge);
        
        // Generate a state parameter for CSRF protection
        const state = uuidv4();
        localStorage.setItem('oauth_state_google', state);
        
        setDebug(`PKCE setup complete.\nVerifier (first 10 chars): ${codeVerifier.substring(0, 10)}...\nChallenge (first 10 chars): ${codeChallenge.substring(0, 10)}...\nState: ${state}`);
        setPkceReady(true);
      } catch (err) {
        setError(`PKCE setup error: ${err.message}`);
        setDebug(`PKCE setup error: ${err.message}\n${err.stack || ''}`);
      }
    };
    
    setupPKCE();
  }, []);

  const handleLogin = async () => {
    if (!pkceReady) {
      setError('PKCE setup not complete. Please wait a moment and try again.');
      return;
    }
    
    setLoading(true);
    setError('');
    setDebug('Initiating OAuth login...');

    try {
      // Store the provider for the callback
      localStorage.setItem('oauth_provider', provider);
      
      // Get the PKCE code challenge
      const codeChallenge = localStorage.getItem(`oauth_challenge_${provider}`);
      const state = localStorage.getItem(`oauth_state_${provider}`);
      
      if (!codeChallenge) {
        throw new Error('PKCE code challenge not found. Please refresh the page and try again.');
      }
      
      // Manually construct the OAuth URL
      const clientId = "15241942495-ftd3cs98qvem6snh6isbabc3adoc9f4p.apps.googleusercontent.com";
      const redirectUri = encodeURIComponent("http://localhost:8080/auth/callback");
      const scope = encodeURIComponent("openid email profile");
      
      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=${scope}&state=${state}&code_challenge=${codeChallenge}&code_challenge_method=S256`;
      
      setDebug(`Redirecting to: ${authUrl}`);
      
      // Short delay to allow debug message to be seen
      setTimeout(() => {
        window.location.href = authUrl;
      }, 500);
    } catch (err) {
      setError(err.message);
      setDebug(`Error: ${err.message}\n${err.stack || ''}`);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    // Registration uses the same OAuth flow as login
    handleLogin();
  };

  return (
    <div className="zkoauth-auth">
      <h3>🔐 Autenticazione Zero-Knowledge OAuth</h3>
      
      <div className="provider-selector">
        <label>
          <input
            type="radio"
            value="google"
            checked={provider === "google"}
            onChange={() => setProvider("google")}
          />
          Google
        </label>
        
        <label>
          <input
            type="radio"
            value="github"
            checked={provider === "github"}
            onChange={() => setProvider("github")}
            disabled
          />
          GitHub (prossimamente)
        </label>
        
        <label>
          <input
            type="radio"
            value="discord"
            checked={provider === "discord"}
            onChange={() => setProvider("discord")}
            disabled
          />
          Discord (prossimamente)
        </label>
      </div>
      
      <div className="button-group">
        <button 
          onClick={handleLogin}
          disabled={loading || !pkceReady}
        >
          {loading ? 'Caricamento...' : `🔓 Login con ${provider.charAt(0).toUpperCase() + provider.slice(1)}`}
        </button>
        
        <button 
          onClick={handleRegister}
          disabled={loading || !pkceReady}
        >
          {loading ? 'Caricamento...' : `📝 Registra con ${provider.charAt(0).toUpperCase() + provider.slice(1)}`}
        </button>
      </div>

      {error && (
        <div className="error-message">
          ❌ {error}
        </div>
      )}
      
      {debug && (
        <details className="debug-info" open>
          <summary>Debug Info</summary>
          <pre>{debug}</pre>
        </details>
      )}
    </div>
  );
};

export default ZKOAuthAuth; 