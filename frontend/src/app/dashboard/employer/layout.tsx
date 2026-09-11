"use client";

import type { ReactNode } from "react";
import { RoleGuard } from "@/components/layout/RoleGuard";
import { DashboardShell } from "@/components/layout/DashboardShell";
import type { NavItem } from "@/components/layout/DashboardShell";
import { useApp } from "@/lib/store";

const NAV: NavItem[] = [
  { href: "/dashboard/employer", label: "Overview", icon: "🏠" },
  { href: "/dashboard/employer/micro-jobs", label: "Trial Tasks", icon: "⚡" },
  { href: "/dashboard/employer/search", label: "Reverse Hiring", icon: "🧭" },
  { href: "/dashboard/employer/jobs", label: "Job Postings", icon: "📋" },
  { href: "/dashboard/employer/talent-pool", label: "Talent Pool", icon: "💼" },
  { href: "/dashboard/employer/messages", label: "Messages", icon: "💬" },
  { href: "/pricing", label: "Pricing", icon: "💳" },
];

function EmployerNav({ children }: { children: ReactNode }) {
  const { db, currentUser, unreadMessageCount } = useApp();
  if (!currentUser) return null;

  const pendingSubmissions = db.microJobs
    .filter((mj) => mj.employerId === currentUser.id)
    .reduce(
      (sum, mj) => sum + mj.applicants.filter((a) => a.status === "submitted").length,
      0,
    );

  const navItems = NAV.map((item) => {
    if (item.href === "/dashboard/employer/micro-jobs" && pendingSubmissions > 0) {
      return { ...item, badge: pendingSubmissions };
    }
    if (item.href === "/dashboard/employer/messages" && unreadMessageCount > 0) {
      return { ...item, badge: unreadMessageCount };
    }
    return item;
  });

  return <DashboardShell navItems={navItems}>{children}</DashboardShell>;
}

export default function EmployerLayout({ children }: { children: ReactNode }) {
  return (
    <RoleGuard role="employer">
      <EmployerNav>{children}</EmployerNav>
    </RoleGuard>
  );
}
