"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/lib/store";
import { timeAgo } from "@/lib/helpers";
import type { Notification } from "@/lib/types";

export function NotificationBell() {
  const router = useRouter();
  const { notifications, unreadNotificationCount, markNotificationRead, markAllNotificationsRead } = useApp();
  const [open, setOpen] = useState(false);

  function handleClick(n: Notification) {
    setOpen(false);
    if (!n.read) markNotificationRead(n.id);
    if (n.link) router.push(n.link);
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative flex h-9 w-9 items-center justify-center rounded-lg text-lg hover:bg-zinc-100"
        aria-label="Notifications"
      >
        🔔
        {unreadNotificationCount > 0 ? (
          <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-semibold text-white">
            {unreadNotificationCount > 9 ? "9+" : unreadNotificationCount}
          </span>
        ) : null}
      </button>

      {open ? (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-20 mt-2 w-80 rounded-lg border border-zinc-200 bg-white shadow-lg">
            <div className="flex items-center justify-between border-b border-zinc-100 px-4 py-2.5">
              <p className="text-sm font-semibold text-zinc-900">Notifications</p>
              {unreadNotificationCount > 0 ? (
                <button
                  onClick={() => markAllNotificationsRead()}
                  className="text-xs font-medium text-indigo-600 hover:underline"
                >
                  Mark all as read
                </button>
              ) : null}
            </div>
            <div className="max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <p className="px-4 py-8 text-center text-sm text-zinc-400">No notifications yet.</p>
              ) : (
                notifications.map((n) => (
                  <button
                    key={n.id}
                    onClick={() => handleClick(n)}
                    className={`block w-full border-b border-zinc-50 px-4 py-3 text-left last:border-0 hover:bg-zinc-50 ${
                      n.read ? "" : "bg-indigo-50/50"
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      {!n.read ? <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-500" /> : null}
                      <div className={n.read ? "pl-3.5" : ""}>
                        <p className="text-sm font-medium text-zinc-900">{n.title}</p>
                        <p className="mt-0.5 text-xs text-zinc-500">{n.message}</p>
                        <p className="mt-1 text-[11px] text-zinc-400">{timeAgo(n.createdAt)}</p>
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
