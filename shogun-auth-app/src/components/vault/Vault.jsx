import React, { useState } from 'react';
import { useAuthContext } from '../../context/AuthContext';
import { useVault } from '../../hooks/useVault';
import '../../styles/vault.css';

const Vault = () => {
  const { shogun, authStatus } = useAuthContext();
  const [password, setPassword] = useState('');
  
  // Use our custom vault hook
  const {
    vaultStatus,
    vaultData,
    loading,
    error,
    isVaultAvailable,
    initializeVault,
    unlockVault,
    lockVault,
    clearError
  } = useVault(shogun);
  
  // Initialize vault
  const handleInitializeVault = async () => {
    if (!password) return;
    
    const success = await initializeVault(password);
    if (success) {
      setPassword('');
    }
  };
  
  // Unlock vault
  const handleUnlockVault = async () => {
    if (!password) return;
    
    const success = await unlockVault(password);
    if (success) {
      setPassword('');
    }
  };
  
  if (loading) {
    return (
      <div className="vault-container">
        <div className="loading-spinner"></div>
        <p>Loading vault...</p>
      </div>
    );
  }
  
  // If vault functionality is not available
  if (!isVaultAvailable) {
    return (
      <div className="vault-container">
        <div className="vault-header">
          <h2 className="vault-title">
            <span className="vault-icon">🔒</span> Secure Vault
          </h2>
        </div>
        <div className="vault-error">
          <p>Vault functionality is not available in this version of Shogun.</p>
          <p>Please check your configuration or contact support.</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="vault-container">
      <div className="vault-header">
        <h2 className="vault-title">
          <span className="vault-icon">🔒</span> Secure Vault
        </h2>
        
        <div className="vault-status">
          <div className={`status-indicator ${vaultStatus.isInitialized ? 'active' : 'inactive'}`}>
            {vaultStatus.isInitialized ? 'Initialized' : 'Not Initialized'}
          </div>
          
          {vaultStatus.isInitialized && (
            <div className={`status-indicator ${!vaultStatus.isLocked ? 'active' : 'inactive'}`}>
              {vaultStatus.isLocked ? 'Locked' : 'Unlocked'}
            </div>
          )}
        </div>
      </div>
      
      {error && (
        <div className="error-message">
          <p>{error}</p>
          <button onClick={clearError} className="dismiss-error">✕</button>
        </div>
      )}
      
      {!vaultStatus.isInitialized ? (
        <div className="vault-setup">
          <h3>Initialize Your Vault</h3>
          <p>Create a password to secure your encrypted data.</p>
          
          <div className="vault-form">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Create a secure password"
              className="vault-input"
            />
            
            <button 
              onClick={handleInitializeVault} 
              disabled={!password}
              className="vault-button"
            >
              Initialize Vault
            </button>
          </div>
        </div>
      ) : vaultStatus.isLocked ? (
        <div className="vault-unlock">
          <h3>Unlock Your Vault</h3>
          <p>Enter your password to access your encrypted data.</p>
          
          <div className="vault-form">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              className="vault-input"
            />
            
            <button 
              onClick={handleUnlockVault} 
              disabled={!password}
              className="vault-button"
            >
              Unlock Vault
            </button>
          </div>
        </div>
      ) : (
        <div className="vault-content">
          <div className="vault-actions">
            <button onClick={lockVault} className="lock-button">
              Lock Vault
            </button>
          </div>
          
          <div className="vault-data">
            <h3>Your Encrypted Data</h3>
            
            {vaultData.length === 0 ? (
              <div className="empty-vault">
                <p>No data in your vault yet.</p>
                <p>Use the Encrypted Data Manager to add encrypted items.</p>
              </div>
            ) : (
              <ul className="data-list">
                {vaultData.map((item, index) => (
                  <li key={index} className="data-item">
                    <div className="data-header">
                      <h4>{item.name || 'Unnamed Item'}</h4>
                      <span className="data-type">{item.type || 'Unknown'}</span>
                    </div>
                    <p className="data-description">{item.description || 'No description'}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Vault; 