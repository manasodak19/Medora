import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, MapPin, Map as MapIcon, PhoneCall, ShieldCheck, BadgeCheck, Stethoscope, Pill } from 'lucide-react';

export default function LandingPage() {
  const [currentMedicineIndex, setCurrentMedicineIndex] = useState(0);
  const medicines = ["Paracetamol", "Insulin", "Amoxicillin", "Ibuprofen"];

  useEffect(() => {
    const intervalId = setInterval(() => {
      setCurrentMedicineIndex((prev) => (prev + 1) % medicines.length);
    }, 2500);
    return () => clearInterval(intervalId);
  }, []);

  return (
    <div className="landing-page">
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-content">
          <h1>
            Find Your <br />
            <span>{medicines[currentMedicineIndex]}</span><span className="typing-cursor"></span><br />
            Right on Time
          </h1>
          <p>
            MEDORA connects you with nearby pharmacies in real-time. Search any
            medicine, see live stock availability on a map, and get directions
            — all in one place.
          </p>
          <div className="hero-buttons">
            <Link to="/signup" className="btn btn-primary btn-lg">
              🚀 Create Account
            </Link>
            <Link to="/signin" className="btn btn-secondary btn-lg">
              Sign In
            </Link>
          </div>
        </div>

        {/* Hero Mockup Element */}
        <div className="hero-mockup-container">
          <div className="hero-mockup">
            <div className="mockup-header">
              <span className="mockup-status">
                <span className="pulse-dot"></span> In Stock Nearby
              </span>
              <span style={{ color: 'var(--clr-text-light)', fontSize: 'var(--fs-xs)' }}>Just now</span>
            </div>
            <div className="mockup-body">
              <div className="mockup-icon">
                <Pill size={24} />
              </div>
              <div className="mockup-info">
                <h4>{medicines[currentMedicineIndex]}</h4>
                <p>City Pharmacy • 0.8 km away</p>
              </div>
            </div>
            <div className="mockup-badge">
              <MapPin size={18} color="var(--clr-primary)" />
              <span>Navigate</span>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="how-it-works">
        <h2>How It Works</h2>
        <div className="steps-grid">
          <div className="step-item animate-in" style={{ animationDelay: '0.1s' }}>
            <div className="step-number">1</div>
            <h3>Search Medicine</h3>
            <p>Type the name of any medicine or browse by category to find what you need.</p>
          </div>
          <div className="step-item animate-in" style={{ animationDelay: '0.3s' }}>
            <div className="step-number">2</div>
            <h3>View Nearby Stock</h3>
            <p>See which nearby pharmacies have it in stock with live map pins and distance info.</p>
          </div>
          <div className="step-item animate-in" style={{ animationDelay: '0.5s' }}>
            <div className="step-number">3</div>
            <h3>Book & Collect</h3>
            <p>Reserve your medicine, get a QR code, and pick it up from the pharmacy within 30 minutes.</p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features">
        <h2>Why Choose MEDORA?</h2>
        <div className="features-grid">
          <div className="feature-card" style={{ animationDelay: '0.1s' }}>
            <div className="feature-icon"><Search size={28} /></div>
            <h3>Smart Search</h3>
            <p>
              Search for any medicine and instantly see which nearby pharmacies
              have it in stock. Filter by category to narrow your results.
            </p>
          </div>

          <div className="feature-card" style={{ animationDelay: '0.2s' }}>
            <div className="feature-icon"><MapIcon size={28} /></div>
            <h3>Live Map View</h3>
            <p>
              See pharmacies on an interactive map with color-coded pins
              showing real-time stock levels — green, yellow, or red.
            </p>
          </div>

          <div className="feature-card" style={{ animationDelay: '0.3s' }}>
            <div className="feature-icon"><PhoneCall size={28} /></div>
            <h3>Quick Actions</h3>
            <p>
              Call the pharmacy directly or get Google Maps directions with a
              single tap. No more calling multiple stores.
            </p>
          </div>

          <div className="feature-card" style={{ animationDelay: '0.4s' }}>
            <div className="feature-icon"><Stethoscope size={28} /></div>
            <h3>Pharmacist Portal</h3>
            <p>
              Pharmacists can manage their inventory, update stock levels, and
              reach more customers through the MEDORA platform.
            </p>
          </div>

          <div className="feature-card" style={{ animationDelay: '0.5s' }}>
            <div className="feature-icon"><ShieldCheck size={28} /></div>
            <h3>Rx Awareness</h3>
            <p>
              Medicines requiring a prescription are clearly marked with
              warnings, promoting responsible medication practices.
            </p>
          </div>

          <div className="feature-card" style={{ animationDelay: '0.6s' }}>
            <div className="feature-icon"><BadgeCheck size={28} /></div>
            <h3>Verified Pharmacies</h3>
            <p>
              Every pharmacy on MEDORA goes through a license verification
              process managed by our admin team.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <p>
          © 2026 <span className="footer-brand">MEDORA</span> — Medicine at the Right Time. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
