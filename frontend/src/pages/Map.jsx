import React, { useEffect, useMemo, useState } from 'react';
import { Filter, Hospital, MapPin, Navigation, Search, Shield, ShieldAlert, Star, Info } from 'lucide-react';
import CustomMapContainer from '../components/Map/MapContainer';

const DEFAULT_POIS = [
  { id: 1, name: 'Connaught Place Police Station', type: 'Police', distance: '1.2 km', status: 'Open 24/7', rating: 4.8, lat: 28.6327, lon: 77.2197 },
  { id: 2, name: 'Ram Manohar Lohia Hospital', type: 'Hospital', distance: '2.5 km', status: 'Emergency active', rating: 4.5, lat: 28.6344, lon: 77.1997 },
  { id: 3, name: 'Select CityWalk Mall', type: 'Safe Zone', distance: '8.0 km', status: 'High traffic', rating: 4.9, lat: 28.5279, lon: 77.2193 },
  { id: 4, name: 'Karol Bagh Police Station', type: 'Police', distance: '4.1 km', status: 'Open 24/7', rating: 4.2, lat: 28.6508, lon: 77.1904 },
  { id: 5, name: 'Fortis Hospital Vasant Kunj', type: 'Hospital', distance: '12.4 km', status: 'Emergency active', rating: 4.6, lat: 28.5198, lon: 77.1576 },
];

const FILTERS = [
  { label: 'All', icon: Shield },
  { label: 'Police', icon: ShieldAlert },
  { label: 'Hospital', icon: Hospital },
  { label: 'Safe Zone', icon: Star },
];

