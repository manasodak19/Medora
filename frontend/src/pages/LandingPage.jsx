import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, MapPin, Map as MapIcon, PhoneCall, ShieldCheck, BadgeCheck, Stethoscope, Pill } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import MotionContainer from '../components/common/MotionContainer';

export default function LandingPage() {
  const [currentMedicineIndex, setCurrentMedicineIndex] = useState(0);
  const medicines = ["Paracetamol", "Insulin", "Amoxicillin", "Ibuprofen"];

  useEffect(() => {
    const intervalId = setInterval(() => {
      setCurrentMedicineIndex((prev) => (prev + 1) % medicines.length);
    }, 3500);
    return () => clearInterval(intervalId);
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.25,
        delayChildren: 0.3
      }
    }
  };

  const itemVariants = {
    hidden: { y: 30, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] } }
  };

  return (
    <div className="landing-page">
      {/* Hero Section */}
      <section className="hero">
        <motion.div 
          className="hero-content"
          initial="hidden"
          animate="visible"
          variants={containerVariants}
        >
          <motion.h1 variants={itemVariants}>
            Find Your <br />
            <AnimatePresence mode="wait">
              <motion.span
                key={medicines[currentMedicineIndex]}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.6 }}
                style={{ display: 'inline-block', color: 'var(--clr-primary)' }}
              >
                {medicines[currentMedicineIndex]}
              </motion.span>
            </AnimatePresence>
            <span className="typing-cursor"></span><br />
            Right on Time
          </motion.h1>
          <motion.p variants={itemVariants}>
            MEDORA connects you with nearby pharmacies in real-time. Search any
            medicine, see live stock availability on a map, and get directions
            — all in one place.
          </motion.p>
          <motion.div className="hero-buttons" variants={itemVariants}>
            <Link to="/signup" className="btn btn-primary btn-lg">
              🚀 Create Account
            </Link>
            <Link to="/signin" className="btn btn-secondary btn-lg">
              Sign In
            </Link>
          </motion.div>
        </motion.div>

        {/* Hero Mockup Element */}
        <motion.div 
          className="hero-mockup-container"
          initial={{ opacity: 0, scale: 0.9, x: 50, rotate: 5 }}
          animate={{ opacity: 1, scale: 1, x: 0, rotate: 0 }}
          transition={{ duration: 1, ease: "easeOut", delay: 0.4 }}
        >
          <motion.div 
            className="hero-mockup"
            animate={{ 
              y: [0, -15, 0],
              rotate: [0, 1, 0]
            }}
            transition={{ 
              duration: 5, 
              repeat: Infinity, 
              ease: "easeInOut" 
            }}
          >
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
            <motion.div 
              className="mockup-badge"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <MapPin size={18} color="var(--clr-primary)" />
              <span>Navigate</span>
            </motion.div>
          </motion.div>
        </motion.div>
      </section>

      {/* How It Works */}
      <section className="how-it-works">
        <MotionContainer>
          <h2>How It Works</h2>
        </MotionContainer>
        <div className="steps-grid">
          <MotionContainer delay={0.1} className="step-item">
            <div className="step-number">1</div>
            <h3>Search Medicine</h3>
            <p>Type the name of any medicine or browse by category to find what you need.</p>
          </MotionContainer>
          <MotionContainer delay={0.3} className="step-item">
            <div className="step-number">2</div>
            <h3>View Nearby Stock</h3>
            <p>See which nearby pharmacies have it in stock with live map pins and distance info.</p>
          </MotionContainer>
          <MotionContainer delay={0.5} className="step-item">
            <div className="step-number">3</div>
            <h3>Book & Collect</h3>
            <p>Reserve your medicine, get a QR code, and pick it up from the pharmacy within 30 minutes.</p>
          </MotionContainer>
        </div>
      </section>

      {/* Features Section */}
      <section className="features">
        <MotionContainer>
          <h2>Why Choose MEDORA?</h2>
        </MotionContainer>
        <div className="features-grid">
          {[
            { icon: <Search size={28} />, title: "Smart Search", desc: "Search for any medicine and instantly see which nearby pharmacies have it in stock." },
            { icon: <MapIcon size={28} />, title: "Live Map View", desc: "See pharmacies on an interactive map with color-coded pins showing real-time stock levels." },
            { icon: <PhoneCall size={28} />, title: "Quick Actions", desc: "Call the pharmacy directly or get Google Maps directions with a single tap." },
            { icon: <Stethoscope size={28} />, title: "Pharmacist Portal", desc: "Pharmacists can manage their inventory, update stock levels, and reach more customers." },
            { icon: <ShieldCheck size={28} />, title: "Rx Awareness", desc: "Medicines requiring a prescription are clearly marked with warnings." },
            { icon: <BadgeCheck size={28} />, title: "Verified Pharmacies", desc: "Every pharmacy on MEDORA goes through a license verification process." }
          ].map((feature, idx) => (
            <MotionContainer 
              key={idx} 
              delay={idx * 0.1} 
              className="feature-card"
              direction="up"
            >
              <motion.div 
                className="feature-icon"
                whileHover={{ scale: 1.1, rotate: 5, backgroundColor: 'var(--clr-primary-bg)' }}
              >
                {feature.icon}
              </motion.div>
              <h3>{feature.title}</h3>
              <p>{feature.desc}</p>
            </MotionContainer>
          ))}
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
