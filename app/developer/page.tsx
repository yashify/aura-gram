"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import MetricCard from "@/app/components/MetricCard";
import { TrendChart, SimpleBarChart, SimplePieChart } from "@/app/components/Charts";
import ErrorLogTable from "@/app/components/ErrorLogTable";
import { Button } from "@/components/ui/button";

interface MetricsSummary {
  totalApiCalls: number;
  totalVisitors: number;
  errorRate: number;
  averageResponseTime: number;
  dailyCallsToday: number;
}

interface TrendData {
  date: string;
  calls: number;
  visitors: number;
}

interface ModelUsage {
  model: string;
  count: number;
}

interface ErrorLog {
  id: string;
  user_token: string;
  timestamp: string;
  error_message: string;
}

export default function DeveloperDashboard() {
  const router = useRouter();
  const [metrics, setMetrics] = useState<MetricsSummary | null>(null);
  const [trends, setTrends] = useState<TrendData[]>([]);
  const [modelUsage, setModelUsage] = useState<ModelUsage[]>([]);
  const [errors, setErrors] = useState<ErrorLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const handleLogout = () => {
    // Clear session cookie
    document.cookie = "developer-session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    // Redirect to auth page
    router.push("/developer/auth");
  };

  const fetchData = async () => {
    try {
      setIsLoading(true);

      // Fetch metrics summary
      const summaryRes = await fetch("/api/metrics?endpoint=summary");
      if (summaryRes.ok) {
        setMetrics(await summaryRes.json());
      }

      // Fetch trends
      const trendsRes = await fetch("/api/metrics?endpoint=trends&days=7");
      if (trendsRes.ok) {
        setTrends(await trendsRes.json());
      }

      // Fetch model usage
      const modelRes = await fetch("/api/metrics?endpoint=model-usage");
      if (modelRes.ok) {
        const data = await modelRes.json();
        setModelUsage(data);
      }

      // Fetch error logs
      const errorsRes = await fetch("/api/metrics?endpoint=errors&limit=10");
      if (errorsRes.ok) {
        setErrors(await errorsRes.json());
      }

      setLastUpdated(new Date());
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    // Refresh every 5 minutes
    const interval = setInterval(fetchData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const formatLastUpdated = () => {
    if (!lastUpdated) return "Never";
    return lastUpdated.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  if (isLoading && !metrics) {
    return (
      <main className="flex-1 p-8 bg-warm-ivory">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <p className="text-mistral-black/60">Loading dashboard...</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 p-8 bg-warm-ivory">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-mistral-black mb-2">
              Developer Dashboard
            </h1>
            <p className="text-mistral-black/60">
              Last updated: {formatLastUpdated()}
            </p>
          </div>
          <div className="flex gap-3">
            <Button onClick={fetchData} variant="solid-orange">
              Refresh
            </Button>
            <Button onClick={handleLogout} variant="outline">
              Logout
            </Button>
          </div>
        </div>

        {/* Overview Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <MetricCard
            title="Total API Calls"
            value={metrics?.totalApiCalls || 0}
            description="All-time API calls"
            icon="📊"
          />
          <MetricCard
            title="Unique Visitors"
            value={metrics?.totalVisitors || 0}
            description="Total unique users"
            icon="👥"
          />
          <MetricCard
            title="Error Rate"
            value={`${metrics?.errorRate || 0}%`}
            description="Failed requests"
            icon="⚠️"
          />
          <MetricCard
            title="Avg Response Time"
            value={`${metrics?.averageResponseTime || 0}ms`}
            description="Average latency"
            icon="⚡"
          />
          <MetricCard
            title="Today's Calls"
            value={metrics?.dailyCallsToday || 0}
            description="API calls today"
            icon="📈"
          />
        </div>

        {/* Trends and Usage */}
        <div className="grid grid-cols-1 gap-4">
          {trends.length > 0 && (
            <TrendChart
              data={trends}
              title="API Calls & Visitors (Last 7 Days)"
              description="Track usage patterns over time"
            />
          )}
        </div>

        {/* Model Usage */}
        {modelUsage.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <SimpleBarChart
              data={modelUsage.map(item => ({ name: item.model, value: item.count }))}
              title="Model Usage"
              description="API calls by model"
              xKey="name"
              yKey="value"
            />
            {modelUsage.length > 0 && (
              <SimplePieChart
                data={modelUsage.map(item => ({ name: item.model, value: item.count }))}
                title="Model Distribution"
                description="Percentage of calls per model"
              />
            )}
          </div>
        )}

        {/* Error Log */}
        {errors.length > 0 && (
          <ErrorLogTable
            errors={errors}
            title="Recent Errors"
            description="Latest 10 errors from API calls"
          />
        )}

        {/* Empty State */}
        {!metrics && (
          <div className="bg-white rounded-sm p-8 text-center">
            <p className="text-mistral-black/60">
              No data available yet. Start using aura-gram to see metrics.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
