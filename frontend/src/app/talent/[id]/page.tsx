"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { apiFetch, ApiError } from "@/lib/api";
import { formatDate, timeAgo, initials } from "@/lib/helpers";
import { Badge, Button, Card } from "@/components/ui/Primitives";
import type { PublicProfile } from "@/lib/types";

export default function PublicTalentProfile() {
  const { id } = useParams<{ id: string }>();
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    apiFetch<PublicProfile>(`/public/profiles/${id}`)
      .then((res) => {
        if (!cancelled) setProfile(res);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof ApiError ? err.message : "This profile could not be loaded.");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50">
      <header className="border-b border-zinc-200 bg-white px-4 py-4 md:px-8">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-sm font-bold text-white">
              SP
            </div>
            <span className="text-sm font-semibold text-zinc-900">StratPH</span>
          </Link>
          <Link href="/register/employer">
            <Button size="sm" variant="outline">
              Hire via StratPH
            </Button>
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10 md:px-0">
        {loading ? (
          <p className="text-center text-sm text-zinc-400">Loading profile…</p>
        ) : error || !profile ? (
          <Card className="text-center">
            <p className="text-sm font-semibold text-zinc-900">This profile isn&apos;t available</p>
            <p className="mt-1 text-sm text-zinc-500">
              {error || "It may have been removed or the link is incorrect."}
            </p>
            <Link href="/" className="mt-4 inline-block text-sm font-medium text-indigo-600 hover:underline">
              ← Back to StratPH
            </Link>
          </Card>
        ) : (
          <>
            <Card className="mb-6">
              <div className="flex items-start gap-4">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-indigo-500 text-lg font-semibold text-white">
                  {initials(profile.name)}
                </div>
                <div>
                  <h1 className="text-xl font-semibold text-zinc-900">{profile.name}</h1>
                  {profile.headline ? <p className="mt-0.5 text-sm text-zinc-500">{profile.headline}</p> : null}
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {profile.category ? <Badge tone="sky">{profile.category}</Badge> : null}
                    {profile.yearsOfExperience !== null ? (
                      <Badge tone="zinc">{profile.yearsOfExperience} years experience</Badge>
                    ) : null}
                    {profile.preferredJobType ? (
                      <Badge tone="zinc">Prefers {profile.preferredJobType}</Badge>
                    ) : null}
                    {profile.location ? <Badge tone="zinc">📍 {profile.location}</Badge> : null}
                  </div>
                </div>
              </div>

              {profile.bio ? <p className="mt-5 text-sm leading-relaxed text-zinc-600">{profile.bio}</p> : null}

              {profile.skills.length > 0 ? (
                <div className="mt-5 flex flex-wrap gap-1.5">
                  {profile.skills.map((s) => (
                    <Badge key={s} tone="indigo">
                      {s}
                    </Badge>
                  ))}
                </div>
              ) : null}

              <p className="mt-5 text-xs text-zinc-400">
                On StratPH since {formatDate(profile.joinedAt)}
              </p>
            </Card>

            <div className="mb-6 grid grid-cols-2 gap-4">
              <Card className="text-center">
                <p className="text-2xl font-semibold text-indigo-600">{profile.completedTrials}</p>
                <p className="mt-1 text-xs text-zinc-500">Trial Tasks completed</p>
              </Card>
              <Card className="text-center">
                <p className="text-2xl font-semibold text-indigo-600">{profile.activity.length}</p>
                <p className="mt-1 text-xs text-zinc-500">Verified activity entries</p>
              </Card>
            </div>

            <Card>
              <h2 className="mb-3 text-sm font-semibold text-zinc-900">Verified activity</h2>
              {profile.activity.length === 0 ? (
                <p className="text-sm text-zinc-400">No activity recorded yet.</p>
              ) : (
                <ul className="space-y-3 border-l border-zinc-200 pl-4">
                  {profile.activity.map((a) => (
                    <li key={a.id} className="text-sm">
                      <p className="text-zinc-800">{a.title}</p>
                      <div className="mt-0.5 flex items-center gap-2">
                        {a.skill ? <Badge tone="zinc">{a.skill}</Badge> : null}
                        <span className="text-xs text-zinc-400">{timeAgo(a.date)}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </Card>

            <div className="mt-8 rounded-xl border border-indigo-200 bg-indigo-50/60 p-5 text-center">
              <p className="text-sm font-semibold text-zinc-900">
                Want to work with {profile.name.split(" ")[0]}?
              </p>
              <p className="mt-1 text-sm text-zinc-600">
                Post a paid Trial Task on StratPH and see their work firsthand before you hire.
              </p>
              <Link href="/register/employer" className="mt-3 inline-block">
                <Button size="sm">Hire via StratPH</Button>
              </Link>
            </div>
          </>
        )}
      </main>

      <footer className="border-t border-zinc-100 py-6 text-center text-xs text-zinc-400">
        StratPH — UI prototype. Subscriptions and escrow are simulated for demonstration; no real
        funds move.
      </footer>
    </div>
  );
}
