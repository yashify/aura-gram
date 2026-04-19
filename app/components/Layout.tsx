"use client";

import React, { useState } from "react";
import Footer from "./Footer";
import SettingsPanel from "./SettingsPanel";

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-warm-ivory text-mistral-black">
      {/* Header */}
      <header className="border-b border-mistral-orange/10 bg-white shadow-warm-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            {/* Logo / Brand */}
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-sm bg-gradient-to-br from-bright-yellow via-sunshine-700 to-mistral-orange"></div>
                 <a
                    href="/"
                    target="_self"
                    rel="noopener noreferrer"
                    className="text-mistral-black/60 hover:text-mistral-orange transition text-sm"
                >
                    <h1 className="text-3xl font-bold text-mistral-black">
                        Aura Gram
                    </h1>
                </a>
            </div>
            
            {/* Navigation */}
            <nav className="flex items-center gap-4">
              <a
                href="https://github.com/yashify/aura-gram"
                target="_blank"
                rel="noopener noreferrer"
                className="text-mistral-black/60 hover:text-mistral-orange transition text-sm"
              >
                GitHub
              </a>
              
              <a
                href="/developer"
                className="text-mistral-black/60 hover:text-mistral-orange transition text-sm"
              >
                Dashboard
              </a>
              
              {/* Settings Button */}
              <button
                onClick={() => setIsSettingsOpen(true)}
                className="p-2 rounded-sm hover:bg-warm-ivory transition text-mistral-black hover:text-mistral-orange"
                title="Settings"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              </button>
            </nav>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Footer */}
      <Footer />

      {/* Settings Panel Modal */}
      <SettingsPanel
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </div>
  );
}
