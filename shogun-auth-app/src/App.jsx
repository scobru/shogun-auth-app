import React, { useState, useEffect, useRef } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Gun from "gun";
import "gun/sea"
import { oauthChain} from "shogun-core";
import { WebAuthnAuth, Web3Auth, NostrAuth, ZKOAuthAuth } from "./components/auth";
import OAuthCallback from "./components/auth/OAuthCallback";
import EncryptedDataManager from "./components/vault/EncryptedDataManager";
import { useAuth } from "./hooks/useAuth";
import { useVault } from "./hooks/useVault";
import { ThemeToggle } from "./components/ui";
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
            <span className="badge badge-primary">{authStatus.username || "N/A"}</span>
          </div>
          <div className="flex items-center">
            <span className="font-semibold mr-2">Public Key:</span>
            <span className="badge badge-secondary font-mono">{authStatus.userPub ? authStatus.userPub.substring(0, 12) + '...' : "Not available"}</span>
          </div>
          <div className="flex items-center">
            <span className="font-semibold mr-2">Auth Method:</span>
            <span className="badge badge-accent">{authStatus.method || "Standard"}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

function AuthApp() {
  // GunDB initialization
  const gunRef = useRef(null);
  // Ref per tracciare se questa è la prima volta che la pagina viene caricata dopo un reindirizzamento
  const isRedirectLoad = useRef(sessionStorage.getItem('shogun_authenticated') === 'true');

  // Effetto per gestire i reindirizzamenti e l'autenticazione
  useEffect(() => {
    if (isRedirectLoad.current) {
      console.log("Detected page load after authentication redirect");
      // Rimuovi il flag perché è già stato letto
      sessionStorage.removeItem('shogun_authenticated');
      isRedirectLoad.current = false;
    }
  }, []);

  // Initialize GunDB and oauthChain
  useEffect(() => {
    gunRef.current = Gun({
      peers: ["http://localhost:8765/gun"],
    });
    
    // Initialize the oauthChain to extend Gun with oauth methods
    try {
      console.log("Initializing oauthChain...");
      // Call the oauthChain function directly - it extends Gun.chain internally
      oauthChain();
      console.log("oauthChain initialized successfully");
    } catch (error) {
      console.error("Failed to initialize oauthChain:", error);
    }
  }, []);

  // Use custom hooks
  const {
    shogun,
    authStatus,
    checkAuthMethods,
    login,
    register,
    logout
  } = useAuth(gunRef.current);

  const {
    vaultStatus,
    storedProofs,
    pendingRequests,
    generateKeypair,
    loadProofs,
    verifyProof,
    approveProofRequest,
    rejectProofRequest
  } = useVault(shogun, gunRef.current);

  // Auth methods state
  const [authMethods, setAuthMethods] = useState({
    webauthn: false,
    web3: false,
    nostr: false,
    oauth: true // Forziamo a true per visualizzare sempre l'opzione Google OAuth
  });
  const [selectedAuthMethod, setSelectedAuthMethod] = useState("password");

  // Form data
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  // Check available auth methods
  useEffect(() => {
    const checkMethods = async () => {
      const methods = await checkAuthMethods();
      // Forziamo oauth e web3 (MetaMask) a true per visualizzarli sempre
      setAuthMethods({...methods, oauth: true, web3: true});
      console.log("Auth methods:", {...methods, oauth: true, web3: true});
    };
    checkMethods();
  }, [checkAuthMethods]);

  // Load proofs when logged in
  useEffect(() => {
    if (authStatus.isLoggedIn) {
      loadProofs();
      
      // Generate keypair if not already created
      if (!vaultStatus.keypair) {
        generateKeypair();
      }
    }
  }, [authStatus.isLoggedIn, loadProofs, vaultStatus.keypair, generateKeypair]);

  // Handle password auth
  const handlePasswordLogin = async () => {
    if (!username || !password) return;
    try {
      await login(username, password);
    } catch (error) {
      console.error("Errore login:", error);
    }
  };

  const handlePasswordSignUp = async () => {
    if (!username || !password) return;
    try {
      await register(username, password);
    } catch (error) {
      console.error("Errore registrazione:", error);
    }
  };

  // Handle WebAuthn auth
  const handleWebAuthnLogin = async (username) => {
    try {
      await login(username, null, "webauthn");
    } catch (error) {
      console.error("Errore login WebAuthn:", error);
      throw error;
    }
  };

  const handleWebAuthnRegister = async (username) => {
    try {
      await register(username, null, "webauthn");
    } catch (error) {
      console.error("Errore registrazione WebAuthn:", error);
      throw error;
    }
  };

  // Handle Web3 auth
  const handleWeb3Login = async () => {
    try {
      await login(null, null, "web3");
    } catch (error) {
      console.error("Errore login Web3:", error);
      throw error;
    }
  };

  const handleWeb3Register = async () => {
    try {
      await register(null, null, "web3");
    } catch (error) {
      console.error("Errore registrazione Web3:", error);
      throw error;
    }
  };

  // Handle Nostr auth
  const handleNostrLogin = async () => {
    try {
      await login(null, null, "nostr");
    } catch (error) {
      console.error("Errore login Nostr:", error);
      throw error;
    }
  };

  const handleNostrRegister = async () => {
    try {
      await register(null, null, "nostr");
    } catch (error) {
      console.error("Errore registrazione Nostr:", error);
      throw error;
    }
  };

  // Handle OAuth auth
  const handleOAuthLogin = async (provider) => {
    try {
      console.log("Tentativo di login OAuth con provider:", provider);
      
      // Store the provider for the callback
      localStorage.setItem('oauth_provider', provider);
      
      // Get the auth result with redirect URL
      const result = await login(provider, null, "oauth");
      
      // Check if we need to redirect
      if (result && result.redirectUrl) {
        console.log("Redirect to:", result.redirectUrl);
        window.location.href = result.redirectUrl;
        return;
      }
    } catch (error) {
      console.error("Errore login OAuth:", error);
      throw error;
    }
  };

  const handleOAuthRegister = async (provider) => {
    try {
      console.log("Tentativo di registrazione OAuth con provider:", provider);
      
      // Store the provider for the callback
      localStorage.setItem('oauth_provider', provider);
      
      // Get the auth result with redirect URL
      const result = await register(provider, null, "oauth");
      
      // Check if we need to redirect
      if (result && result.redirectUrl) {
        console.log("Redirect to:", result.redirectUrl);
        window.location.href = result.redirectUrl;
        return;
      }
    } catch (error) {
      console.error("Errore registrazione OAuth:", error);
      throw error;
    }
  };

  // UI Components
  const PendingProofRequests = () => {
    if (pendingRequests.size === 0) return null;

    return (
      <div className="proof-requests">
        <h3>Richieste Proof Pendenti</h3>
        {Array.from(pendingRequests.entries()).map(([id, request]) => (
          <div key={id} className="proof-request-card">
            <div className="request-info">
              <h4>{request.requestingApp?.name || "App Sconosciuta"}</h4>
              <p>{request.requestingApp?.description}</p>
              <p>
                <strong>Tipo:</strong> {request.type}
              </p>
              <p>
                <strong>Privacy:</strong> {request.privacy}
              </p>
              <p>
                <strong>Origine:</strong> {request.origin}
              </p>
            </div>
            <div className="request-actions">
              <button
                onClick={() => approveProofRequest(id)}
                disabled={!vaultStatus.keypair}
                title={
                  !vaultStatus.keypair ? "Vault non inizializzato" : ""
                }
              >
                Approva
              </button>
              <button onClick={() => rejectProofRequest(id)}>Rifiuta</button>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const StoredProofsList = () => {
    if (storedProofs.length === 0) return null;

    return (
      <div className="stored-proofs">
        <h3>
          Proof Archiviate ({storedProofs.length})
        </h3>
        <div className="proofs-list">
          {storedProofs.map(proof => (
            <div key={proof.id} className="proof-item">
              <div className="proof-header">
                <span className="proof-id">ID: {proof.id.substring(0, 8)}...</span>
                <span className="proof-timestamp">
                  {new Date(proof.timestamp).toLocaleString()}
                </span>
              </div>
              <div className="proof-details">
                <p><strong>App:</strong> {proof.requestingApp?.name || "Non specificata"}</p>
                <p><strong>Tipo:</strong> {proof.type}</p>
                <p><strong>Privacy:</strong> {proof.privacy}</p>
                <p className="proof-data">
                  <strong>Firma:</strong> {typeof proof.data === 'string' ? 
                    `${proof.data.substring(0, 20)}...` : 'Firma complessa'}
                </p>
              </div>
              <button onClick={() => verifyProof(proof.id)}>Verifica</button>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const MainApp = () => (
    <div className="container mx-auto px-4 py-8 min-h-screen">
      <header className="navbar bg-base-100 shadow-lg rounded-box mb-8">
        <div className="navbar-start">
          <h1 className="text-2xl font-bold ml-4">🥷 Shogun Auth</h1>
        </div>
        <div className="navbar-center">
          <p className="text-sm opacity-75">Secure, decentralized authentication</p>
        </div>
        <div className="navbar-end">
          <ThemeToggle />
        </div>
      </header>

      <div className="flex justify-center gap-4 mb-6">
        <div className={`badge ${authStatus.isLoggedIn ? "badge-success" : "badge-error"} p-4 text-base font-medium`}>
          {authStatus.isLoggedIn ? "Autenticato" : "Non autenticato"}
        </div>
        <div className={`badge ${vaultStatus.isInitialized ? "badge-success" : "badge-error"} p-4 text-base font-medium`}>
          {vaultStatus.isInitialized ? "Vault inizializzato" : "Vault non inizializzato"}
        </div>
      </div>
      
      {/* Display user info after login */}
      {authStatus.isLoggedIn && <UserInfo authStatus={authStatus} />}

      <div className="card bg-base-100 shadow-xl mb-6">
        <div className="card-body">
          <h2 className="card-title text-2xl">Autenticazione</h2>
        
        {/* Logout button when logged in */}
        {authStatus.isLoggedIn ? (
          <div className="flex justify-center my-4">
            <button 
              onClick={logout}
              className="btn btn-error gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Logout
            </button>
          </div>
        ) : (
          /* Show authentication methods and form only when not logged in */
          <>
            <div className="card-body">
              <h3 className="text-lg font-medium mb-4">Metodo di Autenticazione</h3>
              <div className="join join-vertical lg:join-horizontal w-full">
                <input 
                  className="join-item btn" 
                  type="radio"
                  name="auth-method"
                  aria-label="Password"
                  value="password"
                  checked={selectedAuthMethod === "password"}
                  onChange={(e) => setSelectedAuthMethod(e.target.value)}
                />
                
                {authMethods.webauthn && (
                  <input 
                    className="join-item btn" 
                    type="radio"
                    name="auth-method"
                    aria-label="WebAuthn"
                    value="webauthn"
                    checked={selectedAuthMethod === "webauthn"}
                    onChange={(e) => setSelectedAuthMethod(e.target.value)}
                  />
                )}
                
                {authMethods.web3 && (
                  <input 
                    className="join-item btn" 
                    type="radio"
                    name="auth-method"
                    aria-label="Web3"
                    value="web3"
                    checked={selectedAuthMethod === "web3"}
                    onChange={(e) => setSelectedAuthMethod(e.target.value)}
                  />
                )}
                
                {authMethods.nostr && (
                  <input 
                    className="join-item btn" 
                    type="radio"
                    name="auth-method"
                    aria-label="Bitcoin/Nostr"
                    value="nostr"
                    checked={selectedAuthMethod === "nostr"}
                    onChange={(e) => setSelectedAuthMethod(e.target.value)}
                  />
                )}
                
                <input 
                  className="join-item btn" 
                  type="radio"
                  name="auth-method"
                  aria-label="Google OAuth"
                  value="oauth"
                  checked={selectedAuthMethod === "oauth"}
                  onChange={(e) => setSelectedAuthMethod(e.target.value)}
                />
              </div>
            </div>

            {selectedAuthMethod === "password" && (
              <div className="form-control gap-3 mt-4">
                <label className="input input-bordered flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4 opacity-70"><path d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM12.735 14c.618 0 1.093-.561.872-1.139a6.002 6.002 0 0 0-11.215 0c-.22.578.254 1.139.872 1.139h9.47Z" /></svg>
                  <input
                    type="text"
                    className="grow"
                    placeholder="Username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                  />
                </label>
                <label className="input input-bordered flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4 opacity-70"><path fillRule="evenodd" d="M14 6a4 4 0 0 1-4.899 3.899l-1.955 1.955a.5.5 0 0 1-.353.146H5v1.5a.5.5 0 0 1-.5.5h-2a.5.5 0 0 1-.5-.5v-2.293a.5.5 0 0 1 .146-.353l3.955-3.955A4 4 0 1 1 14 6Zm-4-2a.75.75 0 0 0 0 1.5.5.5 0 0 1 .5.5.75.75 0 0 0 1.5 0 2 2 0 0 0-2-2Z" clipRule="evenodd" /></svg>
                  <input
                    type="password"
                    className="grow"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </label>
                <div className="flex justify-center gap-4 mt-2">
                  <button onClick={handlePasswordLogin} className="btn btn-primary">Login</button>
                  <button onClick={handlePasswordSignUp} className="btn btn-secondary">Registrati</button>
                </div>
              </div>
            )}

            {selectedAuthMethod === "webauthn" && (
              <WebAuthnAuth
                username={username}
                onLogin={handleWebAuthnLogin}
                onRegister={handleWebAuthnRegister}
              />
            )}

            {selectedAuthMethod === "web3" && (
              <Web3Auth
                onLogin={handleWeb3Login}
                onRegister={handleWeb3Register}
              />
            )}

            {selectedAuthMethod === "nostr" && (
              <NostrAuth
                onLogin={handleNostrLogin}
                onRegister={handleNostrRegister}
              />
            )}
            
            {selectedAuthMethod === "oauth" && (
              <ZKOAuthAuth
                onLogin={handleOAuthLogin}
                onRegister={handleOAuthRegister}
              />
            )}
          </>
        )}
        </div>
      </div>
      
      {/* Add Encrypted Data Manager when user is logged in */}
      {authStatus.isLoggedIn && (
        <EncryptedDataManager 
          shogun={shogun}
          authStatus={authStatus}
        />
      )}

      <PendingProofRequests />
      
      <StoredProofsList />

      {authStatus.error && (
        <div className="alert alert-error shadow-lg">
          <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          <span>{authStatus.error}</span>
        </div>
      )}

      {vaultStatus.error && (
        <div className="alert alert-error shadow-lg">
          <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          <span>{vaultStatus.error}</span>
        </div>
      )}
    </div>
  );

  return (
    <Routes>
      <Route path="/auth/callback" element={
        shogun ? 
          <OAuthCallback shogun={shogun} /> : 
          <div className="loading">
            <h2>Initializing authentication...</h2>
            <div className="loading-spinner"></div>
          </div>
      } />
      <Route path="/" element={<MainApp />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <Router>
      <AuthApp />
    </Router>
  );
}

export default App; 