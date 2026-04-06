import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

const GOOGLE_MAPS_API_KEY = 'AIzaSyCmIT5V_YSb89dai33rt4vp9Gs2ELEyX1o';

const PARKING_LOCATIONS = [
  { id: 1, name: "Phoenix Marketcity Parking",    lat: 18.5610, lng: 73.9143, address: "Phoenix Marketcity, Nagar Road, Viman Nagar" },
  { id: 2, name: "Amanora Mall Parking Hub",       lat: 18.5186, lng: 73.9365, address: "Amanora Town Centre, Hadapsar, Pune" },
  { id: 3, name: "Westend Mall Parking",           lat: 18.5619, lng: 73.8076, address: "Westend Mall, Aundh, Pune" },
  { id: 4, name: "Balewadi High Street Parking",   lat: 18.5708, lng: 73.7742, address: "Balewadi High Street, Baner-Balewadi" },
  { id: 5, name: "Ishanya Mall Parking",           lat: 18.5525, lng: 73.8907, address: "Ishanya Mall, Airport Road, Pune" },
  { id: 6, name: "JM Road Theater Parking",        lat: 18.5208, lng: 73.8473, address: "Jangali Maharaj Road, Shivajinagar" },
  { id: 7, name: "Kopa Mall Smart Parking",        lat: 18.5362, lng: 73.8931, address: "Kopa Mall, Kalyani Nagar, Pune" },
  { id: 8, name: "MG Road Shopping Parking",       lat: 18.5191, lng: 73.8782, address: "MG Road, Camp, Pune" },
  { id: 9, name: "Pavilion Mall Parking Zone",     lat: 18.5314, lng: 73.8296, address: "Pavilion Mall, Pune Station" },
  { id: 10, name: "Seasons Mall Smart Parking",    lat: 18.5154, lng: 73.9318, address: "Seasons Mall, Magarpatta City" },
];

