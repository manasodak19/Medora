import { useState, useEffect } from 'react';
import { getPharmacies, updatePharmacyStatus as apiUpdatePharmacy, getAdminStats } from '../api';
import { 
  Users, Hospital, Pill, Clock, LayoutDashboard, Store, 
  CheckCircle, XCircle, Ban, Check, X, RotateCcw, 
  Activity, Sparkles, MapPin, Timer, ClipboardList, ShieldCheck
} from 'lucide-react';
import toast from 'react-hot-toast';
import { SkeletonStats, SkeletonTable, Skeleton, SkeletonCard } from '../components/Skeleton';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [pharmacyList, setPharmacyList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: '…',
    totalPharmacies: '…',
    totalStocks: '…',
    pendingVerifications: '…',
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [pharmacies, liveStats] = await Promise.all([
          getPharmacies(),
          getAdminStats(),
        ]);
        setPharmacyList(pharmacies || []);
        setStats(liveStats);
      } catch (err) {
        toast.error('Failed to load admin data: ' + err.message);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const updatePharmacyStatus = async (id, status) => {
    try {
      await apiUpdatePharmacy(id, status);
      setPharmacyList(prev =>
        prev.map(p => (p.id === id ? { ...p, status } : p))
      );
      toast.success(`Pharmacy is now ${status}`);
    } catch (err) {
      toast.error('Update failed: ' + err.message);
    }
  };

  const oldestPending = pharmacyList.find(p => p.status === 'pending');

  const statCards = [
    {
      label: 'Total Users',
      value: typeof stats.totalUsers === 'number' ? stats.totalUsers.toLocaleString() : stats.totalUsers,
      icon: <Users size={24} />,
      bg: 'var(--clr-info-bg)',
      color: 'var(--clr-info)',
    },
    {
      label: 'Total Pharmacies',
      value: typeof stats.totalPharmacies === 'number' ? stats.totalPharmacies.toLocaleString() : stats.totalPharmacies,
      icon: <Hospital size={24} />,
      bg: 'var(--clr-success-bg)',
      color: 'var(--clr-success)',
    },
    {
      label: 'Total Stock Units',
      value: typeof stats.totalStocks === 'number' ? stats.totalStocks.toLocaleString() : stats.totalStocks,
      icon: <Pill size={24} />,
      bg: 'var(--clr-primary-bg)',
      color: 'var(--clr-primary)',
    },
    {
      label: 'Pending Verifications',
      value: typeof stats.pendingVerifications === 'number' ? stats.pendingVerifications.toLocaleString() : stats.pendingVerifications,
      icon: <Clock size={24} />,
      bg: 'var(--clr-warning-bg)',
      color: 'var(--clr-warning)',
    },
  ];

  const getStatusBadge = (status) => {
    const map = {
      verified: { cls: 'badge-success', icon: <CheckCircle size={14} style={{ marginRight: '4px' }} />, text: 'Verified' },
      pending:  { cls: 'badge-warning', icon: <Clock size={14} style={{ marginRight: '4px' }} />, text: 'Pending' },
      denied:   { cls: 'badge-danger',  icon: <XCircle size={14} style={{ marginRight: '4px' }} />, text: 'Denied' },
      banned:   { cls: 'badge-danger',  icon: <Ban size={14} style={{ marginRight: '4px' }} />, text: 'Banned' },
    };
    const s = map[status] || { cls: 'badge-info', icon: null, text: status };
    return <span className={`badge ${s.cls}`} style={{ display: 'inline-flex', alignItems: 'center' }}>{s.icon}{s.text}</span>;
  };

  return (
    <div className="dashboard-layout">
      {/* Sidebar */}
      <aside className="dashboard-sidebar">
        <ul className="sidebar-nav">
          <li
            className={activeTab === 'dashboard' ? 'active' : ''}
            onClick={() => setActiveTab('dashboard')}
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <LayoutDashboard size={18} /> Dashboard
          </li>
          <li
            className={activeTab === 'pharmacies' ? 'active' : ''}
            onClick={() => setActiveTab('pharmacies')}
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <Store size={18} /> Pharmacies
          </li>
        </ul>
        
        <div className="sidebar-footer">
          <div className="status-indicator">
            <div className="status-dot"></div>
            <div>
              <div style={{ fontWeight: 'bold', color: 'var(--clr-text)', fontSize: '11px' }}>System: Online</div>
              <div style={{ fontSize: '10px' }}>v1.0.4-stable</div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="dashboard-main">
        {activeTab === 'dashboard' && (
          <div className="animate-in">
            <h2>Dashboard Overview</h2>

            <div className="stats-grid">
              {loading ? (
                <SkeletonStats />
              ) : (
                statCards.map((card, i) => (
                  <div
                    className="stat-card"
                    key={card.label}
                    style={{ animationDelay: `${i * 0.1}s` }}
                  >
                    <div className="stat-icon" style={{ background: card.bg, color: card.color }}>
                      {card.icon}
                    </div>
                    <div className="stat-content">
                      <h3>{card.label}</h3>
                      <div className="stat-number">{card.value}</div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Verification Spotlight Inbox */}
            <div style={{ marginTop: 'var(--sp-xl)', marginBottom: 'var(--sp-xl)' }}>
              {loading ? (
                <SkeletonCard />
              ) : oldestPending ? (
                <div 
                  className="card animate-in" 
                  style={{ 
                    padding: 'var(--sp-xl)', 
                    background: 'var(--clr-surface)', 
                    border: '2px solid var(--clr-primary-light)', 
                    borderRadius: 'var(--radius-lg)',
                    boxShadow: '0 12px 32px rgba(13,148,136,0.1)',
                    position: 'relative'
                  }}
                >
                  <div style={{ position: 'absolute', top: -12, left: 24, background: 'var(--clr-primary)', color: 'white', padding: '4px 12px', borderRadius: 'var(--radius-full)', fontSize: '12px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Sparkles size={14} /> NEXT IN QUEUE
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 'var(--sp-xl)', alignItems: 'center' }}>
                    <div>
                      <h2 style={{ fontSize: '1.75rem', marginBottom: '0.25rem' }}>{oldestPending.name}</h2>
                      <p style={{ color: 'var(--clr-text-muted)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <MapPin size={16} /> {oldestPending.city} • Registered {new Date().toLocaleDateString()}
                      </p>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                        <div style={{ background: 'var(--clr-surface-alt)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
                          <div style={{ fontSize: '11px', color: 'var(--clr-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>License Number</div>
                          <code style={{ fontWeight: 'bold', color: 'var(--clr-primary-dark)' }}>{oldestPending.license}</code>
                        </div>
                        <div style={{ background: 'var(--clr-surface-alt)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
                          <div style={{ fontSize: '11px', color: 'var(--clr-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>Owner</div>
                          <div style={{ fontWeight: 'bold' }}>{oldestPending.owner_name}</div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '1rem' }}>
                        <button 
                          className="btn btn-success" 
                          onClick={() => updatePharmacyStatus(oldestPending.id, 'verified')}
                          style={{ flex: 2, height: '54px', fontSize: '1.1rem', gap: '8px' }}
                        >
                          <CheckCircle size={20} /> Approve Verification
                        </button>
                        <button 
                          className="btn btn-danger" 
                          onClick={() => updatePharmacyStatus(oldestPending.id, 'denied')}
                          style={{ flex: 1, height: '54px', gap: '8px' }}
                        >
                          <X size={20} /> Deny
                        </button>
                      </div>
                    </div>

                    <div style={{ borderLeft: '1px solid var(--clr-border)', paddingLeft: 'var(--sp-xl)' }}>
                      <h4 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Timer size={18} color="var(--clr-primary)" /> Business Info
                      </h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '14px' }}>
                         <div style={{ display: 'flex', gap: '8px' }}>
                            <span style={{ color: 'var(--clr-text-muted)' }}>🕒 Timings:</span>
                            <strong>{oldestPending.timings || '10:00 AM - 09:00 PM'}</strong>
                         </div>
                         <div style={{ display: 'flex', gap: '8px' }}>
                            <span style={{ color: 'var(--clr-text-muted)' }}>📞 Phone:</span>
                            <strong>{oldestPending.phone || '+91 98765 43210'}</strong>
                         </div>
                         <div style={{ display: 'flex', gap: '8px' }}>
                            <span style={{ color: 'var(--clr-text-muted)' }}>📧 Email:</span>
                            <span style={{ textDecoration: 'underline' }}>{oldestPending.email}</span>
                         </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div 
                  style={{ 
                    padding: 'var(--sp-xl)', 
                    textAlign: 'center', 
                    background: 'var(--clr-surface-alt)', 
                    borderRadius: 'var(--radius-lg)', 
                    border: '1px dashed var(--clr-border)'
                  }}
                >
                  <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🎯</div>
                  <h3 style={{ margin: 0 }}>You're all caught up!</h3>
                  <p style={{ color: 'var(--clr-text-muted)', margin: '0.25rem 0 0 0' }}>No pending verifications to act on right now.</p>
                </div>
              )}
            </div>

            <div style={{ marginTop: 'var(--sp-xl)' }}>
              {/* Recent Active Feed */}
              <div className="card" style={{ padding: 'var(--sp-lg)', background: 'var(--clr-surface)', border: '1px solid var(--clr-border)', borderRadius: 'var(--radius-lg)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--sp-md)' }}>
                  <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1rem' }}><Activity size={18} color="var(--clr-primary)" /> Recent Registrations</h3>
                  <button onClick={() => setActiveTab('pharmacies')} style={{ fontSize: '12px', color: 'var(--clr-primary)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: '600' }}>View All</button>
                </div>
                {loading ? <SkeletonTable rows={3} cols={3} /> : (
                  <div className="table-container" style={{ border: 'none', boxShadow: 'none' }}>
                    <table className="data-table" style={{ fontSize: '13px' }}>
                      <thead>
                        <tr>
                          <th>Pharmacy</th>
                          <th>City</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pharmacyList.slice(0, 5).map(p => (
                          <tr key={p.id}>
                            <td><strong>{p.name}</strong></td>
                            <td>{p.city}</td>
                            <td>{getStatusBadge(p.status)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'pharmacies' && (
          <div className="animate-in">
            <div className="section-header">
              <h2>Pharmacy Management</h2>
              <span style={{ fontSize: 'var(--fs-sm)', color: 'var(--clr-text-muted)' }}>
                {pharmacyList.length} pharmacies total
              </span>
            </div>

            {loading ? (
              <SkeletonTable rows={5} cols={6} />
            ) : (
              <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Pharmacy Name</th>
                    <th>Owner</th>
                    <th>City</th>
                    <th>License</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pharmacyList.map(pharmacy => (
                    <tr key={pharmacy.id}>
                      <td>
                        <strong>{pharmacy.name}</strong>
                        <br />
                        <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--clr-text-muted)' }}>
                          {pharmacy.email}
                        </span>
                      </td>
                      <td>{pharmacy.owner_name}</td>
                      <td>{pharmacy.city}</td>
                      <td>
                        <code style={{
                          fontSize: 'var(--fs-xs)',
                          background: 'var(--clr-surface-alt)',
                          padding: '2px 6px',
                          borderRadius: 'var(--radius-sm)',
                        }}>
                          {pharmacy.license}
                        </code>
                      </td>
                      <td>{getStatusBadge(pharmacy.status)}</td>
                      <td>
                        <div className="actions">
                          {pharmacy.status === 'pending' && (
                            <>
                              <button
                                className="btn btn-success btn-sm"
                                onClick={() => updatePharmacyStatus(pharmacy.id, 'verified')}
                                style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                              >
                                <Check size={14} /> Approve
                              </button>
                              <button
                                className="btn btn-danger btn-sm"
                                onClick={() => updatePharmacyStatus(pharmacy.id, 'denied')}
                                style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                              >
                                <X size={14} /> Deny
                              </button>
                            </>
                          )}
                          {pharmacy.status !== 'banned' && (
                            <button
                              className="btn btn-warning btn-sm"
                              onClick={() => updatePharmacyStatus(pharmacy.id, 'banned')}
                              style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                            >
                              <Ban size={14} /> Ban
                            </button>
                          )}
                          {pharmacy.status === 'banned' && (
                            <button
                              className="btn btn-ghost btn-sm"
                              onClick={() => updatePharmacyStatus(pharmacy.id, 'pending')}
                              style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                            >
                              <RotateCcw size={14} /> Unban
                            </button>
                          )}
                          {pharmacy.status === 'denied' && (
                            <button
                              className="btn btn-ghost btn-sm"
                              onClick={() => updatePharmacyStatus(pharmacy.id, 'pending')}
                              style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                            >
                              <RotateCcw size={14} /> Re-review
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
      </main>
    </div>
  );
}
