export function LoadingSkeleton() {
  return (
    <div className="space-y-4">
      {[0, 1, 2].map((item) => (
        <div
          key={item}
          className="h-40 animate-pulse rounded-none border border-border bg-surface/40"
        />
      ))}
    </div>
  );
}

