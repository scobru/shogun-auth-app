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
    <div className="card bg-base-200 p-6 my-4">
      <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
        <span className="text-lg">🔐</span> Autenticazione Zero-Knowledge OAuth
      </h3>
      
      <div className="form-control mb-4">
        <div className="flex flex-wrap gap-3 mb-4">
          <label className="label cursor-pointer gap-2 bg-base-300 px-4 py-2 rounded-lg">
            <input
              type="radio"
              value="google"
              checked={provider === "google"}
              onChange={() => setProvider("google")}
              className="radio radio-primary"
            />
            <span className="label-text">Google</span>
          </label>
          
          <label className="label cursor-pointer gap-2 bg-base-300 px-4 py-2 rounded-lg opacity-50">
            <input
              type="radio"
              value="github"
              checked={provider === "github"}
              onChange={() => setProvider("github")}
              disabled
              className="radio radio-primary"
            />
            <span className="label-text">GitHub (prossimamente)</span>
          </label>
          
          <label className="label cursor-pointer gap-2 bg-base-300 px-4 py-2 rounded-lg opacity-50">
            <input
              type="radio"
              value="discord"
              checked={provider === "discord"}
              onChange={() => setProvider("discord")}
              disabled
              className="radio radio-primary"
            />
            <span className="label-text">Discord (prossimamente)</span>
          </label>
        </div>
      </div>
      
      <div className="flex flex-col sm:flex-row gap-3">
        <button 
          onClick={handleLogin}
          disabled={loading || !pkceReady}
          className="btn btn-primary flex-1"
        >
          {loading ? <span className="loading loading-spinner"></span> : '🔓'} Login con {provider.charAt(0).toUpperCase() + provider.slice(1)}
        </button>
        
        <button 
          onClick={handleRegister}
          disabled={loading || !pkceReady}
          className="btn btn-secondary flex-1"
        >
          {loading ? <span className="loading loading-spinner"></span> : '📝'} Registra con {provider.charAt(0).toUpperCase() + provider.slice(1)}
        </button>
      </div>

      {error && (
        <div className="alert alert-error mt-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          <span>{error}</span>
        </div>
      )}
      
      {debug && (
        <details className="collapse collapse-arrow bg-base-300 mt-4">
          <summary className="collapse-title font-medium">Debug Info</summary>
          <div className="collapse-content">
            <pre className="text-xs whitespace-pre-wrap bg-base-200 p-2 rounded-md">{debug}</pre>
          </div>
        </details>
      )}
    </div>
  );
};

export default ZKOAuthAuth; 