"use client";

import { useEffect, useState } from "react";

interface VisitorInfo {
  visitedToday: boolean;
  totalVisits: number;
  lastVisit: string | null;
}

export function useVisitorTracking() {
  const [visitorInfo, setVisitorInfo] = useState<VisitorInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const trackVisitor = async () => {
      try {
        setIsLoading(true);
        const response = await fetch("/api/visitor-tracking", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          throw new Error("Failed to track visitor");
        }

        const data = await response.json();
        setVisitorInfo(data);
        setError(null);
      } catch (err) {
        console.error("Error tracking visitor:", err);
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setIsLoading(false);
      }
    };

    trackVisitor();
  }, []);

  return {
    visitorInfo,
    isLoading,
    error,
  };
}
