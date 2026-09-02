"use client";

import type { ReactNode } from "react";
import { RoleGuard } from "@/components/layout/RoleGuard";
import { DashboardShell } from "@/components/layout/DashboardShell";
import type { NavItem } from "@/components/layout/DashboardShell";
import { useApp } from "@/lib/store";
import { getOffersForJobseeker } from "@/lib/helpers";
import { OFFER_STATUSES } from "@/lib/types";

const NAV: NavItem[] = [
  { href: "/dashboard/jobseeker", label: "Overview", icon: "🏠" },
  { href: "/dashboard/jobseeker/micro-jobs", label: "Trial Tasks", icon: "⚡" },
  { href: "/dashboard/jobseeker/gap-analyzer", label: "Gap Analyzer", icon: "🧠" },
  { href: "/dashboard/jobseeker/analytics", label: "Analytics", icon: "📊" },
  { href: "/dashboard/jobseeker/jobs", label: "Browse Jobs", icon: "🔎" },
  { href: "/dashboard/jobseeker/activity", label: "My Activity", icon: "📈" },
  { href: "/dashboard/jobseeker/offers", label: "Offers", icon: "🎉" },
  { href: "/dashboard/jobseeker/messages", label: "Messages", icon: "💬" },
];

function JobseekerNav({ children }: { children: ReactNode }) {
  const { db, currentUser, unreadMessageCount } = useApp();
  if (!currentUser) return null;

  const pendingOffers = getOffersForJobseeker(db, currentUser.id).filter(
    (o) => o.status === OFFER_STATUSES.PENDING,
  ).length;

  const navItems = NAV.map((item) => {
    if (item.href === "/dashboard/jobseeker/offers" && pendingOffers > 0) {
      return { ...item, badge: pendingOffers };
    }
    if (item.href === "/dashboard/jobseeker/messages" && unreadMessageCount > 0) {
      return { ...item, badge: unreadMessageCount };
    }
    return item;
  });

  return <DashboardShell navItems={navItems}>{children}</DashboardShell>;
}

export default function JobseekerLayout({ children }: { children: ReactNode }) {
  return (
    <RoleGuard role="jobseeker">
      <JobseekerNav>{children}</JobseekerNav>
    </RoleGuard>
  );
}
