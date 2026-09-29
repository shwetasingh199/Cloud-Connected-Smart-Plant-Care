import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from "recharts";

export default function SensorChart({
  data,
  dataKey,
  title,
  unit
}) {
  const formatted = data.map((item) => ({
    ...item,
    time: item.timestamp
      ?.toDate?.()
      ?.toLocaleTimeString() || ""
  }));

  return (
    <div className="chart-card">
      <h3>{title}</h3>

      <ResponsiveContainer
        width="100%"
        height={280}
      >
        <LineChart data={formatted}>
          <CartesianGrid strokeDasharray="3 3" />

          <XAxis dataKey="time" />

          <YAxis />

          <Tooltip />

          <Line
            type="monotone"
            dataKey={dataKey}
            strokeWidth={3}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>

      <small>{unit}</small>
    </div>
  );
}