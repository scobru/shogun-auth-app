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

import { ShogunCore } from "shogun-core";
import OAuthCallback from "./components/OAuthCallback";
import EncryptedDataManager from "./components/vault/EncryptedDataManager";
import { ThemeToggle } from "./components/ui/ThemeToggle";
import UserInfo from "./components/UserInfo";
import LandingPage from "./components/LandingPage";
import AuthPage from "./components/AuthPage";
import logo from "./assets/logo.svg";
import "./index.css"; // Import Tailwind CSS

// Main component che usa direttamente il context auth
const MainApp = ({ location }) => {
  // PRIMA DI OGNI USO: chiama useShogun
  const { isLoggedIn, userPub, username, logout } = useShogun();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const redirectUrl = searchParams.get("redirect");
  const [showAuth, setShowAuth] = useState(false);

  // Reference to track if a success message has been shown
  const authSuccessShown = useRef(false);
  const redirectAttempted = useRef(false);

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

  // If user is not logged in and not showing auth page, show landing page
  if (!isLoggedIn && !showAuth) {
    return <LandingPage onShowAuth={() => setShowAuth(true)} />;
  }

  // If user is not logged in but showing auth page
  if (!isLoggedIn && showAuth) {
    return <AuthPage onBackToLanding={() => setShowAuth(false)} />;
  }

  // User is logged in - show the original app UI
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

        {/* Add Encrypted Data Manager when user is logged in (but not if redirecting) */}
        {isLoggedIn && !redirectUrl && (
          <EncryptedDataManager
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
          <div className="text-xs text-gray-500">
            <p>Shogun Auth - Decentralized Authentication System</p>
            <p>
              This application showcases various authentication methods
              including WebAuthn, Web3, Nostr, and OAuth.
            </p>
            <p className="mt-2">
              <strong>Security Notice:</strong> All authentication is handled
              client-side with end-to-end encryption.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

// Component that handles OAuth callback and redirects
const OAuthCallbackHandler = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate("/", { state: { authSuccess: true } });
    }, 2000);

    return () => clearTimeout(timer);
  }, [navigate]);

  return <OAuthCallback />;
};

function App() {
  const [shogunInstance, setShogunInstance] = useState(null);

  useEffect(() => {
    const initializeShogun = async () => {
      try {
        // Initialize ShogunCore with all plugins
        const shogun = new ShogunCore({
          authToken: import.meta.env.VITE_AUTH_TOKEN,
          peers: [
            "wss://relay.shogun-eco.xyz/gun",
            "https://peer.wallie.io/gun",
            "https://gun-manhattan.herokuapp.com/gun",
          ],
          webauthn: { enabled: true },
          web3: { enabled: true },
          nostr: { enabled: true },
        });

        console.log("ShogunCore initialized successfully");
        setShogunInstance(shogun);
      } catch (error) {
        console.error("Failed to initialize ShogunCore:", error);
      }
    };

    initializeShogun();
  }, []);

  if (!shogunInstance) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="loading-custom mx-auto mb-4"></div>
          <p>Initializing Shogun Core...</p>
        </div>
      </div>
    );
  }

  return (
    <ShogunButtonProvider
      sdk={shogunInstance}
      options={{
        appName: "Shogun Auth App",
        darkMode: false,
        showMetamask: true,
        showWebauthn: true,
        showNostr: true,
        showOauth: !!import.meta.env.VITE_GOOGLE_CLIENT_ID,
        peers: [
          "wss://relay.shogun-eco.xyz/gun",
          "https://peer.wallie.io/gun",
          "https://gun-manhattan.herokuapp.com/gun",
        ],
        webauthn: { enabled: true },
        web3: { enabled: true },
        nostr: { enabled: true },
        oauth: {
          google: {
            enabled: !!import.meta.env.VITE_GOOGLE_CLIENT_ID,
            clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID,
            redirectUri: `${window.location.origin}/auth/callback`,
          },
        },
      }}
    >
      <Router>
        <Routes>
          <Route path="/auth/callback" element={<OAuthCallbackHandler />} />
          <Route path="/*" element={<MainApp location={window.location} />} />
        </Routes>
      </Router>
    </ShogunButtonProvider>
  );
}

export default App;
