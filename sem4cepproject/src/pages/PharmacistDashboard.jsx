import { useState, useEffect, useRef } from 'react';
import { categories } from '../data/data';
import { getMyInventory, addInventoryItem, updateInventoryItem, deleteInventoryItem, addInventoryBatch, verifyBooking } from '../api';
import { Html5QrcodeScanner } from 'html5-qrcode';

const MEDICINE_TYPES = ["Tablet", "Syrup", "Capsule", "Drops", "Injection", "Cream", "Other"];

export default function PharmacistDashboard() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('inventory');
  
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
      alert('Failed to load inventory: ' + err.message);
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
      setShowModal(false);
      resetForm();
    } catch (err) {
      alert('Operation failed: ' + err.message);
    }
  };

  const handleDelete = async (id) => {
    if (confirm('Are you sure you want to delete this medicine?')) {
      try {
        await deleteInventoryItem(id);
        setItems(prev => prev.filter(item => item.id !== id));
      } catch (err) {
        alert('Delete failed: ' + err.message);
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
      if (lines.length < 2) return alert('Invalid CSV: No data rows found.');
      
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
      
      const idxName = headers.indexOf('name');
      const idxType = headers.indexOf('type');
      const idxCategory = headers.indexOf('category');
      const idxStock = headers.indexOf('stock');
      const idxPrice = headers.indexOf('price');
      const idxExpiry = headers.indexOf('expiry date');
      const idxRx = headers.indexOf('rx required');

      if (idxName === -1 || idxStock === -1 || idxExpiry === -1) {
        return alert('CSV must at least contain "Name", "Stock", and "Expiry Date" columns.');
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

      if (payloadArray.length === 0) return alert('No valid rows to process.');

      try {
        setLoading(true);
        await addInventoryBatch(payloadArray);
        alert(`Successfully imported ${payloadArray.length} items!`);
        await loadInventory(); 
      } catch (err) {
        alert('CSV Import Failed: ' + err.message);
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

  if (loading) return <div className="loading-spinner" style={{ margin: '5rem auto' }} />;

  return (
    <div className="dashboard-layout">
      {/* Sidebar */}
      <aside className="dashboard-sidebar">
        <ul className="sidebar-nav">
          <li 
            className={activeTab === 'inventory' ? 'active' : ''} 
            onClick={() => setActiveTab('inventory')}
          >
            📦 Inventory
          </li>
          <li 
            className={activeTab === 'orders' ? 'active' : ''} 
            onClick={() => setActiveTab('orders')}
          >
            📷 Verify Orders
          </li>
        </ul>
      </aside>

      {/* Main */}
      <main className="dashboard-main">
        {activeTab === 'inventory' && (
          <>
            <div className="animate-in">
          <h2>Inventory Dashboard</h2>

          {/* Dynamic Metrics Grid */}
          <div className="stats-grid" style={{ marginBottom: 'var(--sp-lg)' }}>
            {statCards.map((card, i) => (
              <div className="stat-card" key={card.label} style={{ animationDelay: `${i * 0.1}s` }}>
                <div className="stat-icon" style={{ background: card.bg, color: card.color }}>
                  {card.icon}
                </div>
                <div className="stat-content">
                  <h3>{card.label}</h3>
                  <div className="stat-number" style={{ color: card.value > 0 && card.label.includes('Expire') ? card.color : 'inherit' }}>
                    {card.value}
                  </div>
                </div>
              </div>
            ))}
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

          {items.length === 0 ? (
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
                  {items.map(item => {
                    const expiring = isExpiringSoon(item.expiryDate);
                    return (
                      <tr key={item.id}>
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
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Add/Edit Modal */}
        {showModal && (
          <div className="modal-overlay" onClick={() => setShowModal(false)}>
            <div className="modal" onClick={e => e.stopPropagation()}>
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
            </div>
          </div>
        )}
          </>
        )}
        
        {/* Scanner Component inside Tab */}
        {activeTab === 'orders' && <OrderScannerTab loadInventory={loadInventory} />}
        
      </main>
    </div>
  );
}

function OrderScannerTab({ loadInventory }) {
  const [tokenInput, setTokenInput] = useState('');
  const [feedback, setFeedback] = useState(null);
  const [processing, setProcessing] = useState(false);
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

    html5QrcodeScanner.render(onScanSuccess, (err) => {});
    
    return () => {
      html5QrcodeScanner.clear().catch(e => console.error("Could not clear scanner", e));
    };
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
          message: res.message, 
          customer: res.customer_name, 
          items: res.items || [] 
      });
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

      <div style={{ maxWidth: '600px', background: 'var(--clr-surface)', padding: 'var(--sp-xl)', borderRadius: 'var(--radius-lg)' }}>
        {feedback && (
          <div className={feedback.type === 'warning' ? 'alert' : `alert ${feedback.type === 'success' ? 'alert-success' : 'alert-danger'}`} 
               style={feedback.type === 'warning' ? { marginBottom: 'var(--sp-md)', background: 'var(--clr-warning-bg)', color: 'var(--clr-warning)' } : { marginBottom: 'var(--sp-md)' }}>
            <div style={{ fontWeight: 'bold' }}>{feedback.message}</div>
            
            {feedback.customer && (
              <div style={{ marginTop: '0.5rem', fontWeight: 'bold', fontSize: 'var(--fs-lg)', color: 'var(--clr-primary-dark)' }}>
                 👤 Customer: {feedback.customer}
              </div>
            )}
            {feedback.items && feedback.items.length > 0 && (
               <div style={{ marginTop: '0.75rem', padding: '0.5rem', background: 'rgba(255,255,255,0.7)', borderRadius: 'var(--radius-md)' }}>
                 <p style={{ margin: '0 0 0.5rem 0', fontWeight: 'bold', fontSize: 'var(--fs-sm)' }}>Medicines to give:</p>
                 <ul style={{ margin: 0, paddingLeft: '1.2rem', fontSize: 'var(--fs-sm)' }}>
                   {feedback.items.map((item, idx) => (
                     <li key={idx}><strong>{item.quantity}x</strong> {item.name}</li>
                   ))}
                 </ul>
               </div>
            )}
          </div>
        )}

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
    </div>
  );
}
