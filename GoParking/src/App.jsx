import { useState, useEffect, useRef, useCallback } from 'react';
import './index.css';

// ── Data ──────────────────────────────────────────────────────────────────────
const PARKING_LOCATIONS = [
  { id: 1, name: "Phoenix Marketcity Parking", lat: 18.5610, lng: 73.9143 },
  { id: 2, name: "Amanora Mall Parking Hub",   lat: 18.5186, lng: 73.9365 },
  { id: 3, name: "Westend Mall Parking",        lat: 18.5619, lng: 73.8076 },
  { id: 4, name: "Balewadi High Street Parking",lat: 18.5708, lng: 73.7742 },
  { id: 5, name: "Ishanya Mall Parking",        lat: 18.5525, lng: 73.8907 },
  { id: 6, name: "JM Road Theater Parking",     lat: 18.5208, lng: 73.8473 },
  { id: 7, name: "Kopa Mall Smart Parking",     lat: 18.5362, lng: 73.8931 },
  { id: 8, name: "MG Road Shopping Parking",    lat: 18.5191, lng: 73.8782 },
  { id: 9, name: "Pavilion Mall Parking Zone",  lat: 18.5314, lng: 73.8296 },
  { id: 10,"name": "Seasons Mall Smart Parking",lat: 18.5154, lng: 73.9318 },
];

const AVAILABILITY = ['available', 'few', 'full'];
const AVAIL_COLORS  = { available: 'green', few: 'yellow', full: 'red' };
const AVAIL_LABELS  = { available: 'Available', few: 'Few Spots', full: 'Full' };

const RECENT_SEARCHES = [
  { name: "Phoenix Marketcity Parking", sub: "Viman Nagar, Pune · 1.2 km" },
  { name: "MG Road Shopping Parking",   sub: "Camp, Pune · 2.8 km" },
  { name: "Amanora Mall Parking Hub",   sub: "Hadapsar, Pune · 4.1 km" },
];

function getRandom(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Enrich each location with randomized data once
const enriched = PARKING_LOCATIONS.map(loc => ({
  ...loc,
  availability: AVAILABILITY[getRandom(0, 2)],
  price:        getRandom(20, 100),
  distance:     `${(getRandom(5, 50) / 10).toFixed(1)} km`,
  slots:        getRandom(0, 120),
}));

// ── Icons (inline SVG) ────────────────────────────────────────────────────────
const IconSearch    = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>;
const IconMenu      = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>;
const IconParking   = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><rect x="3" y="3" width="18" height="18" rx="4"/><path d="M9 17V7h4a3 3 0 0 1 0 6H9"/></svg>;
const IconPin       = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>;
const IconNav       = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="3 11 22 2 13 21 11 13 3 11"/></svg>;
const IconCheck     = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>;
const IconClock     = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>;
const IconCrosshair = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/><line x1="12" y1="2" x2="12" y2="5"/><line x1="12" y1="19" x2="12" y2="22"/><line x1="2" y1="12" x2="5" y2="12"/><line x1="19" y1="12" x2="22" y2="12"/></svg>;
const IconX         = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>;

// ── Google Map Component ──────────────────────────────────────────────────────
function GoogleMapView({ locations, selectedId, onMarkerClick }) {
  const mapRef    = useRef(null);
  const mapObjRef = useRef(null);
  const markersRef  = useRef([]);

  useEffect(() => {
    let attempts = 0;
    const init = () => {
      if (window.google && window.google.maps) {
        const center = { lat: 18.535, lng: 73.865 };
        mapObjRef.current = new window.google.maps.Map(mapRef.current, {
          center,
          zoom: 12,
          disableDefaultUI: true,
          styles: [
            { featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'off' }] },
            { featureType: 'transit', stylers: [{ visibility: 'off' }] },
            { featureType: 'road',     elementType: 'geometry', stylers: [{ color: '#ffffff' }] },
            { featureType: 'road.arterial', elementType: 'geometry', stylers: [{ color: '#f5f5f5' }] },
            { featureType: 'landscape', stylers: [{ color: '#f0f4f8' }] },
            { featureType: 'water',     stylers: [{ color: '#b8d4e8' }] },
          ],
        });

        locations.forEach(loc => {
          const colorMap = { available: '#10B981', few: '#F59E0B', full: '#EF4444' };
          const color = colorMap[loc.availability];

          const marker = new window.google.maps.Marker({
            position: { lat: loc.lat, lng: loc.lng },
            map: mapObjRef.current,
            title: loc.name,
            icon: {
              path: window.google.maps.SymbolPath.CIRCLE,
              scale: 14,
              fillColor: color,
              fillOpacity: 1,
              strokeColor: '#ffffff',
              strokeWeight: 3,
            },
            animation: window.google.maps.Animation.DROP,
          });

          marker.addListener('click', () => onMarkerClick(loc));
          markersRef.current.push(marker);
        });
      } else if (attempts < 30) {
        attempts++;
        setTimeout(init, 500);
      }
    };
    init();
  }, []);

  // Pan to selected
  useEffect(() => {
    if (!mapObjRef.current || !selectedId) return;
    const loc = locations.find(l => l.id === selectedId);
    if (loc) mapObjRef.current.panTo({ lat: loc.lat - 0.005, lng: loc.lng });
  }, [selectedId]);

  return <div ref={mapRef} style={{ width: '100%', height: '100%' }} />;
}

