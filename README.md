# Shogun Auth App - React Edition

Sistema di autenticazione decentralizzato basato su React che utilizza i moduli di `shogun-core` tramite import ES6 diretti.

## 🚀 Architettura Migliorata

### Punti Chiave dell'Implementazione

1. **App React Solida**: Utilizza React 18 con hooks moderni
2. **Import ES6 Diretti**: Carica `shogun-core` come modulo npm locale
3. **Architettura Minimalista**: Codice pulito e manutenibile
4. **Gestione Proof Requests**: Sistema di gestione delle richieste di proof stile Sismo

### Struttura dei File

```
shogun-auth-app/
├── src/
│   ├── main.jsx          # Entry point React
│   └── App.jsx           # Componente principale (nuovo)
├── package.json          # Dipendenze aggiornate
├── vite.config.js        # Configurazione Vite migliorata
├── index.html            # HTML minimalista
└── shogun.css            # Stili CSS
```

## 📦 Installazione e Setup

### 1. Installa le dipendenze

```bash
cd shogun-auth-app
npm install
# oppure
yarn install
```

### 2. Build di shogun-core (se necessario)

```bash
cd ../shogun-core
npm run build
```

### 3. Avvia l'app di sviluppo

```bash
cd ../shogun-auth-app
npm run dev
```

L'app sarà disponibile su `http://localhost:8080`

## 🏗️ Caratteristiche Implementate

### Autenticazione

- ✅ Login/Signup tradizionale (username/password)
- ✅ Logout e gestione sessioni
- ✅ Status di autenticazione in tempo reale

### Proof Requests (Sismo-like)

- ✅ Ricezione richieste proof da app esterne
- ✅ Approvazione/Rifiuto richieste
- ✅ Generazione proof ZK semplificati
- ✅ Comunicazione cross-origin sicura

### UI/UX

- ✅ Interface React moderna e responsive
- ✅ Gestione loading states
- ✅ Display errori e risultati
- ✅ CSS minimalista e pulito

## 🔧 API di Integrazione

### Come Richiedere un Proof

Da un'app esterna:

```javascript
// Apri la finestra auth
const authWindow = window.open(
  "http://localhost:8080",
  "shogun-auth",
  "width=1200,height=800"
);

// Invia richiesta proof
const request = {
  type: "shogun:proof-request",
  data: {
    id: "req_123",
    type: "authentication",
    requirements: {
      authMethods: ["username-password"],
    },
    requestingApp: {
      name: "My App",
      description: "Verify authentication",
    },
    privacy: "zero_knowledge",
  },
};

authWindow.postMessage(request, "http://localhost:8080");

// Ascolta risposta
window.addEventListener("message", (event) => {
  if (event.data.type === "shogun:proof-response") {
    const { success, proof, error } = event.data.data;
    if (success) {
      console.log("Proof ricevuta:", proof);
    } else {
      console.error("Proof rifiutata:", error);
    }
  }
});
```

### Struttura Proof Response

```javascript
{
  type: 'shogun:proof-response',
  data: {
    requestId: 'req_123',
    success: true,
    proof: {
      type: 'zk-proof',
      authMethod: 'username-password',
      timestamp: 1234567890,
      data: 'proof_uuid_here'
    },
    metadata: {
      generatedAt: 1234567890,
      expiresAt: 1234567890,
      privacy: 'zero_knowledge'
    }
  }
}
```

## 🎯 Prossimi Sviluppi

### Funzionalità da Implementare

- [ ] WebAuthn integration
- [ ] Ethereum wallet connection
- [ ] Bitcoin/Nostr support
- [ ] Proof verification avanzata
- [ ] Storage persistente dei proof
- [ ] Plugin system modulare

### Miglioramenti Architetturali

- [ ] Context API per state management
- [ ] Custom hooks per autenticazione
- [ ] Service layer per API calls
- [ ] Unit tests con Jest/RTL
- [ ] End-to-end tests con Cypress

## 🔍 Confronto con Implementazione Precedente

### Prima (con script esterni)

```javascript
// Caricamento asincrono poco affidabile
const waitForGun = () => {
  return new Promise((resolve) => {
    if (typeof window.Gun !== "undefined") {
      resolve(window.Gun);
    }
    // polling...
  });
};
```

### Ora (con import ES6)

```javascript
// Import diretto e type-safe
import Gun from "gun";
import { ShogunCore } from "shogun-core";

// Utilizzo immediato
const gunInstance = Gun(["http://localhost:8765/gun"]);
const shogun = new ShogunCore({ gun: gunInstance });
```

## 📝 Note per lo Sviluppo

### Configurazione Vite

- Alias per `shogun-core` locale
- Ottimizzazioni per development
- Hot reload per cambiamenti rapidi

### Gestione Dipendenze

- `shogun-core` come dipendenza locale
- Import tree-shaking friendly
- Bundle splitting automatico

### Debugging

- Source maps abilitati
- Console logging strutturato
- Error boundaries React (da implementare)

---

**Questa nuova architettura fornisce una base solida e scalabile per lo sviluppo di app Shogun moderne!** 🥷

## 🚀 Caratteristiche

