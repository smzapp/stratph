"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useApp } from "@/lib/store";
import { formatDate } from "@/lib/helpers";
import { Avatar, Badge, Button, Card, Input, Select, Textarea } from "@/components/ui/Primitives";
import type { Role } from "@/lib/types";
import { CATEGORIES, JOB_TYPES } from "@/lib/constants";

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
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [confirmingDeactivate, setConfirmingDeactivate] = useState(false);

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
    });
  }, [hydrated, currentUser, router]);

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
    });
    setSaving(false);
    setSaved(true);
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

        <Card>
          <form onSubmit={handleSave} className="space-y-4">
            <h2 className="text-sm font-semibold text-zinc-900">Profile details</h2>
            <Input
              label="Your name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />

            {currentUser.role === "employer" ? (
              <>
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
              </>
            ) : null}

            {currentUser.role === "jobseeker" ? (
              <>
                <Input
                  label="Headline"
                  value={form.headline}
                  onChange={(e) => setForm({ ...form, headline: e.target.value })}
                />
                <Input
                  label="Location"
                  value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                />
                <Textarea
                  label="Bio"
                  rows={3}
                  value={form.bio}
                  onChange={(e) => setForm({ ...form, bio: e.target.value })}
                />
                <Input
                  label="Skills (comma-separated)"
                  value={form.skills}
                  onChange={(e) => setForm({ ...form, skills: e.target.value })}
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
                <p className="text-xs text-zinc-400">
                  Skills, discoverability, and your shareable profile link live under My Activity.
                </p>
              </>
            ) : null}

            <div className="flex items-center gap-3">
              <Button type="submit" disabled={saving}>
                {saving ? "Saving…" : "Save changes"}
              </Button>
              {saved ? <span className="text-sm text-emerald-600">Saved.</span> : null}
            </div>
          </form>
        </Card>

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
