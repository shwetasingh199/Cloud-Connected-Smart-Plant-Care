# 🌱 Cloud-Connected Smart Plant Care & Watering System

A cloud-connected IoT-based smart plant monitoring and watering system designed to monitor plant conditions, detect soil moisture levels, generate alerts, and automate watering decisions.

The project combines a modern React dashboard, Firebase Authentication, Cloud Firestore, simulated IoT sensor data, and automated plant-care logic to demonstrate how cloud computing can be integrated with IoT applications.

---

## 📌 Project Overview

The **Cloud-Connected Smart Plant Care & Watering System** is designed to provide an intelligent way to monitor plant health using simulated IoT sensor data.

The system continuously receives environmental readings such as:

- Soil moisture
- Temperature
- Humidity
- Light level
- Water tank level
- Device status
- Timestamp

Based on these readings and configured plant thresholds, the system can identify dry soil conditions, generate alerts, and initiate automated watering logic.

The project does not require physical IoT hardware. A Python-based sensor simulator is used to generate realistic sensor readings, making the system easy to develop, test, demonstrate, and deploy.

---

## 🎯 Objectives

The main objectives of this project are:

- Monitor plant environmental conditions remotely.
- Simulate IoT sensor data without physical hardware.
- Store sensor data securely in the cloud.
- Provide a responsive web-based monitoring dashboard.
- Implement automatic watering decisions.
- Detect low soil moisture conditions.
- Monitor water tank levels.
- Generate plant-care alerts.
- Maintain watering history.
- Support multiple smart plant devices.
- Demonstrate Firebase-based cloud architecture.
- Provide a foundation for future ESP32/Arduino integration.

---

## ✨ Key Features

### 🌱 Plant Monitoring

The dashboard displays:

- Soil moisture
- Temperature
- Humidity
- Light level
- Water tank level
- Pump status
- Device status
- Last watering time
- Plant health/status

### 💧 Smart Watering

The system supports:

- Automatic watering
- Manual watering
- Configurable moisture threshold
- Minimum water tank protection
- Watering cooldown
- Maximum watering duration
- Moisture hysteresis to reduce repeated watering

### 🚨 Alerts

The system can generate alerts for:

- Low soil moisture
- High temperature
- Low water tank
- Device inactivity/offline condition

### 📊 Historical Data

Sensor readings and watering events are stored in Firestore and can be used for:

- Moisture history
- Temperature history
- Humidity history
- Light-level trends
- Watering history

### 👤 Authentication

Firebase Authentication provides:

- User registration
- User login
- Secure authenticated dashboard access
- User-specific devices and data

### ☁️ Cloud Database

Cloud Firestore is used to store:

- Users
- Devices
- Sensor readings
- Watering events
- Alerts
- Device configuration

### 🧪 IoT Simulation

A Python simulator generates realistic sensor data so the complete system can be tested without physical hardware.

---
## Screenshots

<img width="997" height="815" alt="Screenshot 2026-09-29 201536" src="https://github.com/user-attachments/assets/418e01d3-0de1-4708-a12d-34355a244611" />
<img width="862" height="802" alt="Screenshot 2026-09-29 191407" src="https://github.com/user-attachments/assets/892c990e-efbd-4e8c-ad41-96fdfdd1f04a" />
<img width="857" height="770" alt="Screenshot 2026-09-29 191533" src="https://github.com/user-attachments/assets/aebd074c-fadd-4163-959b-9038953a6188" />
<img width="1822" height="910" alt="Screenshot 2026-09-29 194421" src="https://github.com/user-attachments/assets/0e6053a8-d004-4531-8bfb-35102ab6c6ca" />
<img width="1857" height="893" alt="Screenshot 2026-09-29 194547" src="https://github.com/user-attachments/assets/bd4cf1e1-4321-4e4e-a1d3-a89619267167" />

# 🏗️ System Architecture

                 ┌─────────────────────────┐
                 │   Python IoT Simulator  │
                 │                         │
                 │ Soil Moisture           │
                 │ Temperature             │
                 │ Humidity                │
                 │ Light Level             │
                 │ Tank Level              │
                 └────────────┬────────────┘
                              │
                              │ Sensor Data
                              ▼
                 ┌─────────────────────────┐
                 │     Firebase Backend    │
                 │                         │
                 │ Cloud Firestore         │
                 │ Authentication         │
                 │ Security Rules          │
                 └────────────┬────────────┘
                              │
                              ▼
                 ┌─────────────────────────┐
                 │     React Dashboard     │
                 │                         │
                 │ Plant Monitoring        │
                 │ Charts                  │
                 │ Alerts                  │
                 │ Watering Controls       │
                 └─────────────────────────┘

## 📁 Project Structure

Cloud-Connected-Smart-Plant-Care/
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── firebase.js
│   │   └── App.jsx
│   │
│   ├── public/
│   ├── .env
│   ├── package.json
│   └── vite.config.js
│
├── functions/
│   ├── index.js
│   └── package.json
│
├── simulator/
│   ├── sensor_simulator.py
│   └── requirements.txt
│
├── firestore.rules
├── firestore.indexes.json
├── firebase.json
├── .firebaserc
├── .gitignore
└── README.md

## 🔥 Firebase Configuration

Create a Firebase project and enable:

Firebase Authentication
Email/Password Authentication
Cloud Firestore
Firebase Hosting

Create a Web App inside Firebase and add the Firebase configuration to:

frontend/.env

Example:

VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id

Do not upload .env files containing private credentials or secrets to GitHub.

## 📊 Firestore Data Structure
users/
└── {userId}/
    └── devices/
        └── {deviceId}/
            ├── readings/
            │   └── {readingId}
            │
            ├── wateringEvents/
            │   └── {eventId}
            │
            └── alerts/
                └── {alertId}

