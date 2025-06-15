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
    <div className="card bg-base-200 p-6 my-4">
      <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
        <span className="text-lg">🦊</span> Autenticazione MetaMask
      </h3>
      
      <div className="flex flex-col sm:flex-row gap-3">
        <button 
          onClick={handleLogin}
          disabled={loading}
          className="btn btn-primary flex-1"
        >
          {loading ? <span className="loading loading-spinner"></span> : '🦊'} Login con MetaMask
        </button>
        
        <button 
          onClick={handleRegister}
          disabled={loading}
          className="btn btn-secondary flex-1"
        >
          {loading ? <span className="loading loading-spinner"></span> : '🦊'} Registra con MetaMask
        </button>
      </div>

      {error && (
        <div className="alert alert-error mt-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};

export default Web3Auth; 