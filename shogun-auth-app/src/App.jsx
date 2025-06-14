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
import "./styles/auth.css";
import "./styles/vault.css";
import "./index.css"; // Import Tailwind CSS


// User Info component to display user details after login
const UserInfo = ({ authStatus }) => {
  if (!authStatus.isLoggedIn) return null;
  
  return (
    <div className="user-info-panel">
      <h3>👤 User Information</h3>
      <div className="user-info-content">
        <p><strong>Username:</strong> {authStatus.username || "N/A"}</p>
        <p><strong>Public Key:</strong> <span className="pubkey">{authStatus.userPub ? authStatus.userPub.substring(0, 12) + '...' : "Not available"}</span></p>
        <p><strong>Auth Method:</strong> {authStatus.method || "Standard"}</p>
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
        <h3>🔐 Richieste Proof Pendenti</h3>
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
                ✅ Approva
              </button>
              <button onClick={() => rejectProofRequest(id)}>❌ Rifiuta</button>
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
          <span className="section-icon">📋</span>
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
              <button onClick={() => verifyProof(proof.id)}>🔍 Verifica</button>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const MainApp = () => (
    <div className="app">
      {/* Decorative elements */}
      <div className="decorative-shape shape-1"></div>
      <div className="decorative-shape shape-2"></div>
      <div className="decorative-shape shape-3"></div>
      <div className="decorative-shape shape-4"></div>
      <div className="decorative-shape shape-5"></div>
      
      <header className="header flex justify-between items-center">
        <div>
          <h1 className="title">🥷 Shogun Auth</h1>
          <p className="subtitle">Secure, decentralized authentication and data storage with GunDB</p>
        </div>
        <ThemeToggle />
      </header>

      <div className="auth-status-container">
        <div className={`status-indicator ${authStatus.isLoggedIn ? "authenticated" : "not-authenticated"}`}>
          {authStatus.isLoggedIn ? "✅ Autenticato" : "❌ Non autenticato"}
        </div>
        <div className={`status-indicator ${vaultStatus.isInitialized ? "authenticated" : "not-authenticated"}`}>
          {vaultStatus.isInitialized ? "🔓 Vault inizializzato" : "🔒 Vault non inizializzato"}
        </div>
      </div>
      
      {/* Display user info after login */}
      {authStatus.isLoggedIn && <UserInfo authStatus={authStatus} />}

      <div className="auth-section">
        <h2>🔐 Autenticazione</h2>
        
        <div className="auth-methods">
          <h3>Metodo di Autenticazione</h3>
          <div className="method-selector">
            <label>
              <input
                type="radio"
                value="password"
                checked={selectedAuthMethod === "password"}
                onChange={(e) => setSelectedAuthMethod(e.target.value)}
              />
              Password
            </label>
            
            {authMethods.webauthn && (
              <label>
                <input
                  type="radio"
                  value="webauthn"
                  checked={selectedAuthMethod === "webauthn"}
                  onChange={(e) => setSelectedAuthMethod(e.target.value)}
                />
                WebAuthn (Biometrico)
              </label>
            )}
            
            {authMethods.web3 && (
              <label>
                <input
                  type="radio"
                  value="web3"
                  checked={selectedAuthMethod === "web3"}
                  onChange={(e) => setSelectedAuthMethod(e.target.value)}
                />
                MetaMask
              </label>
            )}
            
            {authMethods.nostr && (
              <label>
                <input
                  type="radio"
                  value="nostr"
                  checked={selectedAuthMethod === "nostr"}
                  onChange={(e) => setSelectedAuthMethod(e.target.value)}
                />
                Bitcoin/Nostr
              </label>
            )}
            
            {/* Sempre visibile, indipendentemente dalla disponibilità del plugin */}
            <label>
              <input
                type="radio"
                value="oauth"
                checked={selectedAuthMethod === "oauth"}
                onChange={(e) => setSelectedAuthMethod(e.target.value)}
              />
              Google OAuth
            </label>
          </div>
        </div>

        {selectedAuthMethod === "password" && (
          <div className="form-group">
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <div className="button-group">
              <button onClick={handlePasswordLogin}>Login</button>
              <button onClick={handlePasswordSignUp}>Registrati</button>
              <button onClick={logout}>Logout</button>
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
        <div className="error-message">
          ❌ {authStatus.error}
        </div>
      )}

      {vaultStatus.error && (
        <div className="error-message">
          ❌ {vaultStatus.error}
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