import {
  collection,
  doc,
  getDocs,
  getDoc,
  limit,
  orderBy,
  query,
  updateDoc,
  where
} from "firebase/firestore";

import { db } from "./firebase";

export function devicesCollection(uid) {
  return collection(db, "users", uid, "devices");
}

export async function getDevices(uid) {
  const snapshot = await getDocs(
    devicesCollection(uid)
  );

  return snapshot.docs.map((item) => ({
    id: item.id,
    ...item.data()
  }));
}

export async function getDevice(uid, deviceId) {
  const reference = doc(
    db,
    "users",
    uid,
    "devices",
    deviceId
  );

  const snapshot = await getDoc(reference);

  if (!snapshot.exists()) {
    return null;
  }

  return {
    id: snapshot.id,
    ...snapshot.data()
  };
}

export async function updateThreshold(
  uid,
  deviceId,
  threshold
) {
  const reference = doc(
    db,
    "users",
    uid,
    "devices",
    deviceId
  );

  await updateDoc(reference, {
    moistureThreshold: Number(threshold)
  });
}

export async function updateAutoWater(
  uid,
  deviceId,
  enabled
) {
  const reference = doc(
    db,
    "users",
    uid,
    "devices",
    deviceId
  );

  await updateDoc(reference, {
    autoWater: enabled
  });
}

export async function getLatestReading(
  uid,
  deviceId
) {
  const readings = collection(
    db,
    "users",
    uid,
    "devices",
    deviceId,
    "readings"
  );

  const q = query(
    readings,
    orderBy("timestamp", "desc"),
    limit(1)
  );

  const snapshot = await getDocs(q);

  if (snapshot.empty) {
    return null;
  }

  return {
    id: snapshot.docs[0].id,
    ...snapshot.docs[0].data()
  };
}

export async function getReadingHistory(
  uid,
  deviceId
) {
  const readings = collection(
    db,
    "users",
    uid,
    "devices",
    deviceId,
    "readings"
  );

  const q = query(
    readings,
    orderBy("timestamp", "desc"),
    limit(50)
  );

  const snapshot = await getDocs(q);

  return snapshot.docs
    .map((item) => ({
      id: item.id,
      ...item.data()
    }))
    .reverse();
}

export async function getAlerts(uid, deviceId) {
  const alerts = collection(
    db,
    "users",
    uid,
    "devices",
    deviceId,
    "alerts"
  );

  const q = query(
    alerts,
    orderBy("createdAt", "desc"),
    limit(20)
  );

  const snapshot = await getDocs(q);

  return snapshot.docs.map((item) => ({
    id: item.id,
    ...item.data()
  }));
}

export async function getWateringHistory(
  uid,
  deviceId
) {
  const events = collection(
    db,
    "users",
    uid,
    "devices",
    deviceId,
    "wateringEvents"
  );

  const q = query(
    events,
    orderBy("timestamp", "desc"),
    limit(20)
  );

  const snapshot = await getDocs(q);

  return snapshot.docs.map((item) => ({
    id: item.id,
    ...item.data()
  }));
}