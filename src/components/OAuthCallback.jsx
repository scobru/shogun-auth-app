import React, { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useShogun } from "shogun-button-react";

const OAuthCallback = () => {
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const processing = useRef(false);

  // Usa il context invece di gestire direttamente l'autenticazione
  const { sdk } = useShogun();

  // Memoizza la funzione handleAuth per evitare re-esecuzioni
  const handleAuth = useCallback(async () => {
    if (processing.current) {
      console.warn("OAuth callback is already being processed, skipping.");
      return;
    }
    processing.current = true;

    try {
      if (!sdk) {
        throw new Error("Shogun SDK not available");
      }

      const oauthPlugin = sdk.getPlugin("oauth");
      if (!oauthPlugin || !oauthPlugin.handleOAuthCallback) {
        throw new Error(
          "OAuth plugin or handleOAuthCallback method is not available"
        );
      }

      const params = new URLSearchParams(location.search);
      const code = params.get("code");
      const state = params.get("state");
      const error = params.get("error");
      const errorDescription = params.get("error_description");

      console.log("OAuth callback parameters:", {
        code: code ? "present" : "missing",
        state: state ? "present" : "missing",
        error,
        errorDescription,
        fullUrl: location.search
      });

      // Controlla se c'è un errore OAuth
      if (error) {
        throw new Error(
          `OAuth error: ${error}${errorDescription ? ` - ${errorDescription}` : ""}`
        );
      }

      // Validazione di sicurezza
      if (!code) {
        throw new Error("Authorization code not found in URL.");
      }

      if (!state) {
        throw new Error(
          "State parameter not found in URL - possible CSRF attack."
        );
      }

      const provider = params.get("provider") || "google";

      console.log(
        `[${new Date().toISOString()}] Handling OAuth callback for ${provider}`
      );

      // Usa direttamente il plugin OAuth invece del context
      const result = await oauthPlugin.handleOAuthCallback(provider, code, state);

      if (result && result.success) {
        console.log(
          `[${new Date().toISOString()}] Authentication successful:`,
          result
        );

        // Emetti l'evento di aggiornamento auth
        if (sdk.emit) {
          sdk.emit("auth:updated", {
            userPub: result.userPub,
            username: result.user?.username,
            method: "oauth",
            provider,
          });
        }

        navigate("/", { state: { authSuccess: true } });
      } else {
        throw new Error(result?.error || "Authentication failed");
      }
    } catch (e) {
      console.error("Error handling OAuth callback:", e);

      // Gestione errori specifici
      if (e.message?.includes("invalid_grant")) {
        setError("Your session has expired. Please try signing in again.");
        navigate("/?error=token_expired");
      } else if (e.message?.includes("state parameter expired")) {
        setError(
          "Authentication session expired. Please try signing in again."
        );
        navigate("/?error=session_expired");
      } else if (e.message?.includes("CSRF")) {
        setError("Security validation failed. Please try signing in again.");
        navigate("/?error=security_error");
      } else {
        setError(e.message || "An unexpected error occurred.");
      }
    } finally {
      processing.current = false;
    }
  }, [sdk, navigate, location]);

  useEffect(() => {
    handleAuth();
  }, [handleAuth]);

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-error mb-4">
            Authentication Failed
          </h2>
          <p className="text-base-content/80">{error}</p>
          <button
            className="btn btn-primary mt-6"
            onClick={() => navigate("/")}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center h-screen">
      <div className="text-center">
        <div className="loading loading-spinner loading-lg"></div>
        <p className="mt-4">Processing authentication...</p>
      </div>
    </div>
  );
};

export default OAuthCallback;
