// screens/DeletedLogsScreen.js
import { React, useContext } from "react";
import { View, Text, FlatList, StyleSheet, TouchableOpacity } from "react-native";
import { RaceContext } from '../RaceContext';
import { SafeAreaView } from "react-native-safe-area-context";
import { Swipeable } from "react-native-gesture-handler";

export default function DeletedLogsScreen() {
  const { deletedFinishers, restoreFinisher } = useContext(RaceContext); 

  // console.log("deletedFinishers:", deletedFinishers);

  const renderRightActions = (itemId) => (
    <TouchableOpacity
      style={styles.restoreButton}
      onPress={() => restoreFinisher(itemId)}
    >
      <Text style={styles.restoreText}>Restore</Text>
    </TouchableOpacity>
  );

  return (
  	<SafeAreaView style={styles.container}>
	    <View>
	      <Text style={styles.title}>Deleted Times</Text>
	      {deletedFinishers.length === 0 ? (
	        <Text style={styles.emptyText}>No deleted times</Text>
	      ) : (
	        <FlatList
	          data={deletedFinishers}
	          keyExtractor={( item ) => item.id }
	          renderItem={({ item }) => {
	          	return (
                <Swipeable renderRightActions={() => renderRightActions(item.id)}>
	          		  <View style={styles.swipeableRow}>
		                <Text style={styles.placeCol}>{item.place}.</Text>
		                <Text style={styles.timeCol}>{item.time}</Text>
		              </View>
                </Swipeable> 
	          	);	              
	          }}
	        />
	      )}
	    </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#111",
    padding: 20,
  },
  title: {
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
});
