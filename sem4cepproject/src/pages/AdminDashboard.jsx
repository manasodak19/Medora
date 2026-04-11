import { useState, useEffect } from 'react';
import { adminStats as initialStats } from '../data/data';
import { getPharmacies, updatePharmacyStatus as apiUpdatePharmacy } from '../api';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [pharmacyList, setPharmacyList] = useState([]);

  useEffect(() => {
    const loadPharmacies = async () => {
      try {
        const data = await getPharmacies();
        setPharmacyList(data || []);
      } catch (err) {
        console.error(err);
        alert('Failed to load pharmacies: ' + err.message);
      }
    };

    loadPharmacies();
  }, []);

  // Derive live stats from current pharmacy list
  const stats = {
    ...initialStats,
    totalPharmacies: pharmacyList.length,
    pendingVerifications: pharmacyList.filter(p => p.status === 'pending').length,
  };

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
      value: stats.totalUsers,
      icon: '👥',
      bg: 'var(--clr-info-bg)',
      color: 'var(--clr-info)',
    },
    {
      label: 'Total Pharmacies',
      value: stats.totalPharmacies,
      icon: '🏥',
      bg: 'var(--clr-success-bg)',
      color: 'var(--clr-success)',
    },
    {
      label: 'Total Stocks',
      value: stats.totalStocks.toLocaleString(),
      icon: '💊',
      bg: 'var(--clr-primary-bg)',
      color: 'var(--clr-primary)',
    },
    {
      label: 'Pending Verifications',
      value: stats.pendingVerifications,
      icon: '⏳',
      bg: 'var(--clr-warning-bg)',
      color: 'var(--clr-warning)',
    },
  ];

  const getStatusBadge = (status) => {
    const map = {
      verified: { cls: 'badge-success', text: '✓ Verified' },
      pending:  { cls: 'badge-warning', text: '⏳ Pending' },
      denied:   { cls: 'badge-danger',  text: '✗ Denied' },
      banned:   { cls: 'badge-danger',  text: '🚫 Banned' },
    };
    const s = map[status] || { cls: 'badge-info', text: status };
    return <span className={`badge ${s.cls}`}>{s.text}</span>;
  };

  return (
    <div className="dashboard-layout">
      {/* Sidebar */}
      <aside className="dashboard-sidebar">
        <ul className="sidebar-nav">
          <li
            className={activeTab === 'dashboard' ? 'active' : ''}
            onClick={() => setActiveTab('dashboard')}
          >
            📊 Dashboard
          </li>
          <li
            className={activeTab === 'pharmacies' ? 'active' : ''}
            onClick={() => setActiveTab('pharmacies')}
          >
            🏥 Pharmacies
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
                              >
                                ✓ Approve
                              </button>
                              <button
                                className="btn btn-danger btn-sm"
                                onClick={() => updatePharmacyStatus(pharmacy.id, 'denied')}
                              >
                                ✗ Deny
                              </button>
                            </>
                          )}
                          {pharmacy.status !== 'banned' && (
                            <button
                              className="btn btn-warning btn-sm"
                              onClick={() => updatePharmacyStatus(pharmacy.id, 'banned')}
                            >
                              🚫 Ban
                            </button>
                          )}
                          {pharmacy.status === 'banned' && (
                            <button
                              className="btn btn-ghost btn-sm"
                              onClick={() => updatePharmacyStatus(pharmacy.id, 'pending')}
                            >
                              ↩ Unban
                            </button>
                          )}
                          {pharmacy.status === 'denied' && (
                            <button
                              className="btn btn-ghost btn-sm"
                              onClick={() => updatePharmacyStatus(pharmacy.id, 'pending')}
                            >
                              ↩ Re-review
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
