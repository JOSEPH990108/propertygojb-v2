type AuthShellProps = {
  children: React.ReactNode
}

export function AuthShell({ children }: AuthShellProps) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-muted/30 p-4">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,var(--color-border),transparent_45%)] opacity-35" />
      <div className="relative w-full max-w-md rounded-2xl border border-border/70 bg-card p-6 shadow-sm md:p-8">
        {children}
      </div>
    </div>
  )
}
