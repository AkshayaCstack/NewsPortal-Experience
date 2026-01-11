"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import NotificationHandler from "./NotificationHandler";

interface Notification {
  id: number;
  user_id: string;
  message: string;
  link: string | null;
  is_read: boolean;
  created_at: string;
  locale?: string | null;
}

interface NotificationBellProps {
  locale: string;
}

export default function NotificationBell({ locale }: NotificationBellProps) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch notifications filtered by locale
  const fetchNotifications = useCallback(async () => {
    if (!user?.id) return;

    setLoading(true);
    try {
      // Fetch notifications matching user's current locale (or without locale for backwards compatibility)
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .or(`locale.eq.${locale},locale.is.null`)
        .order("created_at", { ascending: false })
        .limit(20);

      if (error) throw error;

      setNotifications(data || []);
      setUnreadCount(data?.filter((n) => !n.is_read).length || 0);
    } catch (err) {
      console.error("Error fetching notifications:", err);
    } finally {
      setLoading(false);
    }
  }, [user?.id, locale]);

  // Initial fetch
  useEffect(() => {
    if (user?.id) {
      fetchNotifications();
    }
  }, [user?.id, fetchNotifications]);

  // Handle new real-time notification (only for current locale)
  const handleNewNotification = useCallback((notification: Notification) => {
    // Only show notification if it matches current locale (or has no locale)
    if (notification.locale && notification.locale !== locale) {
      console.log(`[Notification] Skipping - locale mismatch: ${notification.locale} vs ${locale}`);
      return;
    }

    setNotifications((prev) => [notification, ...prev]);
    setUnreadCount((prev) => prev + 1);
    
    // Show browser notification if permitted
    if (Notification.permission === "granted") {
      new Notification("NewzHub", {
        body: notification.message,
        icon: "/favicon.ico",
      });
    }
  }, [locale]);

  // Mark notification as read
  const markAsRead = async (notificationId: number) => {
    try {
      await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("id", notificationId);

      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notificationId ? { ...n, is_read: true } : n
        )
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error("Error marking notification as read:", err);
    }
  };

  // Mark all as read
  const markAllAsRead = async () => {
    if (!user?.id) return;

    try {
      await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("user_id", user.id)
        .eq("is_read", false);

      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error("Error marking all as read:", err);
    }
  };

  // Request browser notification permission
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Format time ago
  const timeAgo = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return "Just now";
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return date.toLocaleDateString();
  };

  if (!user) return null;

  return (
    <>
      {/* Real-time handler */}
      <NotificationHandler onNewNotification={handleNewNotification} />

      <div className="notification-bell-wrapper" ref={dropdownRef}>
        <button
          className="notification-bell-btn"
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Notifications"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
          {unreadCount > 0 && (
            <span className="notification-badge">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>

        {/* Dropdown */}
        {isOpen && (
          <div className="notification-dropdown">
            <div className="notification-dropdown-header">
              <h3>Notifications</h3>
              {unreadCount > 0 && (
                <button
                  className="mark-all-read-btn"
                  onClick={markAllAsRead}
                >
                  Mark all read
                </button>
              )}
            </div>

            <div className="notification-dropdown-body">
              {loading ? (
                <div className="notification-loading">
                  <div className="spinner-small" />
                  <span>Loading...</span>
                </div>
              ) : notifications.length === 0 ? (
                <div className="notification-empty">
                  <svg
                    width="40"
                    height="40"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  >
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                  </svg>
                  <p>No notifications yet</p>
                  <span>We'll notify you when something arrives!</span>
                </div>
              ) : (
                <ul className="notification-list">
                  {notifications.map((notification) => (
                    <li
                      key={notification.id}
                      className={`notification-item ${!notification.is_read ? "unread" : ""}`}
                    >
                      {notification.link ? (
                        <Link
                          href={`/${locale}${notification.link}`}
                          onClick={() => {
                            if (!notification.is_read) markAsRead(notification.id);
                            setIsOpen(false);
                          }}
                        >
                          <div className="notification-content">
                            <p className="notification-message">{notification.message}</p>
                            <span className="notification-time">
                              {timeAgo(notification.created_at)}
                            </span>
                          </div>
                          {!notification.is_read && <span className="unread-dot" />}
                        </Link>
                      ) : (
                        <div
                          className="notification-content-static"
                          onClick={() => {
                            if (!notification.is_read) markAsRead(notification.id);
                          }}
                        >
                          <p className="notification-message">{notification.message}</p>
                          <span className="notification-time">
                            {timeAgo(notification.created_at)}
                          </span>
                          {!notification.is_read && <span className="unread-dot" />}
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {notifications.length > 0 && (
              <div className="notification-dropdown-footer">
                <Link
                  href={`/${locale}/profile`}
                  onClick={() => setIsOpen(false)}
                >
                  View all notifications
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}

