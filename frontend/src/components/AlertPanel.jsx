export default function AlertPanel({
  alerts
}) {
  return (
    <div className="panel">
      <h2>Alerts</h2>

      {alerts.length === 0 && (
        <p>No alerts.</p>
      )}

      {alerts.map((alert) => (
        <div
          className={`alert ${alert.level?.toLowerCase()}`}
          key={alert.id}
        >
          <strong>
            {alert.level}
          </strong>

          <span>
            {alert.message}
          </span>
        </div>
      ))}
    </div>
  );
}