// ./screens/Races.js
import React, { useContext } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { Swipeable } from "react-native-gesture-handler";
import { useRaceContext, createRace } from "../RaceContext";
import { Ionicons } from "@expo/vector-icons";
import { exportRaceToCSV } from '../utils/exportCsv';
import { parseDateYYYYMMDD, parseTimeAMPM, filterDateInput, filterTimeInput, formatDateYYYYMMDD, formatTimeAMPM, formatElapsedTime} from '../utils/handleDateTime.js'

export default function Races({ navigation }) {

  const [recentExpanded, setRecentExpanded] = React.useState(false);

  const { 
    races, 
    setRaces, 
    createRace,
    startRace, 
    stopRace, 
    archiveRace, 
    addFinisher, 
  } = useRaceContext();

  const underway = races.filter((r) => r.state === "started");
  const numUnderway = underway.length;
  const finished = races.filter((r) => r.state === "stopped");
  const handleExport = (race) => exportRaceToCSV(race);
  const handleCreateRace = () => {
    const newRace = createRace("New Race"); 
    setTimeout(() => {
      navigation.navigate("Finishers", { raceId: newRace.id });
    }, 100);
  };

  // Compute whether there are recent stopped races (within 24 hours)
  const now = Date.now();
  const oneDayAgo = now - 24 * 60 * 60 * 10000;

  const recentStoppedRaces = races.filter(
    (r) =>
      r.state === "stopped" &&
      r.stoppedDate &&
      new Date(r.stoppedDate).getTime() > oneDayAgo
  );
  const numRecentStoppedRaces = recentStoppedRaces.length;

  // Stopwatch tickers for Races Underway
  const [tick, setTick] = React.useState(0);
  React.useEffect(() => {
    const interval = setInterval(() => {
      setTick((prev) => prev + 1);
    }, 100);

    return () => clearInterval(interval); // cleanup
  }, []);

  const renderUnderwayRace = ({ item, index }) => {
    const elapsed = Date.now() - item.startTime;
    const timeString = formatElapsedTime(elapsed);

    const leftActions = () => (
      <TouchableOpacity
        style={styles.swipeActionBlue}
        onPress={() => handleExport(item)}
      >
        <Text style={styles.swipeText}>
          <Ionicons name="document-attach-outline" size={24} color="#fff" />
        </Text>
      </TouchableOpacity>
    )

    const rightActions = () => (
      <TouchableOpacity
        style={styles.swipeAction}
        onPress={() => stopRace(item.id)}
      >
        <Text style={styles.swipeText}>Stop</Text>
      </TouchableOpacity>
    );

    const isLast = index === underway.length - 1;

    return (
      <Swipeable 
        renderLeftActions={leftActions}
        renderRightActions={rightActions}
      >
        <TouchableOpacity 
          activeOpacity={1}
          style={[
            styles.underwayRow,
            isLast && { borderBottomWidth: 0, borderBottomColor: "#333", },
          ]}
          onPress={() => navigation.navigate("Finishers", { raceId: item.id })}
        >
          <View style={styles.underwayInfo}>
            <Text style={styles.raceName}>{item.name}</Text>
            <Text style={[ styles.meta, styles.hhmmss ]}>
              {timeString} 
            </Text>
          </View>

          <TouchableOpacity
            style={styles.lapButton}
            onPress={() => addFinisher(item.id)}
          >
            <Text style={styles.lapText}>{item.finishers.length + 1}</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      </Swipeable>
    );
  };

  const renderFinishedRace = ({ item }) => {

    const leftActions = () => (
      <TouchableOpacity
        style={styles.swipeActionBlue}
        onPress={() => handleExport(item)}
      >
        <Text style={styles.swipeText}>
          <Ionicons name="document-attach-outline" size={24} color="#fff" />
        </Text>
      </TouchableOpacity>
    )

    const rightActions = () => (
      <TouchableOpacity
        style={styles.swipeActionGreen}
        onPress={() => startRace(item.id, { state: "archived" })}
      >
        <Text style={styles.swipeText}>Resume</Text>
      </TouchableOpacity>
    );

    return (
      <Swipeable 
        renderLeftActions={leftActions}
        renderRightActions={rightActions}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => navigation.navigate("Finishers", { raceId: item.id })}
        >
          <View style={styles.finishedRow}>
            <Text style={styles.raceName}>{item.name}</Text>
            <Text style={styles.meta}>
              {formatDateYYYYMMDD(new Date(item.startTime))} -- {item.finishers.length} finishers
            </Text>
          </View>
        </TouchableOpacity>
      </Swipeable>
    );
  };

  return (
    <View style={{ flex: 1 }}>
      {/* Floating Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={[styles.circleBtn, styles.startButton]}
          onPress={handleCreateRace}
        >
          <Ionicons name="add" size={28} color="#34C759" /> 
        </TouchableOpacity>

        <View style={styles.headerStopwatch}>
          <Text style={styles.stopwatchText} numberOfLines={1} adjustsFontSizeToFit>
            T:2K
          </Text>
        </View>

        <TouchableOpacity style={styles.circleBtn}>
          <Ionicons name="ellipsis-horizontal" size={28} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Scrollable Content */}
      <ScrollView 
        style={styles.container}
        contentContainerStyle={{ paddingTop: 18 }}
      >
        {/* Underway */}
        
          <Text style={styles.sectionTitle}>Races Underway ({numUnderway})</Text>
        
        {underway.length === 0 ? (
          <Text style={styles.emptyText}>Tap (+) to open a new stopwatch.</Text>
        ) : (
          <FlatList
            data={underway}
            renderItem={renderUnderwayRace}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
          />
        )}

        {/* Spacer */}
        <View style={styles.spacer}></View>

        {/* Finished */}
        {recentStoppedRaces.length > 0 && (
          <View style={styles.buttonSection}>
            <TouchableOpacity 
              style={styles.sectionHeader} 
              onPress={() => setRecentExpanded((prev) => !prev)}
            >
              <Text style={styles.sectionTitle}>
                Recently Stopped ({recentStoppedRaces.length || "0"}) {/* TODO: insert number of recently stopped races here  */} 
              </Text>
              <Text style={styles.chevron}>{recentExpanded ? 
                <Ionicons name="chevron-down" size={24} color="#fff" /> : 
                <Ionicons name="chevron-forward" size={24} color="#fff" />
                }</Text>
            </TouchableOpacity>

            {recentExpanded && (
              <>
                {finished.length === 0 ? (
                  <Text style={styles.emptyText}>No recently stopped races.</Text>
                ) : (
                  <>
                    <FlatList
                      data={finished.slice(0, numRecentStoppedRaces)}
                      renderItem={renderFinishedRace}
                      keyExtractor={(item) => item.id}
                      scrollEnabled={false}
                    />
                    <View style={styles.spacer}></View>
                  </>
                )}
              </>
            )}
          </View> 
        )}
      </ScrollView>
    </View> 
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000", padding: 16, paddingTop: 48 },
  scrollContent: {
    paddingBottom: 40,
  },
  header: {
    position: "absolute",
    top: 4, // below status bar (adjust as needed)
    left: 0,
    right: 0,
    zIndex: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
  },
  headerStopwatch: {
    backgroundColor: "#9f9f9f", // light gray 
    backgroundColor: "#141414", // dark gray 
    // backgroundColor: "#19631e", // green 
    borderColor: "#3a3a3a",
    borderWidth: 0,
    padding: 2,
    marginHorizontal: 14,
    flex: 1,
    borderRadius: 26,
    height: 52,
  },
  stopwatch: {
    justifyContent: "center",
    alignItems: "center", 
    width: "100%",
    // marginBottom: 16,
  },
  stopwatchText: {
    color: '#3a3a3a', // dark gray 
    color: "#9f9f9f", // light gray 
    // color: '#34C759', // green 
    fontSize: 36,
    fontVariant: "tabular-nums",
    fontWeight: "300",
    textAlign: "center",
  },
  circleBtn: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: "#3a3a3a", // medium dark gray 
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 5,
  },
  spacer: {
    height: 20,
  },
  sectionTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
    marginVertical: 8,
  },
  raceName: { color: "#fff", fontSize: 18 },
  meta: { color: "#aaa", fontSize: 14, marginTop: 4 },
  hhmmss: { 
    fontVariant: "tabular-nums", 
    fontSize: 32,
  },

  underwayRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "#333",
    height: 110,
    paddingLeft: 10,
    backgroundColor: "#000",
  },
  underwayInfo: { flex: 1, justifyContent: "center" },
  lapButton: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "#2f2708",
    alignItems: "center",
    justifyContent: "center",
  },
  lapText: { color: "#FFD52E", fontSize: 18, },

  startButton: {
    backgroundColor: "#19361e",
  },
  startText: { color: "#34C759", fontSize: 18, },

  buttonSection: {
    backgroundColor: "#141414", // gray 
    borderRadius: 37,
    minHeight: 74,
    paddingHorizontal: 10,
  },

  finishedRow: {
    height: 70,
    justifyContent: "center",
    // borderBottomWidth: 1,
    borderBottomColor: "#333",
    padding: 10,
    backgroundColor: "#141414",
  },

  swipeText: { color: "#fff", fontWeight: "normal", fontSize: 18 },

  swipeAction: {
    backgroundColor: "#ff3b30", // red 
    justifyContent: "center",
    alignItems: "flex-end",
    paddingHorizontal: 20,
    marginVertical: 1,
  },
  swipeActionBlue: {
    backgroundColor: "#007AFF", // blue
    justifyContent: "center",
    alignItems: "flex-start",
    paddingHorizontal: 20,
    marginVertical: 1,
  },
  swipeActionGreen: {
    backgroundColor: "#43C35D", // green
    justifyContent: "center",
    alignItems: "flex-start",
    paddingHorizontal: 20,
    marginVertical: 1,
  },

  emptyText: { 
    color: "#ddd", 
    fontStyle: "italic", 
    marginBottom: 8,
    paddingTop: 18,
    fontSize: 18,
  },
  archiveLink: { marginTop: 20, alignSelf: "center" },
  archiveText: { color: "#888", fontSize: 16 },
  recentLinks: {
    marginTop: 10,
    alignItems: "center",
    gap: 6,
  },

  linkText: {
    color: "#888",
    fontSize: 16,
    textDecorationLine: "underline",
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginVertical: 8,
    padding: 8,
  },
  chevron: {
    color: "#888",
    fontSize: 18,
  },
  menuBtn: {
    justifyContent: "center",
    alignItems: "flex-end",
    paddingLeft: 8,
  },
  fab: {
    position: "absolute",
    bottom: 40,
    right: 16,
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: "#007AFF", // or your app accent color
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 6,
    elevation: 8,
  },
});
