// ../screens/FinishersEdit.js 

import React, { useState, useEffect, useRef, useContext } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Button, 
  Keyboard,
} from "react-native";
import { Swipeable } from 'react-native-gesture-handler';
import { useRoute, useNavigation } from "@react-navigation/native";
import { useRaceContext } from '../RaceContext';
import { parseDateYYYYMMDD, parseTimeAMPM, parseTimeToMs, filterDateInput, filterTimeInput, formatDateYYYYMMDD, formatTimeAMPM, formatElapsedTime, formatElapsedTimeThousandths} from '../utils/handleDateTime.js'
import { useActionSheet } from '@expo/react-native-action-sheet';
import { Ionicons } from "@expo/vector-icons";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";

export default function FinishersEdit() {

	// Navigation 
  const route = useRoute();
  const navigation = useNavigation();
  const { raceId, recordId: initialRecordId, editingIndex, oldType } = route.params || {};

  // State management 
  const { getRaceById, getFinisherById, getRecordById, insertFinisher, editFinisher, deleteFinisher, undeleteFinisher, clearDeletedFinishers, addEditRecord } = useRaceContext();
  const [race, setRace] = useState(() => getRaceById(raceId));
  const [currentRecordId, setCurrentRecordId] = useState(initialRecordId);
  const [finisher, setFinisher] = useState(() => getRecordById({raceId: race.id, type: oldType, recordId: currentRecordId}));  
  // console.log("got Record by id: ",finisher);  

  // Init form data 
  const [nameInit, setNameInit] = useState(
  	finisher?.name || ""
	);
  const [name, setName] = useState(
  	finisher?.name?.match(/^Finisher\d+$/) ? "" : finisher?.name || ""
	);
  const [elapsedTime, setElapsedTime] = useState(
    finisher?.finishTime && race?.startTime
	    ? formatElapsedTimeThousandths(finisher.finishTime - race.startTime)
	    : "" // formatElapsedTime(10000 * 60 * Math.random() + 10000 * Math.random()) // TODO: return this to `""` after done editing 
  );
  const [finishersCopy, setFinishersCopy] = useState([...race.finishers]);
  const [place, setPlace] = useState(editingIndex + 1);
  const [prevFinisher, setPrevFinisher] = useState(null);
	const [nextFinisher, setNextFinisher] = useState(null);
	const [type, setType] = useState(oldType || "finishers"); 
	const [gender, setGender] = useState(finisher?.gender || "N/A"); 
  const timeInputRef = useRef(null);
  const [notes, setNotes] = useState(finisher?.notes || ""); 

  // Init name, startTime, elapsed time 
  const startTime = race.startTime; 
  const [dateText, setDateText] = useState(formatDateYYYYMMDD(new Date(race.startTime) || new Date()));
  const [timeText, setTimeText] = useState(formatTimeAMPM(new Date(race.startTime) || new Date()));
  const [elapsed, setElapsed] = useState(0);
  const today = formatDateYYYYMMDD(new Date()); 

  useEffect(() => {
	  // Bail early if race data or finishers aren't ready
	  if (!race?.startTime || !finishersCopy?.length) {
	    setPlace(null);
	    setPrevFinisher(null);
	    setNextFinisher(null);
	    return;
	  }

	  // Keep race updated when context changes
	  if (finisher) {
	    const f = getFinisherById(race.id, currentRecordId);
	    setFinisher(f);
	    setPlace(editingIndex ?? null);
	  }

	  // Skip until elapsedTime is defined
	  if (!elapsedTime) return;

	  const computePlaceAndNeighbors = () => {
	    const tempFinishTime = race.startTime + parseTimeToMs(elapsedTime);
	    const recordId = finisher?.id || "temp";

	    // Clone and update or add this finisher
	    const temp = [...finishersCopy];
	    const existingIndex = temp.findIndex((f) => f.id === recordId);

	    if (existingIndex !== -1) {
	      temp[existingIndex] = { ...temp[existingIndex], finishTime: tempFinishTime };
	    } else {
	      temp.push({ ...finisher, id: recordId, finishTime: tempFinishTime });
	    }

	    // Sort by finish time
	    temp.sort((a, b) => a.finishTime - b.finishTime);

	    // Find our current finisher’s place and neighbors
	    const newIndex = temp.findIndex((f) => f.id === recordId);
	    setPlace(newIndex + 1);
	    setPrevFinisher(
	    	temp[newIndex - 1] || {
	    		name: "First finisher...",
	        finishTime: race.startTime,
	    	}
			);
	    setNextFinisher(
	      temp[newIndex + 1] || {
	        name: "...last finisher",
	        finishTime: race.startTime + 360000000 - 1,
	      }
	    );
	  };

	  // For large lists, defer computation slightly
	  if (finishersCopy.length > 200) {
	    const timeout = setTimeout(computePlaceAndNeighbors, 300);
	    return () => clearTimeout(timeout);
	  } else {
	    computePlaceAndNeighbors();
	  }
	}, [
	  elapsedTime,         // main driver: updates when time changes
	  finisher?.id,        // updates when editing a new record
	  race?.id,            // ensures recomputation on race switch
	  race?.startTime,
	  finishersCopy,       // recompute if finishers list changes
	  currentRecordId,
	  editingIndex,
	]);

	// Validate input as HHH:MM:SS, HH:MM:SS, or MM:SS
	const validateTime = (value) => {
	  const regex = /^(\d{1,3}:)?([0-5]?\d):([0-5]?\d)(\.\d{1,3})?$/;
	  return regex.test(value);
	};

	// fire an alert if user didn't follow the formatting rules 
	const handleTimeBlur = () => {
		if (elapsedTime !== "" && !validateTime(elapsedTime)) {
			// console.log("elapsedTime: ", elapsedTime); 
      Alert.alert("Invalid time", "Please enter time as (h):mm:ss");
      setTimeout(() => {
        timeInputRef.current?.focus();
        timeInputRef.current?.setSelection(0, elapsedTime.length);
      }, 300);
      return;
    }
	}

	// Insert or edit finisher record; goBack (default), go to next, or create new
 	const handleSave = ({goToNextRecord, createNewRecord}) => {

 		if (!elapsedTime && type === "finishers") {
 			Alert.alert(
 				"Time can't be blank",
 				"Name can be blank, but not time."
			);
			return;
 		}

 		// Init `null` finish time for non-Finisher records 
 		let finishTimeMs = null; 
 		if (elapsedTime) {
 			const elapsedMs = parseTimeToMs(elapsedTime);
    	finishTimeMs = race.startTime + elapsedMs;
    }; 
 		
 		const newRecord = {
    	raceId: race.id, 
    	type, 
    	oldType, 
    	recordId: currentRecordId, 
    	name: name || nameInit,
    	finishTime: finishTimeMs,
    	notes, 
    	gender, 
    }

    // save the record we're working on 
    // console.log("saving: ", newRecord);
    addEditRecord(newRecord); 

    // if (goToNextRecord) {
 		// 	console.log("goToNext");
 		// }	else if (createNewRecord) {
 		// 	console.log("createNew");
 		// } else {
 		// 	console.log("normalSave");
 		// }

  	if (goToNextRecord) { // user wants to edit the next finisher record   		
  		const f = getFinisherById(race.id, nextFinisher.id);
	    
  		// if it's the last finisher, goBack 
  		if (!f?.id) {
	      Alert.alert("End of results", "That was the last finisher.");
	      navigation.goBack();
	      return;
	    }

  		// otherwise, refresh page and show the next finisher in the list 
  		setFinisher(f);  
	    setCurrentRecordId(f.id);	
  		setName(f.name); 
  		setElapsedTime(formatElapsedTimeThousandths(f.finishTime - race.startTime)); 
  		setGender(f.gender || "N/A"); 
  		setNotes(f.notes || ""); 

  		// console.log("currently editing: ", finisher);

  	} else if (createNewRecord) { // user wants to create a new (non-finisher) record   		

  		// refresh page, showing blank record of the same type 
  		setName(""); 
  		setElapsedTime(""); 
  		setGender("N/A"); 
  		setNotes(""); 
	    setCurrentRecordId(null);

  	} else { // user wants to return to the results list 
  		navigation.goBack(); 
  	}
  }

  // User selects type array (fininshers, dnf, dns, volunteers)
  const handleSelectType = (opt) => {
  	let newType

  	switch (opt) {
  		case "FIN": 
  			newType = "finishers";
  			break; 
  		case "VOL":
  			newType = "volunteers";
  			break; 
  		default: 
  			newType = opt; // dnf or dns remain unchanged 
  	}

  	setType(newType); 

  	if (newType === "finishers") {
      // keep current elapsed time editable
    } else {
      // clear time and disable input
      setElapsedTime("");
    }
  };

  const isTimeDisabled = type !== "finishers";

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

  // Init `null` finish time for non-Finisher records 
	let finishTimeMs = null; 
	if (elapsedTime) {
		const elapsedMs = parseTimeToMs(elapsedTime);
  	finishTimeMs = race.startTime + elapsedMs;
  }; 

  const showMenu = () => {
  	const recordToDelete = {
    	raceId: race.id, 
    	type: "deletedFinishers", 
    	oldType, 
    	recordId: currentRecordId, 
    	name: name || nameInit,
    	finishTime: finishTimeMs || null,
    	notes, 
    	gender, 
    }

  	Alert.alert(
          "Permanently delete?",
          "This action cannot be undone",
          [
            {
              text: "Cancel",
              style: "cancel",
            },
            {
              text: "Delete",
              style: "destructive",
              onPress: () => {
                addEditRecord(recordToDelete); 
                navigation.goBack();
              },
            },
          ]
        );
  	return 
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
        if (pressed === "Delete finisher" && finisher.id) {
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

      {/* Title */}
      <KeyboardAwareScrollView
			  contentContainerStyle={styles.container}
			  enableOnAndroid={true}
			  enableAutomaticScroll={true}
			  extraScrollHeight={60}
			  keyboardShouldPersistTaps="handled"
			  showsVerticalScrollIndicator={false}
			>

        {/* Row 1: Data view */}
	      {prevFinisher 
	      	? (
					  <View style={[styles.finisher, styles.finisherNeighbor, styles.finisherPrev]}>
		          <Text style={[styles.placeCol, styles.neighborCol]}>{place - 1 || "#"}.</Text>
		          <Text style={[styles.nameCol, styles.neighborCol]}>{prevFinisher.name || "—"}</Text>
		          <Text style={[styles.timeCol, styles.neighborCol]}>{formatElapsedTime(prevFinisher.finishTime - race.startTime)}</Text>
		        </View>        
					) : (
						<View style={[styles.finisher, styles.finisherNeighbor, styles.finisherPrev]}>
		          <Text style={[styles.placeCol, styles.neighborCol]}>#</Text>
		          <Text style={[styles.nameCol, styles.neighborCol]}>
		          	{!isTimeDisabled
		          		? "Previous finisher"
		          		: type === "dnf"
		          			? "Did not finish"
			          		: type === "dns"
			          			? "Did not start"
			          				: type === "volunteers"
			          					? "Volunteer"
		          						: type
		          	}
	          	</Text>
		          <Text style={[styles.timeCol, styles.neighborCol]}>
			          {!isTimeDisabled
			          		? "0:00"
			          		: "" 
			          	}
		          </Text>
		        </View> 
					)
				}
  			<View style={[styles.finisher, styles.finisherEditing]}>
          <Text style={styles.placeCol}>{place || "#"}.</Text>
          <Text style={styles.nameCol}>{name || "Enter name"}</Text>
          <Text style={styles.timeCol}>{elapsedTime || "0:00"}</Text>
        </View>  
        {nextFinisher 
        	? (
					  <View style={[styles.finisher, styles.finisherNeighbor, styles.finisherNext]}>
		          <Text style={[styles.placeCol, styles.neighborCol]}>{place + 1 || "#"}.</Text>
		          <Text style={[styles.nameCol, styles.neighborCol]}>{nextFinisher.name || "—"}</Text>
		          <Text style={[styles.timeCol, styles.neighborCol]}>{formatElapsedTime(nextFinisher.finishTime - race.startTime)}</Text>
		        </View>        
					) : (
						<View style={[styles.finisher, styles.finisherNeighbor, styles.finisherNext]}>
		          <Text style={[styles.placeCol, styles.neighborCol]}>#.</Text>
		          <Text style={[styles.nameCol, styles.neighborCol]}>
		          	{!isTimeDisabled
		          		? "Next finisher"
		          		: type === "dnf"
		          			? "Did not finish"
			          		: type === "dns"
			          			? "Did not start"
			          				: type === "volunteers"
			          					? "Volunteer"
			          					: type
		          	}
		          </Text>
		          <Text style={[styles.timeCol, styles.neighborCol]}>
		          	{!isTimeDisabled
		          		? "0:00"
		          		: "" 
		          	}
	          	</Text>
		        </View>
					)
				}

				<View style={styles.rowSpacer} />

				{/* Row 2: Option buttons */}
				<View style={[styles.row, styles.optionRow]}>
	        {["FIN", "dnf", "dns", "VOL"].map((opt) => (
	          <TouchableOpacity
	            key={opt}
	            style={[
	              styles.optionButton,
				        (type === "finishers" && opt === "FIN") ||
				        (type === "volunteers" && opt === "VOL") ||
				        type === opt
				          ? styles.optionButtonSelected
				          : null,
	            ]}
	            onPress={() => handleSelectType(opt)}
	          >
	            <Text
	              style={[
				          styles.optionText,
				          (type === "finishers" && opt === "FIN") ||
				          (type === "volunteers" && opt === "VOL") ||
				          type === opt
				            ? styles.optionTextSelected
				            : null,
				        ]}
	            >
	              {opt}
	            </Text>
	          </TouchableOpacity>
	        ))}
	      </View>

	    	{/* Row 3 Row 4 Row 5: Name, time, and notes entry */}
				
        <View style={styles.row}>
        	<TextInput
        		style={styles.nameInput}
		        placeholder="Enter name"
		        placeholderTextColor="#888"
		        value={name}
		        onChangeText={setName}
		        autoCapitalize="words"
		      />
		    </View>
		    <View style={[
		    	styles.row,
		    	isTimeDisabled && styles.disabledInput
	    	]}> 
		      <TextInput
		        ref={timeInputRef}
		        style={[
		        	styles.nameInput,
		        	isTimeDisabled && styles.disabledInputText,
		        ]}
		        placeholder={
		        	isTimeDisabled 
		        		? "Time N\/A"
		        		: "Enter time (h):m:ss"
		        }
		        placeholderTextColor={
		        	isTimeDisabled 
		        		? "#444"
		        		: "#888"
		        }
		        value={elapsedTime}
		        onChangeText={setElapsedTime}
		        onBlur={handleTimeBlur}
		        keyboardType="numbers-and-punctuation"
		        editable={!isTimeDisabled}
		      />
	      </View>
	      <View style={styles.row}>
		      <TextInput
		        style={styles.notesInput}
		        value={notes}
		        onChangeText={setNotes}
		        placeholder="Notes..."
		        placeholderTextColor="#888"
		        multiline
		        textAlignVertical="top"
		        blurOnSubmit={true} 
			      returnKeyType="done"
            onSubmitEditing={() => Keyboard.dismiss()} // 👈 closes keyboard on "Done" 
		      />
		    </View> 

		    {/* Row 6: Gender selectors */}
		    <View style={styles.rowSpacer} />
	      <View style={[styles.row, styles.optionRow]}>
	        {["M", "F", "NB", "N/A"].map((opt) => (
	          <TouchableOpacity
	            key={opt}
	            style={[
	              styles.optionButton,
				        gender === opt
				          ? styles.optionButtonSelected
				          : null,
	            ]}
	            onPress={() => setGender(opt)}
	          >
	            <Text
	              style={[
				          styles.optionText,
				          gender === opt
				            ? styles.optionTextSelected
				            : null,
				        ]}
	            >
	              {opt}
	            </Text>
	          </TouchableOpacity>
	        ))}
	      </View>


		    {/* Row 5: Cancel / Save buttons */}
		    <View style={[styles.row, styles.btnRow]}> 
		    	<TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
		      	<Text style={styles.iconTxt}>Cancel</Text>
		      </TouchableOpacity>
		      <TouchableOpacity onPress={handleSave} style={styles.finBtn}>
		      	<Text style={styles.finTxt}>Save</Text>
		      </TouchableOpacity>
		      <TouchableOpacity 
		      	onPress={
		      		type === "finishers" && type === oldType
		      			? () => handleSave({ goToNextRecord: true })
		      			: () => handleSave({ createNewRecord: true })
		      	} 
		      	style={styles.finBtn}
	      	>
		      	<Text style={styles.finTxt}>
		      		{type === "finishers" && type === oldType
	      				? "+Next"
	      				: "+New"
		      		}
		      </Text>
		      </TouchableOpacity>
        </View> 
        
      </KeyboardAwareScrollView>
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
    flexGrow: 1,
    justifyContent: "center",
    backgroundColor: "#000",
    padding: 20,
    paddingTop: 70,
    paddingBottom: 100,
  },
  emptyText: {
    color: "#aaa",
    fontSize: 16,
    marginTop: 20,
  },
  rowSpacer: {
  	height: 18,
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
  btnRow: {
    justifyContent: "space-between",
    borderBottomWidth: 0,
    alignItems: "center",
    marginTop: 14,
  },
  finBtn: {
    backgroundColor: "#19361e", // green 
    // backgroundColor: "#2f2708", // yellow 
    width: 90,
    height: 90,
    borderRadius: 45,
    alignItems: "center",
    justifyContent: "center",
  },
  finTxt: {
    fontSize: 18,
    // color: "#fff",
    // color: "#FFD52E", // yellow 
    color: "#34C759" // green
  },
  iconBtn: {
    backgroundColor: "#141414",
    width: 90,
    height: 90,
    borderRadius: 45,
    alignItems: "center",
    justifyContent: "center",
  },
  iconTxt: {
    fontSize: 18,
    color: "#9f9f9f",
  },
  swipeableRow: {
    flexDirection: "row",
    // borderBottomWidth: 1,
    borderBottomColor: "#333",
    height: 50,        
    alignItems: "center",
    paddingHorizontal: 10,
  },
  swipeableInit: {
  	marginTop: 30,
    backgroundColor: "#141414",
    borderRadius: 25,
  },
  finisher: {
  	flexDirection: "row",
    alignItems: "center",
  	},
  finisherEditing: {
  	height: 50,
    backgroundColor: "#141414",
    borderRadius: 25,
    paddingHorizontal: 6,
  	},
  finisherNeighbor: {
  	height: 40,
  	marginHorizontal: 6,
	},
  finisherPrev: {
  	borderColor: "#222",
  	borderTopWidth: 1,
  	borderLeftWidth: 1,
  	borderRightWidth: 1,
	},
  finisherNext: {
  	borderColor: "#222",
  	borderBottomWidth: 1,
  	borderLeftWidth: 1,
  	borderRightWidth: 1,
  },
  neighborCol: {color: "#bbb"},
  placeCol: {
    width: 40, // enough for "999."
    fontSize: 16,
    color: "#fff",
    fontVariant: "tabular-nums",
    paddingLeft: 10,
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
    maxWidth: 100,
    textAlign: "right", 
    fontVariant: "tabular-nums",
    paddingRight: 10,
  },
  genderCol: {
    fontSize: 16,
    color: "#fff",
    maxWidth: 50,
    textAlign: "right", 
    fontVariant: "tabular-nums",
    paddingRight: 14,
  },
  genderM: {color: "#B39CD0"}, // powdery purple
  genderF: {color: "#CC7F6B"}, // terracotta
  genderNB: {color: "#E6D6B9"}, // warm beige
  disabledInput: {
    // backgroundColor: "#333",
    // color: "#999",
  },
  disabledInputText: {
  	// backgroundColor: "red",
  	// color: "red",
	},
  optionRow: {
    justifyContent: "space-around",
    borderBottomWidth: 0,
  },
  optionButton: {
    marginHorizontal: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#000",
    backgroundColor: "#141414",
    flex: 1,
    alignItems: 'center',
  },
  optionButtonSelected: {
    backgroundColor: "#2f2708",
    borderColor: "#2f2708",
  },
  optionText: {
  	paddingVertical: 6,
    // paddingHorizontal: 12,
    fontSize: 18,
    color: "#9f9f9f",
    // fontWeight: "500",
    textTransform: "uppercase",
  },
  optionTextSelected: {
    color: "#FFD52E",
    // fontWeight: "700",
  },
  notesInput: {
    // padding: 10,
    // minHeight: 100,
    fontSize: 18,
    // backgroundColor: "#fff",
    flex: 1,
    color: "#fff",
  },
});
