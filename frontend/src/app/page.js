import Link from "next/link";
import { Button, Badge, Card } from "@/components/ui/Primitives";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col bg-white">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-sm font-bold text-white">
            SP
          </div>
          <span className="text-sm font-semibold text-zinc-900">StratPH</span>
        </div>
        <Link href="/login">
          <Button variant="outline" size="sm">
            Log in
          </Button>
        </Link>
      </header>

      <section className="mx-auto flex w-full max-w-6xl flex-col items-center px-6 pb-16 pt-10 text-center">
        <Badge tone="indigo">Built for Filipino talent</Badge>
        <h1 className="mt-5 max-w-3xl text-4xl font-semibold tracking-tight text-zinc-900 sm:text-5xl">
          Not another job board. Prove yourself first, get hired faster.
        </h1>
        <p className="mt-4 max-w-xl text-lg text-zinc-500">
          StratPH replaces &ldquo;Apply → Interview → Reject&rdquo; with{" "}
          <span className="font-medium text-zinc-800">Try → Prove → Hire</span> — paid micro
          jobs employers use as an audition, and a search engine that finds you by what
          you&apos;ve actually done.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link href="/login?role=jobseeker">
            <Button size="lg">I&apos;m looking for work</Button>
          </Link>
          <Link href="/login?role=employer">
            <Button size="lg" variant="outline">
              I&apos;m hiring
            </Button>
          </Link>
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-6xl gap-6 px-6 pb-24 sm:grid-cols-2">
        <Card className="border-indigo-100 bg-indigo-50/40">
          <Badge tone="indigo">Killer feature</Badge>
          <h2 className="mt-3 text-lg font-semibold text-zinc-900">
            Micro Jobs — a paid audition before full-time
          </h2>
          <p className="mt-2 text-sm text-zinc-600">
            Convert a PDF to Excel. Fix one React component. Edit one video. Answer 20 support
            emails. Small, paid tasks (₱300–₱3,000) that let employers see real work before
            committing — and instantly upgrade a great performer to part-time, contract, or
            full-time.
          </p>
        </Card>
        <Card className="border-emerald-100 bg-emerald-50/40">
          <Badge tone="emerald">Killer feature</Badge>
          <h2 className="mt-3 text-lg font-semibold text-zinc-900">
            Reverse Hiring — candidates find you by doing, not applying
          </h2>
          <p className="mt-2 text-sm text-zinc-600">
            Employers search &ldquo;React developer who deployed AWS in last 30 days&rdquo; and
            get real people with verified activity — not just resumes. The more you do on StratPH, the
            more discoverable you become.
          </p>
        </Card>
      </section>

      <footer className="border-t border-zinc-100 py-6 text-center text-xs text-zinc-400">
        StratPH — UI prototype. No live payments or accounts are processed.
      </footer>
    </div>
  );
}
