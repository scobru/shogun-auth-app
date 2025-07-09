import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const OAuthCallback = ({ shogun }) => {
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const processing = useRef(false);

  // Function to clean up corrupted user data
  const cleanupUserData = async (username) => {
    try {
      console.log(`[${new Date().toISOString()}] Cleaning up data for user: ${username}`);
      
      // Clear localStorage entries related to GunDB and the specific user
      Object.keys(localStorage).forEach(key => {
        if (key.includes('gun/') || key.includes('gun-') || 
            key.includes('user') || key.includes('pair') || 
            key.includes('oauth') || key.includes(username) ||
            key.includes('radata')) {
          console.log(`[${new Date().toISOString()}] Removing localStorage key: ${key}`);
          localStorage.removeItem(key);
        }
      });
      
      // Clear sessionStorage
      Object.keys(sessionStorage).forEach(key => {
        if (key.includes('gun/') || key.includes('gun-') || 
            key.includes('user') || key.includes('pair') || 
            key.includes('oauth') || key.includes(username)) {
          console.log(`[${new Date().toISOString()}] Removing sessionStorage key: ${key}`);
          sessionStorage.removeItem(key);
        }
      });
      
      // Force Gun user to leave
      if (shogun && shogun.gun) {
        console.log(`[${new Date().toISOString()}] Forcing Gun user to leave`);
        shogun.gun.user().leave();
      }
      
      // Clear IndexedDB storage if possible
      if (window.indexedDB) {
        console.log(`[${new Date().toISOString()}] Attempting to clear IndexedDB`);
        const request = window.indexedDB.deleteDatabase('radata');
        request.onsuccess = () => console.log(`[${new Date().toISOString()}] Successfully deleted IndexedDB database`);
        request.onerror = (e) => console.error(`[${new Date().toISOString()}] Error deleting IndexedDB database:`, e);
      }
      
      // Give time for cleanup to complete
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log(`[${new Date().toISOString()}] Data cleanup completed`);
    } catch (err) {
      console.error(`[${new Date().toISOString()}] Error during data cleanup:`, err);
    }
  };

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

        console.log(`[${new Date().toISOString()}] Handling OAuth callback for google`);
        
        // First, complete the OAuth flow to get user credentials
        console.log(`[${new Date().toISOString()}] Completing OAuth flow with google`);
        const credentials = await oauthPlugin.completeOAuth('google', code, state);
        
        if (!credentials || !credentials.userInfo) {
          throw new Error("Failed to get valid user info from OAuth flow");
        }
        
        // Generate credentials from user info
        const userCredentials = await oauthPlugin.generateCredentials(credentials.userInfo, 'google');
        
        if (!userCredentials || !userCredentials.username || !userCredentials.password) {
          throw new Error("Failed to generate valid credentials from OAuth user info");
        }
        
        console.log(`[${new Date().toISOString()}] Got credentials for user: ${userCredentials.username}`);
        
        // Clean up any corrupted data for this user before attempting authentication
        await cleanupUserData(userCredentials.username);
        
        // Try to register the user first (this is more reliable)
        console.log(`[${new Date().toISOString()}] Attempting to register user: ${userCredentials.username}`);
        let authResult = await shogun.signUp(userCredentials.username, userCredentials.password);
        
        // If registration fails because user exists, try login
        if (!authResult.success) {
          console.log(`[${new Date().toISOString()}] Registration failed: ${authResult.error}, trying login`);
          
          // If the error indicates the user already exists, try to login
          if (authResult.error && (authResult.error.includes("already created") || 
                                  authResult.error.includes("already exists"))) {
            console.log(`[${new Date().toISOString()}] User already exists, attempting login`);
            authResult = await shogun.login(userCredentials.username, userCredentials.password);
          }
        }
        
        if (authResult.success) {
          console.log(`[${new Date().toISOString()}] Authentication successful: ${authResult.userPub}`);
          
          // Store OAuth data in user's graph
          if (credentials.userInfo) {
            console.log(`[${new Date().toISOString()}] Storing OAuth profile data`);
            await shogun.user.put({
              oauth: {
                provider: 'google',
                id: credentials.userInfo.id,
                email: credentials.userInfo.email,
                name: credentials.userInfo.name,
                picture: credentials.userInfo.picture,
                lastLogin: Date.now()
              }
            });
          }
          
          window.dispatchEvent(new CustomEvent('shogun:auth:updated', {
            detail: {
              success: true,
              userPub: authResult.userPub,
              username: userCredentials.username,
              authMethod: 'oauth',
              isNewUser: authResult.isNewUser
            }
          }));

          navigate('/', { state: { authSuccess: true } });
        } else {
          throw new Error(authResult.error || 'Authentication failed');
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