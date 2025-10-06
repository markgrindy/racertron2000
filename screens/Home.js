import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { Swipeable } from "react-native-gesture-handler";
import { useNavigation } from "@react-navigation/native";
import { useRaceContext } from "../RaceContext";

function formatElapsed(ms) {
  if (!ms) return "00:00:00";
  const totalSec = Math.floor(ms / 1000);
  const hrs = String(Math.floor(totalSec / 3600)).padStart(2, "0");
  const mins = String(Math.floor((totalSec % 3600) / 60)).padStart(2, "0");
  const secs = String(totalSec % 60).padStart(2, "0");
  return `${hrs}:${mins}:${secs}`;
}

export default function Home() {
  const { races, stopRace, archiveRace, addFinisher } = useRaceContext();
  const [now, setNow] = useState(Date.now());
  const navigation = useNavigation();

  // Update timer display every second
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  const underway = races.filter((r) => r.state === "started");
  const finished = races.filter((r) => r.state === "stopped");

  const renderUnderway = ({ item }) => {
    const elapsed = item.startTime ? now - item.startTime : 0;
    const finishCount = item.finishers?.length || 0;

    const rightActions = () => (
      <TouchableOpacity
        style={[styles.swipeAction, { backgroundColor: "#f00" }]}
        onPress={() => stopRace(item.id)}
      >
        <Text style={styles.swipeText}>Stop</Text>
      </TouchableOpacity>
    );

    return (
      <Swipeable renderRightActions={rightActions}>
        <View style={styles.underwayRow}>
          <TouchableOpacity
            style={{ flex: 1 }}
            onPress={() => navigation.navigate("RaceView", { raceId: item.id })}
          >
            <Text style={styles.title}>{item.name}</Text>
            <Text style={styles.meta}>
              {formatElapsed(elapsed)} — {finishCount} finishers
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.circleButton}
            onPress={() => addFinisher(item.id)}
          >
            <Text style={styles.circleText}>{finishCount + 1}</Text>
          </TouchableOpacity>
        </View>
      </Swipeable>
    );
  };

  const renderFinished = ({ item }) => {
    const rightActions = () => (
      <TouchableOpacity
        style={[styles.swipeAction, { backgroundColor: "#444" }]}
        onPress={() => archiveRace(item.id)}
      >
        <Text style={styles.swipeText}>Archive</Text>
      </TouchableOpacity>
    );

    return (
      <Swipeable renderRightActions={rightActions}>
        <TouchableOpacity
          style={styles.finishedRow}
          onPress={() => navigation.navigate("RaceView", { raceId: item.id })}
        >
          <Text style={styles.titleSmall}>{item.name}</Text>
        </TouchableOpacity>
      </Swipeable>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Underway</Text>
      <FlatList
        data={underway}
        keyExtractor={(r) => r.id}
        renderItem={renderUnderway}
        ListEmptyComponent={<Text style={styles.empty}>No races running</Text>}
      />

      <Text style={styles.sectionTitle}>Finished</Text>
      <FlatList
        data={finished}
        keyExtractor={(r) => r.id}
        renderItem={renderFinished}
        ListEmptyComponent={<Text style={styles.empty}>No finished races</Text>}
      />

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#000" },
  sectionTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
    marginTop: 10,
    marginBottom: 5,
  },
  underwayRow: {
    flexDirection: "row",
    alignItems: "center",
    height: 90,
    borderBottomWidth: 1,
    borderBottomColor: "#222",
  },
  finishedRow: {
    height: 50,
    justifyContent: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#222",
  },
  title: { color: "#fff", fontSize: 18, fontWeight: "600" },
  titleSmall: { color: "#fff", fontSize: 16 },
  meta: { color: "#aaa", fontSize: 14 },
  empty: { color: "#555", textAlign: "center", marginVertical: 10 },
  circleButton: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "#222",
    justifyContent: "center",
    alignItems: "center",
  },
  circleText: { color: "#fff", fontSize: 24, fontWeight: "bold" },
  swipeAction: {
    justifyContent: "center",
    alignItems: "center",
    width: 100,
    height: "100%",
  },
  swipeText: { color: "#fff", fontWeight: "bold" },
  archivedButton: {
    paddingVertical: 16,
    marginTop: 20,
    borderTopWidth: 1,
    borderColor: "#222",
  },
  archivedText: {
    color: "#888",
    textAlign: "center",
    fontSize: 16,
  },
});
