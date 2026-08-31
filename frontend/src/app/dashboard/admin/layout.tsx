"use client";

import type { ReactNode } from "react";
import { RoleGuard } from "@/components/layout/RoleGuard";
import { DashboardShell } from "@/components/layout/DashboardShell";
import type { NavItem } from "@/components/layout/DashboardShell";
import { useApp } from "@/lib/store";

const NAV: NavItem[] = [
  { href: "/dashboard/admin", label: "Overview", icon: "🏠" },
  { href: "/dashboard/admin/users", label: "Users", icon: "👥" },
  { href: "/dashboard/admin/micro-jobs", label: "Moderation", icon: "🛡️" },
  { href: "/dashboard/admin/payments", label: "Payments", icon: "₱" },
];

function AdminNav({ children }: { children: ReactNode }) {
  const { db } = useApp();
  const pendingModeration = db.microJobs.filter((mj) => mj.moderation === "pending").length;

  const navItems = NAV.map((item) =>
    item.href === "/dashboard/admin/micro-jobs" && pendingModeration > 0
      ? { ...item, badge: pendingModeration }
      : item,
  );

  return <DashboardShell navItems={navItems}>{children}</DashboardShell>;
}

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <RoleGuard role="superadmin">
      <AdminNav>{children}</AdminNav>
    </RoleGuard>
  );
}
