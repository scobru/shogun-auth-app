import React, { useState } from 'react';

const WebAuthnAuth = ({ onLogin, onRegister, username: propUsername }) => {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [localUsername, setLocalUsername] = useState(propUsername || '');

  // Update local username when prop changes
  React.useEffect(() => {
    if (propUsername) {
      setLocalUsername(propUsername);
    }
  }, [propUsername]);

  const handleLogin = async () => {
    if (!localUsername) {
      setError('Username richiesto');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await onLogin(localUsername);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!localUsername) {
      setError('Username richiesto');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await onRegister(localUsername);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="webauthn-auth">
      <h3>🔐 Autenticazione Biometrica</h3>
      
      <div className="form-group">
        <input
          type="text"
          placeholder="Username"
          value={localUsername}
          onChange={(e) => setLocalUsername(e.target.value)}
          className="webauthn-username-input"
        />
      </div>
      
      <div className="button-group">
        <button 
          onClick={handleLogin}
          disabled={loading || !localUsername}
        >
          {loading ? 'Caricamento...' : '🔓 Login con Biometria'}
        </button>
        
        <button 
          onClick={handleRegister}
          disabled={loading || !localUsername}
        >
          {loading ? 'Caricamento...' : '📝 Registra Dispositivo'}
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

export default WebAuthnAuth; 