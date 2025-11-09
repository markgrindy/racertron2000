// /utils/exportCsv.js
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import { Alert } from "react-native";

/**
 * Exports a race (finishers + dns + dnf + volunteers) to CSV and opens the system share sheet.
 * Columns: overallPlace, name, gender, genderPlace, notes, recordId, raceName, raceId
 */
export async function exportRaceToCSV(race) {
  if (!race) {
    console.warn("No race object provided");
    Alert.alert("Error", "No race data to export.");
    return;
  }

  const { finishers = [], dns = [], dnf = [], volunteers = [], name: raceName, id: raceId } = race;

  if (!finishers.length && !dns.length && !dnf.length && !volunteers.length) {
    Alert.alert("No records", "Cannot export CSV: there are no records for this race.");
    return;
  }

  try {
    // --- Compute places for finishers ---
    const sortedFinishers = computePlaces(finishers);

    // --- Header row ---
    const header = [
      "overallPlace",
      "name",
      "gender",
      "genderPlace",
      "type",
      "notes",
      "recordId",
      "raceName",
      "raceId",
    ].join(",") + "\n";

    // --- Finishers rows ---
    const finisherRows = sortedFinishers.map((f) => {
      const { overallPlace = "", name = "", gender = "", genderPlace = "", notes = "", id = "" } = f;
      return [
        overallPlace,
        name,
        gender,
        genderPlace,
        "finishers",
        notes,
        id,
        raceName,
        raceId,
      ]
        .map(csvEscape)
        .join(",");
    });

    // --- Helper for DNS / DNF / Volunteers ---
    const processOther = (arr, type) =>
      (arr || []).map((item) => {
        const name = item.name ?? "";
        const noteText = item.notes;
        const recordId = item.id ?? "";
        return [
          "", // overallPlace
          name,
          "", // gender
          "", // genderPlace
          type, 
          noteText,
          recordId,
          raceName,
          raceId,
        ]
          .map(csvEscape)
          .join(",");
      });

    const dnsRows = processOther(dns, "dns");
    const dnfRows = processOther(dnf, "dnf");
    const volunteerRows = processOther(volunteers, "volunteers");

    // --- Combine all ---
    const allRows = [
      ...finisherRows,
      ...dnfRows,
      ...dnsRows,
      ...volunteerRows,
    ].join("\n");

    const csv = header + allRows;

    // --- File name ---
    const now = new Date();
    const pad = (n) => String(n).padStart(2, "0");
    const dateStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
    const timeStr = `${pad(now.getHours())}${pad(now.getMinutes())}`;
    const safeTitle = (raceName || "New_Race")
      .replace(/\s+/g, "_")
      .replace(/[^\w\-]/g, "");
    const fileName = `${dateStr}_${timeStr}_${safeTitle}.csv`;
    const fileUri = FileSystem.documentDirectory + fileName;

    // --- Write + share ---
    await FileSystem.writeAsStringAsync(fileUri, csv);
    await Sharing.shareAsync(fileUri);
  } catch (err) {
    console.error("Error exporting CSV:", err);
    Alert.alert("Export failed", "An error occurred while exporting the CSV.");
  }
}

/** Compute overall and gender places for finishers */
function computePlaces(finishers = []) {
  const sorted = [...finishers].sort((a, b) => (a.finishTime ?? 0) - (b.finishTime ?? 0));
  const genderCounters = {};

  return sorted.map((f, i) => {
    const gender = f.gender;
    if (!gender || gender === "N/A") {
      return { ...f, overallPlace: i + 1 };
    }
    genderCounters[gender] = (genderCounters[gender] || 0) + 1;
    return {
      ...f,
      overallPlace: i + 1,
      genderPlace: genderCounters[gender],
    };
  });
}

/** Escapes CSV fields that contain commas, quotes, or newlines */
function csvEscape(value) {
  const str = String(value ?? "");
  if (/[",\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}
