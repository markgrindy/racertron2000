// RACE VIEW 

// screens/RaceView.js
import React, { useState, useEffect, useRef, useContext } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Alert,
  FlatList,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { GestureHandlerRootView, Swipeable } from 'react-native-gesture-handler';
import { useNavigation } from "@react-navigation/native";
import { RaceContext, useRace } from '../RaceContext';
import RaceNamePrompt from '../components/RaceNamePrompt';
import { exportRaceToCSV } from '../utils/exportCsv';
import { useActionSheet } from '@expo/react-native-action-sheet';

export default function RaceView() {

  // ---- useStates ---- 
  const [location, setLocation] = useState("");
  const [logs, setLogs] = useState([]);
  const [elapsed, setElapsed] = useState(0);
  const [showPrompt, setShowPrompt] = useState(false); // TODO: not currently in use

  const [dateText, setDateText] = useState(formatDateYYYYMMDD(new Date()));
  const [timeText, setTimeText] = useState(formatTimeAMPM(new Date()));

  const { raceState, setRaceState, raceName, setRaceName, startRace, setStartRace, startTime, setStartTime, addFinisher, removeFinisher, finishers, deletedFinishers, getRace, clearRace } = useContext(RaceContext);

  const flatListRef = useRef(null);
  const navigation = useNavigation();

  // ---- Stopwach and finish time syncing ---- 
  useEffect(() => {
    setDateText(formatDateYYYYMMDD(startTime));
    setTimeText(formatTimeAMPM(startTime));
  }, [startTime]);

  useEffect(() => {
    let interval;

    if (raceState === "running") {
      interval = setInterval(() => {
        if (startTime) {
          setElapsed(Date.now() - new Date(startTime).getTime());
        }
      }, 10);

      // Immediate recalc if start time changes
      if (startTime) {
        setElapsed(Date.now() - new Date(startTime).getTime());
      }
    } else if (raceState === "finished") {
      if (interval) clearInterval(interval); 
    } else if (raceState === "before") {
      setElapsed(0);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [raceState, startTime]);

  // ---- Menu button ----
  const { showActionSheetWithOptions } = useActionSheet();

  const showMenu = () => {
    const options = [
      "Export CSV",
      "Insert finish time",
      ...(deletedFinishers.length > 0 ? ["View deleted times"] : []),
      "Reset stopwatch",
      "Cancel",
    ]; 

    const destructiveButtonIndex = options.indexOf("Reset stopwatch");
    const cancelButtonIndex = options.indexOf("Cancel");

    showActionSheetWithOptions(
      {
        options,
        destructiveButtonIndex,
        cancelButtonIndex,
      },
      (buttonIndex) => {
        const pressed = options[buttonIndex];
        if (pressed === "View deleted times") {
          navigation.navigate("DeletedLogsScreen");
        }
        if (pressed === "Export CSV") {
          handleExport();
        }
        if (pressed === "Insert finish time") {
          // TODO
        }
        if (pressed === "Reset stopwatch") {
          // TODO: save the current race results and create a new entry
          setRaceState("before");
          setRaceName(null);
          setStartTime(null);
          clearRace(); 
        }
      }
    );
  };

  // ---- Formatters ----
  function formatDateYYYYMMDD(d) {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  }

  function formatTimeAMPM(d) {
    let hh = d.getHours();
    const mm = String(d.getMinutes()).padStart(2, "0");
    const ss = String(d.getSeconds()).padStart(2, "0");
    const ampm = hh >= 12 ? "PM" : "AM";
    hh = hh % 12;
    hh = hh === 0 ? 12 : hh;
    return `${hh}:${mm}:${ss} ${ampm}`;
  }

  // ---- Parsers ----
  function parseDateYYYYMMDD(txt) {
    const re = /^\s*(\d{4})-(\d{2})-(\d{2})\s*$/;
    const m = txt.match(re);
    if (!m) return null;
    const yyyy = parseInt(m[1], 10);
    const mm = parseInt(m[2], 10);
    const dd = parseInt(m[3], 10);
    const d = new Date(yyyy, mm - 1, dd);
    if (
      d.getFullYear() === yyyy &&
      d.getMonth() === mm - 1 &&
      d.getDate() === dd
    ) {
      return d;
    }
    return null;
  }

  function parseTimeAMPM(txt) {
    const re = /^\s*(0?[1-9]|1[0-2]):([0-5][0-9]):([0-5][0-9])\s*(AM|PM)\s*$/i;
    const m = txt.match(re);
    if (!m) return null;
    let hh = parseInt(m[1], 10);
    const mm = parseInt(m[2], 10);
    const ss = parseInt(m[3], 10);
    const ampm = m[4].toUpperCase();
    if (ampm === "PM" && hh !== 12) hh += 12;
    if (ampm === "AM" && hh === 12) hh = 0;
    return { hh, mm, ss };
  }

  // ---- Handlers ----
  const onDateBlur = () => {
    const parsed = parseDateYYYYMMDD(dateText);
    if (parsed && startTime) {
      const newDT = new Date(startTime);
      newDT.setFullYear(parsed.getFullYear());
      newDT.setMonth(parsed.getMonth());
      newDT.setDate(parsed.getDate());
      setStartTime(newDT);
    } else {
      Alert.alert("Invalid date", "Please enter date as yyyy-mm-dd");
      setDateText(formatDateYYYYMMDD(startTime));
    }
  };

  const onTimeBlur = () => {
    const parsed = parseTimeAMPM(timeText);
    if (parsed) {
      const newDT = new Date(startTime);
      newDT.setHours(parsed.hh, parsed.mm, parsed.ss, 0);
      setStartTime(newDT);
    } else {
      Alert.alert(
        "Invalid time",
        "Please enter time as h:mm:ss AM/PM (e.g. 2:05:00 PM)"
      );
      setTimeText(formatTimeAMPM(startTime));
    }
  };

  const recalcLogs = (newStart) => {
    setLogs((prev) =>
      prev.map((log) => {
        const elapsedMs = log.actualTime - newStart;
        return {
          ...log,
          time: formatElapsedTime(elapsedMs),
        };
      })
    );
  };

  const handleStartPress = () => {
    if (!startTime) {
      setStartTime(new Date());  
      setLogs([]);
    };    
    setRaceState("running");
  };

  const handleStopPress = () => {
    setRaceState("finished");
  };

  const handleLogPress = () => {

    if (!startTime) return;

    // const now = new Date(); // must be a Date, not timestamp
    const nowMs = Date.now(); 
    const startMs = typeof startTime === "number" ? startTime : startTime.getTime(); 
    const elapsedMs = nowMs - startMs; 
    const formatted = formatElapsedTime(elapsedMs);   
    addFinisher(`Runner ${finishers.length + 1}`, formatted, nowMs);

  };

  function handleExport() {
    // we used to ask: if (!raceName) {setShowPrompt(true);} 
    // but it had trouble running exportRaceToCSV afterward
    // so now we just export and give it a default name
    exportRaceToCSV(getRace());
  }

  // ---- Formatters ----
  function formatElapsedTime(ms) {
    // if (isNaN(ms)) return "<error: NaN>";
    let totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    totalSeconds %= 3600;
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    const hh = hours > 0 ? `${hours}:` : ""; // omit hours if 0
    const mm = String(minutes).padStart(2, "0");
    const ss = String(seconds).padStart(2, "0");

    return `${hh}${mm}:${ss}`;
  }

  const formatTime = (ms) => {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
      return `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
    } else {
      return `${minutes}:${String(seconds).padStart(2, "0")}`;
    }
  };

  // Restrict what characters can be typed
  const filterDateInput = (txt) => {
    // allow only digits and dashes
    return txt.replace(/[^0-9-]/g, "");
  };

  const filterTimeInput = (txt) => {
  // allow digits, colon, space, A/a, M/m, P/p
  return txt.replace(/[^0-9: apmAPM]/g, "");
};

  return (
    <GestureHandlerRootView>
      <SafeAreaView style={styles.safe}>
        <View style={styles.root}>
          {/* Row 1: Race name */}
          <View style={[styles.nameRow]}>
            <TextInput
              value={raceName}
              onChangeText={setRaceName}
              placeholder="New Race"
              placeholderTextColor="#777"
              style={styles.nameInput}
              returnKeyType="done"
              selectionColor="#fff" 
            />
            <TouchableOpacity style={[styles.backBtn]}>
              <Ionicons name="chevron-back-circle" size={54} color="#777" />
            </TouchableOpacity>
          </View>

          {/* Row 2: Date + Time */}
          <View style={styles.row}>
            {raceState === "before" ? (
              <Text style={[styles.dateInput, {color: "#777"}]}>{ dateText }</Text>
            ) : (
              <>
                <View style={styles.cell}>
                  <TextInput
                    value={dateText}
                    onChangeText={(txt) => setDateText(filterDateInput(txt))}
                    onBlur={onDateBlur}
                    style={styles.dateInput}
                    keyboardType={Platform.OS === "ios" ? "numbers-and-punctuation" : "default"}
                    autoCorrect={false}
                    autoCapitalize="none"
                    selectionColor="#fff" 
                  />
                </View>
                <View style={[styles.cell, styles.rightCell]}>
                  <TextInput
                    value={timeText}
                    onChangeText={(txt) => setTimeText(filterTimeInput(txt))}
                    onBlur={onTimeBlur}
                    style={styles.timeInput}
                    keyboardType={Platform.OS === "ios" ? "numbers-and-punctuation" : "default"}
                    autoCorrect={false}
                    autoCapitalize="none"
                    selectionColor="#fff" 
                  />
                </View>
              </>
            )}
          </View>

          {/* Row 3: Stopwatch */}
          <View style={styles.stopwatch}>
            <Text style={styles.stopwatchText} numberOfLines={1} adjustsFontSizeToFit>
              {formatElapsedTime(elapsed)}
            </Text>
          </View>        

          {/* Row 4: Three buttons */}
          <View style={[styles.row, styles.btnRow]}>
            {/* Left button — Start | Stop */}
            {raceState !== "running" && (
              <TouchableOpacity style={[styles.circleBtn, styles.startBtn]} onPress={startRace}>
                <Text style={styles.startTxt}>Start</Text>
              </TouchableOpacity>
            )}

            {raceState === "running" && (
              <TouchableOpacity style={[styles.circleBtn, styles.stopBtn]} onPress={handleStopPress}>
                <Text style={styles.stopTxt}>Stop</Text>
              </TouchableOpacity>
            )}

            {/* Middle button — Menu */}          
            {raceState === "running" ? (
              <TouchableOpacity style={[styles.circleBtn, styles.iconBtn]} onPress={showMenu}>
                <Ionicons name="menu-outline" size={54} color="#9f9f9f" />
              </TouchableOpacity>
            ) : raceState === "finished" ? (
              <TouchableOpacity style={[styles.circleBtn, styles.iconBtn]} onPress={showMenu}>
                <Ionicons name="menu-outline" size={54} color="#9f9f9f" />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={[styles.circleBtn, styles.iconBtn]} />
            )}

            {/* Right button — Log | Share */}
            {raceState === "running" ? (
              <TouchableOpacity
                style={[styles.circleBtn, styles.iconBtn, styles.logBtn]}
                onPress={handleLogPress}
              >
                <Text style={[styles.circleTxt, styles.logTxt]}>{finishers.length + 1}</Text>
              </TouchableOpacity>
            ) : raceState === "finished" ? (
              <TouchableOpacity 
                style={[styles.circleBtn, styles.iconBtn]}
                onPress={handleExport}
              >
                <Ionicons name="document-attach-outline" size={36} color="#9f9f9f" />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={[styles.circleBtn, styles.iconBtn]} />
            )}
          </View>

          {/* Row 5: Results list */}
          <FlatList
            ref={flatListRef}
            data={finishers}
            keyExtractor={(item) => item.id}
            extraData={startTime}
            renderItem={({ item, index }) => {
              const startMs = startTime?.getTime();
              const finishMs = item.finishTime;
              const elapsedMs = startMs != null && finishMs != null ? finishMs - startMs : null;
              const displayTime = elapsedMs != null ? formatElapsedTime(elapsedMs) : "--:--";

              // define renderRightActions here
              const renderRightActions = (id) => (
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => removeFinisher(id)} // use context removeFinisher
                >
                  <Text style={styles.deleteText}>Delete</Text>
                </TouchableOpacity>
              );

              return (
                <Swipeable renderRightActions={() => renderRightActions(item.id)}>
                  <View style={[ styles.swipeableRow ]}>
                    <Text style={styles.placeCol}>{index + 1}.</Text>
                    <Text style={styles.timeCol}>{displayTime}</Text>
                  </View>
                </Swipeable> 
              );       
            }}

            onContentSizeChange={() =>
              flatListRef.current?.scrollToEnd({ animated: true })
            }
            onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
          />

        </View>

        <RaceNamePrompt
          visible={showPrompt}
          onCancel={() => setShowPrompt(false)}
          onSave={(newName) => {
            setRaceName(newName);
            setShowPrompt(false);
            const updatedRace = { ...getRace(), name: newName };
            exportRaceToCSV(updatedRace); 
          }}
        />
      </SafeAreaView>
    </GestureHandlerRootView> 
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#000" },
  root: { flex: 1, padding: 16, backgroundColor: "#000" },

  row: {
    flexDirection: "row",
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#333",
  },
  cell: { flex: 1 },
  rightCell: {
    alignItems: "flex-end",
    justifyContent: "center",
  },
  centerRow: {
    justifyContent: "center",
    borderBottomWidth: 0,
  },
  nameRow: {
    flexDirection: "row",
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#333",
    alignItems: "flex-end",
  },

  nameInput: {
    flex: 1,
    color: "#fff",
    fontSize: 20,
    fontWeight: "700",
    paddingBottom: 6,
    paddingTop: 4,
    // paddingVertical: 0,
    // textAlign: "center",
  },
  backBtn: {
    justifyContent: "center",
    alignItems: "flex-end",
    paddingLeft: 8,
  },
  dateInput: {
    fontSize: 16,
    color: "#fff",
    paddingBottom: 6,
  },
  timeInput: {
    fontSize: 16,
    color: "#fff",
    paddingBottom: 6,
    textAlign: "right",
  },

  circleBtn: {
    backgroundColor: "#19361e",
    width: 90,
    height: 90,
    borderRadius: 45,
    alignItems: "center",
    justifyContent: "center",
  },

  circleTxt: {
    fontSize: 18,
    color: "#fff",
  },

  btnRow: {
    justifyContent: "space-between",
    borderBottomWidth: 0,
    marginTop: 20,
  },

  startTxt: {
    fontSize: 18,
    color: "#34C759",
  },

  stopBtn: {
    backgroundColor: "#330d0e",
  },
  stopTxt: {
    fontSize: 18,
    color: "#ff3b30",
  },

  iconBtn: {
    backgroundColor: "#141414",
  },

  iconTxt: {
    fontSize: 18,
    color: "#9f9f9f",
  },

  logBtn: {
    backgroundColor: "#2f2708",
  },

  logTxt: {
    color: "#FFD52E",
  }, 

  placeCol: {
    width: 40, // enough for "999."
    fontSize: 16,
    color: "#fff",
  },

  timeCol: {
    flex: 1,
    fontSize: 16,
    color: "#fff",
  },

  swipeableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#333",
    height: 50,        // <-- give your row a fixed height
    alignItems: "center",
    paddingHorizontal: 10,
  },

  deleteButton: {
    backgroundColor: '#ff3b30',
    justifyContent: 'center',
    alignItems: 'center',      // center text vertically
    width: 80,                  // fixed width of the button
    height: '100%',             // match the row height
  },

  deleteText: {
    color: '#fff',
    // fontWeight: '700',
    fontSize: 16,
  },

  stopwatch: {
    justifyContent: "center",
    alignItems: "center", 
    width: "100%",
  },

  stopwatchText: {
    color: '#fff',
    fontSize: 64,
    fontVariant: `tabular-nums`,
    fontWeight: "200",
    textAlign: "center",
  }

});
