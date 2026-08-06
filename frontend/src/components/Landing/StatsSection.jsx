import React, { useEffect, useRef, useState } from 'react';

function AnimatedCounter({ end, suffix = '', duration = 1800 }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      const start = performance.now();

      const tick = (time) => {
        const progress = Math.min((time - start) / duration, 1);
        const eased = 1 - (1 - progress) ** 3;
        setCount(Math.floor(eased * end));
        if (progress < 1) requestAnimationFrame(tick);
      };

      requestAnimationFrame(tick);
      observer.disconnect();
    }, { threshold: 0.35 });

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [end, duration]);

  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>;
}

const STATS = [
  { icon: 'shield_person', value: 10000, suffix: '+', label: 'Women protected' },
  { icon: 'speed', value: 98, suffix: '%', label: 'SOS response rate' },
  { icon: 'location_city', value: 500, suffix: '+', label: 'Cities covered' },
  { icon: 'timer', value: 30, suffix: ' sec', label: 'Average alert time', prefix: '< ' },
];

export default function StatsSection() {
  return (
    <section className="relative border-y border-white/10 bg-slate-950/70 py-20 backdrop-blur-xl">
      <div className="mx-auto max-w-7xl px-6 md:px-8">
        <div className="grid gap-6 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-violet-200">Trusted at scale</p>
            <h2 className="mt-3 font-headline text-3xl font-semibold text-white md:text-5xl">Impact that reads like a premium report</h2>
            <p className="mt-4 max-w-xl text-slate-300">Instead of a uniform row of cards, the numbers now sit in a more editorial composition.</p>
          </div>

          <div className="lg:col-span-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <div className="premium-panel p-6 xl:col-span-2 xl:row-span-2">
              <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500/30 to-pink-500/20 text-violet-200">
                <span className="material-symbols-outlined">{STATS[0].icon}</span>
              </div>
              <div className="font-headline text-5xl font-semibold text-white tabular-nums">
                <AnimatedCounter end={STATS[0].value} suffix={STATS[0].suffix} />
              </div>
              <p className="mt-2 text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">{STATS[0].label}</p>
            </div>

            {STATS.slice(1).map((stat) => (
              <div key={stat.label} className="premium-panel p-6">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500/30 to-pink-500/20 text-violet-200">
                  <span className="material-symbols-outlined">{stat.icon}</span>
                </div>
                <div className="font-headline text-4xl font-semibold text-white tabular-nums">
                  {stat.prefix || ''}<AnimatedCounter end={stat.value} suffix={stat.suffix} />
                </div>
                <p className="mt-2 text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
