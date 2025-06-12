import React, { useState, useEffect, useCallback } from "react";

const SHOGUN_AUTH_URL = "http://localhost:8080";

function App() {
  const [authStatus, setAuthStatus] = useState("waiting");
  const [proofResult, setProofResult] = useState(null);
  const [isRequesting, setIsRequesting] = useState(false);

  // Handle messages from auth popup
  const handleMessage = useCallback((event) => {
    console.log("🔍 Messaggio ricevuto (raw):", event);
    console.log("🔍 Origin:", event.origin);
    console.log("🔍 Data:", event.data);
    console.log("🔍 Source:", event.source);

    // Filtra solo messaggi Shogun
    if (!event.data || typeof event.data !== "object") {
      console.log("❌ Messaggio ignorato: dati non validi");
      return;
    }
    if (!event.data.type || !event.data.type.startsWith("shogun:")) {
      console.log("❌ Messaggio ignorato: non è un messaggio Shogun");
      return;
    }

    console.log("📩 Messaggio Shogun ricevuto dall'app auth:", event);

    const { type, data } = event.data;

    if (type === "shogun:proof-response") {
      console.log("🎯 Ricevuta risposta proof:", data);
      setIsRequesting(false);

      if (data.success) {
        setAuthStatus("verified");
        setProofResult(data);
        console.log("✅ Proof ricevuta con successo:", data);
      } else {
        setAuthStatus("failed");
        setProofResult({ error: data.error || "Richiesta rifiutata" });
        console.log("❌ Proof rifiutata:", data.error);
      }
    } else if (type === "shogun:ready") {
      console.log("🎯 App auth pronta per ricevere richieste");
    } else {
      console.log("ℹ️ Messaggio Shogun non gestito:", type);
    }
  }, []);

  // Setup message listener
  useEffect(() => {
    console.log("🎯 Aggiunto listener per messaggi nell'app example");

    // Listener temporaneo per tutti i messaggi (debug)
    const debugListener = (event) => {
      console.log("🔍 [DEBUG] Qualsiasi messaggio ricevuto:", {
        origin: event.origin,
        source: event.source,
        data: event.data,
        type: typeof event.data,
        hasType: event.data?.type,
      });
    };

    window.addEventListener("message", handleMessage);
    window.addEventListener("message", debugListener);

    return () => {
      console.log("🎯 Rimosso listener per messaggi nell'app example");
      window.removeEventListener("message", handleMessage);
      window.removeEventListener("message", debugListener);
    };
  }, [handleMessage]);

  const requestAuthProof = () => {
    setIsRequesting(true);
    setAuthStatus("waiting");
    setProofResult(null);

    const requestId = `req_${Date.now()}`;

    const proofRequest = {
      id: requestId,
      type: "authentication",
      requirements: {
        authMethods: ["password"],
      },
      requestingApp: {
        name: "Shogun Example App",
        description:
          "App dimostrativa per testare il sistema di autenticazione Shogun",
      },
      privacy: "zero_knowledge",
    };

    console.log("🚀 Apertura popup auth per richiesta:", proofRequest);

    // Apri popup con maggior controllo
    console.log("📤 Tentativo apertura popup su:", SHOGUN_AUTH_URL);
    const popup = window.open(
      SHOGUN_AUTH_URL,
      "shogun-auth",
      "width=600,height=700,scrollbars=yes,resizable=yes,location=yes,menubar=no,toolbar=no"
    );

    console.log("📤 Popup creato:", popup);
    console.log("📤 Popup closed immediatamente?:", popup?.closed);

    if (!popup) {
      console.error("❌ Popup non creato - probabilmente bloccato");
      setIsRequesting(false);
      setAuthStatus("failed");
      setProofResult({
        error:
          "Impossibile aprire il popup. Controlla se i popup sono bloccati dal browser.",
      });
      return;
    }

    // Controlla se il popup si chiude immediatamente (possibile blocco)
    setTimeout(() => {
      if (popup.closed) {
        console.error(
          "❌ Popup chiuso immediatamente - probabilmente bloccato o errore di caricamento"
        );
        setIsRequesting(false);
        setAuthStatus("failed");
        setProofResult({
          error:
            "Il popup si è chiuso immediatamente. Verifica che l'app auth sia in esecuzione su " +
            SHOGUN_AUTH_URL,
        });
        return;
      }

      console.log(
        "✅ Popup ancora aperto dopo 500ms, procedo con l'invio richiesta"
      );

      // Attendi che il popup sia caricato e invia la richiesta
      const sendRequest = () => {
        try {
          console.log("📤 Tentativo invio richiesta proof al popup...");
          console.log("📤 Target URL:", SHOGUN_AUTH_URL);
          console.log("📤 Popup riferimento:", popup);
          console.log("📤 Popup chiuso ora?:", popup.closed);

          if (popup.closed) {
            console.error("❌ Popup chiuso prima dell'invio della richiesta");
            setIsRequesting(false);
            setAuthStatus("failed");
            setProofResult({
              error: "Il popup si è chiuso prima di poter inviare la richiesta",
            });
            return;
          }

          popup.postMessage(
            {
              type: "shogun:proof-request",
              data: proofRequest,
            },
            SHOGUN_AUTH_URL
          );
          console.log("✅ Richiesta proof inviata al popup");
        } catch (error) {
          console.error("❌ Errore invio richiesta:", error);
          setIsRequesting(false);
          setAuthStatus("failed");
          setProofResult({
            error:
              "Errore nella comunicazione con l'app di autenticazione: " +
              error.message,
          });
        }
      };

      // Invia la richiesta dopo 2 secondi per dare tempo al caricamento
      setTimeout(sendRequest, 2000);
    }, 500);

    // Gestisci chiusura popup senza risposta
    const checkClosed = setInterval(() => {
      if (popup.closed) {
        clearInterval(checkClosed);
        if (isRequesting) {
          console.log("❌ Popup chiuso senza completare l'autenticazione");
          setIsRequesting(false);
          setAuthStatus("failed");
          setProofResult({
            error: "Popup chiuso senza completare l'autenticazione",
          });
        }
      }
    }, 1000);
  };

  const resetAuth = () => {
    setAuthStatus("waiting");
    setProofResult(null);
    setIsRequesting(false);
  };

  const getStatusDisplay = () => {
    switch (authStatus) {
      case "waiting":
        return (
          <span className="status waiting">In attesa di autenticazione</span>
        );
      case "verified":
        return (
          <span className="status verified">✅ Autenticato con successo</span>
        );
      case "failed":
        return <span className="status failed">❌ Autenticazione fallita</span>;
      default:
        return <span className="status waiting">Stato sconosciuto</span>;
    }
  };

  return (
    <div className="container">
      <h1>🥷 Shogun Example App</h1>
      <p>
        App dimostrativa per il sistema di autenticazione decentralizzato Shogun
      </p>

      <div className="info-box">
        <h4>🔍 Come funziona:</h4>
        <ol>
          <li>Clicca su "Richiedi Autenticazione" qui sotto</li>
          <li>Si aprirà un popup con l'app Shogun Auth</li>
          <li>Fai login nell'app di autenticazione (se non già fatto)</li>
          <li>Approva la richiesta di proof</li>
          <li>Il proof viene inviato a questa app</li>
        </ol>
      </div>

      <div className="auth-section">
        <h2>🔐 Autenticazione Semplice</h2>
        <p>
          Prova che sei autenticato nel sistema Shogun usando username e
          password.
        </p>

        <div>{getStatusDisplay()}</div>

        <div style={{ margin: "20px 0" }}>
          <button onClick={requestAuthProof} disabled={isRequesting}>
            {isRequesting
              ? "⏳ Richiesta in corso..."
              : "🔑 Richiedi Autenticazione"}
          </button>

          {authStatus !== "waiting" && (
            <button onClick={resetAuth}>🔄 Reset</button>
          )}
        </div>

        {proofResult && (
          <div className="proof-result">
            <h4>📋 Risultato:</h4>
            <pre>{JSON.stringify(proofResult, null, 2)}</pre>
          </div>
        )}
      </div>

      <div className="info-box">
        <h4>💡 Informazioni per sviluppatori:</h4>
        <p>
          Questa app dimostra il flusso di comunicazione cross-window con l'app
          Shogun Auth.
        </p>
        <p>Controlla la console del browser per vedere i messaggi di debug.</p>
        <p>
          <strong>URL App Auth:</strong> {SHOGUN_AUTH_URL}
        </p>
        <p>
          <strong>Protocollo:</strong> PostMessage API per comunicazione sicura
        </p>
      </div>
    </div>
  );
}

export default App;
