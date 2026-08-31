"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/lib/store";

const ROLE_HOME = {
  jobseeker: "/dashboard/jobseeker",
  employer: "/dashboard/employer",
  superadmin: "/dashboard/admin",
};

export default function DashboardIndex() {
  const router = useRouter();
  const { currentUser, hydrated } = useApp();

  useEffect(() => {
    if (!hydrated) return;
    router.replace(currentUser ? ROLE_HOME[currentUser.role] || "/login" : "/login");
  }, [hydrated, currentUser, router]);

  return null;
}
