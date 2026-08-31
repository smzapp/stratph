"use client";

import { RoleGuard } from "@/components/layout/RoleGuard";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { useApp } from "@/lib/store";

const NAV = [
  { href: "/dashboard/admin", label: "Overview", icon: "🏠" },
  { href: "/dashboard/admin/users", label: "Users", icon: "👥" },
  { href: "/dashboard/admin/micro-jobs", label: "Moderation", icon: "🛡️" },
  { href: "/dashboard/admin/payments", label: "Payments", icon: "₱" },
];

function AdminNav({ children }) {
  const { db } = useApp();
  const pendingModeration = db.microJobs.filter((mj) => mj.moderation === "pending").length;

  const navItems = NAV.map((item) =>
    item.href === "/dashboard/admin/micro-jobs" && pendingModeration > 0
      ? { ...item, badge: pendingModeration }
      : item,
  );

  return <DashboardShell navItems={navItems}>{children}</DashboardShell>;
}

export default function AdminLayout({ children }) {
  return (
    <RoleGuard role="superadmin">
      <AdminNav>{children}</AdminNav>
    </RoleGuard>
  );
}
