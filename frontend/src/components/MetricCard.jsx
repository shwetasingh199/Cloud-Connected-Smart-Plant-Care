export default function MetricCard({
  title,
  value,
  unit,
  icon,
  status
}) {
  return (
    <div className="metric-card">
      <div className="metric-icon">
        {icon}
      </div>

      <div>
        <p>{title}</p>

        <h2>
          {value ?? "--"}
          {value !== undefined &&
            value !== null &&
            unit}
        </h2>

        {status && (
          <small>{status}</small>
        )}
      </div>
    </div>
  );
}