import { useEffect, useState } from "react";

import Header from "../components/Header";
import MetricCard from "../components/MetricCard";
import SensorChart from "../components/SensorChart";
import AlertPanel from "../components/AlertPanel";

import {
  getDevices,
  getLatestReading,
  getReadingHistory,
  getAlerts,
  updateThreshold,
  updateAutoWater
} from "../services/firestoreService";

export default function Dashboard({
  user
}) {
  const [devices, setDevices] = useState([]);
  const [selectedDevice, setSelectedDevice] =
    useState(null);

  const [latest, setLatest] = useState(null);
  const [history, setHistory] = useState([]);
  const [alerts, setAlerts] = useState([]);

  const [threshold, setThreshold] =
    useState(30);

  const [loading, setLoading] =
    useState(true);

  async function loadDashboard() {
    if (!user) return;

    try {
      const deviceList =
        await getDevices(user.uid);

      setDevices(deviceList);

      if (
        deviceList.length > 0
      ) {
        const device =
          selectedDevice ||
          deviceList[0];

        setSelectedDevice(device);

        setThreshold(
          device.moistureThreshold ?? 30
        );

        const [
          latestData,
          historyData,
          alertData
        ] = await Promise.all([
          getLatestReading(
            user.uid,
            device.id
          ),
          getReadingHistory(
            user.uid,
            device.id
          ),
          getAlerts(
            user.uid,
            device.id
          )
        ]);

        setLatest(latestData);
        setHistory(historyData);
        setAlerts(alertData);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboard();

    const interval =
      setInterval(
        loadDashboard,
        5000
      );

    return () =>
      clearInterval(interval);
  }, [user]);

  async function saveThreshold() {
    if (!selectedDevice) return;

    await updateThreshold(
      user.uid,
      selectedDevice.id,
      threshold
    );

    await loadDashboard();
  }

  async function toggleAutoWater() {
    if (!selectedDevice) return;

    await updateAutoWater(
      user.uid,
      selectedDevice.id,
      !selectedDevice.autoWater
    );

    await loadDashboard();
  }

  if (loading) {
    return (
      <div className="loading">
        Loading dashboard...
      </div>
    );
  }

  const moisture =
    latest?.soilMoisture ?? 0;

  const plantStatus =
    moisture <
    (selectedDevice?.moistureThreshold ??
      30)
      ? "Needs Water"
      : "Healthy";

  return (
    <div className="dashboard">
      <Header user={user} />

      <main className="main">
        <div className="page-title">
          <div>
            <h2>
              Plant Monitoring Dashboard
            </h2>

            <p>
              Cloud-connected smart irrigation
            </p>
          </div>

          <select
            value={
              selectedDevice?.id || ""
            }
            onChange={async (event) => {
              const device =
                devices.find(
                  (item) =>
                    item.id ===
                    event.target.value
                );

              setSelectedDevice(device);

              const [
                latestData,
                historyData,
                alertData
              ] = await Promise.all([
                getLatestReading(
                  user.uid,
                  device.id
                ),
                getReadingHistory(
                  user.uid,
                  device.id
                ),
                getAlerts(
                  user.uid,
                  device.id
                )
              ]);

              setLatest(latestData);
              setHistory(historyData);
              setAlerts(alertData);
            }}
          >
            {devices.map((device) => (
              <option
                key={device.id}
                value={device.id}
              >
                {device.plantName}
              </option>
            ))}
          </select>
        </div>

        {selectedDevice ? (
          <>
            <div className="plant-header">
              <div>
                <h2>
                  {selectedDevice.plantName}
                </h2>

                <p>
                  {selectedDevice.plantType}
                  {" • "}
                  {selectedDevice.location}
                </p>
              </div>

              <span
                className={
                  plantStatus === "Healthy"
                    ? "status healthy"
                    : "status warning"
                }
              >
                {plantStatus}
              </span>
            </div>

            <section className="metrics">
              <MetricCard
                title="Soil Moisture"
                value={
                  latest?.soilMoisture
                }
                unit="%"
                icon="💧"
              />

              <MetricCard
                title="Temperature"
                value={
                  latest?.temperature
                }
                unit="°C"
                icon="🌡️"
              />

              <MetricCard
                title="Humidity"
                value={
                  latest?.humidity
                }
                unit="%"
                icon="💨"
              />

              <MetricCard
                title="Light"
                value={
                  latest?.lightLevel
                }
                unit="%"
                icon="☀️"
              />

              <MetricCard
                title="Water Tank"
                value={
                  latest?.waterTankLevel
                }
                unit="%"
                icon="🚰"
              />

              <MetricCard
                title="Pump"
                value={
                  selectedDevice.pumpOn
                    ? "ON"
                    : "OFF"
                }
                icon="⚙️"
              />
            </section>

            <section className="controls panel">
              <h2>Controls</h2>

              <div className="control-row">
                <label>
                  Moisture Threshold
                </label>

                <input
                  type="number"
                  min="1"
                  max="99"
                  value={threshold}
                  onChange={(event) =>
                    setThreshold(
                      event.target.value
                    )
                  }
                />

                <button
                  onClick={
                    saveThreshold
                  }
                >
                  Save
                </button>
              </div>

              <div className="control-row">
                <label>
                  Automatic Watering
                </label>

                <button
                  onClick={
                    toggleAutoWater
                  }
                >
                  {selectedDevice.autoWater
                    ? "ON"
                    : "OFF"}
                </button>
              </div>
            </section>

            <section className="charts">
              <SensorChart
                data={history}
                dataKey="soilMoisture"
                title="Soil Moisture"
                unit="Percentage"
              />

              <SensorChart
                data={history}
                dataKey="temperature"
                title="Temperature"
                unit="Celsius"
              />

              <SensorChart
                data={history}
                dataKey="humidity"
                title="Humidity"
                unit="Percentage"
              />

              <SensorChart
                data={history}
                dataKey="lightLevel"
                title="Light Level"
                unit="Percentage"
              />
            </section>

            <AlertPanel
              alerts={alerts}
            />
          </>
        ) : (
          <div className="empty">
            No plant devices found.
          </div>
        )}
      </main>
    </div>
  );
}