import { useState, useEffect, useRef } from 'react';
import { supabase } from './supabase';
import { useNavigate, useOutletContext } from 'react-router-dom';

export default function Dashboard() {
  const navigate = useNavigate();
  const { profile } = useOutletContext() || {};
  
  // Stations State
  const [stations, setStations] = useState([]);
  const [stationsLoading, setStationsLoading] = useState(true);

  // Google Map
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const GOOGLE_MAPS_KEY = 'AIzaSyCmIT5V_YSb89dai33rt4vp9Gs2ELEyX1o';

  const PARKING_PINS = [
    { name: "Phoenix Marketcity",  lat: 18.5610, lng: 73.9143 },
    { name: "Amanora Mall",        lat: 18.5186, lng: 73.9365 },
    { name: "Westend Mall",        lat: 18.5619, lng: 73.8076 },
    { name: "Balewadi High Street",lat: 18.5708, lng: 73.7742 },
    { name: "Ishanya Mall",        lat: 18.5525, lng: 73.8907 },
    { name: "JM Road Theater",     lat: 18.5208, lng: 73.8473 },
    { name: "Kopa Mall",           lat: 18.5362, lng: 73.8931 },
    { name: "MG Road Shopping",    lat: 18.5191, lng: 73.8782 },
    { name: "Pavilion Mall",       lat: 18.5314, lng: 73.8296 },
    { name: "Seasons Mall",        lat: 18.5154, lng: 73.9318 },
  ];


  // Stations Fetch with Nested Slots
  useEffect(() => {
    const fetchStations = async () => {
      try {
        const { data, error } = await supabase
          .from('parking_stations')
          .select(`
            *,
            parking_sections (
              parking_slots (*)
            )
          `);

        if (!error && data) {
          console.log("[Dashboard] Raw Stations Data:", data);
          
          if (data.length > 0 && (!data[0].parking_sections || data[0].parking_sections.length === 0)) {
            console.warn("[Dashboard] WARNING: No sections found for stations. Check RLS or relationships!");
          }

          const formattedStations = data.map(station => {
            let available4w = 0;
            let available2w = 0;
            
            const sections = station.parking_sections || [];
            sections.forEach(sec => {
              const slots = sec.parking_slots || [];
              slots.forEach(slot => {
                if (!slot.is_occupied) {
                  // Standardizing type check to be case/space insensitive just in case
                  const type = slot.vehicle_type?.toLowerCase().trim();
                  if (type === '4_wheeler' || type === '4wheeler') available4w++;
                  if (type === '2_wheeler' || type === '2wheeler') available2w++;
                }
              });
            });

            return {
              ...station,
              available4w,
              available2w,
              totalAvailable: available4w + available2w
            };
          });
          setStations(formattedStations);
        } else {
            console.error("[Dashboard] Supabase Fetch Error:", error);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setStationsLoading(false);
      }
    };
    
    fetchStations();
    
    // Optional: Realtime subscription for station slots could go here
    const subscription = supabase
      .channel('public:parking_slots:dashboard')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'parking_slots' },
        () => fetchStations() // re-fetch on any slot change
      )
      .subscribe();

    return () => {
        supabase.removeChannel(subscription);
    }
  }, []);

  // Load Google Maps
  useEffect(() => {
    const loadMap = () => {
      if (!window.google?.maps || !mapContainerRef.current || mapInstanceRef.current) return;
      const map = new window.google.maps.Map(mapContainerRef.current, {
        center: { lat: 18.535, lng: 73.870 },
        zoom: 12,
        disableDefaultUI: true,
        clickableIcons: false,
        styles: [
          { featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'off' }] },
          { featureType: 'transit', stylers: [{ visibility: 'off' }] },
          { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#ffffff' }] },
          { featureType: 'landscape', stylers: [{ color: '#f0f4f8' }] },
          { featureType: 'water', stylers: [{ color: '#b8d4ea' }] },
        ],
      });
      mapInstanceRef.current = map;
      const colors = ['#10B981','#F59E0B','#EF4444'];
      PARKING_PINS.forEach(loc => {
        const c = colors[Math.floor(Math.random() * 3)];
        const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="50"><circle cx="20" cy="20" r="18" fill="${c}" stroke="white" stroke-width="3"/><text x="20" y="27" text-anchor="middle" font-family="Inter,sans-serif" font-size="15" font-weight="800" fill="white">P</text><path d="M20 38 L15 48 L20 44 L25 48 Z" fill="${c}"/></svg>`;
        new window.google.maps.Marker({
          position: { lat: loc.lat, lng: loc.lng },
          map,
          title: loc.name,
          icon: { url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg), scaledSize: new window.google.maps.Size(40, 50), anchor: new window.google.maps.Point(20, 50) },
          animation: window.google.maps.Animation.DROP,
        });
      });
    };

    // Load script if not present
    if (!window.google?.maps) {
      if (!document.getElementById('gmap-dash')) {
        window.__gmapDashInit = loadMap;
        const s = document.createElement('script');
        s.id = 'gmap-dash';
        s.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_KEY}&callback=__gmapDashInit&v=weekly`;
        s.async = true;
        document.head.appendChild(s);
      } else {
        const poll = setInterval(() => { if (window.google?.maps) { clearInterval(poll); loadMap(); } }, 300);
      }
    } else {
      loadMap();
    }
  }, []);

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-140px)] lg:h-[780px] min-h-[500px]">
      
      {/* Map View & Floating Search */}
      <div className="flex-1 relative bg-white dark:bg-slate-900 rounded-[2rem] shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-slate-100 dark:border-slate-800/40 overflow-hidden flex flex-col h-full">
        
        {/* Floating Search */}
        <div className="absolute top-4 left-4 right-4 z-20 flex justify-center pointer-events-none">
          <div className="relative w-full max-w-xl flex items-center bg-white/90 backdrop-blur-md shadow-lg shadow-indigo-500/5 rounded-2xl overflow-hidden pointer-events-auto border border-slate-100/80 transition-shadow hover:shadow-xl px-4 py-1.5">
            <span className="material-symbols-outlined text-slate-400">search</span>
            <input 
              className="w-full bg-transparent border-none py-2 px-3 text-sm focus:outline-none placeholder:text-slate-400 text-on-surface" 
              placeholder="Search parking stations, landmarks..." 
              type="text"
            />
            <button className="bg-[#4a40e0] hover:bg-[#3d34b8] transition-colors text-white w-8 h-8 rounded-lg shrink-0 cursor-pointer shadow-md flex items-center justify-center">
              <span className="material-symbols-outlined text-base">mic</span>
            </button>
          </div>
        </div>

        {/* Google Map Container */}
        <div ref={mapContainerRef} className="flex-grow w-full h-full z-0" />

        {/* Horizontally scrolling list - Mobile/Tablet only */}
        <div className="lg:hidden absolute bottom-4 left-0 right-0 px-4 overflow-x-auto snap-x custom-scrollbar flex gap-4 z-20 pb-2">
           {stationsLoading ? (
              <div className="w-[300px] bg-white rounded-2xl p-5 shadow-lg flex items-center justify-center min-h-[160px]">
                 <div className="animate-spin w-8 h-8 rounded-full border-4 border-[#4a40e0]/30 border-t-[#4a40e0]"></div>
              </div>
           ) : (
              stations.map(station => (
                <StationCard key={station.station_id} station={station} profile={profile} navigate={navigate} />
              ))
           )}
        </div>
      </div>

      {/* Stations Sidebar List - Desktop only (lg screens) */}
      <aside className="hidden lg:flex flex-col w-96 bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800/40 shadow-[0_4px_20px_rgba(0,0,0,0.03)] h-full overflow-hidden shrink-0">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800/50 flex items-center justify-between shrink-0">
          <h3 className="font-extrabold text-[#1c1b1f] tracking-tight">Available Parking</h3>
          <span className="text-xs bg-indigo-50 text-[#4a40e0] font-bold px-2.5 py-1 rounded-lg">
            {stationsLoading ? '...' : `${stations.length} locations`}
          </span>
        </div>
        
        <div className="flex-grow overflow-y-auto p-6 space-y-4 custom-scrollbar bg-slate-50/30 dark:bg-slate-900/10">
          {stationsLoading ? (
            <div className="flex items-center justify-center h-48">
               <div className="animate-spin w-8 h-8 rounded-full border-4 border-[#4a40e0]/30 border-t-[#4a40e0]"></div>
            </div>
          ) : (
            stations.map(station => (
              <StationCard key={station.station_id} station={station} profile={profile} navigate={navigate} compact />
            ))
          )}
        </div>
      </aside>

    </div>
  );
}

