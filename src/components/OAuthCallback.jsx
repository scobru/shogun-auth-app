import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const OAuthCallback = ({ shogun }) => {
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const processing = useRef(false);

  useEffect(() => {
    const handleAuth = async () => {
      if (processing.current) {
        console.warn("OAuth callback is already being processed, skipping.");
        return;
      }
      processing.current = true;

      try {
        if (!shogun) {
          throw new Error('Shogun SDK not available');
        }

        const oauthPlugin = shogun.getPlugin('oauth');
        if (!oauthPlugin || !oauthPlugin.handleOAuthCallback) {
          throw new Error('OAuth plugin or handleOAuthCallback method is not available');
        }

        const params = new URLSearchParams(location.search);
        const code = params.get('code');
        const state = params.get('state');

        if (!code) {
          throw new Error("Authorization code not found in URL.");
        }

        const provider = params.get('provider') || 'google';

        console.log(`[${new Date().toISOString()}] Handling OAuth callback for ${provider}`);
        const result = await oauthPlugin.handleOAuthCallback(provider, code, state);

        if (result.success) {
          console.log(`[${new Date().toISOString()}] Authentication successful:`, result);
          
          window.dispatchEvent(new CustomEvent('shogun:auth:updated', {
            detail: {
              success: true,
              userPub: result.userPub,
              username: result.username,
              authMethod: 'oauth',
              isNewUser: result.isNewUser
            }
          }));

          window.location.href = '/'; // Forza reload per aggiornare il context
        } else {
          throw new Error(result.error || 'Authentication failed');
        }
      } catch (e) {
        console.error("Error handling OAuth callback:", e);
        if (e.message?.includes('invalid_grant')) {
          setError('Your session has expired. Please try signing in again.');
          navigate('/?error=token_expired');
        } else {
          setError(e.message || 'An unexpected error occurred.');
        }
      }
    };

    handleAuth();
  }, [shogun, navigate, location]);

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-error mb-4">Authentication Failed</h2>
          <p className="text-base-content/80">{error}</p>
          <button className="btn btn-primary mt-6" onClick={() => navigate('/')}>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center h-screen">
      <div className="text-center">
        <div className="loading loading-spinner loading-lg"></div>
        <p className="mt-4">Processing authentication...</p>
      </div>
    </div>
  );
};

export default OAuthCallback; 