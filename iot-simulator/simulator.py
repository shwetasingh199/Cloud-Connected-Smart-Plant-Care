import os
import random
import time
from datetime import datetime, timezone

import firebase_admin
from dotenv import load_dotenv
from firebase_admin import credentials, firestore


load_dotenv()


SERVICE_ACCOUNT = os.getenv(
    "FIREBASE_SERVICE_ACCOUNT",
    "serviceAccountKey.json"
)

USER_ID = os.getenv("FIREBASE_USER_ID")
DEVICE_ID = os.getenv("DEVICE_ID")

INTERVAL = int(
    os.getenv("SIMULATION_INTERVAL", "10")
)


if not USER_ID:
    raise ValueError(
        "FIREBASE_USER_ID is missing in .env"
    )

if not DEVICE_ID:
    raise ValueError(
        "DEVICE_ID is missing in .env"
    )


if not firebase_admin._apps:

    cred = credentials.Certificate(
        SERVICE_ACCOUNT
    )

    firebase_admin.initialize_app(
        cred
    )


db = firestore.client()


device_ref = db.document(
    f"users/{USER_ID}/devices/{DEVICE_ID}"
)

readings_ref = device_ref.collection(
    "readings"
)

watering_ref = device_ref.collection(
    "wateringEvents"
)

alerts_ref = device_ref.collection(
    "alerts"
)


DEFAULT_THRESHOLD = 30
DEFAULT_MIN_TANK = 15

COOLDOWN_SECONDS = 300
MAX_WATERING_SECONDS = 30


def now():
    return datetime.now(
        timezone.utc
    )


def get_device():

    snapshot = device_ref.get()

    if not snapshot.exists:

        raise RuntimeError(
            f"Device '{DEVICE_ID}' "
            "does not exist."
        )

    return snapshot.to_dict()


def create_alert(
    alert_type,
    level,
    message
):

    existing = alerts_ref.where(
        filter=firestore.FieldFilter(
            "alertType",
            "==",
            alert_type
        )
    ).where(
        filter=firestore.FieldFilter(
            "status",
            "==",
            "ACTIVE"
        )
    ).limit(1).stream()

    for _ in existing:
        return

    alerts_ref.add({

        "deviceId": DEVICE_ID,

        "alertType": alert_type,

        "level": level,

        "message": message,

        "status": "ACTIVE",

        "createdAt":
            firestore.SERVER_TIMESTAMP
    })


def generate_values(device):

    moisture = float(
        device.get(
            "currentMoisture",
            random.uniform(45, 70)
        )
    )

    temperature = float(
        device.get(
            "currentTemperature",
            random.uniform(22, 30)
        )
    )

    humidity = float(
        device.get(
            "currentHumidity",
            random.uniform(45, 70)
        )
    )

    tank = float(
        device.get(
            "waterTankLevel",
            100
        )
    )

    pump = device.get(
        "pumpStatus",
        "OFF"
    )


    if pump == "ON":

        moisture += random.uniform(
            1.5,
            3.5
        )

        tank -= random.uniform(
            0.8,
            1.8
        )

    else:

        moisture -= random.uniform(
            0.2,
            1.0
        )


    temperature += random.uniform(
        -0.5,
        0.5
    )

    humidity += random.uniform(
        -1.5,
        1.5
    )


    moisture = max(
        0,
        min(100, moisture)
    )

    tank = max(
        0,
        min(100, tank)
    )

    temperature = max(
        15,
        min(45, temperature)
    )

    humidity = max(
        20,
        min(95, humidity)
    )


    light = random.uniform(
        200,
        900
    )


    return {

        "soil_moisture":
            round(moisture, 2),

        "temperature":
            round(temperature, 2),

        "humidity":
            round(humidity, 2),

        "light_level":
            round(light, 2),

        "water_tank_level":
            round(tank, 2)
    }


def start_watering(
    trigger_type,
    moisture
):

    pump_until = (
        time.time()
        +
        MAX_WATERING_SECONDS
    )


    device_ref.update({

        "pumpStatus": "ON",

        "pumpStartedAt":
            firestore.SERVER_TIMESTAMP,

        "pumpUntil":
            pump_until,

        "updatedAt":
            firestore.SERVER_TIMESTAMP
    })


    watering_ref.add({

        "deviceId":
            DEVICE_ID,

        "triggerType":
            trigger_type,

        "moistureBefore":
            moisture,

        "duration":
            MAX_WATERING_SECONDS,

        "completed":
            False,

        "timestamp":
            firestore.SERVER_TIMESTAMP
    })


    print(
        f"[WATERING] "
        f"{trigger_type} watering started"
    )


