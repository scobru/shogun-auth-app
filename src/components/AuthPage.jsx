import React from 'react';
import { ShogunButton } from 'shogun-button-react';

const AuthPage = ({ onBackToLanding }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo and Title */}
        <div className="flex items-center justify-center mb-8">
          <img src="/logo.svg" alt="Shogun" className="h-12 w-12 mr-3" />
          <h1 className="text-3xl font-bold text-gray-900">auth</h1>
        </div>

        {/* Auth Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8 border">
          <div className="mb-6">
            <h2 className="text-2xl font-semibold text-center mb-2">Welcome to Shogun Auth</h2>
            <p className="text-gray-600 text-center">Choose your authentication method</p>
          </div>

          {/* OAuth Warning if not configured */}
          {!import.meta.env.VITE_GOOGLE_CLIENT_ID && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="flex">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current text-blue-600 shrink-0 w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                <span className="ml-2 text-blue-800 text-sm">
                  Google OAuth is not configured. WebAuthn, Web3, and Nostr authentication are available.
                </span>
              </div>
            </div>
          )}

          {/* Shogun Button */}
          <div className="flex justify-center">
            <ShogunButton />
          </div>
        </div>

        {/* Back Button */}
        <div className="mt-6 text-center">
          <button
            onClick={onBackToLanding}
            className="text-gray-600 hover:text-gray-900 transition-colors duration-200"
          >
            ← Back to homepage
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuthPage; 