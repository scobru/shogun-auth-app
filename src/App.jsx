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

// import Gun from "gun"
// import "gun/sea"

// import { useShogunAuth } from "./hooks/useShogunAuth.js";
import { ShogunCore } from "shogun-core";
import OAuthCallback from "./components/OAuthCallback";
import EncryptedDataManager from "./components/vault/EncryptedDataManager";
import { ThemeToggle } from "./components/ui/ThemeToggle";
import { truncate } from "./utils/string.js";
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
      { type: "oauth", provider: "google" },
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
    showOauth: false,
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
        onLogout={handleLogout}
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

  const relays = [
    "wss://ruling-mastodon-improved.ngrok-free.app/gun",
    "https://gun-manhattan.herokuapp.com/gun",
    "https://peer.wallie.io/gun",
  ];

  useEffect(() => {
    // Set up Gun middleware for headers
    /* Gun.on('opt', function (ctx) {
      if (ctx.once) {
        return
      }
      ctx.on('out', function (msg) {
        var to = this.to
        // Adds headers for put
        msg.headers = {
          token: import.meta.env.VITE_GUN_TOKEN,
          Authorization: 'Bearer ' + import.meta.env.VITE_GUN_TOKEN
        }
        to.next(msg) // pass to next middleware
      })
    }) */

    // Create the Gun instance
    // const gunInstance = new Gun({
    //   peers: relays,
    //   localStorage: false,
    //   radisk: false,
    // });

    // Create ShogunCore with the Gun instance and specify scope
    const shogunCore = new ShogunCore({
      // gunInstance: gunInstance,
      appToken: import.meta.env.VITE_APP_TOKEN,
      authToken: import.meta.env.VITE_GUN_TOKEN,
      peers: relays,
      scope: "shogun", // Use scope instead of getting a chain node
      web3: { enabled: true },
      webauthn: {
        enabled: true,
        rpName: "Shogun Auth App",
      },
      nostr: { enabled: true },
      oauth: {
        enabled: false,
        usePKCE: true,
        allowUnsafeClientSecret: true,
        providers: {
          google: {
            enabled: true,
            clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID,
            clientSecret: import.meta.env.VITE_GOOGLE_CLIENT_SECRET,
            redirectUri: import.meta.env.VITE_GOOGLE_REDIRECT_URI,
            scope: ["openid", "email", "profile"],
            authUrl: "https://accounts.google.com/o/oauth2/v2/auth",
            tokenUrl: "https://oauth2.googleapis.com/token",
            userInfoUrl: "https://www.googleapis.com/oauth2/v2/userinfo",
          },
        },
      },
    });

    // Add debug methods to window for testing
    if (typeof window !== "undefined") {
      window.shogunDebug = {
        clearAllData: () => shogunCore.clearAllStorageData(),
        sdk: shogunCore,
        gun: shogunCore.gun,
      };
      console.log("Debug methods available at window.shogunDebug");
      console.log("Available debug methods:", Object.keys(window.shogunDebug));
    }

    setSdk(shogunCore);
  }, []); // Empty dependency array to run only once

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
