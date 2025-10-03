
// /utils/formatElapsedTime.js

/**
 * Returns elapsed time as a string, formatted [h]:mm:ss
 */
export async function formatElapsedTime(ms) {
  let totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  totalSeconds %= 3600;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  const hh = hours > 0 ? `${hours}:` : ""; // omit hours if 0
  const mm = String(minutes).padStart(2, "0");
  const ss = String(seconds).padStart(2, "0");

  return `${hh}${mm}:${ss}`;
}