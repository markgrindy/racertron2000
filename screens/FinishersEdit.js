// ../screens/FinishersEdit.js 

import React, { useState, useEffect, useRef, useContext } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  FlatList,
  Alert,
  Button, 
} from "react-native";
import { Swipeable } from 'react-native-gesture-handler';
import { useRoute, useNavigation } from "@react-navigation/native";
import { useRaceContext } from '../RaceContext';
import { parseDateYYYYMMDD, parseTimeAMPM, parseTimeToMs, filterDateInput, filterTimeInput, formatDateYYYYMMDD, formatTimeAMPM, formatElapsedTime} from '../utils/handleDateTime.js'
import { useActionSheet } from '@expo/react-native-action-sheet';
import { Ionicons } from "@expo/vector-icons";

export default function FinishersEdit() {

	// Navigation 
  const route = useRoute();
  const navigation = useNavigation();
  const { raceId, finisherId, editingIndex } = route.params || {};

  // State management 
  const { getRaceById, getFinisherById, insertFinisher, editFinisher, deleteFinisher, undeleteFinisher, clearDeletedFinishers } = useRaceContext();
  const [race, setRace] = useState(() => getRaceById(raceId));
  const [finisher, setFinisher] = useState(() => getFinisherById(raceId, finisherId));  

  // console.log("finisher: ", finisher?.finishTime);
  // console.log("race: ", finisher?.finishTime - race?.startTime);

  // Init name, elapsedTime
  const [name, setName] = useState(finisher?.name || "Name");
  const [elapsedTime, setElapsedTime] = useState(
    formatElapsedTime(
    	finisher 
    	? (finisher?.finishTime - race?.startTime)
    	: (null)
  	)
  );

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
      <Text style={styles.error}>Record not found.</Text>
    );
  }

	// Validate input as H:MM:SS, HH:MM:SS, or MM:SS
	const validateTime = (value) => {
	  const regex = /^((\d{1,2}:)?[0-5]?\d:[0-5]\d)$/;
	  return regex.test(value);
	};

  /**	
   * Fire an alert if user didn't follow the formatting rules
   * Otherwise, update the finisher record  
   */
 	const handleSave = () => {
  	if (!validateTime(elapsedTime)) {
      Alert.alert("Invalid time", "Please enter time as (h):mm:ss");
      return;
    }

    const elapsedMs = parseTimeToMs(elapsedTime);
    const finishTimeMs = race.startTime + elapsedMs; 		    

    if (finisher) {
    	editFinisher(raceId, finisherId, finishTimeMs, name); 
		  navigation.goBack();
    } else {
    	insertFinisher(raceId, finishTimeMs, name);
			navigation.goBack();
    }
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

  // ---- Menu button ---- 
  const { showActionSheetWithOptions } = useActionSheet();

  const showMenu = () => {
    const options = [
      "Delete finisher",
      "Cancel",
    ]; 

    const destructiveButtonIndex = options.indexOf("Delete finisher");
    const cancelButtonIndex = options.length - 1; // always last

    showActionSheetWithOptions(
      {
        options,
        destructiveButtonIndex,
        cancelButtonIndex,
      },
      (buttonIndex) => {
        const pressed = options[buttonIndex];
        if (pressed === "Delete finisher" && finisherId) {
          deleteFinisher(race.id, finisher.id);
        } else {
        	navigation.goBack(); 
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
          <Ionicons name="trash-outline" size={28} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Title and FlatList   */}
      <ScrollView style={styles.container}>

        {/* Row 1: Title */}
        <View style={styles.row}> 
        	{finisherId 
        		? (<Text style={styles.nameInput}>Editing finisher #{editingIndex + 1}</Text>)
        		: (<Text style={styles.nameInput}>Add new finisher</Text>)
        	}
        </View> 

        <View style={styles.row}>
        	<TextInput
		        style={styles.nameInput}
		        placeholder="Enter name"
		        value={name}
		        onChangeText={setName}
		      />
		    </View>
		    <View style={styles.row}> 
		      <TextInput
		        style={styles.nameInput}
		        placeholder="Finish time (h:mm:ss)"
		        value={elapsedTime}
		        onChangeText={setElapsedTime}
		        keyboardType="numbers-and-punctuation"
		      />
	      </View>
		    <View style={styles.row}> 
		      <Button title="Save" onPress={handleSave} />
        </View> 

        {/* Row 2: Form */}
        
      </ScrollView>
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
    backgroundColor: "#000",
    padding: 20,
    paddingTop: 53,
  },
  emptyText: {
    color: "#aaa",
    fontSize: 16,
    marginTop: 20,
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
    // paddingBottom: 6,
    paddingTop: 14,
  },   
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    fontSize: 18,
  },
  backRow: {
    flexDirection: "row",
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#333",
    alignItems: "flex-end",
  },
  backBtn: {
    justifyContent: "flex-end",
    alignItems: "flex-end",
    paddingLeft: 8,
    paddingBottom: 2,
  },
  title: {
    flex: 1,
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 10,
  },
  emptyText: {
    color: "#aaa",
    fontSize: 16,
    marginTop: 20,
  },
  row: {
    flexDirection: "row",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#333",
  },
  placeCol: {
    width: 40,
    color: "#fff",
    fontSize: 16,
  },
  timeCol: {
    flex: 1,
    color: "#fff",
    fontSize: 16,
  },

  swipeableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#333",
    height: 50,        // <-- give your row a fixed height
    alignItems: "center",
    paddingHorizontal: 10,
  },

  restoreButton: {
    backgroundColor: '#FFA500',
    justifyContent: 'center',
    alignItems: 'center',      // center text vertically
    width: 80,                  // fixed width of the button
    height: '100%',             // match the row height
  },

  restoreText: {
    color: '#fff',
    // fontWeight: '700',
    fontSize: 16,
  },
  tipRow: {
    flex: 1,
    padding: 14,
  },
  tipTxt: {
    flex: 1,
    textAlign: "center",
    color: "#fff",
    fontSize: 16,
  },
  error: {
    color: "#f66",
    textAlign: "center",
    marginTop: 60,
  },
});
