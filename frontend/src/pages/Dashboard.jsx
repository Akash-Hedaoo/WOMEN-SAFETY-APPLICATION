import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowUpRight,
  Bell,
  CheckCircle2,
  Clock,
  Leaf,
  MapPin,
  Shield,
  TrendingUp,
  Users,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import CustomMapContainer from '../components/Map/MapContainer';
import StatusCard from '../components/Dashboard/StatusCard';

const AnimatedCounter = ({ label, target, duration = 1.2, icon: Icon, tone }) => {
  const [count, setCount] = useState(0);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    let frame;
    const start = performance.now();

    const tick = (time) => {
      const progress = Math.min((time - start) / (duration * 1000), 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.ceil(target * eased));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, duration]);

  return (
    <div className="card-premium">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">{label}</p>
          <p className="mt-3 font-headline text-4xl font-semibold text-white tabular-nums">{count}</p>
        </div>
        <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${tone}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
};

export default function Dashboard() {
  const { user } = useAuth();
  const [isSafe, setIsSafe] = useState(true);
  const [mapLocation, setMapLocation] = useState([28.6139, 77.2090]);

  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => setMapLocation([position.coords.latitude, position.coords.longitude]),
        () => void 0
      );
    }
  }, []);

  const activities = [
    { title: 'Safe route completed', time: '2 hours ago', location: 'Banjara Hills, Hyderabad' },
    { title: 'Safety check-in', time: 'Yesterday', location: 'Begumpet' },
    { title: 'Guardian contact added', time: '2 days ago', location: 'System' },
  ];

  return (
    <div className="page-shell mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-violet-200">Dashboard</p>
          <h1 className="mt-3 font-headline text-4xl font-semibold text-white md:text-5xl">
            Welcome back, {user?.name || 'Atharva'}
          </h1>
          <p className="mt-3 max-w-2xl text-slate-300">
            Your safety workspace is active, monitored, and ready. This redesign keeps the same data while lifting the presentation.
          </p>
        </div>

        <button
          onClick={() => setIsSafe((v) => !v)}
          className="premium-chip w-fit self-start"
        >
          Toggle demo mode
        </button>
      </div>

      <div className="mb-6">
        <StatusCard isSafe={isSafe} />
      </div>

      <div className="grid gap-5 md:grid-cols-3">
        <AnimatedCounter label="Safe days" target={42} icon={Shield} tone="bg-violet-500/20 text-violet-200" />
        <AnimatedCounter label="Alerts triggered" target={0} icon={Bell} tone="bg-rose-500/20 text-rose-100" />
        <AnimatedCounter label="Verified guardians" target={3} icon={Users} tone="bg-cyan-500/20 text-cyan-100" />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <section className="lg:col-span-2">
          <div className="card-premium overflow-hidden p-0">
            <div className="flex items-center justify-between border-b border-white/10 px-6 py-5">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">Live safety status</p>
                <h2 className="mt-1 font-headline text-2xl font-semibold text-white">Current location preview</h2>
              </div>
              <Link to="/map" className="inline-flex items-center gap-2 text-sm font-semibold text-violet-200">
                Open map <ArrowUpRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="h-[380px]">
              <CustomMapContainer location={mapLocation} pois={[]} />
            </div>
          </div>

          <div className="mt-6 grid gap-5 md:grid-cols-2">
            <div className="card-premium bg-gradient-to-br from-violet-500/20 to-purple-500/10">
              <h3 className="font-headline text-xl font-semibold text-white">Need help fast?</h3>
              <p className="mt-3 text-sm leading-relaxed text-slate-300">
                Jump to the SOS workflow or contact support instantly.
              </p>
              <Link to="/sos" className="btn-primary mt-5 w-fit">
                Open SOS
              </Link>
            </div>

            <div className="card-premium bg-gradient-to-br from-pink-500/15 to-violet-500/10">
              <h3 className="font-headline text-xl font-semibold text-white">Quick tip</h3>
              <p className="mt-3 text-sm leading-relaxed text-slate-300">
                Keep location permissions on for more accurate route confidence and alert timing.
              </p>
              <Link to="/wellness" className="btn-secondary mt-5 w-fit">
                View guides
              </Link>
            </div>
          </div>
        </section>

        <section className="card-premium flex h-full flex-col">
          <div className="mb-6 flex items-center gap-3">
            <Clock className="h-5 w-5 text-violet-200" />
            <h2 className="font-headline text-2xl font-semibold text-white">Recent activity</h2>
          </div>
          <div className="space-y-5">
            {activities.map((activity) => (
              <div key={activity.title} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-sm font-semibold text-white">{activity.title}</p>
                <p className="mt-1 text-xs text-slate-400">{activity.time}</p>
                <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-white/6 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-violet-200">
                  <MapPin className="h-3 w-3" />
                  {activity.location}
                </div>
              </div>
            ))}
          </div>
          <button className="btn-secondary mt-6 w-full justify-center">View all history</button>
        </section>
      </div>
    </div>
  );
}
