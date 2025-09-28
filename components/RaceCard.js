// /components/RaceCard.js
import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";

export default function RaceCard({ race, onPress }) {
  return (
    <TouchableOpacity onPress={onPress}>
      <View style={styles.card}>
        <Text style={styles.title}>{race.title}</Text>
        <Text style={styles.meta}>{race.finishers.length} finishers</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 16,
    borderBottomWidth: 1,
    borderColor: "#ccc",
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
  },
  meta: {
    fontSize: 14,
    color: "#666",
  },
});
