import './Skeleton.css';

export function Skeleton({ width, height, borderRadius, className = "" }) {
  const style = {
    width: width ? width : '100%',
    height: height ? height : '1rem',
    borderRadius: borderRadius ? borderRadius : 'var(--radius-sm)'
  };

  return <div className={`skeleton ${className}`} style={style} />;
}

export function SkeletonStats() {
  return (
    <div className="stats-grid">
      {[1, 2, 3, 4].map((i) => (
        <div className="stat-card" key={i}>
          <Skeleton width="48px" height="48px" borderRadius="var(--radius-md)" />
          <div className="stat-content" style={{ flex: 1 }}>
            <Skeleton width="60%" height="0.75rem" style={{ marginBottom: '0.5rem' }} />
            <Skeleton width="40%" height="1.5rem" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function SkeletonTable({ rows = 5, cols = 4 }) {
  return (
    <div className="table-container">
      <table className="data-table">
        <thead>
          <tr>
            {Array.from({ length: cols }).map((_, i) => (
              <th key={i}><Skeleton width="60%" height="0.75rem" /></th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, i) => (
            <tr key={i}>
              {Array.from({ length: cols }).map((_, j) => (
                <td key={j}><Skeleton width="80%" height="0.75rem" /></td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function SkeletonCard() {
  return (
    <div style={{ background: 'var(--clr-surface)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--clr-border)', marginBottom: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
        <Skeleton width="120px" height="1.2rem" />
        <Skeleton width="40px" height="1.2rem" />
      </div>
      <Skeleton width="200px" height="0.75rem" style={{ marginBottom: '1rem' }} />
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
        <Skeleton width="60px" height="24px" />
        <Skeleton width="80px" height="24px" />
      </div>
      <div>
        <Skeleton width="100%" height="40px" />
      </div>
    </div>
  );
}
