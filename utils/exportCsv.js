// /utils/exportCsv.js
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import { Alert } from "react-native";

/**
 * Exports a race to CSV and opens the system share sheet.
 * @param {Object} race - { title: string, finishers: string[] }
 */
export async function exportRaceToCSV(race, fileNameInit) {
  if (!race || !race.finishers?.length) {
    console.warn("No race or no finishers to export");
    Alert.alert("No finishers", "Cannot export CSV: there are no finishers for this race.");
    return;
  }

  try {
    // Construct CSV content
    const header = "place,time\n";
    const rows = race.finishers
      .map((time, index) => `${index + 1},${time}`)
      .join("\n");
    const csv = header + rows;

    // Safe file name: YYYY-MM-DD_HHMM_title.csv
    const now = new Date(race.startedAt || new Date());
    const pad = (n) => String(n).padStart(2, "0");
    const dateStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
    const timeStr = `${pad(now.getHours())}${pad(now.getMinutes())}`; // HHMM, no colon
    const safeTitle = (fileNameInit || "test Race")
      .replace(/\s+/g, "_")           // replace spaces with underscore
      .replace(/[^\w\-]/g, "");       // remove non-alphanumeric/underscore/dash
    const fileName = `${safeTitle}.csv`;

    // Full file path
    const fileUri = FileSystem.documentDirectory + fileName;

    // Write CSV to local file
    await FileSystem.writeAsStringAsync(fileUri, csv);

    // Trigger sharing
    await Sharing.shareAsync(fileUri);
    console.log("CSV export triggered:", fileUri);
  } catch (err) {
    console.error("Error exporting CSV:", err);
    Alert.alert("Export failed", "An error occurred while exporting the CSV.");
  }
}
