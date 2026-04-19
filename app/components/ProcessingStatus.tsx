"use client";

import React from "react";

type ProcessingState = "vision" | "writing" | "critic";

interface ProcessingStatusProps {
  state: ProcessingState;
}

const stateLabels: Record<ProcessingState, { label: string; description: string }> = {
  vision: { label: "Analyzing Image", description: "Processing your image..." },
  writing: { label: "Generating Caption", description: "Creating captions..." },
  critic: { label: "Reviewing", description: "Quality assurance..." },
};

export default function ProcessingStatus({ state }: ProcessingStatusProps) {
  const currentState = stateLabels[state];
  const stateIndex = ["vision", "writing", "critic"].indexOf(state);
  const progress = ((stateIndex + 1) / 3) * 100;

  return (
    <div className="bg-mistral-cream border border-mistral-orange/20 rounded-sm p-6 space-y-4">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 flex items-center justify-center">
          <div className="relative w-8 h-8">
            <div className="absolute inset-0 border-2 border-mistral-orange/30 rounded-full"></div>
            <div
              className="absolute inset-0 border-2 border-transparent border-t-mistral-orange border-r-mistral-orange rounded-full animate-spin"
              style={{ animationDuration: "1s" }}
            ></div>
          </div>
        </div>
        <div>
          <p className="text-lg font-semibold text-mistral-black uppercase tracking-wider">
            {currentState.label}
          </p>
          <p className="text-sm text-mistral-black/60">
            {currentState.description}
          </p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="h-2 bg-mistral-black/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-mistral-orange to-sunshine-700 transition-all duration-300"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        <p className="text-xs text-mistral-black/50 text-right">
          Step {stateIndex + 1} of 3
        </p>
      </div>

      {/* Steps */}
      <div className="grid grid-cols-3 gap-2 pt-2">
        {(["vision", "writing", "critic"] as const).map((step, idx) => (
          <div key={step} className="flex items-center gap-2">
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold ${
                idx <= stateIndex
                  ? "bg-mistral-orange text-white"
                  : "bg-mistral-black/10 text-mistral-black/50"
              }`}
            >
              {idx < stateIndex ? "✓" : idx + 1}
            </div>
            <span className="text-xs text-mistral-black/60 hidden sm:inline">
              {stateLabels[step as ProcessingState].label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
