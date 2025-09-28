// /components/Stopwatch.js
import React from "react";
import { View, Text, Button, StyleSheet } from "react-native";

export default function Stopwatch({
  elapsed,
  running,
  onStart,
  onStop,
  onPlace,
  nextPlace,
}) {
  const formatTime = (secs) => {
    const h = String(Math.floor(secs / 3600)).padStart(2, "0");
    const m = String(Math.floor((secs % 3600) / 60)).padStart(2, "0");
    const s = String(secs % 60).padStart(2, "0");
    return `${h}:${m}:${s}`;
  };

  return (
    <View style={styles.container}>
      <Text style={styles.time}>{formatTime(elapsed)}</Text>
      {!running ? (
        <Button title="▶️ Start Race" onPress={onStart} />
      ) : (
        <>
          <Button title={`Place: ${nextPlace}`} onPress={onPlace} />
          <Button title="⏹ Stop Race" color="red" onPress={onStop} />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginVertical: 16, alignItems: "center" },
  time: { fontSize: 32, marginBottom: 16, textAlign: "center" },
});
