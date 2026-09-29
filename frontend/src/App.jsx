import { useEffect, useMemo, useState } from "react";

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "firebase/auth";

import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc
} from "firebase/firestore";

import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";

import {
  AlertTriangle,
  Droplets,
  Gauge,
  Leaf,
  LogOut,
  Plus,
  RefreshCw,
  Settings,
  Thermometer,
  Trash2,
  User,
  Waves,
  Wind,
  Zap
} from "lucide-react";

import {
  auth,
  db
} from "./firebase";


const PLANT_PROFILES = {
  SUCCULENT: 20,
  TOMATO: 40,
  HERB: 35,
  "INDOOR PLANT": 30,
  CUSTOM: 30
};


function formatDate(value) {

  if (!value) {
    return "Never";
  }

  try {

    const date =
      value?.toDate
        ? value.toDate()
        : new Date(value);

    return date.toLocaleString();

  } catch {

    return "Unknown";
  }
}


function isOnline(lastSeen) {

  if (!lastSeen) {
    return false;
  }

  const date =
    lastSeen?.toDate
      ? lastSeen.toDate()
      : new Date(lastSeen);

  return (
    Date.now() - date.getTime()
    <
    2 * 60 * 1000
  );
}


function App() {

  const [user, setUser] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {

    const unsubscribe =
      onAuthStateChanged(
        auth,
        currentUser => {

          setUser(currentUser);
          setLoading(false);

        }
      );

    return unsubscribe;

  }, []);


  if (loading) {

    return (
      <div className="loading-screen">
        Loading Smart Plant Care...
      </div>
    );
  }


  if (!user) {
    return <AuthScreen />;
  }


  return (
    <Dashboard user={user} />
  );
}


/* =====================================================
   AUTHENTICATION
===================================================== */

function AuthScreen() {

  const [mode, setMode] =
    useState("login");

  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [name, setName] =
    useState("");

  const [error, setError] =
    useState("");

  const [busy, setBusy] =
    useState(false);


  async function handleSubmit(event) {

    event.preventDefault();

    setError("");
    setBusy(true);

    try {

      if (mode === "register") {

        const credential =
          await createUserWithEmailAndPassword(
            auth,
            email,
            password
          );

        await setDoc(
          doc(
            db,
            "users",
            credential.user.uid
          ),
          {
            name,
            email,
            createdAt:
              serverTimestamp()
          },
          {
            merge: true
          }
        );

      } else {

        await signInWithEmailAndPassword(
          auth,
          email,
          password
        );
      }

    } catch (err) {

      setError(
        err.message
          ?.replace("Firebase: ", "")
          ?.replace(/\(auth\/.*\)\.?/, "")
          ||
        "Authentication failed."
      );

    } finally {

      setBusy(false);
    }
  }


  return (
    <div className="auth-page">

      <div className="auth-card">

        <div className="brand-icon">
          <Leaf size={34} />
        </div>

        <h1>Smart Plant Care</h1>

        <p className="muted">
          Cloud-connected plant monitoring
        </p>


        <form onSubmit={handleSubmit}>

          {mode === "register" && (

            <input
              type="text"
              placeholder="Your name"
              value={name}
              onChange={
                event =>
                  setName(event.target.value)
              }
              required
            />

          )}


          <input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={
              event =>
                setEmail(event.target.value)
            }
            required
          />


          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={
              event =>
                setPassword(event.target.value)
            }
            minLength={6}
            required
          />


          {error && (
            <div className="error-box">
              {error}
            </div>
          )}


          <button
            className="primary-button"
            disabled={busy}
          >
            {busy
              ? "Please wait..."
              : mode === "login"
                ? "Login"
                : "Create Account"}
          </button>

        </form>


        <button
          className="link-button"
          onClick={() =>
            setMode(
              mode === "login"
                ? "register"
                : "login"
            )
          }
        >
          {mode === "login"
            ? "Create a new account"
            : "Already have an account? Login"}
        </button>

      </div>

    </div>
  );
}


/* =====================================================
   DASHBOARD
===================================================== */

