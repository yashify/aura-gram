import { supabase } from "./supabaseClient";

export interface MetricsSummary {
  totalApiCalls: number;
  totalVisitors: number;
  errorRate: number;
  averageResponseTime: number;
  dailyCallsToday: number;
}

export interface TrendData {
  date: string;
  calls: number;
  visitors: number;
}

export interface ModelUsage {
  model: string;
  count: number;
}

export interface ErrorLog {
  id: string;
  user_token: string;
  timestamp: string;
  error_message: string;
}

/**
 * Get all metrics for the dashboard
 */
export async function getMetricsSummary(): Promise<MetricsSummary> {
  try {
    const today = new Date().toISOString().split("T")[0];

    // Total API calls
    const { count: totalCalls } = await supabase
      .from("api_calls")
      .select("id", { count: "exact" });

    // Total unique visitors
    const { data: visitorsData } = await supabase
      .from("visit_logs")
      .select("user_token");

    const totalVisitors = new Set(visitorsData?.map((v) => v.user_token) || [])
      .size;

    // Error rate
    const { count: errorCount } = await supabase
      .from("api_calls")
      .select("id", { count: "exact" })
      .eq("status", "error");

    const errorRate =
      totalCalls && totalCalls > 0
        ? ((errorCount || 0) / totalCalls) * 100
        : 0;

    // Average response time
    const { data: responseData } = await supabase
      .from("api_calls")
      .select("response_time_ms")
      .eq("status", "success")
      .not("response_time_ms", "is", null);

    const avgResponseTime =
      responseData && responseData.length > 0
        ? responseData.reduce((sum, item) => sum + (item.response_time_ms || 0), 0) /
          responseData.length
        : 0;

    // Daily calls today
    const { count: dailyCallsToday } = await supabase
      .from("api_calls")
      .select("id", { count: "exact" })
      .gte("timestamp", `${today}T00:00:00`)
      .lte("timestamp", `${today}T23:59:59`)
      .eq("status", "success");

    return {
      totalApiCalls: totalCalls || 0,
      totalVisitors,
      errorRate: parseFloat(errorRate.toFixed(2)),
      averageResponseTime: parseFloat(avgResponseTime.toFixed(0)),
      dailyCallsToday: dailyCallsToday || 0,
    };
  } catch (error) {
    console.error("Error fetching metrics summary:", error);
    return {
      totalApiCalls: 0,
      totalVisitors: 0,
      errorRate: 0,
      averageResponseTime: 0,
      dailyCallsToday: 0,
    };
  }
}

/**
 * Get trends for the last N days
 */
export async function getTrends(days: number = 7): Promise<TrendData[]> {
  try {
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - days * 24 * 60 * 60 * 1000);

    const startDateStr = startDate.toISOString().split("T")[0];
    const endDateStr = endDate.toISOString().split("T")[0];

    // Get API calls per day
    const { data: callsData } = await supabase
      .from("api_calls")
      .select("timestamp")
      .gte("timestamp", `${startDateStr}T00:00:00`)
      .lte("timestamp", `${endDateStr}T23:59:59`)
      .eq("status", "success");

    // Get visitors per day
    const { data: visitorsData } = await supabase
      .from("visit_logs")
      .select("visit_date, user_token")
      .gte("visit_date", startDateStr)
      .lte("visit_date", endDateStr);

    // Aggregate data by date
    const trendMap = new Map<string, TrendData>();

    for (let i = 0; i < days; i++) {
      const date = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
      const dateStr = date.toISOString().split("T")[0];
      trendMap.set(dateStr, { date: dateStr, calls: 0, visitors: 0 });
    }

    // Count calls by date
    callsData?.forEach((item) => {
      const date = item.timestamp.split("T")[0];
      const trend = trendMap.get(date);
      if (trend) {
        trend.calls += 1;
      }
    });

    // Count unique visitors by date
    const visitorsByDate = new Map<string, Set<string>>();
    visitorsData?.forEach((item) => {
      if (!visitorsByDate.has(item.visit_date)) {
        visitorsByDate.set(item.visit_date, new Set());
      }
      visitorsByDate.get(item.visit_date)?.add(item.user_token);
    });

    visitorsByDate.forEach((users, date) => {
      const trend = trendMap.get(date);
      if (trend) {
        trend.visitors = users.size;
      }
    });

    return Array.from(trendMap.values());
  } catch (error) {
    console.error("Error fetching trends:", error);
    return [];
  }
}

/**
 * Get model usage breakdown
 */
export async function getModelUsage(): Promise<ModelUsage[]> {
  try {
    const { data, error } = await supabase
      .from("api_calls")
      .select("model_used")
      .not("model_used", "is", null)
      .eq("status", "success");

    if (error) {
      console.error("Error fetching model usage:", error);
      return [];
    }

    // Count by model
    const modelCounts = new Map<string, number>();
    data?.forEach((item) => {
      if (item.model_used) {
        modelCounts.set(
          item.model_used,
          (modelCounts.get(item.model_used) || 0) + 1
        );
      }
    });

    return Array.from(modelCounts.entries())
      .map(([model, count]) => ({ model, count }))
      .sort((a, b) => b.count - a.count);
  } catch (error) {
    console.error("Error getting model usage:", error);
    return [];
  }
}

/**
 * Get recent errors
 */
export async function getRecentErrors(limit: number = 20): Promise<ErrorLog[]> {
  try {
    const { data, error } = await supabase
      .from("api_calls")
      .select("id, user_token, timestamp, error_message")
      .eq("status", "error")
      .order("timestamp", { ascending: false })
      .limit(limit);

    if (error) {
      console.error("Error fetching error logs:", error);
      return [];
    }

    return (data || []).map((item) => ({
      id: item.id,
      user_token: item.user_token,
      timestamp: item.timestamp,
      error_message: item.error_message || "Unknown error",
    }));
  } catch (error) {
    console.error("Error getting recent errors:", error);
    return [];
  }
}

/**
 * Get daily visitors for a specific date
 */
export async function getDailyVisitors(date: string): Promise<number> {
  try {
    const { data } = await supabase
      .from("visit_logs")
      .select("user_token")
      .eq("visit_date", date);

    const uniqueVisitors = new Set(data?.map((v) => v.user_token) || []);
    return uniqueVisitors.size;
  } catch (error) {
    console.error("Error getting daily visitors:", error);
    return 0;
  }
}
