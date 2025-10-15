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
  ScrollView,
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
  const { getRaceById, startRace, stopRace, archiveRace, addFinisher, manualAddFinisher, deleteFinisher, nameRace, setStartTime } = useRaceContext();
  const [race, setRace] = useState(() => getRaceById(raceId));
  const flatListRef = useRef(null);
  const [showTips, setShowTips] = useState(true);
  const [showTipsMenu, setShowTipsMenu] = useState(false);

  // console.log(race.name + "=> race.startTime = " + race.startTime);
  // console.log(race.name + "=> new Date(race.startTime) = " + new Date(race.startTime));

  // Init name, startTime, elapsed time 
  const startTime = race.startTime; 
  const [dateText, setDateText] = useState(formatDateYYYYMMDD(new Date(race.startTime) || new Date()));
  const [timeText, setTimeText] = useState(formatTimeAMPM(new Date(race.startTime) || new Date()));
  const [elapsed, setElapsed] = useState(0);
  const today = formatDateYYYYMMDD(new Date()); 

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
  const handleHideTips = () => {
    setShowTips(false);
    setShowTipsMenu(false);
  };

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
    null
  }

  const onEditFinisher = () => {
    null 
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

  // ---- Menu button ---- 
  const { showActionSheetWithOptions } = useActionSheet();

  const showMenu = () => {
    const options = [
      "Export CSV",
      "Insert finish time",
      ...(race.deletedFinishers.length > 0 ? ["View deleted times"] : []),
      "Show tips",
      "Archive race",
      "Cancel",
    ]; 

    const destructiveButtonIndex = options.indexOf("Archive race");
    const cancelButtonIndex = options.length - 1; // always last

    showActionSheetWithOptions(
      {
        options,
        destructiveButtonIndex,
        cancelButtonIndex,
      },
      (buttonIndex) => {
        const pressed = options[buttonIndex];
        if (pressed === "Export CSV") {
          handleExport();
        }
        if (pressed === "Insert finish time") {
          // TODO
        }
        if (pressed === "View deleted times") {
          navigation.navigate("FinishersDeleted", { raceId: race.id });
        }
        if (pressed === "Show tips") {
          setShowTipsMenu(true);
        }
        if (pressed === "Archive race") {
          archiveRace(race.id); 
          navigation.navigate("ResultsArchived", { raceId: race.id });
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

        <TouchableOpacity 
          style={styles.circleBtn}
          onPress={showMenu}
        >
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
            <Text style={[styles.dateInput, {color: "#777"}]}>{today}</Text>
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
          {(race.state === "started" || race.state === "stopped") ? (
            <TouchableOpacity style={[styles.rowBtn, styles.iconBtn]} onPress={onManualAddFin}>
              <Ionicons name="enter-outline" size={44} color="#9f9f9f" />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={[styles.rowBtn, styles.iconBtn]} onPress={onManualAddFin} />
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

        {/* Row 4: Tip Sheet | Results List */}
        {(race.finishers.length === 0 || showTipsMenu) && (
          <>
            <ScrollView 
              style={styles.tipsScroll}
              showsVerticalScrollIndicator={true}
            >
              {(showTips || showTipsMenu) && (
                <View style={styles.tipsContainer}>
                  {/* Header row with title + close button */}
                  <View style={styles.tipsHeaderRow}>
                    <Text style={styles.tipsHead}>Tips</Text>
                    <TouchableOpacity
                      onPress={handleHideTips}
                      style={styles.closeButton}
                    >
                      <Ionicons name="close-outline" size={18} color="#fff" />
                    </TouchableOpacity>
                  </View>

                  {/* Tip rows */}
                  <View style={styles.tipRow}>
                    <Text style={styles.placeCol}>
                      <Ionicons name="ellipse" size={18} color="#34C759" />
                    </Text>
                    <Text style={styles.timeCol}>Tap 'Start' as the gun goes off </Text>
                  </View>
                  <View style={styles.tipRow}>
                    <Text style={styles.placeCol}>
                      <Ionicons name="ellipse" size={18} color="#FFD52E" />
                    </Text>
                    <Text style={styles.timeCol}>Record racers as they finish </Text>
                  </View>
                  <View style={styles.tipRow}>
                    <Text style={styles.placeCol}>
                      <Ionicons name="ellipse" size={18} color="#ff3b30" />
                    </Text>
                    <Text style={styles.timeCol}>Stop displaying elapsed time </Text>
                  </View>
                  <View style={styles.tipRow}>
                    <Text style={styles.placeCol}>
                      <Ionicons name="create-outline" size={18} color="#fff" />
                    </Text>
                    <Text style={styles.timeCol}>Tap to edit the race name</Text>
                  </View>
                  <View style={styles.tipRow}>
                    <Text style={styles.placeCol}>
                      <Ionicons name="time-outline" size={18} color="#fff" />
                    </Text>
                    <Text style={styles.timeCol}>Tap to edit start time, if needed</Text>
                  </View>
                  <View style={styles.tipRow}>
                    <Text style={styles.placeCol}>
                      <Ionicons name="enter-outline" size={18} color="#fff" />
                    </Text>
                    <Text style={styles.timeCol}>Manually insert time, if needed </Text>
                  </View>
                  <View style={styles.tipRow}>
                    <Text style={styles.placeCol}>
                      <Ionicons name="document-attach-outline" size={18} color="#fff" />
                    </Text>
                    <Text style={styles.timeCol}>Export results to CSV </Text>
                  </View>
                </View>
              )}
            </ScrollView> 
          </>
        )}
        {!showTipsMenu && (
          <FlatList
            ref={flatListRef}
            data={race.finishers}
            keyExtractor={(item) => item.id}
            extraData={race.startTime}
            renderItem={({ item, index }) => {
              const startMs = race.startTime;
              const finishMs = item.finishTime;
              const elapsedMs = startMs != null && finishMs != null ? finishMs - startMs : null;
              const displayTime = elapsedMs != null ? formatElapsedTime(elapsedMs) : "--:--";

              const leftActions = (id) => (
                <TouchableOpacity
                  style={[styles.swipeAction, styles.swipeGreen]}
                  onPress={() => onEditFinisher(item.id)} 
                >
                  <Text style={styles.swipeTxt}>Edit</Text>
                </TouchableOpacity>
              );

              const rightActions = (id) => (
                <TouchableOpacity
                  style={[styles.swipeAction, styles.swipeRed]}
                  onPress={() => deleteFinisher(race.id, item.id)} 
                  // onPress={() => console.log(item.id)} 
                >
                  <Text style={styles.swipeTxt}>Delete</Text>
                </TouchableOpacity>
              );

              return (
                <Swipeable 
                  // renderLeftActions={() => leftActions(item.id)}
                  renderRightActions={() => rightActions(item.id)}
                >
                  <View style={[ styles.swipeableRow ]}>
                    <Text style={styles.placeCol}>{index + 1}.</Text>
                    <Text style={styles.timeCol}>{displayTime}</Text>
                  </View>
                </Swipeable> 
              );
            }}
            contentContainerStyle={{ paddingBottom: 0 }}
            onContentSizeChange={() =>
                flatListRef.current?.scrollToEnd({ animated: true })
              }
            onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
          />
        )}

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
    marginTop: 40,
    color: "#ddd", 
    fontStyle: "italic", 
    marginBottom: 8,
    paddingTop: 18,
    fontSize: 18,
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
  swipeAction: {
    justifyContent: 'center',
    alignItems: 'center',      
    width: 80,                 
    height: '100%',            
  },
  swipeRed: {
    backgroundColor: '#ff3b30', // red 
  },
  swipeBlue: {
    backgroundColor: '#007AFF', // blue 
  },
  swipeGreen: {
    // backgroundColor: '#43C35D', // green 
    // backgroundColor: '#34C759', // green 
    backgroundColor: '#19361e', // green 
  },
  swipeYellow: {
    backgroundColor: '#2f2708', // yellow
  },
  swipeTxt: {
    color: '#fff',
    fontSize: 16,
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
  tipsContainer: {
    backgroundColor: '#333', 
    borderRadius: 18,
    padding: 10,
    marginBottom: 10,
    position: 'relative',
  },
  tipsScroll: {
    // maxHeight: 300,   
  },
  tipsHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  closeButton: {
    padding: 6,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  tipsHead: {
    fontSize: 18,
    color: "#fff",
    fontWeight: "bold",
  },
  tipRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#333",
    height: 50,        // <-- give your row a fixed height
    alignItems: "center",
    paddingHorizontal: 10,
    backgroundColor: "#333",
  },
  swipeableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#333",
    height: 50,        // <-- give your row a fixed height
    alignItems: "center",
    paddingHorizontal: 10,
    backgroundColor: "#000",
  },

});