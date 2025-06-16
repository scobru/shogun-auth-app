import { useState, useEffect, useCallback } from 'react';

export const useShogunAuth = (options) => {
  const { shogun } = options || {};

  const [authStatus, setAuthStatus] = useState({
    isLoggedIn: false,
    userPub: null,
    username: null,
    method: null,
    error: null,
  });

  // Effect to check for an existing session on initialization
  useEffect(() => {
    if (shogun && shogun.isLoggedIn()) {
      const user = shogun.gun.user();
      if (user && user.is) {
        setAuthStatus({
          isLoggedIn: true,
          userPub: user.is.pub,
          username: user.is.alias,
          method: 'session',
          error: null,
        });
      } else {
        setAuthStatus(prev => ({ ...prev, isLoggedIn: true, method: 'session' }));
      }
    }
  }, [shogun]);

  // Ascolta l'evento personalizzato emesso dal componente OAuthCallback
  useEffect(() => {
    const handleAuthUpdate = (event) => {
      console.log("Auth update event received:", event.detail);
      if (event.detail && event.detail.success) {
        setAuthStatus({
          isLoggedIn: true,
          userPub: event.detail.userPub,
          username: event.detail.username,
          method: event.detail.authMethod,
          error: null,
        });
      }
    };

    window.addEventListener('shogun:auth:updated', handleAuthUpdate);
    
    return () => {
      window.removeEventListener('shogun:auth:updated', handleAuthUpdate);
    };
  }, []);

  // Controlla anche lo stato di navigazione per aggiornamenti di autenticazione
  useEffect(() => {
    const checkAuthStatus = () => {
      if (shogun && shogun.isLoggedIn()) {
        const user = shogun.gun.user();
        if (user && user.is && !authStatus.isLoggedIn) {
          console.log("User is logged in but state doesn't reflect it, updating state");
          setAuthStatus({
            isLoggedIn: true,
            userPub: user.is.pub,
            username: user.is.alias,
            method: shogun.getAuthMethod() || 'session',
            error: null,
          });
        }
      }
    };

    // Controlla lo stato di autenticazione quando la finestra ottiene il focus
    window.addEventListener('focus', checkAuthStatus);
    
    return () => {
      window.removeEventListener('focus', checkAuthStatus);
    };
  }, [shogun, authStatus.isLoggedIn]);

  const handleLoginSuccess = useCallback((data) => {
    setAuthStatus({
      isLoggedIn: true,
      userPub: data.userPub,
      username: data.username,
      method: data.authMethod,
      error: null,
    });
  }, []);

  const handleError = useCallback((error) => {
    const errorMessage = typeof error === 'string' ? error : error?.message || "An unknown authentication error occurred.";
    setAuthStatus((prev) => ({
      ...prev,
      isLoggedIn: false,
      error: errorMessage,
    }));
  }, []);

  const handleLogout = useCallback(() => {
    if (shogun) {
      shogun.logout();
    }
    setAuthStatus({
      isLoggedIn: false,
      userPub: null,
      username: null,
      method: null,
      error: null,
    });
  }, [shogun]);

  return { authStatus, handleLoginSuccess, handleError, handleLogout };
}; 