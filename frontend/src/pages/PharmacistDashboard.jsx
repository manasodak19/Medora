import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { categories } from '../data/data';
import api, { getMyInventory, addInventoryItem, updateInventoryItem, deleteInventoryItem, addInventoryBatch } from '../services/api';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { motion, AnimatePresence } from 'framer-motion';
import MotionContainer from '../components/common/MotionContainer';
import toast from 'react-hot-toast';
import { SkeletonStats, SkeletonTable } from '../components/common/Skeleton';

const MEDICINE_TYPES = ["Tablet", "Syrup", "Capsule", "Drops", "Injection", "Cream", "Other"];

export default function PharmacistDashboard() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('inventory');
  const navigate = useNavigate();
  
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    name: '',
    type: 'Tablet',
    category: categories[0],
    stock: '',
    price: '',
    expiryDate: '',
    rxRequired: false,
  });

  const fileInputRef = useRef(null);

  useEffect(() => {
    loadInventory();
  }, []);

  const loadInventory = async () => {
    try {
      setLoading(true);
      const data = await getMyInventory();
      setItems(data || []);
    } catch (err) {
      toast.error('Failed to load inventory: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setForm({ name: '', type: 'Tablet', category: categories[0], stock: '', price: '', expiryDate: '', rxRequired: false });
    setEditingId(null);
  };

  const openAdd = () => {
    resetForm();
    setShowModal(true);
  };

  const openEdit = (item) => {
    setForm({
      name: item.name,
      type: item.type || 'Tablet',
      category: item.category,
      stock: item.stock.toString(),
      price: item.price ? item.price.toString() : '0',
      expiryDate: item.expiryDate,
      rxRequired: item.rxRequired,
    });
    setEditingId(item.id);
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.stock || !form.expiryDate) return;

    const payload = {
      name: form.name.trim(),
      type: form.type,
      category: form.category,
      stock: parseInt(form.stock, 10),
      price: parseFloat(form.price) || 0,
      expiryDate: form.expiryDate,
      rxRequired: form.rxRequired,
    };

    try {
      if (editingId) {
        // Update
        const updated = await updateInventoryItem(editingId, payload);
        setItems(prev => prev.map(item => item.id === editingId ? updated : item));
      } else {
        // Add
        const added = await addInventoryItem(payload);
        setItems(prev => [...prev, added]);
      }
      toast.success(editingId ? 'Medicine updated!' : 'Medicine added!');
      setShowModal(false);
      resetForm();
    } catch (err) {
      toast.error('Operation failed: ' + err.message);
    }
  };

  const handleDelete = async (id) => {
    if (confirm('Are you sure you want to delete this medicine?')) {
      try {
        await deleteInventoryItem(id);
        setItems(prev => prev.filter(item => item.id !== id));
        toast.success('Medicine deleted.');
      } catch (err) {
        toast.error('Delete failed: ' + err.message);
      }
    }
  };

  const getStockBadge = (stock) => {
    if (stock === 0) return <span className="badge badge-danger">🔴 Out of Stock</span>;
    if (stock < 10) return <span className="badge badge-warning">🟡 Low ({stock})</span>;
    return <span className="badge badge-success">🟢 {stock}</span>;
  };

  // ── CSV Import / Export ──────────────────────────────────────

  const handleExportCSV = () => {
    const headers = ["Name", "Type", "Category", "Stock", "Price", "Expiry Date", "Rx Required"];
    const rows = items.map(item => [
      `"${item.name.replace(/"/g, '""')}"`,
      `"${item.type}"`,
      `"${item.category}"`,
      item.stock,
      item.price || 0,
      `"${item.expiryDate}"`,
      item.rxRequired ? "Yes" : "No"
    ]);
    
    const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    toast.success('Exporting CSV...');
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `medora_inventory_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImportCSV = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target.result;
      const lines = text.split('\n').filter(line => line.trim() !== '');
      if (lines.length < 2) return toast.error('Invalid CSV: No data rows found.');
      
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
      
      const idxName = headers.indexOf('name');
      const idxType = headers.indexOf('type');
      const idxCategory = headers.indexOf('category');
      const idxStock = headers.indexOf('stock');
      const idxPrice = headers.indexOf('price');
      const idxExpiry = headers.indexOf('expiry date');
      const idxRx = headers.indexOf('rx required');

      if (idxName === -1 || idxStock === -1 || idxExpiry === -1) {
        return toast.error('CSV must at least contain "Name", "Stock", and "Expiry Date" columns.');
      }

      const payloadArray = [];
      for (let i = 1; i < lines.length; i++) {
        // Simple column split ignoring commas inside quotes
        const match = lines[i].match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g);
        if (!match) continue;
        const cols = match.map(c => c.trim().replace(/^"|"$/g, ''));
        
        if (cols.length < 3) continue;

        payloadArray.push({
          name: cols[idxName],
          type: idxType !== -1 && cols[idxType] ? cols[idxType] : 'Tablet',
          category: idxCategory !== -1 && cols[idxCategory] ? cols[idxCategory] : 'Other',
          stock: parseInt(cols[idxStock] || '0', 10),
          price: parseFloat(idxPrice !== -1 ? cols[idxPrice] : '0') || 0,
          expiryDate: cols[idxExpiry],
          rxRequired: idxRx !== -1 ? (cols[idxRx].toLowerCase() === 'yes' || cols[idxRx].toLowerCase() === 'true') : false
        });
      }

      if (payloadArray.length === 0) return toast.error('No valid rows to process.');

      try {
        setLoading(true);
        await addInventoryBatch(payloadArray);
        toast.success(`Successfully imported ${payloadArray.length} items!`);
        await loadInventory(); 
      } catch (err) {
        toast.error('CSV Import Failed: ' + err.message);
        setLoading(false);
      }
    };
    reader.readAsText(file);
    e.target.value = null; 
  };

  // ── Metrics Calculation ──────────────────────────────────────
  const today = new Date();

  const isExpiringSoon = (expiryStr) => {
    const expDate = new Date(expiryStr);
    const diffTime = expDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays >= 0 && diffDays <= 30; // Within 30 days
  };

  const totalItems = items.length;
  const totalStock = items.reduce((sum, item) => sum + item.stock, 0);
  const lowStockCount = items.filter(i => i.stock > 0 && i.stock < 10).length;
  const outOfStockCount = items.filter(i => i.stock === 0).length;
  const expiringSoonCount = items.filter(i => isExpiringSoon(i.expiryDate)).length;

  const statCards = [
    { label: 'Total Unique items', value: totalItems, icon: '📦', bg: 'var(--clr-primary-bg)', color: 'var(--clr-primary)' },
    { label: 'Total Units Stocked', value: totalStock, icon: '🧮', bg: 'var(--clr-success-bg)', color: 'var(--clr-success)' },
    { label: 'Low Stock Alerts', value: lowStockCount, icon: '⚠️', bg: 'var(--clr-warning-bg)', color: 'var(--clr-warning)' },
    { label: 'Out of Stock', value: outOfStockCount, icon: '🔻', bg: 'var(--clr-danger-bg)', color: 'var(--clr-danger)' },
    { label: 'Expiring Soon (30d)', value: expiringSoonCount, icon: '⏱️', bg: '#ffe8e8', color: '#e53e3e' },
  ];

  // Note: Full page loading state is handled below per section for better UX

  return (
    <div className="dashboard-layout">
      {/* Sidebar */}
      <aside className="dashboard-sidebar">
        <ul className="sidebar-nav">
          <motion.li 
            className={activeTab === 'inventory' ? 'active' : ''} 
            onClick={() => setActiveTab('inventory')}
            whileHover={{ x: 5 }}
            whileTap={{ scale: 0.95 }}
          >
            📦 Inventory
          </motion.li>
          <motion.li 
            className={activeTab === 'orders' ? 'active' : ''} 
              onClick={() => navigate('/qr-scan')}
              whileHover={{ x: 5 }}
              whileTap={{ scale: 0.95 }}

          >
            📷 Verify Orders
          </motion.li>
          <motion.li 
            className={activeTab === 'agents' ? 'active' : ''} 
            onClick={() => setActiveTab('agents')}
            whileHover={{ x: 5 }}
            whileTap={{ scale: 0.95 }}
          >
            🛵 Delivery Agents
          </motion.li>
          <motion.li 
            className={activeTab === 'history' ? 'active' : ''} 
            onClick={() => setActiveTab('history')}
            whileHover={{ x: 5 }}
            whileTap={{ scale: 0.95 }}
          >
            📋 Order History
          </motion.li>
        </ul>
      </aside>

      {/* Main */}
      <main className="dashboard-main">
        {activeTab === 'inventory' && (
          <>
            <MotionContainer direction="up" distance={20}>
          <h2>Inventory Dashboard</h2>

          {/* Dynamic Metrics Grid */}
          <div className="stats-grid" style={{ marginBottom: 'var(--sp-lg)' }}>
            {loading ? (
              <SkeletonStats />
            ) : (
              statCards.map((card, i) => (
                <MotionContainer key={card.label} delay={i * 0.1}>
                  <motion.div 
                    className="stat-card" 
                    whileHover={{ scale: 1.05, translateY: -5 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <div className="stat-icon" style={{ background: card.bg, color: card.color }}>
                      {card.icon}
                    </div>
                    <div className="stat-content">
                      <h3>{card.label}</h3>
                      <div className="stat-number" style={{ color: card.value > 0 && card.label.includes('Expire') ? card.color : 'inherit' }}>
                        {card.value}
                      </div>
                    </div>
                  </motion.div>
                </MotionContainer>
              ))
            )}
          </div>

          <div className="section-header">
            <h2>Manage Stock List</h2>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input 
                type="file" 
                ref={fileInputRef} 
                style={{ display: 'none' }} 
                accept=".csv"
                onChange={handleImportCSV} 
              />
              <button className="btn btn-ghost" onClick={() => fileInputRef.current.click()}>
                📥 Import CSV
              </button>
              <button className="btn btn-ghost" onClick={handleExportCSV}>
                📤 Export CSV
              </button>
              <button className="btn btn-primary" onClick={openAdd}>
                + Add Medicine
              </button>
            </div>
          </div>

          {loading ? (
            <SkeletonTable rows={8} cols={8} />
          ) : items.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📦</div>
              <p>No medicines in inventory. Click <strong>Add Medicine</strong> or <strong>Import CSV</strong> to get started.</p>
            </div>
          ) : (
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Medicine Name</th>
                    <th>Type</th>
                    <th>Price (₹)</th>
                    <th>Stock</th>
                    <th>Category</th>
                    <th>Expiry Date</th>
                    <th>Rx Required</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, idx) => {
                    const expiring = isExpiringSoon(item.expiryDate);
                    return (
                      <motion.tr 
                        key={item.id}
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ 
                          delay: idx * 0.08,
                          duration: 0.8,
                          ease: [0.22, 1, 0.36, 1]
                        }}
                      >
                        <td><strong>{item.name}</strong></td>
                        <td>
                          <span style={{ fontSize: 'var(--fs-xs)', background: 'var(--clr-surface-alt)', padding: '2px 6px', borderRadius: '4px' }}>
                            {item.type}
                          </span>
                        </td>
                        <td>₹{item.price || 0}</td>
                        <td>{getStockBadge(item.stock)}</td>
                        <td>
                          <span className="badge badge-primary">{item.category}</span>
                        </td>
                        <td style={expiring ? { color: 'var(--clr-danger)', fontWeight: 'bold' } : {}}>
                          {item.expiryDate} {expiring && '⚠️'}
                        </td>
                        <td>
                          {item.rxRequired ? (
                            <span className="badge badge-warning">⚠️ Rx</span>
                          ) : (
                            <span style={{ color: 'var(--clr-text-light)', fontSize: 'var(--fs-sm)' }}>No</span>
                          )}
                        </td>
                        <td>
                          <div className="actions">
                            <button className="btn btn-ghost btn-sm" onClick={() => openEdit(item)}>
                              ✏️ Edit
                            </button>
                            <button className="btn btn-danger btn-sm" onClick={() => handleDelete(item.id)}>
                              🗑 Delete
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </MotionContainer>

        {/* Add/Edit Modal */}
        <AnimatePresence>
        {showModal && (
          <motion.div 
            className="modal-overlay" 
            onClick={() => setShowModal(false)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div 
              className="modal" 
              onClick={e => e.stopPropagation()}
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
            >
              <h2>{editingId ? '✏️ Edit Medicine' : '💊 Add Medicine'}</h2>

              <form className="auth-form" onSubmit={handleSave}>
                <div className="grid-2">
                  <div className="input-group">
                    <label htmlFor="med-name">Medicine Name</label>
                    <input
                      id="med-name"
                      className="input-field"
                      type="text"
                      placeholder="e.g. Paracetamol 500mg"
                      value={form.name}
                      onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
                      required
                    />
                  </div>
                  
                  <div className="input-group">
                    <label htmlFor="med-type">Medicine Type</label>
                    <select
                      id="med-type"
                      className="input-field"
                      value={form.type}
                      onChange={e => setForm(prev => ({ ...prev, type: e.target.value }))}
                    >
                      {MEDICINE_TYPES.map(t => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid-2">
                  <div className="input-group">
                    <label htmlFor="med-stock">Stock Quantity</label>
                    <input
                      id="med-stock"
                      className="input-field"
                      type="number"
                      min="0"
                      placeholder="e.g. 50"
                      value={form.stock}
                      onChange={e => setForm(prev => ({ ...prev, stock: e.target.value }))}
                      required
                    />
                  </div>

                  <div className="input-group">
                    <label htmlFor="med-price">Price (₹)</label>
                    <input
                      id="med-price"
                      className="input-field"
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="e.g. 150.00"
                      value={form.price}
                      onChange={e => setForm(prev => ({ ...prev, price: e.target.value }))}
                      required
                    />
                  </div>
                </div>

                <div className="grid-2">
                  <div className="input-group">
                    <label htmlFor="med-expiry">Expiry Date</label>
                    <input
                      id="med-expiry"
                      className="input-field"
                      type="date"
                      value={form.expiryDate}
                      onChange={e => setForm(prev => ({ ...prev, expiryDate: e.target.value }))}
                      required
                    />
                  </div>
                  
                  <div className="input-group">
                    <label htmlFor="med-category">Category</label>
                    <select
                      id="med-category"
                      className="input-field"
                      value={form.category}
                      onChange={e => setForm(prev => ({ ...prev, category: e.target.value }))}
                    >
                      {categories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <label className="checkbox-label" style={{marginTop: '1rem', display: 'inline-flex'}}>
                  <input
                    type="checkbox"
                    checked={form.rxRequired}
                    onChange={e => setForm(prev => ({ ...prev, rxRequired: e.target.checked }))}
                  />
                  Prescription Required (Rx)
                </label>

                <div className="modal-actions">
                  <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={loading}>
                    {editingId ? 'Update' : 'Add Medicine'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
        </AnimatePresence>
          </>
        )}
        
        {/* Delivery Agents Tab */}
        {activeTab === 'agents' && <DeliveryAgentsTab />}
        
        {/* Order History Tab */}
        {activeTab === 'history' && <OrderHistoryTab />}
        
      </main>
    </div>
  );
}

function OrderScannerTab({ loadInventory }) {
  const [tokenInput, setTokenInput] = useState('');
  const [feedback, setFeedback] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [bookingDetails, setBookingDetails] = useState(null);
  const scannerRef = useRef(null);
  const isProcessingRef = useRef(false);

  useEffect(() => {
    // Initialize QR logic
    const html5QrcodeScanner = new Html5QrcodeScanner(
      "qr-reader",
      { fps: 10, qrbox: {width: 250, height: 250} },
      /* verbose= */ false
    );
    scannerRef.current = html5QrcodeScanner;
    
    const onScanSuccess = (decodedText) => {
        if (!isProcessingRef.current) {
            verifyOrder(decodedText);
        }
    };

    html5QrcodeScanner.render(onScanSuccess, () => {});
    
    return () => {
      html5QrcodeScanner.clear().catch(e => console.error("Could not clear scanner", e));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const verifyOrder = async (token) => {
    if (!token || isProcessingRef.current) return;
    isProcessingRef.current = true;
    setProcessing(true);
    setFeedback(null);
    try {
      const res = await verifyBooking(token);

      setFeedback({
          type: res.already_confirmed ? 'warning' : 'success',
          message: res.message
      });

      // Show detailed booking modal
      const bookingData = {
        customer_name: res.customer_name || 'Unknown Customer',
        items: res.items || [],
        booking_id: res.booking_id || 'N/A',
        total_amount: res.total_amount || 0,
        status: res.status || 'unknown',
        created_at: res.created_at || new Date().toISOString(),
        expires_at: res.expires_at || new Date(Date.now() + 30 * 60 * 1000).toISOString(),
        already_confirmed: res.already_confirmed || false
      };
      setBookingDetails(bookingData);
      setShowBookingModal(true);

      if (scannerRef.current) scannerRef.current.clear();
      loadInventory();
      setTokenInput('');
    } catch (err) {
      setFeedback({ type: 'error', message: err.message });
      isProcessingRef.current = false; // Allow re-scan on error
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="animate-in">
      <h2>Verify Confirmed Orders</h2>
      <p style={{ color: 'var(--clr-text-muted)', marginBottom: 'var(--sp-md)' }}>
        Scan the customer's QR code or enter the code manually to verify their booking.
      </p>

      <div style={{ maxWidth: '600px', background: 'var(--clr-surface)', padding: 'var(--sp-xl)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-lg)' }}>
        <AnimatePresence mode="wait">
          {feedback && (
            <motion.div 
              key={feedback.message}
              initial={{ opacity: 0, height: 0, marginBottom: 0 }}
              animate={{ opacity: 1, height: 'auto', marginBottom: 'var(--sp-md)' }}
              exit={{ opacity: 0, height: 0, marginBottom: 0 }}
              className={feedback.type === 'warning' ? 'alert' : `alert ${feedback.type === 'success' ? 'alert-success' : 'alert-danger'}`}
              style={feedback.type === 'warning' ? { background: 'var(--clr-warning-bg)', color: 'var(--clr-warning)', overflow: 'hidden' } : { overflow: 'hidden' }}
            >
              <div style={{ fontWeight: 'bold' }}>{feedback.message}</div>
            </motion.div>
          )}
        </AnimatePresence>

        <div id="qr-reader" style={{ width: '100%', marginBottom: '1rem', border: '1px solid var(--clr-border)', background: '#fff' }}></div>

        <div style={{ textAlign: 'center', margin: '2rem 0', fontWeight: 'bold' }}>OR</div>

        <div className="input-group">
          <label>Manual Code Entry</label>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <input 
              type="text" 
              className="input-field" 
              value={tokenInput} 
              onChange={e => setTokenInput(e.target.value)} 
              placeholder="Paste booking token here"
            />
            <button 
              className="btn btn-primary" 
              onClick={() => verifyOrder(tokenInput)}
              disabled={processing || !tokenInput}
            >
              Verify Code
            </button>
          </div>
        </div>
      </div>

      {/* Booking Details Modal */}
      <AnimatePresence>
      {showBookingModal && bookingDetails && (
        <motion.div 
          className="modal-overlay" 
          onClick={() => setShowBookingModal(false)}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div 
            className="modal" 
            onClick={e => e.stopPropagation()} 
            style={{ maxWidth: '600px', maxHeight: '80vh', overflow: 'auto' }}
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h2 style={{ margin: 0, color: 'var(--clr-primary)' }}>📋 Booking Details</h2>
              <button
                onClick={() => setShowBookingModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '1.5rem',
                  cursor: 'pointer',
                  color: 'var(--clr-text-muted)',
                  padding: '0.25rem'
                }}
              >
                ×
              </button>
            </div>

            {/* Customer Info */}
            <div style={{
              background: 'var(--clr-background)',
              padding: '1rem',
              borderRadius: 'var(--radius-md)',
              marginBottom: '1rem',
              border: '1px solid var(--clr-border)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '1.2rem' }}>👤</span>
                <span style={{ fontSize: '1.1rem', fontWeight: 'bold', color: 'var(--clr-primary-dark)' }}>
                  {bookingDetails.customer_name || 'Unknown Customer'}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: 'var(--clr-text-muted)' }}>
                <span>🆔 Booking ID: <code>{bookingDetails.booking_id || 'N/A'}</code></span>
                <span style={{
                  color: bookingDetails.status === 'confirmed' ? 'var(--clr-success)' :
                         bookingDetails.status === 'pending' ? 'var(--clr-warning)' : 'var(--clr-danger)',
                  fontWeight: 'bold'
                }}>
                  {(bookingDetails.status || 'unknown').toUpperCase()}
                </span>
              </div>
            </div>

            {/* Booking Items */}
            <div style={{
              background: 'var(--clr-background)',
              padding: '1rem',
              borderRadius: 'var(--radius-md)',
              marginBottom: '1rem',
              border: '1px solid var(--clr-border)'
            }}>
              <h3 style={{ margin: '0 0 1rem 0', fontSize: '1rem', color: 'var(--clr-text)' }}>💊 Medicines to Dispense</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {(bookingDetails.items || []).map((item, index) => (
                  <div key={index} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '0.75rem',
                    background: 'var(--clr-surface)',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--clr-border)'
                  }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: '600', marginBottom: '0.25rem' }}>{item.name || 'Unknown Medicine'}</div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--clr-text-muted)' }}>
                        ₹{item.price || 0} per unit
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{
                        fontSize: '1.1rem',
                        fontWeight: 'bold',
                        color: 'var(--clr-primary)',
                        marginBottom: '0.25rem'
                      }}>
                        {item.quantity || 0}x
                      </div>
                      <div style={{ fontSize: '0.9rem', fontWeight: '600', color: 'var(--clr-success)' }}>
                        ₹{(item.price || 0) * (item.quantity || 0)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Total Amount */}
              <div style={{
                marginTop: '1rem',
                paddingTop: '1rem',
                borderTop: '2px solid var(--clr-border)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontSize: '1.2rem',
                fontWeight: 'bold',
                color: 'var(--clr-primary-dark)'
              }}>
                <span>Total Amount:</span>
                <span>₹{bookingDetails.total_amount || (bookingDetails.items || []).reduce((total, item) => total + ((item.price || 0) * (item.quantity || 0)), 0)}</span>
              </div>
            </div>

            {/* Booking Timestamps */}
            <div style={{
              background: 'var(--clr-background)',
              padding: '1rem',
              borderRadius: 'var(--radius-md)',
              marginBottom: '1rem',
              border: '1px solid var(--clr-border)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                <div>
                  <span style={{ color: 'var(--clr-text-muted)' }}>📅 Created:</span>
                  <div style={{ fontWeight: '600', color: 'var(--clr-text)' }}>
                    {bookingDetails.created_at ? new Date(bookingDetails.created_at).toLocaleString() : 'Unknown'}
                  </div>
                </div>
                <div>
                  <span style={{ color: 'var(--clr-text-muted)' }}>⏰ Expires:</span>
                  <div style={{
                    fontWeight: '600',
                    color: bookingDetails.expires_at && new Date(bookingDetails.expires_at) > new Date() ? 'var(--clr-text)' : 'var(--clr-danger)'
                  }}>
                    {bookingDetails.expires_at ? new Date(bookingDetails.expires_at).toLocaleString() : 'Unknown'}
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
              <button
                className="btn btn-ghost"
                onClick={() => setShowBookingModal(false)}
              >
                Close
              </button>
              {!bookingDetails.already_confirmed && (
                <button
                  className="btn btn-success"
                  onClick={() => {
                    // Here you could add logic to mark the booking as fulfilled
                    toast.success('Booking marked as fulfilled! Medicines dispensed.');
                    setShowBookingModal(false);
                  }}
                  style={{ background: 'var(--clr-success)', color: 'white' }}
                >
                  ✅ Mark as Fulfilled
                </button>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
      </AnimatePresence>

    </div>
  );
}

function DeliveryAgentsTab() {
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAgents();
  }, []);

  const loadAgents = async () => {
    try {
      setLoading(true);
      const data = await api.get('/delivery/agents');
      setAgents(data || []);
    } catch (err) {
      toast.error('Failed to load delivery agents: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <MotionContainer direction="up" distance={20}>
      <div className="section-header">
        <h2>🛵 Delivery Agents Management</h2>
        <button className="btn btn-ghost" onClick={loadAgents} disabled={loading}>🔄 Refresh</button>
      </div>

      {loading ? (
        <SkeletonTable rows={4} cols={5} />
      ) : agents.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🛵</div>
          <p>No delivery agents registered yet.</p>
        </div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Agent Name</th>
                <th>Phone Number</th>
                <th>Vehicle Type</th>
                <th>Active Orders</th>
                <th>Current Status</th>
              </tr>
            </thead>
            <tbody>
              {agents.map((agent, idx) => (
                <motion.tr 
                  key={agent.id}
                  initial={{ opacity: 0, y: -10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.08 }}
                >
                  <td style={{ fontWeight: '600' }}>{agent.name}</td>
                  <td>{agent.phone || 'N/A'}</td>
                  <td style={{ textTransform: 'capitalize' }}>{agent.vehicle_type || 'N/A'}</td>
                  <td style={{ fontWeight: 'bold' }}>{agent.active_orders}</td>
                  <td>
                    {agent.status === 'Busy' ? (
                      <span className="badge badge-warning" style={{ background: '#fffbeb', color: '#b45309', border: '1px solid #fef3c7' }}>🔴 Busy ({agent.active_orders})</span>
                    ) : (
                      <span className="badge badge-success" style={{ background: '#f0fdf4', color: '#15803d', border: '1px solid #dcfce7' }}>🟢 Available</span>
                    )}
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </MotionContainer>
  );
}

function OrderHistoryTab() {
  const [subTab, setSubTab] = useState('delivery'); // 'pickup' or 'delivery'
  const [orders, setOrders] = useState([]);
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    try {
      setLoading(true);
      const [ordersData, agentsData] = await Promise.all([
        api.get('/orders/pharmacy-history'),
        api.get('/delivery/agents')
      ]);
      setOrders(ordersData || []);
      setAgents(agentsData || []);
    } catch (err) {
      toast.error('Failed to load order history: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptOrder = async (orderId) => {
    try {
      setActionLoading(true);
      await api.post(`/delivery/update-status/${orderId}`, { status: 'Accepted' });
      toast.success('Order accepted successfully!');
      loadAllData();
    } catch (err) {
      toast.error('Failed to accept order: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectOrder = async (orderId) => {
    try {
      setActionLoading(true);
      await api.post(`/delivery/update-status/${orderId}`, { status: 'Rejected' });
      toast.success('Order rejected.');
      loadAllData();
    } catch (err) {
      toast.error('Failed to reject order: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleAssignAgent = async (orderId, agentId) => {
    if (!agentId) return;
    try {
      setActionLoading(true);
      await api.post(`/delivery/assign-to-agent/${orderId}`, { agent_id: agentId });
      toast.success('Delivery agent assigned successfully!');
      loadAllData();
    } catch (err) {
      toast.error('Failed to assign agent: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCompleteOrder = async (orderId) => {
    try {
      setActionLoading(true);
      await api.post(`/orders/complete/${orderId}`);
      toast.success('Order Completed & Stock deducted successfully!');
      loadAllData();
    } catch (err) {
      toast.error('Failed to complete order: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Completed':
        return <span className="badge badge-success">✅ Completed</span>;
      case 'Delivered':
        return <span className="badge badge-success" style={{ background: '#eff6ff', color: '#1d4ed8' }}>📦 Delivered</span>;
      case 'Picked Up':
        return <span className="badge badge-success" style={{ background: '#eff6ff', color: '#1d4ed8' }}>🏪 Picked Up</span>;
      case 'Pending':
        return <span className="badge badge-warning">⏳ Pending</span>;
      case 'Accepted':
        return <span className="badge badge-info" style={{ background: '#f5f3ff', color: '#6d28d9' }}>👍 Accepted</span>;
      case 'Assigned to Delivery Agent':
        return <span className="badge badge-info" style={{ background: '#f5f3ff', color: '#6d28d9' }}>🛵 Assigned</span>;
      case 'Out for Delivery':
        return <span className="badge badge-info" style={{ background: '#f0fdfa', color: '#0f766e' }}>🚀 Out for Delivery</span>;
      case 'Cancelled':
      case 'Rejected':
        return <span className="badge badge-danger">❌ {status}</span>;
      default:
        return <span className="badge badge-secondary">{status}</span>;
    }
  };

  const homeDeliveries = orders.filter(o => o.delivery_method === 'home_delivery');
  const storePickups = orders.filter(o => o.delivery_method === 'store_pickup');

  return (
    <MotionContainer direction="up" distance={20}>
      <div className="section-header">
        <h2>📋 Manage Customer Orders</h2>
        <button className="btn btn-ghost" onClick={loadAllData} disabled={loading || actionLoading}>🔄 Refresh</button>
      </div>

      {/* Sub tabs */}
      <div style={{ 
        display: 'flex', 
        gap: '1rem', 
        borderBottom: '1px solid var(--clr-border)', 
        marginBottom: '1.5rem', 
        paddingBottom: '0.5rem' 
      }}>
        <button 
          onClick={() => setSubTab('delivery')}
          style={{
            background: 'transparent',
            border: 'none',
            fontSize: '1rem',
            fontWeight: subTab === 'delivery' ? 'bold' : 'normal',
            color: subTab === 'delivery' ? 'var(--clr-primary)' : 'var(--clr-text-muted)',
            cursor: 'pointer',
            paddingBottom: '0.5rem',
            borderBottom: subTab === 'delivery' ? '2px solid var(--clr-primary)' : 'none'
          }}
        >
          🛵 Home Deliveries ({homeDeliveries.length})
        </button>
        <button 
          onClick={() => setSubTab('pickup')}
          style={{
            background: 'transparent',
            border: 'none',
            fontSize: '1rem',
            fontWeight: subTab === 'pickup' ? 'bold' : 'normal',
            color: subTab === 'pickup' ? 'var(--clr-primary)' : 'var(--clr-text-muted)',
            cursor: 'pointer',
            paddingBottom: '0.5rem',
            borderBottom: subTab === 'pickup' ? '2px solid var(--clr-primary)' : 'none'
          }}
        >
          🏪 Store Pickups ({storePickups.length})
        </button>
      </div>

      {loading ? (
        <SkeletonTable rows={5} cols={6} />
      ) : subTab === 'pickup' ? (
        // Store Pickups Table
        storePickups.length === 0 ? (
          <div className="empty-state">
            <p>No store pickup orders found.</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Status</th>
                  <th>Items</th>
                  <th>Total Price</th>
                  <th>Placed At</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {storePickups.map((order, idx) => (
                  <tr key={order.id}>
                    <td>
                      <div style={{ fontWeight: '600' }}>{order.customer_name}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--clr-text-muted)' }}>ID: {order.id.slice(-8)}</div>
                    </td>
                    <td>{getStatusBadge(order.status)}</td>
                    <td>
                      {order.items.map((item, idx) => (
                        <div key={idx} style={{ fontSize: '0.85rem' }}>
                          {item.medicine_name} ({item.quantity}x)
                        </div>
                      ))}
                    </td>
                    <td style={{ fontWeight: 'bold', color: 'var(--clr-primary)' }}>₹{order.total_amount || 0}</td>
                    <td style={{ fontSize: '0.85rem' }}>{new Date(order.created_at).toLocaleString()}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        {order.status === 'Pending' && (
                          <>
                            <button 
                              className="btn btn-success" 
                              onClick={() => handleAcceptOrder(order.id)}
                              disabled={actionLoading}
                              style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem' }}
                            >
                              Accept
                            </button>
                            <button 
                              className="btn btn-danger" 
                              onClick={() => handleRejectOrder(order.id)}
                              disabled={actionLoading}
                              style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem', background: 'var(--clr-danger)' }}
                            >
                              Reject
                            </button>
                          </>
                        )}

                        {order.status === 'Accepted' && (
                          <span style={{ fontSize: '0.85rem', color: 'var(--clr-text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            Ready for customer pickup
                          </span>
                        )}

                        {order.status === 'Picked Up' && (
                          <button 
                            className="btn btn-success" 
                            onClick={() => handleCompleteOrder(order.id)}
                            disabled={actionLoading}
                            style={{ padding: '0.35rem 0.6rem', fontSize: '0.85rem', fontWeight: 'bold', background: 'var(--clr-success)', color: 'white' }}
                          >
                            ✅ Complete & Deduct Stock
                          </button>
                        )}

                        {['Completed', 'Cancelled', 'Rejected'].includes(order.status) && (
                          <span style={{ fontSize: '0.85rem', color: 'var(--clr-text-muted)' }}>No actions</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      ) : (
        // Home Deliveries Table
        homeDeliveries.length === 0 ? (
          <div className="empty-state">
            <p>No home delivery orders found.</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Status</th>
                  <th>Items</th>
                  <th>Total Price</th>
                  <th>Placed At</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {homeDeliveries.map((order, idx) => (
                  <tr key={order.id}>
                    <td>
                      <div style={{ fontWeight: '600' }}>{order.customer_name}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--clr-text-muted)' }}>ID: {order.id.slice(-8)}</div>
                    </td>
                    <td>{getStatusBadge(order.status)}</td>
                    <td>
                      {order.items.map((item, idx) => (
                        <div key={idx} style={{ fontSize: '0.85rem' }}>
                          {item.medicine_name} ({item.quantity}x)
                        </div>
                      ))}
                    </td>
                    <td style={{ fontWeight: 'bold', color: 'var(--clr-primary)' }}>₹{order.total_amount || 0}</td>
                    <td style={{ fontSize: '0.85rem' }}>{new Date(order.created_at).toLocaleString()}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        {order.status === 'Pending' && (
                          <>
                            <button 
                              className="btn btn-success" 
                              onClick={() => handleAcceptOrder(order.id)}
                              disabled={actionLoading}
                              style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem' }}
                            >
                              Accept
                            </button>
                            <button 
                              className="btn btn-danger" 
                              onClick={() => handleRejectOrder(order.id)}
                              disabled={actionLoading}
                              style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem', background: 'var(--clr-danger)' }}
                            >
                              Reject
                            </button>
                          </>
                        )}

                        {['Accepted', 'Packed'].includes(order.status) && (
                          <select 
                            onChange={(e) => handleAssignAgent(order.id, e.target.value)}
                            disabled={actionLoading}
                            defaultValue=""
                            style={{ padding: '0.25rem 0.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--clr-border)', fontSize: '0.85rem', maxWidth: '150px' }}
                          >
                            <option value="" disabled>🛵 Assign Agent</option>
                            {agents.map(agent => (
                              <option key={agent.id} value={agent.id}>
                                {agent.name} ({agent.status})
                              </option>
                            ))}
                          </select>
                        )}

                        {order.status === 'Delivered' && (
                          <button 
                            className="btn btn-success" 
                            onClick={() => handleCompleteOrder(order.id)}
                            disabled={actionLoading}
                            style={{ padding: '0.35rem 0.6rem', fontSize: '0.85rem', fontWeight: 'bold', background: 'var(--clr-success)', color: 'white' }}
                          >
                            ✅ Complete & Deduct Stock
                          </button>
                        )}

                        {['Completed', 'Cancelled', 'Rejected'].includes(order.status) && (
                          <span style={{ fontSize: '0.85rem', color: 'var(--clr-text-muted)' }}>No actions</span>
                        )}
                        
                        {order.status === 'Assigned to Delivery Agent' && (
                          <span style={{ fontSize: '0.85rem', color: 'var(--clr-text-muted)' }}>Waiting for Agent...</span>
                        )}

                        {order.status === 'Out for Delivery' && (
                          <span style={{ fontSize: '0.85rem', color: 'var(--clr-text-muted)' }}>Out for delivery...</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}
    </MotionContainer>
  );
}
