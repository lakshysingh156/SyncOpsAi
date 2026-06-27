export function Placeholder({
  title,
  milestone,
  desc,
}: {
  title: string;
  milestone: string;
  desc: string;
}) {
  return (
    <div className="mx-auto max-w-7xl">
      <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
      <p className="mt-1 text-sm text-muted">{desc}</p>
      <div className="card mt-6 flex flex-col items-center justify-center gap-2 px-6 py-16 text-center">
        <div className="rounded-full border border-border bg-surface-2 px-3 py-1 text-[11px] text-muted">
          {milestone}
        </div>
        <p className="max-w-sm text-sm text-muted">
          This view is part of an upcoming milestone and will be wired to live
          data soon.
        </p>
      </div>
    </div>
  );
}
