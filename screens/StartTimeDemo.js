// screens/StartTimeDemo.js
import React, { useState, useEffect } from "react";
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";

export default function StartTimeDemo() {
  const [location, setLocation] = useState("");
  const [raceDateTime, setRaceDateTime] = useState(new Date());

  // UI state
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [timeText, setTimeText] = useState(formatTimeAMPM(raceDateTime));

  // Keep timeText synced when raceDateTime changes externally
  useEffect(() => {
    setTimeText(formatTimeAMPM(raceDateTime));
  }, [raceDateTime]);

  // ---- Formatters / parsers ----
  function formatDateDisplay(d) {
    // e.g. "Mon 1 Sep '25"
    const weekday = d.toLocaleDateString("en-US", { weekday: "short" });
    const day = d.getDate();
    const month = d.toLocaleDateString("en-US", { month: "short" });
    const yy = String(d.getFullYear()).slice(-2);
    return `${weekday} ${day} ${month} '${yy}`;
  }

  function formatTimeAMPM(d) {
    let hh = d.getHours();
    const mm = String(d.getMinutes()).padStart(2, "0");
    const ss = String(d.getSeconds()).padStart(2, "0");
    const ampm = hh >= 12 ? "PM" : "AM";
    hh = hh % 12;
    hh = hh === 0 ? 12 : hh; // 12-hour clock
    return `${hh}:${mm}:${ss} ${ampm}`;
  }

  // parse "h:mm:ss AM/PM" (1-12 for hour)
  function parseTimeAMPM(txt) {
    const re = /^\s*(0?[1-9]|1[0-2]):([0-5][0-9]):([0-5][0-9])\s*(AM|PM)\s*$/i;
    const m = txt.match(re);
    if (!m) return null;
    let hh = parseInt(m[1], 10);
    const mm = parseInt(m[2], 10);
    const ss = parseInt(m[3], 10);
    const ampm = m[4].toUpperCase();
    if (ampm === "PM" && hh !== 12) hh += 12;
    if (ampm === "AM" && hh === 12) hh = 0;
    return { hh, mm, ss };
  }

  // ---- Handlers ----
  const onDatePress = () => {
    setShowDatePicker(true);
  };

  const onDateChange = (event, selectedDate) => {
    // on Android selectedDate is undefined if dismissed
    setShowDatePicker(Platform.OS === "ios"); // on iOS keep open until user toggles; on Android hide after selection/dismiss
    if (selectedDate) {
      const newDT = new Date(raceDateTime);
      newDT.setFullYear(selectedDate.getFullYear());
      newDT.setMonth(selectedDate.getMonth());
      newDT.setDate(selectedDate.getDate());
      setRaceDateTime(newDT);
    }
  };

  const onTimeBlur = () => {
    const parsed = parseTimeAMPM(timeText);
    if (parsed) {
      const newDT = new Date(raceDateTime);
      newDT.setHours(parsed.hh, parsed.mm, parsed.ss, 0);
      setRaceDateTime(newDT);
      setTimeText(formatTimeAMPM(newDT)); // normalize formatting
    } else {
      // revert to previous valid time format
      setTimeText(formatTimeAMPM(raceDateTime));
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.root}>
        {/* Row 1: Location (left) and Date (right) */}
        <View style={styles.row}>
          <View style={[styles.cell, styles.leftCell, styles.locationCell]}>
            <TextInput
              value={location}
              onChangeText={setLocation}
              placeholder="Enter course name/location"
              placeholderTextColor="#999"
              style={styles.locationInput}
              returnKeyType="done"
            />
          </View>
        </View>

        {/* Row 2: Time (left) and empty placeholder / can be used later (right) */}
        <View style={styles.row}>
          <View style={[styles.cell, styles.leftCell]}>
            <TouchableOpacity onPress={onDatePress} activeOpacity={0.7}>
              <Text style={styles.dateText}>{formatDateDisplay(raceDateTime)}</Text>
            </TouchableOpacity>            
          </View>

          <View style={[styles.cell, styles.rightCell]}>
            <TextInput
              value={timeText}
              onChangeText={setTimeText}
              onBlur={onTimeBlur}
              style={styles.timeInput}
              keyboardType={Platform.OS === "ios" ? "numbers-and-punctuation" : "default"}
              autoCorrect={false}
              autoCapitalize="none"
            />
          </View>
        </View>

        {/* Row 3: Stopwatch */}
        <View style={styles.row}>

          {/* Play/Pause Button */}
          <View style={[styles.cell, styles.leftCell, styles.stopwatchCell]}>
            <TouchableOpacity style={styles.circleButton}>
              <Text style={styles.fullButtonText}>Start Race</Text>
            </TouchableOpacity>
          </View>

          {/* Stopwatch display */}
          <View style={[styles.cell, styles.rightCell]}>
            <TextInput
              value={location}
              onChangeText={setLocation}
              placeholder="Stopwatch here"
              placeholderTextColor="#999"
              style={styles.locationInput}
              returnKeyType="done"
            />
          </View>
        </View>

        {/* Native DatePicker (date only). On iOS spinner may remain visible; on Android it shows native dialog. */}
        {showDatePicker && (
          <DateTimePicker
            value={raceDateTime}
            mode="date"
            display={Platform.OS === "ios" ? "spinner" : "default"}
            onChange={onDateChange}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#fff" },
  root: { flex: 1, padding: 16 },

  row: {
    flexDirection: "row",
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#999",
  },

  cell: {
    flex: 1,
    // paddingVertical: 8,
    paddingHorizontal: 6,
  },

  leftCell: {
    // left column
  },

  rightCell: {
    // right column
    paddingLeft: 12,
    alignItems: "flex-end",
    justifyContent: "center",
  },

  // Location input: bold, thin underline full width
  locationInput: {
    fontSize: 18,
    fontWeight: "700",
    // borderBottomWidth: 1,
    // borderBottomColor: "#999",
    paddingBottom: 6,
    paddingTop: 4,
  },

  // Date display: normal weight, underlined look
  dateText: {
    fontSize: 16,
    // borderBottomWidth: 1,
    // borderBottomColor: "#999",
    paddingBottom: 6,
  },

  // Time input: same font as date
  timeInput: {
    fontSize: 16,
    // borderBottomWidth: 1,
    // borderBottomColor: "#999",
    paddingBottom: 6,
  },
});
