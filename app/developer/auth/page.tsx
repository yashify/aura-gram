"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export default function DeveloperAuth() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      // Redirect to dashboard with token
      router.push(`/developer?token=${encodeURIComponent(password)}`);
    } catch (err) {
      setError("Failed to authenticate");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-warm-ivory px-4">
      {/* Top Brand Bar */}
      <div className="fixed top-0 left-0 right-0 h-1 flex z-50">
        <div className="h-full w-[16.67%] bg-[#ffd900]"></div>
        <div className="h-full w-[16.67%] bg-[#ffe295]"></div>
        <div className="h-full w-[16.67%] bg-[#ffa110]"></div>
        <div className="h-full w-[16.67%] bg-[#ff8105]"></div>
        <div className="h-full w-[16.67%] bg-[#fb6424]"></div>
        <div className="h-full w-[16.67%] bg-[#fa520f]"></div>
      </div>

      <div className="max-w-sm w-full">
        <div className="bg-mistral-cream shadow-warm-md p-8 rounded-sm">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-mistral-black mb-2">
              Developer Dashboard
            </h1>
            <p className="text-mistral-black/60 text-sm uppercase tracking-wider">
              Password Protected
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-mistral-black/70 mb-2 uppercase tracking-wider">
                Dashboard Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full px-4 py-3 border border-mistral-black/20 bg-white rounded-sm focus:border-mistral-orange focus:outline-none focus:ring-2 focus:ring-mistral-orange/20 transition-all"
                disabled={isLoading}
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-sm">
                {error}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={!password || isLoading}
              className="w-full py-3 bg-mistral-black text-white font-semibold uppercase tracking-wider hover:bg-mistral-orange disabled:opacity-50 disabled:cursor-not-allowed transition-all rounded-sm"
            >
              {isLoading ? "Authenticating..." : "Access Dashboard"}
            </button>
          </form>

          {/* Help Text */}
          <p className="text-center text-xs text-mistral-black/50 uppercase tracking-wider mt-6">
            If no password is set, dashboard is publicly accessible
          </p>
        </div>
      </div>
    </div>
  );
}
