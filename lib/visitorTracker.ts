import { supabase } from "./supabaseClient";

export interface VisitorInfo {
  visitedToday: boolean;
  totalVisits: number;
  lastVisit: string | null;
}

/**
 * Track a visitor and return visitor information
 */
export async function trackVisitor(
  userToken: string
): Promise<VisitorInfo> {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayDate = today.toISOString().split("T")[0]; // YYYY-MM-DD

    // Step 1: Ensure user exists in users table (upsert)
    const { error: userError } = await supabase
      .from("users")
      .upsert(
        {
          user_token: userToken,
          last_visit_date: todayDate,
        },
        {
          onConflict: "user_token",
        }
      );

    if (userError) {
      console.error("Error upserting user:", userError);
    }

    // Step 2: Check if user has already visited today
    const { data: existingVisit, error: checkError } = await supabase
      .from("visit_logs")
      .select("id, count")
      .eq("user_token", userToken)
      .eq("visit_date", todayDate)
      .single();

    if (checkError && checkError.code !== "PGRST116") {
      // PGRST116 is "not found" error which is expected
      console.error("Error checking visit:", checkError);
    }

    let visitedToday = false;

    // Step 3: If no visit today, create one
    if (!existingVisit) {
      const { error: insertError } = await supabase
        .from("visit_logs")
        .insert({
          user_token: userToken,
          visit_date: todayDate,
          count: 1,
        });

      if (insertError) {
        console.error("Error inserting visit:", insertError);
      } else {
        visitedToday = false; // This is their first visit today
      }
    } else {
      visitedToday = true;
    }

    // Get total visits (count of unique dates)
    const { data: allVisits, error: allVisitsError } = await supabase
      .from("visit_logs")
      .select("count", { count: "exact" })
      .eq("user_token", userToken);

    if (allVisitsError) {
      console.error("Error getting total visits:", allVisitsError);
    }

    const totalVisits = allVisits?.reduce(
      (sum, visit) => sum + (visit.count || 1),
      0
    ) || 1;

    // Get last visit date
    const { data: lastVisitData } = await supabase
      .from("visit_logs")
      .select("visit_date")
      .eq("user_token", userToken)
      .order("visit_date", { ascending: false })
      .limit(1)
      .single();

    return {
      visitedToday,
      totalVisits,
      lastVisit: lastVisitData?.visit_date || null,
    };
  } catch (error) {
    console.error("Error tracking visitor:", error);
    // Return default on error
    return {
      visitedToday: false,
      totalVisits: 1,
      lastVisit: null,
    };
  }
}

/**
 * Get visitor info without tracking
 */
export async function getVisitorInfo(
  userToken: string
): Promise<VisitorInfo> {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayDate = today.toISOString().split("T")[0];

    const { data: existingVisit } = await supabase
      .from("visit_logs")
      .select("id")
      .eq("user_token", userToken)
      .eq("visit_date", todayDate)
      .single();

    const visitedToday = !!existingVisit;

    const { data: allVisits } = await supabase
      .from("visit_logs")
      .select("count")
      .eq("user_token", userToken);

    const totalVisits = allVisits?.reduce(
      (sum, visit) => sum + (visit.count || 1),
      0
    ) || 0;

    const { data: lastVisitData } = await supabase
      .from("visit_logs")
      .select("visit_date")
      .eq("user_token", userToken)
      .order("visit_date", { ascending: false })
      .limit(1)
      .single();

    return {
      visitedToday,
      totalVisits,
      lastVisit: lastVisitData?.visit_date || null,
    };
  } catch (error) {
    console.error("Error getting visitor info:", error);
    return {
      visitedToday: false,
      totalVisits: 0,
      lastVisit: null,
    };
  }
}
