"use client";

import React from "react";

interface ModeSelectorProps {
  mode: "captions" | "analysis";
  onChange: (mode: "captions" | "analysis") => void;
}

export default function ModeSelector({ mode, onChange }: ModeSelectorProps) {
  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-mistral-black uppercase tracking-wider">
        Select Mode
      </label>
      <div className="flex gap-4">
        <label className="flex items-center cursor-pointer">
          <input
            type="radio"
            name="mode"
            value="captions"
            checked={mode === "captions"}
            onChange={() => onChange("captions")}
            className="w-4 h-4 accent-mistral-orange"
          />
          <span className="ml-3 font-medium text-mistral-black">
            Generate Captions
          </span>
        </label>
        <label className="flex items-center cursor-pointer">
          <input
            type="radio"
            name="mode"
            value="analysis"
            checked={mode === "analysis"}
            onChange={() => onChange("analysis")}
            className="w-4 h-4 accent-mistral-orange"
          />
          <span className="ml-3 font-medium text-mistral-black">
            Analyze Image
          </span>
        </label>
      </div>
      <div className="bg-warm-ivory border border-mistral-orange/10 rounded-sm p-3 text-sm text-mistral-black/70">
        {mode === "captions"
          ? "Generate AI captions optimized for multiple social media platforms"
          : "Get a detailed analysis and description of your image"}
      </div>
    </div>
  );
}