def complete_watering():

    device_ref.update({

        "pumpStatus":
            "OFF",

        "lastWateredAt":
            firestore.SERVER_TIMESTAMP,

        "pumpUntil":
            None,

        "updatedAt":
            firestore.SERVER_TIMESTAMP
    })


    events = watering_ref.where(
        filter=firestore.FieldFilter(
            "completed",
            "==",
            False
        )
    ).limit(1).stream()


    for event in events:

        event.reference.update({

            "completed":
                True,

            "completedAt":
                firestore.SERVER_TIMESTAMP
        })

        break


    print(
        "[WATERING] watering completed"
    )


def check_pump_timeout(device):

    if device.get(
        "pumpStatus"
    ) != "ON":

        return


    pump_until = device.get(
        "pumpUntil"
    )


    if pump_until is None:
        return


    if time.time() >= float(
        pump_until
    ):

        complete_watering()


def check_temperature(
    temperature
):

    if temperature > 35:

        create_alert(

            "HIGH_TEMPERATURE",

            "WARNING",

            (
                f"Temperature is "
                f"{temperature:.1f}°C."
            )
        )


def check_tank(tank):

    if tank <= DEFAULT_MIN_TANK:

        create_alert(

            "LOW_WATER_TANK",

            "CRITICAL",

            "Water tank level is too low."
        )

        return False

    return True


def check_automatic_watering(
    device,
    moisture,
    tank
):

    threshold = float(
        device.get(
            "moistureThreshold",
            DEFAULT_THRESHOLD
        )
    )

    auto_enabled = bool(
        device.get(
            "autoWaterEnabled",
            True
        )
    )

    pump_status = device.get(
        "pumpStatus",
        "OFF"
    )


    if moisture < threshold:

        create_alert(

            "LOW_SOIL_MOISTURE",

            "WARNING",

            (
                f"Soil moisture is "
                f"{moisture:.1f}%, below "
                f"{threshold:.1f}%."
            )
        )


    if not auto_enabled:
        return


    if pump_status == "ON":
        return


    if moisture >= threshold:
        return


    if tank <= DEFAULT_MIN_TANK:
        return


    last_watered = device.get(
        "lastWateredAt"
    )


    if last_watered:

        try:

            elapsed = (
                now()
                -
                last_watered
            ).total_seconds()

            if elapsed < COOLDOWN_SECONDS:
                return

        except Exception:
            pass


    start_watering(
        "AUTO",
        moisture
    )


def save_reading(values):

    readings_ref.add({

        "device_id":
            DEVICE_ID,

        "soil_moisture":
            values["soil_moisture"],

        "temperature":
            values["temperature"],

        "humidity":
            values["humidity"],

        "light_level":
            values["light_level"],

        "water_tank_level":
            values["water_tank_level"],

        "timestamp":
            firestore.SERVER_TIMESTAMP,

        "receivedAt":
            firestore.SERVER_TIMESTAMP
    })


def main():

    print(
        "================================"
    )

    print(
        " Smart Plant IoT Simulator"
    )

    print(
        "================================"
    )

    print(
        f"Device: {DEVICE_ID}"
    )

    print(
        f"Interval: {INTERVAL} seconds"
    )

    print()


    while True:

        try:

            device = get_device()


            check_pump_timeout(
                device
            )


            device = get_device()


            values = generate_values(
                device
            )


            save_reading(
                values
            )


            device_ref.update({

                "currentMoisture":
                    values[
                        "soil_moisture"
                    ],

                "currentTemperature":
                    values[
                        "temperature"
                    ],

                "currentHumidity":
                    values[
                        "humidity"
                    ],

                "currentLight":
                    values[
                        "light_level"
                    ],

                "waterTankLevel":
                    values[
                        "water_tank_level"
                    ],

                "status":
                    "ONLINE",

                "lastSeen":
                    firestore.SERVER_TIMESTAMP,

                "updatedAt":
                    firestore.SERVER_TIMESTAMP
            })


            check_temperature(
                values["temperature"]
            )


            tank_ok = check_tank(
                values[
                    "water_tank_level"
                ]
            )


            if tank_ok:

                check_automatic_watering(

                    device,

                    values[
                        "soil_moisture"
                    ],

                    values[
                        "water_tank_level"
                    ]
                )


            print(

                f"[SENSOR] "
                f"Moisture="
                f"{values['soil_moisture']}% | "
                f"Temp="
                f"{values['temperature']}°C | "
                f"Humidity="
                f"{values['humidity']}% | "
                f"Tank="
                f"{values['water_tank_level']}% | "
                f"Pump="
                f"{device.get('pumpStatus', 'OFF')}"

            )


            time.sleep(
                INTERVAL
            )


        except KeyboardInterrupt:

            print(
                "\nSimulator stopped."
            )

            break


        except Exception as error:

            print(
                "[ERROR]",
                error
            )

            time.sleep(
                INTERVAL
            )


if __name__ == "__main__":
    main()