import React, { useState, useEffect, useRef } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import {
  ShogunButtonProvider,
  ShogunButton,
  useShogun,
} from "shogun-button-react";

import { useShogunAuth } from "./hooks/useShogunAuth.js";
import { ShogunCore } from "shogun-core";
import OAuthCallback from "./components/OAuthCallback";
import EncryptedDataManager from "./components/vault/EncryptedDataManager";
import { useVault } from "./hooks/useVault";
import { ThemeToggle } from "./components/ui";
import { truncate } from "./utils/string.js";

import "./index.css"; // Import Tailwind CSS

import Gun from "gun/gun";
import SEA from "gun/sea";

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
            <span className="badge badge-secondary font-mono">{truncate(authStatus.userPub, 40)}</span>
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

// Main component that manages the app after login
const MainApp = ({ authStatus, logout, shogun, gunInstance, location }) => {
  const {
    vaultStatus,
    storedProofs,
    pendingRequests,
    generateKeypair,
    loadProofs,
    verifyProof,
    approveProofRequest,
    rejectProofRequest
  } = useVault(shogun, gunInstance);
  
  // Reference to track if a success message has been shown
  const authSuccessShown = useRef(false);

  // Load proofs when logged in
  useEffect(() => {
    if (authStatus.isLoggedIn) {
      loadProofs();
      
      // Generate keypair if not already created
      if (!vaultStatus.keypair) {
        generateKeypair();
      }
      
      // Show a success message if OAuth login was just completed
      if (location?.state?.authSuccess && !authSuccessShown.current) {
        authSuccessShown.current = true;
        console.log("OAuth login completed successfully!");
        // Here you could show a toast or success alert
      }
    }
  }, [authStatus.isLoggedIn, loadProofs, vaultStatus.keypair, generateKeypair, location]);

  // UI Components
  const PendingProofRequests = () => {
    if (pendingRequests.size === 0) return null;

    return (
      <div className="proof-requests">
        <h3>Pending Proof Requests</h3>
        {Array.from(pendingRequests.entries()).map(([id, request]) => (
          <div key={id} className="proof-request-card">
            <div className="request-info">
              <h4>{request.requestingApp?.name || "Unknown App"}</h4>
              <p>{request.requestingApp?.description}</p>
              <p>
                <strong>Type:</strong> {request.type}
              </p>
              <p>
                <strong>Privacy:</strong> {request.privacy}
              </p>
              <p>
                <strong>Origin:</strong> {request.origin}
              </p>
            </div>
            <div className="request-actions">
              <button
                onClick={() => approveProofRequest(id)}
                disabled={!vaultStatus.keypair}
                title={
                  !vaultStatus.keypair ? "Vault not initialized" : ""
                }
              >
                Approve
              </button>
              <button onClick={() => rejectProofRequest(id)}>Reject</button>
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
          Stored Proofs ({storedProofs.length})
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
                <p><strong>App:</strong> {proof.requestingApp?.name || "Not specified"}</p>
                <p><strong>Type:</strong> {proof.type}</p>
                <p><strong>Privacy:</strong> {proof.privacy}</p>
                <p className="proof-data">
                  <strong>Signature:</strong> {typeof proof.data === 'string' ? 
                    `${proof.data.substring(0, 20)}...` : 'Complex signature'}
                </p>
              </div>
              <button onClick={() => verifyProof(proof.id)}>Verify</button>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
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

      <div className="flex justify-center mb-6">
        <div className={`badge ${authStatus.isLoggedIn ? "badge-success" : "badge-error"} p-4 text-base font-medium`}>
          {authStatus.isLoggedIn ? "Authenticated" : "Not authenticated"}
        </div>
      </div>
      
      {/* Display user info after login */}
      {authStatus.isLoggedIn && <UserInfo authStatus={authStatus} />}

      <div className="card bg-base-100 shadow-xl mb-6">
        <div className="card-body">
          <h2 className="card-title text-2xl">Authentication</h2>
        
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
          <div className="flex justify-center my-4">
            <ShogunButton />
          </div>
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
    nostr: shogun?.hasPlugin("nostr")
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
          <Route path="/auth/callback" element={<OAuthCallback shogun={shogun} />} />
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

  useEffect(() => {
    const shogunCore = new ShogunCore({
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