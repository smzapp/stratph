"use client";

import { useCallback, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { RoleGuard } from "@/components/layout/RoleGuard";
import { DashboardShell } from "@/components/layout/DashboardShell";
import type { NavItem } from "@/components/layout/DashboardShell";
import { useApp } from "@/lib/store";
import { apiFetch } from "@/lib/api";
import type { Report } from "@/lib/types";

const NAV: NavItem[] = [
  { href: "/dashboard/admin", label: "Overview", icon: "🏠" },
  { href: "/dashboard/admin/users", label: "Users", icon: "👥" },
  { href: "/dashboard/admin/micro-jobs", label: "Trial Task Moderation", icon: "🛡️" },
  { href: "/dashboard/admin/jobs", label: "Job Moderation", icon: "📋" },
  { href: "/dashboard/admin/reports", label: "Reports", icon: "🚩" },
];

function AdminNav({ children }: { children: ReactNode }) {
  const { db } = useApp();
  const [pendingReports, setPendingReports] = useState(0);

  const fetchPendingReports = useCallback(async () => {
    try {
      const res = await apiFetch<Report[]>("/reports");
      setPendingReports(res.filter((r) => r.status === "open").length);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchPendingReports();
  }, [fetchPendingReports]);

  const pendingMicroJobs = db.microJobs.filter((mj) => mj.moderation === "pending").length;
  const pendingJobs = db.jobs.filter((j) => j.moderation === "pending").length;

  const navItems = NAV.map((item) => {
    if (item.href === "/dashboard/admin/micro-jobs" && pendingMicroJobs > 0) {
      return { ...item, badge: pendingMicroJobs };
    }
    if (item.href === "/dashboard/admin/jobs" && pendingJobs > 0) {
      return { ...item, badge: pendingJobs };
    }
    if (item.href === "/dashboard/admin/reports" && pendingReports > 0) {
      return { ...item, badge: pendingReports };
    }
    return item;
  });

  return <DashboardShell navItems={navItems}>{children}</DashboardShell>;
}

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <RoleGuard role="superadmin">
      <AdminNav>{children}</AdminNav>
    </RoleGuard>
  );
}
