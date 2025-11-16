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
} from "shogun-button-react";
import { shogunConnector } from "shogun-button-react";
import Gun from "gun";
import EncryptedDataManager from "./components/vault/EncryptedDataManager";
import { ThemeToggle } from "./components/ui/ThemeToggle";
import UserInfo from "./components/UserInfo";
import logo from "./assets/logo.svg";

import "./index.css"; // Import Tailwind CSS
import "shogun-relays";

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
    <div className="app-shell">
      <header className="navbar-custom">
        <div className="navbar-inner">
          <div className="navbar-title">
            <img src={logo} alt="Shogun Auth" className="w-12 h-12" />
            <div>
              <span className="font-semibold">Auth</span>
              <p className="navbar-subtitle">
                Secure, decentralized authentication
              </p>
            </div>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main className="app-main">
        <div className="flex justify-center mb-6">
          <div className={`badge-custom ${isLoggedIn ? "success" : "error"}`}>
            <span className="badge-dot" />
            <span>{isLoggedIn ? "Authenticated" : "Not authenticated"}</span>
          </div>
        </div>

        {/* Display redirect notice if applicable */}
        {isLoggedIn && redirectUrl && (
          <div className="alert-custom success">
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
          <div className="mb-6">
            <UserInfo user={{ userPub, username }} onLogout={logout} />
          </div>
        )}

        <div className="auth-card card mb-6 p-8">
          <div className="card-body">
            <div className="auth-card-header">
              <div>
                <h2 className="auth-card-title">Authentication</h2>
                <p className="auth-card-caption">
                  Connect with your preferred method and let Shogun handle the
                  rest.
                </p>
              </div>
            </div>

            {/* ShogunButton handles both logged-in and logged-out states, show it unless we're redirecting */}
            {isLoggedIn && redirectUrl ? (
              <div className="flex justify-center">
                <div className="text-center">
                  <div className="loading-custom mx-auto"></div>
                  <p className="mt-3 text-secondary">Preparing redirect...</p>
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
      </main>

      {/* Footer */}
      <footer className="app-footer">
        <div className="app-footer-inner">
          <p className="mb-2">
            <a href="https://github.com/scobru/shogun-auth-app">repo</a>
            {" · "}
            built by{" "}
            <a href="https://github.com/scobru">scobru</a>
          </p>
          <p>
            part of{" "}
            <a href="https://shogun-info.vercel.app">shogun project</a>
          </p>
        </div>
      </footer>

      {/* Onion widget anchor (positioned by shogun-onion CSS) */}
      <div id="shogun-ring"></div>
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
      { type: "zkproof" },
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
    zkproof: shogun?.hasPlugin("zkproof"),
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
                gunInstance={shogun?.gun}
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
        const fetchedRelays = await window.ShogunRelays.forceListUpdate();

        console.log("Fetched relays:", fetchedRelays);

        // Use fetched relays, or fallback to default if empty
        const peersToUse =
          fetchedRelays && fetchedRelays.length > 0
            ? fetchedRelays
            : ["https://5eh4twk2f62autunsje4panime.srv.us//gun"];

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

    console.log("relays", relays);

    // Use shogunConnector to initialize ShogunCore with backward compatible configuration
    const initShogun = async () => {
      const gun = Gun({
        peers: relays,
        localStorage: false,
        radisk: false,
      });

      const { core: shogunCore } = await shogunConnector({
        appName: "Shogun Auth App",
        // Pass explicit Gun instance
        gunInstance: gun,
        // Authentication method configurations
        web3: { enabled: true },
        webauthn: {
          enabled: true,
          rpName: "Shogun Auth App",
        },
        nostr: { enabled: true },
        zkproof: { enabled: true },
        // UI feature toggles
        showWebauthn: true,
        showNostr: true,
        showMetamask: true,
        showZkProof: true,
        // Advanced features (carried through options)
        enableGunDebug: true,
        enableConnectionMonitoring: true,
        defaultPageSize: 20,
        connectionTimeout: 10000,
        debounceInterval: 100,
        
      });

      // Add debug methods to window for testing
      if (typeof window !== "undefined") {
        // Wait a bit for Gun to initialize
        setTimeout(() => {
          console.log("ShogunCore after initialization:", shogunCore);
          const gunInstance = shogunCore.gun;
          console.log("Gun instance found:", gunInstance);
          console.log("Database details:", {
            db: shogunCore.db,
            dbGun: shogunCore.db?.gun,
            gun: shogunCore.gun,
          });
          
          window.shogunDebug = {
            clearAllData: () => {
              // clearAllStorageData has been removed from shogun-core
              // Use storage.clearAll() or manually clear sessionStorage/localStorage if needed
              if (shogunCore.storage) {
                shogunCore.storage.clearAll();
              }
              // Also clear Gun session data
              if (typeof sessionStorage !== 'undefined') {
                sessionStorage.removeItem('gunSessionData');
              }
            },
            sdk: shogunCore,
            gun: gunInstance,
            relays: relays,
          };

          window.gun = gunInstance;
          window.shogun = shogunCore;
          console.log("Debug methods available at window.shogunDebug");
          console.log("Available debug methods:", Object.keys(window.shogunDebug));
          console.log("Initialized with relays:", relays);
        }, 1000);
      }

      setSdk(shogunCore);
    };

    initShogun();
  }, [relays, isLoadingRelays]);

  // Mount Shogun Onion widget (Onion ring) once, after main app is ready
  useEffect(() => {
    // Wait until SDK is initialized so the main layout (and #shogun-ring) is rendered
    if (!sdk) return;

    (async () => {
      if (typeof window === "undefined" || typeof document === "undefined") {
        return;
      }

      try {
        // Ensure Onion CSS from CDN is present
        const ensureOnionCss = () => {
          const existing = document.getElementById("shogun-onion-css");
          if (existing) return;
          const link = document.createElement("link");
          link.id = "shogun-onion-css";
          link.rel = "stylesheet";
          link.href = "https://unpkg.com/shogun-onion@0.1.10/onion.css";
          document.head.appendChild(link);
        };

        ensureOnionCss();

        // Import only sitesData to avoid touching package entry that references CSS assets
        const { default: sitesData } = await import("shogun-onion/sitesData.js");

        // Expose globals expected by the onion widget script
        window.sitesData = sitesData;
        window.sites = sitesData.map((s) => s.url);
        window.ringName = "Shogun Network";
        window.ringID = "shogun-ring";
        window.useIndex = false;
        window.indexPage = "#";
        window.useRandom = true;

        // Ensure anchor exists; if not, create a fallback at the end of body
        if (!document.getElementById("shogun-ring")) {
          const anchor = document.createElement("div");
          anchor.id = "shogun-ring";
          document.body.appendChild(anchor);
        }

        // Inject the widget script if not already added
        await new Promise((resolve, reject) => {
          if (
            document.querySelector(
              'script[data-shogun-onion-widget="true"]'
            )
          ) {
            resolve();
            return;
          }
          const script = document.createElement("script");
          script.src =
            "https://unpkg.com/shogun-onion@0.1.10/ring/onionring-widget.js";
          script.async = true;
          script.setAttribute("data-shogun-onion-widget", "true");
          script.onload = () => resolve();
          script.onerror = (e) => reject(e);
          document.body.appendChild(script);
        });
      } catch (e) {
        console.error("Failed to mount Shogun Onion widget:", e);
      }
    })();
  }, [sdk]);

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
