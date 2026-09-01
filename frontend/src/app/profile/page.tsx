"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useApp } from "@/lib/store";
import { apiFetch } from "@/lib/api";
import { formatDate } from "@/lib/helpers";
import { Avatar, Badge, Button, Card, Input, Select, Textarea } from "@/components/ui/Primitives";
import type { Availability, EducationEntry, ExperienceEntry, JobseekerAnalytics, PortfolioLink, Role } from "@/lib/types";
import { CATEGORIES, JOB_TYPES } from "@/lib/constants";

const AVAILABILITY_OPTIONS: { value: Availability; label: string }[] = [
  { value: "available", label: "🟢 Available now" },
  { value: "open", label: "🟡 Open to offers" },
  { value: "unavailable", label: "🔴 Not available" },
];

const ROLE_HOME: Record<Role, string> = {
  jobseeker: "/dashboard/jobseeker",
  employer: "/dashboard/employer",
  superadmin: "/dashboard/admin",
};

const ROLE_LABEL: Record<Role, string> = {
  jobseeker: "Jobseeker",
  employer: "Employer",
  superadmin: "Super Admin",
};

function newId(): string {
  return Math.random().toString(36).slice(2, 10);
}

const PROFILE_TABS = [
  { key: "basic", label: "Basic Info", icon: "👤" },
  { key: "skills", label: "Skills & Services", icon: "⚡" },
  { key: "portfolio", label: "Portfolio", icon: "🔗" },
  { key: "history", label: "Education & Experience", icon: "🎓" },
] as const;

type ProfileTabKey = (typeof PROFILE_TABS)[number]["key"];

