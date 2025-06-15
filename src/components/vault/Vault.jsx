import React, { useState } from 'react';
import { useAuthContext } from '../../context/AuthContext';
import { useVault } from '../../hooks/useVault';

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
      <div className="card bg-base-100 shadow-xl p-6">
        <div className="flex justify-center">
          <span className="loading loading-spinner loading-lg"></span>
        </div>
        <p className="text-center mt-4">Loading vault...</p>
      </div>
    );
  }
  
  // If vault functionality is not available
  if (!isVaultAvailable) {
    return (
      <div className="card bg-base-100 shadow-xl p-6">
        <div className="card-body">
          <h2 className="card-title flex items-center gap-2">
            <span className="text-xl">🔒</span> Secure Vault
          </h2>
          <div className="alert alert-error">
            <p>Vault functionality is not available in this version of Shogun.</p>
            <p>Please check your configuration or contact support.</p>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="card bg-base-100 shadow-xl p-6">
      <div className="card-body">
        <h2 className="card-title flex items-center gap-2">
          <span className="text-xl">🔒</span> Secure Vault
        </h2>
        
        <div className="flex justify-center gap-4 mb-6">
          <div className={`badge ${vaultStatus.isInitialized ? "badge-success" : "badge-error"} p-4 text-base font-medium`}>
            {vaultStatus.isInitialized ? 'Initialized' : 'Not Initialized'}
          </div>
          
          {vaultStatus.isInitialized && (
            <div className={`badge ${!vaultStatus.isLocked ? "badge-success" : "badge-error"} p-4 text-base font-medium`}>
              {vaultStatus.isLocked ? 'Locked' : 'Unlocked'}
            </div>
          )}
        </div>
      
        {error && (
          <div className="alert alert-error">
            <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <span>{error}</span>
            <button onClick={clearError} className="btn btn-sm btn-circle">✕</button>
          </div>
        )}
      
        {!vaultStatus.isInitialized ? (
          <div className="card bg-base-200 p-6">
            <h3 className="text-xl font-semibold mb-4">Initialize Your Vault</h3>
            <p className="mb-4">Create a password to secure your encrypted data.</p>
          
            <div className="form-control">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Create a secure password"
                className="input input-bordered w-full mb-4"
              />
            
              <button 
                onClick={handleInitializeVault} 
                disabled={!password}
                className="btn btn-primary"
              >
                Initialize Vault
              </button>
            </div>
          </div>
        ) : vaultStatus.isLocked ? (
          <div className="card bg-base-200 p-6">
            <h3 className="text-xl font-semibold mb-4">Unlock Your Vault</h3>
            <p className="mb-4">Enter your password to access your encrypted data.</p>
          
            <div className="form-control">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="input input-bordered w-full mb-4"
              />
            
              <button 
                onClick={handleUnlockVault} 
                disabled={!password}
                className="btn btn-primary"
              >
                Unlock Vault
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex justify-end">
              <button onClick={lockVault} className="btn btn-warning">
                Lock Vault
              </button>
            </div>
          
            <div className="card bg-base-200 p-6">
              <h3 className="text-xl font-semibold mb-4">Your Encrypted Data</h3>
            
              {vaultData.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-base-content/70">No data in your vault yet.</p>
                  <p className="text-base-content/70">Use the Encrypted Data Manager to add encrypted items.</p>
                </div>
              ) : (
                <ul className="space-y-4">
                  {vaultData.map((item, index) => (
                    <li key={index} className="card bg-base-100 p-4">
                      <div className="card-body p-2">
                        <h4 className="card-title text-base">{item.name || 'Unnamed Item'}</h4>
                        <div className="badge badge-secondary">{item.type || 'Unknown'}</div>
                        <p className="text-sm text-base-content/70">{item.description || 'No description'}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Vault; 