"use client";

import { useState } from "react";
import { useApp } from "@/lib/store";

export function FollowEmployerButton({
  employerId,
  className,
}: {
  employerId: string;
  className?: string;
}) {
  const { currentUser, followedEmployers, followEmployer, unfollowEmployer } = useApp();
  const [pending, setPending] = useState(false);

  if (!currentUser || currentUser.role !== "jobseeker") return null;

  const isFollowing = followedEmployers.some((f) => f.id === employerId);

  async function toggle() {
    setPending(true);
    if (isFollowing) {
      await unfollowEmployer(employerId);
    } else {
      await followEmployer(employerId);
    }
    setPending(false);
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={pending}
      className={`text-xs font-medium disabled:opacity-50 ${
        isFollowing ? "text-indigo-600 hover:text-indigo-700" : "text-zinc-400 hover:text-zinc-600"
      } hover:underline ${className ?? ""}`}
    >
      {isFollowing ? "✓ Following" : "+ Follow"}
    </button>
  );
}
