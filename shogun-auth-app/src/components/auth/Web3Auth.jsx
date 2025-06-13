import React, { useState } from 'react';

const Web3Auth = ({ onLogin, onRegister }) => {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    setError('');

    try {
      await onLogin();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    setLoading(true);
    setError('');

    try {
      await onRegister();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="web3-auth">
      <h3>🔐 Autenticazione Ethereum</h3>
      
      <div className="button-group">
        <button 
          onClick={handleLogin}
          disabled={loading}
        >
          {loading ? 'Caricamento...' : '🔓 Login con Ethereum'}
        </button>
        
        <button 
          onClick={handleRegister}
          disabled={loading}
        >
          {loading ? 'Caricamento...' : '📝 Registra con Ethereum'}
        </button>
      </div>

      {error && (
        <div className="error-message">
          ❌ {error}
        </div>
      )}
    </div>
  );
};

export default Web3Auth; 