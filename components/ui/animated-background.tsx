/** Page ground: engineering grid fading out downward, one cold green bloom. */
export function AnimatedBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden bg-background" aria-hidden>
      <div
        className="grid-texture absolute inset-0"
        style={{
          maskImage: 'radial-gradient(ellipse 75% 38% at 50% 0%, black 5%, transparent 85%)',
          WebkitMaskImage:
            'radial-gradient(ellipse 75% 38% at 50% 0%, black 5%, transparent 85%)',
        }}
      />
      <div className="absolute -top-40 left-1/2 h-[26rem] w-[52rem] -translate-x-1/2 rounded-full bg-primary/[0.06] blur-[100px]" />
    </div>
  );
}
