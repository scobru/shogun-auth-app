import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const OAuthCallback = ({ shogun }) => {
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const processed = useRef(false);

  useEffect(() => {
    const handleAuthCallback = async () => {
      if (processed.current) {
        return;
      }
      processed.current = true;

      if (!shogun) {
        setError("Shogun SDK not available.");
        return;
      }

      const oauthPlugin = shogun.getPlugin("oauth");
      if (!oauthPlugin || typeof oauthPlugin.handleOAuthCallback !== 'function') {
        console.warn("OAuth plugin or handleOAuthCallback method is not available. Redirecting home.");
        navigate('/');
        return;
      }

      try {
        const params = new URLSearchParams(location.search);
        const code = params.get('code');
        const state = params.get('state');

        if (!code) {
          throw new Error("Authorization code not found in URL.");
        }
        
        // Assuming the provider is 'google' for this flow.
        // A more robust implementation might store this in the state parameter.
        const provider = "google";

        const result = await oauthPlugin.handleOAuthCallback(provider, code, state);
        
        if (result && result.success) {
          // The handleOAuthCallback method should fire the 'auth:login' event
          // which the main provider listens for. We can just navigate home.
          navigate('/');
        } else {
          setError(result.error || "OAuth login failed during callback.");
        }
      } catch (e) {
        setError(e.message || "An unexpected error occurred during OAuth callback.");
      }
    };

    handleAuthCallback();
  }, [shogun, navigate, location]);

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h2 className="text-2xl font-bold text-error mb-4">Authentication Failed</h2>
        <p className="text-base-content/80">{error}</p>
        <button className="btn btn-primary mt-6" onClick={() => navigate('/')}>Go to Homepage</button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 text-center">
      <h2 className="text-2xl font-bold">Completing authentication...</h2>
      <span className="loading loading-spinner loading-lg mt-6"></span>
    </div>
  );
};

export default OAuthCallback; 