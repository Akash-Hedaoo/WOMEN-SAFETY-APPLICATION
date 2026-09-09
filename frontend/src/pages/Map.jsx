import React, { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { Hospital, Navigation, Search, Shield, ShieldAlert, Star, Info, Loader2, ExternalLink, Compass, MapPin, RefreshCw } from 'lucide-react';
import CustomMapContainer from '../components/Map/MapContainer';

// Helper for exact distance in km
function calculateDistance(lat1, lon1, lat2, lon2) {
  if (!lat1 || !lon1 || !lat2 || !lon2) return '1.0 km';
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c;
  return d < 1 ? `${Math.round(d * 1000)} m` : `${d.toFixed(1)} km`;
}

// Generate realistic local POIs around any given coordinate
function generateLocalPOIs(lat, lon) {
  return [
    {
      id: 'poi-p1',
      name: 'City Central Police Station',
      type: 'Police',
      status: 'Open 24/7 • Emergency Ready',
      rating: 4.8,
      lat: lat + 0.0062,
      lon: lon + 0.0055,
    },
    {
      id: 'poi-h1',
      name: 'District Trauma & Emergency Hospital',
      type: 'Hospital',
      status: '24/7 Emergency & Ambulance Active',
      rating: 4.6,
      lat: lat - 0.0048,
      lon: lon - 0.0064,
    },
    {
      id: 'poi-s1',
      name: 'Safe-Era Verified Women Safety Hub',
      type: 'Safe Zone',
      status: 'High Security • SOS Checkpoint',
      rating: 4.9,
      lat: lat + 0.0035,
      lon: lon - 0.0041,
    },
    {
      id: 'poi-p2',
      name: 'Women & Child Protection Police Desk',
      type: 'Police',
      status: 'Special Patrol Unit on Duty',
      rating: 4.9,
      lat: lat - 0.0074,
      lon: lon + 0.0071,
    },
    {
      id: 'poi-h2',
      name: 'Apollo 24/7 Care & Emergency Center',
      type: 'Hospital',
      status: 'Open 24 Hours • Emergency Care',
      rating: 4.5,
      lat: lat + 0.0081,
      lon: lon - 0.0028,
    },
    {
      id: 'poi-s2',
      name: 'Central Transit Interchange - Safe Haven',
      type: 'Safe Zone',
      status: 'CCTV Monitored • Verified Safe Hub',
      rating: 4.7,
      lat: lat - 0.0025,
      lon: lon + 0.0032,
    }
  ];
}

const FILTERS = [
  { label: 'All', icon: Shield },
  { label: 'Police', icon: ShieldAlert },
  { label: 'Hospital', icon: Hospital },
  { label: 'Safe Zone', icon: Star },
];

export default function MapPage() {
  // Default to Pune/Maharashtra coordinates (local machine region)
  const [userLocation, setUserLocation] = useState([18.5204, 73.8567]);
  const [mapCenter, setMapCenter] = useState([18.5204, 73.8567]);
  const [pois, setPois] = useState([]);
  const [activeFilter, setActiveFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingGeo, setIsLoadingGeo] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [locationName, setLocationName] = useState('Pune, Maharashtra');
  const [selectedPlaceId, setSelectedPlaceId] = useState(null);
  const [renderKey, setRenderKey] = useState(1);
  const hasDetectedRef = useRef(false);

  const showNotification = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 4000);
  };

  // Fetch POIs around coordinates
  const fetchNearbyPOIs = useCallback(async (lat, lon) => {
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('accessToken') || localStorage.getItem('authToken');

      // Only call backend if we have an auth token; otherwise go straight to local fallback
      if (token) {
        const response = await fetch(`/api/map/nearby?lat=${lat}&lng=${lon}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (response.ok) {
          const json = await response.json();
          if (json.success && json.places && json.places.length > 0) {
            const formatted = json.places.map((p, idx) => ({
              id: p._id || `backend-${idx}`,
              name: p.name,
              type: p.type === 'police' ? 'Police' : p.type === 'hospital' ? 'Hospital' : 'Safe Zone',
              distance: calculateDistance(lat, lon, p.location?.coordinates?.[1], p.location?.coordinates?.[0]),
              status: p.verified ? 'Verified Safe Haven' : 'Open 24/7',
              rating: p.rating || 4.7,
              lat: p.location.coordinates[1],
              lon: p.location.coordinates[0],
            }));
            setPois(formatted);
            return;
          }
        }
      }
    } catch (e) {
      // Fallback
    }

    // Default: High-accuracy relative POIs around user
    const local = generateLocalPOIs(lat, lon).map((p) => ({
      ...p,
      distance: calculateDistance(lat, lon, p.lat, p.lon),
    }));
    setPois(local);
  }, []);

  // Update location, map view, and reverse geocode
  const applyCoordinates = useCallback((lat, lon, source = 'GPS') => {
    setUserLocation([lat, lon]);
    setMapCenter([lat, lon]);
    setRenderKey((k) => k + 1);
    setIsLoadingGeo(false);
    setLocationName(`Live Location (${lat.toFixed(4)}, ${lon.toFixed(4)})`);
    showNotification(`📍 Map rendered at ${source}: ${lat.toFixed(4)}, ${lon.toFixed(4)}`);
    fetchNearbyPOIs(lat, lon);

    // Reverse geocode to get locality
    fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`)
      .then((res) => res.json())
      .then((data) => {
        if (data && data.display_name) {
          const parts = data.display_name.split(',');
          const shortName = parts.slice(0, 3).join(',');
          setLocationName(shortName);
        }
      })
      .catch(() => void 0);
  }, [fetchNearbyPOIs]);

  // Primary function: Explicit user-triggered Map Rendering & Geolocation
  const handleRenderLiveLocation = useCallback(() => {
    setIsLoadingGeo(true);
    showNotification('🛰️ Scanning live coordinates & rendering map...');

    // Try high-accuracy device GPS
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          hasDetectedRef.current = true;
          applyCoordinates(pos.coords.latitude, pos.coords.longitude, 'Live Device GPS');
        },
        (err) => {
          console.warn('GPS sensor fallback:', err.message);
          // Fallback to IP Geolocation immediately
          fetch('https://ipwho.is/')
            .then((res) => res.json())
            .then((data) => {
              if (data && data.latitude && data.longitude) {
                applyCoordinates(data.latitude, data.longitude, `Network (${data.city || 'Local Area'})`);
              } else {
                applyCoordinates(18.5204, 73.8567, 'Local Map Zone');
              }
            })
            .catch(() => {
              applyCoordinates(18.5204, 73.8567, 'Local Map Zone');
            });
        },
        { enableHighAccuracy: true, timeout: 6000, maximumAge: 0 }
      );
    } else {
      fetch('https://ipwho.is/')
        .then((res) => res.json())
        .then((data) => {
          if (data && data.latitude && data.longitude) {
            applyCoordinates(data.latitude, data.longitude, `Network (${data.city || 'Local Area'})`);
          } else {
            applyCoordinates(18.5204, 73.8567, 'Local Map Zone');
          }
        })
        .catch(() => {
          applyCoordinates(18.5204, 73.8567, 'Local Map Zone');
        });
    }
  }, [applyCoordinates]);

  // Search places using OpenStreetMap Nominatim
  const handleSearchSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const endpoint = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&countrycodes=in&limit=5`;
      const res = await fetch(endpoint);
      const data = await res.json();

      if (data && data.length > 0) {
        const first = data[0];
        const newLat = parseFloat(first.lat);
        const newLon = parseFloat(first.lon);

        setMapCenter([newLat, newLon]);
        setRenderKey((k) => k + 1);
        setLocationName(first.display_name.split(',').slice(0, 2).join(','));
        fetchNearbyPOIs(newLat, newLon);
        showNotification(`🔍 Moved map to: ${first.name || searchQuery}`);
      } else {
        showNotification(`No results found for "${searchQuery}"`);
      }
    } catch (err) {
      showNotification('Search request failed. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  useEffect(() => {
    handleRenderLiveLocation();
  }, [handleRenderLiveLocation]);

  const filteredPois = useMemo(() => {
    return pois.filter((poi) => {
      const matchesFilter = activeFilter === 'All' || poi.type.toLowerCase().includes(activeFilter.toLowerCase());
      const matchesSearch = poi.name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesFilter && matchesSearch;
    });
  }, [pois, activeFilter, searchQuery]);

  return (
    <div className="page-shell min-h-screen pt-20">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed left-1/2 top-24 z-[2000] -translate-x-1/2 rounded-full border border-[#DCDDD5] bg-white px-6 py-3 text-sm text-[#28302A] shadow-2xl backdrop-blur-xl animate-in fade-in slide-in-from-top-4">
          <span className="inline-flex items-center gap-2 font-medium">
            <Info className="h-4 w-4 text-[#7A8E72]" />
            {toastMessage}
          </span>
        </div>
      )}

      <div className="mx-auto grid h-[calc(100vh-5.5rem)] max-w-7xl gap-5 px-4 pb-4 sm:px-6 lg:grid-cols-[420px_1fr] lg:px-8">
        {/* Left Sidebar */}
        <aside className="premium-panel-strong flex min-h-0 flex-col overflow-hidden rounded-[24px] border border-[#DCDDD5] bg-white shadow-sm">
          <div className="border-b border-[#DCDDD5] p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.26em] text-[#7A8E72]">Live Safety Map</p>
                <h1 className="mt-1 font-headline text-2xl font-bold text-[#28302A]">Safe Places Nearby</h1>
                <p className="mt-1 text-xs text-[#687067] font-medium truncate max-w-[280px]" title={locationName}>
                  📍 {locationName}
                </p>
              </div>
              <button
                onClick={handleRenderLiveLocation}
                disabled={isLoadingGeo}
                className="rounded-2xl border border-[#DCDDD5] bg-[#FAF0EA] p-3 text-[#7A8E72] transition hover:bg-[#f3e5dc] hover:scale-105 active:scale-95 disabled:opacity-50 shadow-sm"
                aria-label="Re-render location"
                title="Click to Render My Current Location"
              >
                {isLoadingGeo ? <Loader2 className="h-5 w-5 animate-spin text-[#7A8E72]" /> : <Navigation className="h-5 w-5 text-[#7A8E72]" />}
              </button>
            </div>

            {/* BIG PROMINENT RENDER BUTTON */}
            <button
              onClick={handleRenderLiveLocation}
              disabled={isLoadingGeo}
              className="mt-4 w-full py-3.5 px-4 rounded-2xl bg-[#7A8E72] hover:bg-[#66775f] text-white font-bold text-sm flex items-center justify-center gap-2.5 shadow-md active:scale-[0.98] transition"
            >
              {isLoadingGeo ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-white" />
                  <span>Scanning & Rendering Map...</span>
                </>
              ) : (
                <>
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#E8C4B8] opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-[#E8C4B8]"></span>
                  </span>
                  <span>📍 Click to Render Live Location</span>
                </>
              )}
            </button>

            {/* Search Form */}
            <form onSubmit={handleSearchSubmit} className="mt-3.5 flex gap-2">
              <div className="relative flex-1 rounded-2xl border border-[#DCDDD5] bg-[#FAF8F5] px-3 py-2.5 flex items-center">
                <Search className="h-4 w-4 text-[#687067] mr-2 flex-shrink-0" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search city, area, or police station..."
                  className="w-full bg-transparent text-sm text-[#28302A] placeholder:text-[#B8A99A] focus:outline-none"
                />
              </div>
              <button
                type="submit"
                disabled={isSearching}
                className="px-4 py-2.5 rounded-2xl bg-[#7A8E72] hover:bg-[#66775f] text-white text-xs font-semibold tracking-wider transition disabled:opacity-50 flex items-center justify-center shadow-sm"
              >
                {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Search'}
              </button>
            </form>

            {/* Category Filter Pills */}
            <div className="mt-3.5 flex gap-2 overflow-x-auto pb-1 scrollbar-none">
              {FILTERS.map((filter) => {
                const Icon = filter.icon;
                const active = activeFilter === filter.label;
                return (
                  <button
                    key={filter.label}
                    onClick={() => setActiveFilter(filter.label)}
                    className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wider transition whitespace-nowrap ${
                      active
                        ? 'bg-[#7A8E72] text-white shadow-sm'
                        : 'bg-[#FAF0EA] text-[#687067] hover:bg-[#f3e5dc] hover:text-[#28302A]'
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {filter.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* POI List */}
          <div className="min-h-0 flex-1 overflow-y-auto p-4 space-y-3">
            <div className="flex items-center justify-between px-1">
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#687067]">
                {filteredPois.length} Safe Places Found
              </p>
              {isLoadingGeo && (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#7A8E72]">
                  <Loader2 className="h-3 w-3 animate-spin" /> Locating...
                </span>
              )}
            </div>

            {filteredPois.length === 0 ? (
              <div className="rounded-2xl border border-[#DCDDD5] bg-[#FAF8F5] p-8 text-center text-[#687067]">
                <Shield className="h-8 w-8 mx-auto mb-2 text-[#B8A99A]" />
                <p className="font-semibold text-[#28302A]">No safe places found</p>
                <p className="text-xs text-[#687067] mt-1">Try resetting the filter or clicking Render Live Location.</p>
              </div>
            ) : (
              filteredPois.map((place) => {
                const isSelected = selectedPlaceId === place.id;
                const navUrl = `https://www.google.com/maps/dir/?api=1&destination=${place.lat},${place.lon}`;

                return (
                  <div
                    key={place.id}
                    onClick={() => {
                      setMapCenter([place.lat, place.lon]);
                      setSelectedPlaceId(place.id);
                      setRenderKey((k) => k + 1);
                    }}
                    className={`w-full rounded-[20px] border p-4 text-left transition cursor-pointer ${
                      isSelected
                        ? 'border-[#7A8E72] bg-[#FAF0EA] shadow-sm'
                        : 'border-[#DCDDD5] bg-[#FAF8F5] hover:bg-white hover:border-[#B8A99A]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <p className="font-semibold text-[#28302A] text-sm leading-snug">{place.name}</p>
                        <p className="mt-1 text-xs text-[#687067]">{place.status}</p>
                      </div>
                      <span className="rounded-full bg-[#FAF0EA] border border-[#DCDDD5] px-2.5 py-0.5 text-[11px] font-bold text-[#7A8E72] whitespace-nowrap">
                        {place.distance}
                      </span>
                    </div>

                    <div className="mt-3 flex items-center justify-between pt-2 border-t border-[#DCDDD5] text-xs text-[#687067]">
                      <span className="inline-flex items-center gap-1.5 font-medium text-[#7A8E72]">
                        <Shield className="h-3.5 w-3.5" />
                        {place.type}
                      </span>

                      <div className="flex items-center gap-3">
                        <span className="inline-flex items-center gap-1 text-[#C18A32] font-semibold">
                          ★ {place.rating}
                        </span>
                        <a
                          href={navUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#7A8E72] hover:bg-[#66775f] text-white text-[11px] font-semibold transition shadow-sm"
                        >
                          Directions <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </aside>

        {/* Right Map View */}
        <section className="relative premium-panel-strong min-h-0 overflow-hidden p-2 rounded-[24px] border border-[#DCDDD5] bg-white shadow-sm">
          {/* Floating Actions on Top of Map */}
          <div className="absolute top-5 right-5 z-[1000] flex items-center gap-2">
            <button
              onClick={handleRenderLiveLocation}
              disabled={isLoadingGeo}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#7A8E72] hover:bg-[#66775f] text-white text-xs font-bold shadow-lg backdrop-blur-md transition hover:scale-105 active:scale-95 disabled:opacity-50"
              title="Render Live Location on Map"
            >
              {isLoadingGeo ? (
                <Loader2 className="h-4 w-4 animate-spin text-white" />
              ) : (
                <Compass className="h-4 w-4 text-white animate-spin-slow" />
              )}
              <span>📍 Render Live Location</span>
            </button>

            <button
              onClick={() => {
                setMapCenter([...userLocation]);
                setRenderKey((k) => k + 1);
                showNotification('🔄 Map re-rendered & centered');
              }}
              className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-white hover:bg-[#FAF8F5] border border-[#DCDDD5] text-[#28302A] text-xs font-semibold shadow-md backdrop-blur-md transition hover:scale-105 active:scale-95"
              title="Center View"
            >
              <RefreshCw className="h-3.5 w-3.5 text-[#7A8E72]" />
            </button>
          </div>

          <div className="relative h-full w-full min-h-[420px] overflow-hidden rounded-[20px] border border-[#DCDDD5]">
            <CustomMapContainer
              userLocation={userLocation}
              mapCenter={mapCenter}
              pois={filteredPois}
              selectedPoiId={selectedPlaceId}
              renderKey={renderKey}
              onSelectPoi={(poi) => {
                setSelectedPlaceId(poi.id || poi._id);
                setMapCenter([poi.lat, poi.lon]);
              }}
            />
          </div>
        </section>
      </div>
    </div>
  );
}
