import React, { useState, useEffect } from 'react';
import { WebAuthnAuth } from './index';
import { Web3Auth } from './index';
import { NostrAuth } from './index';
import { ZKOAuthAuth } from './index';
import { PasswordAuth } from './index';
import '../../styles/auth.css';

const Login = ({ onLogin }) => {
  const [activeTab, setActiveTab] = useState('password');
  const [username, setUsername] = useState('');
  const [error, setError] = useState(null);
  const [isWeb3Available, setIsWeb3Available] = useState(false);

  // Check if MetaMask is available
  useEffect(() => {
    const checkWeb3 = () => {
      try {
        // Safely check if ethereum is available and is MetaMask
        const hasEthereum = typeof window !== 'undefined' && 
                          window.ethereum && 
                          typeof window.ethereum === 'object';
        const isMetaMask = hasEthereum && window.ethereum.isMetaMask;
        setIsWeb3Available(!!isMetaMask);
      } catch (err) {
        console.warn('Error checking for Web3:', err);
        setIsWeb3Available(false);
      }
    };
    
    checkWeb3();
  }, []);

  const handleLogin = async (method, ...args) => {
    try {
      setError(null);
      console.log(`Attempting login with method: ${method}`);
      await onLogin(method, ...args);
    } catch (error) {
      console.error(`Login error (${method}):`, error);
      setError(`Login failed: ${error.message}`);
    }
  };

  return (
    <div className="auth-section">
      <h2>🔒 Login to Shogun</h2>
      
      {error && (
        <div className="auth-error">
          <p>{error}</p>
          <button onClick={() => setError(null)}>Dismiss</button>
        </div>
      )}
      
      <div className="app-tabs">
        <button 
          className={`tab-button ${activeTab === 'password' ? 'active' : ''}`}
          onClick={() => setActiveTab('password')}
        >
          Password
        </button>
        <button 
          className={`tab-button ${activeTab === 'webauthn' ? 'active' : ''}`}
          onClick={() => setActiveTab('webauthn')}
        >
          Biometric
        </button>
        <button 
          className={`tab-button ${activeTab === 'web3' ? 'active' : ''} ${!isWeb3Available ? 'disabled' : ''}`}
          onClick={() => isWeb3Available && setActiveTab('web3')}
          disabled={!isWeb3Available}
          title={!isWeb3Available ? 'MetaMask not available' : 'Login with MetaMask'}
        >
          Web3
        </button>
        <button 
          className={`tab-button ${activeTab === 'nostr' ? 'active' : ''}`}
          onClick={() => setActiveTab('nostr')}
        >
          Nostr
        </button>
        <button 
          className={`tab-button ${activeTab === 'oauth' ? 'active' : ''}`}
          onClick={() => setActiveTab('oauth')}
        >
          OAuth
        </button>
      </div>
      
      <div className="tab-content active">
        {activeTab === 'password' && (
          <PasswordAuth 
            onLogin={(username, password) => handleLogin('password', username, password)} 
            onRegister={(username, password) => handleLogin('password_register', username, password)}
          />
        )}
        
        {activeTab === 'webauthn' && (
          <WebAuthnAuth 
            onLogin={(username) => handleLogin('webauthn', username)} 
            onRegister={(username) => handleLogin('webauthn_register', username)}
            username={username}
          />
        )}
        
        {activeTab === 'web3' && isWeb3Available && (
          <Web3Auth 
            onLogin={(method) => handleLogin(method || 'web3')} 
            onRegister={(method) => handleLogin(method || 'web3_register')}
          />
        )}
        
        {activeTab === 'web3' && !isWeb3Available && (
          <div className="auth-method-container">
            <h3>🦊 MetaMask Not Available</h3>
            <p className="auth-message">
              MetaMask extension is not installed or not accessible. Please install MetaMask to use this authentication method.
            </p>
            <div className="auth-actions">
              <a 
                href="https://metamask.io/download/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="auth-button"
              >
                Install MetaMask
              </a>
            </div>
          </div>
        )}
        
        {activeTab === 'nostr' && (
          <NostrAuth 
            onLogin={() => handleLogin('nostr')} 
            onRegister={() => handleLogin('nostr_register')}
          />
        )}
        
        {activeTab === 'oauth' && (
          <ZKOAuthAuth 
            onLogin={() => handleLogin('zkoauth')} 
            onRegister={() => handleLogin('zkoauth_register')}
          />
        )}
      </div>
    </div>
  );
};

export default Login; 