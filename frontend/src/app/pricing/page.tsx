"use client";

import { useState } from "react";
import Link from "next/link";
import { useApp } from "@/lib/store";
import { formatDate, isSubscriptionActive } from "@/lib/helpers";
import { Badge, Button, Card } from "@/components/ui/Primitives";
import { ROLES } from "@/lib/types";
import type { SubscriptionPlan } from "@/lib/types";

interface Plan {
  id: SubscriptionPlan | "free";
  name: string;
  price: string;
  tagline: string;
  features: string[];
  tone: "zinc" | "indigo" | "amber";
}

const PLANS: Plan[] = [
  {
    id: "free",
    name: "Free",
    price: "₱0",
    tagline: "Get started with the core marketplace.",
    features: [
      "Post traditional job openings (reviewed by a Super Admin before going live)",
      "Full access to Reverse Hiring search",
      "Trial Tasks require a Pro or Business subscription",
    ],
    tone: "zinc",
  },
  {
    id: "pro",
    name: "Pro",
    price: "₱999/mo",
    tagline: "For employers hiring regularly.",
    features: [
      "Everything in Free",
      "Post unlimited Trial Tasks — StratPH holds each task's pay in escrow and releases it on your approval",
      "Instant auto-approval — job postings go live immediately, no waiting for review",
      "Invite and directly contact candidates from Reverse Hiring search",
    ],
    tone: "indigo",
  },
  {
    id: "business",
    name: "Business",
    price: "₱2,499/mo",
    tagline: "For teams hiring at scale.",
    features: [
      "Everything in Pro",
      "A Business badge shown on your job postings",
      "Priority support queue",
    ],
    tone: "amber",
  },
];

export default function PricingPage() {
  const { currentUser, subscribeToPlan, cancelSubscription } = useApp();
  const [busy, setBusy] = useState<string | null>(null);

  const isSubscribed = isSubscriptionActive(currentUser);

  async function handleSubscribe(planId: SubscriptionPlan) {
    setBusy(planId);
    await subscribeToPlan(planId);
    setBusy(null);
  }

  async function handleCancel() {
    setBusy("cancel");
    await cancelSubscription();
    setBusy(null);
  }

  return (
    <div className="flex flex-1 flex-col bg-white">
      <header className="border-b border-zinc-100 bg-white/80 px-6 py-4 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-sm font-bold text-white">
              SP
            </div>
            <span className="text-sm font-semibold text-zinc-900">StratPH</span>
          </Link>
          <Link href={currentUser ? `/dashboard/${currentUser.role === ROLES.ADMIN ? "admin" : currentUser.role}` : "/login"}>
            <Button variant="outline" size="sm">
              {currentUser ? "Back to dashboard" : "Log in"}
            </Button>
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-16">
        <div className="mb-12 text-center">
          <Badge tone="indigo">Pricing</Badge>
          <h1 className="mt-3 text-3xl font-semibold text-zinc-900 sm:text-4xl">
            Simple plans for employers
          </h1>
          <p className="mt-3 text-zinc-500">
            Jobseekers use StratPH for free. Employers pick a plan based on how fast they need job
            postings to go live.
          </p>
        </div>

        {currentUser?.role === ROLES.EMPLOYER && isSubscribed ? (
          <Card className="mx-auto mb-10 max-w-2xl border-indigo-200 bg-indigo-50/50 text-center">
            <p className="text-sm text-zinc-700">
              You&apos;re currently on the <span className="font-semibold capitalize">{currentUser.subscriptionPlan}</span> plan,
              active until {formatDate(currentUser.subscriptionExpiresAt!)}.
            </p>
            <Button size="sm" variant="outline" className="mt-3" disabled={busy === "cancel"} onClick={handleCancel}>
              {busy === "cancel" ? "Cancelling…" : "Cancel subscription"}
            </Button>
          </Card>
        ) : null}

        <div className="grid gap-6 lg:grid-cols-3">
          {PLANS.map((plan) => {
            const isCurrent = isSubscribed && currentUser?.subscriptionPlan === plan.id;
            return (
              <Card key={plan.id} className={plan.id === "pro" ? "border-indigo-300 shadow-md" : ""}>
                <Badge tone={plan.tone}>{plan.name}</Badge>
                <p className="mt-3 text-3xl font-semibold text-zinc-900">{plan.price}</p>
                <p className="mt-1 text-sm text-zinc-500">{plan.tagline}</p>
                <ul className="mt-5 space-y-2.5">
                  {plan.features.map((f) => (
                    <li key={f} className="flex gap-2.5 text-sm text-zinc-600">
                      <span className="mt-0.5 text-indigo-500">✓</span>
                      {f}
                    </li>
                  ))}
                </ul>
                <div className="mt-6">
                  {plan.id === "free" ? (
                    currentUser ? (
                      <Button className="w-full" variant="secondary" disabled>
                        {currentUser.role === ROLES.EMPLOYER && !isSubscribed ? "Current plan" : "Included for everyone"}
                      </Button>
                    ) : (
                      <Link href="/register/employer">
                        <Button className="w-full" variant="outline">
                          Get started
                        </Button>
                      </Link>
                    )
                  ) : !currentUser ? (
                    <Link href="/register/employer">
                      <Button className="w-full" variant={plan.id === "pro" ? "primary" : "outline"}>
                        Register to subscribe
                      </Button>
                    </Link>
                  ) : currentUser.role !== ROLES.EMPLOYER ? (
                    <Button className="w-full" variant="outline" disabled>
                      Employers only
                    </Button>
                  ) : isCurrent ? (
                    <Button className="w-full" variant="secondary" disabled>
                      Current plan
                    </Button>
                  ) : (
                    <Button
                      className="w-full"
                      variant={plan.id === "pro" ? "primary" : "outline"}
                      disabled={busy === plan.id}
                      onClick={() => handleSubscribe(plan.id as SubscriptionPlan)}
                    >
                      {busy === plan.id ? "Activating…" : isSubscribed ? "Switch plan" : "Subscribe"}
                    </Button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>

        <p className="mx-auto mt-10 max-w-xl text-center text-xs text-zinc-400">
          Demo checkout — this is a UI prototype. No real payment is processed; subscribing simply
          activates the plan on your account for 30 days.
        </p>
      </main>

      <footer className="border-t border-zinc-100 py-6 text-center text-xs text-zinc-400">
        StratPH — UI prototype. Subscriptions and escrow are simulated for demonstration; no real
        funds move.
      </footer>
    </div>
  );
}