function Dashboard({ user }) {

  const [devices, setDevices] =
    useState([]);

  const [selectedDeviceId, setSelectedDeviceId] =
    useState("");

  const [readings, setReadings] =
    useState([]);

  const [wateringEvents, setWateringEvents] =
    useState([]);

  const [alerts, setAlerts] =
    useState([]);

  const [showAddDevice, setShowAddDevice] =
    useState(false);

  const [message, setMessage] =
    useState("");

  const [error, setError] =
    useState("");


  const selectedDevice =
    devices.find(
      device =>
        device.id === selectedDeviceId
    );


  useEffect(() => {

    const devicesRef =
      collection(
        db,
        "users",
        user.uid,
        "devices"
      );

    const unsubscribe =
      onSnapshot(
        devicesRef,
        snapshot => {

          const data =
            snapshot.docs.map(
              item => ({
                id: item.id,
                ...item.data()
              })
            );

          setDevices(data);

          setSelectedDeviceId(
            previous => {

              if (
                previous &&
                data.some(
                  device =>
                    device.id === previous
                )
              ) {
                return previous;
              }

              return data[0]?.id || "";
            }
          );

        },
        err => {

          setError(
            "Could not load devices: " +
            err.message
          );

        }
      );

    return unsubscribe;

  }, [user.uid]);


  useEffect(() => {

    if (!selectedDeviceId) {

      setReadings([]);
      setWateringEvents([]);
      setAlerts([]);

      return;
    }


    const basePath = [
      "users",
      user.uid,
      "devices",
      selectedDeviceId
    ];


    const readingsQuery =
      query(
        collection(
          db,
          ...basePath,
          "readings"
        ),
        orderBy(
          "timestamp",
          "desc"
        ),
        limit(100)
      );


    const wateringQuery =
      query(
        collection(
          db,
          ...basePath,
          "wateringEvents"
        ),
        orderBy(
          "timestamp",
          "desc"
        ),
        limit(50)
      );


    const alertsQuery =
      query(
        collection(
          db,
          ...basePath,
          "alerts"
        ),
        orderBy(
          "createdAt",
          "desc"
        ),
        limit(50)
      );


    const unsubscribeReadings =
      onSnapshot(
        readingsQuery,
        snapshot => {

          const data =
            snapshot.docs
              .map(
                item => ({
                  id: item.id,
                  ...item.data()
                })
              )
              .reverse();

          setReadings(data);

        },
        err => {

          setError(
            "Reading error: " +
            err.message
          );

        }
      );


    const unsubscribeWatering =
      onSnapshot(
        wateringQuery,
        snapshot => {

          setWateringEvents(
            snapshot.docs.map(
              item => ({
                id: item.id,
                ...item.data()
              })
            )
          );

        }
      );


    const unsubscribeAlerts =
      onSnapshot(
        alertsQuery,
        snapshot => {

          setAlerts(
            snapshot.docs.map(
              item => ({
                id: item.id,
                ...item.data()
              })
            )
          );

        }
      );


    return () => {

      unsubscribeReadings();
      unsubscribeWatering();
      unsubscribeAlerts();

    };

  }, [
    user.uid,
    selectedDeviceId
  ]);


  const latestReading =
    readings.length
      ? readings[readings.length - 1]
      : null;


  const chartData =
    readings.map(
      reading => ({
        time:
          reading.timestamp?.toDate
            ? reading.timestamp
                .toDate()
                .toLocaleTimeString()
            : "--",

        moisture:
          Number(
            reading.soil_moisture || 0
          ),

        temperature:
          Number(
            reading.temperature || 0
          ),

        humidity:
          Number(
            reading.humidity || 0
          ),

        tank:
          Number(
            reading.water_tank_level || 0
          )
      })
    );


  async function handleLogout() {

    await signOut(auth);
  }


  async function manualWater() {

    if (!selectedDevice) {
      return;
    }


    setError("");
    setMessage("");


    if (
      Number(
        selectedDevice.waterTankLevel || 100
      )
      <=
      Number(
        selectedDevice.minTankLevel || 15
      )
    ) {

      setError(
        "Water tank level is too low."
      );

      return;
    }


    if (
      selectedDevice.pumpStatus === "ON"
    ) {

      setError(
        "Pump is already running."
      );

      return;
    }


    try {

      const deviceRef =
        doc(
          db,
          "users",
          user.uid,
          "devices",
          selectedDevice.id
        );


      const duration = 30;


      await updateDoc(
        deviceRef,
        {

          pumpStatus: "ON",

          pumpUntil:
            Date.now() +
            duration * 1000,

          pumpStartedAt:
            serverTimestamp(),

          updatedAt:
            serverTimestamp()

        }
      );


      await addDoc(
        collection(
          db,
          "users",
          user.uid,
          "devices",
          selectedDevice.id,
          "wateringEvents"
        ),
        {

          deviceId:
            selectedDevice.id,

          triggerType:
            "MANUAL",

          moistureBefore:
            Number(
              selectedDevice.currentMoisture || 0
            ),

          duration,

          completed: false,

          timestamp:
            serverTimestamp()

        }
      );


      setMessage(
        "Manual watering started."
      );

    } catch (err) {

      setError(err.message);
    }
  }


  async function toggleAutoWater() {

    if (!selectedDevice) {
      return;
    }


    try {

      await updateDoc(
        doc(
          db,
          "users",
          user.uid,
          "devices",
          selectedDevice.id
        ),
        {

          autoWaterEnabled:
            !selectedDevice.autoWaterEnabled,

          updatedAt:
            serverTimestamp()

        }
      );

    } catch (err) {

      setError(err.message);
    }
  }


  async function updateThreshold(value) {

    if (!selectedDevice) {
      return;
    }


    const threshold =
      Number(value);


    if (
      threshold < 5 ||
      threshold > 95
    ) {

      setError(
        "Threshold must be between 5 and 95."
      );

      return;
    }


    try {

      await updateDoc(
        doc(
          db,
          "users",
          user.uid,
          "devices",
          selectedDevice.id
        ),
        {

          moistureThreshold:
            threshold,

          updatedAt:
            serverTimestamp()

        }
      );


      setMessage(
        "Moisture threshold updated."
      );

    } catch (err) {

      setError(err.message);
    }
  }


  async function acknowledgeAlert(
    alertId
  ) {

    if (!selectedDevice) {
      return;
    }


    await updateDoc(
      doc(
        db,
        "users",
        user.uid,
        "devices",
        selectedDevice.id,
        "alerts",
        alertId
      ),
      {

        status:
          "ACKNOWLEDGED",

        acknowledgedAt:
          serverTimestamp()

      }
    );
  }


  async function deleteDevice() {

    if (!selectedDevice) {
      return;
    }


    const confirmed =
      window.confirm(
        `Delete ${selectedDevice.plantName}?`
      );


    if (!confirmed) {
      return;
    }


    await deleteDoc(
      doc(
        db,
        "users",
        user.uid,
        "devices",
        selectedDevice.id
      )
    );


    setSelectedDeviceId("");
  }


  return (
    <div className="app">

      <header className="topbar">

        <div className="brand">

          <div className="small-brand-icon">
            <Leaf size={22} />
          </div>

          <div>
            <strong>
              Smart Plant Care
            </strong>

            <span>
              Cloud IoT Dashboard
            </span>
          </div>

        </div>


        <div className="user-section">

          <User size={18} />

          <span>
            {user.email}
          </span>

          <button
            className="icon-button"
            onClick={handleLogout}
            title="Logout"
          >
            <LogOut size={18} />
          </button>

        </div>

      </header>


      <main className="container">

        <div className="page-heading">

          <div>

            <h1>
              Plant Dashboard
            </h1>

            <p>
              Monitor and control your smart plant.
            </p>

          </div>


          <button
            className="primary-button"
            onClick={() =>
              setShowAddDevice(true)
            }
          >
            <Plus size={18} />
            Add Plant
          </button>

        </div>


        {message && (
          <div className="success-box">
            {message}
          </div>
        )}


        {error && (
          <div className="error-box">
            {error}

            <button
              onClick={() => setError("")}
            >
              ×
            </button>
          </div>
        )}


        {devices.length === 0 ? (

          <div className="empty-state">

            <Leaf size={50} />

            <h2>
              No plants added yet
            </h2>

            <p>
              Add your first smart plant to begin
              monitoring sensor data.
            </p>

            <button
              className="primary-button"
              onClick={() =>
                setShowAddDevice(true)
              }
            >
              <Plus size={18} />
              Add Plant
            </button>

          </div>

        ) : (

          <>

            <div className="device-selector">

              <label>
                Select Plant
              </label>

              <select
                value={selectedDeviceId}
                onChange={
                  event =>
                    setSelectedDeviceId(
                      event.target.value
                    )
                }
              >

                {devices.map(device => (

                  <option
                    key={device.id}
                    value={device.id}
                  >
                    {device.plantName}
                  </option>

                ))}

              </select>

            </div>


            {selectedDevice && (

              <>

                <section className="plant-header">

                  <div>

                    <div className="plant-title">

                      <Leaf size={28} />

                      <div>

                        <h2>
                          {selectedDevice.plantName}
                        </h2>

                        <p>
                          {selectedDevice.plantType}
                        </p>

                      </div>

                    </div>

                  </div>


                  <div
                    className={
                      isOnline(
                        selectedDevice.lastSeen
                      )
                        ? "online"
                        : "offline"
                    }
                  >
                    <span></span>

                    {isOnline(
                      selectedDevice.lastSeen
                    )
                      ? "Online"
                      : "Offline"}
                  </div>

                </section>


                <section className="stats-grid">

                  <StatCard
                    title="Soil Moisture"
                    value={
                      selectedDevice.currentMoisture ??
                      latestReading?.soil_moisture ??
                      0
                    }
                    unit="%"
                    icon={<Droplets />}
                  />

                  <StatCard
                    title="Temperature"
                    value={
                      selectedDevice.currentTemperature ??
                      latestReading?.temperature ??
                      0
                    }
                    unit="°C"
                    icon={<Thermometer />}
                  />

                  <StatCard
                    title="Humidity"
                    value={
                      selectedDevice.currentHumidity ??
                      latestReading?.humidity ??
                      0
                    }
                    unit="%"
                    icon={<Wind />}
                  />

                  <StatCard
                    title="Light Level"
                    value={
                      selectedDevice.currentLight ??
                      latestReading?.light_level ??
                      0
                    }
                    unit=""
                    icon={<Zap />}
                  />

                  <StatCard
                    title="Water Tank"
                    value={
                      selectedDevice.waterTankLevel ??
                      latestReading?.water_tank_level ??
                      100
                    }
                    unit="%"
                    icon={<Waves />}
                  />

                  <StatCard
                    title="Pump"
                    value={
                      selectedDevice.pumpStatus ||
                      "OFF"
                    }
                    unit=""
                    icon={<Gauge />}
                  />

                </section>


                <section className="control-grid">

                  <div className="panel">

                    <div className="panel-heading">

                      <h3>
                        Plant Controls
                      </h3>

                      <Settings size={20} />

                    </div>


                    <div className="control-row">

                      <div>

                        <strong>
                          Automatic Watering
                        </strong>

                        <p>
                          Start watering when soil
                          moisture falls below the
                          threshold.
                        </p>

                      </div>


                      <button
                        className={
                          selectedDevice.autoWaterEnabled
                            ? "toggle active"
                            : "toggle"
                        }
                        onClick={
                          toggleAutoWater
                        }
                      >
                        <span></span>
                      </button>

                    </div>


                    <div className="control-row">

                      <div>

                        <strong>
                          Moisture Threshold
                        </strong>

                        <p>
                          Current:
                          {" "}
                          {selectedDevice.moistureThreshold ??
                            30}
                          %
                        </p>

                      </div>


                      <input
                        className="number-input"
                        type="number"
                        min="5"
                        max="95"
                        defaultValue={
                          selectedDevice.moistureThreshold ??
                          30
                        }
                        onBlur={
                          event =>
                            updateThreshold(
                              event.target.value
                            )
                        }
                      />

                    </div>


                    <div className="control-actions">

                      <button
                        className="water-button"
                        onClick={manualWater}
                      >
                        <Droplets size={18} />
                        Water Plant
                      </button>


                      <button
                        className="danger-button"
                        onClick={deleteDevice}
                      >
                        <Trash2 size={18} />
                        Delete
                      </button>

                    </div>

                  </div>


                  <div className="panel">

                    <div className="panel-heading">

                      <h3>
                        Plant Status
                      </h3>

                      <Leaf size={20} />

                    </div>


                    <div className="status-list">

                      <StatusRow
                        label="Pump Status"
                        value={
                          selectedDevice.pumpStatus ||
                          "OFF"
                        }
                      />

                      <StatusRow
                        label="Automatic Watering"
                        value={
                          selectedDevice.autoWaterEnabled
                            ? "Enabled"
                            : "Disabled"
                        }
                      />

                      <StatusRow
                        label="Water Tank"
                        value={
                          `${selectedDevice.waterTankLevel ?? 100}%`
                        }
                      />

                      <StatusRow
                        label="Last Seen"
                        value={
                          formatDate(
                            selectedDevice.lastSeen
                          )
                        }
                      />

                      <StatusRow
                        label="Last Watered"
                        value={
                          formatDate(
                            selectedDevice.lastWateredAt
                          )
                        }
                      />

                    </div>

                  </div>

                </section>


                <section className="panel chart-panel">

                  <div className="panel-heading">

                    <div>

                      <h3>
                        Sensor History
                      </h3>

                      <p>
                        Recent simulated IoT readings
                      </p>

                    </div>

                    <RefreshCw size={20} />

                  </div>


                  <div className="chart">

                    {chartData.length > 0 ? (

                      <ResponsiveContainer
                        width="100%"
                        height={350}
                      >

                        <AreaChart
                          data={chartData}
                        >

                          <CartesianGrid
                            strokeDasharray="3 3"
                          />

                          <XAxis
                            dataKey="time"
                          />

                          <YAxis />

                          <Tooltip />

                          <Legend />

                          <Area
                            type="monotone"
                            dataKey="moisture"
                            name="Moisture %"
                            fillOpacity={0.2}
                            strokeWidth={2}
                          />

                          <Area
                            type="monotone"
                            dataKey="temperature"
                            name="Temperature °C"
                            fillOpacity={0.1}
                            strokeWidth={2}
                          />

                          <Area
                            type="monotone"
                            dataKey="humidity"
                            name="Humidity %"
                            fillOpacity={0.1}
                            strokeWidth={2}
                          />

                        </AreaChart>

                      </ResponsiveContainer>

                    ) : (

                      <div className="chart-empty">

                        Waiting for sensor data...

                      </div>

                    )}

                  </div>

                </section>


                <section className="two-column">

                  <div className="panel">

                    <div className="panel-heading">

                      <h3>
                        Alerts
                      </h3>

                      <AlertTriangle size={20} />

                    </div>


                    {alerts.length === 0 ? (

                      <p className="muted">
                        No alerts.
                      </p>

                    ) : (

                      <div className="alert-list">

                        {alerts.map(alert => (

                          <div
                            className={
                              alert.status ===
                              "ACKNOWLEDGED"
                                ? "alert acknowledged"
                                : "alert"
                            }
                            key={alert.id}
                          >

                            <AlertTriangle size={18} />

                            <div>

                              <strong>
                                {alert.alertType}
                              </strong>

                              <p>
                                {alert.message}
                              </p>

                              <small>
                                {formatDate(
                                  alert.createdAt
                                )}
                              </small>

                            </div>


                            {alert.status !==
                              "ACKNOWLEDGED" && (

                              <button
                                onClick={() =>
                                  acknowledgeAlert(
                                    alert.id
                                  )
                                }
                              >
                                Acknowledge
                              </button>

                            )}

                          </div>

                        ))}

                      </div>

                    )}

                  </div>


                  <div className="panel">

                    <div className="panel-heading">

                      <h3>
                        Watering History
                      </h3>

                      <Droplets size={20} />

                    </div>


                    {wateringEvents.length === 0 ? (

                      <p className="muted">
                        No watering events yet.
                      </p>

                    ) : (

                      <div className="history-list">

                        {wateringEvents.map(event => (

                          <div
                            className="history-item"
                            key={event.id}
                          >

                            <div>

                              <strong>
                                {event.triggerType}
                              </strong>

                              <p>
                                Moisture:
                                {" "}
                                {event.moistureBefore ?? "--"}%
                              </p>

                            </div>


                            <div>

                              <span>
                                {event.completed
                                  ? "Completed"
                                  : "Running"}
                              </span>

                              <small>
                                {formatDate(
                                  event.timestamp
                                )}
                              </small>

                            </div>

                          </div>

                        ))}

                      </div>

                    )}

                  </div>

                </section>

              </>

            )}

          </>

        )}

      </main>


      {showAddDevice && (

        <AddDeviceModal
          user={user}
          onClose={() =>
            setShowAddDevice(false)
          }
          onCreated={
            deviceId => {

              setSelectedDeviceId(
                deviceId
              );

              setShowAddDevice(false);

            }
          }
        />

      )}

    </div>
  );
}


