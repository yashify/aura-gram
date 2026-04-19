import { NextResponse } from "next/server";
import { getOrCreateUserId } from "@/lib/auth";
import { trackVisitor } from "@/lib/visitorTracker";

export async function POST(request: Request) {
  try {
    // Get or create user token
    const userToken = await getOrCreateUserId();

    // Track the visitor
    const visitorInfo = await trackVisitor(userToken);

    return NextResponse.json(visitorInfo, {
      status: 200,
      headers: {
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("Error tracking visitor:", error);
    return NextResponse.json(
      { error: "Failed to track visitor" },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    // Get or create user token
    const userToken = await getOrCreateUserId();

    // Get visitor info
    const { getVisitorInfo } = await import("@/lib/visitorTracker");
    const visitorInfo = await getVisitorInfo(userToken);

    return NextResponse.json(visitorInfo, {
      status: 200,
      headers: {
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("Error getting visitor info:", error);
    return NextResponse.json(
      { error: "Failed to get visitor info" },
      { status: 500 }
    );
  }
}
