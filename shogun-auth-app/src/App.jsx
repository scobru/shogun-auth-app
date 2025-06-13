import React, { useState, useEffect, useRef } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Gun from "gun";
import "gun/sea";
import { WebAuthnAuth, Web3Auth, NostrAuth, ZKOAuthAuth } from "./components/auth";
import OAuthCallback from "./components/auth/OAuthCallback";
import { useAuth } from "./hooks/useAuth";
import { useVault } from "./hooks/useVault";
import "./styles/auth.css";

function AuthApp() {
  // GunDB initialization
  const gunRef = useRef(null);

  // Initialize GunDB
  useEffect(() => {
    gunRef.current = Gun({
      peers: ["http://localhost:8765/gun"],
    });
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
    zkoauth: true // Forziamo a true per visualizzare sempre l'opzione Google OAuth
  });
  const [selectedAuthMethod, setSelectedAuthMethod] = useState("password");

  // Form data
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  // Check available auth methods
  useEffect(() => {
    const checkMethods = async () => {
      const methods = await checkAuthMethods();
      // Forziamo zkoauth a true per visualizzare sempre l'opzione Google OAuth
      setAuthMethods({...methods, zkoauth: true});
      console.log("Auth methods:", {...methods, zkoauth: true});
    };
    checkMethods();
  }, [checkAuthMethods]);

  // Load proofs when logged in
  useEffect(() => {
    if (authStatus.isLoggedIn) {
      loadProofs();
    }
  }, [authStatus.isLoggedIn, loadProofs]);

  // Handle password auth
  const handlePasswordLogin = async () => {
    if (!username || !password) return;
    try {
      await login(username, password);
      if (!vaultStatus.keypair) {
        await generateKeypair();
      }
    } catch (error) {
      console.error("Errore login:", error);
    }
  };

  const handlePasswordSignUp = async () => {
    if (!username || !password) return;
    try {
      await register(username, password);
      await generateKeypair();
    } catch (error) {
      console.error("Errore registrazione:", error);
    }
  };

  // Handle WebAuthn auth
  const handleWebAuthnLogin = async (username) => {
    try {
      await login(username, null, "webauthn");
      if (!vaultStatus.keypair) {
        await generateKeypair();
      }
    } catch (error) {
      console.error("Errore login WebAuthn:", error);
      throw error;
    }
  };

  const handleWebAuthnRegister = async (username) => {
    try {
      await register(username, null, "webauthn");
      await generateKeypair();
    } catch (error) {
      console.error("Errore registrazione WebAuthn:", error);
      throw error;
    }
  };

  // Handle Web3 auth
  const handleWeb3Login = async () => {
    try {
      await login(null, null, "web3");
      if (!vaultStatus.keypair) {
        await generateKeypair();
      }
    } catch (error) {
      console.error("Errore login Web3:", error);
      throw error;
    }
  };

  const handleWeb3Register = async () => {
    try {
      await register(null, null, "web3");
      await generateKeypair();
    } catch (error) {
      console.error("Errore registrazione Web3:", error);
      throw error;
    }
  };

  // Handle Nostr auth
  const handleNostrLogin = async () => {
    try {
      await login(null, null, "nostr");
      if (!vaultStatus.keypair) {
        await generateKeypair();
      }
    } catch (error) {
      console.error("Errore login Nostr:", error);
      throw error;
    }
  };

  const handleNostrRegister = async () => {
    try {
      await register(null, null, "nostr");
      await generateKeypair();
    } catch (error) {
      console.error("Errore registrazione Nostr:", error);
      throw error;
    }
  };

  // Handle ZK-OAuth auth
  const handleZKOAuthLogin = async (provider) => {
    try {
      console.log("Tentativo di login OAuth con provider:", provider);
      
      // Store the provider for the callback
      localStorage.setItem('oauth_provider', provider);
      
      // Get the auth result with redirect URL
      const result = await login(provider, null, "zkoauth");
      
      // Check if we need to redirect
      if (result && result.redirectUrl) {
        console.log("Redirect to:", result.redirectUrl);
        window.location.href = result.redirectUrl;
        return;
      }
      
      if (!vaultStatus.keypair) {
        await generateKeypair();
      }
    } catch (error) {
      console.error("Errore login OAuth:", error);
      throw error;
    }
  };

  const handleZKOAuthRegister = async (provider) => {
    try {
      console.log("Tentativo di registrazione OAuth con provider:", provider);
      
      // Store the provider for the callback
      localStorage.setItem('oauth_provider', provider);
      
      // Get the auth result with redirect URL
      const result = await register(provider, null, "zkoauth");
      
      // Check if we need to redirect
      if (result && result.redirectUrl) {
        console.log("Redirect to:", result.redirectUrl);
        window.location.href = result.redirectUrl;
        return;
      }
      
      await generateKeypair();
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
        <h3>📋 Proof Archiviate ({storedProofs.length})</h3>
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
      <div className="header">
        <h1 className="title">🥷 Shogun Auth Vault</h1>
        <p className="subtitle">Sistema di autenticazione con vault decentralizzato</p>
      </div>

      <div className="auth-status-container">
        <div className={`status-indicator ${authStatus.isLoggedIn ? "authenticated" : "not-authenticated"}`}>
          {authStatus.isLoggedIn ? "✅ Autenticato" : "❌ Non autenticato"}
        </div>
        <div className={`status-indicator ${vaultStatus.isInitialized ? "authenticated" : "not-authenticated"}`}>
          {vaultStatus.isInitialized ? "🔓 Vault inizializzato" : "🔒 Vault non inizializzato"}
        </div>
      </div>

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
                Ethereum Wallet
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
                value="zkoauth"
                checked={selectedAuthMethod === "zkoauth"}
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
        
        {selectedAuthMethod === "zkoauth" && (
          <ZKOAuthAuth
            onLogin={handleZKOAuthLogin}
            onRegister={handleZKOAuthRegister}
          />
        )}
      </div>

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