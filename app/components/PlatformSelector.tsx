"use client";

import React from "react";

interface PlatformSelectorProps {
  selectedPlatforms: string[];
  onChange: (platforms: string[]) => void;
}

const PLATFORMS = [
  { id: "instagram", name: "Instagram", icon: "📷" },
  { id: "twitter", name: "Twitter/X", icon: "𝕏" },
  { id: "facebook", name: "Facebook", icon: "f" },
  { id: "linkedin", name: "LinkedIn", icon: "🔗" },
  { id: "tiktok", name: "TikTok", icon: "🎵" },
  { id: "pinterest", name: "Pinterest", icon: "📌" },
  { id: "threads", name: "Threads", icon: "@" },
];

export default function PlatformSelector({
  selectedPlatforms,
  onChange,
}: PlatformSelectorProps) {
  const togglePlatform = (platform: string) => {
    if (selectedPlatforms.includes(platform)) {
      onChange(selectedPlatforms.filter((p) => p !== platform));
    } else {
      onChange([...selectedPlatforms, platform]);
    }
  };

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-mistral-black uppercase tracking-wider">
        Select Platforms
      </label>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
        {PLATFORMS.map((platform) => (
          <label
            key={platform.id}
            className={`flex items-center p-3 border rounded-sm cursor-pointer transition ${
              selectedPlatforms.includes(platform.id)
                ? "border-mistral-orange bg-mistral-orange/5"
                : "border-mistral-orange/20 hover:border-mistral-orange/50"
            }`}
          >
            <input
              type="checkbox"
              checked={selectedPlatforms.includes(platform.id)}
              onChange={() => togglePlatform(platform.id)}
              className="w-4 h-4 accent-mistral-orange"
            />
            <span className="ml-2 text-sm font-medium text-mistral-black">
              {platform.name}
            </span>
          </label>
        ))}
      </div>
    </div>
  );
}
