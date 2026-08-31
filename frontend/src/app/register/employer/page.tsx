"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useApp } from "@/lib/store";
import { Button, Card, Input, Textarea } from "@/components/ui/Primitives";

export default function RegisterEmployerPage() {
  const router = useRouter();
  const { registerEmployer } = useApp();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    companyName: "",
    companyBlurb: "",
  });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    const result = await registerEmployer({
      name: form.name,
      email: form.email,
      password: form.password,
      companyName: form.companyName,
      companyBlurb: form.companyBlurb || undefined,
    });
    if (!result.ok) {
      setError(result.error || "Could not create your account.");
      setSubmitting(false);
      return;
    }
    router.replace("/dashboard/employer");
  }

  return (
    <div className="flex flex-1 items-center justify-center bg-zinc-50 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-6 flex flex-col items-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-base font-bold text-white">
            SP
          </div>
          <h1 className="mt-3 text-xl font-semibold text-zinc-900">Register your company</h1>
          <p className="mt-1 text-sm text-zinc-500">Post paid work trials and hire with confidence.</p>
        </div>

        <Card>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Your name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
            <Input
              label="Work email"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              autoComplete="email"
              required
            />
            <Input
              label="Password"
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              autoComplete="new-password"
              minLength={8}
              hint="At least 8 characters."
              required
            />
            <Input
              label="Company name"
              value={form.companyName}
              onChange={(e) => setForm({ ...form, companyName: e.target.value })}
              required
            />
            <Textarea
              label="Company description (optional)"
              placeholder="A short line about what your company does."
              rows={2}
              value={form.companyBlurb}
              onChange={(e) => setForm({ ...form, companyBlurb: e.target.value })}
            />
            <p className="text-xs text-zinc-400">
              New employer accounts are unverified until a Super Admin reviews them.
            </p>
            {error ? <p className="text-sm text-rose-600">{error}</p> : null}
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? "Creating account…" : "Create account"}
            </Button>
          </form>
        </Card>

        <p className="mt-6 text-center text-xs text-zinc-400">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-indigo-600 hover:underline">
            Log in
          </Link>
        </p>
        <p className="mt-2 text-center text-xs text-zinc-400">
          Looking for work instead?{" "}
          <Link href="/register/jobseeker" className="font-medium text-indigo-600 hover:underline">
            Register as a jobseeker
          </Link>
        </p>
      </div>
    </div>
  );
}
