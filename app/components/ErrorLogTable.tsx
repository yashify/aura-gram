"use client";

import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface ErrorLog {
  id: string;
  user_token: string;
  timestamp: string;
  error_message: string;
}

interface ErrorLogTableProps {
  errors: ErrorLog[];
  title?: string;
  description?: string;
}

export default function ErrorLogTable({
  errors,
  title = "Recent Errors",
  description = "Latest errors from API calls",
}: ErrorLogTableProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const truncateMessage = (message: string, length: number = 60) => {
    return message.length > length
      ? message.substring(0, length) + "..."
      : message;
  };

  const truncateToken = (token: string) => {
    return token.substring(0, 8) + "..." + token.substring(token.length - 4);
  };

  if (errors.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
        <CardContent>
          <p className="text-center text-mistral-black/60 py-8">
            No errors recorded
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="col-span-1 md:col-span-2">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-mistral-orange/20">
              <tr>
                <th className="text-left py-3 px-2 font-semibold text-mistral-black">
                  Time
                </th>
                <th className="text-left py-3 px-2 font-semibold text-mistral-black">
                  User
                </th>
                <th className="text-left py-3 px-2 font-semibold text-mistral-black">
                  Error Message
                </th>
              </tr>
            </thead>
            <tbody>
              {errors.map((error) => (
                <tr
                  key={error.id}
                  className="border-b border-mistral-orange/10 hover:bg-warm-ivory transition"
                >
                  <td className="py-3 px-2 text-mistral-black/70">
                    {formatDate(error.timestamp)}
                  </td>
                  <td className="py-3 px-2 font-mono text-xs text-mistral-black/60">
                    {truncateToken(error.user_token)}
                  </td>
                  <td
                    className="py-3 px-2 text-mistral-black/70"
                    title={error.error_message}
                  >
                    {truncateMessage(error.error_message)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
