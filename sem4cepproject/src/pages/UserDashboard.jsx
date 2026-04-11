import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { categories } from '../data/data';
import { searchMedicines, createBooking } from '../api';

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
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 36" width="${isUser ? 32 : 28}" height="${isUser ? 48 : 42}">
      <path d="M12 0C5.4 0 0 5.4 0 12c0 9 12 24 12 24s12-15 12-24C24 5.4 18.6 0 12 0z" fill="${color}" stroke="#fff" stroke-width="1.5"/>
      <circle cx="12" cy="12" r="${isUser ? 6 : 5}" fill="#fff"/>
    </svg>
  `;
  return L.divIcon({
    html: svg,
    className: '',
    iconSize: isUser ? [32, 48] : [28, 42],
    iconAnchor: isUser ? [16, 48] : [14, 42],
    popupAnchor: [0, isUser ? -48 : -42],
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

export default function UserDashboard() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const [hasSearched, setHasSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mapPins, setMapPins] = useState([]);

  // Geolocation states
  const [userPos, setUserPos] = useState([19.0760, 72.8777]); // Default Mumbai
  const [locationGranted, setLocationGranted] = useState(false);

  // Directions state
  const [routePath, setRoutePath] = useState(null);
  const [mapBounds, setMapBounds] = useState(null);
  const [routeDetails, setRouteDetails] = useState(null); // ✅ FIX: was missing, caused blank page

  // Booking states
  const [showBookModal, setShowBookModal] = useState(false);
  const [bookingPharmacy, setBookingPharmacy] = useState(null);
  const [bookingQuantities, setBookingQuantities] = useState({});
  const [bookingLoading, setBookingLoading] = useState(false);

  // QR states
  const [qrToken, setQrToken] = useState(null);

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

    setHasSearched(true);
    setLoading(true);
    setRoutePath(null);
    setMapBounds(null);
    setRouteDetails(null); // clear route on new search

    try {
      const lat = locationGranted ? userPos[0] : null;
      const lng = locationGranted ? userPos[1] : null;

      const results = await searchMedicines(q, cat, lat, lng);
      setMapPins(results || []);
    } catch (err) {
      alert("Failed to fetch medicines: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    triggerSearch();
  };

  const handleDirections = async (pin) => {
    if (!locationGranted || !userPos) {
      alert("Live location is required to calculate directions.");
      return;
    }

    try {
      const uLat = userPos[0];
      const uLng = userPos[1];
      const pLat = pin.lat;
      const pLng = pin.lng;

      // OSRM routing API (lng,lat order)
      const res = await fetch(
        `https://router.project-osrm.org/route/v1/driving/${uLng},${uLat};${pLng},${pLat}?overview=full&geometries=geojson&steps=true`
      );
      const data = await res.json();

      if (data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        // GeoJSON uses [lng, lat], Leaflet Polyline needs [lat, lng]
        const coords = route.geometry.coordinates.map(c => [c[1], c[0]]);
        setRoutePath(coords);
        // Fit bounds to the route
        setMapBounds([userPos, [pLat, pLng]]);

        // Extract basic route details
        const distanceKm = (route.distance / 1000).toFixed(1);
        const durationMin = Math.ceil(route.duration / 60);

        let steps = [];
        if (route.legs && route.legs[0] && route.legs[0].steps) {
          steps = route.legs[0].steps.map(s => {
            const maneuver = s.maneuver || {};
            const type = maneuver.type || '';
            const modifier = maneuver.modifier || '';
            const name = s.name || '';
            let text = type;
            if (modifier && type !== modifier) text += ` ${modifier}`;
            if (name && maneuver.type !== 'arrive') text += ` onto ${name}`;
            return text.replace(/_/g, ' ');
          });
        }

        setRouteDetails({
          distance: distanceKm,
          duration: durationMin,
          steps: steps,
          destination: pin.name || "Pharmacy"
        });

      } else {
        alert("Could not calculate a route on the map.");
      }
    } catch (err) {
      console.error(err);
      alert("Error fetching directions from OSRM.");
    }
  };

  const openBookingSetup = (pin) => {
    setBookingPharmacy(pin);
    const initialQty = {};
    pin.allMedicines.forEach(m => {
      initialQty[m.medicine.id] = m.stock > 0 ? 1 : 0;
    });
    setBookingQuantities(initialQty);
    setQrToken(null);
    setShowBookModal(true);
  };

  const submitBooking = async () => {
    const items = [];
    bookingPharmacy.allMedicines.forEach(m => {
      const qty = bookingQuantities[m.medicine.id] || 0;
      if (qty > 0) {
        items.push({
          medicine_id: m.medicine.id,
          quantity: qty
        });
      }
    });

    if (items.length === 0) {
      alert("Please select at least 1 medicine to book.");
      return;
    }

    try {
      setBookingLoading(true);
      const res = await createBooking(bookingPharmacy.pharmacy.id, items);
      setQrToken(res.qr_token);
    } catch (err) {
      alert("Failed to create booking: " + err.message);
    } finally {
      setBookingLoading(false);
    }
  };

  const totalMatchedMeds = new Set();
  mapPins.forEach(pin => {
    pin.allMedicines.forEach(m => totalMatchedMeds.add(m.medicine.id));
  });

  return (
    <div style={{ padding: 'var(--sp-xl)', width: '98%', maxWidth: '1800px', margin: '0 auto', height: 'calc(100vh - 80px)', display: 'flex', flexDirection: 'column' }}>
      <div className="animate-in" style={{ flexShrink: 0 }}>
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
            {loading ? 'Searching...' : 'Search'}
          </button>
        </form>

        {hasSearched && !loading && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--sp-md)', flexWrap: 'wrap', gap: 'var(--sp-sm)' }}>
            <div style={{ fontSize: 'var(--fs-sm)', color: 'var(--clr-text-muted)' }}>
              Found <strong style={{ color: 'var(--clr-text)' }}>{totalMatchedMeds.size}</strong> medicine(s)
              across <strong style={{ color: 'var(--clr-text)' }}>{mapPins.length}</strong> pharmacies
            </div>
            <div style={{ display: 'flex', gap: 'var(--sp-md)', fontSize: 'var(--fs-xs)', color: 'var(--clr-text-muted)' }}>
              <span>🔵 You</span>
              <span>🟢 In Stock (≥10)</span>
              <span>🟡 Low (1-9)</span>
              <span>🔴 Out of Stock</span>
            </div>
          </div>
        )}
      </div>

      <div style={{ flex: 1, display: 'flex', gap: '1rem', overflow: 'hidden', minHeight: '500px' }}>

        {/* Sidebar List */}
        {hasSearched && mapPins.length > 0 && (
          <div style={{ width: '350px', display: 'flex', flexDirection: 'column', gap: '1rem', overflowY: 'auto', paddingRight: '10px' }}>
            {mapPins.map(pin => (
              <div key={pin.pharmacy.id} style={{ background: 'var(--clr-surface)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--clr-border)', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                  <h3 style={{ margin: 0, fontSize: '1rem' }}>{pin.pharmacy.name}</h3>
                  {pin.pharmacy.distance !== null && (
                    <span className="badge badge-primary">{pin.pharmacy.distance} km</span>
                  )}
                </div>
                <p style={{ fontSize: '0.8rem', color: 'var(--clr-text-muted)', marginBottom: '0.5rem' }}>📍 {pin.pharmacy.address}</p>

                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                  <button className="btn btn-primary btn-sm" onClick={() => openBookingSetup(pin)}>🛒 Book</button>
                  <button className="btn btn-secondary btn-sm" onClick={() => handleDirections(pin.pharmacy)}>🗺️ Route</button>
                  <a href={`tel:${pin.pharmacy.phone}`} className="btn btn-ghost btn-sm">📞 Call</a>
                </div>

                <div>
                  {pin.allMedicines.map((m, i) => (
                    <div key={i} style={{ borderTop: i > 0 ? '1px solid var(--clr-border)' : 'none', padding: '0.5rem 0', fontSize: '0.85rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '500' }}>
                        <span>{m.medicine.name}</span>
                        <span>₹{m.price || 0}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.25rem' }}>
                        {getStockBadge(m.stock)}
                        {m.medicine.rxRequired && <span className="badge badge-warning">Rx</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Map Area */}
        <div style={{ flex: 1, borderRadius: 'var(--radius-lg)', overflow: 'hidden', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', position: 'relative' }}>

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
            <div className="loading-spinner" style={{ margin: '5rem auto' }} />
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
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <MapController
                center={locationGranted ? userPos : [mapPins[0].pharmacy.lat, mapPins[0].pharmacy.lng]}
                bounds={mapBounds}
              />

              {routePath && <Polyline positions={routePath} color="#2563eb" weight={5} opacity={0.7} />}

              {locationGranted && (
                <Marker position={userPos} icon={blueUserIcon}>
                  <Popup><strong>📍 You are here</strong></Popup>
                </Marker>
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
                      <div className="medicine-popup">
                        <h3>{pin.pharmacy.name}</h3>
                        <p className="popup-address">📍 {pin.pharmacy.address}</p>
                        <div className="popup-actions" style={{ marginTop: '0.5rem' }}>
                          <button className="btn btn-primary btn-sm" onClick={() => openBookingSetup(pin)}>🛒 Book Menu</button>
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                );
              })}
            </MapContainer>
          )}
        </div>
      </div>

      {/* Booking Modal */}
      {showBookModal && bookingPharmacy && (
        <div className="modal-overlay" onClick={() => !qrToken && setShowBookModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px' }}>

            {!qrToken ? (
              <>
                <h2>Book at {bookingPharmacy.pharmacy.name}</h2>
                <p style={{ color: 'var(--clr-text-muted)', marginBottom: '1rem', fontSize: '0.9rem' }}>
                  Select the quantities you wish to reserve. The pharmacy will hold these for 30 minutes.
                </p>

                <div style={{ maxHeight: '300px', overflowY: 'auto', marginBottom: '1rem' }}>
                  {bookingPharmacy.allMedicines.map(m => (
                    <div key={m.medicine.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', borderBottom: '1px solid var(--clr-border)' }}>
                      <div>
                        <div style={{ fontWeight: '600' }}>{m.medicine.name}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--clr-text-muted)' }}>₹{m.price || 0} (Stock: {m.stock})</div>
                      </div>
                      <div>
                        <input
                          type="number"
                          min="0"
                          max={m.stock}
                          className="input-field"
                          style={{ width: '80px', padding: '0.25rem' }}
                          value={bookingQuantities[m.medicine.id] || 0}
                          onChange={(e) => {
                            const val = Math.min(Math.max(0, parseInt(e.target.value) || 0), m.stock);
                            setBookingQuantities(prev => ({ ...prev, [m.medicine.id]: val }));
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="modal-actions">
                  <button className="btn btn-ghost" onClick={() => setShowBookModal(false)}>Cancel</button>
                  <button className="btn btn-primary" onClick={submitBooking} disabled={bookingLoading}>
                    {bookingLoading ? 'Reserving...' : 'Confirm Booking'}
                  </button>
                </div>
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: '1rem' }}>
                <h2 style={{ color: 'var(--clr-success)' }}>Booking Confirmed!</h2>
                <p>Present the QR code below to the pharmacist within 30 minutes.</p>

                <div style={{ margin: '2rem auto', background: '#fff', padding: '1rem', display: 'inline-block', borderRadius: '8px' }}>
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${qrToken}`}
                    alt="Booking QR Token"
                    width="200"
                    height="200"
                  />
                </div>

                <div style={{ fontWeight: 'bold', fontSize: '1.2rem', marginBottom: '1rem' }}>
                  Token: <code>{String(qrToken).split('-')[0]}</code>
                </div>

                <button className="btn btn-primary" style={{ width: '100%' }} onClick={() => setShowBookModal(false)}>
                  Close
                </button>
              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
}