/** A gold seal whose ring and tick draw themselves, with a short burst of saffron and gold confetti. */
export function GoldSeal({ size = 112 }: { size?: number }) {
  const bits = Array.from({ length: 14 }, (_, i) => {
    const a = (i / 14) * Math.PI * 2, r = 70 + (i % 3) * 18;
    return { dx: Math.cos(a) * r, dy: Math.sin(a) * r, rot: (i * 67) % 360, c: ["#f4a62a", "#e9c987", "#6e1a2c", "#c9a45a"][i % 4], d: (i % 5) * 0.05 };
  });
  return (
    <div className="relative mx-auto" style={{ width: size, height: size }} aria-hidden="true">
      <div className="absolute inset-0 grid place-items-center">
        {bits.map((b, i) => (
          <span key={i} className="confetti-dot" style={{ background: b.c, animationDelay: `${0.75 + b.d}s`, ["--dx" as string]: `${b.dx}px`, ["--dy" as string]: `${b.dy}px`, ["--r" as string]: `${b.rot}deg` }} />
        ))}
      </div>
      <svg viewBox="0 0 112 112" width={size} height={size} className="seal-pop relative drop-shadow-[0_14px_24px_rgba(110,26,44,0.35)]">
        <defs>
          <radialGradient id="seal-g" cx="38%" cy="32%" r="75%"><stop offset="0" stopColor="#fff6d6" /><stop offset=".45" stopColor="#e9c987" /><stop offset=".8" stopColor="#c9a45a" /><stop offset="1" stopColor="#8a6424" /></radialGradient>
        </defs>
        <circle cx="56" cy="56" r="52" fill="url(#seal-g)" />
        <circle cx="56" cy="56" r="44" fill="#6e1a2c" />
        <circle className="seal-ring" cx="56" cy="56" r="48" fill="none" stroke="#fff6d6" strokeWidth="2" transform="rotate(-90 56 56)" />
        <path className="seal-tick" d="M37 57l13 13 26-28" fill="none" stroke="#f6e2a8" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}
