import { NextResponse } from "next/server";
import {
  getMetricsSummary,
  getTrends,
  getModelUsage,
  getRecentErrors,
} from "@/lib/metrics";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const endpoint = searchParams.get("endpoint");

    if (endpoint === "summary") {
      const summary = await getMetricsSummary();
      return NextResponse.json(summary);
    }

    if (endpoint === "trends") {
      const days = parseInt(searchParams.get("days") || "7", 10);
      const trends = await getTrends(days);
      return NextResponse.json(trends);
    }

    if (endpoint === "model-usage") {
      const usage = await getModelUsage();
      return NextResponse.json(usage);
    }

    if (endpoint === "errors") {
      const limit = parseInt(searchParams.get("limit") || "20", 10);
      const errors = await getRecentErrors(limit);
      return NextResponse.json(errors);
    }

    // Default: return summary
    const summary = await getMetricsSummary();
    return NextResponse.json(summary);
  } catch (error) {
    console.error("Error fetching metrics:", error);
    return NextResponse.json(
      { error: "Failed to fetch metrics" },
      { status: 500 }
    );
  }
}
