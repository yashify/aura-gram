import { supabase } from "./supabaseClient";

export interface RateLimitInfo {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
  retryAfter?: number; // seconds
}

/**
 * Check if a user has exceeded their rate limit
 * Checks both hourly and daily limits
 */
export async function checkRateLimit(
  userToken: string
): Promise<RateLimitInfo> {
  const callsPerDay = parseInt(
    process.env.RATE_LIMIT_CALLS_PER_DAY || "5",
    10
  );
  const callsPerHour = parseInt(
    process.env.RATE_LIMIT_CALLS_PER_HOUR || "2",
    10
  );
  const windowMs = parseInt(process.env.RATE_LIMIT_WINDOW_MS || "3600000", 10);

  try {
    // Get current timestamp
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - windowMs);
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Query API calls in the last hour
    const { data: hourlyData, error: hourlyError } = await supabase
      .from("api_calls")
      .select("id")
      .eq("user_token", userToken)
      .gte("timestamp", oneHourAgo.toISOString())
      .eq("status", "success");

    if (hourlyError) {
      console.error("Rate limit check error (hourly):", hourlyError);
      // On error, allow the request (fail open)
      return {
        allowed: true,
        remaining: callsPerHour,
        resetAt: new Date(now.getTime() + windowMs),
      };
    }

    // Check hourly limit
    if (hourlyData && hourlyData.length >= callsPerHour) {
      const resetTime = new Date(oneHourAgo.getTime() + windowMs);
      return {
        allowed: false,
        remaining: 0,
        resetAt: resetTime,
        retryAfter: Math.ceil(
          (resetTime.getTime() - now.getTime()) / 1000
        ),
      };
    }

    // Query API calls today
    const { data: dailyData, error: dailyError } = await supabase
      .from("api_calls")
      .select("id")
      .eq("user_token", userToken)
      .gte("timestamp", todayStart.toISOString())
      .eq("status", "success");

    if (dailyError) {
      console.error("Rate limit check error (daily):", dailyError);
      // On error, allow the request (fail open)
      return {
        allowed: true,
        remaining: callsPerDay,
        resetAt: new Date(todayStart.getTime() + 24 * 60 * 60 * 1000),
      };
    }

    // Check daily limit
    if (dailyData && dailyData.length >= callsPerDay) {
      const resetTime = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);
      return {
        allowed: false,
        remaining: 0,
        resetAt: resetTime,
        retryAfter: Math.ceil((resetTime.getTime() - now.getTime()) / 1000),
      };
    }

    // User is within limits
    const remainingToday = callsPerDay - (dailyData?.length || 0);
    const remainingThisHour = callsPerHour - (hourlyData?.length || 0);

    return {
      allowed: true,
      remaining: Math.min(remainingToday, remainingThisHour),
      resetAt: new Date(
        Math.min(
          todayStart.getTime() + 24 * 60 * 60 * 1000,
          oneHourAgo.getTime() + windowMs
        )
      ),
    };
  } catch (error) {
    console.error("Rate limiter error:", error);
    // Fail open on errors
    return {
      allowed: true,
      remaining: Math.min(
        parseInt(process.env.RATE_LIMIT_CALLS_PER_HOUR || "2", 10),
        parseInt(process.env.RATE_LIMIT_CALLS_PER_DAY || "5", 10)
      ),
      resetAt: new Date(Date.now() + windowMs),
    };
  }
}

/**
 * Log an API call to the database
 */
export async function logApiCall(
  userToken: string,
  status: "success" | "error" | "rate_limited",
  modelUsed?: string,
  errorMessage?: string,
  responseTimeMs?: number
): Promise<void> {
  try {
    // Ensure user exists in users table first
    const { error: userError } = await supabase
      .from("users")
      .upsert(
        {
          user_token: userToken,
        },
        {
          onConflict: "user_token",
        }
      );

    if (userError) {
      console.error("Error upserting user for API call:", userError);
      // Continue anyway - non-critical
    }

    // Now insert the API call
    const { error: insertError } = await supabase.from("api_calls").insert({
      user_token: userToken,
      status,
      model_used: modelUsed,
      error_message: errorMessage,
      response_time_ms: responseTimeMs,
      retry_count: 0,
    });

    if (insertError) {
      console.error("Error logging API call:", insertError);
    }
  } catch (error) {
    console.error("Error in logApiCall:", error);
    // Non-critical error, don't throw
  }
}
