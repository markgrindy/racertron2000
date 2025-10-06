// MockData.js
export const mockRaces = [
  // Underway races
  {
    id: "r1",
    name: "Lester Park Loop",
    startTime: Date.now() - 1000 * 60 * 83, // 1h23m ago
    state: "started",
    finishers: [
      { id: "f1", name: "Alice", finishTime: Date.now() - 1000 * 60 * 3, elapsedTime: 1000 * 60 * 80 },
      { id: "f2", name: "Ben", finishTime: Date.now() - 1000 * 60 * 2, elapsedTime: 1000 * 60 * 81 },
      { id: "f3", name: "Cara", finishTime: Date.now() - 1000 * 60 * 1, elapsedTime: 1000 * 60 * 82 },
    ],
  },
  {
    id: "r2",
    name: "Chester Creek Dash",
    startTime: Date.now() - 1000 * 60 * 15, // 15m ago
    state: "started",
    finishers: [
      { id: "f4", name: "Dylan", finishTime: Date.now() - 1000 * 60 * 3, elapsedTime: 1000 * 60 * 12 },
      { id: "f5", name: "Eva", finishTime: Date.now() - 1000 * 60 * 1, elapsedTime: 1000 * 60 * 14 },
    ],
  },

  // Finished races
  {
    id: "r3",
    name: "Enger Tower Sprint",
    startTime: Date.now() - 1000 * 60 * 60 * 2,
    state: "stopped",
    finishers: new Array(8).fill(null).map((_, i) => ({
      id: `fs${i}`,
      name: `Runner ${i + 1}`,
      finishTime: Date.now() - 1000 * 60 * (120 - i * 2),
      elapsedTime: 1000 * 60 * (120 - i * 2),
    })),
  },
  {
    id: "r4",
    name: "Hawk Ridge Classic",
    startTime: Date.now() - 1000 * 60 * 45,
    state: "stopped",
    finishers: new Array(10).fill(null).map((_, i) => ({
      id: `fs${i + 10}`,
      name: `Runner ${i + 11}`,
      finishTime: Date.now() - 1000 * 60 * (45 - i * 2),
      elapsedTime: 1000 * 60 * (45 - i * 2),
    })),
  },
];