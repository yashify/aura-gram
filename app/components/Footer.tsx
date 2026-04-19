"use client";

import React from "react";
import { useVisitorTracking } from "@/hooks/useVisitorTracking";

export default function Footer() {
  const currentYear = new Date().getFullYear();
  const { visitorInfo, isLoading } = useVisitorTracking();

  return (
    <footer className="border-t border-mistral-orange/10 bg-mistral-black text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded-sm bg-gradient-to-br from-bright-yellow via-sunshine-700 to-mistral-orange"></div>
              <span className="text-lg font-bold">
                 <a
                    href="/"
                    target="_self"
                    rel="noopener noreferrer"
                    className=""
                >Aura Gram</a>
              </span>
            </div>
            <p className="text-sm text-white/70">
              Generate AI-powered captions for your images across multiple platforms
            </p>
          </div>

          {/* Links */}
          <div className="space-y-2">
            <h3 className="font-semibold">Resources</h3>
            <ul className="space-y-1 text-sm text-white/70">
              <li>
                <a
                  href="https://github.com/yashify/aura-gram/blob/main/LANGGRAPH_ARCHITECTURE.md"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-mistral-orange transition"
                >
                  Documentation
                </a>
              </li>
              {/* <li>
                <a
                  href="https://github.com/yashify/aura-gram/blob/main/API.md"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-mistral-orange transition"
                >
                  API Reference
                </a>
              </li> */}
              <li>
                <a
                  href="https://github.com/yashify/aura-gram"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-mistral-orange transition"
                >
                  GitHub
                </a>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div className="space-y-2">
            <h3 className="font-semibold">Contact</h3>
            <ul className="space-y-1 text-sm text-white/70">
              <li>
                <a
                  href="https://yashify.in"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-mistral-orange transition"
                >
                  yashify.in
                </a>
              </li>
              <li>
                <a
                  href="https://www.linkedin.com/in/yashify/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-mistral-orange transition"
                >
                  Linked In
                </a>
              </li>
              {/* <li>
                <a
                  href="#"
                  className="hover:text-mistral-orange transition"
                >
                  Contact
                </a>
              </li> */}
            </ul>
          </div>

          {/* Visitor Badge */}
          {!isLoading && visitorInfo && (
            <div className="space-y-2">
              <h3 className="font-semibold">Your Visits</h3>
              <div className="bg-mistral-orange/10 border border-mistral-orange/30 rounded-sm p-3 space-y-2">
                <p className="text-sm">
                  {visitorInfo.visitedToday
                    ? `Welcome back! 👋`
                    : `First visit today! 🎉`}
                </p>
                <p className="text-lg font-bold text-mistral-orange">
                  {visitorInfo.totalVisits}
                </p>
                <p className="text-xs text-white/60">
                  Total visit{visitorInfo.totalVisits !== 1 ? "s" : ""}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Copyright */}
        <div className="border-t border-white/10 pt-8">
          <p className="text-center text-sm text-white/60">
            © {currentYear} aura-gram. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
