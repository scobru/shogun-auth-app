# Shogun Auth App 

A comprehensive React-based authentication application built on top of the Shogun ecosystem. This app provides a complete authentication solution with multiple login methods, encrypted data storage, and seamless integration capabilities for other applications.

## 🌟 Features

- **Multiple Authentication Methods**
  - 📧 Username/Password authentication
  - 🦊 MetaMask & Web3 wallet integration
  - 🔐 WebAuthn (biometric authentication)
  - ⚡ Nostr protocol authentication
  - 🔑 OAuth providers (Google, and extensible to others)
  - 📱 Gun pair import/export for account recovery

- **Secure Data Management**
  - 🛡️ End-to-end encrypted data vault
  - 🔒 Personal encrypted storage using SEA (Security, Encryption, Authorization)
  - 💾 Decentralized data persistence with GunDB
  - 🔄 Real-time data synchronization

- **Cross-Application Integration**
  - 🔗 Secure credential transfer between applications
  - 🚀 OAuth callback handling with automatic redirects
  - 📡 PostMessage API for secure cross-window communication
  - 🎯 URL-based redirect system with credential propagation

- **Modern UI/UX**
  - 🌓 Dark/Light theme support
  - 📱 Fully responsive design
  - ⚡ Fast and modern interface with Tailwind CSS + DaisyUI
  - 🎨 Beautiful gradient backgrounds and animations

## 🚀 Quick Start

### Prerequisites

- Node.js ≥ 18.0.0
- npm or yarn package manager

### Installation

```bash
# Clone the repository
git clone https://github.com/scobru/shogun-core
cd shogun-2/shogun-auth-app

# Install dependencies
npm install

# Start development server
npm run dev
```

The app will be available at `http://localhost:8080`

### Production Build

```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

## 🔧 Configuration

### Environment Setup

The app uses several configurable options in `src/App.jsx`:

```jsx
const shogunCore = new ShogunCore({
  gunInstance: gunInstance,
  peers: ["http://localhost:8765/gun"], // GunDB relay peers
  web3: { enabled: true },
  webauthn: {
    enabled: true,
    rpName: "Shogun Auth App",
  },
  nostr: { enabled: true },
  oauth: {
    enabled: true,
    usePKCE: true,
    providers: {
      google: {
        clientId: "your-google-client-id",
        clientSecret: "your-google-client-secret", 
        redirectUri: "http://localhost:8080/auth/callback",
        scope: ["openid", "email", "profile"],
        authUrl: "https://accounts.google.com/o/oauth2/v2/auth",
        tokenUrl: "https://oauth2.googleapis.com/token",
        userInfoUrl: "https://www.googleapis.com/oauth2/v2/userinfo",
      },
    },
  },
});
```

### GunDB Relay Configuration

The app connects to multiple GunDB relays for data persistence:

```jsx
const relays = [
  "https://ruling-mastodon-improved.ngrok-free.app/gun",
  "https://gun-manhattan.herokuapp.com/gun", 
  "https://peer.wallie.io/gun"
];
```

### OAuth Provider Setup

To enable OAuth authentication, configure your OAuth providers:

1. **Google OAuth Setup:**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select existing one
   - Enable Google+ API
   - Create OAuth 2.0 credentials
   - Add `http://localhost:8080/auth/callback` to authorized redirect URIs
   - Update the `clientId` and `clientSecret` in the configuration

## 📖 Usage

### Basic Authentication

1. **Open the app** at `http://localhost:8080`
2. **Choose your authentication method:**
   - Click "Login with Google" for OAuth
   - Click "Login with MetaMask" for Web3
   - Click "WebAuthn" for biometric authentication
   - Use username/password for traditional auth
   - Import existing Gun pair for account recovery

### Encrypted Data Vault

Once authenticated, you can:

1. **Store encrypted data:**
   - Enter a key name (e.g., "api_key", "password")
   - Enter the value to encrypt
   - Click "Encrypt & Store"

2. **View stored data:**
   - See all your encrypted entries
   - Click "Decrypt" to view the original value
   - Click "Delete" to remove entries

### Cross-Application Integration

The app supports seamless integration with other applications:

#### As an Authentication Provider

