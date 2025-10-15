// screens/Finishers.js
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
import { Swipeable } from 'react-native-gesture-handler';
import { useRoute, useNavigation } from "@react-navigation/native";
import { useRaceContext } from '../RaceContext';
import { parseDateYYYYMMDD, parseTimeAMPM, filterDateInput, filterTimeInput, formatDateYYYYMMDD, formatTimeAMPM, formatElapsedTime} from '../utils/handleDateTime.js'

import RaceNamePrompt from '../components/RaceNamePrompt';
import { exportRaceToCSV } from '../utils/exportCsv';
import { useActionSheet } from '@expo/react-native-action-sheet';

export default function Finishers() {

  // Navigation 
  const route = useRoute();
  const navigation = useNavigation();
  const { raceId } = route.params || {};
  const inputRef = useRef(null);

  // State management 
  const { getRaceById, startRace, stopRace, addFinisher, manualAddFinisher, removeFinisher, nameRace, setStartTime } = useRaceContext();
  const [race, setRace] = useState(() => getRaceById(raceId));
  const flatListRef = useRef(null);

  // console.log(race.name + "=> race.startTime = " + race.startTime);
  // console.log(race.name + "=> new Date(race.startTime) = " + new Date(race.startTime));

  // Init name, startTime, elapsed time 
  const startTime = race.startTime; 
  const [dateText, setDateText] = useState(formatDateYYYYMMDD(new Date(race.startTime) || new Date()));
  const [timeText, setTimeText] = useState(formatTimeAMPM(new Date(race.startTime) || new Date()));
  const [elapsed, setElapsed] = useState(0);

  // Keep race updated when context changes
  useEffect(() => {
    setRace(getRaceById(raceId));
  }, [getRaceById, raceId]);

  if (!race) {
    return (
      <SafeAreaView style={styles.safe}>
        <Text style={styles.error}>Race not found.</Text>
      </SafeAreaView>
    );
  }

  // ---- Stopwach and finish time syncing ---- 
  useEffect(() => {
    setDateText(formatDateYYYYMMDD(new Date(race.startTime)));
    setTimeText(formatTimeAMPM(new Date (race.startTime)));
  }, [race.startTime]);

  useEffect(() => {
    let interval;

    if (race.state === "started") {
      interval = setInterval(() => {
        if (race.startTime) {
          setElapsed(Date.now() - new Date(race.startTime).getTime());
        }
      }, 10);

      // Immediate recalc if start time changes
      if (startTime) {
        setElapsed(Date.now() - new Date(race.startTime).getTime());
      }
    } else if (race.state === "finished") {
      if (interval) clearInterval(interval); 
    } else if (race.state === "before") {
      setElapsed(0);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [race.state, race.startTime]);

  // ---- Handlers ---- 

  const handleStartPress = () => startRace(race.id);
  const handleStopPress = () => stopRace(race.id);
  const handleAddFinisher = () => addFinisher(race.id);

  const handleNameRace = (name) => nameRace(race.id, name); 
  const handleDateChange = (date) => setStartTime(race.id, date);
  const handleExport = () => exportRaceToCSV(race);

  const onDateBlur = () => {
    const parsed = parseDateYYYYMMDD(dateText);
    console.log(parsed);
    if (parsed && startTime) {
      const newDT = new Date(startTime);
      // console.log("prev: " + newDT);
      newDT.setFullYear(parsed.getFullYear());
      newDT.setMonth(parsed.getMonth());
      newDT.setDate(parsed.getDate());
      // console.log("new!: " + newDT);
      handleDateChange(newDT);
    } else {
      Alert.alert("Invalid date", "Please enter date as yyyy-mm-dd");
      setDateText(formatDateYYYYMMDD(new Date(race.startTime) || new Date()));
    }
  };

  const onTimeBlur = () => {
    const parsed = parseTimeAMPM(timeText);
    if (parsed) {
      const newDT = new Date(startTime);
      // console.log("prev: " + newDT);
      newDT.setHours(parsed.hh, parsed.mm, parsed.ss, 0);
      // console.log("new!: " + newDT);
      handleDateChange(newDT);
      // recalcLogs(newDT);
    } else {
      Alert.alert(
        "Invalid time",
        "Please enter time as h:mm:ss AM/PM (e.g. 2:05:00 PM)"
      );
      setTimeText(formatTimeAMPM(new Date(race.startTime)));
    }
  };

  const onManualAddFin = () => {
    // manualAddFinisher(race.id, name, elapsedTime); 
  }

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

  const handleLogPress = () => {

    if (!startTime) return;

    // const now = new Date(); // must be a Date, not timestamp
    const nowMs = Date.now(); 
    const startMs = typeof startTime === "number" ? startTime : startTime.getTime(); 
    const elapsedMs = nowMs - startMs; 
    const formatted = formatElapsedTime(elapsedMs);   
    addFinisher(`Runner ${race.finishers.length + 1}`, formatted, nowMs);

  };

  const showMenu = () => {
    const options = [
      "Export CSV",
      "Insert finish time",
      ...(race.deletedFinishers.length > 0 ? ["View deleted times"] : []),
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

  return (
    <View style={{ flex: 1 }}>
      {/* Floating Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.circleBtn}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back" size={28} color="#fff" />
        </TouchableOpacity>

        <View style={styles.headerStopwatch}>
          <Text style={styles.stopwatchText} numberOfLines={1} adjustsFontSizeToFit>
            {formatElapsedTime(elapsed)}
          </Text>
        </View>

        <TouchableOpacity style={styles.circleBtn}>
          <Ionicons name="ellipsis-horizontal" size={28} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Race Name/Date/Time, Stopwatch, Buttons, and Finishers  */}
      <View style={styles.container}>

        {/* Row 1: Race name */}
        <View style={styles.row}> 
          <TextInput 
            ref={inputRef}
            style={[styles.name, styles.cell]}
            value={race.name}
            onChangeText={handleNameRace} 
            placeholder="New Race"
            placeholderTextColor="#777"
            style={styles.nameInput}
            returnKeyType="done"
            selectionColor="#fff" 
          />
          <TouchableOpacity 
            style={styles.editIcon}
            onPress={() => inputRef.current?.focus()}
          >
            <Ionicons name="create-outline" size={18} color="#ddd" />
          </TouchableOpacity>

        </View> 

        {/* Row 2: Date + Time */}
        <View style={styles.row}>
          {race.state === "before" ? (
            <Text style={[styles.dateInput, {color: "#777"}]}>{dateText}</Text>
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
                    style={[styles.dateInput, styles.timeInput]}
                    keyboardType={Platform.OS === "ios" ? "numbers-and-punctuation" : "default"}
                    autoCorrect={false}
                    autoCapitalize="none"
                    selectionColor="#fff" 
                  />
              </View>
            </>
          )}
        </View>

        {/* Row 3: Three buttons */}
        <View style={[styles.row, styles.btnRow]}>
          {/* Left button — Start | Stop */}
          {race.state === "before" && (
            <TouchableOpacity style={[styles.rowBtn, styles.startBtn]} onPress={handleStartPress}>
              <Text style={styles.startTxt}>Start</Text>
            </TouchableOpacity>
          )}

          {race.state === "started" && (
            <TouchableOpacity style={[styles.rowBtn, styles.stopBtn]} onPress={handleStopPress}>
              <Text style={styles.stopTxt}>Stop</Text>
            </TouchableOpacity>
          )}

          {race.state === "stopped" && (
            <TouchableOpacity style={[styles.rowBtn, styles.startBtn]} onPress={handleStartPress}>
              <Text style={styles.startTxt}>Resume</Text>
            </TouchableOpacity>
          )}

          {/* Middle button — Manually Insert a Finisher */}          
          {(race.state === "started" || race.state === "stopped") && (
            <TouchableOpacity style={[styles.rowBtn, styles.iconBtn]} onPress={onManualAddFin}>
              <Ionicons name="enter-outline" size={44} color="#9f9f9f" />
            </TouchableOpacity>
          )}

          {/* Right button — Log | Share */}
          {race.state === "started" ? (
            <TouchableOpacity
              style={[styles.rowBtn, styles.iconBtn, styles.finBtn]}
              onPress={handleAddFinisher}
            >
              <Text style={[styles.rowTxt, styles.finTxt]}>{race.finishers.length + 1}</Text>
            </TouchableOpacity>
          ) : race.state === "stopped" ? (
            <TouchableOpacity 
              style={[styles.rowBtn, styles.iconBtn]}
              onPress={handleExport}
            >
              <Ionicons name="document-attach-outline" size={36} color="#9f9f9f" />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={[styles.rowBtn, styles.iconBtn]} />
          )}
        </View> 

        {/*  */}

        <FlatList
          ref={flatListRef}
          data={race.finishers}
          keyExtractor={(item) => item.id}
          extraData={race.startTime}
          renderItem={({ item, index }) => (
            // const startMs = race.startTime?.getTime();
            // const finishMs = race.item.finishTime;
            // const elapsedMs = startMs != null && finishMs != null ? finishMs - startMs : null;
            // const displayTime = elapsedMs != null ? formatElapsedTime(elapsedMs) : "--:--";

            <View style={styles.finisherRow}>
              <Text style={styles.finisherPlace}>{index + 1}.</Text>
              <Text style={styles.finisherName}>{item.name}</Text>
              <Text style={styles.finisherTime}>
                {(item.elapsedTime / 1000).toFixed(1)}s
              </Text>
            </View>
          )}
          ListEmptyComponent={
            <Text style={styles.empty}>Tap the yellow button to record finishers, starting with (1).</Text>
          }
          contentContainerStyle={{ paddingBottom: 100 }}
          onContentSizeChange={() =>
              flatListRef.current?.scrollToEnd({ animated: true })
            }
          onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
        />

      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    position: "absolute",
    top: 4, // dist below status bar / notch
    left: 0,
    right: 0,
    zIndex: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
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
  headerStopwatch: {
    backgroundColor: "#141414", // dark gray 
    borderColor: "#3a3a3a",
    borderWidth: 0,
    padding: 2,
    marginHorizontal: 14,
    flex: 1,
    borderRadius: 26,
    height: 52,
  },
  stopwatchText: {
    color: "#9f9f9f", // light gray 
    fontSize: 36,
    fontVariant: "tabular-nums",
    fontWeight: "300",
    textAlign: "center",
  },
  container: {
    flex: 1,
    padding: 20,
    paddingTop: 71,
  },
  row: {
    flexDirection: "row",
    marginBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#333",
  },
  name: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 4,
  },
  nameInput: {
    flex: 1,
    color: "#fff",
    fontSize: 20,
    fontWeight: "700",
    paddingBottom: 6,
    paddingTop: 14,
  },   
  editIcon: {
    marginTop: 18,
    paddingLeft: 18,
  }, 
  dateInput: {
    fontSize: 16,
    color: "#fff",
    paddingBottom: 6,
  },
  timeInput: {
    textAlign: "right",
  },
  cell: { 
    flex: 1 
  },
  rightCell: {
    alignItems: "flex-end",
    justifyContent: "center",
  },
  buttonsRow: {
    flexDirection: "row",
    marginBottom: 12,
  },
  button: {
    backgroundColor: "#333",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginRight: 10,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "600",
  },
  finisherRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#111",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderBottomColor: "#222",
    borderBottomWidth: 1,
    borderRadius: 8,
    marginBottom: 6,
  },
  finisherPlace: {
    color: "#888",
    width: 30,
  },
  finisherName: {
    color: "#fff",
    flex: 1,
  },
  finisherTime: {
    color: "#ccc",
    fontVariant: ["tabular-nums"],
  },
  empty: {
    color: "#666",
    textAlign: "center",
    marginTop: 40,
  },
  error: {
    color: "#f66",
    textAlign: "center",
    marginTop: 60,
  },
  btnRow: {
    justifyContent: "space-between",
    borderBottomWidth: 0,
  },
  rowBtn: {
    backgroundColor: "#19361e", // green 
    width: 90,
    height: 90,
    borderRadius: 45,
    alignItems: "center",
    justifyContent: "center",
  },
  rowTxt: {
    fontSize: 18,
    color: "#fff",
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
  finBtn: {
    backgroundColor: "#2f2708",
  },
  finTxt: {
    color: "#FFD52E",
    fontVariant: "tabular-nums",
  }, 
  deleteBtn: {
    backgroundColor: '#ff3b30',
    justifyContent: 'center',
    alignItems: 'center',      
    width: 80,                 
    height: '100%',            
  },
  deleteTxt: {
    color: '#fff',
    // fontWeight: '700',
    fontSize: 16,
  },
});