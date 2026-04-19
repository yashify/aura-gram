"use client";

import { useState, useRef } from "react";
import ModeSelector from "@/app/components/ModeSelector";
import PlatformSelector from "@/app/components/PlatformSelector";
import ProcessingStatus from "@/app/components/ProcessingStatus";
import ResultDisplay from "@/app/components/ResultDisplay";

type ProcessingState = "idle" | "vision" | "writing" | "critic" | "complete";
type Mode = "captions" | "analysis";

interface Result {
  description: string;
  caption?: string;
  captions?: Record<string, string>;
  analysis?: string;
  retries: number;
}

export default function Home() {
  const [imageUrl, setImageUrl] = useState("");
  const [processingState, setProcessingState] = useState<ProcessingState>("idle");
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState("");
  const [mode, setMode] = useState<Mode>("captions");
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(["instagram"]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setImageUrl(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setImageUrl(e.target.value);
  };

  const getBase64FromDataUrl = (dataUrl: string): string => {
    return dataUrl.split(",")[1];
  };

  const handleSubmit = async () => {
    if (!imageUrl) {
      setError("Please provide an image");
      return;
    }

    setError("");
    setResult(null);
    setProcessingState("vision");

    try {
      const requestBody: any = {
        platforms: selectedPlatforms,
        mode,
      };

      // Check if imageUrl is a data URL (file upload) or a regular URL
      if (imageUrl.startsWith("data:")) {
        // File upload - convert to base64
        const imageBase64 = getBase64FromDataUrl(imageUrl);
        requestBody.imageBase64 = imageBase64;
      } else {
        // Regular URL - send as imageUrl
        requestBody.imageUrl = imageUrl;
      }

      const response = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      if (response.status === 429) {
        const data = await response.json();
        setError(
          `Rate limit exceeded. Please try again after ${new Date(data.resetAt).toLocaleTimeString()}`
        );
        setProcessingState("idle");
        return;
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to generate caption");
      }

      const data = await response.json();
      setResult(data);
      setProcessingState("complete");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to process image. Please try again.");
      setProcessingState("idle");
    }
  };

  const handleReset = () => {
    setImageUrl("");
    setResult(null);
    setProcessingState("idle");
    setError("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <main className="min-h-screen py-16 px-4">
      {/* Mistral Block Identity - Top Bar */}
      <div className="fixed top-0 left-0 right-0 h-1 flex z-50">
        <div className="h-full w-[16.67%] bg-[#ffd900]"></div>
        <div className="h-full w-[16.67%] bg-[#ffe295]"></div>
        <div className="h-full w-[16.67%] bg-[#ffa110]"></div>
        <div className="h-full w-[16.67%] bg-[#ff8105]"></div>
        <div className="h-full w-[16.67%] bg-[#fb6424]"></div>
        <div className="h-full w-[16.67%] bg-[#fa520f]"></div>
      </div>

      <div className="max-w-4xl mx-auto pt-8">
        {/* Header - Mistral Style */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold leading-none tracking-[-2.05px] text-mistral-black mb-4">
            AURA GRAM
          </h1>
          <p className="text-base text-mistral-black/60 uppercase tracking-wider">
            AI-Powered Caption Generation
          </p>
        </div>

        {/* Upload Card - Mistral Style */}
        <div className="bg-mistral-cream shadow-warm-md p-8 mb-6 space-y-6 rounded-sm">
          <h2 className="text-2xl font-semibold text-mistral-black uppercase tracking-wider">
            Upload Your Image
          </h2>

          {/* Mode Selector */}
          <ModeSelector mode={mode} onChange={setMode} />

          {/* Platform Selector (only show in captions mode) */}
          {mode === "captions" && (
            <PlatformSelector
              selectedPlatforms={selectedPlatforms}
              onChange={setSelectedPlatforms}
            />
          )}

          {/* Image Preview */}
          {imageUrl && (
            <div className="relative overflow-hidden rounded-sm">
              <img
                src={imageUrl}
                alt="Preview"
                className="w-full h-72 object-cover"
              />
              <button
                onClick={handleReset}
                className="absolute top-4 right-4 bg-mistral-black/80 text-white w-10 h-10 flex items-center justify-center hover:bg-mistral-black transition-colors rounded-sm"
              >
                ✕
              </button>
            </div>
          )}

          {/* Input Methods */}
          <div className="space-y-6 border-t border-mistral-orange/10 pt-6">
            <div>
              <label className="block text-sm text-mistral-black/70 mb-2 uppercase tracking-wider font-medium">
                Choose an image file
              </label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="w-full px-4 py-4 border-2 border-dashed border-mistral-black/20 bg-transparent hover:border-mistral-orange focus:border-mistral-orange focus:outline-none transition-colors cursor-pointer rounded-sm"
              />
            </div>

            <div className="relative">
              <div className="absolute inset-x-0 flex items-center">
                <div className="w-full border-t border-mistral-black/10" />
                <span className="px-4 text-sm text-mistral-black/50 bg-mistral-cream uppercase">
                  or
                </span>
                <div className="w-full border-t border-mistral-black/10" />
              </div>
            </div>

            <div>
              <label className="block text-sm text-mistral-black/70 mb-2 uppercase tracking-wider font-medium">
                Paste an image URL
              </label>
              <input
                type="url"
                value={imageUrl.startsWith("data:") ? "" : imageUrl}
                onChange={handleUrlChange}
                placeholder="https://example.com/image.jpg"
                className="w-full px-4 py-4 border border-mistral-black/20 bg-transparent focus:border-mistral-orange focus:ring-2 focus:ring-mistral-orange/20 focus:outline-none transition-all rounded-sm"
              />
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-sm">
              {error}
            </div>
          )}

          {/* Generate Button - Dark Solid */}
          <button
            onClick={handleSubmit}
            disabled={!imageUrl || processingState !== "idle"}
            className="w-full py-4 bg-mistral-black text-white font-semibold uppercase tracking-wider hover:bg-mistral-orange disabled:opacity-50 disabled:cursor-not-allowed transition-all rounded-sm"
          >
            {processingState === "idle"
              ? mode === "analysis"
                ? "Analyze Image"
                : "Generate Caption"
              : "Processing..."}
          </button>
        </div>

        {/* Processing State - Mistral Style */}
        {processingState !== "idle" && processingState !== "complete" && (
          <ProcessingStatus state={processingState as any} />
        )}

        {/* Result Card */}
        {result && processingState === "complete" && (
          <ResultDisplay
            mode={mode}
            description={result.description || result.analysis || ""}
            captions={result.captions}
            imageUrl={imageUrl}
            retries={result.retries}
            onTryAgain={handleReset}
          />
        )}
      </div>
    </main>
  );
}