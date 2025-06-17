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

        console.log('🔐 Processing OAuth callback...');
        const result = await oauthPlugin.handleOAuthCallback(provider, code, state);
        
        if (result && result.success) {
          console.log("✅ OAuth login successful, result:", result);
          
          // Force an authentication state update
          if (shogun.isLoggedIn()) {
            console.log("👤 User is logged in after OAuth callback, saving credentials");
            
            // Salva le credenziali in modo più robusto
            try {
              // Prova a ottenere le credenziali correnti dall'istanza Gun
              const user = shogun.gun.user();
              const userPair = user?._.sea;
              const userInfo = user?.is;
              
              let pairJson, sessionJson;
              
              // Se abbiamo le credenziali correnti, usale
              if (userPair && userInfo) {
                console.log('📝 Usando credenziali correnti dall\'istanza Gun');
                pairJson = JSON.stringify(userPair);
                sessionJson = JSON.stringify({
                  pub: userInfo.pub,
                  alias: userInfo.alias || "",
                  timestamp: Date.now(),
                });
              } else {
                // Altrimenti prova a prenderle da sessionStorage
                console.log('📝 Tentativo di recupero credenziali da sessionStorage');
                pairJson = sessionStorage.getItem('gun/pair');
                sessionJson = sessionStorage.getItem('gun/session');
              }
              
              if (pairJson && sessionJson) {
                console.log('💾 Salvando le credenziali per il trasferimento tra app');
                
                // Salva in localStorage per renderle disponibili all'app di destinazione
                localStorage.setItem('gun/pair', pairJson);
                localStorage.setItem('gun/session', sessionJson);
                
                // Assicurati che siano anche in sessionStorage
                sessionStorage.setItem('gun/pair', pairJson);
                sessionStorage.setItem('gun/session', sessionJson);
                
                console.log('✅ Credenziali salvate con successo in entrambi gli storage');
              } else {
                console.warn('⚠️ Credenziali non trovate dopo OAuth - potrebbero essere già perse');
              }
            } catch (storageError) {
              console.error('❌ Errore nel salvare le credenziali:', storageError);
            }
            
            // Emit a custom event to notify the main app
            const authUpdateEvent = new CustomEvent('shogun:auth:updated', { 
              detail: { 
                success: true,
                userPub: result.userPub || shogun.gun.user().is?.pub,
                username: result.username || shogun.gun.user().is?.alias,
                authMethod: 'oauth'
              } 
            });
            window.dispatchEvent(authUpdateEvent);
            
            // Brief pause to allow event propagation and storage save
            console.log('⏳ Finalizzazione del processo di autenticazione...');
            setTimeout(() => {
              navigate('/', { state: { authSuccess: true } });
            }, 1000); // Aumento il timeout per essere sicuri
          } else {
            console.warn("⚠️ OAuth callback successful but user is not logged in according to shogun.isLoggedIn()");
            navigate('/');
          }
        } else {
          setError(result.error || "OAuth login failed during callback.");
        }
      } catch (e) {
        console.error("❌ OAuth callback error:", e);
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