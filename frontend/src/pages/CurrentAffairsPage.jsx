import React, { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Calendar, ChevronLeft, ChevronRight, ExternalLink, Info, Loader2, MapPin, RefreshCw, Share2, ShieldAlert } from 'lucide-react';

const RISK_STYLES = {
  high: { badge: 'border-[#C62828]/30 bg-[#C62828]/10 text-[#B71C1C]', icon: AlertTriangle, accent: 'border-l-[#C62828]' },
  medium: { badge: 'border-[#C18A32]/30 bg-[#C18A32]/10 text-[#956616]', icon: AlertTriangle, accent: 'border-l-[#C18A32]' },
  low: { badge: 'border-[#4F7D55]/30 bg-[#4F7D55]/10 text-[#37613D]', icon: ShieldAlert, accent: 'border-l-[#4F7D55]' }
};

function formatDate(value) {
  if (!value) return 'Recent';
  const normalized = value.replace(/^(\d{4})(\d{2})(\d{2})T?(\d{2})?(\d{2})?(\d{2})?Z?$/, '$1-$2-$3T$4:$5:$6Z');
  const date = new Date(normalized);
  return Number.isNaN(date.getTime()) ? 'Recent' : new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium' }).format(date);
}

export default function CurrentAffairsPage() {
  const [articles, setArticles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [tickerIndex, setTickerIndex] = useState(0);

  const loadNews = async (refresh = false) => {
    refresh ? setIsRefreshing(true) : setIsLoading(true);
    setError('');
    try {
      const response = await fetch(`/api/news${refresh ? '?refresh=true' : ''}`);
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.message || 'Unable to load live news');
      setArticles(data.articles || []);
      setTickerIndex(0);
    } catch (requestError) {
      setArticles([]);
      setError(requestError.message);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => { loadNews(); }, []);

  const tickerItems = useMemo(() => articles.slice(0, 5), [articles]);

  useEffect(() => {
    if (tickerItems.length < 2) return undefined;
    const interval = window.setInterval(() => setTickerIndex((current) => (current + 1) % tickerItems.length), 5000);
    return () => window.clearInterval(interval);
  }, [tickerItems.length]);

  const handleShare = async (article) => {
    try {
      if (navigator.share) await navigator.share({ title: article.title, text: article.title, url: article.url });
      else await navigator.clipboard.writeText(article.url);
    } catch {
      // The user dismissed the share UI or clipboard access was unavailable.
    }
  };

  return (
    <div className="page-shell mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
      <div className="mb-8 overflow-hidden rounded-lg border border-[#DCDDD5] bg-white shadow-sm">
        <div className="flex items-center">
          <div className="flex shrink-0 items-center gap-2 bg-[#C62828] px-5 py-4 text-xs font-semibold uppercase tracking-[0.24em] text-white">
            <span className="relative flex h-2.5 w-2.5"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75" /><span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-white" /></span>
            Live
          </div>
          <div className="min-w-0 flex-1 px-5 py-4"><p className="truncate text-sm font-medium text-[#28302A]">{tickerItems[tickerIndex]?.title || 'Loading live women’s safety news...'}</p></div>
          <div className="flex items-center gap-1 px-3">
            <button aria-label="Previous headline" onClick={() => setTickerIndex((value) => (value - 1 + tickerItems.length) % tickerItems.length)} disabled={!tickerItems.length} className="rounded-md p-2 text-[#687067] hover:bg-[#FAF0EA] disabled:opacity-40"><ChevronLeft className="h-4 w-4" /></button>
            <button aria-label="Next headline" onClick={() => setTickerIndex((value) => (value + 1) % tickerItems.length)} disabled={!tickerItems.length} className="rounded-md p-2 text-[#687067] hover:bg-[#FAF0EA] disabled:opacity-40"><ChevronRight className="h-4 w-4" /></button>
          </div>
        </div>
      </div>

      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div><p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#7A8E72]">Live news</p><h1 className="mt-3 font-headline text-4xl font-semibold text-[#28302A] md:text-5xl">Women’s safety updates</h1></div>
        <button onClick={() => loadNews(true)} disabled={isLoading || isRefreshing} className="btn-secondary w-fit disabled:opacity-50"><RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} /> Refresh</button>
      </div>

      <div className="mb-6 flex items-center gap-2 rounded-lg border border-[#DCDDD5] bg-white px-4 py-3 text-xs text-[#687067]"><Info className="h-4 w-4 shrink-0 text-[#7A8E72]" />Risk labels classify the reported incident in each article. They are not an official safety rating for a whole area.</div>

      {isLoading && <div className="flex min-h-64 items-center justify-center gap-3 text-[#687067]"><Loader2 className="h-5 w-5 animate-spin" /> Loading live news...</div>}

      {!isLoading && error && <div className="rounded-lg border border-[#C62828]/30 bg-[#C62828]/10 p-6 text-center"><p className="font-semibold text-[#B71C1C]">Live news is unavailable</p><p className="mt-2 text-sm text-[#687067]">{error}</p><button onClick={() => loadNews(true)} className="btn-secondary mt-4">Try again</button></div>}

      {!isLoading && !error && articles.length === 0 && <div className="rounded-lg border border-[#DCDDD5] bg-white p-6 text-center text-sm text-[#687067]">No matching live articles were found. Please refresh shortly.</div>}

      {!isLoading && !error && articles.length > 0 && (
        <div className="grid gap-5 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-2">
            {articles.map((article) => {
              const risk = RISK_STYLES[article.level] || RISK_STYLES.low;
              const RiskIcon = risk.icon;
              return (
                <article key={article.id} className={`flex flex-col gap-5 border-l-4 ${risk.accent} bg-white p-5 shadow-sm md:flex-row`}>
                  {article.imageUrl && <img src={article.imageUrl} alt="" className="h-32 w-full shrink-0 object-cover md:w-44" onError={(event) => { event.currentTarget.style.display = 'none'; }} />}
                  <div className="min-w-0 flex-1">
                    <div className="mb-3 flex flex-wrap items-center gap-3 text-xs text-[#687067]">
                      <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 font-semibold ${risk.badge}`}><RiskIcon className="h-3.5 w-3.5" /> {article.label}</span>
                      <span className="inline-flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> {formatDate(article.publishedAt)}</span>
                      <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {article.location || 'Location not reported'}</span>
                    </div>
                    <h2 className="font-headline text-xl font-semibold leading-snug text-[#28302A]">{article.title}</h2>
                    <p className="mt-2 text-sm text-[#687067]">Source: {article.source}</p>
                    <div className="mt-5 flex flex-wrap items-center gap-3"><a href={article.url} target="_blank" rel="noopener noreferrer" className="btn-primary"><ExternalLink className="h-4 w-4" /> Read full article</a><button onClick={() => handleShare(article)} className="btn-secondary" aria-label={`Share ${article.title}`}><Share2 className="h-4 w-4" /> Share</button></div>
                  </div>
                </article>
              );
            })}
          </div>
          <aside className="h-fit border border-[#DCDDD5] bg-white p-5 shadow-sm"><h2 className="font-headline text-xl font-semibold text-[#28302A]">Risk guide</h2><div className="mt-4 space-y-3 text-sm"><p className="flex items-center gap-2 text-[#B71C1C]"><span className="h-3 w-3 rounded-full bg-[#C62828]" /> High: reported violent or severe incident</p><p className="flex items-center gap-2 text-[#956616]"><span className="h-3 w-3 rounded-full bg-[#C18A32]" /> Medium: reported concern or investigation</p><p className="flex items-center gap-2 text-[#37613D]"><span className="h-3 w-3 rounded-full bg-[#4F7D55]" /> Green: safety awareness or support update</p></div></aside>
        </div>
      )}
    </div>
  );
}
