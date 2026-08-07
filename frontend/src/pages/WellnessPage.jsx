import React, { useMemo, useState } from 'react';
import { Bookmark, CheckCircle2, Clock, Search, Share2 } from 'lucide-react';

export default function WellnessPage() {
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [savedGuides, setSavedGuides] = useState([]);
  const [toast, setToast] = useState(null);

  const categories = ['All', 'Mental Health', 'Physical Safety', 'Travel Tips', 'Self Defense'];
  const guides = [
    { id: 1, title: 'Active Awareness: Daily Safety Habits', category: 'Physical Safety', desc: 'Simple routines you can fold into your day.', time: '5 min read' },
    { id: 2, title: 'Healing Through Community', category: 'Mental Health', desc: 'The role of safe spaces and support networks.', time: '8 min read' },
    { id: 3, title: 'Safe Solo Travel in India', category: 'Travel Tips', desc: 'Public transport, accommodation, and late-night travel.', time: '12 min read' },
    { id: 4, title: 'Basics of De-escalation', category: 'Self Defense', desc: 'Verbal techniques and body language to defuse tension.', time: '6 min read' },
    { id: 5, title: 'The Invisible Shield Technique', category: 'Self Defense', desc: 'Project confidence and deter unwanted attention.', time: '7 min read' },
    { id: 6, title: 'Managing Panic in Crisis', category: 'Mental Health', desc: 'Breathing and grounding techniques for stressful moments.', time: '4 min read' },
  ];

  const filteredGuides = useMemo(() => {
    return guides.filter((guide) => {
      const matchesCategory = activeCategory === 'All' || guide.category === activeCategory;
      const q = searchQuery.toLowerCase();
      const matchesSearch = guide.title.toLowerCase().includes(q) || guide.desc.toLowerCase().includes(q);
      return matchesCategory && matchesSearch;
    });
  }, [activeCategory, searchQuery]);

  const toggleBookmark = (id) => {
    setSavedGuides((current) => current.includes(id) ? current.filter((x) => x !== id) : [...current, id]);
  };

  const handleShare = async (guide) => {
    const text = `${guide.title} — ${guide.desc}`;
    if (navigator.share) {
      try { await navigator.share({ title: guide.title, text, url: window.location.href }); } catch {}
    } else {
      navigator.clipboard.writeText(window.location.href);
      setToast('Link copied');
      setTimeout(() => setToast(null), 2000);
    }
  };

  return (
    <div className="page-shell mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
      {toast && <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full border border-white/10 bg-slate-950/90 px-5 py-3 text-sm text-white shadow-2xl backdrop-blur-xl">{toast}</div>}

      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-400">Wellness</p>
          <h1 className="mt-3 font-headline text-4xl font-semibold text-white md:text-5xl">Guides for safety and composure</h1>
          <p className="mt-3 text-slate-300">Premium presentation, same educational content.</p>
        </div>
        <div className="relative w-full max-w-md">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input className="premium-input pl-11" placeholder="Search guides" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
        </div>
      </div>

      <div className="mb-8 flex flex-wrap gap-2">
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => setActiveCategory(category)}
            className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] transition ${activeCategory === category ? 'bg-white text-slate-950' : 'bg-white/6 text-slate-300 hover:bg-white/10'}`}
          >
            {category}
          </button>
        ))}
      </div>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {filteredGuides.map((guide) => (
          <article key={guide.id} className="card-premium flex flex-col">
            <div className="mb-4 flex items-center justify-between text-xs text-slate-400">
              <span className="premium-chip">{guide.category}</span>
              <span className="inline-flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {guide.time}</span>
            </div>
            <h2 className="font-headline text-2xl font-semibold text-white">{guide.title}</h2>
            <p className="mt-4 flex-1 text-sm leading-relaxed text-slate-300">{guide.desc}</p>
            <div className="mt-6 flex items-center gap-3">
              <button onClick={() => toggleBookmark(guide.id)} className="btn-secondary">
                <Bookmark className="h-4 w-4" />
                {savedGuides.includes(guide.id) ? 'Saved' : 'Save'}
              </button>
              <button onClick={() => handleShare(guide)} className="btn-secondary">
                <Share2 className="h-4 w-4" />
                Share
              </button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