A device can contain information such as:

deviceId
plantName
plantType
soilMoisture
temperature
humidity
lightLevel
waterTankLevel
pumpStatus
autoWaterEnabled
moistureThreshold
lastSeen
lastWateredAt

## 🌱 Plant Profiles

The system supports configurable moisture thresholds.

Plant Profile	Moisture Threshold
Succulent	20%
Tomato	40%
Herb	35%
Indoor Plant	30%
Custom	User-defined

When soil moisture falls below the configured threshold, watering can be triggered when automatic watering is enabled.

## 💧 Watering Logic

The watering system considers:

Soil moisture
Moisture threshold
Water-tank level
Pump status
Automatic watering setting
Watering cooldown
Maximum watering duration

Example:

IF moisture < threshold
    AND auto watering = ON
    AND tank level > minimum level
    AND pump = OFF
    AND cooldown completed

THEN
    Start watering

Safety conditions prevent watering when the tank level is too low or the pump is already active.

## 🔔 Alerts

The dashboard can display alerts for conditions such as:

LOW_SOIL_MOISTURE
HIGH_TEMPERATURE
LOW_WATER_TANK
OFFLINE_DEVICE

Each alert can contain:

Alert Type
Message
Severity
Status
Created Time

## 🤖 IoT Sensor Simulation

Physical hardware is not required.

The Python simulator generates realistic sensor readings such as:

Soil Moisture
Temperature
Humidity
Light Level
Water Tank Level
Timestamp
Device ID

Example simulated reading:

{
  "device_id": "plant-001",
  "soil_moisture": 27,
  "temperature": 29.4,
  "humidity": 61,
  "light_level": 720,
  "water_tank_level": 78,
  "timestamp": "2026-09-29T10:30:00"
}

The simulator can continuously send changing readings to Firestore for dashboard testing.

## 💻 Installation
1. Clone the Repository
git clone https://github.com/YOUR-USERNAME/cloud-connected-smart-plant-care.git
cd cloud-connected-smart-plant-care
2. Install Frontend Dependencies
cd frontend
npm install
3. Start the React Application
npm run dev

Open the local Vite URL shown in the terminal.

## 🐍 Run the Sensor Simulator

Open another terminal:

cd simulator

Create a virtual environment:

python -m venv venv

Activate it on Windows:

venv\Scripts\activate

Install dependencies:

pip install -r requirements.txt

Run the simulator:

python sensor_simulator.py

## 🔐 Authentication

Users sign in using Firebase Email/Password Authentication.

Typical workflow:

Register
   ↓
Login
   ↓
Firebase Authentication
   ↓
User Dashboard
   ↓
User's Devices
   ↓
Sensor Data

Firestore Security Rules ensure users can access only their authorized data.

## 📊 Dashboard

The dashboard provides:

Plant name
Plant type
Soil moisture
Temperature
Humidity
Light level
Water-tank level
Pump status
Auto-watering status
Moisture threshold
Last watered time
Device status
Alerts
Sensor history charts
Manual watering control

## 🧪 Testing

The project can be tested using the following workflow:

1. Create Firebase project
2. Enable Authentication
3. Create Firestore database
4. Configure frontend Firebase credentials
5. Start React dashboard
6. Register/Login
7. Create a plant/device
8. Start Python sensor simulator
9. Verify Firestore readings
10. Verify dashboard updates
11. Test low-moisture condition
12. Test low-tank condition
13. Test manual watering
14. Test automatic watering
15. Verify alerts and watering history

## ☁️ Deployment

Build the React application:

cd frontend
npm run build

Deploy the frontend using Firebase Hosting:

firebase deploy --only hosting

The generated production application can then be accessed through the Firebase Hosting URL.

## ⚠️ Cloud Functions Note

The project structure includes a functions folder for server-side automation and REST API functionality.

Firebase Cloud Functions deployment requires the Firebase Blaze plan. If the project is kept on the free Spark plan, the React frontend, Firebase Authentication, Firestore, Security Rules, and Python simulator can still be used for the project demonstration.

Cloud Functions can be added later when server-side cloud automation is required.

## 🔒 Security

The project follows basic cloud security practices:

Firebase Authentication
Firestore Security Rules
User-specific database access
Environment variables for frontend configuration
No service-account credentials in GitHub
Validation of sensor data
Restricted database access
Separate device identification

Never upload files such as:

.env
serviceAccountKey.json
firebase-adminsdk-*.json

to a public GitHub repository.

## 🎯 Project Objectives

The main objectives are to:

Demonstrate IoT data collection
Store IoT data in the cloud
Build a real-time monitoring dashboard
Implement automated watering logic
Generate plant-care alerts
Use cloud authentication and database security
Understand the integration of IoT, cloud computing, and web technologies

## 🚀 Future Improvements

Possible future enhancements include:

ESP32 physical sensor integration
Real soil-moisture sensor
Real water pump
Firebase Cloud Functions
Push notifications using FCM
Advanced analytics
Weather API integration
Multiple user roles
Mobile application
Machine-learning-based watering prediction
Device health monitoring
Advanced irrigation scheduling

## 📚 Learning Outcomes

This project demonstrates practical knowledge of:

IoT architecture
Cloud computing
React development
Firebase Authentication
Cloud Firestore
Real-time data handling
REST API concepts
Sensor simulation
Automation logic
Cloud security
Git and GitHub
Application deployment

## 👩‍💻 Author

Shweta Singh

This project was developed as a practical Cloud Computing + IoT project demonstrating cloud-connected monitoring, sensor simulation, data visualization, and automated plant-care functionality.

## 📄 License

This project is available for educational and portfolio purposes.
