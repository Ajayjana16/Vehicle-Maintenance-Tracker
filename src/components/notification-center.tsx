"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  Bell,
  CheckCheck,
  AlertTriangle,
  AlertOctagon,
  Wrench,
  Cpu,
  Info,
  X,
  ExternalLink,
} from "lucide-react";
import { NotificationItem } from "@/types";
import { apiFetch } from "@/lib/api-client";
import { useAuth } from "@/components/auth-context";

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
  onNotificationCountUpdate?: (count: number) => void;
}

export default function NotificationCenter({
  isOpen,
  onClose,
  onNotificationCountUpdate,
}: NotificationCenterProps) {
  const { isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
  const [loading, setLoading] = useState(false);

  const fetchNotifications = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      setLoading(true);
      const data = await apiFetch<NotificationItem[]>("/api/notifications");
      setNotifications(data);
      const unread = data.filter((n) => n.status === "UNREAD").length;
      if (onNotificationCountUpdate) onNotificationCountUpdate(unread);
    } catch (err) {
      console.error("Failed to load notifications:", err);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, onNotificationCountUpdate]);

  useEffect(() => {
    if (isOpen) {
      void fetchNotifications();
    }
  }, [isOpen, fetchNotifications]);

  const handleMarkAllRead = async () => {
    try {
      await apiFetch("/api/notifications", {
        method: "PATCH",
        body: JSON.stringify({ markAllRead: true }),
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, status: "READ" })));
      if (onNotificationCountUpdate) onNotificationCountUpdate(0);
    } catch (err) {
      console.error("Failed to mark notifications read:", err);
    }
  };

  const handleMarkSingleRead = async (id: string) => {
    try {
      await apiFetch("/api/notifications", {
        method: "PATCH",
        body: JSON.stringify({ id, status: "READ" }),
      });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, status: "READ" } : n))
      );
    } catch (err) {
      console.error("Failed to mark notification read:", err);
    }
  };

  if (!isOpen) return null;

  const filtered = notifications.filter((n) => {
    if (categoryFilter === "ALL") return true;
    if (categoryFilter === "UNREAD") return n.status === "UNREAD";
    return n.type === categoryFilter;
  });

  const getAlertIcon = (type: NotificationItem["type"]) => {
    switch (type) {
      case "CRITICAL":
        return <AlertOctagon className="h-4 w-4 text-red-400" />;
      case "WARNING":
        return <AlertTriangle className="h-4 w-4 text-amber-400" />;
      case "MAINTENANCE":
        return <Wrench className="h-4 w-4 text-sky-400" />;
      case "DIAGNOSTIC":
        return <Cpu className="h-4 w-4 text-purple-400" />;
      default:
        return <Info className="h-4 w-4 text-slate-400" />;
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md h-full bg-[#0c0f13] border-l border-white/[0.1] shadow-2xl flex flex-col animate-in slide-in-from-right duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-white/[0.08] bg-[#090b0e] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-amber-400" />
            <h2 className="text-sm font-bold text-white">Vehicle Alerts & Reminders</h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleMarkAllRead}
              className="text-[11px] font-semibold text-slate-400 hover:text-white flex items-center gap-1 p-1 rounded hover:bg-white/[0.05]"
              title="Mark all as read"
            >
              <CheckCheck className="h-3.5 w-3.5" />
              <span>Mark all read</span>
            </button>
            <button
              onClick={onClose}
              className="p-1 text-slate-400 hover:text-white rounded hover:bg-white/[0.05]"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 p-3 border-b border-white/[0.06] bg-[#0a0d10] overflow-x-auto text-[11px] font-medium">
          {["ALL", "UNREAD", "CRITICAL", "MAINTENANCE", "WARNING"].map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`rounded px-2.5 py-1 transition-colors whitespace-nowrap ${
                categoryFilter === cat
                  ? "bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40"
                  : "text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Alerts List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {loading ? (
            <div className="py-12 text-center text-xs text-slate-500 animate-pulse">
              Loading notifications...
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center">
              <p className="text-xs font-semibold text-slate-300">All Clear</p>
              <p className="text-[11px] text-slate-500 mt-1">
                Zero active vehicle alerts requiring attention.
              </p>
            </div>
          ) : (
            filtered.map((alert) => {
              const isUnread = alert.status === "UNREAD";
              return (
                <div
                  key={alert.id}
                  className={`p-3 rounded-lg border transition-all ${
                    isUnread
                      ? "bg-[#11161c] border-amber-500/30"
                      : "bg-[#0a0d10] border-white/[0.04] opacity-80 hover:opacity-100"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="p-1.5 rounded bg-[#161c22] border border-white/[0.06] shrink-0 mt-0.5">
                      {getAlertIcon(alert.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold text-white truncate">
                          {alert.title}
                        </span>
                        {isUnread && (
                          <span className="h-1.5 w-1.5 rounded-full bg-amber-400 shrink-0" />
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                        {alert.message}
                      </p>

                      <div className="mt-2.5 flex items-center justify-between gap-2 text-[10px] text-slate-500 font-mono">
                        <span>
                          {new Date(alert.createdAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}{" "}
                          · {new Date(alert.createdAt).toLocaleDateString()}
                        </span>

                        <div className="flex items-center gap-2">
                          {isUnread && (
                            <button
                              onClick={() => handleMarkSingleRead(alert.id)}
                              className="text-slate-400 hover:text-white"
                            >
                              Mark read
                            </button>
                          )}
                          {alert.link && (
                            <Link
                              href={alert.link}
                              onClick={onClose}
                              className="inline-flex items-center gap-1 text-amber-400 hover:text-amber-300 font-semibold"
                            >
                              <span>View</span>
                              <ExternalLink className="h-2.5 w-2.5" />
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-white/[0.08] bg-[#090b0e] text-center text-[11px] text-slate-500 font-mono">
          AUTOPULSE PERSONAL ALERT NOTIFICATIONS
        </div>
      </div>
    </div>
  );
}
