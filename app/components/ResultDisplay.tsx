"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";

interface ResultDisplayProps {
  mode: "captions" | "analysis";
  description: string;
  captions?: Record<string, string>;
  imageUrl?: string;
  retries?: number;
  onTryAgain: () => void;
}

export default function ResultDisplay({
  mode,
  description,
  captions,
  imageUrl,
  retries,
  onTryAgain,
}: ResultDisplayProps) {
  const [copiedCaption, setCopiedCaption] = useState<string | null>(null);

  const handleCopyCaption = async (platform: string, caption: string) => {
    try {
      await navigator.clipboard.writeText(caption);
      setCopiedCaption(platform);
      setTimeout(() => setCopiedCaption(null), 2000);
    } catch (error) {
      console.error("Error copying to clipboard:", error);
    }
  };

  return (
    <div className="bg-mistral-cream border border-mistral-orange/20 rounded-sm overflow-hidden shadow-warm">
      {/* Image Preview */}
      {imageUrl && (
        <div className="h-56 overflow-hidden">
          <img
            src={imageUrl}
            alt="Uploaded"
            className="w-full h-full object-cover"
          />
        </div>
      )}

      <div className="p-8 space-y-6">
        {/* Analysis / Description */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-mistral-black/60 uppercase tracking-wider">
            {mode === "analysis" ? "Image Analysis" : "Scene Analysis"}
          </h3>
          <p className="text-base leading-relaxed text-mistral-black">
            {description}
          </p>
        </div>

        {/* Captions (if in captions mode) */}
        {mode === "captions" && captions && (
          <div className="space-y-4 border-t border-mistral-orange/10 pt-6">
            <h3 className="text-sm font-semibold text-mistral-black/60 uppercase tracking-wider">
              Generated Captions
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(captions).map(([platform, caption]) => (
                <div
                  key={platform}
                  className="bg-white border border-mistral-orange/10 rounded-sm p-4 space-y-3 flex flex-col h-full"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-mistral-black capitalize">
                      {platform}
                    </span>
                  </div>
                  <div className="relative flex-1">
                    <pre
                      className="text-sm text-mistral-black/80 whitespace-pre-line break-words bg-mistral-cream rounded px-3 py-2 max-h-48 overflow-y-auto border border-mistral-orange/10"
                      style={{ fontFamily: 'inherit', margin: 0 }}
                    >
                      {caption}
                    </pre>
                  </div>
                  <Button
                    onClick={() => handleCopyCaption(platform, caption)}
                    variant={copiedCaption === platform ? "cream" : "outline"}
                    className="w-full text-xs py-2 mt-2"
                  >
                    {copiedCaption === platform ? "✓ Copied!" : "Copy Caption"}
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Stats */}
        {retries !== undefined && (
          <div className="flex items-center justify-between text-sm text-mistral-black/60 uppercase tracking-wider border-t border-mistral-orange/10 pt-6">
            <span>Processing attempts: {retries}</span>
            <span className="text-mistral-orange font-semibold">✓ Approved</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 border-t border-mistral-orange/10 pt-6">
          <Button
            onClick={onTryAgain}
            variant="solid-orange"
            className="flex-1 py-3"
          >
            Try Another Image
          </Button>
          {mode === "captions" && captions && (
            <Button
              onClick={() => {
                const allCaptions = Object.values(captions).join("\n\n");
                navigator.clipboard.writeText(allCaptions);
              }}
              variant="ghost"
              className="flex-1 py-3"
            >
              Copy All
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
