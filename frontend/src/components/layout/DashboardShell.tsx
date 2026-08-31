"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useApp } from "@/lib/store";
import { Avatar, Badge } from "@/components/ui/Primitives";
import type { Role, Tone } from "@/lib/types";

export interface NavItem {
  href: string;
  label: string;
  icon: string;
  badge?: number;
}

const ROLE_LABEL: Record<Role, string> = {
  jobseeker: "Jobseeker",
  employer: "Employer",
  superadmin: "Super Admin",
};

const ROLE_TONE: Record<Role, Tone> = {
  jobseeker: "indigo",
  employer: "emerald",
  superadmin: "amber",
};

export function DashboardShell({ navItems, children }: { navItems: NavItem[]; children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen bg-zinc-50">
      <aside className="hidden w-64 shrink-0 flex-col border-r border-zinc-200 bg-white md:flex">
        <div className="flex h-16 items-center gap-2 border-b border-zinc-200 px-5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-sm font-bold text-white">
            SP
          </div>
          <span className="text-sm font-semibold text-zinc-900">StratPH</span>
        </div>
        <nav className="flex-1 space-y-1 px-3 py-4">
          {navItems.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  active
                    ? "bg-indigo-50 text-indigo-700"
                    : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
                }`}
              >
                <span className="text-base leading-none">{item.icon}</span>
                {item.label}
                {item.badge ? (
                  <span className="ml-auto rounded-full bg-rose-500 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                    {item.badge}
                  </span>
                ) : null}
              </Link>
            );
          })}
        </nav>
      </aside>

      <div className="flex min-h-screen flex-1 flex-col">
        <header className="flex h-16 items-center justify-between border-b border-zinc-200 bg-white px-4 md:px-8">
          <div className="flex items-center gap-2 md:hidden">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600 text-xs font-bold text-white">
              SP
            </div>
            <span className="text-sm font-semibold text-zinc-900">StratPH</span>
          </div>
          <div className="hidden md:block" />
          <UserMenu />
        </header>
        <main className="flex-1 px-4 py-6 md:px-8 md:py-8">{children}</main>
        <nav className="flex items-center justify-around border-t border-zinc-200 bg-white py-2 md:hidden">
          {navItems.slice(0, 5).map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center gap-0.5 px-2 py-1 text-[11px] ${
                  active ? "text-indigo-600" : "text-zinc-500"
                }`}
              >
                <span className="text-base leading-none">{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}

function UserMenu() {
  const router = useRouter();
  const { currentUser, logout } = useApp();
  const [open, setOpen] = useState(false);

  if (!currentUser) return null;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-3 rounded-lg px-2 py-1.5 hover:bg-zinc-50"
      >
        <Badge tone={ROLE_TONE[currentUser.role]}>{ROLE_LABEL[currentUser.role]}</Badge>
        <div className="hidden text-right sm:block">
          <p className="text-sm font-medium text-zinc-900">
            {currentUser.companyName || currentUser.name}
          </p>
          <p className="text-xs text-zinc-400">{currentUser.email}</p>
        </div>
        <Avatar name={currentUser.companyName || currentUser.name} />
        <span className="hidden text-zinc-400 sm:inline">▾</span>
      </button>

      {open ? (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-20 mt-2 w-48 rounded-lg border border-zinc-200 bg-white py-1 shadow-lg">
            <Link
              href="/profile"
              onClick={() => setOpen(false)}
              className="block px-4 py-2 text-sm text-zinc-700 hover:bg-zinc-50"
            >
              👤 Profile
            </Link>
            <button
              onClick={() => {
                setOpen(false);
                logout();
                router.push("/login");
              }}
              className="block w-full px-4 py-2 text-left text-sm text-rose-600 hover:bg-rose-50"
            >
              ↩ Log out
            </button>
          </div>
        </>
      ) : null}
    </div>
  );
}
