"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import { apiFetch, ApiError } from "@/lib/api";
import { Button, Card, Input } from "@/components/ui/Primitives";

interface ForgotPasswordResponse {
  message: string;
  resetToken?: string;
  expiresAt?: string;
}

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<ForgotPasswordResponse | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    setResult(null);
    try {
      const res = await apiFetch<ForgotPasswordResponse>("/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email }),
      });
      setResult(res);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex flex-1 items-center justify-center bg-zinc-50 px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-base font-bold text-white">
            SP
          </div>
          <h1 className="mt-3 text-xl font-semibold text-zinc-900">Reset your password</h1>
          <p className="mt-1 text-sm text-zinc-500">We&apos;ll help you get back in.</p>
        </div>

        <Card>
          {result ? (
            <div className="space-y-3">
              <p className="text-sm text-zinc-700">{result.message}</p>
              {result.resetToken ? (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                  <p className="font-medium">Demo mode: no email is actually sent.</p>
                  <p className="mt-1">Use this link to reset your password:</p>
                  <Link
                    href={`/reset-password?token=${encodeURIComponent(result.resetToken)}`}
                    className="mt-1 block break-all font-medium text-indigo-700 underline"
                  >
                    /reset-password?token={result.resetToken}
                  </Link>
                </div>
              ) : null}
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
              {error ? <p className="text-sm text-rose-600">{error}</p> : null}
              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? "Sending…" : "Send reset link"}
              </Button>
            </form>
          )}
        </Card>

        <p className="mt-6 text-center text-xs text-zinc-400">
          <Link href="/login" className="hover:text-zinc-600">
            ← Back to log in
          </Link>
        </p>
      </div>
    </div>
  );
}