// Sub-component for Station card
function StationCard({ station, profile, navigate, compact }) {
  return (
    <div className={`bg-white dark:bg-slate-800 rounded-2xl shadow-[0_2px_12px_rgba(74,64,224,0.05)] border border-slate-100 dark:border-slate-700/50 p-4 flex flex-col shrink-0 snap-center transition-all hover:shadow-md ${
      compact ? 'w-full' : 'min-w-[300px] max-w-[320px]'
    }`}>
      <div className="flex justify-between items-start mb-2">
        <h4 className="font-extrabold text-[15px] text-on-surface tracking-tight truncate max-w-[70%]">{station.name}</h4>
        <div className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-md flex items-center gap-1 shrink-0 border border-emerald-100 text-[11px]">
          <span className="font-bold">{station.rating}</span>
          <span>★</span>
        </div>
      </div>
      
      <div className="text-slate-400 text-[11px] font-semibold flex items-center gap-1 mb-3">
        <span className="material-symbols-outlined text-[13px]">location_on</span>
        <span className="truncate">{station.address}, {station.city}</span>
      </div>

      <div className="bg-[#f0effb] dark:bg-indigo-950/40 rounded-xl p-2.5 flex items-center gap-2 mb-3">
        <div className="flex-1 flex flex-col items-center border-r border-[#4a40e0]/10 dark:border-white/5">
          <span className="text-[8px] text-slate-400 font-extrabold uppercase tracking-widest mb-0.5">4 Wheeler</span>
          <span className={`font-black text-sm ${station.available4w > 0 ? 'text-[#4a40e0]' : 'text-error'}`}>{station.available4w}</span>
        </div>
        <div className="flex-1 flex flex-col items-center">
          <span className="text-[8px] text-slate-400 font-extrabold uppercase tracking-widest mb-0.5">2 Wheeler</span>
          <span className={`font-black text-sm ${station.available2w > 0 ? 'text-[#4a40e0]' : 'text-error'}`}>{station.available2w}</span>
        </div>
      </div>
      
      <button 
        onClick={() => navigate('/booking', { state: { stationId: station.station_id, stationName: station.name, stationAddress: [station.address, station.city].filter(Boolean).join(', ') || 'Pune', stationLat: station.latitude, stationLng: station.longitude, vehicleType: profile?.vehicle_type || '4w' } })} 
        disabled={station.totalAvailable === 0}
        className={`w-full py-2.5 rounded-xl text-white font-bold text-[12px] tracking-wide transition-all ${
          station.totalAvailable > 0 
            ? 'bg-gradient-to-r from-[#4a40e0] to-[#5D50D6] shadow-md shadow-[#4a40e0]/10 hover:brightness-110 active:scale-95 cursor-pointer' 
            : 'bg-slate-200 text-slate-400 cursor-not-allowed'
        }`}
      >
        {station.totalAvailable > 0 ? 'Book Slot Now' : 'Parking Full'}
      </button>
    </div>
  );
}

