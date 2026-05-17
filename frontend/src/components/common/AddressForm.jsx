import React, { useState } from 'react';
import { MapPin, Phone, User, Home, Map as MapIcon, Hash } from 'lucide-react';

const AddressForm = ({ onSubmit, initialData = {}, onCancel }) => {
  const [formData, setFormData] = useState({
    full_name: initialData.full_name || '',
    phone_number: initialData.phone_number || '',
    house_number: initialData.house_number || '',
    street: initialData.street || '',
    city: initialData.city || '',
    state: initialData.state || '',
    pincode: initialData.pincode || '',
    is_default: initialData.is_default || false,
    lat: initialData.lat || 0, // In a real app, you'd use a map picker here
    lng: initialData.lng || 0,
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} style={{ padding: 'var(--sp-lg)', background: 'var(--clr-surface)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--clr-border)', boxShadow: 'var(--shadow-sm)' }}>
      <h3 style={{ margin: '0 0 var(--sp-lg) 0', fontSize: '1.25rem', color: 'var(--clr-text)' }}>Delivery Address</h3>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--sp-md)' }}>
        <div style={{ gridColumn: 'span 2', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          <label style={{ fontSize: '0.9rem', fontWeight: '500', color: 'var(--clr-text)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <User size={16} color="var(--clr-text-muted)" /> Full Name
          </label>
          <input
            required
            type="text"
            name="full_name"
            value={formData.full_name}
            onChange={handleChange}
            className="input-field"
            placeholder="John Doe"
          />
        </div>

        <div style={{ gridColumn: 'span 2', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          <label style={{ fontSize: '0.9rem', fontWeight: '500', color: 'var(--clr-text)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Phone size={16} color="var(--clr-text-muted)" /> Phone Number
          </label>
          <input
            required
            type="tel"
            name="phone_number"
            value={formData.phone_number}
            onChange={handleChange}
            className="input-field"
            placeholder="+1 234 567 8900"
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          <label style={{ fontSize: '0.9rem', fontWeight: '500', color: 'var(--clr-text)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Home size={16} color="var(--clr-text-muted)" /> House/Flat No.
          </label>
          <input
            required
            type="text"
            name="house_number"
            value={formData.house_number}
            onChange={handleChange}
            className="input-field"
            placeholder="Apt 4B"
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          <label style={{ fontSize: '0.9rem', fontWeight: '500', color: 'var(--clr-text)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <MapPin size={16} color="var(--clr-text-muted)" /> Street/Area
          </label>
          <input
            required
            type="text"
            name="street"
            value={formData.street}
            onChange={handleChange}
            className="input-field"
            placeholder="Main Street"
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          <label style={{ fontSize: '0.9rem', fontWeight: '500', color: 'var(--clr-text)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <MapIcon size={16} color="var(--clr-text-muted)" /> City
          </label>
          <input
            required
            type="text"
            name="city"
            value={formData.city}
            onChange={handleChange}
            className="input-field"
            placeholder="City Name"
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          <label style={{ fontSize: '0.9rem', fontWeight: '500', color: 'var(--clr-text)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <MapIcon size={16} color="var(--clr-text-muted)" /> State
          </label>
          <input
            required
            type="text"
            name="state"
            value={formData.state}
            onChange={handleChange}
            className="input-field"
            placeholder="State Name"
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          <label style={{ fontSize: '0.9rem', fontWeight: '500', color: 'var(--clr-text)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Hash size={16} color="var(--clr-text-muted)" /> Pincode
          </label>
          <input
            required
            type="text"
            name="pincode"
            value={formData.pincode}
            onChange={handleChange}
            className="input-field"
            placeholder="123456"
          />
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', marginTop: 'auto', marginBottom: '0.5rem', minWidth: '180px' }}>
          <input
            type="checkbox"
            id="is_default"
            name="is_default"
            checked={formData.is_default}
            onChange={handleChange}
            style={{ width: '16px', height: '16px', accentColor: 'var(--clr-primary)' }}
          />
          <label htmlFor="is_default" style={{ marginLeft: '0.5rem', fontSize: '0.9rem', color: 'var(--clr-text)' }}>
            Set as default address
          </label>
        </div>
      </div>

      <div style={{ marginTop: 'var(--sp-xl)', display: 'flex', gap: 'var(--sp-sm)', justifyContent: 'flex-end' }}>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="btn btn-secondary"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          className="btn btn-primary"
        >
          Save Address
        </button>
      </div>
    </form>
  );
};

export default AddressForm;
