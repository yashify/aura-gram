import { cookies } from "next/headers";
import { v4 as uuidv4 } from "uuid";
import { supabase } from "./supabaseClient";

const USER_TOKEN_COOKIE_NAME = "aura_gram_user_token";
const COOKIE_MAX_AGE = 365 * 24 * 60 * 60; // 1 year in seconds

/**
 * Generates a new user token (UUID)
 */
function generateUserToken(): string {
  return uuidv4();
}

/**
 * Gets or creates a user ID for the current request
 * Uses cookies to maintain a consistent user ID across sessions
 * Also ensures the user exists in the Supabase users table
 */
export async function getOrCreateUserId(): Promise<string> {
  const cookieStore = await cookies();
  let userToken = cookieStore.get(USER_TOKEN_COOKIE_NAME)?.value;

  // If no token exists, create one
  if (!userToken) {
    userToken = generateUserToken();
    cookieStore.set(USER_TOKEN_COOKIE_NAME, userToken, {
      maxAge: COOKIE_MAX_AGE,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    });
  }

  // Ensure user exists in Supabase users table
  try {
    const { error } = await supabase
      .from("users")
      .upsert(
        {
          user_token: userToken,
        },
        {
          onConflict: "user_token",
        }
      );

    if (error) {
      console.error("Error upserting user in auth:", error);
      // Don't throw - just log and continue
    }
  } catch (err) {
    console.error("Unexpected error upserting user:", err);
    // Don't throw - just log and continue
  }

  return userToken;
}

/**
 * Gets the current user token from cookies (doesn't create a new one)
 */
export async function getUserToken(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(USER_TOKEN_COOKIE_NAME)?.value ?? null;
}

/**
 * Validates if a user token is a valid UUID
 */
export function isValidUserToken(token: string): boolean {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(token);
}
