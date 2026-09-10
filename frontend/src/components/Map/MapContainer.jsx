import React, { useEffect, useState } from 'react';
import { Circle, MapContainer as LeafletMap, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Custom CSS for markers and popups
const customMarkerStyle = `
  .custom-leaflet-marker {
    background: transparent !important;
    border: none !important;
  }
  .leaflet-popup-content-wrapper {
    background: rgba(255, 255, 255, 0.98) !important;
    backdrop-filter: blur(16px) !important;
    border: 1px solid #DCDDD5 !important;
    border-radius: 18px !important;
    box-shadow: 0 16px 30px -8px rgba(40, 48, 42, 0.15) !important;
    color: #28302A !important;
    padding: 4px !important;
  }
  .leaflet-popup-tip {
    background: rgba(255, 255, 255, 0.98) !important;
    border: 1px solid #DCDDD5 !important;
  }
  .leaflet-container {
    font-family: inherit !important;
    z-index: 10 !important;
  }
`;

const createIcon = (type, isSelected = false, riskLevel = null) => {
  const t = type?.toLowerCase() || '';
  let bgColor, iconSvg, borderColor;

  if (t.includes('police')) {
    bgColor = isSelected ? '#7A8E72' : '#8fa187';
    borderColor = '#5e6e58';
    iconSvg = `<svg class="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`;
  } else if (t.includes('hospital') || t.includes('clinic') || t.includes('medical')) {
    bgColor = isSelected ? '#C62828' : '#d93838';
    borderColor = '#9b1c1c';
    iconSvg = `<svg class="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 6v12M6 12h12"/><path d="M19 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2z"/></svg>`;
  } else if (t.includes('sos') || t.includes('incident') || t.includes('alert')) {
    const riskColors = {
      high: { background: '#C62828', border: '#9b1c1c' },
      medium: { background: '#C18A32', border: '#956616' },
      low: { background: '#4F7D55', border: '#37613D' }
    };
    const colors = riskColors[riskLevel] || riskColors.high;
    bgColor = colors.background;
    borderColor = colors.border;
    iconSvg = `<svg class="w-5 h-5 text-white animate-pulse" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`;
  } else {
    // Safe Zone / Community Hub
    bgColor = isSelected ? '#7A8E72' : '#A8B8A0';
    borderColor = '#5e6e58';
    iconSvg = `<svg class="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`;
  }

  const scale = isSelected ? 'scale(1.15)' : 'scale(1)';

  return new L.DivIcon({
    className: 'custom-leaflet-marker',
    html: `
      <div style="transform: ${scale}; transition: transform 0.2s ease;" class="relative flex items-center justify-center">
        <div style="background-color: ${bgColor}; border: 2px solid ${borderColor};" class="w-10 h-10 rounded-2xl shadow-xl flex items-center justify-center cursor-pointer hover:scale-110 transition-transform">
          ${iconSvg}
        </div>
        <div style="background-color: ${borderColor};" class="absolute -bottom-1 w-2 h-2 rotate-45"></div>
      </div>
    `,
    iconSize: [40, 44],
    iconAnchor: [20, 42],
    popupAnchor: [0, -42]
  });
};

const userIcon = new L.DivIcon({
  className: 'custom-leaflet-marker',
  html: `
    <div class="relative flex items-center justify-center w-14 h-14">
      <div class="absolute w-14 h-14 bg-[#7A8E72]/25 rounded-full animate-ping"></div>
      <div class="absolute w-9 h-9 bg-[#7A8E72]/40 rounded-full animate-pulse"></div>
      <div class="w-7 h-7 rounded-full bg-white shadow-2xl flex items-center justify-center z-10 border-2 border-[#7A8E72]">
        <div class="w-3.5 h-3.5 rounded-full bg-[#7A8E72] shadow-[0_0_10px_rgba(122,142,114,0.7)]"></div>
      </div>
    </div>
  `,
  iconSize: [56, 56],
  iconAnchor: [28, 28],
  popupAnchor: [0, -28]
});

const newsRiskStyles = {
  high: { color: '#C62828', fillColor: '#C62828', radius: 3500 },
  medium: { color: '#C18A32', fillColor: '#C18A32', radius: 2500 },
  low: { color: '#4F7D55', fillColor: '#4F7D55', radius: 1800 }
};

function MapViewController({ center, zoom = 14, renderKey }) {
  const map = useMap();

  useEffect(() => {
    if (center && Array.isArray(center) && center.length === 2 && !isNaN(center[0]) && !isNaN(center[1])) {
      try {
        map.invalidateSize();
        map.flyTo(center, zoom, {
          duration: 1.2,
          easeLinearity: 0.25
        });
      } catch (err) {
        map.setView(center, zoom);
      }
    }
  }, [center, zoom, renderKey, map]);

  return null;
}

function MapAlertBounds({ pois, enabled }) {
  const map = useMap();

  useEffect(() => {
    if (!enabled) return;
    const points = pois
      .filter((poi) => poi.articleUrl)
      .map((poi) => [poi.lat || poi.location?.coordinates?.[1], poi.lon || poi.lng || poi.location?.coordinates?.[0]])
      .filter(([lat, lon]) => Number.isFinite(lat) && Number.isFinite(lon));

    if (points.length) {
      map.fitBounds(L.latLngBounds(points), { padding: [48, 48], maxZoom: 7, animate: true });
    }
  }, [enabled, pois, map]);

  return null;
}

export default function CustomMapContainer({
  location,
  userLocation,
  mapCenter,
  pois = [],
  selectedPoiId = null,
  onSelectPoi = null,
  zoom = 14,
  renderKey = 0,
  fitToNewsAlerts = false
}) {
  const [tilesUnavailable, setTilesUnavailable] = useState(false);
  const effectiveUserLoc = userLocation || location || [28.6139, 77.2090];
  const effectiveCenter = mapCenter || location || userLocation || [28.6139, 77.2090];

  const validCenter = Array.isArray(effectiveCenter) && effectiveCenter.length === 2 && !isNaN(effectiveCenter[0])
    ? effectiveCenter
    : [28.6139, 77.2090];

  const validUserLoc = Array.isArray(effectiveUserLoc) && effectiveUserLoc.length === 2 && !isNaN(effectiveUserLoc[0])
    ? effectiveUserLoc
    : validCenter;

  return (
    <div className="relative w-full h-full min-h-[420px] overflow-hidden rounded-[20px] bg-[#FAF8F5]">
      <style>{customMarkerStyle}</style>
      <LeafletMap
        center={validCenter}
        zoom={zoom}
        style={{ height: '100%', width: '100%', position: 'absolute', inset: 0 }}
        zoomControl={true}
      >
        <MapViewController center={validCenter} zoom={zoom} renderKey={renderKey} />
        <MapAlertBounds pois={pois} enabled={fitToNewsAlerts} />
        
        <TileLayer
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          maxZoom={19}
          eventHandlers={{
            load: () => setTilesUnavailable(false),
            tileerror: () => setTilesUnavailable(true),
          }}
        />

        {/* User Current Live Location Marker */}
        <Marker position={validUserLoc} icon={userIcon}>
          <Popup className="text-[#28302A]">
            <div className="p-2 text-center">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#FAF0EA] text-[#7A8E72] text-[11px] font-semibold uppercase tracking-wider mb-1 border border-[#DCDDD5]">
                <span className="w-2 h-2 rounded-full bg-[#7A8E72] animate-pulse"></span>
                You are here
              </div>
              <p className="text-xs text-[#687067] font-mono mt-1">
                {validUserLoc[0].toFixed(5)}, {validUserLoc[1].toFixed(5)}
              </p>
            </div>
          </Popup>
        </Marker>

        {pois.filter((poi) => poi.articleUrl).map((alert) => {
          const lat = alert.lat || alert.location?.coordinates?.[1];
          const lon = alert.lon || alert.lng || alert.location?.coordinates?.[0];
          if (!lat || !lon) return null;
          const style = newsRiskStyles[alert.riskLevel] || newsRiskStyles.low;
          return (
            <Circle
              key={`risk-area-${alert.id || alert._id || `${lat}-${lon}`}`}
              center={[lat, lon]}
              radius={style.radius}
              pathOptions={{ color: style.color, fillColor: style.fillColor, fillOpacity: 0.14, weight: 1.5 }}
            />
          );
        })}

        {/* POI Markers */}
        {pois.map((poi) => {
          const lat = poi.lat || poi.location?.coordinates?.[1];
          const lon = poi.lon || poi.lng || poi.location?.coordinates?.[0];
          if (!lat || !lon || isNaN(lat) || isNaN(lon)) return null;

          const isSelected = selectedPoiId === (poi.id || poi._id);
          const navUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}`;

          return (
            <Marker
              key={poi.id || poi._id || `${lat}-${lon}`}
              position={[lat, lon]}
              icon={createIcon(poi.type, isSelected, poi.riskLevel)}
              eventHandlers={{
                click: () => {
                  if (onSelectPoi) onSelectPoi(poi);
                }
              }}
            >
              <Popup>
                <div className="p-2.5 max-w-[220px]">
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="px-2 py-0.5 rounded-md bg-[#FAF0EA] text-[10px] font-bold uppercase tracking-wider text-[#7A8E72] border border-[#DCDDD5]">
                      {poi.type || 'Safe Place'}
                    </span>
                    {poi.rating && (
                      <span className="text-[#C18A32] text-xs font-semibold flex items-center gap-1">
                        ★ {poi.rating}
                      </span>
                    )}
                  </div>
                  <h4 className="font-semibold text-[#28302A] text-sm leading-snug">{poi.name}</h4>
                  {poi.distance && (
                    <p className="text-xs text-[#687067] mt-1 flex items-center gap-1 font-medium">
                      📍 {poi.distance} away
                    </p>
                  )}
                  {poi.status && (
                    <p className="text-[11px] text-[#687067] mt-0.5">{poi.status}</p>
                  )}
                  {poi.locationName && (
                    <p className="text-[11px] text-[#687067] mt-0.5">Reported location: {poi.locationName}</p>
                  )}
                  
                  {poi.articleUrl ? (
                    <a
                      href={poi.articleUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-3 block w-full py-1.5 px-3 rounded-lg bg-[#7A8E72] hover:bg-[#66775f] text-white text-xs font-semibold text-center transition"
                    >
                      Read article ↗
                    </a>
                  ) : (
                    <a
                      href={navUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-3 block w-full py-1.5 px-3 rounded-lg bg-[#7A8E72] hover:bg-[#66775f] text-white text-xs font-semibold text-center transition"
                    >
                      Directions ↗
                    </a>
                  )}
                </div>
              </Popup>
            </Marker>
          );
        })}
      </LeafletMap>
      {tilesUnavailable && (
        <div className="pointer-events-none absolute inset-x-4 bottom-4 z-[500] rounded-lg border border-[#DCDDD5] bg-white/95 px-3 py-2 text-center text-xs font-medium text-[#687067] shadow-sm">
          Map tiles could not load. Check your internet connection and reload the page.
        </div>
      )}
    </div>
  );
}
