import React, { useState, useEffect, useCallback } from "react";
import { v4 as uuidv4 } from "uuid";

function App() {
  // State principale
  const [authStatus, setAuthStatus] = useState("❌ Non autenticato");
  const [results, setResults] = useState("I risultati appariranno qui...");

  // Form data
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  // Proof requests
  const [pendingProofRequests, setPendingProofRequests] = useState(new Map());
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Utility functions
  const showResult = useCallback((title, data) => {
    const resultText = `${title}\n\n${JSON.stringify(data, null, 2)}`;
    setResults(resultText);
  }, []);

  // Authentication methods
  const handleLogin = async () => {
    if (!username || !password) return;

    try {
      // Simulazione login semplice
      if (username.length > 0 && password.length > 0) {
        setIsLoggedIn(true);
        setAuthStatus("✅ Autenticato");
        showResult("Login completato", {
          username,
          loginTime: new Date().toISOString(),
          success: true,
        });
      }
    } catch (error) {
      console.error("Errore login:", error);
    }
  };

  const handleSignUp = async () => {
    if (!username || !password) return;

    try {
      // Simulazione registrazione semplice
      if (username.length > 0 && password.length > 0) {
        setIsLoggedIn(true);
        setAuthStatus("✅ Autenticato");
        showResult("Registrazione completata", {
          username,
          signupTime: new Date().toISOString(),
          success: true,
        });
      }
    } catch (error) {
      console.error("Errore registrazione:", error);
    }
  };

  const handleLogout = () => {
    try {
      setIsLoggedIn(false);
      setAuthStatus("❌ Non autenticato");
      setUsername("");
      setPassword("");
      showResult("Logout", { message: "Disconnesso con successo" });
    } catch (error) {
      console.error("Errore logout:", error);
    }
  };

  // Handle proof request
  const handleProofRequest = useCallback(
    (event) => {
      // Filter rapido per evitare log spam
      if (!event.data || typeof event.data !== "object") return;
      if (!event.data.type || !event.data.type.startsWith("shogun:")) return;

      console.log("📨 Messaggio Shogun ricevuto:", event);

      try {
        const { type, data } = event.data;

        if (type !== "shogun:proof-request") {
          console.log("ℹ️ Messaggio Shogun ignorato:", type);
          return;
        }

        console.log("📨 Richiesta proof ricevuta:", data);

        // Salva sia l'origine che il riferimento alla finestra sorgente
        const requestWithSource = {
          ...data,
          origin: event.origin,
          sourceWindow: event.source, // Riferimento diretto alla finestra
          timestamp: Date.now(),
        };

        setPendingProofRequests(
          (prev) => new Map(prev.set(data.id, requestWithSource))
        );

        showResult("Nuova richiesta proof ricevuta", data);
      } catch (error) {
        console.error("Errore gestione messaggio:", error);
      }
    },
    [showResult]
  );

  // Debug function per simulare una richiesta
  const simulateProofRequest = () => {
    const mockRequest = {
      id: `debug_${Date.now()}`,
      type: "authentication",
      requirements: {
        authMethods: ["password"],
      },
      requestingApp: {
        name: "App di Test",
        description: "Richiesta simulata per test",
      },
      privacy: "zero_knowledge",
      origin: "http://localhost:3000",
    };

    setPendingProofRequests(
      (prev) =>
        new Map(
          prev.set(mockRequest.id, {
            ...mockRequest,
            timestamp: Date.now(),
          })
        )
    );

    showResult("Richiesta proof simulata creata", mockRequest);
  };

  // Funzione per richiedere il reinvio delle richieste
  const requestRetry = () => {
    if (window.opener && !window.opener.closed) {
      try {
        window.opener.postMessage(
          {
            type: "shogun:request-retry",
            data: { authenticated: true, timestamp: Date.now() },
          },
          "*"
        );
        console.log("🔄 Richiesto reinvio all'app genitore");
        showResult("Richiesto reinvio", {
          message: "Chiesto all'app richiedente di reinviare la richiesta",
        });
      } catch (error) {
        console.warn("⚠️ Errore nella richiesta di reinvio:", error);
        showResult("Errore reinvio", { error: error.message });
      }
    } else {
      showResult("Nessuna app genitore", {
        message: "Non c'è un'app genitore a cui richiedere il reinvio",
      });
    }
  };

  const approveProofRequest = async (requestId) => {
    const request = pendingProofRequests.get(requestId);
    if (!request) return;

    try {
      // Genera proof semplice
      const proof = {
        type: "zk-proof",
        authMethod: "username-password",
        timestamp: Date.now(),
        data: `proof_${uuidv4()}`,
      };

      const response = {
        type: "shogun:proof-response",
        data: {
          requestId,
          success: true,
          proof,
          metadata: {
            generatedAt: Date.now(),
            expiresAt: Date.now() + 24 * 60 * 60 * 1000,
            privacy: request.privacy || "zero_knowledge",
          },
        },
      };

      console.log("📤 Invio risposta proof:", response);
      console.log("🔍 Debug comunicazione:", {
        hasOpener: !!window.opener,
        openerClosed: window.opener?.closed,
        hasSourceWindow: !!request.sourceWindow,
        requestOrigin: request.origin,
        currentOrigin: window.location.origin,
        parent: window.parent !== window,
        top: window.top !== window,
      });

      let messageSent = false;

      // Tentativo principale: window.opener con wildcard origin (il più affidabile)
      if (window.opener && !window.opener.closed) {
        try {
          console.log(
            "📤 Tentativo invio tramite window.opener con wildcard..."
          );
          window.opener.postMessage(response, "*");
          console.log(
            "✅ Messaggio inviato tramite window.opener con wildcard origin"
          );
          messageSent = true;
        } catch (error) {
          console.warn("❌ Errore invio opener con wildcard:", error);
        }
      }

      // Tentativo 2: sourceWindow con wildcard origin
      if (!messageSent && request.sourceWindow) {
        try {
          console.log(
            "📤 Tentativo invio tramite sourceWindow con wildcard..."
          );
          request.sourceWindow.postMessage(response, "*");
          console.log(
            "✅ Messaggio inviato tramite sourceWindow con wildcard origin"
          );
          messageSent = true;
        } catch (error) {
          console.warn("❌ Errore invio sourceWindow con wildcard:", error);
        }
      }

      // Tentativo 3: window.opener con origin specifico
      if (!messageSent && window.opener && !window.opener.closed) {
        try {
          console.log(
            "📤 Tentativo invio tramite window.opener con origin specifico..."
          );
          window.opener.postMessage(
            response,
            request.origin || "http://localhost:3000"
          );
          console.log(
            "✅ Messaggio inviato tramite window.opener con origin specifico"
          );
          messageSent = true;
        } catch (error) {
          console.warn(
            "❌ Errore invio tramite window.opener con origin specifico:",
            error
          );
        }
      }

      // Tentativo 4: sourceWindow con origin specifico
      if (!messageSent && request.sourceWindow) {
        try {
          console.log(
            "📤 Tentativo invio tramite sourceWindow con origin specifico..."
          );
          request.sourceWindow.postMessage(
            response,
            request.origin || "http://localhost:3000"
          );
          console.log(
            "✅ Messaggio inviato tramite sourceWindow con origin specifico"
          );
          messageSent = true;
        } catch (error) {
          console.warn(
            "❌ Errore invio sourceWindow con origin specifico:",
            error
          );
        }
      }

      // Aggiorna risultati in base al successo dell'invio
      if (messageSent) {
        showResult("Proof approvata e inviata", response.data);
      } else {
        showResult("Proof approvata (errore comunicazione)", {
          ...response.data,
          warning:
            "Il messaggio potrebbe non essere stato ricevuto dall'app richiedente",
          debugInfo: {
            hasSourceWindow: !!request.sourceWindow,
            hasOpener: !!window.opener,
            origin: request.origin,
          },
        });
      }

      // Rimuovi richiesta pendente
      setPendingProofRequests((prev) => {
        const next = new Map(prev);
        next.delete(requestId);
        return next;
      });
    } catch (error) {
      console.error("Errore generazione proof:", error);
      showResult("Errore generazione proof", { error: error.message });
    }
  };

  const rejectProofRequest = (requestId) => {
    const request = pendingProofRequests.get(requestId);
    if (!request) return;

    const response = {
      type: "shogun:proof-response",
      data: {
        requestId,
        success: false,
        error: "Richiesta rifiutata dall'utente",
      },
    };

    console.log("📤 Invio rifiuto proof:", response);

    let messageSent = false;

    // Tentativo 1: sourceWindow
    if (request.sourceWindow) {
      try {
        request.sourceWindow.postMessage(response, request.origin);
        console.log("✅ Rifiuto inviato tramite sourceWindow");
        messageSent = true;
      } catch (error) {
        console.warn("❌ Errore invio rifiuto tramite sourceWindow:", error);
      }
    }

    // Tentativo 2: window.opener
    if (!messageSent && window.opener && !window.opener.closed) {
      try {
        window.opener.postMessage(response, request.origin);
        console.log("✅ Rifiuto inviato tramite window.opener");
        messageSent = true;
      } catch (error) {
        console.warn("❌ Errore invio rifiuto tramite window.opener:", error);
      }
    }

    // Tentativo 3: sourceWindow con wildcard
    if (!messageSent && request.sourceWindow) {
      try {
        request.sourceWindow.postMessage(response, "*");
        console.log("✅ Rifiuto inviato tramite sourceWindow con wildcard");
        messageSent = true;
      } catch (error) {
        console.warn(
          "❌ Errore invio rifiuto sourceWindow con wildcard:",
          error
        );
      }
    }

    // Tentativo 4: window.opener con wildcard
    if (!messageSent && window.opener) {
      try {
        window.opener.postMessage(response, "*");
        console.log("✅ Rifiuto inviato tramite opener con wildcard origin");
        messageSent = true;
      } catch (error) {
        console.warn("❌ Errore invio rifiuto opener con wildcard:", error);
      }
    }

    setPendingProofRequests((prev) => {
      const next = new Map(prev);
      next.delete(requestId);
      return next;
    });

    if (messageSent) {
      showResult("Proof rifiutata e notificata", { requestId });
    } else {
      showResult("Proof rifiutata (errore comunicazione)", {
        requestId,
        warning:
          "Il rifiuto potrebbe non essere stato ricevuto dall'app richiedente",
        debugInfo: {
          hasSourceWindow: !!request.sourceWindow,
          hasOpener: !!window.opener,
          origin: request.origin,
        },
      });
    }
  };

  // Effects
  useEffect(() => {
    console.log("🎯 Aggiunto listener per messaggi");
    window.addEventListener("message", handleProofRequest);

    return () => {
      console.log("🎯 Rimosso listener per messaggi");
      window.removeEventListener("message", handleProofRequest);
    };
  }, [handleProofRequest]);

  // Focus su questa finestra quando arrivano richieste
  useEffect(() => {
    if (pendingProofRequests.size > 0) {
      console.log("🔔 Richieste pendenti - focus sulla finestra");
      window.focus();

      // Se c'è un titolo, aggiorna per mostrare le richieste pendenti
      const originalTitle = document.title;
      document.title = `🔔 ${pendingProofRequests.size} richieste - Shogun Auth`;

      return () => {
        document.title = originalTitle;
      };
    }
  }, [pendingProofRequests.size]);

  // Aggiungi messaggio quando sei pronto a ricevere richieste
  useEffect(() => {
    if (isLoggedIn && pendingProofRequests.size === 0) {
      console.log("🎯 Autenticato e pronto per richieste");

      // Invia un messaggio alla finestra genitore per dire che siamo pronti
      if (window.opener && !window.opener.closed) {
        try {
          window.opener.postMessage(
            {
              type: "shogun:ready",
              data: { authenticated: true, timestamp: Date.now() },
            },
            "*"
          );
          console.log("📢 Notificato stato di pronto all'app genitore");
        } catch (error) {
          console.warn("⚠️ Impossibile notificare stato pronto:", error);
        }
      }
    }
  }, [isLoggedIn, pendingProofRequests.size]);

  // UI Components
  const PendingProofRequests = () => {
    if (pendingProofRequests.size === 0) return null;

    return (
      <div className="proof-requests">
        <h3>🔐 Richieste Proof Pendenti</h3>
        {Array.from(pendingProofRequests.entries()).map(([id, request]) => (
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
              {request.requirements && (
                <div>
                  <strong>Requisiti:</strong>
                  <ul>
                    {request.requirements.authMethods && (
                      <li>
                        Metodi auth:{" "}
                        {request.requirements.authMethods.join(", ")}
                      </li>
                    )}
                    {request.requirements.hasAddress && (
                      <li>Richiede indirizzo wallet</li>
                    )}
                    {request.requirements.customClaims && (
                      <li>
                        Claims personalizzati:{" "}
                        {JSON.stringify(request.requirements.customClaims)}
                      </li>
                    )}
                  </ul>
                </div>
              )}
            </div>
            <div className="request-actions">
              <button
                onClick={() => approveProofRequest(id)}
                disabled={!isLoggedIn}
                title={
                  !isLoggedIn ? "Devi essere autenticato per approvare" : ""
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

  return (
    <div className="app">
      <div className="header">
        <h1 className="title">🥷 Shogun Auth</h1>
        <p className="subtitle">Sistema di autenticazione decentralizzato</p>
      </div>

      <div className="auth-status">
        <div
          className={`status-indicator ${
            isLoggedIn ? "authenticated" : "not-authenticated"
          }`}
        >
          {authStatus}
        </div>
      </div>

      {/* Sezione di aiuto quando autenticato ma nessuna richiesta */}
      {isLoggedIn && pendingProofRequests.size === 0 && (
        <div className="help-section">
          <h3>🎯 Pronto per le richieste!</h3>
          <p>Ora sei autenticato. Ecco cosa puoi fare:</p>
          <ul>
            <li>🔗 Apri un'app che richiede proof di autenticazione</li>
            <li>📱 Le richieste appariranno automaticamente qui</li>
            <li>✅ Potrai approvare o rifiutare ogni richiesta</li>
          </ul>
          <div className="demo-info">
            <p>
              <strong>Per testare:</strong>
            </p>
            <p>
              Apri <code>example-requesting-app.html</code> e clicca su "Request
              Authentication Proof"
            </p>
            <p>
              <strong>Oppure simula una richiesta:</strong>
            </p>
            <button
              onClick={simulateProofRequest}
              style={{
                background: "rgba(255, 255, 255, 0.2)",
                border: "1px solid rgba(255, 255, 255, 0.3)",
                color: "white",
                padding: "8px 16px",
                borderRadius: "6px",
                cursor: "pointer",
                fontSize: "0.9rem",
                marginTop: "8px",
                marginRight: "8px",
              }}
            >
              🧪 Simula Richiesta di Test
            </button>

            {window.opener && (
              <button
                onClick={requestRetry}
                style={{
                  background: "rgba(255, 255, 255, 0.2)",
                  border: "1px solid rgba(255, 255, 255, 0.3)",
                  color: "white",
                  padding: "8px 16px",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontSize: "0.9rem",
                  marginTop: "8px",
                }}
              >
                🔄 Richiedi Reinvio
              </button>
            )}

            {/* Informazioni di debug */}
            <div
              style={{ marginTop: "16px", fontSize: "0.85rem", opacity: "0.8" }}
            >
              <p>
                <strong>🔍 Debug Info:</strong>
              </p>
              <p>
                Opener:{" "}
                {window.opener ? "✅ Disponibile" : "❌ Non disponibile"}
              </p>
              <p>
                Parent:{" "}
                {window.parent !== window
                  ? "✅ In iframe"
                  : "❌ Finestra principale"}
              </p>
              <p>Origine: {window.location.origin}</p>
            </div>
          </div>
        </div>
      )}

      <PendingProofRequests />

      <div className="auth-section">
        <h2>🔐 Autenticazione</h2>
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
            <button onClick={handleLogin}>Login</button>
            <button onClick={handleSignUp}>Registrati</button>
            <button onClick={handleLogout}>Logout</button>
          </div>
        </div>
      </div>

      <div className="results-section">
        <h3>📊 Risultati</h3>
        <pre className="results-display">{results}</pre>
      </div>
    </div>
  );
}

export default App;
