"use client";

import { useState } from "react";
import { useApp } from "@/lib/store";
import { getActivityForJobseeker, getCompletedMicroJobsCount, timeAgo } from "@/lib/helpers";
import { Badge, Button, Card, Input, PageHeader } from "@/components/ui/Primitives";

const ACTIVITY_ICON = {
  micro_job_completed: "⚡",
  skill_verified: "✅",
  profile_update: "✏️",
  upgraded: "🎉",
};

export default function MyActivity() {
  const { db, currentUser, toggleDiscoverable, updateJobseekerSkills } = useApp();
  const activity = getActivityForJobseeker(db, currentUser.id);
  const completed = getCompletedMicroJobsCount(db, currentUser.id);
  const [newSkill, setNewSkill] = useState("");

  function addSkill(e) {
    e.preventDefault();
    const skill = newSkill.trim();
    if (!skill || currentUser.skills.includes(skill)) return;
    updateJobseekerSkills(currentUser.id, [...currentUser.skills, skill]);
    setNewSkill("");
  }

  function removeSkill(skill) {
    updateJobseekerSkills(
      currentUser.id,
      currentUser.skills.filter((s) => s !== skill),
    );
  }

  return (
    <div>
      <PageHeader
        eyebrow="Reverse Hiring"
        title="My Activity"
        description="Employers search by what you've done, not just your resume. This is what they see."
      />

      <Card className="mb-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-zinc-900">Discoverable in employer search</p>
            <p className="mt-1 text-sm text-zinc-500">
              {currentUser.discoverable
                ? "Employers can find you when searching by skill and activity."
                : "You're hidden from Reverse Hiring search results."}
            </p>
          </div>
          <button
            onClick={() => toggleDiscoverable(currentUser.id)}
            className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${
              currentUser.discoverable ? "bg-indigo-600" : "bg-zinc-300"
            }`}
            aria-pressed={currentUser.discoverable}
          >
            <span
              className={`absolute top-1 h-5 w-5 rounded-full bg-white transition-transform ${
                currentUser.discoverable ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <h2 className="mb-4 text-sm font-semibold text-zinc-900">Activity timeline</h2>
          {activity.length === 0 ? (
            <p className="text-sm text-zinc-400">
              Complete a micro job to start building a verifiable track record.
            </p>
          ) : (
            <ol className="space-y-4 border-l border-zinc-200 pl-4">
              {activity.map((a) => (
                <li key={a.id} className="relative">
                  <span className="absolute -left-[22px] top-0.5 text-sm">
                    {ACTIVITY_ICON[a.type] || "•"}
                  </span>
                  <p className="text-sm text-zinc-800">{a.title}</p>
                  <div className="mt-1 flex items-center gap-2">
                    {a.skill ? <Badge tone="indigo">{a.skill}</Badge> : null}
                    <span className="text-xs text-zinc-400">{timeAgo(a.date)}</span>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </Card>

        <div className="space-y-6">
          <Card>
            <h2 className="mb-1 text-sm font-semibold text-zinc-900">Verified track record</h2>
            <p className="text-2xl font-semibold text-indigo-600">{completed}</p>
            <p className="text-xs text-zinc-400">micro jobs completed and approved</p>
          </Card>

          <Card>
            <h2 className="mb-3 text-sm font-semibold text-zinc-900">Skills</h2>
            <div className="mb-3 flex flex-wrap gap-2">
              {currentUser.skills.map((s) => (
                <button key={s} onClick={() => removeSkill(s)} title="Remove">
                  <Badge tone="indigo" className="cursor-pointer hover:bg-indigo-200">
                    {s} ✕
                  </Badge>
                </button>
              ))}
            </div>
            <form onSubmit={addSkill} className="flex gap-2">
              <Input
                placeholder="Add a skill…"
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
              />
              <Button type="submit" size="sm" variant="secondary">
                Add
              </Button>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
}
