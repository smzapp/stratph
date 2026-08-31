import { initials } from "@/lib/helpers";

export function Button({
  as: Component = "button",
  variant = "primary",
  size = "md",
  className = "",
  ...props
}) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed";
  const variants = {
    primary: "bg-indigo-600 text-white hover:bg-indigo-500",
    secondary: "bg-zinc-100 text-zinc-900 hover:bg-zinc-200",
    outline: "border border-zinc-300 text-zinc-700 hover:bg-zinc-50",
    ghost: "text-zinc-600 hover:bg-zinc-100",
    danger: "bg-rose-600 text-white hover:bg-rose-500",
    success: "bg-emerald-600 text-white hover:bg-emerald-500",
  };
  const sizes = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-sm",
    lg: "px-5 py-2.5 text-base",
  };
  return (
    <Component
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    />
  );
}

export function Badge({ children, tone = "zinc", className = "" }) {
  const tones = {
    zinc: "bg-zinc-100 text-zinc-700",
    indigo: "bg-indigo-100 text-indigo-700",
    emerald: "bg-emerald-100 text-emerald-700",
    amber: "bg-amber-100 text-amber-800",
    rose: "bg-rose-100 text-rose-700",
    sky: "bg-sky-100 text-sky-700",
  };
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${tones[tone]} ${className}`}
    >
      {children}
    </span>
  );
}

export function Card({ children, className = "", ...props }) {
  return (
    <div
      className={`rounded-xl border border-zinc-200 bg-white p-5 shadow-sm ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function StatCard({ label, value, hint, tone = "indigo" }) {
  const tones = {
    indigo: "text-indigo-600",
    emerald: "text-emerald-600",
    amber: "text-amber-600",
    rose: "text-rose-600",
  };
  return (
    <Card>
      <p className="text-sm text-zinc-500">{label}</p>
      <p className={`mt-1 text-2xl font-semibold ${tones[tone]}`}>{value}</p>
      {hint ? <p className="mt-1 text-xs text-zinc-400">{hint}</p> : null}
    </Card>
  );
}

export function Input({ label, hint, className = "", ...props }) {
  return (
    <label className="block">
      {label ? (
        <span className="mb-1.5 block text-sm font-medium text-zinc-700">{label}</span>
      ) : null}
      <input
        className={`w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100 ${className}`}
        {...props}
      />
      {hint ? <span className="mt-1 block text-xs text-zinc-400">{hint}</span> : null}
    </label>
  );
}

export function Textarea({ label, hint, className = "", ...props }) {
  return (
    <label className="block">
      {label ? (
        <span className="mb-1.5 block text-sm font-medium text-zinc-700">{label}</span>
      ) : null}
      <textarea
        className={`w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100 ${className}`}
        {...props}
      />
      {hint ? <span className="mt-1 block text-xs text-zinc-400">{hint}</span> : null}
    </label>
  );
}

export function Select({ label, children, className = "", ...props }) {
  return (
    <label className="block">
      {label ? (
        <span className="mb-1.5 block text-sm font-medium text-zinc-700">{label}</span>
      ) : null}
      <select
        className={`w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100 ${className}`}
        {...props}
      >
        {children}
      </select>
    </label>
  );
}

export function Avatar({ name, size = 9, className = "" }) {
  const palette = ["bg-indigo-500", "bg-emerald-500", "bg-amber-500", "bg-sky-500", "bg-rose-500"];
  const idx = (name || "").length % palette.length;
  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white ${palette[idx]} ${className}`}
      style={{ height: `${size * 4}px`, width: `${size * 4}px` }}
    >
      {initials(name)}
    </div>
  );
}

export function EmptyState({ title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-zinc-300 px-6 py-14 text-center">
      <p className="text-sm font-semibold text-zinc-700">{title}</p>
      {description ? <p className="mt-1 max-w-sm text-sm text-zinc-500">{description}</p> : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

export function PageHeader({ eyebrow, title, description, actions }) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {eyebrow ? (
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-indigo-600">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="text-xl font-semibold text-zinc-900">{title}</h1>
        {description ? <p className="mt-1 text-sm text-zinc-500">{description}</p> : null}
      </div>
      {actions ? <div className="flex shrink-0 gap-2">{actions}</div> : null}
    </div>
  );
}
