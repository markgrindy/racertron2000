// ./screens/RacesPast.js
import React, { useContext, useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Switch,
  Alert,
} from "react-native";
import { Swipeable } from "react-native-gesture-handler";
import { useRaceContext } from "../RaceContext";
import { Ionicons } from "@expo/vector-icons";
import { exportRaceToCSV } from '../utils/exportCsv';
import { formatDateYYYYMMDD } from '../utils/handleDateTime.js'

export default function RacesPast({ navigation }) {

	// ---- Navigation & States ---- 
	const [recentExpanded, setRecentExpanded] = React.useState(false);
	const [showArchived, setShowArchived] = useState(false);
	const [search, setSearch] = useState("");
  const [selectedYear, setSelectedYear] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("");  
	const { 
    races, 
    updateRaces,
    startRace, 
    archiveRace, 
    deleteRace, 
    getRaceById,
  } = useRaceContext();

  // ---- Handlers ---- 
  const handleExport = (race) => exportRaceToCSV(race);
  const handleLeftAction = (itemId) => {archiveRace(itemId)}; 
  const handleRightAction = (itemId) => {
  	const r = getRaceById(itemId);
  	Alert.alert(
  		`Delete ${r.name}`,
  		`Are you sure you want to permanently delete this race?`,
  		[
  			{ text: "Cancel", style: "cancel" },
  			{
  				text: "Delete",
  				style: "destructive",
  				onPress: () => deleteRace(itemId),
  			},
  		]
		);
  }; 

  // Archive races shown in filtered (or unfiltered!) search results 
  const handleArchiveFiltered = () => {
    updateRaces((prevRaces) =>
      prevRaces.map((r) =>
        filteredRaces.some((fr) => fr.id === r.id)
          ? { ...r, state: "archived" }
          : r
      )
    );
  };

  // Delete races shown in filtered (or unfiltered!) search results 
  const handleDeleteFiltered = () => {
	  if (!filteredRaces.length) return;
	  Alert.alert(
	    "Delete Races",
	    `Are you sure you want to permanently delete ${filteredRaces.length} race(s)?`,
	    [
	      { text: "Cancel", style: "cancel" },
	      {
	        text: "Delete",
	        style: "destructive",
	        onPress: () =>
	          updateRaces((prevRaces) =>
	            prevRaces.filter((r) => !filteredRaces.some((fr) => fr.id === r.id))
	          ),
	      },
	    ]
	  );
	};

  // ---- Search Functionality ---- 

  // Unique years from race startTimes
  const availableYears = useMemo(() => {
    const years = new Set();
    races.forEach((r) => {
      if (r.startTime) years.add(new Date(r.startTime).getFullYear());
    });
    return Array.from(years).sort((a, b) => b - a);
  }, [races]);

  // Filtered list of races
  const filteredRaces = useMemo(() => {
    return races.filter((r) => {
    	if (!showArchived && r.state === "archived") return false;
    	if (showArchived && r.state === "stopped") return false;
    	if (r.state === "before" || r.state === "started") return false;
    	const raceDate = new Date(r.startTime);
      const raceYear = raceDate.getFullYear();
      const raceMonth = raceDate.getMonth() + 1;
      const nameMatch = r.name
        ?.toLowerCase()
        .includes(search.toLowerCase());
      const yearMatch = !selectedYear || raceYear === parseInt(selectedYear);
      const monthMatch =
        !selectedMonth || raceMonth === parseInt(selectedMonth);
      return nameMatch && yearMatch && monthMatch;
    });
  }, [races, search, selectedYear, selectedMonth, showArchived]);

  /// ---- Search Results ---- 
  const renderFinishedRace = ({ item }) => {

    const leftActions = () => (
      <TouchableOpacity
        style={styles.swipeActionBlue}
        onPress={() => handleLeftAction(item.id)}
      >
        <Text style={styles.swipeText}>Archive</Text>
      </TouchableOpacity>
    )

    const rightActions = () => (
      <TouchableOpacity
        style={styles.swipeAction}
        onPress={() => handleRightAction(item.id)}
      >
        <Text style={styles.swipeText}>Delete</Text>
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
              {formatDateYYYYMMDD(new Date(item.startTime))} —{" "}
              {item.finishers.length} finishers
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
          style={styles.circleBtn}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back-outline" size={28} color="#fff" /> 
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
        style={[styles.container, styles.scrollContent]}
        contentContainerStyle={{ paddingTop: 18 }}
      >

      	{/* Filters */}
      	<TouchableOpacity 
          style={styles.buttonSection} 
          onPress={() => setRecentExpanded((prev) => !prev)}
        >
	        <View style={styles.sectionHeader}>
	          <Text style={styles.sectionTitle}>Filter Races</Text>
            <Ionicons 
            	name={recentExpanded ? "chevron-down" : "chevron-forward"}
            	size={24} 
            	color="#fff" 
          	/>
	        </View>

	        {recentExpanded && (
            <View style={styles.sectionInnerContainer}>
	            <TextInput
	              style={styles.input}
	              placeholder="Search by name"
	              placeholderTextColor="#777"
	              value={search}
	              onChangeText={setSearch}
	            />

	            <View style={styles.sectionRow}>
							  <Text style={styles.sectionText}>View archived</Text>
							  <View style={styles.spacer} />
							  <Switch
							    value={showArchived}
							    onValueChange={(val) => setShowArchived(val)}
							    trackColor={{ false: '#777', true: '#34C759' }}
							    thumbColor={ showArchived ? "#fff" : "#ccc" }
							  />
							</View>

	            <View style={styles.sectionRow}>
	              <View style={{ flex: 1 }}>
	                <Text style={styles.sectionText}>Year</Text>
	                <ScrollView horizontal>
	                  {availableYears.map((year) => (
	                    <TouchableOpacity
	                      key={year}
	                      style={[
	                        styles.filterButton,
	                        selectedYear === String(year) &&
	                          styles.filterButtonActive,
	                      ]}
	                      onPress={() =>
	                        setSelectedYear(
	                          selectedYear === String(year) ? "" : String(year)
	                        )
	                      }
	                    >
	                      <Text style={styles.filterText}>{year}</Text>
	                    </TouchableOpacity>
	                  ))}
	                </ScrollView>
	              </View>
	            </View>

	            <View style={styles.sectionRow}>
	              <View style={{ flex: 1 }}>
	                <Text style={styles.sectionText}>Month</Text>
	                <ScrollView horizontal>
	                  {[...Array(12)].map((_, i) => {
	                    const monthNum = i + 1;
	                    const isDisabled = !selectedYear;
	                    return (
	                      <TouchableOpacity
	                        key={monthNum}
	                        style={[
	                          styles.filterButton,
	                          selectedMonth === String(monthNum) &&
	                            styles.filterButtonActive,
	                          isDisabled && styles.filterButtonDisabled,
	                        ]}
	                        disabled={isDisabled}
	                        onPress={() =>
	                          setSelectedMonth(
	                            selectedMonth === String(monthNum)
	                              ? ""
	                              : String(monthNum)
	                          )
	                        }
	                      >
	                        <Text style={styles.filterText}>{monthNum}</Text>
	                      </TouchableOpacity>
	                    );
	                  })}
	                </ScrollView>
	              </View>
	            </View>

	            <View style={styles.sectionRow}>
		            
		            {!showArchived ? (
		            	<TouchableOpacity
			              style={[
			                styles.archiveButton,
			                filteredRaces.length === 0 && styles.archiveButtonDisabled,
			              ]}
			              disabled={filteredRaces.length === 0}
			              onPress={handleArchiveFiltered}
			            >
			              <Text style={styles.archiveButtonText}>
			                Archive all ({filteredRaces.length})
			              </Text>
			            </TouchableOpacity>
	            	) : (
			            <TouchableOpacity
			              style={[
			                styles.deleteButton,
			                filteredRaces.length === 0 && styles.archiveButtonDisabled,
			              ]}
			              disabled={filteredRaces.length === 0}
			              onPress={handleDeleteFiltered}
			            >
			              <Text style={styles.archiveButtonText}>
			                Delete all ({filteredRaces.length})
			              </Text>
			            </TouchableOpacity>
	            	)}          

		          	
	            </View> 

	            <View style={styles.spacer} />
	          </View>
	        )}
        </TouchableOpacity>

        <View style={styles.spacer} />

      	{/* Filtered Results */}
	      {filteredRaces.length === 0 ? (
	      	<Text style={styles.emptyText}>No races match your filters.</Text>
	    	) : (
	    		<>
		    		<FlatList
		          data={filteredRaces}
		          renderItem={renderFinishedRace}
		          keyExtractor={(item) => item.id}
		          scrollEnabled={false}
		        />
		        <View style={styles.spacer}></View>
	        </>
	    	)}
      </ScrollView>
		</View>
	)
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000", padding: 16, paddingTop: 48 },
  scrollContent: { paddingBottom: 40 },
  header: {
    position: "absolute",
    top: 4,
    left: 0,
    right: 0,
    zIndex: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
  },
  headerStopwatch: {
    backgroundColor: "#141414",
    borderColor: "#3a3a3a",
    borderWidth: 0,
    padding: 2,
    marginHorizontal: 14,
    flex: 1,
    borderRadius: 26,
    height: 52,
  },
  stopwatchText: {
    color: "#9f9f9f",
    fontSize: 36,
    fontWeight: "300",
    textAlign: "center",
  },
  circleBtn: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: "#3a3a3a",
    justifyContent: "center",
    alignItems: "center",
  },
  buttonSection: {
    backgroundColor: "#141414",
    borderRadius: 37,
    minHeight: 74,
    paddingHorizontal: 10,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginVertical: 8,
    padding: 8,
  },
  sectionTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
    marginVertical: 8,
  },
  sectionInnerContainer: { padding: 8 },
  sectionRow: { flexDirection: "row", marginVertical: 6 },
  sectionText: { color: "#ddd", marginBottom: 4, fontSize: 16 },
  input: {
    backgroundColor: "#222",
    color: "#fff",
    padding: 8,
    borderRadius: 6,
    marginBottom: 10,
  },
  filterButton: {
    backgroundColor: "#333",
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
    marginRight: 6,
  },
  filterButtonActive: {
    backgroundColor: "#43C35D",
  },
  filterButtonDisabled: {
    backgroundColor: "#222",
    opacity: 0.4,
  },
  filterText: { color: "#fff" },
  archiveButton: {
    backgroundColor: "#007AFF",
    borderRadius: 10,
    padding: 12,
    marginTop: 10,
    alignItems: "center",
    marginHorizontal: 4,
    flex: 1,
  },
  archiveButtonDisabled: { backgroundColor: "#333" },
  archiveButtonText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  deleteButton: {
  	backgroundColor: "#ff3b30",
  	borderRadius: 10,
    padding: 12,
    marginTop: 10,
    alignItems: "center",
    marginHorizontal: 4,
    flex: 1,
  },
  finishedRow: {
    height: 70,
    justifyContent: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#333",
    padding: 10,
    backgroundColor: "#000",
  },
  raceName: { color: "#fff", fontSize: 18 },
  meta: { color: "#aaa", fontSize: 14, marginTop: 4 },
  swipeAction: {
    backgroundColor: "#ff3b30", // red 
    justifyContent: "center",
    alignItems: "flex-end",
    paddingHorizontal: 20,
    marginVertical: 1,
  },
  swipeActionBlue: {
    backgroundColor: "#007AFF",
    justifyContent: "center",
    alignItems: "flex-start",
    paddingHorizontal: 20,
    marginVertical: 1,
  },
  swipeActionGreen: {
    backgroundColor: "#43C35D",
    justifyContent: "center",
    alignItems: "flex-start",
    paddingHorizontal: 20,
    marginVertical: 1,
  },
  swipeText: { color: "#fff", fontWeight: "normal", fontSize: 18 },
  emptyText: {
    color: "#ddd",
    fontStyle: "italic",
    marginBottom: 8,
    fontSize: 18,
  },
  spacer: { height: 20, flex: 1 },
});
