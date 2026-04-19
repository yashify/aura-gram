"use client";

import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface MetricCardProps {
  title: string;
  value: string | number;
  description?: string;
  trend?: {
    value: number;
    direction: "up" | "down";
  };
  icon?: React.ReactNode;
}

export default function MetricCard({
  title,
  value,
  description,
  trend,
  icon,
}: MetricCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon && <div className="h-4 w-4 text-mistral-orange">{icon}</div>}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-mistral-black">{value}</div>
        {description && (
          <p className="text-xs text-mistral-black/60 mt-2">{description}</p>
        )}
        {trend && (
          <div className="mt-2">
            <span
              className={`text-xs font-semibold ${
                trend.direction === "up"
                  ? "text-green-600"
                  : "text-red-600"
              }`}
            >
              {trend.direction === "up" ? "↑" : "↓"} {Math.abs(trend.value)}%
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
