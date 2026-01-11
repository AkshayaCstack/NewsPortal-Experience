"use client";

import { useEffect } from "react";
import { supabase } from "@/lib/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface NotificationHandlerProps {
  onNewNotification?: (notification: any) => void;
}

export default function NotificationHandler({ onNewNotification }: NotificationHandlerProps) {
  const { user } = useAuth();

  useEffect(() => {
    if (!user?.id) return;

    // Listen for inserts into the notifications table for this specific user
    const channel = supabase
      .channel(`notifications-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log("New notification received!", payload.new);
          onNewNotification?.(payload.new);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, onNewNotification, supabase]);

  return null;
}

