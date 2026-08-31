"use client";

import { useMemo, useState } from "react";
import { useApp } from "@/lib/store";
import { formatDate } from "@/lib/helpers";
import { ROLES } from "@/lib/mockData";
import { Avatar, Badge, Button, Card, Input, PageHeader, Select } from "@/components/ui/Primitives";
import { StatusBadge } from "@/components/ui/StatusBadge";

const ROLE_LABEL = {
  [ROLES.JOBSEEKER]: "Jobseeker",
  [ROLES.EMPLOYER]: "Employer",
  [ROLES.ADMIN]: "Super Admin",
};

export default function AdminUsers() {
  const { db, currentUser, adminSetUserStatus, adminVerifyEmployer } = useApp();
  const [query, setQuery] = useState("");
  const [role, setRole] = useState("All");

  const users = useMemo(() => {
    return db.users
      .filter((u) => role === "All" || u.role === role)
      .filter((u) =>
        query.trim()
          ? (u.name + u.email + (u.companyName || "")).toLowerCase().includes(query.toLowerCase())
          : true,
      )
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [db.users, query, role]);

  return (
    <div>
      <PageHeader title="Users" description="Manage jobseekers, employers, and their account status." />

      <div className="mb-5 flex flex-col gap-3 sm:flex-row">
        <Input
          placeholder="Search by name, company, or email…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="sm:max-w-xs"
        />
        <Select value={role} onChange={(e) => setRole(e.target.value)} className="sm:max-w-[180px]">
          <option value="All">All roles</option>
          <option value={ROLES.JOBSEEKER}>Jobseekers</option>
          <option value={ROLES.EMPLOYER}>Employers</option>
          <option value={ROLES.ADMIN}>Super Admins</option>
        </Select>
      </div>

      <Card className="overflow-x-auto p-0">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b border-zinc-100 text-left text-xs uppercase tracking-wide text-zinc-400">
              <th className="px-5 py-3 font-medium">User</th>
              <th className="px-5 py-3 font-medium">Role</th>
              <th className="px-5 py-3 font-medium">Status</th>
              <th className="px-5 py-3 font-medium">Joined</th>
              <th className="px-5 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {users.map((u) => (
              <tr key={u.id}>
                <td className="px-5 py-3">
                  <div className="flex items-center gap-3">
                    <Avatar name={u.companyName || u.name} size={8} />
                    <div>
                      <p className="font-medium text-zinc-900">{u.companyName || u.name}</p>
                      <p className="text-xs text-zinc-400">{u.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-3">
                  <div className="flex items-center gap-1.5">
                    <Badge tone="zinc">{ROLE_LABEL[u.role]}</Badge>
                    {u.role === ROLES.EMPLOYER && !u.verified ? (
                      <Badge tone="amber">Unverified</Badge>
                    ) : null}
                  </div>
                </td>
                <td className="px-5 py-3">
                  <StatusBadge status={u.status} />
                </td>
                <td className="px-5 py-3 text-zinc-500">{formatDate(u.createdAt)}</td>
                <td className="px-5 py-3">
                  <div className="flex justify-end gap-2">
                    {u.role === ROLES.EMPLOYER && !u.verified ? (
                      <Button size="sm" variant="outline" onClick={() => adminVerifyEmployer(u.id)}>
                        Verify
                      </Button>
                    ) : null}
                    {u.id !== currentUser.id ? (
                      <Button
                        size="sm"
                        variant={u.status === "suspended" ? "secondary" : "danger"}
                        onClick={() =>
                          adminSetUserStatus(u.id, u.status === "suspended" ? "active" : "suspended")
                        }
                      >
                        {u.status === "suspended" ? "Reactivate" : "Suspend"}
                      </Button>
                    ) : null}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
