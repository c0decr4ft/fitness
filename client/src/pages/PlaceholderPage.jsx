export function PlaceholderPage({ title, subtitle = '' }) {
  return (
    <div className="page active">
      <div className="page-header">
        <div className="page-title">{title}</div>
        {subtitle && <div className="page-sub">{subtitle}</div>}
      </div>
      <div className="profile-wrap" style={{ padding: 36 }}>
        <p style={{ color: 'var(--muted)', fontSize: 14 }}>Coming soon.</p>
      </div>
    </div>
  );
}
