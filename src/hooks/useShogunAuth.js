import { useState, useEffect, useCallback, useRef } from 'react';
import { normalizeEmail } from '../utils/string';

/**
 * Custom hook for handling Shogun authentication
 * @param {Object} shogun - The Shogun SDK instance
 * @returns {Object} - Authentication methods and state
 */
export const useShogunAuth = (shogun) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const authInProgress = useRef(false);
  
  /**
   * Handles data cleanup for corrupted user data
   * @param {string} username - The username to clean up
   */
  const cleanupUserData = useCallback(async (username) => {
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
        try {
          const request = window.indexedDB.deleteDatabase('radata');
          request.onsuccess = () => console.log(`[${new Date().toISOString()}] Successfully deleted IndexedDB database`);
          request.onerror = (e) => console.error(`[${new Date().toISOString()}] Error deleting IndexedDB database:`, e);
          
          // Wait for the operation to complete
          await new Promise((resolve) => {
            request.onblocked = resolve;
            request.onsuccess = resolve;
            request.onerror = resolve;
            setTimeout(resolve, 1000); // Timeout as fallback
          });
        } catch (err) {
          console.error(`[${new Date().toISOString()}] Error deleting IndexedDB:`, err);
        }
      }
      
      console.log(`[${new Date().toISOString()}] Data cleanup completed`);
    } catch (err) {
      console.error(`[${new Date().toISOString()}] Error during data cleanup:`, err);
    }
  }, [shogun]);

  /**
   * Attempts to login with the given credentials
   * @param {string} username - The username (email)
   * @param {string} password - The password
   * @returns {Object} - The result of the login attempt
   */
  const login = useCallback(async (username, password) => {
    if (authInProgress.current) {
      console.warn("Auth operation already in progress");
      return { success: false, error: "Authentication already in progress" };
    }
    
    authInProgress.current = true;
    setError(null);
    setIsLoading(true);
    
    try {
      if (!shogun) {
        throw new Error("Shogun SDK not available");
      }
      
      console.log(`[${new Date().toISOString()}] Attempting login for user: ${username}`);
      
      // Normalize the email to ensure consistent format
      const normalizedUsername = normalizeEmail(username);
      
      // Try login
      const result = await shogun.login(normalizedUsername, password);
      
      if (result.success) {
        console.log(`[${new Date().toISOString()}] Login successful: ${result.userPub}`);
        
        // Fetch user data
        const userData = await shogun.user.get();
        setUser({ ...userData, username: normalizedUsername, userPub: result.userPub });
        setIsAuthenticated(true);
        return { success: true, userPub: result.userPub, userData };
      } else {
        console.error(`[${new Date().toISOString()}] Login failed:`, result.error);
        throw new Error(result.error || "Login failed");
      }
    } catch (err) {
      console.error(`[${new Date().toISOString()}] Login error:`, err);
      setError(err.message || "An unexpected error occurred during login");
      return { success: false, error: err.message || "Login failed" };
    } finally {
      setIsLoading(false);
      authInProgress.current = false;
    }
  }, [shogun]);
  
  /**
   * Attempts to register a new user
   * @param {string} username - The username (email)
   * @param {string} password - The password
   * @returns {Object} - The result of the registration attempt
   */
  const register = useCallback(async (username, password) => {
    if (authInProgress.current) {
      console.warn("Auth operation already in progress");
      return { success: false, error: "Authentication already in progress" };
    }
    
    authInProgress.current = true;
    setError(null);
    setIsLoading(true);
    
    try {
      if (!shogun) {
        throw new Error("Shogun SDK not available");
      }
      
      console.log(`[${new Date().toISOString()}] Attempting registration for user: ${username}`);
      
      // Normalize the email to ensure consistent format
      const normalizedUsername = normalizeEmail(username);
      
      // Try to clean up any existing corrupted data
      await cleanupUserData(normalizedUsername);
      
      // Try registration
      const result = await shogun.signUp(normalizedUsername, password);
      
      if (result.success) {
        console.log(`[${new Date().toISOString()}] Registration successful: ${result.userPub}`);
        
        // Initialize user data
        await shogun.user.put({
          email: normalizedUsername,
          createdAt: Date.now(),
          lastLogin: Date.now()
        });
        
        // Fetch user data
        const userData = await shogun.user.get();
        setUser({ ...userData, username: normalizedUsername, userPub: result.userPub });
        setIsAuthenticated(true);
        return { success: true, userPub: result.userPub, userData, isNewUser: true };
      } else {
        console.error(`[${new Date().toISOString()}] Registration failed:`, result.error);
        
        // If user already exists, try login as fallback
        if (result.error && (result.error.includes("already created") || 
                            result.error.includes("already exists"))) {
          console.log(`[${new Date().toISOString()}] User already exists, attempting login`);
          return await login(normalizedUsername, password);
        }
        
        throw new Error(result.error || "Registration failed");
      }
    } catch (err) {
      console.error(`[${new Date().toISOString()}] Registration error:`, err);
      setError(err.message || "An unexpected error occurred during registration");
      return { success: false, error: err.message || "Registration failed" };
    } finally {
      setIsLoading(false);
      authInProgress.current = false;
    }
  }, [shogun, login, cleanupUserData]);
  
  /**
   * Logs out the current user
   */
  const logout = useCallback(async () => {
    if (!shogun) return;
    
    try {
      console.log(`[${new Date().toISOString()}] Logging out user`);
      
      // Force Gun user to leave
      if (shogun.gun) {
        shogun.gun.user().leave();
      }
      
      // Clear user data
      setUser(null);
      setIsAuthenticated(false);
      
      // Clear localStorage and sessionStorage
      Object.keys(localStorage).forEach(key => {
        if (key.includes('gun/') || key.includes('gun-') || 
            key.includes('user') || key.includes('pair') || 
            key.includes('oauth') || key.includes('radata')) {
          localStorage.removeItem(key);
        }
      });
      
      Object.keys(sessionStorage).forEach(key => {
        if (key.includes('gun/') || key.includes('gun-') || 
            key.includes('user') || key.includes('pair') || 
            key.includes('oauth')) {
          sessionStorage.removeItem(key);
        }
      });
      
      console.log(`[${new Date().toISOString()}] Logout completed`);
      
      return { success: true };
    } catch (err) {
      console.error(`[${new Date().toISOString()}] Logout error:`, err);
      return { success: false, error: err.message };
    }
  }, [shogun]);
  
  /**
   * Handles OAuth authentication
   * @param {string} provider - The OAuth provider (e.g., 'google')
   */
  const oauthLogin = useCallback(async (provider) => {
    if (!shogun) {
      setError("Shogun SDK not available");
      return;
    }
    
    try {
      const oauthPlugin = shogun.getPlugin('oauth');
      if (!oauthPlugin) {
        throw new Error("OAuth plugin not available");
      }
      
      console.log(`[${new Date().toISOString()}] Initiating OAuth login with ${provider}`);
      
      // Start the OAuth flow
      await oauthPlugin.startOAuth(provider);
      
      // The flow will continue in the OAuthCallback component
    } catch (err) {
      console.error(`[${new Date().toISOString()}] OAuth login error:`, err);
      setError(err.message || `Failed to start ${provider} authentication`);
    }
  }, [shogun]);
  
  /**
   * Check if the user is already authenticated
   */
  useEffect(() => {
    const checkAuth = async () => {
      if (!shogun) {
        setIsLoading(false);
        return;
      }
      
      try {
        console.log(`[${new Date().toISOString()}] Checking authentication status`);
        
        const isLoggedIn = await shogun.isLoggedIn();
        
        if (isLoggedIn) {
          console.log(`[${new Date().toISOString()}] User is authenticated`);
          
          // Fetch user data
          const userData = await shogun.user.get();
          const userPub = shogun.gun.user().is.pub;
          
          setUser({ ...userData, userPub });
          setIsAuthenticated(true);
        } else {
          console.log(`[${new Date().toISOString()}] User is not authenticated`);
          setUser(null);
          setIsAuthenticated(false);
        }
      } catch (err) {
        console.error(`[${new Date().toISOString()}] Error checking authentication:`, err);
        setUser(null);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };
    
    checkAuth();
  }, [shogun]);
  
  /**
   * Listen for auth events
   */
  useEffect(() => {
    const handleAuthUpdate = (event) => {
      const { success, userPub, username } = event.detail;
      
      if (success && userPub) {
        console.log(`[${new Date().toISOString()}] Auth updated event: ${userPub}`);
        
        // Update auth state
        setIsAuthenticated(true);
        setUser(prev => ({ ...prev, userPub, username }));
      }
    };
    
    window.addEventListener('shogun:auth:updated', handleAuthUpdate);
    
    return () => {
      window.removeEventListener('shogun:auth:updated', handleAuthUpdate);
    };
  }, []);
  
  return {
    user,
    isAuthenticated,
    isLoading,
    error,
    login,
    register,
    logout,
    oauthLogin,
    cleanupUserData
  };
};

export default useShogunAuth; 