function getRandom(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

const ENRICHED = PARKING_LOCATIONS.map(loc => ({
  ...loc,
  rating:    (getRandom(40, 50) / 10).toFixed(1),
  slots4w:   getRandom(5, 40),
  slots2w:   getRandom(5, 20),
  price4w:   getRandom(20, 80),
  price2w:   getRandom(10, 40),
  status:    ['available','few','full'][getRandom(0,2)],
}));

const STATUS_COLOR = { available: '#10B981', few: '#F59E0B', full: '#EF4444' };

export default function MapView() {
  const navigate  = useNavigate();
  const mapRef    = useRef(null);
  const mapObjRef = useRef(null);
  const markersRef = useRef([]);
  const cardRefs  = useRef({});

  const [mapsReady, setMapsReady]     = useState(false);
  const [selected,  setSelected]      = useState(null);
  const [query,     setQuery]         = useState('');
  const [showDrop,  setShowDrop]      = useState(false);

  // ── Load Google Maps script ──────────────────────────────────────────────
  useEffect(() => {
    if (window.google?.maps) { setMapsReady(true); return; }
    const existing = document.getElementById('gmap-script');
    if (existing) {
      const poll = setInterval(() => {
        if (window.google?.maps) { setMapsReady(true); clearInterval(poll); }
      }, 300);
      return () => clearInterval(poll);
    }
    window.__gmapInit = () => setMapsReady(true);
    const script = document.createElement('script');
    script.id  = 'gmap-script';
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&callback=__gmapInit&v=weekly`;
    script.async = true;
    document.head.appendChild(script);
  }, []);

  // ── Init map once API is ready ───────────────────────────────────────────
  useEffect(() => {
    if (!mapsReady || !mapRef.current) return;

    mapObjRef.current = new window.google.maps.Map(mapRef.current, {
      center: { lat: 18.535, lng: 73.870 },
      zoom: 12,
      disableDefaultUI: true,
      clickableIcons: false,
      styles: [
        { featureType: 'poi',      elementType: 'labels',   stylers: [{ visibility: 'off' }] },
        { featureType: 'transit',  stylers: [{ visibility: 'off' }] },
        { featureType: 'road',     elementType: 'geometry', stylers: [{ color: '#ffffff' }] },
        { featureType: 'road.arterial', elementType: 'geometry', stylers: [{ color: '#f4f4f4'  }] },
        { featureType: 'landscape',     stylers: [{ color: '#f0f4f8' }] },
        { featureType: 'water',         stylers: [{ color: '#b8d4ea' }] },
      ],
    });

    ENRICHED.forEach(loc => {
      const color = STATUS_COLOR[loc.status];

      // Custom SVG marker – filled circle with P
      const svg = `
        <svg xmlns="http://www.w3.org/2000/svg" width="44" height="54" viewBox="0 0 44 54">
          <circle cx="22" cy="22" r="20" fill="${color}" stroke="white" stroke-width="3"/>
          <text x="22" y="28" text-anchor="middle" font-family="Inter,sans-serif" font-size="16" font-weight="800" fill="white">P</text>
          <path d="M22 42 L16 52 L22 48 L28 52 Z" fill="${color}"/>
        </svg>`;

      const marker = new window.google.maps.Marker({
        position: { lat: loc.lat, lng: loc.lng },
        map: mapObjRef.current,
        title: loc.name,
        icon: {
          url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg),
          scaledSize: new window.google.maps.Size(44, 54),
          anchor: new window.google.maps.Point(22, 54),
        },
        animation: window.google.maps.Animation.DROP,
      });

      marker.addListener('click', () => handleSelect(loc));
      markersRef.current.push({ id: loc.id, marker });
    });
  }, [mapsReady]);

  const handleSelect = useCallback((loc) => {
    setSelected(loc);
    // Pan map slightly above center so card doesn't cover marker
    if (mapObjRef.current) {
      mapObjRef.current.panTo({ lat: loc.lat - 0.006, lng: loc.lng });
      mapObjRef.current.setZoom(14);
    }
    // Scroll card into view
    setTimeout(() => {
      cardRefs.current[loc.id]?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }, 200);
  }, []);

  const filtered = query.length > 1
    ? ENRICHED.filter(l => l.name.toLowerCase().includes(query.toLowerCase()))
    : ENRICHED;

  const handleNavigate = (loc) => {
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${loc.lat},${loc.lng}`, '_blank');
  };

  return (
    <div style={{ position: 'relative', width: '100%', height: '100dvh', overflow: 'hidden', background: '#f0f4f8', fontFamily: "'Inter', sans-serif" }}>

      {/* ── FULL-SCREEN MAP ─────────────────────────────────────────── */}
      <div ref={mapRef} style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
        {!mapsReady && (
          <div style={{ width:'100%', height:'100%', background:'linear-gradient(145deg,#dce8f0,#c8d8e4)', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <div style={{ textAlign:'center', color:'#4F46E5' }}>
              <div style={{ width:44, height:44, border:'4px solid rgba(79,70,229,0.2)', borderTop:'4px solid #4F46E5', borderRadius:'50%', animation:'spin 0.8s linear infinite', margin:'0 auto 12px' }}/>
              <p style={{ fontSize:14, fontWeight:600 }}>Loading Map...</p>
            </div>
          </div>
        )}
      </div>

      {/* ── TOP UI LAYER ────────────────────────────────────────────── */}
      <div style={{ position:'absolute', top:0, left:0, right:0, zIndex:10, padding:'16px 16px 0' }}>

        {/* Back button + title */}
        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:12 }}>
          <button
            onClick={() => navigate('/dashboard')}
            style={{ width:40, height:40, borderRadius:12, background:'white', border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 2px 12px rgba(0,0,0,0.12)', color:'#111827' }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
          </button>
          <span style={{ fontSize:18, fontWeight:800, color:'#111827', letterSpacing:'-0.4px' }}>Find Parking</span>
        </div>

        {/* Search Bar */}
        <div style={{ position:'relative' }}>
          <div style={{ display:'flex', alignItems:'center', gap:12, background:'white', borderRadius:16, padding:'0 16px', height:52, boxShadow:'0 4px 20px rgba(0,0,0,0.10)', border:'1.5px solid transparent' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2.5" strokeLinecap="round">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            <input
              type="text"
              placeholder="Search parking location, city, or zip..."
              value={query}
              onChange={e => { setQuery(e.target.value); setShowDrop(true); }}
              onFocus={() => setShowDrop(true)}
              style={{ flex:1, border:'none', outline:'none', fontSize:14, fontFamily:'inherit', fontWeight:500, color:'#111827', background:'transparent' }}
            />
            <button style={{ width:36, height:36, borderRadius:10, background:'#4F46E5', border:'none', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', flexShrink:0 }}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="white"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round"/><line x1="12" y1="19" x2="12" y2="23" stroke="white" strokeWidth="2" strokeLinecap="round"/><line x1="8" y1="23" x2="16" y2="23" stroke="white" strokeWidth="2" strokeLinecap="round"/></svg>
            </button>
          </div>

          {/* Dropdown */}
          {showDrop && query.length > 1 && (
            <div style={{ position:'absolute', top:'calc(100% + 8px)', left:0, right:0, background:'white', borderRadius:16, boxShadow:'0 8px 32px rgba(0,0,0,0.12)', overflow:'hidden', zIndex:50 }}>
              {filtered.slice(0, 5).map(loc => (
                <div key={loc.id}
                  onClick={() => { setShowDrop(false); setQuery(''); handleSelect(loc); }}
                  style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 16px', cursor:'pointer', borderBottom:'1px solid #F3F4F6' }}
                >
                  <div style={{ width:34, height:34, borderRadius:10, background:'#EEF2FF', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="#4F46E5"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
                  </div>
                  <div>
                    <div style={{ fontSize:14, fontWeight:700, color:'#111827' }}>{loc.name}</div>
                    <div style={{ fontSize:12, color:'#9CA3AF', marginTop:1 }}>{loc.address}</div>
                  </div>
                </div>
              ))}
              {filtered.length === 0 && (
                <div style={{ padding:'16px', textAlign:'center', color:'#9CA3AF', fontSize:14 }}>No locations found</div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Dismiss search dropdown on outside click */}
      {showDrop && <div style={{ position:'fixed', inset:0, zIndex:9 }} onClick={() => setShowDrop(false)} />}

      {/* ── BOTTOM CARDS ────────────────────────────────────────────── */}
      <div style={{ position:'absolute', bottom:0, left:0, right:0, zIndex:10 }}>

        {/* Legend row */}
        <div style={{ display:'flex', justifyContent:'flex-end', gap:12, padding:'0 16px 8px' }}>
          {[['#10B981','Available'],['#F59E0B','Few Spots'],['#EF4444','Full']].map(([c,l]) => (
            <div key={l} style={{ display:'flex', alignItems:'center', gap:5, background:'white', borderRadius:999, padding:'5px 10px', fontSize:11, fontWeight:700, boxShadow:'0 1px 6px rgba(0,0,0,0.1)' }}>
              <div style={{ width:8, height:8, borderRadius:'50%', background:c }}/>
              <span style={{ color:'#374151' }}>{l}</span>
            </div>
          ))}
        </div>

        {/* Scrollable Cards */}
        <div style={{ overflowX:'auto', display:'flex', gap:12, padding:'0 16px 24px', scrollSnapType:'x mandatory', WebkitOverflowScrolling:'touch' }}>
          {ENRICHED.map(loc => {
            const isSelected = selected?.id === loc.id;
            const sc = STATUS_COLOR[loc.status];
            return (
              <div
                key={loc.id}
                ref={el => cardRefs.current[loc.id] = el}
                onClick={() => handleSelect(loc)}
                style={{
                  minWidth: 240,
                  background: 'white',
                  borderRadius: 20,
                  padding: '16px',
                  flexShrink: 0,
                  scrollSnapAlign: 'start',
                  boxShadow: isSelected ? '0 0 0 2.5px #4F46E5, 0 8px 24px rgba(79,70,229,0.18)' : '0 4px 16px rgba(0,0,0,0.10)',
                  cursor: 'pointer',
                  transition: 'all 0.25s cubic-bezier(0.34,1.56,0.64,1)',
                  transform: isSelected ? 'translateY(-4px)' : 'translateY(0)',
                  border: isSelected ? '2px solid #4F46E5' : '2px solid transparent',
                }}
              >
                {/* Card Header */}
                <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:6 }}>
                  <div style={{ fontSize:14, fontWeight:800, color:'#111827', lineHeight:1.3, maxWidth:160 }}>
                    {loc.name}
                  </div>
                  <div style={{ display:'flex', alignItems:'center', gap:3, background:'#EEF2FF', borderRadius:999, padding:'3px 8px', flexShrink:0, marginLeft:8 }}>
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="#F59E0B"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                    <span style={{ fontSize:11, fontWeight:800, color:'#4F46E5' }}>{loc.rating}</span>
                  </div>
                </div>

                {/* Address */}
                <div style={{ display:'flex', alignItems:'center', gap:4, color:'#6B7280', fontSize:11, fontWeight:500, marginBottom:12 }}>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="#9CA3AF"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/></svg>
                  {loc.address}
                </div>

                {/* Slot Counts */}
                <div style={{ display:'flex', gap:8, marginBottom:12 }}>
                  {[['4 WHEELER', loc.slots4w], ['2 WHEELER', loc.slots2w]].map(([label, count]) => (
                    <div key={label} style={{ flex:1, background:'#F9FAFB', borderRadius:10, padding:'8px 10px', border:'1px solid #E5E7EB', textAlign:'center' }}>
                      <div style={{ fontSize:9, fontWeight:700, color:'#9CA3AF', textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:3 }}>{label}</div>
                      <div style={{ fontSize:20, fontWeight:900, color: count > 10 ? '#10B981' : count > 0 ? '#F59E0B' : '#EF4444', lineHeight:1 }}>{count}</div>
                    </div>
                  ))}
                </div>

                {/* Availability strip */}
                <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:12 }}>
                  <div style={{ width:8, height:8, borderRadius:'50%', background:sc }}/>
                  <span style={{ fontSize:11, fontWeight:700, color:sc, textTransform:'capitalize' }}>
                    {loc.status === 'available' ? 'Available' : loc.status === 'few' ? 'Few Spots Left' : 'Full'}
                  </span>
                  <span style={{ marginLeft:'auto', fontSize:11, fontWeight:700, color:'#4F46E5' }}>₹{loc.price4w}/hr</span>
                </div>

                {/* Actions */}
                <div style={{ display:'flex', gap:8 }}>
                  <button
                    onClick={e => { e.stopPropagation(); navigate('/booking', { state: { stationName: loc.name, stationId: null } }); }}
                    style={{ flex:1, height:40, background:'#4F46E5', color:'white', border:'none', borderRadius:12, fontSize:13, fontWeight:800, cursor:'pointer', fontFamily:'inherit' }}
                  >
                    Book Slot Now
                  </button>
                  <button
                    onClick={e => { e.stopPropagation(); handleNavigate(loc); }}
                    style={{ width:40, height:40, background:'#EEF2FF', color:'#4F46E5', border:'none', borderRadius:12, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', flexShrink:0 }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4F46E5" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polygon points="3 11 22 2 13 21 11 13 3 11"/>
                    </svg>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        ::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
}
