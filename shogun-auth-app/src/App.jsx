import React, { useState, useEffect, useRef } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Gun from "gun";
import "gun/sea";
import { ShogunCore } from "shogun-core";
import { zkOAuthChain } from "shogun-core";
import { WebAuthnAuth, Web3Auth, NostrAuth, ZKOAuthAuth } from "./components/auth";
import OAuthCallback from "./components/auth/OAuthCallback";
import { useAuth } from "./hooks/useAuth";
import { useVault } from "./hooks/useVault";
import "./styles/auth.css";

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

// Vault Manager component for ZK vault with dual authentication
const VaultManager = ({ shogun, authStatus, vaultStatus, generateKeypair }) => {
  const [metamaskAccount, setMetamaskAccount] = useState(null);
  const [metamaskSignature, setMetamaskSignature] = useState(null);
  const [oauthProof, setOauthProof] = useState(null);
  const [vaultCreationStep, setVaultCreationStep] = useState(0);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [zkProof, setZkProof] = useState(null);
  const [vaultExists, setVaultExists] = useState(false);
  const [vaultData, setVaultData] = useState(null);

  // Check if vault already exists and load vault data
  useEffect(() => {
    const checkVaultExists = async () => {
      if (!shogun || !shogun.gun || !shogun.user || !shogun.user.is) {
        return;
      }
      
      try {
        console.log("Checking if vault exists...");
        const user = shogun.gun.user();
        
        // Improved vault check with better timeout handling
        const checkVaultWithTimeout = async () => {
          return Promise.race([
            new Promise((resolve) => {
              // First check if we can access the vault node directly
              user.get('vault').once((data) => {
                console.log("Vault data received:", data);
                
                // Check if data exists and has any properties
                if (data && typeof data === 'object' && Object.keys(data).length > 0) {
                  console.log("Vault exists! Loading data...");
                  
                  // Simplified loading approach - get the entire object at once
                  const loadedData = {
                    metamaskAccount: null,
                    metamaskSignature: null,
                    createdAt: null,
                    zkProof: {
                      proof: null,
                      verificationKey: null,
                      publicSignals: []
                    }
                  };
                  
                  // Try to access zk data
                  if (data.zk) {
                    // Modern vault format
                    loadedData.metamaskAccount = data.zk.metamaskAccount;
                    loadedData.metamaskSignature = data.zk.metamaskSignature;
                    loadedData.createdAt = data.zk.createdAt;
                    
                    if (data.zk.zkProof) {
                      loadedData.zkProof = data.zk.zkProof;
                    }
                    
                    setVaultData(loadedData);
                    resolve(true);
                  } else {
                    // Try legacy format by checking for nested zk data
                    user.get('vault').get('zk').once((zkData) => {
                      if (zkData && typeof zkData === 'object') {
                        console.log("Found legacy vault format");
                        
                        // Load basic fields
                        user.get('vault').get('zk').get('metamaskAccount').once(val => {
                          if (val) loadedData.metamaskAccount = val;
                        });
                        
                        user.get('vault').get('zk').get('metamaskSignature').once(val => {
                          if (val) loadedData.metamaskSignature = val;
                        });
                        
                        user.get('vault').get('zk').get('createdAt').once(val => {
                          if (val) loadedData.createdAt = val;
                        });
                        
                        // Load ZK proof fields
                        user.get('vault').get('zk').get('zkProof').get('proof').once(val => {
                          if (val) loadedData.zkProof.proof = val;
                        });
                        
                        user.get('vault').get('zk').get('zkProof').get('verificationKey').once(val => {
                          if (val) loadedData.zkProof.verificationKey = val;
                        });
                        
                        // Set the loaded data after a short delay to ensure all fields are loaded
                        setTimeout(() => {
                          console.log("Setting vault data from legacy format:", loadedData);
                          setVaultData(loadedData);
                          resolve(true);
                        }, 1000);
                      } else {
                        console.log("No ZK vault data found");
                        resolve(false);
                      }
                    });
                    
                    // Set a timeout for the inner check to ensure it resolves
                    setTimeout(() => resolve(false), 1500);
                  }
                } else {
                  console.log("Vault does not exist or is empty");
                  resolve(false);
                }
              });
            }),
            // Add a timeout to prevent hanging
            new Promise((resolve) => {
              setTimeout(() => {
                console.log("Vault check timed out");
                resolve(false);
              }, 3000);
            })
          ]);
        };
        
        const vaultExists = await checkVaultWithTimeout();
        console.log("Vault exists check result:", vaultExists);
        setVaultExists(vaultExists);
      } catch (err) {
        console.error("Error checking vault:", err);
        setVaultExists(false);
      }
    };
    
    if (authStatus.isLoggedIn) {
      checkVaultExists();
    }
  }, [shogun, authStatus.isLoggedIn]);

  // Connect to MetaMask
  const connectMetamask = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (!window.ethereum) {
        throw new Error("MetaMask not installed");
      }
      
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      if (accounts.length === 0) {
        throw new Error("No accounts found");
      }
      
      setMetamaskAccount(accounts[0]);
      setVaultCreationStep(1);
      
    } catch (err) {
      setError(`MetaMask connection error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  // Sign message with MetaMask
  const signWithMetamask = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (!metamaskAccount) {
        throw new Error("MetaMask not connected");
      }
      
      const message = `Authorize Shogun ZK Vault Creation\nTimestamp: ${Date.now()}\nUser: ${authStatus.username || authStatus.userPub}`;
      const signature = await window.ethereum.request({
        method: 'personal_sign',
        params: [message, metamaskAccount],
      });
      
      setMetamaskSignature({
        message,
        signature,
        account: metamaskAccount
      });
      
      setVaultCreationStep(2);
    } catch (err) {
      setError(`Signature error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  // Generate ZK proof with Google OAuth
  const generateZKProof = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (!shogun) {
        throw new Error("Shogun not initialized");
      }
      
      // Get ZK-OAuth plugin
      const zkOAuthPlugin = await shogun.getPlugin("zk-oauth");
      if (!zkOAuthPlugin) {
        throw new Error("ZK-OAuth plugin not found");
      }
      
      // Create a custom proof using metamask signature and user info
      const proofData = {
        metamaskAccount,
        signature: metamaskSignature.signature,
        signedMessage: metamaskSignature.message,
        username: authStatus.username,
        userPub: authStatus.userPub,
        timestamp: Date.now()
      };
      
      // Use the ZK-OAuth chain to generate a proof
      const gun = shogun.gun;
      console.log("Gun instance:", gun);
      console.log("Checking for zkOAuth chain extension:", gun.zkOAuth ? "Available" : "Not available");
      
      if (!gun.zkOAuth) {
        // Try to initialize the chain again
        try {
          console.log("Attempting to initialize zkOAuthChain again...");
          // Initialize zkOAuth chain - no need to pass gun instance
          zkOAuthChain();
          console.log("zkOAuthChain initialization retry complete");
          
          // Check if it's available now
          if (!gun.zkOAuth) {
            throw new Error("ZK-OAuth chain still not initialized after retry");
          }
        } catch (chainError) {
          console.error("Error initializing zkOAuthChain:", chainError);
          throw new Error(`ZK-OAuth chain not initialized: ${chainError.message}`);
        }
      }
      
      console.log("Creating proof with data:", proofData);
      const proofResult = await gun.zkOAuth.createProofForData(proofData);
      console.log("Proof result:", proofResult);
      
      if (!proofResult.success) {
        throw new Error(`Failed to create ZK proof: ${proofResult.error || "Unknown error"}`);
      }
      
      setZkProof(proofResult.proof);
      setVaultCreationStep(3);
      
    } catch (err) {
      console.error("ZK proof generation error:", err);
      setError(`ZK proof generation error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  // Create vault with ZK proof
  const createZKVault = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (!zkProof) {
        throw new Error("ZK proof not generated");
      }
      
      console.log("Creating vault with ZK proof...");
      
      // Get Gun and SEA
      const gun = shogun.gun;
      if (!gun || !gun.user || !gun.user().is) {
        throw new Error("Gun user not initialized");
      }
      
      // Use the existing user instead of creating a new keypair
      const user = gun.user();
      console.log("Using existing user for vault:", user.is);
      
      // Prepare the data for Gun.js - Convert arrays to objects with numeric keys
      // Gun.js doesn't handle arrays well, so we convert them to objects
      const preparedZkProof = {
        proof: zkProof.proof,
        verificationKey: zkProof.verificationKey,
        // Convert publicSignals array to an object with numeric keys
        publicSignals: zkProof.publicSignals.reduce((obj, item, index) => {
          obj[index] = item;
          return obj;
        }, {})
      };
      
      console.log("Prepared ZK proof for Gun storage:", preparedZkProof);
      
      // Store the ZK proof and MetaMask signature in the vault
      console.log("Storing ZK proof in vault...");
      
      // Create a simpler vault data structure
      const vaultData = {
        zk: {
          metamaskAccount: metamaskAccount,
          metamaskSignature: metamaskSignature.signature,
          createdAt: Date.now(),
          username: authStatus.username,
          userPub: authStatus.userPub,
          zkProof: {
            proof: preparedZkProof.proof,
            verificationKey: preparedZkProof.verificationKey,
            publicSignals: preparedZkProof.publicSignals
          }
        }
      };
      
      // Create vault with a timeout promise
      const storeVaultWithTimeout = async () => {
        return Promise.race([
          new Promise((resolve, reject) => {
            try {
              // Use a single put operation
              console.log("Putting vault data to Gun DB...");
              user.get('vault').put(vaultData, (ack) => {
                if (ack.err) {
                  console.error("Gun storage error:", ack.err);
                  reject(new Error(`Vault storage error: ${ack.err}`));
                  return;
                }
                
                console.log("Vault data stored successfully:", ack);
                resolve(true);
              });
            } catch (err) {
              console.error("Error in Gun put operation:", err);
              reject(err);
            }
          }),
          // Add a timeout to prevent hanging
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error("Vault storage timed out after 10 seconds")), 10000)
          )
        ]);
      };
      
      await storeVaultWithTimeout();
      console.log("Vault created successfully!");
      setVaultCreationStep(4);
      
    } catch (err) {
      console.error("Vault creation error:", err);
      setError(`Vault creation error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  // If the vault exists, show vault status with loaded data
  if (vaultExists) {
    return (
      <div className="vault-manager">
        <h3>🔐 ZK Vault Status</h3>
        <div className="vault-manager-content">
          <p>Vault is initialized and secured with Zero-Knowledge proofs.</p>
          <p><strong>User:</strong> {authStatus.username}</p>
          <p><strong>Public Key:</strong> <span className="pubkey">{authStatus.userPub?.substring(0, 12)}...</span></p>
          
          {vaultData && (
            <div className="vault-details">
              <h4>Vault Details</h4>
              <p><strong>MetaMask Account:</strong> <span className="address">{vaultData.metamaskAccount?.substring(0, 10)}...</span></p>
              <p><strong>Created:</strong> {vaultData.createdAt ? new Date(vaultData.createdAt).toLocaleString() : 'Unknown'}</p>
              <p><strong>ZK Proof:</strong> <span className="proof-id">{vaultData.zkProof?.proof?.substring(0, 10)}...</span></p>
            </div>
          )}
          
          <button onClick={() => setVaultExists(false)} className="reset-button">
            Reset Vault View
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="vault-manager">
      <h3>🔐 Create ZK Vault</h3>
      <div className="vault-creation-steps">
        <div className={`vault-step ${vaultCreationStep >= 0 ? 'active' : ''} ${vaultCreationStep > 0 ? 'completed' : ''}`}>
          <h4>Step 1: Connect MetaMask</h4>
          {vaultCreationStep === 0 && (
            <button 
              onClick={connectMetamask}
              disabled={loading || !authStatus.isLoggedIn}
            >
              {loading ? 'Connecting...' : '🦊 Connect MetaMask'}
            </button>
          )}
          {metamaskAccount && (
            <p className="step-result">Connected: {metamaskAccount.substring(0, 8)}...</p>
          )}
        </div>
        
        <div className={`vault-step ${vaultCreationStep >= 1 ? 'active' : ''} ${vaultCreationStep > 1 ? 'completed' : ''}`}>
          <h4>Step 2: Sign Authorization</h4>
          {vaultCreationStep === 1 && (
            <button 
              onClick={signWithMetamask}
              disabled={loading || !metamaskAccount}
            >
              {loading ? 'Signing...' : '✍️ Sign with MetaMask'}
            </button>
          )}
          {metamaskSignature && (
            <p className="step-result">Signature: {metamaskSignature.signature.substring(0, 8)}...</p>
          )}
        </div>
        
        <div className={`vault-step ${vaultCreationStep >= 2 ? 'active' : ''} ${vaultCreationStep > 2 ? 'completed' : ''}`}>
          <h4>Step 3: Generate ZK Proof</h4>
          {vaultCreationStep === 2 && (
            <button 
              onClick={generateZKProof}
              disabled={loading || !metamaskSignature}
            >
              {loading ? 'Generating...' : '🔒 Generate ZK Proof'}
            </button>
          )}
          {zkProof && (
            <p className="step-result">ZK Proof Generated!</p>
          )}
        </div>
        
        <div className={`vault-step ${vaultCreationStep >= 3 ? 'active' : ''} ${vaultCreationStep > 3 ? 'completed' : ''}`}>
          <h4>Step 4: Create Vault</h4>
          {vaultCreationStep === 3 && (
            <button 
              onClick={createZKVault}
              disabled={loading || !zkProof}
            >
              {loading ? 'Creating...' : '💼 Create ZK Vault'}
            </button>
          )}
          {vaultCreationStep === 4 && (
            <p className="step-success">✅ ZK Vault created successfully!</p>
          )}
        </div>
      </div>
      
      {error && (
        <div className="error-message">
          ❌ {error}
        </div>
      )}
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

  // Initialize GunDB and zkOAuthChain
  useEffect(() => {
    gunRef.current = Gun({
      peers: ["http://localhost:8765/gun"],
    });
    
    // Initialize the zkOAuthChain to extend Gun with zkOAuth methods
    try {
      console.log("Initializing zkOAuthChain...");
      // Call the zkOAuthChain function directly - it extends Gun.chain internally
      zkOAuthChain();
      console.log("zkOAuthChain initialized successfully");
    } catch (error) {
      console.error("Failed to initialize zkOAuthChain:", error);
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
      // Forziamo zkoauth e web3 (MetaMask) a true per visualizzarli sempre
      setAuthMethods({...methods, zkoauth: true, web3: true});
      console.log("Auth methods:", {...methods, zkoauth: true, web3: true});
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
      
      {/* Add ZK Vault Manager Section when user is logged in */}
      {authStatus.isLoggedIn && (
        <div className="zk-vault-section">
          <h2>🛡️ ZK Vault con Doppia Autenticazione</h2>
          <p className="vault-description">
            Crea un vault sicuro combinando la firma MetaMask e l'autenticazione Google OAuth con prova Zero-Knowledge.
          </p>
          <VaultManager 
            shogun={shogun}
            authStatus={authStatus}
            vaultStatus={vaultStatus}
            generateKeypair={generateKeypair}
          />
        </div>
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