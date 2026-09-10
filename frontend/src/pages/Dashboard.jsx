import React, { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  ArrowUpRight,
  Bell,
  CheckCircle2,
  Clock,
  FileText,
  Leaf,
  MapPin,
  Shield,
  TrendingUp,
  Users,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import CustomMapContainer from '../components/Map/MapContainer';
import StatusCard from '../components/Dashboard/StatusCard';
import { getBestAvailablePosition } from '../services/locationService';
import { API_BASE_URL } from '../utils/constants';

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
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#687067]">{label}</p>
          <p className="mt-3 font-headline text-4xl font-semibold text-[#28302A] tabular-nums">{count}</p>
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
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') === 'complaints' ? 'complaints' : 'overview';
  const [isSafe, setIsSafe] = useState(true);
  const [mapLocation, setMapLocation] = useState([28.6139, 77.2090]);
  const [complaintCategory, setComplaintCategory] = useState('other');
  const [complaintMessage, setComplaintMessage] = useState('');
  const [complaintStatus, setComplaintStatus] = useState('');
  const [isSubmittingComplaint, setIsSubmittingComplaint] = useState(false);

  useEffect(() => {
    getBestAvailablePosition()
      .then((position) => {
        if (position) setMapLocation([position.latitude, position.longitude]);
      })
      .catch(() => void 0);
  }, []);

  const activities = [
    { title: 'Safe route completed', time: '2 hours ago', location: 'Banjara Hills, Hyderabad' },
    { title: 'Safety check-in', time: 'Yesterday', location: 'Begumpet' },
    { title: 'Guardian contact added', time: '2 days ago', location: 'System' },
  ];

  const submitAnonymousComplaint = async (event) => {
    event.preventDefault();
    setComplaintStatus('');
    setIsSubmittingComplaint(true);

    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${API_BASE_URL}/api/complaints`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ category: complaintCategory, message: complaintMessage })
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.message || 'Unable to submit complaint.');
      setComplaintMessage('');
      setComplaintStatus('Submitted anonymously to the ICCC review queue.');
    } catch (error) {
      setComplaintStatus(error.message || 'Unable to submit complaint.');
    } finally {
      setIsSubmittingComplaint(false);
    }
  };

  const selectTab = (tab) => {
    setSearchParams(tab === 'complaints' ? { tab: 'complaints' } : {});
  };

  return (
    <div className="page-shell mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#7A8E72]">Dashboard</p>
          <h1 className="mt-3 font-headline text-4xl font-semibold text-[#28302A] md:text-5xl">
            Welcome back, {user?.name || 'Atharva'}
          </h1>
          <p className="mt-3 max-w-2xl text-[#687067]">
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

      <div className="mb-8 flex flex-wrap gap-2 rounded-2xl border border-[#DCDDD5] bg-white p-2 shadow-sm" role="tablist" aria-label="Dashboard sections">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'overview'}
          onClick={() => selectTab('overview')}
          className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors ${activeTab === 'overview' ? 'bg-[#7A8E72] text-white' : 'text-[#687067] hover:bg-[#FAF8F5] hover:text-[#28302A]'}`}
        >
          Overview
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'complaints'}
          onClick={() => selectTab('complaints')}
          className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors ${activeTab === 'complaints' ? 'bg-[#C62828] text-white' : 'text-[#687067] hover:bg-[#FAF8F5] hover:text-[#28302A]'}`}
        >
          Anonymous complaints
        </button>
      </div>

      {activeTab === 'overview' && (
        <>
          <div className="mb-6">
            <StatusCard isSafe={isSafe} />
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            <AnimatedCounter label="Safe days" target={42} icon={Shield} tone="bg-[#A8B8A0]/20 text-[#7A8E72]" />
            <AnimatedCounter label="Alerts triggered" target={0} icon={Bell} tone="bg-[#C62828]/15 text-[#C62828]" />
            <AnimatedCounter label="Verified guardians" target={3} icon={Users} tone="bg-[#E8C4B8]/30 text-[#28302A]" />
          </div>
        </>
      )}

      {activeTab === 'complaints' && <section className="rounded-[24px] border border-[#DCDDD5] bg-white p-6 shadow-sm md:p-8">
        <div className="grid gap-6 lg:grid-cols-[1fr_1.25fr] lg:items-start">
          <div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#C62828]/10 text-[#C62828]">
              <FileText className="h-6 w-6" />
            </div>
            <p className="mt-5 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#C62828]">Anonymous reporting</p>
            <h2 className="mt-2 font-headline text-2xl font-semibold text-[#28302A]">Report a safety concern</h2>
            <p className="mt-3 max-w-md text-sm leading-relaxed text-[#687067]">
              Your complaint is sent to the ICCC review queue without your name, phone number, email, or account ID in the complaint record. Do not include personal details in your message.
            </p>
          </div>

          <form onSubmit={submitAnonymousComplaint} className="space-y-4">
            <label className="block">
              <span className="premium-label">Concern type</span>
              <select className="premium-input" value={complaintCategory} onChange={(event) => setComplaintCategory(event.target.value)}>
                <option value="harassment">Harassment</option>
                <option value="unsafe_area">Unsafe area</option>
                <option value="stalking">Stalking</option>
                <option value="service_failure">Safety service issue</option>
                <option value="other">Other</option>
              </select>
            </label>
            <label className="block">
              <span className="premium-label">Complaint</span>
              <textarea
                className="premium-input min-h-32 resize-y"
                placeholder="Describe the safety concern without adding your personal contact details."
                value={complaintMessage}
                onChange={(event) => setComplaintMessage(event.target.value)}
                minLength={10}
                maxLength={2000}
                required
              />
            </label>
            {complaintStatus && <p className="text-sm text-[#687067]" role="status">{complaintStatus}</p>}
            <button className="btn-primary" type="submit" disabled={isSubmittingComplaint}>
              {isSubmittingComplaint ? 'Submitting…' : 'Submit anonymous complaint'}
            </button>
          </form>
        </div>
      </section>}

      {activeTab === 'overview' && <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <section className="lg:col-span-2">
          <div className="card-premium overflow-hidden p-0">
            <div className="flex items-center justify-between border-b border-[#DCDDD5] px-6 py-5">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#687067]">Live safety status</p>
                <h2 className="mt-1 font-headline text-2xl font-semibold text-[#28302A]">Current location preview</h2>
              </div>
              <Link to="/map" className="inline-flex items-center gap-2 text-sm font-semibold text-[#7A8E72]">
                Open map <ArrowUpRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="h-[380px]">
              <CustomMapContainer location={mapLocation} pois={[]} />
            </div>
          </div>

          <div className="mt-6 grid gap-5 md:grid-cols-2">
            <div className="card-premium bg-[#FAF0EA] border border-[#DCDDD5]">
              <h3 className="font-headline text-xl font-semibold text-[#28302A]">Need help fast?</h3>
              <p className="mt-3 text-sm leading-relaxed text-[#687067]">
                Jump to the SOS workflow or contact support instantly.
              </p>
              <Link to="/sos" className="btn-primary mt-5 w-fit">
                Open SOS
              </Link>
            </div>

            <div className="card-premium bg-[#FAF8F5] border border-[#DCDDD5]">
              <h3 className="font-headline text-xl font-semibold text-[#28302A]">Quick tip</h3>
              <p className="mt-3 text-sm leading-relaxed text-[#687067]">
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
            <Clock className="h-5 w-5 text-[#7A8E72]" />
            <h2 className="font-headline text-2xl font-semibold text-[#28302A]">Recent activity</h2>
          </div>
          <div className="space-y-5">
            {activities.map((activity) => (
              <div key={activity.title} className="rounded-2xl border border-[#DCDDD5] bg-[#FAF8F5] p-4">
                <p className="text-sm font-semibold text-[#28302A]">{activity.title}</p>
                <p className="mt-1 text-xs text-[#687067]">{activity.time}</p>
                <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-[#FAF0EA] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#7A8E72]">
                  <MapPin className="h-3 w-3" />
                  {activity.location}
                </div>
              </div>
            ))}
          </div>
          <button className="btn-secondary mt-6 w-full justify-center">View all history</button>
        </section>
      </div>}
    </div>
  );
}
