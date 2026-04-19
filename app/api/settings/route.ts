import { NextResponse } from "next/server";
import { getOrCreateUserId } from "@/lib/auth";
import { supabase } from "@/lib/supabaseClient";

export async function POST(request: Request) {
  try {
    const userToken = await getOrCreateUserId();
    const body = await request.json();

    const {
      custom_api_key,
      custom_model,
      custom_system_prompt,
      preferred_platforms,
    } = body;

    // Validate API key format if provided
    if (custom_api_key && custom_api_key.trim().length === 0) {
      return NextResponse.json(
        { error: "API key cannot be empty" },
        { status: 400 }
      );
    }

    // Upsert user settings
    const { data, error } = await supabase
      .from("user_settings")
      .upsert(
        {
          user_token: userToken,
          custom_api_key: custom_api_key || null,
          custom_model: custom_model || null,
          custom_system_prompt: custom_system_prompt || null,
          preferred_platforms: preferred_platforms || ["instagram"],
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "user_token",
        }
      )
      .select();

    if (error) {
      console.error("Error saving settings:", error);
      return NextResponse.json(
        { error: "Failed to save settings" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: "Settings saved successfully", data },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error processing settings request:", error);
    return NextResponse.json(
      { error: "Failed to process settings request" },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const userToken = await getOrCreateUserId();

    // Get user settings
    const { data, error } = await supabase
      .from("user_settings")
      .select("*")
      .eq("user_token", userToken)
      .single();

    if (error && error.code !== "PGRST116") {
      // PGRST116 is "not found" error which is expected for new users
      console.error("Error fetching settings:", error);
      return NextResponse.json(
        { error: "Failed to fetch settings" },
        { status: 500 }
      );
    }

    // Return default settings if none exist
    const defaultSettings = {
      custom_api_key: null,
      custom_model: null,
      custom_system_prompt: null,
      preferred_platforms: ["instagram"],
    };

    return NextResponse.json(
      data || defaultSettings,
      { status: 200 }
    );
  } catch (error) {
    console.error("Error processing settings request:", error);
    return NextResponse.json(
      { error: "Failed to process settings request" },
      { status: 500 }
    );
  }
}