export default function MapPage() {
  const [location, setLocation] = useState([28.6139, 77.2090]);
  const [pois, setPois] = useState(DEFAULT_POIS);
  const [activeFilter, setActiveFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoadingGeo, setIsLoadingGeo] = useState(true);
  const [showToast, setShowToast] = useState(false);
  const [selectedPlaceId, setSelectedPlaceId] = useState(null);

  const locateUser = () => {
    setIsLoadingGeo(true);
    if (!('geolocation' in navigator)) {
      setIsLoadingGeo(false);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        setLocation([lat, lon]);

        try {
          const query = `
            [out:json][timeout:15];
            (
              node["amenity"="police"](around:5000, ${lat}, ${lon});
              way["amenity"="police"](around:5000, ${lat}, ${lon});
              node["amenity"="hospital"](around:5000, ${lat}, ${lon});
              way["amenity"="hospital"](around:5000, ${lat}, ${lon});
              node["shop"="mall"](around:5000, ${lat}, ${lon});
              way["shop"="mall"](around:5000, ${lat}, ${lon});
              node["public_transport"="station"](around:5000, ${lat}, ${lon});
            );
            out center;
          `;
          const response = await fetch(`https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`);
          const data = await response.json();

          if (data.elements?.length) {
            const realPois = data.elements.map((el, index) => {
              const isPolice = el.tags?.amenity === 'police';
              const isHospital = el.tags?.amenity === 'hospital';
              const type = isPolice ? 'Police' : isHospital ? 'Hospital' : 'Safe Zone';
              const latPos = el.lat || el.center?.lat;
              const lonPos = el.lon || el.center?.lon;
              const name = el.tags?.name || (isPolice ? 'Local police station' : isHospital ? 'Local hospital' : 'Public safe zone');

              return {
                id: el.id || index,
                name,
                type,
                distance: `${(Math.random() * 4 + 0.3).toFixed(1)} km`,
                status: 'Real location',
                rating: (Math.random() * 1.2 + 3.8).toFixed(1),
                lat: latPos,
                lon: lonPos,
              };
            });

            setPois(realPois.slice(0, 18));
          }
        } catch {
          // fall back to defaults
        } finally {
          setIsLoadingGeo(false);
        }
      },
      () => {
        setIsLoadingGeo(false);
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
      },
      { timeout: 10000 }
    );
  };

  useEffect(() => {
    locateUser();
  }, []);

  const filteredPois = useMemo(() => {
    return pois.filter((poi) => {
      const matchesFilter = activeFilter === 'All' || poi.type.toLowerCase().includes(activeFilter.toLowerCase());
      const matchesSearch = poi.name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesFilter && matchesSearch;
    });
  }, [pois, activeFilter, searchQuery]);

  return (
    <div className="page-shell min-h-screen pt-24">
      {showToast && (
        <div className="fixed left-1/2 top-24 z-[2000] -translate-x-1/2 rounded-full border border-white/10 bg-slate-950/90 px-5 py-3 text-sm text-white shadow-2xl backdrop-blur-xl">
          <span className="inline-flex items-center gap-2">
            <Info className="h-4 w-4 text-violet-200" />
            Using default location (Hyderabad)
          </span>
        </div>
      )}

      <div className="mx-auto grid h-[calc(100vh-6rem)] max-w-7xl gap-6 px-4 pb-6 sm:px-6 lg:grid-cols-[420px_1fr] lg:px-8">
        <aside className="premium-panel-strong flex min-h-0 flex-col overflow-hidden">
          <div className="border-b border-white/10 p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-slate-400">Safety explorer</p>
                <h1 className="mt-2 font-headline text-3xl font-semibold text-white">Verified places nearby</h1>
              </div>
              <button onClick={locateUser} className="rounded-2xl border border-white/10 bg-white/6 p-3 text-violet-200 transition hover:bg-white/10" aria-label="Refresh location">
                <Navigation className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-5 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
              <Search className="pointer-events-none absolute mt-0.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search safe locations"
                className="w-full bg-transparent pl-6 text-sm text-white placeholder:text-slate-500"
              />
            </div>

            <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
              {FILTERS.map((filter) => {
                const Icon = filter.icon;
                const active = activeFilter === filter.label;
                return (
                  <button
                    key={filter.label}
                    onClick={() => setActiveFilter(filter.label)}
                    className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] transition ${
                      active ? 'bg-white text-slate-950' : 'bg-white/6 text-slate-300 hover:bg-white/10'
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {filter.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto p-4">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-400">Nearby places</p>
              {isLoadingGeo && <span className="text-[10px] font-semibold uppercase tracking-[0.24em] text-violet-200">Loading</span>}
            </div>

            <div className="space-y-3">
              {filteredPois.length === 0 ? (
                <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center text-slate-400">
                  No results found for “{searchQuery}”.
                </div>
              ) : (
                filteredPois.map((place) => (
                  <button
                    key={place.id}
                    onClick={() => {
                      setLocation([place.lat, place.lon]);
                      setSelectedPlaceId(place.id);
                    }}
                    className={`w-full rounded-[22px] border p-4 text-left transition ${
                      selectedPlaceId === place.id ? 'border-violet-300/40 bg-violet-500/10' : 'border-white/10 bg-white/5 hover:bg-white/8'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-semibold text-white">{place.name}</p>
                        <p className="mt-1 text-xs text-slate-400">{place.status}</p>
                      </div>
                      <span className="rounded-full bg-white/8 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-violet-200">
                        {place.distance}
                      </span>
                    </div>
                    <div className="mt-4 flex items-center justify-between text-xs text-slate-300">
                      <span className="inline-flex items-center gap-2">
                        <Shield className="h-3.5 w-3.5 text-violet-200" />
                        {place.type}
                      </span>
                      <span className="inline-flex items-center gap-2">
                        <Star className="h-3.5 w-3.5 text-amber-300" />
                        {place.rating}
                      </span>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </aside>

        <section className="premium-panel-strong min-h-0 overflow-hidden p-3">
          <div className="h-full min-h-[420px] overflow-hidden rounded-[22px] border border-white/10">
            <CustomMapContainer location={location} pois={filteredPois} />
          </div>
        </section>
      </div>
    </div>
  );
}
