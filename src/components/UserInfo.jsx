import React from 'react';

export const UserInfo = ({ authStatus }) => {
  if (!authStatus.isLoggedIn || !authStatus.user) {
    return null;
  }

  return (
    <div className="card mb-6">
      <div className="card-body">
        <h2 className="card-title text-2xl flex items-center gap-2">
          <span className="text-2xl">👤</span> User Profile
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div className="bg-base-200 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-secondary mb-2">User ID</h3>
            <p className="font-mono text-sm break-all">{authStatus.user.pub}</p>
          </div>
          
          {authStatus.user.alias && (
            <div className="bg-base-200 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-secondary mb-2">Alias</h3>
              <p className="font-mono text-sm break-all">{authStatus.user.alias}</p>
            </div>
          )}
          
          {authStatus.user.epub && (
            <div className="bg-base-200 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-secondary mb-2">Public Encryption Key</h3>
              <p className="font-mono text-sm break-all">{authStatus.user.epub}</p>
            </div>
          )}
        </div>

        <div className="mt-6">
          <h3 className="text-lg font-medium mb-3 flex items-center gap-2">
            <span className="text-lg">🔐</span> Authentication Details
          </h3>
          <div className="bg-base-200 p-4 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-secondary">Authentication Status</span>
              <span className="badge badge-success">Authenticated</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-secondary">Session Type</span>
              <span className="badge badge-primary">GunDB</span>
            </div>
          </div>
        </div>

        <div className="mt-6">
          <div className="alert bg-base-200">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-info shrink-0 w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <div>
              <h3 className="font-bold">Security Note</h3>
              <p className="text-sm">Your keys are stored securely in your browser. Never share your private keys with anyone.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserInfo; 