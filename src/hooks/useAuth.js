import { useState, useEffect, useCallback } from 'react';
import { ShogunCore } from 'shogun-core';

export const useAuth = (gunInstance) => {
  const [shogun, setShogun] = useState(null);
  const [authStatus, setAuthStatus] = useState({
    isLoggedIn: false,
    method: null,
    username: null,
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
      web3: { enabled: true }, // Abilitato il supporto per MetaMask
      nostr: { enabled: true },
      "oauth": { 
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
            localStorage.clear
            sessionStorage.clear
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

  // Verifica stato autenticazione quando shogun è inizializzato
  useEffect(() => {
    if (!shogun) return;

    // Verifica se l'utente è già loggato
    const checkAuthStatus = async () => {
      try {
        // Controlla prima il flag in sessionStorage (impostato da OAuthCallback)
        const authFlag = sessionStorage.getItem('shogun_authenticated');
        
        // Verifica se esiste un pair salvato in sessionStorage
        const storedPair = sessionStorage.getItem('shogun_user_pair');
        let userPair = null;
        
        if (storedPair) {
          try {
            userPair = JSON.parse(storedPair);
            console.log("Found stored user pair in sessionStorage");
            
            // Autenticare l'utente con il pair salvato
            if (userPair && userPair.pub && userPair.priv) {
              console.log("Authenticating with stored pair");
              shogun.gun.user().auth(userPair);
            }
          } catch (e) {
            console.error("Error parsing stored user pair:", e);
          }
        }
        
        // Verifica con l'API di Shogun
        const isLoggedIn = shogun.isLoggedIn() || authFlag === 'true' || !!userPair;
        console.log("Auth check - user logged in:", isLoggedIn, 
                    "| Shogun says:", shogun.isLoggedIn(), 
                    "| Auth flag:", authFlag === 'true',
                    "| Has stored pair:", !!userPair);
        
        if (isLoggedIn) {
          // Ottieni informazioni utente
          const userPub = shogun.user?.is?.pub || (userPair ? userPair.pub : null);
          const username = localStorage.getItem('shogun_username') || userPub;
          const authMethod = localStorage.getItem('shogun_auth_method') || 'standard';
          
          // Aggiorna lo stato di autenticazione
          setAuthStatus({
            isLoggedIn: true,
            username: username,
            userPub: userPub,
            method: authMethod,
            error: null
          });
          
          // Salva il pair dell'utente in sessionStorage se non è già presente e se è disponibile
          if (!storedPair && shogun.user && shogun.user._.sea) {
            sessionStorage.setItem('shogun_user_pair', JSON.stringify(shogun.user._.sea));
            console.log("Saved user pair to sessionStorage");
          }
          
          // Dopo un breve ritardo, prova a chiamare user per assicurarsi che il DB locale sia aggiornato
          setTimeout(() => {
            if (shogun.user) {
              console.log("Refreshing user data after authentication");
              shogun.user.get("username").once(() => {});  // Questo forzare il refresh dei dati utente
            }
          }, 500);
        }
      } catch (error) {
        console.error("Errore nella verifica dello stato di autenticazione:", error);
      }
    };
    
    // Esegui la verifica
    checkAuthStatus();

    // Aggiungi listener per eventi di autenticazione
    shogun.on("auth:login", (data) => {
      console.log("Auth login event received:", data);
      setAuthStatus({
        isLoggedIn: true,
        username: data.username,
        userPub: data.userPub,
        method: data.method || 'standard',
        error: null
      });
      // Salva in localStorage per recupero futuro
      localStorage.setItem('shogun_username', data.username);
      localStorage.setItem('shogun_auth_method', data.method || 'standard');
      
      // Salva il pair dell'utente in sessionStorage se disponibile
      if (shogun.user && shogun.user._.sea) {
        sessionStorage.setItem('shogun_user_pair', JSON.stringify(shogun.user._.sea));
        console.log("Saved user pair to sessionStorage after login");
      }
    });

    shogun.on("auth:logout", () => {
      console.log("Auth logout event received");
      setAuthStatus({
        isLoggedIn: false,
        username: null,
        userPub: null,
        method: null,
        error: null
      });
      localStorage.removeItem('shogun_username');
      localStorage.removeItem('shogun_auth_method');
      sessionStorage.removeItem('shogun_authenticated');
      sessionStorage.removeItem('shogun_user_pair'); // Rimuovi il pair quando l'utente fa logout
    });
    
    return () => {
      // Rimuovi listener
      if (shogun) {
        shogun.off("auth:login");
        shogun.off("auth:logout");
      }
    };
  }, [shogun]);

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
      let authMethod = method;
      
      switch (method) {
        case "password":
          user = await shogun.login(username, password);
          authMethod = "password";
          break;
        case "webauthn":
          const webauthn = await shogun.getPlugin("webauthn");
          user = await webauthn.login(username);
          authMethod = "webauthn";
          break;
        case "web3":
          const web3 = await shogun.getPlugin("web3");
          const web3Result = await web3.connectMetaMask();
          if (!web3Result || !web3Result.success) {
            throw new Error(web3Result?.error || "Nessun indirizzo ottenuto");
          }
          const address = web3Result.address;
          if (!address) throw new Error("Nessun indirizzo ottenuto");
          user = await web3.login(address);
          authMethod = "web3";
          break;
        case "nostr":
          const nostr = await shogun.getPlugin("nostr");
          const nostrResult = await nostr.connectBitcoinWallet();
          
          // Check if nostrResult is successful
          if (!nostrResult || !nostrResult.success) {
            throw new Error(nostrResult?.error || "Connessione al wallet Bitcoin fallita");
          }
          
          // Extract the pubkey from the result
          const pubkey = nostrResult.address;
          if (!pubkey) throw new Error("Nessuna chiave pubblica ottenuta");
          
          // Login with the pubkey
          user = await nostr.login(pubkey);
          authMethod = "nostr";
          break;
        case "zkoauth":
          const zkoauth = await shogun.getPlugin("zk-oauth");
          result = await zkoauth.login(username || "google");
          authMethod = "zkoauth";
          
          // If we have a redirect URL, return the result without updating auth status
          if (result.redirectUrl) {
            // Store the auth method for when we return from OAuth
            localStorage.setItem('shogun_auth_method', authMethod);
            return result;
          }
          
          user = result;
          break;
        default:
          throw new Error("Metodo di autenticazione non supportato");
      }
      
      // Store user public key
      const userPub = user?.pub || shogun.user?.is?.pub;
      
      setAuthStatus({
        isLoggedIn: true,
        username: user.username || username,
        userPub: userPub,
        method: authMethod,
        error: null
      });
      
      // Save auth method for later retrieval
      localStorage.setItem('shogun_auth_method', authMethod);
      
      // Save user pair to sessionStorage if available
      if (shogun.user && shogun.user._.sea) {
        sessionStorage.setItem('shogun_user_pair', JSON.stringify(shogun.user._.sea));
        console.log("Saved user pair to sessionStorage after login");
      }
      
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
      let authMethod = method;
      
      switch (method) {
        case "password":
          user = await shogun.signUp(username, password);
          authMethod = "password";
          break;
        case "webauthn":
          const webauthn = await shogun.getPlugin("webauthn");
          user = await webauthn.signUp(username);
          authMethod = "webauthn";
          break;
        case "web3":
          const web3 = await shogun.getPlugin("web3");
          const web3Result = await web3.connectMetaMask();
          if (!web3Result || !web3Result.success) {
            throw new Error(web3Result?.error || "Nessun indirizzo ottenuto");
          }
          const address = web3Result.address;
          if (!address) throw new Error("Nessun indirizzo ottenuto");
          user = await web3.signUp(address);
          authMethod = "web3";
          break;
        case "nostr":
          const nostr = await shogun.getPlugin("nostr");
          const nostrResult = await nostr.connectBitcoinWallet();
          
          // Check if nostrResult is successful
          if (!nostrResult || !nostrResult.success) {
            throw new Error(nostrResult?.error || "Connessione al wallet Bitcoin fallita");
          }
          
          // Extract the pubkey from the result
          const pubkey = nostrResult.address;
          if (!pubkey) throw new Error("Nessuna chiave pubblica ottenuta");
          
          // Sign up with the pubkey
          user = await nostr.signUp(pubkey);
          authMethod = "nostr";
          break;
        case "zkoauth":
          const zkoauth = await shogun.getPlugin("zk-oauth");
          result = await zkoauth.signUp(username || "google");
          authMethod = "zkoauth";
          
          // If we have a redirect URL, return the result without updating auth status
          if (result.redirectUrl) {
            // Store the auth method for when we return from OAuth
            localStorage.setItem('shogun_auth_method', authMethod);
            return result;
          }
          
          user = result;
          break;
        default:
          throw new Error("Metodo di registrazione non supportato");
      }
      
      // Store user public key
      const userPub = user?.pub || shogun.user?.is?.pub;
      
      setAuthStatus({
        isLoggedIn: true,
        username: user.username || username,
        userPub: userPub,
        method: authMethod,
        error: null
      });
      
      // Save auth method for later retrieval
      localStorage.setItem('shogun_auth_method', authMethod);
      
      // Save user pair to sessionStorage if available
      if (shogun.user && shogun.user._.sea) {
        sessionStorage.setItem('shogun_user_pair', JSON.stringify(shogun.user._.sea));
        console.log("Saved user pair to sessionStorage after registration");
      }
      
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
        username: null,
        userPub: null,
        error: null
      });
      
      // Clear stored authentication info
      localStorage.removeItem('shogun_username');
      localStorage.removeItem('shogun_auth_method');
      sessionStorage.removeItem('shogun_authenticated');
      sessionStorage.removeItem('shogun_user_pair'); // Clear the stored pair on logout
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