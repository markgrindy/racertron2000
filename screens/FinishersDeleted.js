// ../screens/FinishersDeleted.js 

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
} from "react-native";
import { Swipeable } from 'react-native-gesture-handler';
import { useRoute, useNavigation } from "@react-navigation/native";
import { useRaceContext } from '../RaceContext';
import { parseDateYYYYMMDD, parseTimeAMPM, filterDateInput, filterTimeInput, formatDateYYYYMMDD, formatTimeAMPM, formatElapsedTime} from '../utils/handleDateTime.js'
import { useActionSheet } from '@expo/react-native-action-sheet';
import { Ionicons } from "@expo/vector-icons";

export default function FinishersDeleted() {
	// Navigation 
  const route = useRoute();
  const navigation = useNavigation();
  const { raceId } = route.params || {};

  // State management 
  const { getRaceById, editFinisher, deleteFinisher, undeleteFinisher, clearDeletedFinishers } = useRaceContext();
  const [race, setRace] = useState(() => getRaceById(raceId));
  const finishers = race.finishers; 
  
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

  // ---- Menu button ---- 
  const { showActionSheetWithOptions } = useActionSheet();

  const showMenu = () => {
    const options = [
      "Clear deleted times",
      "Cancel",
    ]; 

    const destructiveButtonIndex = options.indexOf("Clear deleted times");
    const cancelButtonIndex = options.length - 1; // always last

    showActionSheetWithOptions(
      {
        options,
        destructiveButtonIndex,
        cancelButtonIndex,
      },
      (buttonIndex) => {
        const pressed = options[buttonIndex];
        if (pressed === "Clear deleted times") {
          handleClearDeletedFinishers();
        }
      }
    );
  };

  const handleClearDeletedFinishers = () => {	
  	if (!race.deletedFinishers || race.deletedFinishers.length === 0) {
  		Alert.alert(
  			"List already empty",
  			"No deleted times to clear.",
			)
  	} else {
  		clearDeletedFinishers(race.id); 
  	}
  }

  const renderRightActions = (itemId) => (
    <TouchableOpacity
      style={styles.restoreButton}
      onPress={() => undeleteFinisher(race.id, itemId)}
    >
      <Text style={styles.restoreText}>Restore</Text>
    </TouchableOpacity>
  );

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
      <View style={styles.container}>

        {/* Row 1: Title */}
        <View style={styles.row}> 
        	<Text style={styles.nameInput}>Deleted finish times</Text>
        </View> 

        {/* Row 2: FlatList */}
        {(!race.deletedFinishers || race.deletedFinishers.length === 0)? (
	        <Text style={styles.emptyText}>No deleted times</Text>
	      ) : (
	        <FlatList
	          data={race.deletedFinishers}
	          keyExtractor={( item ) => item.id }
	          renderItem={({ item, index }) => {
	          	return (
	          		<>
	                <Swipeable 
	                	renderRightActions={() => renderRightActions(item.id)}
	              	>
		          		  <View style={styles.swipeableRow}>
			                <Text style={styles.placeCol}>
			                	<Ionicons name="stopwatch-outline" size={18} color="#fff" />
			                </Text>
			                <Text style={styles.timeCol}>{formatElapsedTime(item.finishTime - startTime)}</Text>
			              </View>
	                </Swipeable> 
	                {index === race.deletedFinishers.length - 1 && (
	                	<View style={styles.tipRow}> 
	                		<Text style={styles.tipTxt}>
	                			<Ionicons name="arrow-back-outline" size={16} color="#fff" />  Swipe to restore
                			</Text>
                		</View> 
	                )}
                </>
	          	);	              
	          }}
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
});
