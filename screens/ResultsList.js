import React, { useState, useCallback } from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { loadRaces } from "../utils/storage";

export default function ResultsList() {
  const [races, setRaces] = useState([]);
  const navigation = useNavigation();

  // Refresh list whenever this tab is focused
  useFocusEffect(
    useCallback(() => {
      const fetchRaces = async () => {
        try {
          const allRaces = await loadRaces();
          // Only show finished races
          const finishedRaces = allRaces.filter((r) => r.finished);
          // Show newest first
          setRaces(finishedRaces.reverse());
          // console.log("Loaded finished races:", finishedRaces);
        } catch (err) {
          console.error("Error loading races:", err);
        }
      };
      fetchRaces();
    }, [])
  );

  const renderRace = ({ item }) => (
    <TouchableOpacity
      onPress={() =>
        navigation.navigate("ResultsDetail", {
          raceId: item.id,
        })
      }
    >
      <View style={styles.card}>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.meta}>
          {item.finishers?.length || 0} finishers
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {races.length === 0 ? (
        <Text style={styles.emptyText}>No finished races yet</Text>
      ) : (
        <FlatList
          data={races}
          keyExtractor={(item) => item.id}
          renderItem={renderRace}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  card: { padding: 16, borderBottomWidth: 1, borderColor: "#ccc" },
  title: { fontSize: 18, fontWeight: "bold" },
  meta: { fontSize: 14, color: "#666", marginTop: 4 },
  emptyText: { fontSize: 16, textAlign: "center", marginTop: 40, color: "#666" },
});
