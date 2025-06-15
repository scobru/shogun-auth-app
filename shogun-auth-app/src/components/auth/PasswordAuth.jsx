import React, { useState } from 'react';

const PasswordAuth = ({ onLogin, onRegister }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      if (isLogin) {
        // Login with password - pass the event object to prevent page refresh
        await onLogin(username, password, e);
      } else {
        // Register with password - pass the event object to prevent page refresh
        if (password !== confirmPassword) {
          setError('Passwords do not match');
          return;
        }
        await onRegister(username, password, e);
      }
    } catch (err) {
      setError(err.message || 'Authentication failed');
    }
  };

  return (
    <div className="card bg-base-200 p-6 my-4">
      <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
        <span className="text-lg">🔑</span> {isLogin ? 'Password Login' : 'Create Account'}
      </h3>
      
      {error && (
        <div className="alert alert-error mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          <span>{error}</span>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="form-control">
          <label className="label">
            <span className="label-text">Username</span>
          </label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter your username"
            className="input input-bordered w-full"
            required
          />
        </div>
        
        <div className="form-control">
          <label className="label">
            <span className="label-text">Password</span>
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            className="input input-bordered w-full"
            required
          />
        </div>
        
        {!isLogin && (
          <div className="form-control">
            <label className="label">
              <span className="label-text">Confirm Password</span>
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm your password"
              className="input input-bordered w-full"
              required
            />
          </div>
        )}
        
        <button type="submit" className="btn btn-primary w-full">
          {isLogin ? 'Login' : 'Register'}
        </button>
      </form>
      
      <div className="text-center mt-4">
        {isLogin ? "Don't have an account? " : "Already have an account? "}
        <button 
          onClick={() => setIsLogin(!isLogin)} 
          className="btn btn-link p-0"
        >
          {isLogin ? 'Register' : 'Login'}
        </button>
      </div>
    </div>
  );
};

export default PasswordAuth; 