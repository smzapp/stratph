"use client";

import { useEffect } from "react";
import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/lib/store";
import type { Role } from "@/lib/types";

const ROLE_HOME: Record<Role, string> = {
  jobseeker: "/dashboard/jobseeker",
  employer: "/dashboard/employer",
  superadmin: "/dashboard/admin",
};

export function RoleGuard({ role, children }: { role: Role; children: ReactNode }) {
  const router = useRouter();
  const { currentUser, hydrated } = useApp();

  useEffect(() => {
    if (!hydrated) return;
    if (!currentUser) {
      router.replace("/login");
      return;
    }
    if (currentUser.role !== role) {
      router.replace(ROLE_HOME[currentUser.role] || "/login");
    }
  }, [hydrated, currentUser, role, router]);

  if (!hydrated || !currentUser || currentUser.role !== role) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50">
        <p className="text-sm text-zinc-400">Loading…</p>
      </div>
    );
  }

  return children;
}