// ── Fallback Map Component ────────────────────────────────────────────────────
function FallbackMap({ locations, selectedId, onMarkerClick }) {
  // Map bounds for Pune
  const bounds = { minLat: 18.50, maxLat: 18.58, minLng: 73.76, maxLng: 73.95 };

  const toPercent = (lat, lng) => {
    const x = ((lng - bounds.minLng) / (bounds.maxLng - bounds.minLng)) * 100;
    const y = ((bounds.maxLat - lat) / (bounds.maxLat - bounds.minLat)) * 100;
    return { x: `${Math.max(5, Math.min(95, x))}%`, y: `${Math.max(5, Math.min(90, y))}%` };
  };

  return (
    <div className="fallback-map">
      <div className="fallback-map-grid" />
      {/* Roads */}
      <div className="fallback-road-h" style={{ top: '30%' }} />
      <div className="fallback-road-h" style={{ top: '55%' }} />
      <div className="fallback-road-h" style={{ top: '75%' }} />
      <div className="fallback-road-v" style={{ left: '25%' }} />
      <div className="fallback-road-v" style={{ left: '55%' }} />
      <div className="fallback-road-v" style={{ left: '80%' }} />

      {locations.map(loc => {
        const pos   = toPercent(loc.lat, loc.lng);
        const color = AVAIL_COLORS[loc.availability];
        const isActive = loc.id === selectedId;
        return (
          <div
            key={loc.id}
            className={`map-marker ${isActive ? 'active' : ''}`}
            style={{ left: pos.x, top: pos.y }}
            onClick={() => onMarkerClick(loc)}
          >
            <div className="marker-label">{loc.name.split(' ')[0]}</div>
            <div className={`marker-pin ${color}`}>
              <IconParking />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Booking Modal ─────────────────────────────────────────────────────────────
function BookingModal({ parking, onClose }) {
  const [step, setStep] = useState('payment'); // payment | loading | success
  const [selectedPayment, setSelectedPayment] = useState('fastag');
  const bookingRef = `GP${Date.now().toString().slice(-6)}`;

  const handleConfirm = () => {
    setStep('loading');
    setTimeout(() => setStep('success'), 2000);
  };

  return (
    <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-sheet">
        <div className="modal-handle" />

        {step === 'payment' && (
          <>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom: 6 }}>
              <h2 className="modal-title">Book Parking</h2>
              <button className="icon-btn" onClick={onClose}><IconX /></button>
            </div>
            <p className="modal-subtitle">{parking.name} · ₹{parking.price}/hr</p>

            <div className="payment-options">
              {[
                { id: 'fastag', icon: '🏷️', name: 'FASTag', sub: 'Automatic toll deduction — recommended' },
                { id: 'upi',    icon: '📱', name: 'UPI',    sub: 'Pay via PhonePe, Google Pay, Paytm' },
                { id: 'qr',     icon: '📷', name: 'QR Code', sub: 'Scan & pay at parking kiosk' },
              ].map(opt => (
                <div
                  key={opt.id}
                  className={`payment-option ${selectedPayment === opt.id ? 'selected' : ''}`}
                  onClick={() => setSelectedPayment(opt.id)}
                >
                  <div className="payment-icon">{opt.icon}</div>
                  <div className="payment-info">
                    <div className="payment-name">{opt.name}</div>
                    <div className="payment-sub">{opt.sub}</div>
                  </div>
                  <div className="payment-check">
                    {selectedPayment === opt.id && <IconCheck />}
                  </div>
                </div>
              ))}
            </div>

            <div style={{ background: '#F9FAFB', borderRadius: 12, padding: '12px 16px', marginBottom: 20, border: '1px solid #E5E7EB' }}>
              <div style={{ display:'flex', justifyContent:'space-between', fontSize: 13, color: '#6B7280', marginBottom: 6 }}>
                <span>Parking fee (1 hr)</span><span style={{ fontWeight: 700, color: '#111827' }}>₹{parking.price}</span>
              </div>
              <div style={{ display:'flex', justifyContent:'space-between', fontSize: 13, color: '#6B7280', marginBottom: 6 }}>
                <span>Service fee</span><span style={{ fontWeight: 700, color: '#111827' }}>₹5</span>
              </div>
              <div style={{ display:'flex', justifyContent:'space-between', fontSize: 14, fontWeight: 800, color: '#111827', paddingTop: 8, borderTop: '1px solid #E5E7EB' }}>
                <span>Total</span><span style={{ color: '#4F46E5' }}>₹{parking.price + 5}</span>
              </div>
            </div>

            <button className="btn btn-primary" style={{ width:'100%' }} onClick={handleConfirm}>
              Confirm & Pay ₹{parking.price + 5}
            </button>
          </>
        )}

        {step === 'loading' && (
          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', padding: '40px 0' }}>
            <div className="spinner" style={{ width: 48, height: 48, borderWidth: 4, borderColor: 'rgba(79,70,229,0.2)', borderTopColor: '#4F46E5' }} />
            <p style={{ marginTop: 20, fontSize: 16, fontWeight: 600, color: '#6B7280' }}>Processing payment...</p>
          </div>
        )}

        {step === 'success' && (
          <div className="success-state">
            <div className="success-icon">
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </div>
            <div className="success-title">Booking Confirmed! 🎉</div>
            <div className="success-sub">Your spot at <strong>{parking.name}</strong> is reserved. Head there within 15 minutes.</div>
            <div className="booking-ref">Booking Ref: <span>#{bookingRef}</span></div>
            <button className="btn btn-primary" style={{ width:'100%', marginTop: 20 }} onClick={onClose}>
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main App ──────────────────────────────────────────────────────────────────
export default function App() {
  const [selected, setSelected]   = useState(null);
  const [showSearch, setShowSearch] = useState(false);
  const [query, setQuery]         = useState('');
  const [showBooking, setShowBooking] = useState(false);
  const [mapsLoaded, setMapsLoaded]  = useState(false);
  const [sheetExpanded, setSheetExpanded] = useState(false);
  const searchRef = useRef(null);

  // Detect if Google Maps API loaded
  useEffect(() => {
    let attempts = 0;
    const check = () => {
      if (window.google && window.google.maps) {
        setMapsLoaded(true);
      } else if (attempts < 20) {
        attempts++;
        setTimeout(check, 500);
      }
    };
    // Give the script 1s head start
    setTimeout(check, 1000);
  }, []);

  const handleMarkerClick = useCallback((loc) => {
    setSelected(loc);
    setSheetExpanded(false);
  }, []);

  const handleNavigate = () => {
    if (selected) {
      const url = `https://www.google.com/maps/dir/?api=1&destination=${selected.lat},${selected.lng}`;
      window.open(url, '_blank');
    }
  };

  const filteredLocations = query.length > 1
    ? enriched.filter(l => l.name.toLowerCase().includes(query.toLowerCase()))
    : enriched;

  const avail = selected ? AVAIL_COLORS[selected.availability] : null;
  const badgeClass = avail === 'green' ? 'badge-green' : avail === 'yellow' ? 'badge-yellow' : 'badge-red';

  return (
    <div className="app">
      {/* MAP */}
      <div className="map-container">
        {mapsLoaded
          ? <GoogleMapView locations={enriched} selectedId={selected?.id} onMarkerClick={handleMarkerClick} />
          : <FallbackMap   locations={enriched} selectedId={selected?.id} onMarkerClick={handleMarkerClick} />
        }
      </div>

      {/* Re-center button */}
      <button className="map-recenter" onClick={() => setSelected(null)}>
        <IconCrosshair />
      </button>

      {/* TOP BAR */}
      <div className="top-bar">
        <div className="top-row">
          <div className="brand">
            <div className="brand-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
              </svg>
            </div>
            <span className="brand-name">Go <span>Parking</span></span>
          </div>
          <div className="top-actions">
            <button className="icon-btn"><IconMenu /></button>
            <div className="profile-btn">P</div>
          </div>
        </div>

        {/* SEARCH */}
        <div className="search-wrapper" ref={searchRef}>
          <div className="search-bar" onClick={() => setShowSearch(true)}>
            <IconSearch />
            <input
              type="text"
              placeholder="Search parking near you..."
              value={query}
              onChange={e => setQuery(e.target.value)}
              onFocus={() => setShowSearch(true)}
            />
            {query && (
              <button style={{ background:'none',border:'none',cursor:'pointer',color:'#9CA3AF',lineHeight:0 }}
                onClick={() => { setQuery(''); setShowSearch(false); }}>
                <IconX />
              </button>
            )}
          </div>

          {showSearch && (
            <div className="search-dropdown">
              {query.length < 2 ? (
                <>
                  <div className="search-dropdown-header">Recent Searches</div>
                  {RECENT_SEARCHES.map((r, i) => (
                    <div key={i} className="search-item"
                      onClick={() => { setQuery(r.name); setShowSearch(false); const loc = enriched.find(l => l.name === r.name); if(loc) setSelected(loc); }}>
                      <div className="search-item-icon"><IconClock /></div>
                      <div className="search-item-text">
                        <div className="search-item-name">{r.name}</div>
                        <div className="search-item-sub">{r.sub}</div>
                      </div>
                    </div>
                  ))}
                </>
              ) : (
                <>
                  <div className="search-dropdown-header">Results</div>
                  {filteredLocations.slice(0, 5).map(loc => (
                    <div key={loc.id} className="search-item"
                      onClick={() => { setSelected(loc); setShowSearch(false); setQuery(''); }}>
                      <div className="search-item-icon"><IconPin /></div>
                      <div className="search-item-text">
                        <div className="search-item-name">{loc.name}</div>
                        <div className="search-item-sub">₹{loc.price}/hr · {loc.distance} away</div>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
          )}
        </div>

        {/* Dismiss search on outside click */}
        {showSearch && (
          <div style={{ position:'fixed', inset:0, zIndex:49 }} onClick={() => setShowSearch(false)} />
        )}
      </div>

      {/* BOTTOM SHEET */}
      <div className={`bottom-sheet ${sheetExpanded || selected ? 'expanded' : 'collapsed'}`}
        onClick={() => !selected && setSheetExpanded(e => !e)}>
        <div className="sheet-handle-area" style={{ background:'transparent' }}>
          <div className="sheet-handle" />
        </div>
        <div className="sheet-card">
          {!selected ? (
            <>
              <div className="sheet-peek">
                <span className="sheet-peek-title">Nearby Parking</span>
                <span className="sheet-peek-count">{enriched.length} spots</span>
              </div>
              <div className="nearby-list">
                {enriched.map(loc => (
                  <div key={loc.id} className="nearby-item"
                    onClick={e => { e.stopPropagation(); setSelected(loc); }}>
                    <div className={`nearby-dot`} style={{ background: loc.availability === 'available' ? '#10B981' : loc.availability === 'few' ? '#F59E0B' : '#EF4444' }} />
                    <div className="nearby-name">{loc.name}</div>
                    <div className="nearby-price">₹{loc.price}/hr</div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="parking-card" onClick={e => e.stopPropagation()}>
              <div className="parking-header">
                <div className="parking-title">{selected.name}</div>
                <div className={`parking-badge ${badgeClass}`}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'currentColor', opacity: 0.7 }} />
                  {AVAIL_LABELS[selected.availability]}
                </div>
              </div>

              <div className="stats-row">
                <div className="stat-chip">
                  <span className="stat-label">Price</span>
                  <span className="stat-value">₹{selected.price}<span style={{fontSize:11,fontWeight:600,color:'#9CA3AF'}}>/hr</span></span>
                </div>
                <div className="stat-chip">
                  <span className="stat-label">Distance</span>
                  <span className="stat-value">{selected.distance}</span>
                </div>
                <div className="stat-chip">
                  <span className="stat-label">Slots</span>
                  <span className={`stat-value ${AVAIL_COLORS[selected.availability]}`}>{selected.slots}</span>
                </div>
              </div>

              <div className="action-row">
                <button className="btn btn-primary" onClick={() => setShowBooking(true)} disabled={selected.availability === 'full'}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="3"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                  {selected.availability === 'full' ? 'No Spots' : 'Book Now'}
                </button>
                <button className="btn btn-secondary" onClick={handleNavigate}>
                  <IconNav />
                  Navigate
                </button>
              </div>

              <button style={{ marginTop:14, width:'100%', background:'none', border:'none', color:'#9CA3AF', fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}
                onClick={() => setSelected(null)}>
                ← Back to all spots
              </button>
            </div>
          )}
        </div>
      </div>

      {/* BOOKING MODAL */}
      {showBooking && selected && (
        <BookingModal parking={selected} onClose={() => setShowBooking(false)} />
      )}
    </div>
  );
}
