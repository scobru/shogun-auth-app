import React, { useState, useEffect } from 'react';
import Gun from 'gun';

// Encrypted Data Manager component
const EncryptedDataManager = ({ shogun, authStatus }) => {
  const [dataKey, setDataKey] = useState("");
  const [dataValue, setDataValue] = useState("");
  const [storedData, setStoredData] = useState({});
  const [decryptedData, setDecryptedData] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load user's encrypted data when logged in
  useEffect(() => {
    if (authStatus.isLoggedIn && shogun) {
      loadEncryptedData();
    }
  }, [authStatus.isLoggedIn, shogun]);

  // Load user data from Gun
  const loadEncryptedData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const user = shogun.gun.user();
      
      // Clear previous data
      setStoredData({});
      
      // Load data from Gun
      await new Promise(resolve => {
        const data = {};
        
        user.get('encryptedData').map().once((value, key) => {
          if (key !== '_' && value !== null) {
            data[key] = value;
          }
        });
        
        // Wait a bit to ensure we've loaded all data
        setTimeout(() => {
          setStoredData(data);
          resolve();
        }, 500);
      });
    } catch (err) {
      console.error("Error loading data:", err);
      setError("Failed to load data: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Save encrypted data to user's Gun space
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!dataKey.trim() || !dataValue.trim()) {
      setError("Both key and value are required");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const user = shogun.gun.user();
      
      // Encrypt data using SEA
      const encryptedValue = await Gun.SEA.encrypt(dataValue, shogun.user.pair());
      
      // Save to user's space
      await new Promise((resolve, reject) => {
        user.get('encryptedData').get(dataKey).put(encryptedValue, (ack) => {
          if (ack.err) {
            reject(new Error(ack.err));
          } else {
            resolve();
          }
        });
      });
      
      // Update local state
      setStoredData(prev => ({
        ...prev,
        [dataKey]: encryptedValue
      }));
      
      // Clear form
      setDataKey("");
      setDataValue("");
      
      // Reload data to ensure we have the latest
      loadEncryptedData();
    } catch (err) {
      console.error("Error saving data:", err);
      setError("Failed to save data: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Decrypt and display data
  const handleDecrypt = async (key) => {
    try {
      const encryptedValue = storedData[key];
      const decrypted = await Gun.SEA.decrypt(encryptedValue, shogun.user.pair());
      
      setDecryptedData(prev => ({
        ...prev,
        [key]: decrypted
      }));
    } catch (err) {
      console.error("Error decrypting data:", err);
      setError("Failed to decrypt data: " + err.message);
    }
  };

  // Delete data
  const handleDelete = async (key) => {
    try {
      setLoading(true);
      setError(null);
      
      const user = shogun.gun.user();
      
      // Delete from Gun (set to null)
      await new Promise((resolve, reject) => {
        user.get('encryptedData').get(key).put(null, (ack) => {
          if (ack.err) {
            reject(new Error(ack.err));
          } else {
            resolve();
          }
        });
      });
      
      // Update local state
      setStoredData(prev => {
        const newData = { ...prev };
        delete newData[key];
        return newData;
      });
      
      // Also remove any decrypted data
      setDecryptedData(prev => {
        const newData = { ...prev };
        delete newData[key];
        return newData;
      });
    } catch (err) {
      console.error("Error deleting data:", err);
      setError("Failed to delete data: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card bg-base-100 shadow-xl mb-6">
      <div className="card-body">
        <h2 className="card-title text-2xl flex items-center gap-2">
          <span className="text-2xl">🔐</span> Encrypted Data Vault
        </h2>
        <p className="text-base-content/70 mb-4">
          Store and manage your encrypted data securely. All data is encrypted using your personal keys and stored in GunDB.
        </p>
        
        <div className="card bg-base-200 mb-6">
          <div className="card-body">
            <h3 className="card-title text-lg flex items-center gap-2">
              <span className="text-lg">✨</span> Add New Encrypted Data
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="text"
                placeholder="Data Key (e.g., 'password', 'api_key')"
                value={dataKey}
                onChange={(e) => setDataKey(e.target.value)}
                className="input input-bordered w-full"
              />
              <textarea
                placeholder="Data Value (will be encrypted)"
                value={dataValue}
                onChange={(e) => setDataValue(e.target.value)}
                className="textarea textarea-bordered w-full min-h-[100px]"
              />
              <button 
                type="submit" 
                disabled={loading || !dataKey.trim() || !dataValue.trim() || isSubmitting}
                className="btn btn-primary w-full"
              >
                {isSubmitting ? <span className="loading loading-spinner"></span> : null}
                {isSubmitting ? "Encrypting & Storing..." : "Encrypt & Store"}
              </button>
            </form>
            
            {error && (
              <div className="alert alert-error mt-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                <span>{error}</span>
              </div>
            )}
          </div>
        </div>
        
        <div className="mt-6">
          <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <span className="text-lg">🔒</span> Your Encrypted Data
          </h3>
          
          {Object.keys(storedData).length === 0 ? (
            <div className="text-center py-8 bg-base-200 rounded-lg border border-base-300">
              <span className="text-4xl block mb-3">📭</span>
              <p className="text-base-content/70">No encrypted data stored yet. Add your first entry above.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {Object.keys(storedData).map(key => (
                <div className="card bg-base-200" key={key}>
                  <div className="card-body p-4">
                    <div className="flex justify-between items-center">
                      <h4 className="font-medium text-lg flex items-center gap-2">
                        <span className="text-sm">🔑</span> {key}
                      </h4>
                      <div className="flex gap-2">
                        <button 
                          className="btn btn-sm btn-primary"
                          onClick={() => handleDecrypt(key)}
                        >
                          <span className="text-xs">🔓</span> Decrypt
                        </button>
                        <button 
                          className="btn btn-sm btn-error"
                          onClick={() => handleDelete(key)}
                        >
                          <span className="text-xs">🗑️</span> Delete
                        </button>
                      </div>
                    </div>
                    
                    <div className="mt-3">
                      <div className="mb-3">
                        <h5 className="text-sm font-medium mb-1 flex items-center gap-1">
                          <span className="text-xs">🔒</span> Encrypted Data
                        </h5>
                        <pre className="bg-base-300 p-2 rounded text-xs overflow-x-auto whitespace-pre-wrap">
                          {typeof storedData[key] === 'string' 
                            ? storedData[key].substring(0, 100) + (storedData[key].length > 100 ? '...' : '')
                            : JSON.stringify(storedData[key], null, 2)}
                        </pre>
                      </div>
                      
                      {decryptedData[key] && (
                        <div>
                          <h5 className="text-sm font-medium mb-1 flex items-center gap-1">
                            <span className="text-xs">🔓</span> Decrypted Value
                          </h5>
                          <pre className="bg-base-300 p-2 rounded text-xs overflow-x-auto whitespace-pre-wrap">
                            {decryptedData[key]}
                          </pre>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EncryptedDataManager;
