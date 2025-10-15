// ./utils/handleDateTime.js

// import { parseDateYYYYMMDD, parseTimeAMPM, filterDateInput, filterTimeInput, formatDateYYYYMMDD, formatTimeAMPM} from '../utils/handleDateTime.js'

/**
 * Parses a date string in YYYY-MM-DD format and returns a Date object.
 * @param {string} dateStr - The date string (e.g. "2025-10-06")
 * @returns {Date|null}
 */
export function parseDateYYYYMMDD(dateStr) {
    const re = /^\s*(\d{4})-(\d{2})-(\d{2})\s*$/;
    const m = dateStr.match(re);
    if (!m) return null;
    const yyyy = parseInt(m[1], 10);
    const mm = parseInt(m[2], 10);
    const dd = parseInt(m[3], 10);
    const d = new Date(yyyy, mm - 1, dd);
    if (
      d.getFullYear() === yyyy &&
      d.getMonth() === mm - 1 &&
      d.getDate() === dd
    ) {
      return d;
    }
    return null;
  }

/**
 * Parses a time string in h:mm AM/PM format and returns a Date or {hours, minutes}.
 * @param {string} timeStr - The time string (e.g. "3:45 PM")
 * @returns {{ hours: number, minutes: number }|null}
 */
export function parseTimeAMPM(timeStr) {
    const re = /^\s*(0?[1-9]|1[0-2]):([0-5][0-9]):([0-5][0-9])\s*(AM|PM)\s*$/i;
    const m = timeStr.match(re);
    if (!m) return null;
    let hh = parseInt(m[1], 10);
    const mm = parseInt(m[2], 10);
    const ss = parseInt(m[3], 10);
    const ampm = m[4].toUpperCase();
    if (ampm === "PM" && hh !== 12) hh += 12;
    if (ampm === "AM" && hh === 12) hh = 0;
    return { hh, mm, ss };
  }

/**
 * Filters raw user input to allow only valid date characters.
 * Example: restrict to digits and dashes for YYYY-MM-DD.
 * @param {string} input
 * @returns {string}
 */
export function filterDateInput(input) {
  // allow only digits and dashes
  return input.replace(/[^0-9-]/g, "");
}

/**
 * Filters raw user input to allow only valid time characters.
 * Example: restrict to digits, colon, and AM/PM letters.
 * @param {string} input
 * @returns {string}
 */
export function filterTimeInput(input) {
  // allow digits, colon, space, A/a, M/m, P/p
  return input.replace(/[^0-9: apmAPM]/g, "");
}

/**
 * Formats a Date object as YYYY-MM-DD.
 * @param {Date} date
 * @returns {string}
 */
export function formatDateYYYYMMDD(date) {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const dd = String(date.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  }

/**
 * Formats a Date object as h:mm AM/PM.
 * @param {Date} date
 * @returns {string}
 */
export function formatTimeAMPM(date) {
    let hh = date.getHours();
    const mm = String(date.getMinutes()).padStart(2, "0");
    const ss = String(date.getSeconds()).padStart(2, "0");
    const ampm = hh >= 12 ? "PM" : "AM";
    hh = hh % 12;
    hh = hh === 0 ? 12 : hh;
    return `${hh}:${mm}:${ss} ${ampm}`;
  }

/**
 * Formats ms as (h):mm:ss (for ex: ms = duration since startTime).
 * Handles negative durations with a leading minus sign.
 * @param {number} ms
 * @returns {string}
 */
export function formatElapsedTime(ms) {
  if (isNaN(ms)) return "<error: NaN>";

  const isNegative = ms < 0;
  const absMs = Math.abs(ms);

  let totalSeconds = Math.floor(absMs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  totalSeconds %= 3600;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  const hh = hours > 0 ? `${hours}:` : ""; // omit hours if 0
  const mm = String(minutes).padStart(2, "0");
  const ss = String(seconds).padStart(2, "0");

  return `${isNegative ? "-" : ""}${hh}${mm}:${ss}`;
}