Other apps can redirect users to Shogun Auth for authentication:

```
http://localhost:8080?redirect=https://your-app.com/auth-success
```

After successful authentication, users are automatically redirected back with their credentials securely transferred.

#### Integration Example

```javascript
// In your application
const authUrl = "http://localhost:8080?redirect=" + encodeURIComponent(window.location.origin + "/auth-callback");
window.open(authUrl, "_blank");

// Listen for credentials
window.addEventListener("message", (event) => {
  if (event.data.type === "shogun:auth:credentials") {
    const { pair, session } = event.data.data;
    // Use the credentials to authenticate in your app
    console.log("Received auth credentials:", { pair, session });
    
    // Send confirmation
    event.source.postMessage({ type: "shogun:auth:received" }, event.origin);
  }
});
```

### Account Recovery

Export and import your account for backup:

1. **Export Account:**
   - After login, find the "Export Account" button
   - Optionally set an encryption password
   - Save the generated JSON securely

2. **Import Account:**
   - Use the import functionality in the auth modal
   - Paste your saved JSON data
   - Enter the password if encrypted
   - Your account will be restored

## 🏗️ Project Structure

```
shogun-auth-app/
├── src/
│   ├── components/           # Reusable React components
│   │   ├── ui/              # UI components (Button, Card, Modal, etc.)
│   │   ├── vault/           # Encrypted data management
│   │   ├── OAuthCallback.jsx # OAuth callback handler
│   │   └── UserInfo.jsx     # User profile display
│   ├── hooks/               # Custom React hooks
│   │   └── useShogunAuth.js # Authentication state management
│   ├── utils/               # Utility functions
│   ├── styles/              # CSS styles and themes
│   ├── App.jsx              # Main application component
│   └── main.jsx             # Application entry point
├── public/                  # Static assets
├── index.html              # HTML template
├── package.json            # Dependencies and scripts
├── vite.config.js          # Vite configuration
└── tailwind.config.js      # Tailwind CSS configuration
```

## 🔌 API Reference

### Authentication Methods

The app supports these authentication methods through the Shogun Button component:

```javascript
// Username/Password
await login("password", "username", "password");

// MetaMask/Web3
await login("web3");

// WebAuthn
await login("webauthn", "username");

// Nostr
await login("nostr");

// OAuth (Google)
await login("oauth", "google");

// Gun Pair (Recovery)
await login("pair", pairObject);
```

### Data Management

```javascript
// Store encrypted data
await shogun.gundb.encrypt(value, userPair);

// Retrieve and decrypt data
await shogun.gundb.decrypt(encryptedValue, userPair);

// Store in user's Gun space
user.get("shogun").get("encryptedData").get(key).put(encryptedValue);
```

## 🛡️ Security Features

- **End-to-End Encryption:** All user data is encrypted using SEA before storage
- **Decentralized Storage:** Data is stored across multiple GunDB relays
- **No Central Authority:** Users control their own keys and data
- **Secure Credential Transfer:** PostMessage API with origin validation
- **Wallet Conflict Prevention:** Advanced protection against browser wallet conflicts
- **Session Management:** Secure session handling with automatic cleanup

## 🌐 Browser Support

- Chrome ≥ 60
- Firefox ≥ 60
- Safari ≥ 12
- Edge ≥ 79

## 📝 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run serve` - Serve production build
- `npm run lint` - Run ESLint

## 🔗 Integration with Shogun Ecosystem

This app is part of the larger Shogun ecosystem:

- **[shogun-core](../shogun-core/)** - Core authentication and data management library
- **[shogun-button-react](../shogun-button-react/)** - React authentication component library
- **[shogun-relay](../shogun-relay/)** - GunDB relay server
- **[shogun-contracts](../shogun-contracts/)** - Smart contracts for decentralized features

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with ❤️ by [scobru](https://github.com/scobru)
- Part of the [Shogun Project](https://shogun-info.vercel.app)
- Powered by [GunDB](https://gun.eco) for decentralized data
- UI built with [Tailwind CSS](https://tailwindcss.com) and [DaisyUI](https://daisyui.com)

---

For more information about the Shogun ecosystem, visit [shogun-info.vercel.app](https://shogun-info.vercel.app)

