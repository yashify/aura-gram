"use client";

import React from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface TrendChartProps {
  data: Array<{
    date: string;
    calls: number;
    visitors: number;
  }>;
  title: string;
  description?: string;
}

export function TrendChart({
  data,
  title,
  description,
}: TrendChartProps) {
  return (
    <Card className="col-span-1 md:col-span-2">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#ddd" />
            <XAxis
              dataKey="date"
              tick={{ fill: "#1f1f1f", fontSize: 12 }}
            />
            <YAxis tick={{ fill: "#1f1f1f", fontSize: 12 }} />
            <Tooltip
              contentStyle={{
                backgroundColor: "#fff0c2",
                border: "1px solid #fa520f",
                borderRadius: "4px",
              }}
              formatter={(value: any) => value.toString()}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="calls"
              stroke="#fa520f"
              dot={{ fill: "#fa520f" }}
              name="API Calls"
            />
            <Line
              type="monotone"
              dataKey="visitors"
              stroke="#ffa110"
              dot={{ fill: "#ffa110" }}
              name="Visitors"
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

interface BarChartProps {
  data: Array<{
    name: string;
    value: number;
  }>;
  title: string;
  description?: string;
  xKey?: string;
  yKey?: string;
}

export function SimpleBarChart({
  data,
  title,
  description,
  xKey = "name",
  yKey = "value",
}: BarChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#ddd" />
            <XAxis
              dataKey={xKey}
              tick={{ fill: "#1f1f1f", fontSize: 12 }}
            />
            <YAxis tick={{ fill: "#1f1f1f", fontSize: 12 }} />
            <Tooltip
              contentStyle={{
                backgroundColor: "#fff0c2",
                border: "1px solid #fa520f",
                borderRadius: "4px",
              }}
            />
            <Bar dataKey={yKey} fill="#fa520f" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

interface PieChartProps {
  data: Array<{
    name: string;
    value: number;
  }>;
  title: string;
  description?: string;
}

export function SimplePieChart({
  data,
  title,
  description,
}: PieChartProps) {
  const COLORS = ["#fa520f", "#ffa110", "#ffb83e", "#ffd06a", "#ffd900"];

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent className="flex justify-center">
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, value }) => `${name}: ${value}`}
              outerRadius={80}
              fill="#fa520f"
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[index % COLORS.length]}
                />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: "#fff0c2",
                border: "1px solid #fa520f",
                borderRadius: "4px",
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
