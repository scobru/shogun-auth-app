import React, { useState } from 'react';

const NostrAuth = ({ onLogin, onRegister }) => {
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
    <div className="nostr-auth">
      <h3>🔐 Autenticazione Bitcoin/Nostr</h3>
      
      <div className="button-group">
        <button 
          onClick={handleLogin}
          disabled={loading}
        >
          {loading ? 'Caricamento...' : '🔓 Login con Bitcoin/Nostr'}
        </button>
        
        <button 
          onClick={handleRegister}
          disabled={loading}
        >
          {loading ? 'Caricamento...' : '📝 Registra con Bitcoin/Nostr'}
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

export default NostrAuth; 