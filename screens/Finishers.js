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
  Keyboard,
  KeyboardAvoidingView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Swipeable } from 'react-native-gesture-handler';
import { useRoute, useNavigation } from "@react-navigation/native";
import { useRaceContext } from '../RaceContext';
import { parseDateYYYYMMDD, parseTimeAMPM, parseTimeToMs, filterDateInput, filterTimeInput, formatDateYYYYMMDD, formatTimeAMPM, formatElapsedTime} from '../utils/handleDateTime.js'
import { exportRaceToCSV } from '../utils/exportCsv';
import { useActionSheet } from '@expo/react-native-action-sheet';

export default function Finishers() {

  // Navigation 
  const route = useRoute();
  const navigation = useNavigation();
  const { raceId } = route.params || {};
  const inputRef = useRef(null);

  // State management 
  const { getRaceById, startRace, stopRace, archiveRace, addFinisher, editFinisher, deleteFinisher, nameRace, setStartTime, setActiveFinisher, activeRaceId, setActiveRaceId } = useRaceContext();
  const [race, setRace] = useState(() => getRaceById(raceId));
  const flatListRef = useRef(null);
  const [showTips, setShowTips] = useState(true);
  const [showTipsMenu, setShowTipsMenu] = useState(false);
  const [editingFinisherId, setEditingFinisherId] = useState(null);  
  const [editingTime, setEditingTime] = useState("");
  const [editingName, setEditingName] = useState("");

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
      <Text style={styles.error}>Race not found.</Text>
    );
  }

  // ---- Stopwatch and finish time syncing ---- 
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
  const handleInsertFinisher = () => {
    navigation.navigate(
      "FinishersEdit", 
      { raceId: race.id, finisherId: null, editingIndex: null });
  }
  const handleEditFinisher = (item, editingIndex) => {
    navigation.navigate(
      "FinishersEdit", 
      { raceId: race.id, finisherId: item.id, editingIndex: editingIndex }); 
  }
  
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
    } else {
      Alert.alert(
        "Invalid time",
        "Please enter time as h:mm:ss AM/PM (e.g. 2:05:00 PM)"
      );
      setTimeText(formatTimeAMPM(new Date(race.startTime)));
    }
  };

  const onInsertFinisher = () => {
    const newFinisher = addFinisher(race.id, ""); 
    setEditingFinisherId(newFinisher.id);
    setEditingTime("");
    setEditingName("");
    // TODO: 
    // const newFinisher = addFinisher(race.id); // this will contain finishTime = Date.now()
    // const tempElapsedTime = 0; // ms since epoch; as date(duration), should format as 00:00:00 
    // editFinisher -> pass (race.id, newFinisher.id, tempElapsedTime) 
    // navigation.navigate("FinishersEdit", { raceId: race.id, finisherId: finisherId }) 
    // in FinishersEdit.js -> upon change of time -> run editFinisher(raceId, finisherId, newElapsedTime)
  }

  const onEditFinisher = (finisherId) => {
    const elapsedTime = parseTimeToMs(editingTime);
    editFinisher(race.id, finisherId, elapsedTime, editingName);
    setEditingFinisherId(null);
    setEditingTime("");
    setEditingName("");
    Keyboard.dismiss();
  };

  const renderFinisher = ({ item, index }) => {

    const leftActions = () => (
      <TouchableOpacity
        style={[styles.swipeAction, styles.swipeYellow]} 
        onPress={() => {handleEditFinisher(item, index)}} 
      >
        <Text style={styles.swipeTxt}>Edit</Text>
      </TouchableOpacity>
    );

    const rightActions = () => (
      <TouchableOpacity
        style={[styles.swipeAction, styles.swipeRed]}
        onPress={() => deleteFinisher(race.id, item.id)} 
      >
        <Text style={styles.swipeTxt}>Delete</Text>
      </TouchableOpacity>
    );

    const elapsedTimeMs = (item.finishTime - race.startTime);

    return (
      <Swipeable
        renderLeftActions={() => leftActions()}
        renderRightActions={() => rightActions()}
      >
        <View 
          style={[styles.swipeableRow, styles.swipeableInit]}
        >
          <Text style={styles.placeCol}>{index + 1}.</Text>
          <Text style={styles.nameCol}>{item.name || "—"}</Text>
          <Text style={styles.timeCol}>{formatElapsedTime(elapsedTimeMs)}</Text>
        </View>
      </Swipeable>
    );
  };

  // ---- Menu button ---- 
  const { showActionSheetWithOptions } = useActionSheet();

  const showMenu = () => {
    const options = [
      "Export CSV",
      "View deleted times",
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
          navigation.navigate("RacesPast");
        }
      }
    );
  };

  return (
    <KeyboardAvoidingView 
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={80} // adjust for your header height if needed
    >
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
            autoCapitalize="words"
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
                  autoCapitalize="characters"
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
                    autoCapitalize="characters"
                    selectionColor="#fff" 
                  />
              </View>
            </>
          )}
        </View>

        {/* Row 3: Three buttons */}
        <View style={[styles.row, styles.btnRow]}>
          {/* Left button — Start | Stop */}
          {(race.state === "before" || race.state === "archived") && (
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
            <TouchableOpacity style={[styles.rowBtn, styles.finBtn]} onPress={handleInsertFinisher}>
              {/*<Ionicons name="enter-outline" size={44} color="#9f9f9f" />*/}
              <Text style={styles.addTxt}>+X</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={[styles.rowBtn, styles.iconBtn]} />
          )}

          {/* Right button — addFinisher | exportCsv */}
          {race.state === "started" ? (
            <TouchableOpacity
              style={[styles.rowBtn, styles.iconBtn, styles.finBtn]}
              onPress={handleAddFinisher}
            >
              <Text style={[styles.rowTxt, styles.finTxt]}>+{race.finishers.length + 1}</Text>
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
              showsVerticalScrollIndicator={false}
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
                  {/*<View style={styles.tipRow}>
                    <Text style={styles.placeCol}>
                      <Ionicons name="ellipse" size={18} color="#34C759" />
                    </Text>
                    <Text style={styles.tipTxt}>Tap 'Start' as the gun goes off </Text>
                  </View>*/}
                  <View style={styles.tipRow}>
                    <Text style={[styles.placeCol]}>
                      {/*<Ionicons name="ellipse" size={18} color="#FFD52E" />*/}
                      +1
                    </Text>
                    <Text style={styles.tipTxt}>Record times as racers finish </Text>
                  </View>
                  <View style={styles.tipRow}>
                    <Text style={[styles.placeCol]}>
                      {/*<Ionicons name="enter-outline" size={18} color="#fff" />*/}
                        +X
                    </Text>
                    <Text style={styles.tipTxt}>Insert a finish time, if needed </Text>
                  </View>
                  <View style={styles.tipRow}>
                    <Text style={styles.placeCol}>
                      <Ionicons name="code-working-outline" size={18} color="#fff" />
                    </Text>
                    <Text style={styles.tipTxt}>Swipe times to edit or delete </Text>
                  </View>
                  {/*<View style={styles.tipRow}>
                    <Text style={styles.placeCol}>
                      <Ionicons name="ellipse" size={18} color="#ff3b30" />
                    </Text>
                    <Text style={styles.tipTxt}>Stop displaying elapsed time </Text>
                  </View>*/}
                  <View style={styles.tipRow}>
                    <Text style={styles.placeCol}>
                      <Ionicons name="create-outline" size={18} color="#fff" />
                    </Text>
                    <Text style={styles.tipTxt}>Edit race name, start time</Text>
                  </View>
                  <View style={styles.tipRow}>
                    <Text style={styles.placeCol}>
                      <Ionicons name="warning-outline" size={18} color="#fff" />
                    </Text>
                    <Text style={styles.tipTxt}>Editing start updates *all* times</Text>
                  </View>
                  <View style={styles.tipRow}>
                    <Text style={styles.placeCol}>
                      <Ionicons name="document-attach-outline" size={18} color="#fff" />
                    </Text>
                    <Text style={styles.tipTxt}>Export results (.csv) </Text>
                  </View>
                </View>
              )}
            </ScrollView> 
          </>
        )}
        {!showTipsMenu && (
          <FlatList
            ref={flatListRef}
            data={[...(race.finishers || [])].sort((a, b) => a.finishTime - b.finishTime)}
            renderItem={renderFinisher}
            keyExtractor={(item) => item.id}
            keyboardShouldPersistTaps="handled"            
            contentContainerStyle={{ paddingBottom: 0 }}
            onContentSizeChange={() =>
                flatListRef.current?.scrollToEnd({ animated: true })
              }
            onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
            // windowSize={10}
            // initialNumToRender={20}
            // maxToRenderPerBatch={20}
          />
        )}
      </View>
    </KeyboardAvoidingView>
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
    paddingTop: 60,
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
  addTxt: {
    color: "#FFD52E",
    fontVariant: "tabular-nums",
    fontSize: 18,
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
    fontVariant: "tabular-nums",
  },
  nameCol: {
    flex: 1,
    fontSize: 16,
    color: "#fff",
  },
  timeCol: {
    // flex: 1,
    fontSize: 16,
    color: "#fff",
    width: 80,
    textAlign: "right", 
    fontVariant: "tabular-nums",
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
  tipTxt: {
    // flex: 1,
    fontSize: 16,
    color: "#fff",
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
    height: 50,        
    alignItems: "center",
    paddingHorizontal: 10,
    backgroundColor: "#333",
  },
  swipeableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#333",
    height: 50,        
    alignItems: "center",
    paddingHorizontal: 10,
  },
  swipeableInit: {
    backgroundColor: "#000",
  },
  swipeableHighlight: {
    backgroundColor: "#2f2708",
  },
  deletedRow: {
    flex: 1,
    padding: 14,
  },
  viewDeleted: {
    backgroundColor: "#333",
    padding: 14,
    borderRadius: 14,
  },
  viewDeletedTxt: {
    flex: 1,
    textAlign: "center",
    fontWeight: "600",
    color: "#fff",
    fontSize: 18,
    // textDecorationLine: "underline",
    // flexDirection: "row",
  },
});