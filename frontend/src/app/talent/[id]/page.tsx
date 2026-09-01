"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { apiFetch, ApiError } from "@/lib/api";
import { formatDate, timeAgo, initials } from "@/lib/helpers";
import { Badge, Button, Card } from "@/components/ui/Primitives";
import type { PublicProfile } from "@/lib/types";

const AVAILABILITY_LABEL: Record<string, { label: string; tone: "emerald" | "amber" | "rose" }> = {
  available: { label: "🟢 Available now", tone: "emerald" },
  open: { label: "🟡 Open to offers", tone: "amber" },
  unavailable: { label: "🔴 Not available", tone: "rose" },
};

const TABS = [
  { key: "about", label: "About" },
  { key: "history", label: "Employment history" },
  { key: "recommendations", label: "Recommendations" },
  { key: "badges", label: "Badges" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

export default function PublicTalentProfile() {
  const { id } = useParams<{ id: string }>();
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<TabKey>("about");

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

  const availability = profile?.availability ? AVAILABILITY_LABEL[profile.availability] : null;

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
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="text-xl font-semibold text-zinc-900">{profile.name}</h1>
                    {availability ? <Badge tone={availability.tone}>{availability.label}</Badge> : null}
                  </div>
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
              <p className="mt-5 text-xs text-zinc-400">On StratPH since {formatDate(profile.joinedAt)}</p>
            </Card>

            <div className="mb-6 grid grid-cols-3 gap-4">
              <Card className="text-center">
                <p className="text-2xl font-semibold text-indigo-600">{profile.completedTrials}</p>
                <p className="mt-1 text-xs text-zinc-500">Trial Tasks completed</p>
              </Card>
              <Card className="text-center">
                <p className="text-2xl font-semibold text-indigo-600">{profile.activity.length}</p>
                <p className="mt-1 text-xs text-zinc-500">Verified activity</p>
              </Card>
              <Card className="text-center">
                <p className="text-2xl font-semibold text-indigo-600">{profile.profileCompleteness}%</p>
                <p className="mt-1 text-xs text-zinc-500">Profile complete</p>
              </Card>
            </div>

            <div className="mb-5 flex gap-2 overflow-x-auto">
              {TABS.map((t) => (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className={`shrink-0 rounded-lg px-3 py-1.5 text-sm font-medium ${
                    tab === t.key ? "bg-indigo-600 text-white" : "bg-white text-zinc-600 hover:bg-zinc-100"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {tab === "about" ? (
              <div className="space-y-6">
                {profile.bio ? (
                  <Card>
                    <h2 className="mb-2 text-sm font-semibold text-zinc-900">About</h2>
                    <p className="text-sm leading-relaxed text-zinc-600">{profile.bio}</p>
                  </Card>
                ) : null}

                {profile.skills.length > 0 ? (
                  <Card>
                    <h2 className="mb-2 text-sm font-semibold text-zinc-900">Skills</h2>
                    <div className="flex flex-wrap gap-1.5">
                      {profile.skills.map((s) => (
                        <Badge key={s} tone="indigo">
                          {s}
                        </Badge>
                      ))}
                    </div>
                  </Card>
                ) : null}

                {profile.services.length > 0 ? (
                  <Card>
                    <h2 className="mb-2 text-sm font-semibold text-zinc-900">Services</h2>
                    <div className="flex flex-wrap gap-1.5">
                      {profile.services.map((s) => (
                        <Badge key={s} tone="emerald">
                          {s}
                        </Badge>
                      ))}
                    </div>
                  </Card>
                ) : null}

                {profile.certifications.length > 0 ? (
                  <Card>
                    <h2 className="mb-2 text-sm font-semibold text-zinc-900">Certifications</h2>
                    <div className="flex flex-wrap gap-1.5">
                      {profile.certifications.map((c) => (
                        <Badge key={c} tone="amber">
                          🎓 {c}
                        </Badge>
                      ))}
                    </div>
                  </Card>
                ) : null}

                {profile.languages.length > 0 ? (
                  <Card>
                    <h2 className="mb-2 text-sm font-semibold text-zinc-900">Languages</h2>
                    <div className="flex flex-wrap gap-1.5">
                      {profile.languages.map((l) => (
                        <Badge key={l} tone="zinc">
                          {l}
                        </Badge>
                      ))}
                    </div>
                  </Card>
                ) : null}

                {profile.portfolioLinks.length > 0 ? (
                  <Card>
                    <h2 className="mb-2 text-sm font-semibold text-zinc-900">Portfolio</h2>
                    <ul className="space-y-1.5">
                      {profile.portfolioLinks.map((link) => (
                        <li key={link.id}>
                          <a
                            href={link.url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-sm text-indigo-600 underline"
                          >
                            {link.label || link.url}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </Card>
                ) : null}

                {!profile.bio &&
                profile.skills.length === 0 &&
                profile.services.length === 0 &&
                profile.certifications.length === 0 &&
                profile.languages.length === 0 &&
                profile.portfolioLinks.length === 0 ? (
                  <Card>
                    <p className="text-sm text-zinc-400">This jobseeker hasn&apos;t filled out their About section yet.</p>
                  </Card>
                ) : null}
              </div>
            ) : null}

            {tab === "history" ? (
              <div className="space-y-6">
                {profile.experience.length > 0 ? (
                  <Card>
                    <h2 className="mb-3 text-sm font-semibold text-zinc-900">Work experience</h2>
                    <ul className="space-y-4 border-l border-zinc-200 pl-4">
                      {profile.experience.map((exp) => (
                        <li key={exp.id} className="text-sm">
                          <p className="font-medium text-zinc-800">
                            {exp.title} · {exp.company}
                          </p>
                          <p className="text-xs text-zinc-400">
                            {exp.startDate || "—"} – {exp.current ? "Present" : exp.endDate || "—"}
                          </p>
                          {exp.description ? <p className="mt-1 text-sm text-zinc-600">{exp.description}</p> : null}
                        </li>
                      ))}
                    </ul>
                  </Card>
                ) : null}

                {profile.education.length > 0 ? (
                  <Card>
                    <h2 className="mb-3 text-sm font-semibold text-zinc-900">Education</h2>
                    <ul className="space-y-4 border-l border-zinc-200 pl-4">
                      {profile.education.map((ed) => (
                        <li key={ed.id} className="text-sm">
                          <p className="font-medium text-zinc-800">
                            {ed.degree}
                            {ed.fieldOfStudy ? ` in ${ed.fieldOfStudy}` : ""}
                          </p>
                          <p className="text-xs text-zinc-400">
                            {ed.school}
                            {ed.startYear ? ` · ${ed.startYear}–${ed.endYear || "Present"}` : ""}
                          </p>
                        </li>
                      ))}
                    </ul>
                  </Card>
                ) : null}

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

                {profile.experience.length === 0 && profile.education.length === 0 && profile.activity.length === 0 ? (
                  <Card>
                    <p className="text-sm text-zinc-400">No employment history added yet.</p>
                  </Card>
                ) : null}
              </div>
            ) : null}

            {tab === "recommendations" ? (
              <Card>
                <h2 className="mb-3 text-sm font-semibold text-zinc-900">
                  {profile.recommendations.length > 0
                    ? `Recommended by ${profile.recommendations.length} employer${profile.recommendations.length === 1 ? "" : "s"}`
                    : "Recommendations"}
                </h2>
                {profile.recommendations.length === 0 ? (
                  <p className="text-sm text-zinc-400">No recommendations yet.</p>
                ) : (
                  <ul className="space-y-4">
                    {profile.recommendations.map((r) => (
                      <li key={r.id} className="rounded-lg bg-indigo-50/60 p-3">
                        <p className="text-sm italic text-zinc-700">&ldquo;{r.message}&rdquo;</p>
                        <p className="mt-1.5 text-xs font-medium text-indigo-700">
                          — {r.employerName} · {timeAgo(r.createdAt)}
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
              </Card>
            ) : null}

            {tab === "badges" ? (
              <Card>
                <h2 className="mb-3 text-sm font-semibold text-zinc-900">Badges</h2>
                {profile.badges.length === 0 ? (
                  <p className="text-sm text-zinc-400">No badges earned yet.</p>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {profile.badges.map((b) => (
                      <div key={b.id} className="flex items-start gap-3 rounded-lg border border-zinc-200 p-3">
                        <span className="text-2xl">{b.icon}</span>
                        <div>
                          <p className="text-sm font-semibold text-zinc-900">{b.label}</p>
                          <p className="text-xs text-zinc-500">{b.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            ) : null}

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
