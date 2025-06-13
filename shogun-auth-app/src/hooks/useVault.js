import { useState, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import Gun from 'gun';

export const useVault = (shogun, gunInstance) => {
  const [vaultStatus, setVaultStatus] = useState({
    isInitialized: false,
    keypair: null,
    error: null
  });

  const [storedProofs, setStoredProofs] = useState([]);
  const [pendingRequests, setPendingRequests] = useState(new Map());

  // Initialize vault from localStorage
  useEffect(() => {
    const storedKeypair = localStorage.getItem("shogun_vault_keypair");
    if (storedKeypair) {
      try {
        const keypair = JSON.parse(storedKeypair);
        setVaultStatus({
          isInitialized: true,
          keypair,
          error: null
        });
      } catch (error) {
        setVaultStatus(prev => ({
          ...prev,
          error: "Errore nel caricamento del vault"
        }));
      }
    }
  }, []);

  // Generate new keypair
  const generateKeypair = useCallback(async () => {
    if (!shogun) {
      setVaultStatus(prev => ({
        ...prev,
        error: "Shogun non inizializzato"
      }));
      return null;
    }

    try {
      // Use Gun.SEA directly instead of shogun.sea
      if (!Gun.SEA) {
        console.error("Gun.SEA not available");
        throw new Error("Gun.SEA not available");
      }

      // Add a timeout to fail gracefully
      const keypairPromise = Promise.race([
        Gun.SEA.pair(), // Use Gun.SEA instead of shogun.sea
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error("Timeout during keypair generation")), 5000)
        )
      ]);

      const keypair = await keypairPromise;
      
      if (!keypair || !keypair.pub || !keypair.priv) {
        throw new Error("Generated keypair is invalid");
      }

      console.log("Keypair generated successfully:", { pub: keypair.pub.substring(0, 15) + '...' });
      localStorage.setItem("shogun_vault_keypair", JSON.stringify(keypair));
      
      setVaultStatus({
        isInitialized: true,
        keypair,
        error: null
      });

      return keypair;
    } catch (error) {
      console.error("Error generating keypair:", error);
      setVaultStatus(prev => ({
        ...prev,
        error: `Errore nella generazione del keypair: ${error.message || 'Unknown error'}`
      }));
      return null;
    }
  }, [shogun]);

  // Load stored proofs
  const loadProofs = useCallback(async () => {
    if (!gunInstance || !vaultStatus.keypair) return;

    const user = gunInstance.user(vaultStatus.keypair);
    user.get('proofs').map().once((proof, id) => {
      if (proof && id !== '_') {
        setStoredProofs(prev => {
          if (!prev.some(p => p.id === id)) {
            return [...prev, { id, ...proof }];
          }
          return prev;
        });
      }
    });
  }, [gunInstance, vaultStatus.keypair]);

  // Generate new proof
  const generateProof = useCallback(async (request) => {
    if (!vaultStatus.keypair) {
      throw new Error("Vault non inizializzato");
    }
    
    try {
      const proofData = {
        type: "zk-proof",
        authMethod: request.type || "vault-signature",
        timestamp: Date.now(),
        requestingApp: request.requestingApp,
        data: await Gun.SEA.sign(`proof_${uuidv4()}`, vaultStatus.keypair),
        privacy: request.privacy || "zero_knowledge"
      };
      
      const user = gunInstance.user(vaultStatus.keypair);
      const proofId = uuidv4();
      
      user.get('proofs').get(proofId).put(proofData);
      
      setStoredProofs(prev => [...prev, { id: proofId, ...proofData }]);
      
      return {
        ...proofData,
        id: proofId
      };
    } catch (error) {
      console.error("Error generating proof:", error);
      throw new Error(`Errore nella generazione della proof: ${error.message || 'Unknown error'}`);
    }
  }, [gunInstance, vaultStatus.keypair]);

  // Verify proof
  const verifyProof = useCallback(async (proofId) => {
    if (!gunInstance || !vaultStatus.keypair) {
      return { verified: false, error: "Vault non inizializzato" };
    }
    
    try {
      const user = gunInstance.user(vaultStatus.keypair);
      
      return new Promise((resolve) => {
        user.get('proofs').get(proofId).once(async (proof) => {
          if (!proof) {
            resolve({ verified: false, error: "Proof non trovata" });
            return;
          }
          
          // Use Gun.SEA.verify instead of shogun.sea.verify
          const isValid = await Gun.SEA.verify(
            proof.data, 
            vaultStatus.keypair.pub
          );
          
          resolve({ 
            verified: !!isValid,
            proof,
            timestamp: new Date().toISOString()
          });
        });
      });
    } catch (error) {
      return { verified: false, error: error.message };
    }
  }, [gunInstance, vaultStatus.keypair]);

  // Handle proof requests
  const handleProofRequest = useCallback((event) => {
    // Filtra messaggi delle estensioni wallet
    if (event.data.target === "metamask-inpage" || 
        event.data.target === "enkrypt" ||
        event.data.type === "PassClientScriptReady" ||
        event.data.type === "PassIFrameReady") {
      return;
    }

    // Gestisci richiesta proof
    if (event.data.type === "shogun:proof-request" && event.data.data) {
      const request = {
        ...event.data.data,
        origin: event.origin,
        sourceWindow: event.source,
        timestamp: Date.now()
      };
      
      setPendingRequests(prev => new Map(prev.set(request.id, request)));
      
      // Invia conferma ricezione
      if (event.source) {
        try {
          event.source.postMessage({
            type: "shogun:request-received",
            data: { requestId: request.id, received: true }
          }, "*");
        } catch (error) {
          console.error("Errore conferma ricezione:", error);
        }
      }
    }
  }, []);

  // Approve proof request
  const approveProofRequest = useCallback(async (requestId) => {
    const request = pendingRequests.get(requestId);
    if (!request) return;

    try {
      const proof = await generateProof(request);
      
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
            vaultProofId: proof.id
          }
        }
      };

      try {
        if (request.sourceWindow) {
          request.sourceWindow.postMessage(response, "*");
        } else if (window.opener) {
          window.opener.postMessage(response, "*");
        } else {
          window.parent.postMessage(response, "*");
        }
      } catch (error) {
        console.error("Errore invio proof:", error);
      }

      setPendingRequests(prev => {
        const next = new Map(prev);
        next.delete(requestId);
        return next;
      });
    } catch (error) {
      console.error("Errore generazione proof:", error);
    }
  }, [generateProof, pendingRequests]);

  // Reject proof request
  const rejectProofRequest = useCallback((requestId) => {
    const request = pendingRequests.get(requestId);
    if (!request) return;

    try {
      const response = {
        type: "shogun:proof-response",
        data: {
          requestId,
          success: false,
          error: "Richiesta rifiutata dall'utente"
        }
      };

      try {
        if (request.sourceWindow) {
          request.sourceWindow.postMessage(response, "*");
        } else if (window.opener) {
          window.opener.postMessage(response, "*");
        } else {
          window.parent.postMessage(response, "*");
        }
      } catch (error) {
        console.error("Errore invio rifiuto:", error);
      }

      setPendingRequests(prev => {
        const next = new Map(prev);
        next.delete(requestId);
        return next;
      });
    } catch (error) {
      console.error("Errore rifiuto proof:", error);
    }
  }, [pendingRequests]);

  // Setup proof request listener
  useEffect(() => {
    window.addEventListener("message", handleProofRequest);
    return () => {
      window.removeEventListener("message", handleProofRequest);
    };
  }, [handleProofRequest]);

  return {
    vaultStatus,
    storedProofs,
    pendingRequests,
    generateKeypair,
    loadProofs,
    generateProof,
    verifyProof,
    approveProofRequest,
    rejectProofRequest
  };
}; 