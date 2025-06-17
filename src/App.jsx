import React, { useState, useEffect, useRef } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
  useNavigate,
  useSearchParams
} from "react-router-dom";
import {
  ShogunButtonProvider,
  ShogunButton,
  useShogun,
} from "shogun-button-react";

import { useShogunAuth } from "./hooks/useShogunAuth.js";
import { ShogunCore } from "shogun-core";
import OAuthCallback from "./components/OAuthCallback";
import EncryptedDataManager from "./components/vault/EncryptedDataManager";
import { ThemeToggle } from "./components/ui";
import { truncate } from "./utils/string.js";

import "./index.css"; // Import Tailwind CSS

// User Info component to display user details after login
const UserInfo = ({ authStatus }) => {
  if (!authStatus.isLoggedIn) return null;

  return (
    <div className="card bg-base-100 shadow-xl mb-6">
      <div className="card-body">
        <h3 className="card-title">User Information</h3>
        <div className="grid grid-cols-1 gap-2">
          <div className="flex items-center">
            <span className="font-semibold mr-2">Username:</span>
            <span className="badge badge-primary">
              {authStatus.username || "N/A"}
            </span>
          </div>
          <div className="flex items-center">
            <span className="font-semibold mr-2">Public Key:</span>
            <span className="badge badge-secondary font-mono">
              {truncate(authStatus.userPub, 40)}
            </span>
          </div>
          <div className="flex items-center">
            <span className="font-semibold mr-2">Auth Method:</span>
            <span className="badge badge-accent">
              {authStatus.method || "Standard"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

// Main component that manages the app after login
const MainApp = ({ authStatus, logout, shogun, gunInstance, location }) => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const redirectUrl = searchParams.get('redirect');
  
  // Reference to track if a success message has been shown
  const authSuccessShown = useRef(false);
  const redirectAttempted = useRef(false);

  // Load proofs when logged in
  useEffect(() => {
    if (authStatus.isLoggedIn) {
      // Show a success message if OAuth login was just completed
      if (location?.state?.authSuccess && !authSuccessShown.current) {
        authSuccessShown.current = true;
        console.log("OAuth login completed successfully!");
        // Here you could show a toast or success alert
      }
      
      // Handle redirect if URL parameter is present
      if (redirectUrl && !redirectAttempted.current) {
        redirectAttempted.current = true;
        
        // Ensure the redirect URL is valid (basic check)
        if (redirectUrl.startsWith('http://') || redirectUrl.startsWith('https://')) {
          console.log(`🔄 Authentication successful, preparing secure redirect to: ${redirectUrl}`);
          
          // Ottieni le credenziali per trasferirle in modo sicuro
          try {
            // Prova prima a ottenere le credenziali correnti dall'istanza Gun
            const user = shogun.gun.user();
            const userPair = user?._.sea;
            const userInfo = user?.is;
            
            let pairData, sessionData;
            
            // Se abbiamo le credenziali correnti, usale
            if (userPair && userInfo) {
              console.log('📝 Usando credenziali correnti dall\'istanza Gun');
              pairData = userPair;
              sessionData = {
                pub: userInfo.pub,
                alias: userInfo.alias || "",
                timestamp: Date.now(),
              };
            } else {
              // Altrimenti prova a prenderle da sessionStorage locale
              console.log('📝 Tentativo di recupero credenziali da sessionStorage locale');
              const pairJson = sessionStorage.getItem('gun/pair');
              const sessionJson = sessionStorage.getItem('gun/session');
              
              if (pairJson && sessionJson) {
                pairData = JSON.parse(pairJson);
                sessionData = JSON.parse(sessionJson);
              }
            }
            
            if (pairData && sessionData) {
              console.log('🔐 Aprendo finestra per trasferimento sicuro delle credenziali');
              
              // Apri la finestra di destinazione
              const targetWindow = window.open(redirectUrl, '_blank');
              
              if (targetWindow) {
                let messagesSent = 0;
                let confirmed = false;
                const maxRetries = 10;
                
                // Funzione per inviare credenziali con retry
                const sendCredentials = () => {
                  if (confirmed || messagesSent >= maxRetries) {
                    if (!confirmed) {
                      console.warn('⚠️ Numero massimo di tentativi raggiunto senza conferma');
                    }
                    return;
                  }
                  
                  try {
                    const credentials = {
                      type: 'shogun:auth:credentials',
                      data: {
                        pair: pairData,
                        session: sessionData,
                        timestamp: Date.now(),
                        attempt: messagesSent + 1
                      }
                    };
                    
                    console.log(`📤 Invio credenziali via PostMessage (tentativo ${messagesSent + 1})`);
                    targetWindow.postMessage(credentials, new URL(redirectUrl).origin);
                    messagesSent++;
                    
                    // Riprova dopo 2 secondi se non confermato
                    if (!confirmed) {
                      setTimeout(sendCredentials, 2000);
                    }
                  } catch (error) {
                    console.error('❌ Errore nell\'invio PostMessage:', error);
                  }
                };
                
                // Listener per conferma ricezione
                const handleMessage = (event) => {
                  // Verifica origine per sicurezza
                  if (event.origin !== new URL(redirectUrl).origin) {
                    console.warn(`⚠️ Messaggio da origine non autorizzata: ${event.origin}`);
                    return;
                  }
                  
                  if (event.data.type === 'shogun:auth:received') {
                    console.log('✅ Credenziali ricevute con successo dalla finestra di destinazione');
                    confirmed = true;
                    window.removeEventListener('message', handleMessage);
                    
                    // Chiudi questa finestra se è stata aperta come popup
                    if (window.opener) {
                      setTimeout(() => {
                        window.close();
                      }, 1000);
                    }
                  } else if (event.data.type === 'shogun:auth:ready') {
                    // La finestra target è pronta a ricevere credenziali
                    console.log('🎯 Finestra target pronta, invio credenziali immediato');
                    sendCredentials();
                  }
                };
                
                window.addEventListener('message', handleMessage);
                
                // Inizia a inviare credenziali dopo un breve ritardo
                setTimeout(sendCredentials, 1000);
                
                // Cleanup dopo timeout
                setTimeout(() => {
                  if (!confirmed) {
                    window.removeEventListener('message', handleMessage);
                    console.log('⏰ Timeout per la conferma ricezione credenziali');
                    
                    // Mostra un messaggio all'utente
                    alert('Il trasferimento delle credenziali potrebbe non essere riuscito. Prova ad accedere manualmente nell\'altra applicazione.');
                  }
                }, 20000); // Aumento il timeout a 20 secondi
                
              } else {
                console.error('❌ Impossibile aprire la finestra di destinazione (popup bloccato?)');
                
                // Fallback: salva le credenziali in sessionStorage e reindirizza nella stessa finestra
                try {
                  const tempCredentials = {
                    pair: pairData,
                    session: sessionData,
                    timestamp: Date.now()
                  };
                  
                  // Usa un identificatore unico temporaneo
                  const tempId = 'temp_' + Date.now();
                  sessionStorage.setItem(`shogun_temp_auth_${tempId}`, JSON.stringify(tempCredentials));
                  
                  // Aggiungi l'ID all'URL come fallback
                  const separator = redirectUrl.includes('?') ? '&' : '?';
                  const fallbackUrl = `${redirectUrl}${separator}temp_auth=${tempId}`;
                  
                  console.log('🔄 Fallback: redirect nella stessa finestra con identificatore temporaneo');
                  window.location.href = fallbackUrl;
                } catch (error) {
                  console.error('❌ Errore nel fallback:', error);
                  window.location.href = redirectUrl;
                }
              }
            } else {
              console.warn('⚠️ Credenziali non trovate - redirect normale');
              window.location.href = redirectUrl;
            }
          } catch (error) {
            console.error('❌ Errore nella preparazione del trasferimento sicuro:', error);
            // Fallback: redirect normale
            window.location.href = redirectUrl;
          }
        } else {
          console.warn(`❌ URL di redirect non valido: ${redirectUrl}`);
        }
      }
    }
  }, [authStatus.isLoggedIn, location, redirectUrl, navigate]);

  return (
    <div className="container mx-auto px-4 py-8 min-h-screen">
      <header className="navbar bg-base-200 rounded-box mb-8">
        <div className="navbar-start">
          <h1 className="text-2xl font-bold ml-4">🥷 Shogun Auth</h1>
        </div>
        <div className="navbar-center">
          <p className="text-sm opacity-75">
            Secure, decentralized authentication
          </p>
        </div>
        <div className="navbar-end">
          <ThemeToggle />
        </div>
      </header>

      <div className="flex justify-center mb-6">
        <div
          className={`badge ${authStatus.isLoggedIn ? "badge-success" : "badge-error"} p-4 text-base font-medium`}
        >
          {authStatus.isLoggedIn ? "Authenticated" : "Not authenticated"}
        </div>
      </div>

      {/* Display redirect notice if applicable */}
      {authStatus.isLoggedIn && redirectUrl && (
        <div className="alert alert-info mb-6">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current shrink-0 w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          <span>Authentication successful! Redirecting you back to the application...</span>
        </div>
      )}

      {/* Display user info after login */}
      {authStatus.isLoggedIn && <UserInfo authStatus={authStatus} />}

      <div className="card bg-base-200  mb-6">
        <div className="card-body">
          <h2 className="card-title text-2xl">Authentication</h2>

          {/* Logout button when logged in (but hide it if we're about to redirect) */}
          {authStatus.isLoggedIn && !redirectUrl ? (
            <div className="flex justify-center my-4">
              <button onClick={logout} className="btn btn-error gap-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                  />
                </svg>
                Logout
              </button>
            </div>
          ) : !authStatus.isLoggedIn ? (
            <div className="flex justify-center my-4">
              <ShogunButton />
            </div>
          ) : (
            <div className="flex justify-center my-4">
              <div className="text-center">
                <div className="loading loading-spinner loading-lg"></div>
                <p className="mt-2 text-sm opacity-75">Preparing redirect...</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add Encrypted Data Manager when user is logged in (but not if redirecting) */}
      {authStatus.isLoggedIn && !redirectUrl && (
        <EncryptedDataManager shogun={shogun} authStatus={authStatus} />
      )}

      {authStatus.error && (
        <div className="alert alert-error shadow-lg">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="stroke-current shrink-0 h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span>{authStatus.error}</span>
        </div>
      )}
    </div>
  );
};

// Wrapper for the MainApp that provides access to useLocation
const MainAppWithLocation = (props) => {
  const location = useLocation();
  return <MainApp {...props} location={location} />;
};

function ShogunApp({ shogun }) {
  const appOptions = {
    appName: "Shogun Auth App",
    shogun,
    authMethods: [
      { type: "oauth", provider: "google" },
      { type: "password" },
      { type: "webauthn" },
      { type: "web3" },
      { type: "nostr" },
    ],
    theme: "dark",
  };

  const { authStatus, handleLoginSuccess, handleError, handleLogout } =
    useShogunAuth(appOptions);

  const providerOptions = {
    appName: appOptions.appName,
    theme: appOptions.theme,
    showOauth: true,
    showWebauthn: true,
    showMetamask: true,
    showNostr: true,
  };

  // Debug provider options
  console.log("ShogunButtonProvider options:", providerOptions);
  console.log("Shogun SDK plugins:", {
    web3: shogun?.hasPlugin("web3"),
    webauthn: shogun?.hasPlugin("webauthn"),
    oauth: shogun?.hasPlugin("oauth"),
    nostr: shogun?.hasPlugin("nostr"),
  });

  return (
    <Router>
      <ShogunButtonProvider
        sdk={shogun}
        options={providerOptions}
        onLoginSuccess={handleLoginSuccess}
        onSignupSuccess={handleLoginSuccess}
        onError={handleError}
      >
        <Routes>
          <Route
            path="/auth/callback"
            element={<OAuthCallback shogun={shogun} />}
          />
          <Route
            path="/"
            element={
              <MainAppWithLocation
                authStatus={authStatus}
                logout={handleLogout}
                shogun={shogun}
                gunInstance={shogun?.gundb?.gun}
              />
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </ShogunButtonProvider>
    </Router>
  );
}

function App() {
  const [sdk, setSdk] = useState(null);

  const gunIstance = new Gun({
    peers: ["http://localhost:8765/gun"],
    localStorage: false,
    radisk: false,
    headers: {
      token: "shogun2025",
    },
  });

  useEffect(() => {
    const shogunCore = new ShogunCore({
      gunInstance: gunIstance,
      peers: ["http://localhost:8765/gun"],
      web3: { enabled: true },
      webauthn: {
        enabled: true,
        rpName: "Shogun Auth App",
      },
      nostr: { enabled: true },
      oauth: {
        enabled: true,
        usePKCE: true,
        providers: {
          google: {
            clientId:
              "15241942495-ftd3cs98qvem6snh6isbabc3adoc9f4p.apps.googleusercontent.com",
            clientSecret: "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",
            redirectUri: "http://localhost:8080/auth/callback",
            scope: ["openid", "email", "profile"],
            authUrl: "https://accounts.google.com/o/oauth2/v2/auth",
            tokenUrl: "https://oauth2.googleapis.com/token",
            userInfoUrl: "https://www.googleapis.com/oauth2/v2/userinfo",
          },
        },
      },
    });
    setSdk(shogunCore);
  }, []);

  if (!sdk) {
    return (
      <div className="flex items-center justify-center h-screen">
        <span className="loading loading-lg"></span>
      </div>
    );
  }

  return <ShogunApp shogun={sdk} />;
}

export default App;
