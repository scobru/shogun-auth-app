import { useState, useEffect, useCallback } from 'react';
import { ShogunCore } from 'shogun-core';

export const useAuth = (gunInstance) => {
  const [shogun, setShogun] = useState(null);
  const [authStatus, setAuthStatus] = useState({
    isLoggedIn: false,
    method: null,
    userPub: null,
    error: null
  });

  // Initialize Shogun Core
  useEffect(() => {
    if (!gunInstance) return;

    const core = new ShogunCore({
      gunInstance,
      webauthn: {
        enabled: true,
        rpName: "Shogun Auth App",
        timeout: 60000,
      },
      web3: { enabled: false },
      nostr: { enabled: true },
      "zk-oauth": { 
        enabled: true,
        usePKCE: true,
        providers: {
          google: {
            clientId: "15241942495-ftd3cs98qvem6snh6isbabc3adoc9f4p.apps.googleusercontent.com",
            clientSecret: "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", // Add client secret for Google OAuth
            redirectUri: "http://localhost:8080/auth/callback",
            scope: ["openid", "email", "profile"],
            authUrl: "https://accounts.google.com/o/oauth2/v2/auth",
            tokenUrl: "https://oauth2.googleapis.com/token",
            userInfoUrl: "https://www.googleapis.com/oauth2/v2/userinfo",
            responseType: "code",
            grantType: "authorization_code"
          }
        }
      }
    });

    setShogun(core);

    return () => {
      // Proper cleanup for Shogun Core
      try {
        // Try logout if logged in
        if (typeof core.isLoggedIn === 'function' && core.isLoggedIn()) {
          try {
            core.logout();
          } catch (e) {
            console.warn("Error during logout:", e);
          }
        }
        
        // Remove event listeners
        if (typeof core.removeAllListeners === 'function') {
          core.removeAllListeners();
        }
        
        // Cleanup plugins individually
        try {
          const web3Plugin = core.getPlugin && core.getPlugin("web3");
          if (web3Plugin && typeof web3Plugin.cleanup === 'function') {
            web3Plugin.cleanup();
          }
        } catch (e) {
          console.warn("Web3 plugin cleanup error:", e);
        }
        
        try {
          const nostrPlugin = core.getPlugin && core.getPlugin("nostr");
          if (nostrPlugin && typeof nostrPlugin.cleanup === 'function') {
            nostrPlugin.cleanup();
          }
        } catch (e) {
          console.warn("Nostr plugin cleanup error:", e);
        }
        
        try {
          const webauthnPlugin = core.getPlugin && core.getPlugin("webauthn");
          if (webauthnPlugin && typeof webauthnPlugin.destroy === 'function') {
            webauthnPlugin.destroy();
          }
        } catch (e) {
          console.warn("WebAuthn plugin cleanup error:", e);
        }
        
        try {
          const zkOAuthPlugin = core.getPlugin && core.getPlugin("zk-oauth");
          if (zkOAuthPlugin && typeof zkOAuthPlugin.destroy === 'function') {
            zkOAuthPlugin.destroy();
          }
        } catch (e) {
          console.warn("ZK-OAuth plugin cleanup error:", e);
        }
      } catch (error) {
        console.warn("Error during cleanup:", error);
      }
    };
  }, [gunInstance]);

  // Check available auth methods
  const checkAuthMethods = useCallback(async () => {
    if (!shogun) return { webauthn: false, web3: false, nostr: false, zkoauth: false };
    
    try {
      // Check WebAuthn
      const webauthn = await shogun.getPlugin("webauthn");
      
      // Check Web3
      const web3 = await shogun.getPlugin("web3");
      
      // Check Nostr
      const nostr = await shogun.getPlugin("nostr");
      
      // Check ZK-OAuth
      const zkoauth = await shogun.getPlugin("zk-oauth");
      
      return {
        webauthn: !!webauthn,
        web3: !!web3,
        nostr: !!nostr,
        zkoauth: !!zkoauth
      };
    } catch (error) {
      console.error("Error checking auth methods:", error);
      return { webauthn: false, web3: false, nostr: false, zkoauth: false };
    }
  }, [shogun]);

  // Login with different methods
  const login = useCallback(async (username, password, method = "password") => {
    if (!shogun) {
      setAuthStatus(prev => ({ ...prev, error: "Shogun non inizializzato" }));
      return;
    }

    try {
      let user;
      let result;
      
      switch (method) {
        case "password":
          user = await shogun.login(username, password);
          break;
        case "webauthn":
          const webauthn = await shogun.getPlugin("webauthn");
          user = await webauthn.signIn(username);
          break;
        case "web3":
          const web3 = await shogun.getPlugin("web3");
          const address = await web3.connectMetaMask();
          if (!address) throw new Error("Nessun indirizzo ottenuto");
          user = await web3.signIn(address);
          break;
        case "nostr":
          const nostr = await shogun.getPlugin("nostr");
          const pubkey = await nostr.connectBitcoinWallet();
          if (!pubkey) throw new Error("Nessuna chiave pubblica ottenuta");
          user = await nostr.signIn(pubkey);
          break;
        case "zkoauth":
          const zkoauth = await shogun.getPlugin("zk-oauth");
          result = await zkoauth.login(username || "google");
          
          // If we have a redirect URL, return the result without updating auth status
          if (result.redirectUrl) {
            return result;
          }
          
          user = result;
          break;
        default:
          throw new Error("Metodo di autenticazione non supportato");
      }
      
      setAuthStatus({
        isLoggedIn: true,
        username: user.username,
        error: null
      });
      
      return user;
    } catch (error) {
      setAuthStatus(prev => ({
        ...prev,
        isLoggedIn: false,
        error: error.message
      }));
      throw error;
    }
  }, [shogun]);

  // Register with different methods
  const register = useCallback(async (username, password, method = "password") => {
    if (!shogun) {
      setAuthStatus(prev => ({ ...prev, error: "Shogun non inizializzato" }));
      return;
    }

    try {
      let user;
      let result;
      
      switch (method) {
        case "password":
          user = await shogun.signUp(username, password);
          break;
        case "webauthn":
          const webauthn = await shogun.getPlugin("webauthn");
          user = await webauthn.signUp(username);
          break;
        case "web3":
          const web3 = await shogun.getPlugin("web3");
          const address = await web3.connectMetaMask();
          if (!address) throw new Error("Nessun indirizzo ottenuto");
          user = await web3.signUp(address);
          break;
        case "nostr":
          const nostr = await shogun.getPlugin("nostr");
          const pubkey = await nostr.connectBitcoinWallet();
          if (!pubkey) throw new Error("Nessuna chiave pubblica ottenuta");
          user = await nostr.signUp(pubkey);
          break;
        case "zkoauth":
          const zkoauth = await shogun.getPlugin("zk-oauth");
          result = await zkoauth.signUp(username || "google");
          
          // If we have a redirect URL, return the result without updating auth status
          if (result.redirectUrl) {
            return result;
          }
          
          user = result;
          break;
        default:
          throw new Error("Metodo di registrazione non supportato");
      }
      
      setAuthStatus({
        isLoggedIn: true,
        username: user.username,
        error: null
      });
      
      return user;
    } catch (error) {
      setAuthStatus(prev => ({
        ...prev,
        isLoggedIn: false,
        error: error.message
      }));
      throw error;
    }
  }, [shogun]);

  const logout = useCallback(async () => {
    if (!shogun) return;

    try {
      await shogun.logout();
      setAuthStatus({
        isLoggedIn: false,
        method: null,
        userPub: null,
        error: null
      });
    } catch (error) {
      setAuthStatus(prev => ({ ...prev, error: error.message }));
      throw error;
    }
  }, [shogun]);

  return {
    shogun,
    authStatus,
    checkAuthMethods,
    login,
    register,
    logout
  };
}; 