/* =====================================================
   STAT CARD
===================================================== */

function StatCard({
  title,
  value,
  unit,
  icon
}) {

  return (
    <div className="stat-card">

      <div className="stat-icon">
        {icon}
      </div>

      <div>

        <p>
          {title}
        </p>

        <h3>
          {value}
          <span>
            {unit}
          </span>
        </h3>

      </div>

    </div>
  );
}


/* =====================================================
   STATUS ROW
===================================================== */

function StatusRow({
  label,
  value
}) {

  return (
    <div className="status-row">

      <span>
        {label}
      </span>

      <strong>
        {value}
      </strong>

    </div>
  );
}


/* =====================================================
   ADD DEVICE
===================================================== */

function AddDeviceModal({
  user,
  onClose,
  onCreated
}) {

  const [plantName, setPlantName] =
    useState("");

  const [plantType, setPlantType] =
    useState("HERB");

  const [deviceId, setDeviceId] =
    useState(
      `plant-${Date.now()}`
    );

  const [busy, setBusy] =
    useState(false);

  const [error, setError] =
    useState("");


  async function createDevice(event) {

    event.preventDefault();

    setBusy(true);
    setError("");


    try {

      const threshold =
        PLANT_PROFILES[
          plantType
        ] ??
        PLANT_PROFILES.CUSTOM;


      await setDoc(
        doc(
          db,
          "users",
          user.uid,
          "devices",
          deviceId
        ),
        {

          deviceId,

          plantName,

          plantType,

          moistureThreshold:
            threshold,

          minTankLevel: 15,

          autoWaterEnabled:
            true,

          pumpStatus:
            "OFF",

          currentMoisture:
            0,

          currentTemperature:
            0,

          currentHumidity:
            0,

          currentLight:
            0,

          waterTankLevel:
            100,

          status:
            "OFFLINE",

          createdAt:
            serverTimestamp(),

          updatedAt:
            serverTimestamp()

        }
      );


      onCreated(deviceId);

    } catch (err) {

      setError(err.message);

    } finally {

      setBusy(false);
    }
  }


  return (
    <div className="modal-overlay">

      <div className="modal">

        <h2>
          Add Smart Plant
        </h2>

        <p className="muted">
          Create a simulated IoT device.
        </p>


        <form onSubmit={createDevice}>

          <label>
            Plant Name
          </label>

          <input
            value={plantName}
            onChange={
              event =>
                setPlantName(
                  event.target.value
                )
            }
            placeholder="My Tomato Plant"
            required
          />


          <label>
            Plant Type
          </label>

          <select
            value={plantType}
            onChange={
              event =>
                setPlantType(
                  event.target.value
                )
            }
          >

            <option value="SUCCULENT">
              Succulent - 20%
            </option>

            <option value="TOMATO">
              Tomato - 40%
            </option>

            <option value="HERB">
              Herb - 35%
            </option>

            <option value="INDOOR PLANT">
              Indoor Plant - 30%
            </option>

            <option value="CUSTOM">
              Custom - 30%
            </option>

          </select>


          <label>
            Device ID
          </label>

          <input
            value={deviceId}
            onChange={
              event =>
                setDeviceId(
                  event.target.value
                )
            }
            required
          />


          {error && (
            <div className="error-box">
              {error}
            </div>
          )}


          <div className="modal-actions">

            <button
              type="button"
              className="secondary-button"
              onClick={onClose}
            >
              Cancel
            </button>

            <button
              className="primary-button"
              disabled={busy}
            >
              {busy
                ? "Creating..."
                : "Create Plant"}
            </button>

          </div>

        </form>

      </div>

    </div>
  );
}


export default App;