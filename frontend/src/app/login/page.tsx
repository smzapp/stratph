"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useApp } from "@/lib/store";
import { Button, Card, Input } from "@/components/ui/Primitives";
import type { Role } from "@/lib/types";

const ROLE_HOME: Record<Role, string> = {
  jobseeker: "/dashboard/jobseeker",
  employer: "/dashboard/employer",
  superadmin: "/dashboard/admin",
};

const DEMO_ACCOUNTS = [
  { label: "Super Admin", email: "admin@test.com", password: "test1234" },
  { label: "Employer", email: "employer@test.com", password: "test1234" },
  { label: "Jobseeker", email: "jobseeker@test.com", password: "test1234" },
];

export default function LoginPage() {
  const router = useRouter();
  const { login, currentUser, hydrated } = useApp();
  const [email, setEmail] = useState("admin@test.com");
  const [password, setPassword] = useState("test1234");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (hydrated && currentUser) {
      router.replace(ROLE_HOME[currentUser.role] || "/");
    }
  }, [hydrated, currentUser, router]);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    const result = await login(email, password);
    if (!result.ok || !result.user) {
      setError(result.error || "Incorrect email or password.");
      setSubmitting(false);
      return;
    }
    router.replace(ROLE_HOME[result.user.role] || "/");
  }

  return (
    <div className="flex flex-1 items-center justify-center bg-zinc-50 px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-base font-bold text-white">
            SP
          </div>
          <h1 className="mt-3 text-xl font-semibold text-zinc-900">Log in to StratPH</h1>
          <p className="mt-1 text-sm text-zinc-500">Try → Prove → Hire</p>
        </div>

        <Card>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
            {error ? <p className="text-sm text-rose-600">{error}</p> : null}
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? "Signing in…" : "Sign in"}
            </Button>
          </form>
          <p className="mt-4 text-center text-xs text-zinc-400">
            <Link href="/forgot-password" className="hover:text-zinc-600">
              Forgot your password?
            </Link>
          </p>
        </Card>

        <div className="mt-5">
          <p className="mb-2 text-center text-xs font-medium uppercase tracking-wide text-zinc-400">
            Quick demo login
          </p>
          <div className="grid grid-cols-3 gap-2">
            {DEMO_ACCOUNTS.map((acc) => (
              <button
                key={acc.email}
                type="button"
                onClick={() => {
                  setEmail(acc.email);
                  setPassword(acc.password);
                }}
                className="rounded-lg border border-zinc-200 bg-white px-2 py-2 text-xs font-medium text-zinc-600 hover:border-indigo-300 hover:text-indigo-600"
              >
                {acc.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-6 space-y-1 text-center text-xs text-zinc-400">
          <p>
            New jobseeker?{" "}
            <Link href="/register/jobseeker" className="font-medium text-indigo-600 hover:underline">
              Create an account
            </Link>
          </p>
          <p>
            Hiring?{" "}
            <Link href="/register/employer" className="font-medium text-indigo-600 hover:underline">
              Register your company
            </Link>
          </p>
          <p className="pt-3">
            <Link href="/" className="hover:text-zinc-600">
              ← Back to home
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
