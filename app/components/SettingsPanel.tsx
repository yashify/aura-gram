"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SettingsPanel({ isOpen, onClose }: SettingsPanelProps) {
  const [customApiKey, setCustomApiKey] = useState("");
  const [customModel, setCustomModel] = useState("");
  const [customSystemPrompt, setCustomSystemPrompt] = useState("");
  const [preferredPlatforms, setPreferredPlatforms] = useState<string[]>([
    "instagram",
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const platforms = [
    "instagram",
    "twitter",
    "facebook",
    "linkedin",
    "tiktok",
    "pinterest",
    "threads",
  ];

  const defaultPrompts: Record<string, string> = {
    instagram:
      process.env.NEXT_PUBLIC_DEFAULT_SYSTEM_PROMPT_INSTAGRAM ||
      "You are an expert Instagram caption writer. Create engaging, trendy captions that include relevant hashtags and emojis.",
    twitter:
      process.env.NEXT_PUBLIC_DEFAULT_SYSTEM_PROMPT_TWITTER ||
      "You are a Twitter expert. Create punchy, witty captions in 280 characters or less.",
    facebook:
      process.env.NEXT_PUBLIC_DEFAULT_SYSTEM_PROMPT_FACEBOOK ||
      "You are a Facebook marketing expert. Create friendly, conversational captions.",
    linkedin:
      process.env.NEXT_PUBLIC_DEFAULT_SYSTEM_PROMPT_LINKEDIN ||
      "You are a LinkedIn professional. Create thoughtful, value-driven captions.",
    tiktok:
      process.env.NEXT_PUBLIC_DEFAULT_SYSTEM_PROMPT_TIKTOK ||
      "You are a TikTok content expert. Create trendy, Gen Z-friendly captions.",
    pinterest:
      process.env.NEXT_PUBLIC_DEFAULT_SYSTEM_PROMPT_PINTEREST ||
      "You are a Pinterest expert. Create inspirational, descriptive captions.",
    threads:
      process.env.NEXT_PUBLIC_DEFAULT_SYSTEM_PROMPT_THREADS ||
      "You are a Threads expert. Create casual, conversational captions.",
  };

  // Load settings on open
  useEffect(() => {
    if (isOpen) {
      loadSettings();
    }
  }, [isOpen]);

  const loadSettings = async () => {
    try {
      const response = await fetch("/api/settings");
      if (response.ok) {
        const data = await response.json();
        setCustomApiKey(data.custom_api_key || "");
        setCustomModel(data.custom_model || "");
        setCustomSystemPrompt(data.custom_system_prompt || "");
        setPreferredPlatforms(data.preferred_platforms || ["instagram"]);
      }
    } catch (err) {
      console.error("Error loading settings:", err);
    }
  };

  const handleSave = async () => {
    setIsLoading(true);
    setError(null);
    setIsSaved(false);

    try {
      const response = await fetch("/api/settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          custom_api_key: customApiKey || null,
          custom_model: customModel || null,
          custom_system_prompt: customSystemPrompt || null,
          preferred_platforms: preferredPlatforms,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to save settings");
      }

      setIsSaved(true);
      setTimeout(() => {
        setIsSaved(false);
        onClose();
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePlatformToggle = (platform: string) => {
    setPreferredPlatforms((prev) =>
      prev.includes(platform)
        ? prev.filter((p) => p !== platform)
        : [...prev, platform]
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">Settings</CardTitle>
              <CardDescription>
                Customize your AI caption generation
              </CardDescription>
            </div>
            <button
              onClick={onClose}
              className="text-mistral-black/60 hover:text-mistral-black text-2xl leading-none"
            >
              ✕
            </button>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* API Configuration Section */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg text-mistral-black">
              API Configuration
            </h3>

            {/* API Key */}
            <div>
              <label className="block text-sm font-medium text-mistral-black mb-2">
                Custom API Key (Optional)
              </label>
              <input
                type="password"
                value={customApiKey}
                onChange={(e) => setCustomApiKey(e.target.value)}
                placeholder="Leave empty to use default NVIDIA NIM API key"
                className="w-full px-3 py-2 border border-mistral-orange/20 rounded-sm bg-warm-ivory focus:outline-none focus:border-mistral-orange focus:ring-2 focus:ring-mistral-orange/20"
              />
              <p className="text-xs text-mistral-black/50 mt-1">
                Your API key is encrypted and never shared
              </p>
            </div>

            {/* Model */}
            <div>
              <label className="block text-sm font-medium text-mistral-black mb-2">
                Custom Model (Optional)
              </label>
              <input
                type="text"
                value={customModel}
                onChange={(e) => setCustomModel(e.target.value)}
                placeholder="e.g., gpt-4, claude-3-sonnet"
                className="w-full px-3 py-2 border border-mistral-orange/20 rounded-sm bg-warm-ivory focus:outline-none focus:border-mistral-orange focus:ring-2 focus:ring-mistral-orange/20"
              />
              <p className="text-xs text-mistral-black/50 mt-1">
                Default: Qwen 3.5 122B
              </p>
            </div>

            {/* System Prompt */}
            <div>
              <label className="block text-sm font-medium text-mistral-black mb-2">
                Custom System Prompt (Optional)
              </label>
              <textarea
                value={customSystemPrompt}
                onChange={(e) => setCustomSystemPrompt(e.target.value)}
                placeholder="Leave empty to use platform-specific defaults"
                rows={6}
                className="w-full px-3 py-2 border border-mistral-orange/20 rounded-sm bg-warm-ivory focus:outline-none focus:border-mistral-orange focus:ring-2 focus:ring-mistral-orange/20 font-mono text-sm"
              />
              <p className="text-xs text-mistral-black/50 mt-1">
                This will override default prompts for all platforms
              </p>
            </div>

            {/* Default Prompt Preview */}
            <div className="bg-warm-ivory border border-mistral-orange/10 rounded-sm p-4">
              <p className="text-xs font-semibold text-mistral-black/60 mb-2">
                Default Instagram Prompt
              </p>
              <p className="text-sm text-mistral-black/70">
                {defaultPrompts.instagram}
              </p>
            </div>
          </div>

          {/* Platform Preferences Section */}
          <div className="space-y-4 border-t border-mistral-orange/10 pt-6">
            <h3 className="font-semibold text-lg text-mistral-black">
              Preferred Platforms
            </h3>
            <p className="text-sm text-mistral-black/60">
              Select which platforms to generate captions for
            </p>

            <div className="grid grid-cols-2 gap-3">
              {platforms.map((platform) => (
                <label
                  key={platform}
                  className="flex items-center p-3 border border-mistral-orange/20 rounded-sm cursor-pointer hover:bg-warm-ivory transition"
                >
                  <input
                    type="checkbox"
                    checked={preferredPlatforms.includes(platform)}
                    onChange={() => handlePlatformToggle(platform)}
                    className="w-4 h-4 accent-mistral-orange"
                  />
                  <span className="ml-3 text-sm font-medium text-mistral-black capitalize">
                    {platform}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-sm p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Success Message */}
          {isSaved && (
            <div className="bg-green-50 border border-green-200 rounded-sm p-3 text-sm text-green-700">
              ✓ Settings saved successfully!
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 border-t border-mistral-orange/10 pt-6">
            <Button
              onClick={handleSave}
              disabled={isLoading}
              variant="solid-orange"
              className="flex-1 py-2"
            >
              {isLoading ? "Saving..." : "Save Settings"}
            </Button>
            <Button
              onClick={onClose}
              variant="ghost"
              className="flex-1 py-2"
            >
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
