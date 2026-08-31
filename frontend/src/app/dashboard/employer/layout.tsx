"use client";

import type { ReactNode } from "react";
import { RoleGuard } from "@/components/layout/RoleGuard";
import { DashboardShell } from "@/components/layout/DashboardShell";
import type { NavItem } from "@/components/layout/DashboardShell";
import { useApp } from "@/lib/store";

const NAV: NavItem[] = [
  { href: "/dashboard/employer", label: "Overview", icon: "🏠" },
  { href: "/dashboard/employer/micro-jobs", label: "Micro Jobs", icon: "⚡" },
  { href: "/dashboard/employer/search", label: "Reverse Hiring", icon: "🧭" },
  { href: "/dashboard/employer/jobs", label: "Job Postings", icon: "📋" },
];

function EmployerNav({ children }: { children: ReactNode }) {
  const { db, currentUser } = useApp();
  if (!currentUser) return null;

  const pendingSubmissions = db.microJobs
    .filter((mj) => mj.employerId === currentUser.id)
    .reduce(
      (sum, mj) => sum + mj.applicants.filter((a) => a.status === "submitted").length,
      0,
    );

  const navItems = NAV.map((item) =>
    item.href === "/dashboard/employer/micro-jobs" && pendingSubmissions > 0
      ? { ...item, badge: pendingSubmissions }
      : item,
  );

  return <DashboardShell navItems={navItems}>{children}</DashboardShell>;
}

export default function EmployerLayout({ children }: { children: ReactNode }) {
  return (
    <RoleGuard role="employer">
      <EmployerNav>{children}</EmployerNav>
    </RoleGuard>
  );
}
