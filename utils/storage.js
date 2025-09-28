// utils/storage.js
import AsyncStorage from "@react-native-async-storage/async-storage";

const RACES_KEY = "@racertron_races_v1";

/** Load all races (returns array) */
export async function loadRaces() {
  try {
    const json = await AsyncStorage.getItem(RACES_KEY);
    return json ? JSON.parse(json) : [];
  } catch (err) {
    console.error("loadRaces error", err);
    return [];
  }
}

/** Save full races array */
export async function saveRaces(races) {
  try {
    await AsyncStorage.setItem(RACES_KEY, JSON.stringify(races));
  } catch (err) {
    console.error("saveRaces error", err);
  }
}

/** Save or update a single race (adds if missing) */
export async function saveRace(race) {
  try {
    const races = await loadRaces();
    const idx = races.findIndex((r) => r.id === race.id);
    if (idx >= 0) {
      races[idx] = race;
    } else {
      races.push(race);
    }
    await saveRaces(races);
    return race;
  } catch (err) {
    console.error("saveRace error", err);
    throw err;
  }
}

/**
 * Update a race by ID
 */
export async function updateRace(updatedRace) {
  const races = await loadRaces();
  const idx = races.findIndex(r => r.id === updatedRace.id);
  if (idx > -1) {
    races[idx] = updatedRace;
    await saveRaces(races);
  }
}

/** Remove a race (optional helper) */
export async function deleteRace(raceId) {
  try {
    const races = await loadRaces();
    const filtered = races.filter((r) => r.id !== raceId);
    await saveRaces(filtered);
  } catch (err) {
    console.error("deleteRace error", err);
  }
}

/** Returns the first race that is running and not stopped, or null */
export async function loadRunningRace() {
  try {
    const races = await loadRaces();
    return races.find((r) => r.running && !r.stopped) || null;
  } catch (err) {
    console.error("loadRunningRace error", err);
    return null;
  }
}
