// screens/NewRace.js
import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  TextInput,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";

import { exportRaceToCSV } from "../utils/exportCsv";
import { saveRace, updateRace, loadRunningRace } from "../utils/storage"; // keep if you persist

// small id helper
const genId = () => Date.now().toString();

const formatHHMMSS = (secs) => {
  const h = String(Math.floor(secs / 3600)).padStart(2, "0");
  const m = String(Math.floor((secs % 3600) / 60)).padStart(2, "0");
  const s = String(secs % 60).padStart(2, "0");
  return `${h}:${m}:${s}`;
};

export default function NewRace() {
  // meta
  const [raceLocation, setRaceLocation] = useState("New Race");
  const [editingLocation, setEditingLocation] = useState(false);

  // start time
  const [raceStartTime, setRaceStartTime] = useState(new Date());

  // race control flags
  const [isStarted, setIsStarted] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  // finishers
  const [finishers, setFinishers] = useState([]);

  // display seconds
  const [displaySecs, setDisplaySecs] = useState(0);
  const timerRef = useRef(null);
  const listRef = useRef(null);

  // restore running race on mount
  useEffect(() => {
    (async () => {
      try {
        const running = await loadRunningRace?.();
        if (running) {
          const start = running.startTime ? new Date(running.startTime) : new Date();
          setRaceStartTime(start);
          const mapped = (running.finishers || []).map((t, i) => ({
            id: genId() + "_r",
            place: i + 1,
            timestamp: start.getTime(), // not precise without seconds, but safe
            time: t,
          }));
          setFinishers(mapped);
          setIsStarted(true);
          setIsPaused(!running.running);
          if (running.running) startClockImmediate(start);
        }
      } catch {}
    })();
  }, []);

  // timer effect
  useEffect(() => {
    if (isStarted && !isPaused) {
      setDisplaySecs(Math.floor((Date.now() - raceStartTime.getTime()) / 1000));
      timerRef.current = setInterval(() => {
        setDisplaySecs(Math.floor((Date.now() - raceStartTime.getTime()) / 1000));
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      if (!isStarted) setDisplaySecs(0);
    }
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isStarted, isPaused, raceStartTime]);

  useEffect(() => {
    if (listRef.current && finishers.length > 0) {
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 60);
    }
  }, [finishers]);

  // actions
  const startRace = async () => {
    const now = new Date();
    setRaceStartTime(now);
    setIsStarted(true);
    setIsPaused(false);
    setFinishers([]);
    setDisplaySecs(0);
    try {
      await saveRace?.({
        id: genId(),
        startTime: now.toISOString(),
        finishers: [],
        running: true,
        location: raceLocation,
      });
    } catch {}
  };

  const logFinisher = async () => {
    if (!isStarted) return;
    const ts = Date.now();
    const secs = Math.floor((ts - raceStartTime.getTime()) / 1000);
    const timeStr = formatHHMMSS(secs);
    const entry = { id: genId(), place: finishers.length + 1, timestamp: ts, time: timeStr };
    setFinishers((p) => [...p, entry]);
    try {
      await updateRace?.({
        startTime: raceStartTime.toISOString(),
        finishers: [...(finishers.map((f) => f.time) || []), timeStr],
        running: !isPaused,
        location: raceLocation,
      });
    } catch {}
  };

  const pauseRace = async () => {
    if (!isStarted) return;
    setIsPaused(true);
    try {
      await updateRace?.({
        startTime: raceStartTime.toISOString(),
        finishers: finishers.map((f) => f.time),
        running: false,
        location: raceLocation,
        finished: true,
      });
    } catch {}
  };

  const resumeRace = () => {
    if (!isStarted) return;
    setIsPaused(false);
  };

  const startNewRace = () => {
    setIsStarted(false);
    setIsPaused(false);
    setFinishers([]);
    setDisplaySecs(0);
  };

  const handleExport = async () => {
    if (!finishers.length) return;
    const datePart = raceStartTime.toISOString().split("T")[0];
    const locationPart = (raceLocation || "New_Race").replace(/\s+/g, "_");
    const filename = `${datePart}_${locationPart}`;
    const simpleRace = {
      startedAt: raceStartTime,
      finishers: finishers.map((f) => f.time),
    };
    try {
      await exportRaceToCSV(simpleRace, filename);
    } catch (err) {
      console.error("export failed", err);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View style={styles.root}>

        {/* Location */}
        <View style={styles.row}>
          <TextInput
            style={styles.underlineInput}
            value={raceLocation}
            onChangeText={(txt) => setRaceLocation(txt)}
            placeholder="Enter location"
            editable={true}
          />
          <MaterialIcons name="edit" size={20} color="gray" style={styles.icon} />
        </View>

        {/* Race Start Date+Time (read only) */}
        <View style={styles.dateTimeTouchable}>
          <Text style={styles.dateTimeText}>
            {raceStartTime.toLocaleString("en-US", {
              month: "short",
              day: "2-digit",
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
            })}
          </Text>
        </View>

        {/* Stopwatch */}
        <View style={styles.timerRow}>
          <Text style={styles.timerText} numberOfLines={1} adjustsFontSizeToFit>
            {formatHHMMSS(displaySecs)}
          </Text>
        </View>

        {/* Buttons */}
        <View style={styles.buttonsArea}>
          {!isStarted && (
            <TouchableOpacity style={styles.fullButton} onPress={startRace}>
              <Text style={styles.fullButtonText}>Start Race</Text>
            </TouchableOpacity>
          )}

          {isStarted && !isPaused && (
            <View style={styles.buttonRow}>
              <TouchableOpacity style={styles.circleBtn} onPress={pauseRace}>
                <Text style={styles.circleTxt}>⏸</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.fillBtn} onPress={logFinisher}>
                <Text style={styles.fillTxt}>Finisher {finishers.length + 1}</Text>
              </TouchableOpacity>
            </View>
          )}

          {isStarted && isPaused && (
            <>
              <View style={styles.buttonRow}>
                <TouchableOpacity style={styles.circleBtn} onPress={resumeRace}>
                  <Text style={styles.circleTxt}>▶</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.fillBtn} onPress={handleExport}>
                  <Text style={styles.fillTxt}>Export CSV</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity style={[styles.fullButton, { marginTop: 8 }]} onPress={startNewRace}>
                <Text style={styles.fullButtonText}>Start New Race</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* Finishers */}
        <FlatList
          ref={listRef}
          data={finishers}
          keyExtractor={(it) => it.id}
          renderItem={({ item }) => (
            <View style={styles.finRow}>
              <Text style={styles.finText}>{item.place}. {item.time}</Text>
            </View>
          )}
          contentContainerStyle={{ paddingBottom: 24 }}
          style={styles.finList}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, padding: 16 },
  row: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  underlineInput: { flex: 1, borderBottomWidth: 1, borderColor: "#ccc", paddingVertical: 4 },
  icon: { marginLeft: 6 },
  dateTimeTouchable: { marginBottom: 12 },
  dateTimeText: { fontSize: 16, color: "#444" },
  timerRow: { alignItems: "center", marginVertical: 20 },
  timerText: { fontSize: 48, fontWeight: "bold" },
  buttonsArea: { marginVertical: 12 },
  buttonRow: { flexDirection: "row", justifyContent: "space-between", marginVertical: 8 },
  fullButton: { backgroundColor: "#007AFF", padding: 12, borderRadius: 6, alignItems: "center" },
  fullButtonText: { color: "#fff", fontSize: 16 },
  circleBtn: { backgroundColor: "#eee", padding: 12, borderRadius: 30, marginRight: 12 },
  circleTxt: { fontSize: 18 },
  fillBtn: { flex: 1, backgroundColor: "#007AFF", padding: 12, borderRadius: 6, alignItems: "center" },
  fillTxt: { color: "#fff", fontSize: 16 },
  finRow: { paddingVertical: 8, borderBottomWidth: 1, borderColor: "#eee" },
  finText: { fontSize: 16 },
  finList: { marginTop: 16 },
});
