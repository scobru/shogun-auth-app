import React, { useState, useEffect, useCallback } from 'react'

// Wait for Gun.js to be available
const waitForGun = () => {
  return new Promise((resolve) => {
    if (typeof window.Gun !== 'undefined') {
      resolve(window.Gun)
      return
    }
    
    const checkGun = () => {
      if (typeof window.Gun !== 'undefined') {
        resolve(window.Gun)
      } else {
        setTimeout(checkGun, 100)
      }
    }
    
    checkGun()
  })
}

// Wait for Shogun Core to be available
const waitForShogun = () => {
  return new Promise((resolve) => {
    if (typeof window.initShogunBrowser !== 'undefined') {
      resolve(window.initShogunBrowser)
      return
    }
    
    const checkShogun = () => {
      if (typeof window.initShogunBrowser !== 'undefined') {
        resolve(window.initShogunBrowser)
      } else {
        setTimeout(checkShogun, 100)
      }
    }
    
    checkShogun()
  })
}

// Global state
let shogun
let gun

function App() {
  // State hooks replacing NoDom signals
  const [initialized, setInitialized] = useState(false)
  const [authStatus, setAuthStatus] = useState("❌ Not authenticated")
  const [userInfo, setUserInfo] = useState("")
  const [results, setResults] = useState("Results will appear here...")
  const [loading, setLoading] = useState(false)
  const [scriptsReady, setScriptsReady] = useState(false)

  // Plugin status
  const [webAuthnStatus, setWebAuthnStatus] = useState("NON INIZIALIZZATO")
  const [ethereumStatus, setEthereumStatus] = useState("NON INIZIALIZZATO")
  const [bitcoinStatus, setBitcoinStatus] = useState("NON INIZIALIZZATO")

  // Form data
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [webAuthnUsername, setWebAuthnUsername] = useState("")

  // Wallet state
  const [metamaskAddress, setMetamaskAddress] = useState("No wallet connected")
  const [nostrAddress, setNostrAddress] = useState("No wallet connected")

  // Relay management
  const [peerCount, setPeerCount] = useState(0)
  const [peersList, setPeersList] = useState("No peers configured")
  const [newPeerUrl, setNewPeerUrl] = useState("")

  // Proof requests
  const [pendingProofRequests, setPendingProofRequests] = useState(new Set())

  // Plugin references
  let webauthnPlugin
  let ethereumPlugin
  let bitcoinPlugin

  // Utility functions
  const showResult = useCallback((title, data) => {
    const resultText = `${title}\n\n${JSON.stringify(data, null, 2)}`
    setResults(resultText)
  }, [])

  const showError = useCallback((title, error) => {
    const errorText = `${title} - ERRORE\n\n${error.message || error}`
    setResults(errorText)
    console.error(error)
  }, [])

  // Helper functions to extract clean addresses
  const extractAddress = (addressString) => {
    if (!addressString || addressString === "No wallet connected") {
      return null
    }
    if (addressString.startsWith("Indirizzo: ")) {
      return addressString.replace("Indirizzo: ", "").trim()
    }
    return addressString.trim()
  }

  const getCleanEthereumAddress = () => extractAddress(metamaskAddress)
  const getCleanBitcoinAddress = () => extractAddress(nostrAddress)

  // Check support functions
  const checkWebAuthnSupport = useCallback(() => {
    if (!webauthnPlugin) {
      setWebAuthnStatus("NON INIZIALIZZATO")
      return false
    }

    try {
      const browserSupported = typeof window.PublicKeyCredential !== "undefined"
      const pluginSupported = webauthnPlugin.isSupported()
      const isSupported = browserSupported && pluginSupported

      if (isSupported) {
        setWebAuthnStatus("SUPPORTATO")
      } else if (browserSupported && !pluginSupported) {
        setWebAuthnStatus("PLUGIN ERROR")
      } else {
        setWebAuthnStatus("NON SUPPORTATO")
      }

      return isSupported
    } catch (error) {
      console.error("Errore durante il controllo del supporto WebAuthn:", error)
      setWebAuthnStatus("ERRORE")
      return false
    }
  }, [webauthnPlugin])

  const checkEthereumSupport = useCallback(() => {
    if (!ethereumPlugin) {
      setEthereumStatus("NON INIZIALIZZATO")
      return false
    }

    try {
      const isAvailable = typeof window.ethereum !== "undefined"
      setEthereumStatus(isAvailable ? "RILEVATO" : "NON RILEVATO")
      return isAvailable
    } catch (error) {
      console.error("Errore durante il controllo del supporto Ethereum:", error)
      setEthereumStatus("ERRORE")
      return false
    }
  }, [ethereumPlugin])

  const checkBitcoinSupport = useCallback(() => {
    if (!bitcoinPlugin) {
      setBitcoinStatus("NON INIZIALIZZATO")
      return false
    }

    try {
      const nostrAvailable = typeof window.nostr !== "undefined"
      let pluginNostrAvailable = false
      if (typeof bitcoinPlugin.isNostrExtensionAvailable === "function") {
        pluginNostrAvailable = bitcoinPlugin.isNostrExtensionAvailable()
      }

      const isAvailable = nostrAvailable || pluginNostrAvailable || true
      const supportText = isAvailable
        ? nostrAvailable || pluginNostrAvailable
          ? "Nostr"
          : "Manuale"
        : "NON DISPONIBILE"

      setBitcoinStatus(supportText)
      return isAvailable
    } catch (error) {
      console.error("Errore durante il controllo del supporto Bitcoin:", error)
      setBitcoinStatus("ERRORE")
      return false
    }
  }, [bitcoinPlugin])

  const updateAuthenticationStatus = useCallback(() => {
    if (!shogun) {
      setAuthStatus("❌ Not authenticated")
      setUserInfo("")
      return
    }

    const isLoggedIn = shogun.isLoggedIn()
    const authMethod = typeof shogun.getAuthMethod === "function" ? shogun.getAuthMethod() : null

    const hasSessionData = sessionStorage.getItem("gun/") ||
      sessionStorage.getItem("gun/user") ||
      sessionStorage.getItem("gun/auth")

    if (isLoggedIn) {
      let statusText = "✅ Authenticated"
      if (authMethod) {
        statusText += ` (${authMethod})`
      }
      setAuthStatus(statusText)

      const user = shogun.gun.user()
      if (user && user.is && user.is.alias) {
        const userInfoText = `User: ${user.is.alias}\n\nPublic Key:\n${user.is.pub}`
        setUserInfo(userInfoText)
      } else {
        setUserInfo("")
      }
    } else if (hasSessionData) {
      setAuthStatus("🔄 Session Active (checking...)")
      setUserInfo("")
    } else {
      setAuthStatus("❌ Not authenticated")
      setUserInfo("")
    }
  }, [])

  // Initialize Shogun
  const handleInitialize = async () => {
    try {
      console.log("🚀 Starting Shogun initialization...")
      setLoading(true)

      // Check if already initialized
      if (shogun && initialized) {
        console.log("⚠️ Shogun already initialized")
        showResult("Già Inizializzato", {
          message: "Shogun è già stato inizializzato",
          status: "warning"
        })
        return
      }

      console.log("⏳ Waiting for Gun.js to load...")
      const Gun = await waitForGun()
      console.log("✅ Gun.js loaded successfully")

      console.log("⏳ Waiting for Shogun Core to load...")
      const initShogunBrowser = await waitForShogun()
      console.log("✅ Shogun Core loaded successfully")

      console.log("✅ All dependencies loaded")

      let peer = "http://localhost:8765/gun"

      const options = {
        peers: [peer],
        localStorage: false,
        radisk: false,
      }

      const config = {
        gunInstance: new Gun(options),
        peers: [peer],
        webauthn: {
          enabled: true,
          rpName: "Shogun Demo",
          rpId: window.location.hostname,
        },
        web3: {
          enabled: true,
        },
        nostr: {
          enabled: true,
          network: "mainnet",
          defaultWalletType: "nostr",
        },
        logging: {
          enabled: true,
          level: "debug",
          prefix: "[Shogun Demo]",
        },
      }

      showResult("Inizializzazione", {
        message: "Inizializzazione in corso...",
        status: "processing",
      })

      console.log("🔧 Creating Shogun instance...")
      try {
        shogun = initShogunBrowser(config)
        console.log("✅ Shogun instance created")
      } catch (shogunError) {
        console.error("❌ Error creating Shogun instance:", shogunError)
        throw new Error(`Failed to create Shogun instance: ${shogunError.message}`)
      }

      gun = shogun.gun

      try {
        const attachTokenHandlers = (gunInstance, label) => {
          gunInstance.on("out", function (msg) {
            var to = this.to
            
            if (!msg.headers) msg.headers = {}
            
            msg.headers.token = "shogun2025"
            msg.token = "shogun2025"
            msg.headers.Authorization = "Bearer shogun2025"
            
            console.log(`📤 ${label} - Token attached to outgoing message:`, {
              type: msg.put ? 'PUT' : msg.get ? 'GET' : 'OTHER',
              hasToken: !!msg.token,
              isUserAuth: msg.put && Object.keys(msg.put).some(key => key.startsWith('~@'))
            })
            
            to.next(msg)
          })
        }

        attachTokenHandlers(shogun.gun, "Shogun")
        attachTokenHandlers(gun, "Window")

        console.log("✅ Enhanced Gun event handlers attached")
      } catch (gunError) {
        console.warn("⚠️ Warning: Could not attach Gun event handlers:", gunError)
      }

      try {
        webauthnPlugin = shogun.getPlugin("webauthn")
        bitcoinPlugin = shogun.getPlugin("nostr")
        ethereumPlugin = shogun.getPlugin("web3")
        console.log("✅ Plugin references obtained")
      } catch (pluginError) {
        console.warn("⚠️ Warning: Could not get all plugin references:", pluginError)
      }

      let webauthnSupported = false
      let ethereumSupported = false
      let bitcoinSupported = false

      try {
        webauthnSupported = checkWebAuthnSupport()
        ethereumSupported = checkEthereumSupport()
        bitcoinSupported = checkBitcoinSupport()
        console.log("✅ Support checks completed")
      } catch (supportError) {
        console.warn("⚠️ Warning: Error during support checks:", supportError)
      }

      window.shogun = shogun
      console.log("✅ Shogun initialized and exposed globally")

      setInitialized(true)
      updateAuthenticationStatus()

      showResult("Shogun Inizializzato", {
        stato: "Successo",
        connesso: true,
        webauthn: webauthnSupported || false,
        web3: ethereumSupported || false,
        nostr: bitcoinSupported || false,
        plugins: {
          webauthn: !!webauthnPlugin,
          web3: !!ethereumPlugin,
          nostr: !!bitcoinPlugin,
        },
        timestamp: new Date().toISOString(),
      })

      setTimeout(() => {
        updatePeersList()
      }, 500)

      console.log("🎉 Shogun initialization completed successfully")
    } catch (error) {
      console.error("💥 Fatal error in handleInitialize:", error)
      showError("Inizializzazione", error)
      throw error
    } finally {
      setLoading(false)
      console.log("🔄 handleInitialize finally block executed")
    }
  }

  // Wallet connection handlers
  const handleConnectEthereum = async () => {
    try {
      if (!ethereumPlugin) {
        showError("MetaMask", new Error("Plugin Ethereum non disponibile"))
        return
      }

      setLoading(true)
      showResult("MetaMask", { message: "Connessione in corso..." })

      const result = await ethereumPlugin.connectMetaMask()

      if (result.success) {
        setMetamaskAddress(`Indirizzo: ${result.address}`)
        showResult("MetaMask Connesso", result)
      } else {
        showError("MetaMask", new Error(result.error || "Errore durante la connessione"))
      }
    } catch (error) {
      showError("MetaMask", error)
    } finally {
      setLoading(false)
    }
  }

  const handleConnectBitcoin = async () => {
    try {
      if (!bitcoinPlugin) {
        showError("Bitcoin Wallet", new Error("Plugin Bitcoin non disponibile"))
        return
      }

      setLoading(true)
      showResult("Bitcoin Wallet", { message: "Connessione in corso..." })

      const result = await bitcoinPlugin.connectBitcoinWallet("nostr")

      if (result.success) {
        setNostrAddress(`Indirizzo: ${result.address}`)
        showResult("Bitcoin Wallet Connesso", result)
      } else {
        showError("Bitcoin Wallet", new Error(result.error || "Errore durante la connessione"))
      }
    } catch (error) {
      showError("Bitcoin Wallet", error)
    } finally {
      setLoading(false)
    }
  }

  // Traditional auth handlers
  const handleLogin = async () => {
    if (!username || !password) {
      showError("Login", new Error("Username e password sono richiesti!"))
      return
    }

    try {
      setLoading(true)
      const result = await shogun.login(username, password)

      if (result.success) {
        showResult("Login completato", result)
        updateAuthenticationStatus()
        setUsername("")
        setPassword("")
      } else {
        showError("Login", new Error(result.error || "Login fallito"))
      }
    } catch (error) {
      showError("Login", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSignUp = async () => {
    if (!username || !password) {
      showError("Registrazione", new Error("Username e password sono richiesti!"))
      return
    }

    try {
      setLoading(true)
      const result = await shogun.signUp(username, password)

      if (result.success) {
        showResult("Registrazione completata", {
          ...result,
          message: "✅ Utente registrato con successo! Login automatico completato.",
          username: username,
          timestamp: new Date().toISOString(),
        })
        updateAuthenticationStatus()
        setUsername("")
        setPassword("")
      } else {
        if (result.error && result.error.includes("already exists")) {
          showResult("⚠️ Utente Già Esistente", {
            success: false,
            error: result.error,
            suggestion: "Questo username è già registrato. Prova a effettuare il login invece.",
            action: "login",
            username: username,
            timestamp: new Date().toISOString(),
          })
        } else {
          showError("Registrazione", new Error(result.error || "Registrazione fallita"))
        }
      }
    } catch (error) {
      showError("Registrazione", error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    if (!shogun) {
      showError("Logout", new Error("Shogun non è stato inizializzato!"))
      return
    }

    try {
      if (!shogun.isLoggedIn()) {
        showResult("Logout", {
          success: true,
          message: "Nessun utente connesso, logout non necessario",
        })
        return
      }

      shogun.logout()

      setMetamaskAddress("No wallet connected")
      setNostrAddress("No wallet connected")
      setUsername("")
      setPassword("")
      setWebAuthnUsername("")

      try {
        localStorage.removeItem("bitcoin_user_alias")
        localStorage.removeItem("auth_attempt")
        localStorage.removeItem("auth_reload")
        localStorage.removeItem("is_authenticated")
        localStorage.removeItem("current_user")
      } catch (localStorageError) {
        console.warn("Could not clear localStorage:", localStorageError)
      }

      setTimeout(() => {
        checkWebAuthnSupport()
        checkEthereumSupport()
        checkBitcoinSupport()
        updateAuthenticationStatus()
      }, 100)

      showResult("Logout Completato", {
        success: true,
        message: "Disconnessione completata con successo",
        timestamp: new Date().toISOString(),
      })
    } catch (error) {
      showError("Logout", error)
    }
  }

  const clearAllStorage = () => {
    try {
      const localStorageKeys = []
      const sessionStorageKeys = []

      for (let i = 0; i < localStorage.length; i++) {
        localStorageKeys.push(localStorage.key(i))
      }

      for (let i = 0; i < sessionStorage.length; i++) {
        sessionStorageKeys.push(sessionStorage.key(i))
      }

      localStorage.clear()
      sessionStorage.clear()

      if (bitcoinPlugin) {
        try {
          bitcoinPlugin.clearSignatureCache()
        } catch (bitcoinCacheError) {
          console.warn("Could not clear Bitcoin signature cache:", bitcoinCacheError)
        }
      }

      setMetamaskAddress("No wallet connected")
      setNostrAddress("No wallet connected")
      setUsername("")
      setPassword("")
      setWebAuthnUsername("")

      setTimeout(() => {
        checkWebAuthnSupport()
        checkEthereumSupport()
        checkBitcoinSupport()
        updateAuthenticationStatus()
      }, 100)

      showResult("Storage Pulito", {
        success: true,
        message: "Tutti i dati di storage sono stati cancellati",
        cleared: {
          localStorage: localStorageKeys,
          sessionStorage: sessionStorageKeys,
          totalKeys: localStorageKeys.length + sessionStorageKeys.length,
        },
        timestamp: new Date().toISOString(),
      })
    } catch (error) {
      showError("Pulizia Storage", error)
    }
  }

  // Relay management functions
  const updatePeersList = () => {
    if (!shogun || !shogun.gundb) {
      setPeersList("Shogun not initialized")
      setPeerCount(0)
      return
    }

    try {
      const peerInfo = shogun.gundb.getPeerInfo()
      const peerEntries = Object.entries(peerInfo)

      setPeerCount(peerEntries.length)

      if (peerEntries.length === 0) {
        setPeersList("No peers configured")
        return
      }

      const peerListHtml = peerEntries
        .map(([peer, info]) => {
          const statusIcon = info.connected ? "🟢" : "🔴"
          const statusText = info.connected ? "Connected" : "Disconnected"

          return `
            <div class="peer-item ${info.connected ? "peer-connected" : "peer-disconnected"}">
              <div class="peer-status">
                <span class="peer-status-icon">${statusIcon}</span>
                <span class="peer-status-text">${statusText}</span>
              </div>
              <div class="peer-url">
                <code>${peer}</code>
              </div>
            </div>
          `
        })
        .join("")

      setPeersList(peerListHtml)
    } catch (error) {
      console.error("Error updating peers list:", error)
      setPeersList("Error loading peers")
      setPeerCount(0)
    }
  }

  const fillPeerUrl = (url) => {
    setNewPeerUrl(url)
    showResult("Peer URL", { message: `URL impostato: ${url}` })
  }

  const handleAddPeer = async () => {
    if (!shogun || !shogun.gundb) {
      showError("Add Peer", new Error("Shogun not initialized"))
      return
    }

    const peerUrl = newPeerUrl.trim()
    if (!peerUrl) {
      showError("Add Peer", new Error("Please enter a peer URL"))
      return
    }

    try {
      new URL(peerUrl)
    } catch (error) {
      showError("Add Peer", new Error("Invalid URL format"))
      return
    }

    try {
      setLoading(true)

      const existingPeers = shogun.gundb.getAllConfiguredPeers()
      if (existingPeers.includes(peerUrl)) {
        showResult("Add Peer", {
          success: false,
          message: "Peer already configured",
          peer: peerUrl,
          suggestion: "Try reconnecting to the peer instead",
        })
        return
      }

      shogun.gundb.addPeer(peerUrl)
      setNewPeerUrl("")

      setTimeout(() => {
        updatePeersList()
        showResult("Peer Added", {
          success: true,
          peer: peerUrl,
          message: "Peer added successfully",
          timestamp: new Date().toISOString(),
        })
      }, 1000)
    } catch (error) {
      showError("Add Peer", error)
    } finally {
      setLoading(false)
    }
  }

  // Proof request handling
  const listenForProofRequests = useCallback(() => {
    const handleMessage = async (event) => {
      try {
        const { type, data } = event.data

        if (type === 'shogun:proof-request') {
          console.log('📨 Received proof request from:', event.origin)
          await handleIncomingProofRequest(data, event.origin)
        }
      } catch (error) {
        console.error('Error handling proof request:', error)
      }
    }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [])

  const handleIncomingProofRequest = async (request, origin) => {
    const newRequest = {
      ...request,
      origin,
      timestamp: Date.now()
    }

    setPendingProofRequests(prev => new Set([...prev, newRequest]))

    showResult("📨 Proof Request", {
      message: `New proof request from ${request.requestingApp.name}`,
      requestId: request.id,
      type: request.type,
      requirements: request.requirements,
      privacy: request.privacy,
      origin: origin,
      timestamp: new Date().toISOString()
    })
  }

  const approveProofRequest = async (requestId, origin) => {
    const requestsArray = Array.from(pendingProofRequests)
    const request = requestsArray.find(r => r.id === requestId)
    if (!request) {
      showResult("❌ Error", { message: "Proof request not found" })
      return
    }

    try {
      const proof = await generateProofForRequest(request)

      const targetWindow = window.opener || window.parent
      if (targetWindow) {
        targetWindow.postMessage({
          type: 'shogun:proof-response',
          data: {
            requestId: requestId,
            success: true,
            proof: proof,
            metadata: {
              generatedAt: Date.now(),
              expiresAt: Date.now() + (60 * 60 * 1000)
            }
          }
        }, origin)
      }

      setPendingProofRequests(prev => new Set(Array.from(prev).filter(r => r.id !== requestId)))

      showResult("✅ Proof Sent", {
        message: `Proof successfully sent to ${request.requestingApp.name}`,
        requestId: requestId,
        proofType: proof.type,
        timestamp: new Date().toISOString()
      })

    } catch (error) {
      console.error('Error generating proof:', error)
      showResult("❌ Error", { 
        message: `Failed to generate proof: ${error.message}`,
        requestId: requestId 
      })
    }
  }

  const generateProofForRequest = async (request) => {
    if (!shogun || !shogun.isLoggedIn()) {
      throw new Error("Please login first to generate proofs")
    }

    const authMethod = shogun.getAuthMethod()

    switch (request.privacy) {
      case 'zero_knowledge':
        return await generateZKProof(request, authMethod)
      case 'selective_disclosure':
        return await generateSelectiveDisclosureProof(request, authMethod)
      case 'full_disclosure':
        return await generateFullDisclosureProof(request, authMethod)
      default:
        throw new Error(`Unsupported privacy level: ${request.privacy}`)
    }
  }

  const generateZKProof = async (request, authMethod) => {
    const proofData = {
      type: request.type,
      hasRequiredAuth: request.requirements.authMethods ? 
        request.requirements.authMethods.includes(authMethod) : true,
      timestamp: Date.now()
    }

    const proofString = JSON.stringify(proofData)
    const proof = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(proofString))
    const proofHex = Array.from(new Uint8Array(proof))
      .map(b => b.toString(16).padStart(2, '0')).join('')

    return {
      type: 'zk-proof',
      data: proofHex,
      publicSignals: [request.type, Date.now().toString()],
      verificationKey: "shogun_zk_vk_" + authMethod
    }
  }

  const generateSelectiveDisclosureProof = async (request, authMethod) => {
    const disclosedAttributes = {}

    if (request.requirements.authMethods) {
      disclosedAttributes.authMethodSupported = 
        request.requirements.authMethods.includes(authMethod)
    }

    if (request.requirements.hasAddress && authMethod === 'web3') {
      disclosedAttributes.hasEthereumAddress = true
    }

    if (request.requirements.hasAddress && authMethod === 'nostr') {
      disclosedAttributes.hasBitcoinAddress = true
    }

    return {
      type: 'selective-disclosure',
      data: JSON.stringify(disclosedAttributes),
      attributes: Object.keys(disclosedAttributes)
    }
  }

  const generateFullDisclosureProof = async (request, authMethod) => {
    const userData = {
      authMethod: authMethod,
      userPub: shogun.user?.is?.pub,
      hasValidSession: shogun.isLoggedIn(),
      timestamp: Date.now()
    }

    return {
      type: 'full-disclosure',
      data: JSON.stringify(userData),
      userData: userData
    }
  }

  const rejectProofRequest = (requestId) => {
    const requestsArray = Array.from(pendingProofRequests)
    const request = requestsArray.find(r => r.id === requestId)
    if (!request) return

    const targetWindow = window.opener || window.parent
    if (targetWindow) {
      targetWindow.postMessage({
        type: 'shogun:proof-response',
        data: {
          requestId: requestId,
          success: false,
          error: "User rejected proof request"
        }
      }, request.origin)
    }

    setPendingProofRequests(prev => new Set(Array.from(prev).filter(r => r.id !== requestId)))

    showResult("❌ Proof Rejected", {
      message: `Proof request from ${request.requestingApp.name} was rejected`,
      requestId: requestId,
      timestamp: new Date().toISOString()
    })
  }

  // Effects
  useEffect(() => {
    const cleanup = listenForProofRequests()
    
    // Show welcome message
    setTimeout(() => {
      showResult("Benvenuto", {
        message: "🥷 Benvenuto in Shogun Auth - React Edition!",
        instructions: "Le librerie si stanno caricando... Se tutto è pronto, clicca su 'Initialize Shogun'",
        features: [
          "🔐 Autenticazione tradizionale",
          "🔑 WebAuthn biometrico", 
          "🦊 Wallet Ethereum",
          "₿ Wallet Bitcoin",
          "⚡ Reattività con React",
        ],
        timestamp: new Date().toISOString(),
      })
    }, 500)

    return cleanup
  }, [listenForProofRequests])

  // Auto-initialize when dependencies are ready
  useEffect(() => {
    const autoInit = async () => {
      try {
        // Wait a bit for scripts to load
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        // Check if dependencies are available
        if (typeof window.Gun !== 'undefined' && typeof window.initShogunBrowser !== 'undefined') {
          console.log("🎯 Dependencies detected, ready for initialization...")
          
          showResult("Dependencies Ready", {
            message: "🎉 Gun.js e Shogun Core sono stati caricati!",
            instructions: "Clicca su 'Initialize Shogun' per iniziare",
            gun: typeof window.Gun !== 'undefined',
            shogun: typeof window.initShogunBrowser !== 'undefined',
            timestamp: new Date().toISOString(),
          })
        } else {
          showResult("Loading Dependencies", {
            message: "⏳ Aspettando il caricamento delle librerie...",
            gun: typeof window.Gun !== 'undefined',
            shogun: typeof window.initShogunBrowser !== 'undefined',
            suggestion: "Se il caricamento richiede troppo tempo, ricarica la pagina",
            timestamp: new Date().toISOString(),
          })
        }
      } catch (error) {
        console.error("Error in auto-init:", error)
      }
    }

    // Listen for scripts ready event
    const handleScriptsReady = () => {
      console.log("📡 Received scriptsReady event")
      setScriptsReady(true)
      autoInit()
    }

    window.addEventListener('scriptsReady', handleScriptsReady)
    
    // Also run autoInit on mount (in case scripts are already loaded)
    autoInit()

    return () => {
      window.removeEventListener('scriptsReady', handleScriptsReady)
    }
  }, [])

  // Components
  const AppHeader = () => (
    <div className="app-header">
      <h1 className="app-title">🥷 Shogun Auth</h1>
      <p className="app-subtitle">Secure authentication with React</p>
    </div>
  )

  const getStatusBadgeClass = (status) => {
    if (status === "SUPPORTATO" || status === "RILEVATO") return "status-badge status-supported"
    if (status === "NON INIZIALIZZATO" || status === "PLUGIN ERROR") return "status-badge status-warning"
    return "status-badge status-not-supported"
  }

  const getAuthStatusClass = (status) => {
    if (status.includes("✅")) return "status-indicator status-success"
    if (status.includes("🔄")) return "status-indicator status-warning"
    return "status-indicator status-error"
  }

  const InitializationSection = () => {
    const gunLoaded = typeof window.Gun !== 'undefined'
    const shogunLoaded = typeof window.initShogunBrowser !== 'undefined'
    const allReady = gunLoaded && shogunLoaded

    return (
      <div className="action-group fade-in">
        <h2>⚡ Inizializzazione</h2>
        <p>Initialize the Shogun SDK and test connections</p>

        <div className="user-status-display" style={{ marginBottom: "var(--spacing-md)" }}>
          <div className="status-row">
            <strong>Gun.js: </strong>
            <span className={gunLoaded ? "status-indicator status-success" : "status-indicator status-error"}>
              {gunLoaded ? "✅ Loaded" : "⏳ Loading..."}
            </span>
          </div>
          <div className="status-row">
            <strong>Shogun Core: </strong>
            <span className={shogunLoaded ? "status-indicator status-success" : "status-indicator status-error"}>
              {shogunLoaded ? "✅ Loaded" : "⏳ Loading..."}
            </span>
          </div>
          <div className="status-row">
            <strong>Ready Status: </strong>
            <span className={allReady ? "status-indicator status-success" : "status-indicator status-warning"}>
              {allReady ? "✅ All dependencies ready" : "⏳ Waiting for scripts..."}
            </span>
          </div>
          <div className="status-row">
            <strong>Shogun Status: </strong>
            <span className={initialized ? "status-indicator status-success" : "status-indicator status-warning"}>
              {initialized ? "✅ Initialized" : "❌ Not initialized"}
            </span>
          </div>
        </div>

        <div className="form-actions">
          <button
            className={`primary-button ${loading ? "disabled" : ""}`}
            onClick={handleInitialize}
            disabled={loading || !allReady}
            type="button"
          >
            {loading ? (
              <>
                <span className="loading"></span>
                Initializing...
              </>
            ) : initialized ? (
              "✅ Re-initialize"
            ) : !allReady ? (
              "⏳ Waiting for dependencies..."
            ) : (
              "Initialize Shogun"
            )}
          </button>

          <button
            className="action-button warning-button"
            onClick={clearAllStorage}
            type="button"
          >
            🗑️ Clear Storage
          </button>
        </div>

        <div className="user-status-display">
          <div className="status-row">
            <strong>Auth Status: </strong>
            <span className={getAuthStatusClass(authStatus)}>
              {authStatus}
            </span>
          </div>
          {userInfo && (
            <div className="user-info">
              {userInfo}
            </div>
          )}
        </div>
      </div>
    )
  }

  const TraditionalAuthSection = () => (
    <div className="action-group fade-in">
      <h2>🔐 Username & Password</h2>
      <p>Traditional authentication method</p>

      <form onSubmit={(e) => e.preventDefault()}>
        <div className="form-group">
          <input
            type="text"
            placeholder="Enter your username"
            autoComplete="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
        </div>
        <div className="form-group">
          <input
            type="password"
            placeholder="Enter your password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <div className="form-actions">
          <button
            className={`primary-button ${loading ? "disabled" : ""}`}
            onClick={handleLogin}
            disabled={loading}
            type="button"
          >
            Sign In
          </button>
          <button
            className={`action-button ${loading ? "disabled" : ""}`}
            onClick={handleSignUp}
            disabled={loading}
            type="button"
          >
            Sign Up
          </button>
          <button
            className="action-button"
            onClick={handleLogout}
            type="button"
          >
            Sign Out
          </button>
        </div>
      </form>
    </div>
  )

  const WebAuthnSection = () => (
    <div className="action-group fade-in">
      <h3>
        🔑 WebAuthn
        <span className={getStatusBadgeClass(webAuthnStatus)}>
          {webAuthnStatus}
        </span>
      </h3>
      <p>Biometric and hardware key authentication</p>

      <form onSubmit={(e) => e.preventDefault()}>
        <div className="form-group">
          <input
            type="text"
            placeholder="Username for WebAuthn"
            autoComplete="username"
            value={webAuthnUsername}
            onChange={(e) => setWebAuthnUsername(e.target.value)}
          />
        </div>
        <div className="form-actions">
          <button
            className={`primary-button ${loading ? "disabled" : ""}`}
            disabled={webAuthnStatus !== "SUPPORTATO" || loading}
            onClick={async () => {
              // WebAuthn login implementation
            }}
            type="button"
          >
            {loading ? "Signing In..." : "Sign In"}
          </button>
          <button
            className={`action-button ${loading ? "disabled" : ""}`}
            disabled={webAuthnStatus !== "SUPPORTATO" || loading}
            onClick={async () => {
              // WebAuthn register implementation
            }}
            type="button"
          >
            {loading ? "Registering..." : "Register"}
          </button>
        </div>
      </form>
    </div>
  )

  const EthereumSection = () => (
    <div className="action-group fade-in">
      <h3>
        🦊 Wallet Ethereum
        <span className={getStatusBadgeClass(ethereumStatus)}>
          {ethereumStatus}
        </span>
      </h3>
      <p>Connect with MetaMask or other Ethereum wallets</p>

      <div className={metamaskAddress === "No wallet connected" ? "user-id empty" : "user-id"}>
        {metamaskAddress}
      </div>

      <div className="form-actions">
        <button
          className="action-button"
          disabled={ethereumStatus !== "RILEVATO"}
          onClick={handleConnectEthereum}
          type="button"
        >
          Connect Wallet
        </button>
        <button
          className="primary-button"
          disabled={ethereumStatus !== "RILEVATO"}
          onClick={async () => {
            // Ethereum login implementation
          }}
          type="button"
        >
          Sign In
        </button>
        <button
          className="action-button"
          disabled={ethereumStatus !== "RILEVATO"}
          onClick={async () => {
            // Ethereum signup implementation
          }}
          type="button"
        >
          Register
        </button>
      </div>
    </div>
  )

  const BitcoinSection = () => (
    <div className="action-group fade-in">
      <h3>
        ₿ Bitcoin Wallet
        <span className={getStatusBadgeClass(bitcoinStatus)}>
          {bitcoinStatus}
        </span>
      </h3>
      <p>Connect with Nostr extension</p>

      <div className={nostrAddress === "No wallet connected" ? "user-id empty" : "user-id"}>
        {nostrAddress}
      </div>

      <div className="form-actions">
        <button
          className="action-button"
          disabled={bitcoinStatus === "NON INIZIALIZZATO"}
          onClick={handleConnectBitcoin}
          type="button"
        >
          Connect Wallet
        </button>
        <button
          className="primary-button"
          disabled={bitcoinStatus === "NON INIZIALIZZATO"}
          onClick={async () => {
            // Bitcoin login implementation
          }}
          type="button"
        >
          Sign In
        </button>
        <button
          className="action-button"
          disabled={bitcoinStatus === "NON INIZIALIZZATO"}
          onClick={async () => {
            // Bitcoin signup implementation
          }}
          type="button"
        >
          Register
        </button>
      </div>
    </div>
  )

  const ProofRequestSection = () => {
    const requests = Array.from(pendingProofRequests)

    return (
      <div className="action-group proof-requests">
        <h2>📨 Proof Requests</h2>
        <p style={{ color: "var(--text-secondary)", marginBottom: "var(--spacing-md)" }}>
          Handle authentication proof requests from other Shogun apps
        </p>

        {requests.length === 0 ? (
          <div className="no-requests">
            No pending proof requests. When another Shogun app needs to verify your identity, requests will appear here.
          </div>
        ) : (
          <div className="requests-list">
            {requests.map(request => (
              <div
                key={request.id}
                className="proof-request-item"
                style={{
                  border: "1px solid var(--border-color)",
                  borderRadius: "var(--radius-small)",
                  padding: "var(--spacing-md)",
                  marginBottom: "var(--spacing-md)"
                }}
              >
                <div className="request-header">
                  <h4>🔐 {request.requestingApp.name}</h4>
                  <span className="request-type">{request.type}</span>
                </div>
                <p style={{ color: "var(--text-secondary)", margin: "var(--spacing-sm) 0" }}>
                  {request.requestingApp.description || "Requesting proof of identity"}
                </p>
                <div className="request-details">
                  <strong>Privacy Level: </strong>
                  <span
                    className={
                      request.privacy === 'zero_knowledge' ? 'status-supported' :
                      request.privacy === 'selective_disclosure' ? 'status-warning' : 'status-not-supported'
                    }
                    style={{ padding: "2px 8px", borderRadius: "4px", fontSize: "0.8rem" }}
                  >
                    {request.privacy.replace('_', ' ')}
                  </span>
                </div>
                <div className="request-actions" style={{ marginTop: "var(--spacing-md)" }}>
                  <button
                    className="primary-button"
                    onClick={() => approveProofRequest(request.id, request.origin)}
                    style={{ marginRight: "var(--spacing-sm)" }}
                  >
                    ✅ Approve
                  </button>
                  <button
                    className="action-button"
                    onClick={() => rejectProofRequest(request.id)}
                  >
                    ❌ Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  const RelayManagementSection = () => (
    <div className="action-group fade-in">
      <h2>🌐 Relay Management</h2>
      <p>Manage Gun.js relay peers for decentralized networking</p>

      <div className="relay-status-card">
        <div className="relay-status-header">
          <h4>🔗 Current Peers Status</h4>
          <span
            className="peer-count-badge"
            style={{
              background: peerCount === 0 ? "var(--error-color)" : "var(--success-color)"
            }}
          >
            {peerCount}
          </span>
        </div>
        <div className="current-peers-display">
          {peersList === "No peers configured" || 
           peersList === "Shogun not initialized" || 
           peersList === "Error loading peers" ? (
            <div className="no-peers-message">
              {peersList === "Shogun not initialized" ? "⚠️ Shogun not initialized" :
               peersList === "Error loading peers" ? "❌ Error loading peers" :
               "📡 No peers configured yet"}
            </div>
          ) : (
            <div
              className="peers-list"
              dangerouslySetInnerHTML={{ __html: peersList }}
            />
          )}
        </div>
      </div>

      <div className="add-peer-section">
        <h4>➕ Add New Relay</h4>
        <div className="form-group">
          <input
            type="url"
            placeholder="Enter relay URL (e.g., http://localhost:8000/gun)"
            value={newPeerUrl}
            onChange={(e) => setNewPeerUrl(e.target.value)}
          />
        </div>

        <div className="relay-examples">
          <details className="relay-examples-details">
            <summary>📋 Common relay examples</summary>
            <div className="relay-examples-content">
              <div
                className="shogun-relay"
                onClick={() => fillPeerUrl("https://ruling-mastodon-improved.ngrok-free.app/gun")}
                style={{ cursor: "pointer" }}
              >
                <code>ruling-mastodon-improved</code>
                <span className="example-label">Shogun Relay</span>
              </div>
              <div
                className="relay-example"
                onClick={() => fillPeerUrl("https://gun-manhattan.herokuapp.com/gun")}
                style={{ cursor: "pointer" }}
              >
                <code>gun-manhattan.herokuapp</code>
                <span className="example-label">Public relay</span>
              </div>
              <div
                className="relay-example"
                onClick={() => fillPeerUrl("https://peer.wallie.io/gun")}
                style={{ cursor: "pointer" }}
              >
                <code>peer.wallie</code>
                <span className="example-label">Public relay</span>
              </div>
            </div>
          </details>
        </div>
      </div>

      <div className="form-actions">
        <button
          className="primary-button"
          onClick={handleAddPeer}
          type="button"
        >
          ➕ Add Peer
        </button>
        <button
          className="action-button"
          onClick={() => {
            setLoading(true)
            updatePeersList()
            showResult("Peers Refreshed", {
              success: true,
              message: "Peer list updated",
              timestamp: new Date().toISOString(),
            })
            setLoading(false)
          }}
          type="button"
        >
          🔄 Refresh
        </button>
        <button
          className="action-button warning-button"
          onClick={() => {
            // Clear all peers implementation
          }}
          type="button"
        >
          🗑️ Clear All
        </button>
      </div>
    </div>
  )

  const ResultsSection = () => (
    <div className="action-group fade-in" style={{ gridColumn: "1 / -1" }}>
      <h2>📊 Results</h2>
      <div id="results">{results}</div>
    </div>
  )

  return (
    <div className="container">
      <AppHeader />
      <div className="main-grid">
        <InitializationSection />
        <TraditionalAuthSection />
        <WebAuthnSection />
        <EthereumSection />
        <BitcoinSection />
        <ProofRequestSection />
        <RelayManagementSection />
        <ResultsSection />
      </div>
    </div>
  )
}

export default App 