export default function ProfilePage() {
  const router = useRouter();
  const { currentUser, hydrated, logout, updateMyProfile, deactivateAccount } = useApp();

  const [form, setForm] = useState({
    name: "",
    companyName: "",
    companyBlurb: "",
    headline: "",
    location: "",
    bio: "",
    skills: "",
    category: "",
    yearsOfExperience: "",
    preferredJobType: "",
    services: "",
    certifications: "",
    languages: "",
    availability: "" as Availability | "",
  });
  const [education, setEducation] = useState<EducationEntry[]>([]);
  const [experience, setExperience] = useState<ExperienceEntry[]>([]);
  const [portfolioLinks, setPortfolioLinks] = useState<PortfolioLink[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [confirmingDeactivate, setConfirmingDeactivate] = useState(false);
  const [analytics, setAnalytics] = useState<JobseekerAnalytics | null>(null);
  const [profileTab, setProfileTab] = useState<ProfileTabKey>("basic");

  useEffect(() => {
    if (!hydrated) return;
    if (!currentUser) {
      router.replace("/login");
      return;
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setForm({
      name: currentUser.name || "",
      companyName: currentUser.companyName || "",
      companyBlurb: currentUser.companyBlurb || "",
      headline: currentUser.headline || "",
      location: currentUser.location || "",
      bio: currentUser.bio || "",
      skills: (currentUser.skills || []).join(", "),
      category: currentUser.category || "",
      yearsOfExperience:
        currentUser.yearsOfExperience !== undefined && currentUser.yearsOfExperience !== null
          ? String(currentUser.yearsOfExperience)
          : "",
      preferredJobType: currentUser.preferredJobType || "",
      services: (currentUser.services || []).join(", "),
      certifications: (currentUser.certifications || []).join(", "),
      languages: (currentUser.languages || []).join(", "),
      availability: currentUser.availability || "",
    });
    setEducation(currentUser.education || []);
    setExperience(currentUser.experience || []);
    setPortfolioLinks(currentUser.portfolioLinks || []);
  }, [hydrated, currentUser, router]);

  useEffect(() => {
    if (!hydrated || !currentUser || currentUser.role !== "jobseeker") return;
    let cancelled = false;
    apiFetch<JobseekerAnalytics>("/me/analytics").then((res) => {
      if (!cancelled) setAnalytics(res);
    });
    return () => {
      cancelled = true;
    };
  }, [hydrated, currentUser]);

  if (!hydrated || !currentUser) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50">
        <p className="text-sm text-zinc-400">Loading…</p>
      </div>
    );
  }

  async function handleSave(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    await updateMyProfile({
      name: form.name,
      companyName: form.companyName,
      companyBlurb: form.companyBlurb,
      headline: form.headline,
      location: form.location,
      bio: form.bio,
      skills: form.skills
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      category: form.category,
      yearsOfExperience: form.yearsOfExperience ? Number(form.yearsOfExperience) : undefined,
      preferredJobType: form.preferredJobType,
      services: form.services
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      certifications: form.certifications
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      education,
      experience,
      languages: form.languages
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      availability: form.availability || undefined,
      portfolioLinks,
    });
    setSaving(false);
    setSaved(true);
    if (currentUser!.role === "jobseeker") {
      apiFetch<JobseekerAnalytics>("/me/analytics").then(setAnalytics);
    }
  }

  async function handleDeactivate() {
    await deactivateAccount();
    router.replace("/login");
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      <header className="flex h-16 items-center justify-between border-b border-zinc-200 bg-white px-4 md:px-8">
        <Link href={ROLE_HOME[currentUser.role]} className="text-sm font-medium text-zinc-500 hover:text-zinc-900">
          ← Back to dashboard
        </Link>
        <button
          onClick={() => {
            logout();
            router.push("/login");
          }}
          className="text-sm font-medium text-zinc-500 hover:text-zinc-900"
        >
          Log out
        </button>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-8 md:px-0">
        <div className="mb-6 flex items-center gap-4">
          <Avatar name={currentUser.companyName || currentUser.name} size={14} />
          <div>
            <h1 className="text-lg font-semibold text-zinc-900">
              {currentUser.companyName || currentUser.name}
            </h1>
            <div className="mt-1 flex items-center gap-2">
              <Badge tone="indigo">{ROLE_LABEL[currentUser.role]}</Badge>
              <span className="text-xs text-zinc-400">
                {currentUser.email} · Joined {formatDate(currentUser.createdAt)}
              </span>
            </div>
          </div>
        </div>

        {currentUser.role === "jobseeker" && analytics ? (
          <Card className="mb-6 border-indigo-100 bg-indigo-50/40">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex-1">
                <div className="mb-1.5 flex items-center justify-between">
                  <p className="text-sm font-semibold text-zinc-900">Profile strength</p>
                  <p className="text-sm font-semibold text-indigo-600">{analytics.profileCompleteness}%</p>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-white">
                  <div
                    className="h-full rounded-full bg-indigo-500 transition-all"
                    style={{ width: `${analytics.profileCompleteness}%` }}
                  />
                </div>
                {analytics.suggestions[0] ? (
                  <p className="mt-2 text-xs text-zinc-500">💡 {analytics.suggestions[0]}</p>
                ) : (
                  <p className="mt-2 text-xs text-emerald-600">Your profile looks great!</p>
                )}
              </div>
              <Link href="/dashboard/jobseeker/analytics" className="shrink-0">
                <Button size="sm" variant="outline">
                  Full analytics
                </Button>
              </Link>
            </div>
          </Card>
        ) : null}

        <form onSubmit={handleSave} className="space-y-6">
          {currentUser.role === "employer" ? (
            <Card>
              <h2 className="mb-4 text-sm font-semibold text-zinc-900">Profile details</h2>
              <div className="space-y-4">
                <Input
                  label="Your name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
                <Input
                  label="Company name"
                  value={form.companyName}
                  onChange={(e) => setForm({ ...form, companyName: e.target.value })}
                  required
                />
                <Textarea
                  label="Company description"
                  rows={2}
                  value={form.companyBlurb}
                  onChange={(e) => setForm({ ...form, companyBlurb: e.target.value })}
                />
                {!currentUser.verified ? (
                  <p className="text-xs text-amber-600">
                    Your company is not yet verified by a Super Admin.
                  </p>
                ) : null}
              </div>
            </Card>
          ) : null}

          {currentUser.role === "jobseeker" ? (
            <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
              <div className="flex gap-1 overflow-x-auto border-b border-zinc-100 bg-zinc-50/60 px-2 pt-2">
                {PROFILE_TABS.map((t) => (
                  <button
                    key={t.key}
                    type="button"
                    onClick={() => setProfileTab(t.key)}
                    className={`shrink-0 whitespace-nowrap rounded-t-lg border-b-2 px-3 py-2 text-sm font-medium transition-colors ${
                      profileTab === t.key
                        ? "border-indigo-600 bg-white text-indigo-600"
                        : "border-transparent text-zinc-500 hover:text-zinc-700"
                    }`}
                  >
                    {t.icon} {t.label}
                  </button>
                ))}
              </div>

              <div className="space-y-4 p-5">
                {profileTab === "basic" ? (
                  <>
                    <Input
                      label="Your name"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                    />
                    <Input
                      label="Headline"
                      placeholder="e.g. Frontend Developer • React & Next.js"
                      value={form.headline}
                      onChange={(e) => setForm({ ...form, headline: e.target.value })}
                    />
                    <Input
                      label="Location"
                      value={form.location}
                      onChange={(e) => setForm({ ...form, location: e.target.value })}
                    />
                    <Textarea
                      label="About"
                      rows={3}
                      placeholder="Tell clients and employers about yourself…"
                      value={form.bio}
                      onChange={(e) => setForm({ ...form, bio: e.target.value })}
                    />
                    <div className="grid gap-4 sm:grid-cols-2">
                      <Select
                        label="Category"
                        value={form.category}
                        onChange={(e) => setForm({ ...form, category: e.target.value })}
                      >
                        <option value="">Choose one…</option>
                        {CATEGORIES.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </Select>
                      <Input
                        label="Years of experience"
                        type="number"
                        min={0}
                        max={60}
                        value={form.yearsOfExperience}
                        onChange={(e) => setForm({ ...form, yearsOfExperience: e.target.value })}
                      />
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <Select
                        label="Preferred job type"
                        value={form.preferredJobType}
                        onChange={(e) => setForm({ ...form, preferredJobType: e.target.value })}
                      >
                        <option value="">Choose one…</option>
                        {JOB_TYPES.map((t) => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        ))}
                      </Select>
                      <Select
                        label="Availability"
                        value={form.availability}
                        onChange={(e) => setForm({ ...form, availability: e.target.value as Availability })}
                      >
                        <option value="">Not set</option>
                        {AVAILABILITY_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </Select>
                    </div>
                    <Input
                      label="Languages (comma-separated)"
                      placeholder="Filipino, English, Cebuano…"
                      value={form.languages}
                      onChange={(e) => setForm({ ...form, languages: e.target.value })}
                    />
                    <p className="text-xs text-zinc-400">
                      Discoverability and your shareable profile link live under My Activity.
                    </p>
                  </>
                ) : null}

                {profileTab === "skills" ? (
                  <>
                    <Input
                      label="Skills (comma-separated)"
                      value={form.skills}
                      onChange={(e) => setForm({ ...form, skills: e.target.value })}
                    />
                    <div className="border-t border-zinc-100 pt-4">
                      <p className="mb-1 text-sm font-medium text-zinc-700">Services you offer</p>
                      <p className="mb-2 text-xs text-zinc-400">
                        What can clients hire you for? e.g. Landing page design, Data entry, Video editing
                      </p>
                      <Input
                        placeholder="Landing page design, Bug fixes, Excel automation…"
                        value={form.services}
                        onChange={(e) => setForm({ ...form, services: e.target.value })}
                      />
                    </div>
                    <div className="border-t border-zinc-100 pt-4">
                      <p className="mb-1 text-sm font-medium text-zinc-700">Certifications</p>
                      <p className="mb-2 text-xs text-zinc-400">
                        Licenses, courses, or certifications that back up your skills.
                      </p>
                      <Input
                        placeholder="AWS Certified Developer, TESDA NC II…"
                        value={form.certifications}
                        onChange={(e) => setForm({ ...form, certifications: e.target.value })}
                      />
                    </div>
                  </>
                ) : null}

                {profileTab === "portfolio" ? (
                  <>
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-zinc-400">
                        Link to samples of your work — Behance, GitHub, a website…
                      </p>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          setPortfolioLinks((prev) => [...prev, { id: newId(), label: "", url: "" }])
                        }
                      >
                        + Add link
                      </Button>
                    </div>
                    {portfolioLinks.length === 0 ? (
                      <p className="text-sm text-zinc-400">No portfolio links added yet.</p>
                    ) : (
                      <div className="space-y-3">
                        {portfolioLinks.map((link, i) => (
                          <div key={link.id} className="flex gap-2">
                            <Input
                              placeholder="Label, e.g. Portfolio site"
                              value={link.label}
                              onChange={(e) =>
                                setPortfolioLinks((prev) =>
                                  prev.map((it, idx) => (idx === i ? { ...it, label: e.target.value } : it)),
                                )
                              }
                            />
                            <Input
                              placeholder="https://…"
                              value={link.url}
                              onChange={(e) =>
                                setPortfolioLinks((prev) =>
                                  prev.map((it, idx) => (idx === i ? { ...it, url: e.target.value } : it)),
                                )
                              }
                            />
                            <button
                              type="button"
                              onClick={() => setPortfolioLinks((prev) => prev.filter((_, idx) => idx !== i))}
                              className="shrink-0 text-xs font-medium text-rose-500 hover:underline"
                            >
                              Remove
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                ) : null}

                {profileTab === "history" ? (
                  <>
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-zinc-700">Education</p>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          setEducation((prev) => [
                            ...prev,
                            { id: newId(), school: "", degree: "", fieldOfStudy: "", startYear: undefined, endYear: undefined },
                          ])
                        }
                      >
                        + Add education
                      </Button>
                    </div>
                    {education.length === 0 ? (
                      <p className="text-sm text-zinc-400">No education added yet.</p>
                    ) : (
                      <div className="space-y-4">
                        {education.map((entry, i) => (
                          <div key={entry.id} className="rounded-lg border border-zinc-200 p-3">
                            <div className="mb-2 flex items-center justify-between">
                              <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">
                                Entry {i + 1}
                              </p>
                              <button
                                type="button"
                                onClick={() => setEducation((prev) => prev.filter((_, idx) => idx !== i))}
                                className="text-xs font-medium text-rose-500 hover:underline"
                              >
                                Remove
                              </button>
                            </div>
                            <div className="grid gap-3 sm:grid-cols-2">
                              <Input
                                label="School"
                                value={entry.school}
                                onChange={(e) =>
                                  setEducation((prev) =>
                                    prev.map((it, idx) => (idx === i ? { ...it, school: e.target.value } : it)),
                                  )
                                }
                              />
                              <Input
                                label="Degree"
                                placeholder="e.g. BS Computer Science"
                                value={entry.degree}
                                onChange={(e) =>
                                  setEducation((prev) =>
                                    prev.map((it, idx) => (idx === i ? { ...it, degree: e.target.value } : it)),
                                  )
                                }
                              />
                              <Input
                                label="Field of study (optional)"
                                value={entry.fieldOfStudy || ""}
                                onChange={(e) =>
                                  setEducation((prev) =>
                                    prev.map((it, idx) => (idx === i ? { ...it, fieldOfStudy: e.target.value } : it)),
                                  )
                                }
                              />
                              <div className="grid grid-cols-2 gap-3">
                                <Input
                                  label="Start year"
                                  type="number"
                                  value={entry.startYear ?? ""}
                                  onChange={(e) =>
                                    setEducation((prev) =>
                                      prev.map((it, idx) =>
                                        idx === i
                                          ? { ...it, startYear: e.target.value ? Number(e.target.value) : undefined }
                                          : it,
                                      ),
                                    )
                                  }
                                />
                                <Input
                                  label="End year"
                                  type="number"
                                  placeholder="Present"
                                  value={entry.endYear ?? ""}
                                  onChange={(e) =>
                                    setEducation((prev) =>
                                      prev.map((it, idx) =>
                                        idx === i
                                          ? { ...it, endYear: e.target.value ? Number(e.target.value) : undefined }
                                          : it,
                                      ),
                                    )
                                  }
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center justify-between border-t border-zinc-100 pt-4">
                      <p className="text-sm font-medium text-zinc-700">Work experience</p>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          setExperience((prev) => [
                            ...prev,
                            { id: newId(), company: "", title: "", description: "", startDate: "", endDate: "", current: false },
                          ])
                        }
                      >
                        + Add experience
                      </Button>
                    </div>
                    {experience.length === 0 ? (
                      <p className="text-sm text-zinc-400">No work experience added yet.</p>
                    ) : (
                      <div className="space-y-4">
                        {experience.map((entry, i) => (
                          <div key={entry.id} className="rounded-lg border border-zinc-200 p-3">
                            <div className="mb-2 flex items-center justify-between">
                              <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">
                                Entry {i + 1}
                              </p>
                              <button
                                type="button"
                                onClick={() => setExperience((prev) => prev.filter((_, idx) => idx !== i))}
                                className="text-xs font-medium text-rose-500 hover:underline"
                              >
                                Remove
                              </button>
                            </div>
                            <div className="grid gap-3 sm:grid-cols-2">
                              <Input
                                label="Company / Client"
                                value={entry.company}
                                onChange={(e) =>
                                  setExperience((prev) =>
                                    prev.map((it, idx) => (idx === i ? { ...it, company: e.target.value } : it)),
                                  )
                                }
                              />
                              <Input
                                label="Title / Role"
                                value={entry.title}
                                onChange={(e) =>
                                  setExperience((prev) =>
                                    prev.map((it, idx) => (idx === i ? { ...it, title: e.target.value } : it)),
                                  )
                                }
                              />
                            </div>
                            <div className="mt-3">
                              <Textarea
                                label="What did you do? (optional)"
                                rows={2}
                                value={entry.description || ""}
                                onChange={(e) =>
                                  setExperience((prev) =>
                                    prev.map((it, idx) => (idx === i ? { ...it, description: e.target.value } : it)),
                                  )
                                }
                              />
                            </div>
                            <div className="mt-3 grid grid-cols-2 gap-3">
                              <Input
                                label="Start date"
                                type="month"
                                value={entry.startDate || ""}
                                onChange={(e) =>
                                  setExperience((prev) =>
                                    prev.map((it, idx) => (idx === i ? { ...it, startDate: e.target.value } : it)),
                                  )
                                }
                              />
                              <Input
                                label="End date"
                                type="month"
                                disabled={!!entry.current}
                                value={entry.current ? "" : entry.endDate || ""}
                                onChange={(e) =>
                                  setExperience((prev) =>
                                    prev.map((it, idx) => (idx === i ? { ...it, endDate: e.target.value } : it)),
                                  )
                                }
                              />
                            </div>
                            <label className="mt-2 flex items-center gap-2 text-sm text-zinc-600">
                              <input
                                type="checkbox"
                                checked={!!entry.current}
                                onChange={(e) =>
                                  setExperience((prev) =>
                                    prev.map((it, idx) =>
                                      idx === i
                                        ? { ...it, current: e.target.checked, endDate: e.target.checked ? null : it.endDate }
                                        : it,
                                    ),
                                  )
                                }
                              />
                              I currently work here
                            </label>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                ) : null}
              </div>
            </div>
          ) : null}

          <div className="flex items-center gap-3">
            <Button type="submit" disabled={saving}>
              {saving ? "Saving…" : "Save changes"}
            </Button>
            {saved ? <span className="text-sm text-emerald-600">Saved.</span> : null}
          </div>
        </form>

        <Card className="mt-6 border-rose-200">
          <h2 className="text-sm font-semibold text-rose-700">Danger zone</h2>
          <p className="mt-1 text-sm text-zinc-500">
            Deactivating your account signs you out and suspends access. An admin can reactivate it
            later.
          </p>
          {confirmingDeactivate ? (
            <div className="mt-3 flex items-center gap-2">
              <Button variant="danger" size="sm" onClick={handleDeactivate}>
                Yes, deactivate my account
              </Button>
              <Button variant="outline" size="sm" onClick={() => setConfirmingDeactivate(false)}>
                Cancel
              </Button>
            </div>
          ) : (
            <Button variant="outline" size="sm" className="mt-3" onClick={() => setConfirmingDeactivate(true)}>
              Deactivate my account
            </Button>
          )}
        </Card>
      </main>
    </div>
  );
}
