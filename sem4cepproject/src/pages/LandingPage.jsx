import { Link } from 'react-router-dom';

export default function LandingPage() {
  return (
    <div className="landing-page">
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-content">
          <h1>
            Find Your Medicine,{' '}
            <span>Right on Time</span>
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
      </section>

      {/* Features Section */}
      <section className="features">
        <h2>Why Choose MEDORA?</h2>
        <div className="features-grid">
          <div className="feature-card" style={{ animationDelay: '0.1s' }}>
            <div className="feature-icon">🔍</div>
            <h3>Smart Search</h3>
            <p>
              Search for any medicine and instantly see which nearby pharmacies
              have it in stock. Filter by category to narrow your results.
            </p>
          </div>

          <div className="feature-card" style={{ animationDelay: '0.2s' }}>
            <div className="feature-icon">🗺️</div>
            <h3>Live Map View</h3>
            <p>
              See pharmacies on an interactive map with color-coded pins
              showing real-time stock levels — green, yellow, or red.
            </p>
          </div>

          <div className="feature-card" style={{ animationDelay: '0.3s' }}>
            <div className="feature-icon">📞</div>
            <h3>Quick Actions</h3>
            <p>
              Call the pharmacy directly or get Google Maps directions with a
              single tap. No more calling multiple stores.
            </p>
          </div>

          <div className="feature-card" style={{ animationDelay: '0.4s' }}>
            <div className="feature-icon">💊</div>
            <h3>Pharmacist Portal</h3>
            <p>
              Pharmacists can manage their inventory, update stock levels, and
              reach more customers through the MEDORA platform.
            </p>
          </div>

          <div className="feature-card" style={{ animationDelay: '0.5s' }}>
            <div className="feature-icon">🔒</div>
            <h3>Rx Awareness</h3>
            <p>
              Medicines requiring a prescription are clearly marked with
              warnings, promoting responsible medication practices.
            </p>
          </div>

          <div className="feature-card" style={{ animationDelay: '0.6s' }}>
            <div className="feature-icon">🏥</div>
            <h3>Verified Pharmacies</h3>
            <p>
              Every pharmacy on MEDORA goes through a license verification
              process managed by our admin team.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        textAlign: 'center',
        padding: 'var(--sp-xl)',
        color: 'var(--clr-text-muted)',
        fontSize: 'var(--fs-sm)',
        borderTop: '1px solid var(--clr-border)',
      }}>
        © 2026 MEDORA — Medicine at the Right Time. All rights reserved.
      </footer>
    </div>
  );
}
