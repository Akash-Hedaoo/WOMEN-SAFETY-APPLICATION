import React, { useEffect, useState } from 'react';
import { Calendar, ChevronLeft, ChevronRight, MapPin, Share2, ShieldAlert, TrendingUp, X } from 'lucide-react';

const NEWS = [
  {
    id: 1,
    title: 'Hyderabad Police rolls out women helpdesk at major stations',
    date: 'Apr 26, 2026',
    category: 'Hyderabad',
    location: 'Hyderabad, Telangana',
    excerpt: 'A citywide helpdesk rollout focuses on faster response and simpler access.',
  },
  {
    id: 2,
    title: 'Karnataka allocates funds for safer late-night transit corridors',
    date: 'Apr 25, 2026',
    category: 'Karnataka',
    location: 'Bengaluru, Karnataka',
    excerpt: 'Budget allocation covers lighting, CCTV, and emergency response points.',
  },
  {
    id: 3,
    title: 'Pune introduces women-only night buses on select routes',
    date: 'Apr 24, 2026',
    category: 'Pune',
    location: 'Pune, Maharashtra',
    excerpt: 'A dedicated late-night service with onboard marshals and live GPS tracking.',
  },
  {
    id: 4,
    title: 'Supreme Court pushes self-defense training in girls’ schools',
    date: 'Apr 23, 2026',
    category: 'National',
    location: 'New Delhi, India',
    excerpt: 'A national directive to formalize safety training in education.',
  },
];

const BREAKING_TICKER = [
  'Hyderabad Police launches women helpdesk at major city stations',
  'Karnataka expands late-night transit safety upgrades',
  'Pune adds women-only night buses on select routes',
  'Women-only parking zones introduced at major malls',
];

export default function CurrentAffairsPage() {
  const [activeAlert, setActiveAlert] = useState(true);
  const [tickerIndex, setTickerIndex] = useState(0);
  const [tickerFade, setTickerFade] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setTickerFade(false);
      setTimeout(() => {
        setTickerIndex((prev) => (prev + 1) % BREAKING_TICKER.length);
        setTickerFade(true);
      }, 300);
    }, 3500);
    return () => clearInterval(interval);
  }, []);

  const handleShare = async (item) => {
    const shareText = `${item.title} — ${item.excerpt}`;
    if (navigator.share) {
      try { await navigator.share({ title: item.title, text: shareText, url: window.location.href }); } catch {}
    } else {
      navigator.clipboard.writeText(shareText);
    }
  };

  return (
    <div className="page-shell mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
      <div className="mb-8 overflow-hidden rounded-[28px] border border-white/10 bg-slate-950/80 shadow-2xl shadow-black/20 backdrop-blur-xl">
        <div className="flex items-center">
          <div className="flex shrink-0 items-center gap-2 bg-gradient-to-r from-rose-500 to-pink-600 px-5 py-4 text-xs font-semibold uppercase tracking-[0.24em] text-white">
            <span className="relative flex h-2.5 w-2.5"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75" /><span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-white" /></span>
            Live
          </div>
          <div className="flex-1 px-5 py-4">
            <p className={`text-sm text-slate-200 transition-all duration-300 ${tickerFade ? 'opacity-100' : 'opacity-0'}`}>{BREAKING_TICKER[tickerIndex]}</p>
          </div>
          <div className="flex items-center gap-2 px-4">
            <button onClick={() => setTickerIndex((v) => (v - 1 + BREAKING_TICKER.length) % BREAKING_TICKER.length)} className="rounded-xl p-2 text-slate-400 hover:bg-white/10 hover:text-white"><ChevronLeft className="h-4 w-4" /></button>
            <button onClick={() => setTickerIndex((v) => (v + 1) % BREAKING_TICKER.length)} className="rounded-xl p-2 text-slate-400 hover:bg-white/10 hover:text-white"><ChevronRight className="h-4 w-4" /></button>
          </div>
        </div>
      </div>

      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-400">Current affairs</p>
          <h1 className="mt-3 font-headline text-4xl font-semibold text-white md:text-5xl">Safety news and alerts</h1>
        </div>
        <div className="premium-chip w-fit"><TrendingUp className="h-3.5 w-3.5 text-violet-200" /> Latest updates</div>
      </div>

      {activeAlert && (
        <div className="mb-8 rounded-[28px] border border-rose-400/20 bg-rose-500/10 p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="rounded-2xl bg-rose-500/15 p-3 text-rose-100"><ShieldAlert className="h-5 w-5" /></div>
              <div>
                <h2 className="font-semibold text-white">High priority alert — Hyderabad</h2>
                <p className="mt-2 text-sm text-rose-100/90">Avoid Necklace Road near Tank Bund between 11 PM–5 AM due to ongoing road work.</p>
              </div>
            </div>
            <button onClick={() => setActiveAlert(false)} className="rounded-2xl p-2 text-rose-100 hover:bg-white/10"><X className="h-4 w-4" /></button>
          </div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          {NEWS.map((item) => (
            <article key={item.id} className="card-premium flex flex-col gap-5 md:flex-row">
              <div className="md:w-40">
                <div className="aspect-video rounded-[22px] bg-gradient-to-br from-violet-500/20 to-pink-500/10" />
              </div>
              <div className="flex-1">
                <div className="mb-3 flex flex-wrap items-center gap-4 text-xs text-slate-400">
                  <span className="inline-flex items-center gap-1"><Calendar className="h-4 w-4" /> {item.date}</span>
                  <span className="inline-flex items-center gap-1"><MapPin className="h-4 w-4" /> {item.location}</span>
                </div>
                <h2 className="font-headline text-2xl font-semibold text-white">{item.title}</h2>
                <p className="mt-4 text-sm leading-relaxed text-slate-300">{item.excerpt}</p>
                <div className="mt-6 flex items-center gap-3">
                  <span className="premium-chip">{item.category}</span>
                  <button onClick={() => handleShare(item)} className="btn-secondary"><Share2 className="h-4 w-4" /> Share</button>
                </div>
              </div>
            </article>
          ))}
        </div>

        <aside className="space-y-5">
          <div className="premium-panel p-5">
            <h2 className="font-headline text-2xl font-semibold text-white">Trending alerts</h2>
            <div className="mt-4 space-y-3 text-sm text-slate-300">
              {['She Teams deployed at CG Road', 'Women-only BRTS launched', 'Sabarmati Riverfront declared safe zone'].map((item) => (
                <div key={item} className="rounded-2xl border border-white/10 bg-white/5 p-4">{item}</div>
              ))}
            </div>
          </div>
          <div className="premium-panel p-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">Resources</p>
            <p className="mt-3 text-sm leading-relaxed text-slate-300">Curated updates for current affairs, local policy, and safety-related changes.</p>
          </div>
        </aside>
      </div>
    </div>
  );
}
