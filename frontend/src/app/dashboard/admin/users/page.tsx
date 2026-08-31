"use client";

import { useCallback, useEffect, useState } from "react";
import { useApp } from "@/lib/store";
import { apiFetch } from "@/lib/api";
import { formatDate } from "@/lib/helpers";
import { ROLES } from "@/lib/types";
import { Avatar, Badge, Button, Card, Input, PageHeader, Select } from "@/components/ui/Primitives";
import { StatusBadge } from "@/components/ui/StatusBadge";
import type { Role, User } from "@/lib/types";

const ROLE_LABEL: Record<Role, string> = {
  [ROLES.JOBSEEKER]: "Jobseeker",
  [ROLES.EMPLOYER]: "Employer",
  [ROLES.ADMIN]: "Super Admin",
};

const PAGE_SIZE = 5;

interface PaginatedUsersResponse {
  data: User[];
  total: number;
  page: number;
  limit: number;
}

export default function AdminUsers() {
  const { currentUser, adminSetUserStatus, adminVerifyEmployer } = useApp();
  const [query, setQuery] = useState("");
  const [role, setRole] = useState("All");
  const [page, setPage] = useState(1);
  const [result, setResult] = useState<PaginatedUsersResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchPage = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(PAGE_SIZE) });
      if (role !== "All") params.set("role", role);
      if (query.trim()) params.set("q", query.trim());
      const res = await apiFetch<PaginatedUsersResponse>(`/users?${params.toString()}`);
      setResult(res);
    } finally {
      setLoading(false);
    }
  }, [page, role, query]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchPage();
  }, [fetchPage]);

  if (!currentUser) return null;

  const users = result?.data ?? [];
  const total = result?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  async function withRefresh(action: Promise<void>) {
    await action;
    await fetchPage();
  }

  return (
    <div>
      <PageHeader title="Users" description="Manage jobseekers, employers, and their account status." />

      <div className="mb-5 flex flex-col gap-3 sm:flex-row">
        <Input
          placeholder="Search by name, company, or email…"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setPage(1);
          }}
          className="sm:max-w-xs"
        />
        <Select
          value={role}
          onChange={(e) => {
            setRole(e.target.value);
            setPage(1);
          }}
          className="sm:max-w-[180px]"
        >
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
            {loading && users.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-5 py-8 text-center text-sm text-zinc-400">
                  Loading…
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-5 py-8 text-center text-sm text-zinc-400">
                  No users match this filter.
                </td>
              </tr>
            ) : (
              users.map((u) => (
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
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => withRefresh(adminVerifyEmployer(u.id))}
                        >
                          Verify
                        </Button>
                      ) : null}
                      {u.id !== currentUser.id ? (
                        <Button
                          size="sm"
                          variant={u.status === "suspended" ? "secondary" : "danger"}
                          onClick={() =>
                            withRefresh(
                              adminSetUserStatus(u.id, u.status === "suspended" ? "active" : "suspended"),
                            )
                          }
                        >
                          {u.status === "suspended" ? "Reactivate" : "Suspend"}
                        </Button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        <div className="flex items-center justify-between border-t border-zinc-100 px-5 py-3">
          <p className="text-xs text-zinc-400">
            {total === 0
              ? "No users"
              : `Showing ${(page - 1) * PAGE_SIZE + 1}–${Math.min(page * PAGE_SIZE, total)} of ${total}`}
          </p>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Previous
            </Button>
            <span className="text-xs text-zinc-500">
              Page {page} of {totalPages}
            </span>
            <Button
              size="sm"
              variant="outline"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              Next
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
