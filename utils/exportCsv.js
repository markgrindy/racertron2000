// /utils/exportCsv.js
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import { Alert } from "react-native";
import { formatElapsedTime } from '../utils/handleDateTime.js'

/**
 * Exports a race to CSV and opens the system share sheet.
 * @param {Object} race - { name: string, finishers: { place, name, time }[], startedAt?: Date }
 */
export async function exportRaceToCSV(race) {

  if (!race || !race.finishers?.length) {
    console.warn("No race or no finishers to export");
    Alert.alert("No finishers", "Cannot export CSV: there are no finishers for this race.");
    return;
  }

  try {
    // Construct CSV content
    const header = "place,name,time\n";

    const rows = race.finishers
      .map((f, index) => {
        const place = index + 1;
        const name = f.name || "";
        const time = formatElapsedTime(f.finishTime - race.startTime);
        return `${place},${name},${time}`;
      })
      .join("\n");

    const csv = header + rows;

    // Build safe filename using raceName + startTime
    const now = new Date(race.startTime || Date.now());
    const pad = (n) => String(n).padStart(2, "0");
    const dateStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
    const timeStr = `${pad(now.getHours())}${pad(now.getMinutes())}`; // HHMM, no colon

    const safeTitle = (race.name || "New Race")
      .replace(/\s+/g, "_") // replace spaces with underscores
      .replace(/[^\w\-]/g, ""); // remove non-alphanumeric/underscore/dash

    const fileName = `${dateStr}_${timeStr}_${safeTitle}.csv`;

    // Full file path
    const fileUri = FileSystem.documentDirectory + fileName;

    // Write CSV to local file
    await FileSystem.writeAsStringAsync(fileUri, csv);

    // Trigger sharing
    await Sharing.shareAsync(fileUri);
    // console.log("CSV export triggered:", fileUri);
  } catch (err) {
    console.error("Error exporting CSV:", err);
    Alert.alert("Export failed", "An error occurred while exporting the CSV.");
  }
}
