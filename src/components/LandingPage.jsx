import React, { useState } from "react";
import { ShogunButton } from "shogun-button-react";
import { CheckCircle } from "lucide-react";

const LandingPage = ({ onShowAuth }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100">
      {/* Header */}
      <header className="relative z-10 p-4 sm:p-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="h-6 w-6 sm:h-8 sm:w-8 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg"></div>
            <span className="text-lg sm:text-xl font-bold text-gray-900">
              Shogun
            </span>
          </div>

          <div className="flex items-center space-x-2 sm:space-x-4">
            <img
              src="/logo.svg"
              alt="Shogun Logo"
              className="h-8 w-8 sm:h-10 sm:w-10"
            />
            <span className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              auth
            </span>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-20">
          <div className="text-center">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-4 sm:mb-6">
              Secure{" "}
              <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                Authentication
              </span>
              <br />
              <span className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl">
                the decentralized way
              </span>
            </h1>

            <p className="text-base sm:text-lg md:text-xl text-gray-600 mb-8 sm:mb-12 max-w-3xl mx-auto px-4">
              Next-generation authentication system. Secure, private and
              completely decentralized powered by Shogun Core and cutting-edge
              cryptography.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12 sm:mb-16">
              <button
                onClick={onShowAuth}
                className="w-full sm:w-auto bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-6 sm:px-8 py-3 text-base sm:text-lg rounded-lg font-semibold transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                Get Started
              </button>
            </div>

            {/* Demo Area */}
            <div className="relative max-w-4xl mx-auto px-4">
              <div className="bg-white rounded-2xl shadow-2xl p-4 sm:p-6 md:p-8 border">
                <div className="flex items-center space-x-2 mb-4 sm:mb-6">
                  <div className="h-2 w-2 sm:h-3 sm:w-3 bg-red-500 rounded-full"></div>
                  <div className="h-2 w-2 sm:h-3 sm:w-3 bg-yellow-500 rounded-full"></div>
                  <div className="h-2 w-2 sm:h-3 sm:w-3 bg-green-500 rounded-full"></div>
                </div>
                <div className="space-y-3 sm:space-y-4">
                  <div className="flex items-center space-x-2 sm:space-x-3 p-2 sm:p-3 bg-gray-50 rounded-lg">
                    <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-500 flex-shrink-0" />
                    <span className="text-sm sm:text-base text-gray-700">
                      WebAuthn Authentication
                    </span>
                  </div>
                  <div className="flex items-center space-x-2 sm:space-x-3 p-2 sm:p-3 bg-gray-50 rounded-lg">
                    <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-500 flex-shrink-0" />
                    <span className="text-sm sm:text-base text-gray-700">
                      MetaMask Web3 Login
                    </span>
                  </div>
                  <div className="flex items-center space-x-2 sm:space-x-3 p-2 sm:p-3 bg-gray-50 rounded-lg">
                    <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-500 flex-shrink-0" />
                    <span className="text-sm sm:text-base text-gray-700">
                      Encrypted Data Vault
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8 sm:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <img
              src="/logo.svg"
              alt="Shogun"
              className="h-6 w-6 sm:h-8 sm:w-8"
            />
            <span className="text-lg sm:text-xl font-bold">Shogun Auth</span>
          </div>
          <p className="text-sm sm:text-base text-gray-400 px-4">
            Powered by Shogun Core & GunDB - The future of decentralized
            authentication
          </p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
