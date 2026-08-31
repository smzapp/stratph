"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { apiFetch, ApiError, getToken, setToken } from "./api";
import { connectSocket, disconnectSocket } from "./socket";
import { ROLES, APPLICANT_STATUSES, MICRO_JOB_STATUSES, OFFER_STATUSES } from "./types";
import type {
  AppContextValue,
  AppDb,
  LoginResult,
  ModerationStatus,
  NewJobInput,
  NewMicroJobInput,
  Notification,
  OfferStatus,
  OfferType,
  PlatformSettings,
  ProfilePatch,
  RegisterEmployerInput,
  RegisterJobseekerInput,
  ReportReason,
  SubscriptionPlan,
  User,
  UserStatus,
} from "./types";
import type { ApplicantStatus } from "./types";

const EMPTY_DB: AppDb = { users: [], microJobs: [], jobs: [], activity: [], offers: [] };

const AppContext = createContext<AppContextValue | null>(null);

interface AuthResponse {
  accessToken: string;
  user: User;
}

function errorMessage(err: unknown): string {
  if (err instanceof ApiError) return err.message;
  if (err instanceof Error) return err.message;
  return "Something went wrong. Please try again.";
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [db, setDb] = useState<AppDb>(EMPTY_DB);
  const [settings, setSettings] = useState<PlatformSettings | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const loadAll = useCallback(async () => {
    const [bootstrap, settingsResp] = await Promise.all([
      apiFetch<AppDb>("/bootstrap"),
      apiFetch<PlatformSettings>("/settings"),
    ]);
    setDb(bootstrap);
    setSettings(settingsResp);
  }, []);

  const loadNotifications = useCallback(async () => {
    try {
      const res = await apiFetch<Notification[]>("/notifications");
      setNotifications(res);
    } catch {
      // ignore — notifications are best-effort
    }
  }, []);

  const connectRealtime = useCallback((token: string) => {
    const socket = connectSocket(token);
    socket.off("notification").on("notification", (n: Notification) => {
      setNotifications((prev) => [n, ...prev]);
    });
  }, []);

  const refresh = useCallback(async () => {
    if (!getToken()) return;
    await loadAll();
  }, [loadAll]);

  useEffect(() => {
    let cancelled = false;
    async function init() {
      const token = getToken();
      if (!token) {
        setHydrated(true);
        return;
      }
      try {
        const me = await apiFetch<User>("/auth/me");
        if (cancelled) return;
        setUserId(me.id);
        await Promise.all([loadAll(), loadNotifications()]);
        connectRealtime(token);
      } catch {
        setToken(null);
      } finally {
        if (!cancelled) setHydrated(true);
      }
    }
    init();
    return () => {
      cancelled = true;
    };
  }, [loadAll, loadNotifications, connectRealtime]);

  const currentUser = useMemo(() => db.users.find((u) => u.id === userId) || null, [db.users, userId]);

  const afterAuth = useCallback(
    async (res: AuthResponse): Promise<LoginResult> => {
      setToken(res.accessToken);
      setUserId(res.user.id);
      await Promise.all([loadAll(), loadNotifications()]);
      connectRealtime(res.accessToken);
      return { ok: true, user: res.user };
    },
    [loadAll, loadNotifications, connectRealtime],
  );

  const actions = useMemo(
    () => ({
      async login(email: string, password: string): Promise<LoginResult> {
        try {
          const res = await apiFetch<AuthResponse>("/auth/login", {
            method: "POST",
            body: JSON.stringify({ email, password }),
          });
          return await afterAuth(res);
        } catch (err) {
          return { ok: false, error: errorMessage(err) };
        }
      },

      async registerJobseeker(data: RegisterJobseekerInput): Promise<LoginResult> {
        try {
          const res = await apiFetch<AuthResponse>("/auth/register/jobseeker", {
            method: "POST",
            body: JSON.stringify(data),
          });
          return await afterAuth(res);
        } catch (err) {
          return { ok: false, error: errorMessage(err) };
        }
      },

      async registerEmployer(data: RegisterEmployerInput): Promise<LoginResult> {
        try {
          const res = await apiFetch<AuthResponse>("/auth/register/employer", {
            method: "POST",
            body: JSON.stringify(data),
          });
          return await afterAuth(res);
        } catch (err) {
          return { ok: false, error: errorMessage(err) };
        }
      },

      logout() {
        setToken(null);
        setUserId(null);
        setDb(EMPTY_DB);
        setSettings(null);
        setNotifications([]);
        disconnectSocket();
      },

      refresh,

      async applyToMicroJob(microJobId: string) {
        try {
          await apiFetch(`/micro-jobs/${microJobId}/apply`, { method: "POST" });
          await loadAll();
        } catch (err) {
          window.alert(errorMessage(err));
        }
      },

      async submitDeliverable(microJobId: string, _jobseekerId: string, submission: { note: string; link: string }) {
        try {
          await apiFetch(`/micro-jobs/${microJobId}/submit`, {
            method: "POST",
            body: JSON.stringify(submission),
          });
          await loadAll();
        } catch (err) {
          window.alert(errorMessage(err));
        }
      },

      async reviewSubmission(
        microJobId: string,
        jobseekerId: string,
        decision: ApplicantStatus,
        feedback: string,
      ) {
        try {
          await apiFetch(`/micro-jobs/${microJobId}/applicants/${jobseekerId}/review`, {
            method: "PATCH",
            body: JSON.stringify({ decision, feedback }),
          });
          await loadAll();
        } catch (err) {
          window.alert(errorMessage(err));
        }
      },

      async upgradeCandidate(microJobId: string, jobseekerId: string, offerType: OfferType, message: string) {
        try {
          await apiFetch(`/micro-jobs/${microJobId}/applicants/${jobseekerId}/upgrade`, {
            method: "POST",
            body: JSON.stringify({ offerType, message }),
          });
          await loadAll();
        } catch (err) {
          window.alert(errorMessage(err));
        }
      },

      async respondToOffer(offerId: string, decision: OfferStatus) {
        try {
          await apiFetch(`/offers/${offerId}/respond`, {
            method: "PATCH",
            body: JSON.stringify({ decision }),
          });
          await loadAll();
        } catch (err) {
          window.alert(errorMessage(err));
        }
      },

      async postMicroJob(_employerId: string, data: NewMicroJobInput) {
        try {
          await apiFetch("/micro-jobs", { method: "POST", body: JSON.stringify(data) });
          await loadAll();
        } catch (err) {
          window.alert(errorMessage(err));
        }
      },

      async postJob(_employerId: string, data: NewJobInput) {
        try {
          await apiFetch("/jobs", { method: "POST", body: JSON.stringify(data) });
          await loadAll();
        } catch (err) {
          window.alert(errorMessage(err));
        }
      },

      async toggleDiscoverable(_jobseekerId: string) {
        try {
          const next = !db.users.find((u) => u.id === userId)?.discoverable;
          await apiFetch("/me/discoverable", {
            method: "PATCH",
            body: JSON.stringify({ discoverable: next }),
          });
          await loadAll();
        } catch (err) {
          window.alert(errorMessage(err));
        }
      },

      async updateJobseekerSkills(_jobseekerId: string, skills: string[]) {
        try {
          await apiFetch("/me/profile", { method: "PATCH", body: JSON.stringify({ skills }) });
          await loadAll();
        } catch (err) {
          window.alert(errorMessage(err));
        }
      },

      async updateMyProfile(patch: ProfilePatch) {
        try {
          await apiFetch("/me/profile", { method: "PATCH", body: JSON.stringify(patch) });
          await loadAll();
        } catch (err) {
          window.alert(errorMessage(err));
        }
      },

      async deactivateAccount() {
        try {
          await apiFetch("/auth/deactivate", { method: "POST" });
        } catch (err) {
          window.alert(errorMessage(err));
        } finally {
          setToken(null);
          setUserId(null);
          setDb(EMPTY_DB);
          setSettings(null);
          setNotifications([]);
          disconnectSocket();
        }
      },

      async adminSetUserStatus(targetUserId: string, status: UserStatus) {
        try {
          await apiFetch(`/users/${targetUserId}/status`, {
            method: "PATCH",
            body: JSON.stringify({ status }),
          });
          await loadAll();
        } catch (err) {
          window.alert(errorMessage(err));
        }
      },

      async adminVerifyEmployer(employerId: string) {
        try {
          await apiFetch(`/users/${employerId}/verify`, { method: "PATCH" });
          await loadAll();
        } catch (err) {
          window.alert(errorMessage(err));
        }
      },

      async adminModerateMicroJob(microJobId: string, moderation: ModerationStatus) {
        try {
          await apiFetch(`/micro-jobs/${microJobId}/moderate`, {
            method: "PATCH",
            body: JSON.stringify({ moderation }),
          });
          await loadAll();
        } catch (err) {
          window.alert(errorMessage(err));
        }
      },

      async closeMicroJob(microJobId: string) {
        try {
          await apiFetch(`/micro-jobs/${microJobId}/close`, { method: "PATCH" });
          await loadAll();
        } catch (err) {
          window.alert(errorMessage(err));
        }
      },

      async adminModerateJob(jobId: string, moderation: ModerationStatus) {
        try {
          await apiFetch(`/jobs/${jobId}/moderate`, {
            method: "PATCH",
            body: JSON.stringify({ moderation }),
          });
          await loadAll();
        } catch (err) {
          window.alert(errorMessage(err));
        }
      },

      async adminSetSubscription(targetUserId: string, plan: SubscriptionPlan | null) {
        try {
          await apiFetch(`/users/${targetUserId}/subscription`, {
            method: "PATCH",
            body: JSON.stringify({ plan }),
          });
          await loadAll();
        } catch (err) {
          window.alert(errorMessage(err));
        }
      },

      async subscribeToPlan(plan: SubscriptionPlan) {
        try {
          await apiFetch("/me/subscribe", { method: "POST", body: JSON.stringify({ plan }) });
          await loadAll();
        } catch (err) {
          window.alert(errorMessage(err));
        }
      },

      async cancelSubscription() {
        try {
          await apiFetch("/me/cancel-subscription", { method: "POST" });
          await loadAll();
        } catch (err) {
          window.alert(errorMessage(err));
        }
      },

      async markNotificationRead(id: string) {
        setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
        try {
          await apiFetch(`/notifications/${id}/read`, { method: "PATCH" });
        } catch {
          // ignore
        }
      },

      async markAllNotificationsRead() {
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
        try {
          await apiFetch("/notifications/read-all", { method: "PATCH" });
        } catch {
          // ignore
        }
      },

      async inviteToMicroJob(microJobId: string, jobseekerId: string) {
        try {
          await apiFetch(`/micro-jobs/${microJobId}/invite`, {
            method: "POST",
            body: JSON.stringify({ jobseekerId }),
          });
          await loadAll();
          return true;
        } catch (err) {
          window.alert(errorMessage(err));
          return false;
        }
      },

      async contactJobseeker(jobseekerId: string, message: string) {
        try {
          await apiFetch(`/users/${jobseekerId}/contact`, {
            method: "POST",
            body: JSON.stringify({ message }),
          });
          return true;
        } catch (err) {
          window.alert(errorMessage(err));
          return false;
        }
      },

      async reportUser(reportedUserId: string, reason: ReportReason, details?: string, contextLabel?: string) {
        try {
          await apiFetch("/reports", {
            method: "POST",
            body: JSON.stringify({ reportedUserId, reason, details, contextLabel }),
          });
          return true;
        } catch (err) {
          window.alert(errorMessage(err));
          return false;
        }
      },

      async adminResolveReport(reportId: string) {
        try {
          await apiFetch(`/reports/${reportId}/resolve`, { method: "PATCH" });
        } catch (err) {
          window.alert(errorMessage(err));
        }
      },

      async updateSettings(patch: Partial<Pick<PlatformSettings, "microJobAutoApprove">>) {
        try {
          await apiFetch("/settings", { method: "PATCH", body: JSON.stringify(patch) });
          await loadAll();
        } catch (err) {
          window.alert(errorMessage(err));
        }
      },

      async recordProfileView(targetUserId: string) {
        // Best-effort analytics ping — never interrupt the viewer with an error.
        try {
          await apiFetch(`/users/${targetUserId}/view`, { method: "POST" });
        } catch {
          // ignore
        }
      },
    }),
    [db.users, userId, loadAll, refresh, afterAuth],
  );

  const unreadNotificationCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications],
  );

  const value: AppContextValue = useMemo(
    () => ({ db, settings, currentUser, hydrated, notifications, unreadNotificationCount, ...actions }),
    [db, settings, currentUser, hydrated, notifications, unreadNotificationCount, actions],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}

export { ROLES, APPLICANT_STATUSES, MICRO_JOB_STATUSES, OFFER_STATUSES };