- **🔐 Autenticazione Tradizionale**: Username e password
- **🔑 WebAuthn**: Autenticazione biometrica e chiavi hardware
- **🦊 Ethereum Wallet**: Integrazione MetaMask
- **₿ Bitcoin Wallet**: Integrazione Nostr
- **📨 Proof Requests**: Sistema di richieste di prova zero-knowledge
- **🌐 Relay Management**: Gestione dei peer Gun.js
- **⚡ React**: UI reattiva con hooks moderni

## 📁 Struttura del Progetto

```
shogun-auth-app/
├── src/
│   ├── main.jsx          # Entry point React
│   └── App.jsx           # Componente principale
├── index.html            # Template HTML
├── vite.config.js        # Configurazione Vite
├── package.json          # Dipendenze e scripts
└── README.md            # Documentazione
```

## 🛠️ Installazione e Setup

### 1. Installa le dipendenze

```bash
cd shogun-auth-app
npm install
```

### 2. Avvia il server di sviluppo

```bash
npm run dev
# oppure
npm start
```

L'app sarà disponibile su `http://localhost:8080`

### 3. Build per produzione

```bash
npm run build
npm run preview
```

## 🎯 Come Usare

### Inizializzazione

1. Apri l'app nel browser
2. Clicca su **"Initialize Shogun"** per configurare l'SDK
3. Verifica che i plugin siano caricati correttamente

### Autenticazione

#### Username & Password

- Inserisci username e password
- Clicca **"Sign Up"** per registrarti o **"Sign In"** per accedere

#### Ethereum (MetaMask)

- Clicca **"Connect Wallet"** per connettere MetaMask
- Usa **"Sign In"** o **"Register"** per autenticarti

#### Bitcoin (Nostr)

- Clicca **"Connect Wallet"** per connettere un'estensione Nostr
- Usa **"Sign In"** o **"Register"** per autenticarti

#### WebAuthn

- Inserisci un username
- Clicca **"Register"** per configurare l'autenticazione biometrica
- Usa **"Sign In"** per accedere con biometria

### Proof Requests

Quando un'altra app Shogun richiede una prova:

1. La richiesta apparirà nella sezione **"📨 Proof Requests"**
2. Rivedi i dettagli della richiesta
3. Clicca **"✅ Approve"** per generare e inviare la prova
4. Oppure **"❌ Reject"** per rifiutare

### Relay Management

- Visualizza i peer Gun.js attualmente connessi
- Aggiungi nuovi relay inserendo l'URL
- Usa gli esempi predefiniti per relay pubblici

## 🔧 Configurazione

### Vite Configuration

Il file `vite.config.js` è configurato per:

- Plugin React con Fast Refresh
- Server di sviluppo su porta 8080
- Build ottimizzata per produzione
- Polyfill per compatibilità

### Dipendenze Principali

- **React 18.2.0**: Framework UI
- **Gun.js**: Database decentralizzato
- **Shogun Core**: SDK di autenticazione
- **Vite**: Build tool moderno

## 🎨 Differenze da NoDom

### Migrazione da NoDom a React

La versione React mantiene tutte le funzionalità della versione NoDom ma con:

1. **State Management**: `useState` hooks invece di signals NoDom
2. **Effects**: `useEffect` per side effects e lifecycle
3. **Event Handling**: Event handlers React standard
4. **Component Structure**: Componenti React funzionali
5. **Rendering**: Virtual DOM di React invece del DOM diretto

### Vantaggi della Versione React

- **Ecosistema più ampio**: Librerie e tools React
- **Developer Tools**: React DevTools per debugging
- **Type Safety**: Supporto TypeScript migliore
- **Testing**: Jest e React Testing Library
- **Community**: Supporto della community React

## 🧪 Testing

Per aggiungere testing:

```bash
npm install --save-dev @testing-library/react @testing-library/jest-dom jest
```

Crea test in `src/__tests__/` o accanto ai componenti con `.test.jsx`.

## 🚀 Deploy

### Build Statico

```bash
npm run build
```

I file di build saranno in `dist/`

### Deploy su Vercel

```bash
npm install -g vercel
vercel --prod
```

### Deploy su Netlify

```bash
npm run build
# Carica la cartella dist/ su Netlify
```

## 🐛 Troubleshooting

### Gun.js non caricato

- Verifica che gli script siano caricati prima di React
- Controlla la console per errori di rete

### Plugin non disponibili

- Assicurati che Shogun Core sia caricato
- Verifica la configurazione dei plugin

### Errori di autenticazione

- Clicca "Clear Storage" per reset completo
- Ricarica la pagina e ri-inizializza

## 🤝 Contribuire

1. Fork del repository
2. Crea un branch feature: `git checkout -b feature/nome-feature`
3. Commit: `git commit -m 'Add feature'`
4. Push: `git push origin feature/nome-feature`
5. Apri una Pull Request

## 📝 Licenza

MIT License - vedi file LICENSE per dettagli

## 🔗 Link Utili

- [Shogun Core Documentation](https://github.com/scobru/shogun-core)
- [Gun.js Documentation](https://gun.eco/docs/)
- [React Documentation](https://react.dev/)
- [Vite Documentation](https://vitejs.dev/)

---

**Nota**: Questa è la versione React dell'app Shogun Auth. Per la versione NoDom originale, vedi i file `*-nodom.html`.
