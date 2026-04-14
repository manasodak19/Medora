import { useState, useEffect } from 'react';
import { getPharmacies, updatePharmacyStatus as apiUpdatePharmacy, getAdminStats } from '../api';
import { 
  Users, Hospital, Pill, Clock, LayoutDashboard, Store, 
  CheckCircle, XCircle, Ban, Check, X, RotateCcw 
} from 'lucide-react';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [pharmacyList, setPharmacyList] = useState([]);
  const [stats, setStats] = useState({
    totalUsers: '…',
    totalPharmacies: '…',
    totalStocks: '…',
    pendingVerifications: '…',
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        const [pharmacies, liveStats] = await Promise.all([
          getPharmacies(),
          getAdminStats(),
        ]);
        setPharmacyList(pharmacies || []);
        setStats(liveStats);
      } catch (err) {
        console.error(err);
        alert('Failed to load admin data: ' + err.message);
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
    } catch (err) {
      alert('Update failed: ' + err.message);
    }
  };

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
      </aside>

      {/* Main Content */}
      <main className="dashboard-main">
        {activeTab === 'dashboard' && (
          <div className="animate-in">
            <h2>Dashboard Overview</h2>

            <div className="stats-grid">
              {statCards.map((card, i) => (
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
              ))}
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
          </div>
        )}
      </main>
    </div>
  );
}
