import React, { useState, useEffect, useRef } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
  useNavigate,
  useSearchParams,
} from "react-router-dom";
import {
  ShogunButtonProvider,
  ShogunButton,
  useShogun,
  shogunConnector,
} from "shogun-button-react";

import EncryptedDataManager from "./components/vault/EncryptedDataManager";
import { ThemeToggle } from "./components/ui/ThemeToggle";
import UserInfo from "./components/UserInfo";
import logo from "./assets/logo.svg";

import "./index.css"; // Import Tailwind CSS

// Main component che usa direttamente il context auth
const MainApp = ({ shogun, gunInstance, location }) => {
  // PRIMA DI OGNI USO: chiama useShogun
  const { isLoggedIn, userPub, username, logout } = useShogun();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const redirectUrl = searchParams.get("redirect");

  // Reference to track if a success message has been shown
  const authSuccessShown = useRef(false);

  // Load proofs when logged in
  useEffect(() => {
    if (isLoggedIn) {
      // Show a success message if OAuth login was just completed
      if (location?.state?.authSuccess && !authSuccessShown.current) {
        authSuccessShown.current = true;
        console.log("OAuth login completed successfully!");
        // Here you could show a toast or success alert
      }
    }
  }, [isLoggedIn, location, redirectUrl, navigate]);

  return (
    <div className="min-h-screen">
      <header className="navbar-custom">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <img src={logo} alt="Shogun Auth" className="w-20 h-20" />
            auth
          </h1>
          <p className="text-secondary">Secure, decentralized authentication</p>
          <ThemeToggle />
        </div>
      </header>

      <div className="container">
        <div className="flex justify-center mb-6">
          <div className={`badge-custom ${isLoggedIn ? "success" : "error"}`}>
            {isLoggedIn ? "Authenticated" : "Not authenticated"}
          </div>
        </div>

        {/* Display redirect notice if applicable */}
        {isLoggedIn && redirectUrl && (
          <div className="alert-custom">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              className="stroke-[#4F6BF6] shrink-0 w-6 h-6"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              ></path>
            </svg>
            <span className="text-[#4F6BF6]">
              Authentication successful! Redirecting you back to the
              application...
            </span>
          </div>
        )}

        {/* Display user info after login */}
        {isLoggedIn && (
          <UserInfo user={{ userPub, username }} onLogout={logout} />
        )}

        <div className="card mb-6 p-10">
          <div className="p-6">
            <h2 className="text-2xl font-semibold mb-6">Authentication</h2>

            {/* ShogunButton handles both logged-in and logged-out states, show it unless we're redirecting */}
            {isLoggedIn && redirectUrl ? (
              <div className="flex justify-center">
                <div className="text-center">
                  <div className="loading-custom mx-auto"></div>
                  <p className="mt-2 text-secondary">Preparing redirect...</p>
                </div>
              </div>
            ) : (
              <div className="flex justify-center">
                <ShogunButton />
              </div>
            )}
          </div>
        </div>

        {/* Add Encrypted Data Manager when user is logged in (but not if redirecting) */}
        {isLoggedIn && !redirectUrl && (
          <EncryptedDataManager
            shogun={shogun}
            authStatus={{ user: { userPub, username }, isLoggedIn }}
          />
        )}

        {/* Se vuoi gestire errori, aggiungi qui uno stato custom o usa error di useShogun se disponibile */}
      </div>

      {/* Footer */}
      <footer className="mt-12 py-8 border-t border-border-color bg-base-200/50">
        <div className="container mx-auto text-center">
          <p className="text-gray-400 mb-4">
            <a
              href="https://github.com/scobru/shogun-auth-app"
              className="text-blue-500 hover:text-blue-400"
            >
              repo
            </a>
            {" - "}
            build with ❤️ by {""}
            <a
              href="https://github.com/scobru"
              className="text-blue-500 hover:text-blue-400"
            >
              scobru
            </a>
          </p>
          <p className="text-gray-400 mb-4">
            part of {""}
            <a
              href="https://shogun-info.vercel.app"
              className="text-blue-500 hover:text-blue-400"
            >
              shogun project
            </a>
          </p>
        </div>
      </footer>
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
      { type: "password" },
      { type: "webauthn" },
      { type: "web3" },
      { type: "nostr" },
    ],
    theme: "dark",
  };

  // Usa useShogun dal context
  const { isLoggedIn, userPub, username, login, signUp, logout, sdk } =
    useShogun();

  // authStatus compatibile con la vecchia struttura
  const authStatus = {
    user: { userPub, username },
    isLoggedIn,
    isLoading: false, // puoi aggiungere uno stato custom se serve
    error: null, // puoi aggiungere uno stato custom se serve
  };

  // Handler per login/logout (se vuoi log custom)
  const handleLoginSuccess = (result) => {
    console.log("Login success:", result);
  };
  const handleError = (error) => {
    console.error("Auth error:", error);
  };
  const handleLogout = async () => {
    try {
      await logout();
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  const providerOptions = {
    appName: appOptions.appName,
    theme: appOptions.theme,
    showWebauthn: true,
    showMetamask: true,
    showNostr: true,
    showZkProof: true,
    enableGunDebug: true,
    enableConnectionMonitoring: true,
  };

  // Debug provider options
  console.log("ShogunButtonProvider options:", providerOptions);
  console.log("Shogun SDK plugins:", {
    web3: shogun?.hasPlugin("web3"),
    webauthn: shogun?.hasPlugin("webauthn"),
    nostr: shogun?.hasPlugin("nostr"),
  });

  return (
    <Router>
      <ShogunButtonProvider
        core={shogun}
        options={providerOptions}
        onLoginSuccess={handleLoginSuccess}
        onSignupSuccess={handleLoginSuccess}
        onLogout={handleLogout}
        onError={handleError}
      >
        <Routes>
          <Route
            path="/"
            element={
              <MainAppWithLocation
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
  const [relays, setRelays] = useState([]);
  const [isLoadingRelays, setIsLoadingRelays] = useState(true);

  // First effect: fetch relays asynchronously
  useEffect(() => {
    async function fetchRelays() {
      try {
        setIsLoadingRelays(true);
        const fetchedRelays = await window.ShogunRelays.getRelays();
        console.log("Fetched relays:", fetchedRelays);

        // Use fetched relays, or fallback to default if empty
        const peersToUse =
          fetchedRelays && fetchedRelays.length > 0
            ? fetchedRelays
            : ["https://peer.wallie.io/gun"];

        setRelays(peersToUse);
      } catch (error) {
        console.error("Error fetching relays:", error);
        // Fallback to default peer
        setRelays(["https://peer.wallie.io/gun"]);
      } finally {
        setIsLoadingRelays(false);
      }
    }

    fetchRelays();
  }, []);

  // Second effect: initialize ShogunCore only after relays are loaded
  useEffect(() => {
    if (isLoadingRelays || relays.length === 0) {
      return; // Wait for relays to be loaded
    }

    // Use shogunConnector to initialize ShogunCore with fetched relays
    const { core: shogunCore } = shogunConnector({
      gunOptions: {
        peers: relays,  
        localStorage: false,
        radisk: false,
        wire:true,
        axe:true,
        rfs:true,
        wait:500,
        webrtc:true,
        chunk:1000,
        pack:1000,
        jsonify:true,
      },
      appName: "Shogun Auth App",
      web3: { enabled: true },
      webauthn: {
        enabled: true,
        rpName: "Shogun Auth App",
      },
      nostr: { enabled: true },
      zkproof: { enabled: true },
      showWebauthn: true,
      showNostr: true,
      showMetamask: true,
      showZkProof: true,
      enableGunDebug: true,
      enableConnectionMonitoring: true,
    });

    // Add debug methods to window for testing
    if (typeof window !== "undefined") {
      window.shogunDebug = {
        clearAllData: () => shogunCore.clearAllStorageData(),
        sdk: shogunCore,
        gun: shogunCore.gun,
        relays: relays,
      };

      window.gun = shogunCore.gun;
      console.log("Debug methods available at window.shogunDebug");
      console.log("Available debug methods:", Object.keys(window.shogunDebug));
      console.log("Initialized with relays:", relays);
    }

    setSdk(shogunCore);
  }, [relays, isLoadingRelays]);

  if (isLoadingRelays || !sdk) {
    return (
      <div className="flex items-center justify-center h-screen flex-col gap-4">
        <span className="loading loading-lg"></span>
        <p className="text-secondary">
          {isLoadingRelays ? "Loading relays..." : "Initializing Shogun..."}
        </p>
      </div>
    );
  }

  return <ShogunApp shogun={sdk} />;
}

export default App;
