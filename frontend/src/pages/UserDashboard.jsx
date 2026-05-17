import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline, LayersControl, Circle, ScaleControl } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { motion, AnimatePresence } from 'framer-motion';
import MotionContainer from '../components/common/MotionContainer';
import { categories } from '../data/data';
import { searchMedicines } from '../services/api';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { SkeletonCard, SkeletonTable, Skeleton } from '../components/common/Skeleton';

// Fix default Leaflet marker icon issue in bundlers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Custom colored markers using SVG
function createColoredIcon(color, isUser = false) {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 36" width="${isUser ? 36 : 28}" height="${isUser ? 54 : 42}">
      <defs>
        ${isUser ? `
        <style>
          @keyframes pulse {
            0% { transform: scale(1); opacity: 1; }
            50% { transform: scale(1.2); opacity: 0.7; }
            100% { transform: scale(1); opacity: 1; }
          }
          .pulse-circle {
            animation: pulse 2s infinite;
          }
        </style>
        ` : ''}
      </defs>
      ${isUser ? `<circle cx="12" cy="18" r="8" fill="${color}" fill-opacity="0.3" class="pulse-circle"/>` : ''}
      <path d="M12 0C5.4 0 0 5.4 0 12c0 9 12 24 12 24s12-15 12-24C24 5.4 18.6 0 12 0z" fill="${color}" stroke="#fff" stroke-width="2"/>
      <circle cx="12" cy="12" r="${isUser ? 7 : 5}" fill="#fff"/>
      ${isUser ? `<circle cx="12" cy="12" r="3" fill="${color}"/>` : ''}
    </svg>
  `;
  return L.divIcon({
    html: svg,
    className: '',
    iconSize: isUser ? [36, 54] : [28, 42],
    iconAnchor: isUser ? [18, 54] : [14, 42],
    popupAnchor: [0, isUser ? -54 : -42],
  });
}

const greenIcon = createColoredIcon('#16a34a');
const yellowIcon = createColoredIcon('#d97706');
const redIcon = createColoredIcon('#dc2626');
const blueUserIcon = createColoredIcon('#2563eb', true);

function getStockIcon(stock) {
  if (stock === 0) return redIcon;
  if (stock < 10) return yellowIcon;
  return greenIcon;
}

function getStockBadge(stock) {
  if (stock === 0) return <span className="badge badge-danger">🔴 Out of Stock</span>;
  if (stock < 10) return <span className="badge badge-warning">🟡 Low Stock ({stock})</span>;
  return <span className="badge badge-success">🟢 In Stock ({stock})</span>;
}

function MapController({ center, bounds }) {
  const map = useMap();
  useEffect(() => {
    if (bounds && bounds.length > 0) {
      map.fitBounds(bounds, { padding: [50, 50], animate: true });
    } else if (center) {
      map.flyTo(center, map.getZoom(), { animate: true, duration: 1.5 });
    }
  }, [center, bounds, map]);
  return null;
}

function LocateButton({ userPos, locationGranted }) {
  const map = useMap();

  const handleLocate = () => {
    if (locationGranted && userPos) {
      map.flyTo(userPos, 16, { animate: true, duration: 1.5 });
    } else {
      toast.error("Location permission not granted. Please enable location services.");
    }
  };

  useEffect(() => {
    const control = L.control({ position: 'topleft' });
    control.onAdd = () => {
      const button = L.DomUtil.create('button', 'locate-button');
      button.innerHTML = '📍';
      button.style.cssText = `
        background: white;
        border: 2px solid #2563eb;
        border-radius: 4px;
        width: 30px;
        height: 30px;
        cursor: pointer;
        font-size: 16px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        transition: all 0.2s;
      `;
      button.onmouseover = () => {
        button.style.background = '#2563eb';
        button.style.color = 'white';
      };
      button.onmouseout = () => {
        button.style.background = 'white';
        button.style.color = 'black';
      };
      button.onclick = handleLocate;
      button.title = 'Center on my location';
      return button;
    };
    control.addTo(map);

    return () => {
      map.removeControl(control);
    };
  }, [map, userPos, locationGranted]);

  return null;
}

function NorthArrow() {
  const map = useMap();

  useEffect(() => {
    const control = L.control({ position: 'topleft' });
    control.onAdd = () => {
      const container = L.DomUtil.create('div', 'north-arrow');
      container.innerHTML = `
        <div style="
          width: 30px;
          height: 30px;
          background: white;
          border: 2px solid #666;
          border-radius: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
          cursor: pointer;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
          transition: all 0.2s;
        " title="North Arrow">
          ⬆️
        </div>
      `;
      const arrow = container.querySelector('div');
      arrow.onclick = () => {
        map.setBearing(0);
      };
      arrow.onmouseover = () => {
        arrow.style.background = '#f0f0f0';
      };
      arrow.onmouseout = () => {
        arrow.style.background = 'white';
      };
      return container;
    };
    control.addTo(map);

    return () => {
      map.removeControl(control);
    };
  }, [map]);

  return null;
}

function MapModeToggle() {
  const map = useMap();
  const [isSatellite, setIsSatellite] = useState(false);

  const toggleMapMode = () => {
    setIsSatellite(!isSatellite);
  };

  useEffect(() => {
    map.eachLayer((layer) => {
      if (layer instanceof L.TileLayer) {
        map.removeLayer(layer);
      }
    });

    const tileLayer = L.tileLayer(
      isSatellite
        ? 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
        : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      {
        attribution: isSatellite
          ? '&copy; <a href="https://www.arcgis.com/">Esri</a>'
          : '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      }
    );
    tileLayer.addTo(map);
  }, [map, isSatellite]);

  useEffect(() => {
    const control = L.control({ position: 'topright' });
    control.onAdd = () => {
      const container = L.DomUtil.create('div', 'map-mode-toggle');
      container.innerHTML = `
        <div style="
          background: white;
          border-radius: 25px;
          padding: 3px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          border: 2px solid #e5e7eb;
          display: flex;
          align-items: center;
          gap: 2px;
          cursor: pointer;
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
        " class="map-toggle-container">
          <div style="
            width: 32px;
            height: 32px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 14px;
            transition: all 0.3s ease;
            position: relative;
            z-index: 2;
          " class="map-icon map-icon-standard">🗺️</div>
          <div style="
            width: 32px;
            height: 32px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 14px;
            transition: all 0.3s ease;
            position: relative;
            z-index: 2;
          " class="map-icon map-icon-satellite">🛰️</div>
          <div style="
            position: absolute;
            top: 3px;
            left: 3px;
            width: 32px;
            height: 32px;
            background: linear-gradient(135deg, #2563eb, #1d4ed8);
            border-radius: 50%;
            transition: transform 0.3s ease;
            box-shadow: 0 2px 8px rgba(37, 99, 235, 0.3);
            z-index: 1;
          " class="toggle-slider"></div>
        </div>
      `;

      const toggleContainer = container.querySelector('.map-toggle-container');
      const slider = container.querySelector('.toggle-slider');

      const updateToggle = () => {
        if (isSatellite) {
          slider.style.transform = 'translateX(34px)';
          toggleContainer.style.boxShadow = '0 4px 12px rgba(0,0,0,0.2)';
        } else {
          slider.style.transform = 'translateX(0)';
          toggleContainer.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
        }
      };

      updateToggle();

      toggleContainer.onclick = () => {
        toggleMapMode();
      };

      toggleContainer.onmouseover = () => {
        toggleContainer.style.transform = 'scale(1.05)';
      };

      toggleContainer.onmouseout = () => {
        toggleContainer.style.transform = 'scale(1)';
      };

      return container;
    };
    control.addTo(map);

    return () => {
      map.removeControl(control);
    };
  }, [map, isSatellite]);

  return null;
}

export default function UserDashboard() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchHistory, setSearchHistory] = useState(() => {
    try {
      const saved = localStorage.getItem('medoraSearchHistory');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const [hasSearched, setHasSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mapPins, setMapPins] = useState([]);

  const navigate = useNavigate();

  // Geolocation states
  const [userPos, setUserPos] = useState([19.0760, 72.8777]); // Default Mumbai
  const [locationGranted, setLocationGranted] = useState(false);

  // Directions state
  const [routePath, setRoutePath] = useState(null);
  const [mapBounds, setMapBounds] = useState(null);
  const [routeDetails, setRouteDetails] = useState(null);

  // Ask for location on mount
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserPos([pos.coords.latitude, pos.coords.longitude]);
          setLocationGranted(true);
        },
        (err) => {
          console.warn("Location permission denied or failed:", err);
        }
      );
    }
  }, []);

  const triggerSearch = async (queryOverride = null, categoryOverride = null) => {
    const q = queryOverride !== null ? queryOverride : searchQuery;
    const cat = categoryOverride !== null ? categoryOverride : selectedCategory;

    if (q && q.trim()) {
      setSearchHistory(prev => {
        const newHistory = [q.trim(), ...prev.filter(item => item.toLowerCase() !== q.trim().toLowerCase())].slice(0, 5);
        localStorage.setItem('medoraSearchHistory', JSON.stringify(newHistory));
        return newHistory;
      });
    }

    setHasSearched(true);
    setLoading(true);
    setRoutePath(null);
    setMapBounds(null);
    setRouteDetails(null);

    try {
      const lat = locationGranted ? userPos[0] : null;
      const lng = locationGranted ? userPos[1] : null;

      const results = await searchMedicines(q, cat, lat, lng);
      setMapPins(results || []);
    } catch (err) {
      toast.error("Failed to fetch medicines: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    triggerSearch();
  };

  const handleDirections = (pin) => {
    let url = `https://www.google.com/maps/dir/?api=1&destination=${pin.lat},${pin.lng}`;
    if (locationGranted && userPos) {
      url += `&origin=${userPos[0]},${userPos[1]}`;
    }
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleOrderNow = (pin) => {
    const firstMed = pin.allMedicines[0];
    if (!firstMed) return toast.error('No medicines available here');

    navigate('/checkout', {
      state: {
        medicine: { ...firstMed.medicine, price: firstMed.price, stock: firstMed.stock },
        pharmacyId: pin.pharmacy.id || pin.pharmacy._id
      }
    });
  };

  const totalMatchedMeds = new Set();
  mapPins.forEach(pin => {
    pin.allMedicines.forEach(m => totalMatchedMeds.add(m.medicine.id));
  });

  return (
    // ✅ Single outermost wrapper — flex column, full height
    <div style={{ padding: 'var(--sp-xl)', width: '98%', maxWidth: '1800px', margin: '0 auto', height: 'calc(100vh - 80px)', display: 'flex', flexDirection: 'column' }}>

      {/* ── Header + Search ── */}
      <div style={{ flexShrink: 0 }}>
        <MotionContainer direction="down" distance={15}>
          <h2 style={{ fontSize: 'var(--fs-2xl)', fontWeight: 'var(--fw-bold)', marginBottom: 'var(--sp-sm)' }}>
            Find Medicines Near You
          </h2>
          <p style={{ color: 'var(--clr-text-muted)', fontSize: 'var(--fs-sm)', marginBottom: 'var(--sp-lg)' }}>
            Search for any medicine and see which nearby pharmacies have it in stock.
            {locationGranted ? " (Using your Live Location 📍)" : ""}
          </p>

          <form className="search-section" onSubmit={handleSearch}>
            <div className="search-bar">
              <span className="search-icon">🔍</span>
              <input
                type="text"
                placeholder="Search medicines... (e.g. Paracetamol, Amoxicillin)"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="category-filter">
              <select
                className="input-field"
                value={selectedCategory}
                onChange={e => {
                  const newCat = e.target.value;
                  setSelectedCategory(newCat);
                  if (hasSearched) triggerSearch(searchQuery, newCat);
                }}
              >
                <option value="All">All Categories</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            <button type="submit" className="btn btn-primary" style={{ height: '100%' }} disabled={loading}>
              {loading ? <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>🔍 Searching...</span> : 'Search'}
            </button>
          </form>

          {searchHistory.length > 0 && (
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
              <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--clr-text-muted)' }}>Recent Searches:</span>
              {searchHistory.map((item, idx) => (
                <button
                  key={idx}
                  type="button"
                  style={{ fontSize: 'var(--fs-xs)', padding: '0.25rem 0.5rem', background: 'var(--clr-surface)', border: '1px solid var(--clr-border)', borderRadius: 'var(--radius-sm)', cursor: 'pointer', color: 'var(--clr-text)' }}
                  onClick={() => {
                    setSearchQuery(item);
                    triggerSearch(item, selectedCategory);
                  }}
                >
                  🕒 {item}
                </button>
              ))}
              <button
                type="button"
                style={{ fontSize: 'var(--fs-xs)', padding: '0.25rem 0.5rem', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--clr-danger)', textDecoration: 'underline' }}
                onClick={() => {
                  setSearchHistory([]);
                  localStorage.removeItem('medoraSearchHistory');
                }}
              >
                Clear
              </button>
            </div>
          )}
        </MotionContainer>

        {/* ── Stats Bar ── */}
        {hasSearched && !loading && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--sp-md)', flexWrap: 'wrap', gap: 'var(--sp-sm)' }}>
            <div style={{ fontSize: 'var(--fs-sm)', color: 'var(--clr-text-muted)' }}>
              Found <strong style={{ color: 'var(--clr-text)' }}>{totalMatchedMeds.size}</strong> medicine(s)
              across <strong style={{ color: 'var(--clr-text)' }}>{mapPins.length}</strong> pharmacies
            </div>
            <div style={{ display: 'flex', gap: 'var(--sp-md)', fontSize: 'var(--fs-xs)', color: 'var(--clr-text-muted)', flexWrap: 'wrap' }}>
              <span>🔵 You (with pulse)</span>
              <span>🟢 In Stock (≥10)</span>
              <span>🟡 Low (1-9)</span>
              <span>🔴 Out of Stock</span>
              <span>📍 Locate Me</span>
              <span>⬆️ North Arrow</span>
              <span>🗺️🛰️ Map Toggle</span>
            </div>
          </div>
        )}
      </div>
      {/* ── End Header + Search ── */}

      {/* ── Main Content: Sidebar + Map ── */}
      <div style={{ display: 'flex', flexGrow: 1, gap: '1rem', overflow: 'hidden', minHeight: '500px' }}>

        {/* Sidebar List */}
        {hasSearched && (
          <motion.div
            style={{ width: '350px', display: 'flex', flexDirection: 'column', gap: '1rem', overflowY: 'auto', paddingRight: '10px' }}
            initial="hidden"
            animate="visible"
            variants={{
              visible: { transition: { staggerChildren: 0.1 } }
            }}
          >
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)
            ) : mapPins.length > 0 ? (
              mapPins.map((pin, idx) => (
                <MotionContainer
                  key={pin.pharmacy.id}
                  delay={idx * 0.05}
                  direction="right"
                  distance={20}
                >
                  <div
                    style={{ background: 'var(--clr-surface)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--clr-border)', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', transition: 'all 0.3s var(--spring-soft)' }}
                    className="interactive-card"
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                      <h3 style={{ margin: 0, fontSize: '1rem' }}>{pin.pharmacy.name}</h3>
                      {pin.pharmacy.distance !== null && (
                        <span className="badge badge-primary">{pin.pharmacy.distance} km</span>
                      )}
                    </div>
                    <p style={{ fontSize: '0.8rem', color: 'var(--clr-text-muted)', marginBottom: '0.5rem' }}>📍 {pin.pharmacy.address}</p>

                    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                      <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="btn btn-primary btn-sm" onClick={() => handleOrderNow(pin)}>🛒 Order Now</motion.button>
                      <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="btn btn-secondary btn-sm" onClick={() => handleDirections(pin.pharmacy)}>🗺️ Direction</motion.button>
                      <motion.a whileHover={{ scale: 1.1 }} href={`tel:${pin.pharmacy.phone}`} className="btn btn-ghost btn-sm">📞 Call</motion.a>
                    </div>

                    <div>
                      {pin.allMedicines.map((m, i) => (
                        <div key={i} style={{ borderTop: i > 0 ? '1px solid var(--clr-border)' : 'none', padding: '0.5rem 0', fontSize: '0.85rem' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '500' }}>
                            <span>{m.medicine.name}</span>
                            <span style={{ color: 'var(--clr-primary)' }}>₹{m.price || 0}</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.25rem' }}>
                            {getStockBadge(m.stock)}
                            {m.medicine.rxRequired && <span className="badge badge-warning">Rx</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </MotionContainer>
              ))
            ) : (
              <MotionContainer direction="up">
                <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--clr-text-muted)' }}>
                  No results found.
                </div>
              </MotionContainer>
            )}
          </motion.div>
        )}

        {/* Map Area */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          style={{ flex: 1, borderRadius: 'var(--radius-lg)', overflow: 'hidden', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', position: 'relative' }}
        >
          {routeDetails && (
            <div style={{ position: 'absolute', top: '10px', right: '10px', zIndex: 1000, background: 'rgba(255,255,255,0.95)', padding: '1rem', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.2)', width: '300px', maxHeight: '400px', display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <h4 style={{ margin: 0, color: 'var(--clr-primary-dark)' }}>Route to {routeDetails.destination}</h4>
                <button
                  onClick={(e) => { e.stopPropagation(); setRouteDetails(null); setRoutePath(null); }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', padding: '0 5px' }}
                >×</button>
              </div>
              <div style={{ marginBottom: '0.5rem', fontWeight: 'bold' }}>
                🚗 {routeDetails.distance} km • ⏱️ {routeDetails.duration} min
              </div>
              {routeDetails.steps && routeDetails.steps.length > 0 && (
                <div style={{ overflowY: 'auto', flex: 1, fontSize: '0.85rem', paddingRight: '0.5rem' }}>
                  <ul style={{ paddingLeft: '1.2rem', margin: 0 }}>
                    {routeDetails.steps.map((step, i) => (
                      <li key={i} style={{ marginBottom: '0.25rem', textTransform: 'capitalize' }}>{step}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {!hasSearched && !loading ? (
            <div className="map-placeholder" style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--clr-surface)' }}>
              <div className="placeholder-icon" style={{ fontSize: '3rem', marginBottom: '1rem' }}>🗺️</div>
              <p style={{ color: 'var(--clr-text-muted)', textAlign: 'center', maxWidth: '300px' }}>
                Search for a medicine above to see nearby pharmacies on the map with real-time stock availability.
              </p>
            </div>
          ) : loading ? (
            <div style={{ padding: '2rem', height: '100%' }}>
              <Skeleton width="100%" height="100%" borderRadius="var(--radius-lg)" />
            </div>
          ) : mapPins.length === 0 ? (
            <div className="map-placeholder" style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--clr-surface)' }}>
              <div className="placeholder-icon" style={{ fontSize: '3rem', marginBottom: '1rem' }}>😔</div>
              <p style={{ color: 'var(--clr-text-muted)', textAlign: 'center', maxWidth: '300px' }}>
                No pharmacies found with the searched medicine. Try a different search term or category.
              </p>
            </div>
          ) : (
            <MapContainer
              center={locationGranted ? userPos : [mapPins[0].pharmacy.lat, mapPins[0].pharmacy.lng]}
              zoom={12}
              style={{ width: '100%', height: '100%' }}
              scrollWheelZoom={true}
            >
              <MapModeToggle />
              <LocateButton userPos={userPos} locationGranted={locationGranted} />
              <NorthArrow />
              <ScaleControl position="bottomleft" />
              <MapController
                center={locationGranted ? userPos : [mapPins[0].pharmacy.lat, mapPins[0].pharmacy.lng]}
                bounds={mapBounds}
              />

              {routePath && <Polyline positions={routePath} color="#2563eb" weight={5} opacity={0.7} />}

              {locationGranted && (
                <>
                  <Marker position={userPos} icon={blueUserIcon}>
                    <Popup>
                      <div style={{ padding: '0.5rem', textAlign: 'center', fontFamily: 'var(--font-family)', background: 'var(--clr-surface)', color: 'var(--clr-text)', borderRadius: 'var(--radius-md)', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}>
                        <strong style={{ fontSize: '1rem', color: 'var(--clr-primary)' }}>📍 You are here</strong>
                        <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.8rem', color: 'var(--clr-text-muted)' }}>
                          {userPos[0].toFixed(4)}, {userPos[1].toFixed(4)}
                        </p>
                      </div>
                    </Popup>
                  </Marker>
                  <Circle center={userPos} radius={100} color="#2563eb" fillColor="#2563eb" fillOpacity={0.1} />
                </>
              )}

              {mapPins.map(pin => {
                const bestStock = Math.max(...pin.allMedicines.map(m => m.stock));
                return (
                  <Marker
                    key={pin.pharmacy.id}
                    position={[pin.pharmacy.lat, pin.pharmacy.lng]}
                    icon={getStockIcon(bestStock)}
                  >
                    <Popup>
                      <div style={{ minWidth: '200px', padding: '0.5rem', fontFamily: 'var(--font-family)', borderRadius: 'var(--radius-md)', background: 'var(--clr-surface)', color: 'var(--clr-text)', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}>
                        <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1rem', fontWeight: 'bold', color: 'var(--clr-primary)' }}>{pin.pharmacy.name}</h3>
                        <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.85rem', color: 'var(--clr-text-muted)', display: 'flex', alignItems: 'flex-start', gap: '0.25rem' }}>
                          <span>📍</span>
                          <span>{pin.pharmacy.address}</span>
                        </p>
                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                          <button
                            className="btn btn-primary btn-sm"
                            onClick={() => handleOrderNow(pin)}
                            style={{ fontSize: '0.8rem', padding: '0.25rem 0.5rem', borderRadius: 'var(--radius-sm)', cursor: 'pointer', border: 'none', background: 'var(--clr-primary)', color: 'white', fontWeight: '500' }}
                          >
                            🛒 Order Now
                          </button>
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => handleDirections(pin.pharmacy)}
                            style={{ fontSize: '0.8rem', padding: '0.25rem 0.5rem', borderRadius: 'var(--radius-sm)', cursor: 'pointer', border: '1px solid var(--clr-border)', background: 'var(--clr-surface)', color: 'var(--clr-text)', fontWeight: '500' }}
                          >
                            🗺️ Directions
                          </button>
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                );
              })}
            </MapContainer>
          )}
        </motion.div>
        {/* ── End Map Area ── */}

      </div>
      {/* ── End Main Content ── */}

    </div>
    // ── End outermost wrapper ──
  );
}