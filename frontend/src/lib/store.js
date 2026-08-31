"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  seedDatabase,
  ROLES,
  APPLICANT_STATUSES,
  MICRO_JOB_STATUSES,
  OFFER_STATUSES,
} from "./mockData";

const STORAGE_KEY = "stratph_mock_db_v1";
const SESSION_KEY = "stratph_session_v1";

const AppContext = createContext(null);

function loadDb() {
  if (typeof window === "undefined") return seedDatabase;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return structuredClone(seedDatabase);
    return JSON.parse(raw);
  } catch {
    return structuredClone(seedDatabase);
  }
}

function loadSession() {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(SESSION_KEY);
  } catch {
    return null;
  }
}

let idCounter = 1000;
function nextId(prefix) {
  idCounter += 1;
  return `${prefix}-${Date.now().toString(36)}-${idCounter}`;
}

export function AppProvider({ children }) {
  const [db, setDb] = useState(seedDatabase);
  const [userId, setUserId] = useState(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    // Reading localStorage during the initial render would mismatch the
    // server-rendered HTML, so this mount-only sync has to happen in an effect.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDb(loadDb());
    setUserId(loadSession());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated || typeof window === "undefined") return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
  }, [db, hydrated]);

  useEffect(() => {
    if (!hydrated || typeof window === "undefined") return;
    if (userId) window.localStorage.setItem(SESSION_KEY, userId);
    else window.localStorage.removeItem(SESSION_KEY);
  }, [userId, hydrated]);

  const currentUser = useMemo(
    () => db.users.find((u) => u.id === userId) || null,
    [db.users, userId],
  );

  const actions = useMemo(
    () => ({
      login(email, password) {
        const match = db.users.find(
          (u) => u.email.toLowerCase() === email.trim().toLowerCase() && u.password === password,
        );
        if (!match) return { ok: false, error: "Incorrect email or password." };
        if (match.status === "suspended") return { ok: false, error: "This account has been suspended." };
        setUserId(match.id);
        return { ok: true, user: match };
      },

      logout() {
        setUserId(null);
      },

      resetMockData() {
        setDb(structuredClone(seedDatabase));
      },

      applyToMicroJob(microJobId, jobseekerId) {
        setDb((prev) => ({
          ...prev,
          microJobs: prev.microJobs.map((mj) => {
            if (mj.id !== microJobId) return mj;
            if (mj.applicants.some((a) => a.jobseekerId === jobseekerId)) return mj;
            return {
              ...mj,
              applicants: [
                ...mj.applicants,
                {
                  jobseekerId,
                  status: APPLICANT_STATUSES.APPLIED,
                  appliedAt: new Date().toISOString(),
                },
              ],
            };
          }),
        }));
      },

      submitDeliverable(microJobId, jobseekerId, submission) {
        setDb((prev) => ({
          ...prev,
          microJobs: prev.microJobs.map((mj) => {
            if (mj.id !== microJobId) return mj;
            return {
              ...mj,
              applicants: mj.applicants.map((a) =>
                a.jobseekerId === jobseekerId
                  ? {
                      ...a,
                      status: APPLICANT_STATUSES.SUBMITTED,
                      submission: { ...submission, submittedAt: new Date().toISOString() },
                    }
                  : a,
              ),
            };
          }),
        }));
      },

      reviewSubmission(microJobId, jobseekerId, decision, feedback) {
        setDb((prev) => {
          const microJob = prev.microJobs.find((mj) => mj.id === microJobId);
          const applicant = microJob?.applicants.find((a) => a.jobseekerId === jobseekerId);
          const newActivity = [...prev.activity];
          if (decision === APPLICANT_STATUSES.APPROVED && microJob) {
            newActivity.push({
              id: nextId("a"),
              jobseekerId,
              type: "micro_job_completed",
              skill: microJob.skillsRequired?.[0] || microJob.category,
              title: `Completed: ${microJob.title}`,
              date: new Date().toISOString(),
            });
          }
          return {
            ...prev,
            activity: newActivity,
            payments:
              decision === APPLICANT_STATUSES.APPROVED && microJob
                ? [
                    ...prev.payments,
                    {
                      id: nextId("pay"),
                      microJobId,
                      jobseekerId,
                      employerId: microJob.employerId,
                      amount: microJob.pay,
                      status: "released",
                      date: new Date().toISOString(),
                    },
                  ]
                : prev.payments,
            microJobs: prev.microJobs.map((mj) => {
              if (mj.id !== microJobId) return mj;
              return {
                ...mj,
                applicants: mj.applicants.map((a) =>
                  a.jobseekerId === jobseekerId
                    ? { ...a, status: decision, feedback, reviewedAt: new Date().toISOString() }
                    : a,
                ),
              };
            }),
          };
        });
      },

      upgradeCandidate(microJobId, jobseekerId, offerType, message) {
        setDb((prev) => {
          const microJob = prev.microJobs.find((mj) => mj.id === microJobId);
          return {
            ...prev,
            offers: [
              ...prev.offers,
              {
                id: nextId("off"),
                microJobId,
                employerId: microJob?.employerId,
                jobseekerId,
                offerType,
                message,
                status: OFFER_STATUSES.PENDING,
                createdAt: new Date().toISOString(),
              },
            ],
            microJobs: prev.microJobs.map((mj) => {
              if (mj.id !== microJobId) return mj;
              return {
                ...mj,
                applicants: mj.applicants.map((a) =>
                  a.jobseekerId === jobseekerId ? { ...a, status: APPLICANT_STATUSES.UPGRADED } : a,
                ),
              };
            }),
          };
        });
      },

      respondToOffer(offerId, decision) {
        setDb((prev) => {
          const offer = prev.offers.find((o) => o.id === offerId);
          const newActivity =
            decision === OFFER_STATUSES.ACCEPTED && offer
              ? [
                  ...prev.activity,
                  {
                    id: nextId("a"),
                    jobseekerId: offer.jobseekerId,
                    type: "upgraded",
                    skill: null,
                    title: `Accepted ${offer.offerType} offer`,
                    date: new Date().toISOString(),
                  },
                ]
              : prev.activity;
          return {
            ...prev,
            activity: newActivity,
            offers: prev.offers.map((o) => (o.id === offerId ? { ...o, status: decision } : o)),
          };
        });
      },

      postMicroJob(employerId, data) {
        const id = nextId("mj");
        setDb((prev) => ({
          ...prev,
          microJobs: [
            {
              id,
              employerId,
              status: MICRO_JOB_STATUSES.OPEN,
              moderation: "pending",
              createdAt: new Date().toISOString(),
              applicants: [],
              ...data,
            },
            ...prev.microJobs,
          ],
        }));
        return id;
      },

      postJob(employerId, data) {
        const id = nextId("job");
        setDb((prev) => ({
          ...prev,
          jobs: [
            {
              id,
              employerId,
              status: "open",
              applicants: 0,
              postedAt: new Date().toISOString(),
              ...data,
            },
            ...prev.jobs,
          ],
        }));
        return id;
      },

      toggleDiscoverable(jobseekerId) {
        setDb((prev) => ({
          ...prev,
          users: prev.users.map((u) =>
            u.id === jobseekerId ? { ...u, discoverable: !u.discoverable } : u,
          ),
        }));
      },

      updateJobseekerSkills(jobseekerId, skills) {
        setDb((prev) => ({
          ...prev,
          users: prev.users.map((u) => (u.id === jobseekerId ? { ...u, skills } : u)),
        }));
      },

      adminSetUserStatus(targetUserId, status) {
        setDb((prev) => ({
          ...prev,
          users: prev.users.map((u) => (u.id === targetUserId ? { ...u, status } : u)),
        }));
      },

      adminVerifyEmployer(employerId) {
        setDb((prev) => ({
          ...prev,
          users: prev.users.map((u) => (u.id === employerId ? { ...u, verified: true } : u)),
        }));
      },

      adminModerateMicroJob(microJobId, moderation) {
        setDb((prev) => ({
          ...prev,
          microJobs: prev.microJobs.map((mj) =>
            mj.id === microJobId ? { ...mj, moderation } : mj,
          ),
        }));
      },
    }),
    [db],
  );

  const value = useMemo(
    () => ({ db, currentUser, hydrated, ...actions }),
    [db, currentUser, hydrated, actions],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}

export { ROLES, APPLICANT_STATUSES, MICRO_JOB_STATUSES, OFFER_STATUSES };
