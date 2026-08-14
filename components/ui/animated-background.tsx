'use client';

/** Static "graph paper" ground: dot grid + a cold green wash. No animation loops. */
export function AnimatedBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute inset-0 bg-background" />
      <div
        className="absolute inset-0 opacity-[0.35] dark:opacity-[0.25]"
        style={{
          backgroundImage: 'radial-gradient(hsl(var(--foreground) / 0.14) 1px, transparent 1px)',
          backgroundSize: '26px 26px',
          maskImage: 'radial-gradient(ellipse 90% 65% at 50% 0%, black 30%, transparent 100%)',
          WebkitMaskImage: 'radial-gradient(ellipse 90% 65% at 50% 0%, black 30%, transparent 100%)',
        }}
      />
      <div className="absolute -top-48 left-1/2 h-[30rem] w-[46rem] -translate-x-1/2 rounded-full bg-primary/[0.07] blur-3xl" />
    </div>
  );
}
