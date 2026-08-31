"use client";

import { RoleGuard } from "@/components/layout/RoleGuard";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { useApp } from "@/lib/store";
import { getOffersForJobseeker } from "@/lib/helpers";
import { OFFER_STATUSES } from "@/lib/mockData";

const NAV = [
  { href: "/dashboard/jobseeker", label: "Overview", icon: "🏠" },
  { href: "/dashboard/jobseeker/micro-jobs", label: "Micro Jobs", icon: "⚡" },
  { href: "/dashboard/jobseeker/jobs", label: "Browse Jobs", icon: "🔎" },
  { href: "/dashboard/jobseeker/activity", label: "My Activity", icon: "📈" },
  { href: "/dashboard/jobseeker/offers", label: "Offers", icon: "🎉" },
];

function JobseekerNav({ children }) {
  const { db, currentUser } = useApp();
  const pendingOffers = getOffersForJobseeker(db, currentUser.id).filter(
    (o) => o.status === OFFER_STATUSES.PENDING,
  ).length;

  const navItems = NAV.map((item) =>
    item.href === "/dashboard/jobseeker/offers" && pendingOffers > 0
      ? { ...item, badge: pendingOffers }
      : item,
  );

  return <DashboardShell navItems={navItems}>{children}</DashboardShell>;
}

export default function JobseekerLayout({ children }) {
  return (
    <RoleGuard role="jobseeker">
      <JobseekerNav>{children}</JobseekerNav>
    </RoleGuard>
  );
}
