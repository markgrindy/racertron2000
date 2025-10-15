export const mockRaces = [
  // --- STARTED RACES (Underway) ---
  {
    id: "r1",
    name: "Lester Park",
    startTime: Date.now() - 1000 * 60 * 83 + 1000 * 12, // 1h23m ago
    state: "started",
    finishers: [
      { id: "f1", name: "Alice", finishTime: Date.now() - 1000 * 60 * 3, elapsedTime: 1000 * 60 * 80 },
      { id: "f2", name: "Ben", finishTime: Date.now() - 1000 * 60 * 2, elapsedTime: 1000 * 60 * 81 },
      { id: "f3", name: "Cara", finishTime: Date.now() - 1000 * 60 * 1, elapsedTime: 1000 * 60 * 82 },
    ],
  },
  {
    id: "r2",
    name: "Chester Bowl",
    startTime: Date.now() - 1000 * 60 * 45 + 1000 * 23,
    state: "started",
    finishers: [
      { id: "f4", name: "David", finishTime: Date.now() - 1000 * 60 * 5, elapsedTime: 1000 * 60 * 40 },
      { id: "f5", name: "Ella", finishTime: Date.now() - 1000 * 60 * 2, elapsedTime: 1000 * 60 * 43 },
    ],
  },
  {
    id: "r3",
    name: "Hawk Ridge",
    startTime: Date.now() - 1000 * 60 * 10 + 1000 * 67,
    state: "started",
    finishers: [
      { id: "f6", name: "Finn", finishTime: Date.now() - 1000 * 30, elapsedTime: 1000 * 60 * 9.5 },
    ],
  },
  {
    id: "r4",
    name: "Zapp's Loop",
    startTime: Date.now() - 1000 * 60 * 120 + 1000 * 98, // 2 hours ago
    state: "started",
    finishers: [
      { id: "f7", name: "Gina", finishTime: Date.now() - 1000 * 60 * 20, elapsedTime: 1000 * 60 * 100 },
      { id: "f8", name: "Hank", finishTime: Date.now() - 1000 * 60 * 10, elapsedTime: 1000 * 60 * 110 },
    ],
  },

  // --- STOPPED RACES (Finished) ---
  {
    id: "r5",
    name: "Eugene Curnow Trail Marathon",
    startTime: Date.now() - 1000 * 60 * 180 + 1000 * 45,
    state: "stopped",
    finishers: new Array(8).fill(null).map((_, i) => ({
      id: `fE${i}`,
      name: `Runner ${i + 1}`,
      finishTime: Date.now() - 1000 * 60 * (120 - i * 2),
      elapsedTime: 1000 * 60 * (60 + i * 2),
    })),
  },
  {
    id: "r6",
    name: "Rock Knob",
    startTime: Date.now() - 1000 * 60 * 240,
    state: "stopped",
    finishers: new Array(10).fill(null).map((_, i) => ({
      id: `fH${i}`,
      name: `Racer ${i + 1}`,
      finishTime: Date.now() - 1000 * 60 * (150 - i),
      elapsedTime: 1000 * 60 * (90 + i),
    })),
  },
  {
    id: "r7",
    name: "Rolling Stone",
    startTime: Date.now() - 1000 * 60 * 200,
    state: "stopped",
    finishers: [
      { id: "f9", name: "Ivy", finishTime: Date.now() - 1000 * 60 * 60, elapsedTime: 1000 * 60 * 140 },
      { id: "f10", name: "Jack", finishTime: Date.now() - 1000 * 60 * 50, elapsedTime: 1000 * 60 * 150 },
    ],
  },
  {
    id: "r8",
    name: "Spirit Mountain",
    startTime: Date.now() - 1000 * 60 * 30,
    state: "stopped",
    finishers: [
      { id: "f11", name: "Kate", finishTime: Date.now() - 1000 * 60 * 25, elapsedTime: 1000 * 60 * 5 },
      { id: "f12", name: "Leo", finishTime: Date.now() - 1000 * 60 * 24, elapsedTime: 1000 * 60 * 6 },
    ],
  },
  {
    id: "Pine Valley",
    name: "Pine Knob Hill Climb",
    startTime: Date.now() - 1000 * 60 * 70,
    state: "stopped",
    finishers: [
      { id: "f13", name: "Mia", finishTime: Date.now() - 1000 * 60 * 10, elapsedTime: 1000 * 60 * 60 },
      { id: "f14", name: "Ned", finishTime: Date.now() - 1000 * 60 * 5, elapsedTime: 1000 * 60 * 65 },
    ],
  },
  {
    id: "r10",
    name: "Bayfront 10-Miler",
    startTime: Date.now() - 1000 * 60 * 300,
    state: "stopped",
    finishers: new Array(5).fill(null).map((_, i) => ({
      id: `fB${i}`,
      name: `Finisher ${i + 1}`,
      finishTime: Date.now() - 1000 * 60 * (280 - i * 3),
      elapsedTime: 1000 * 60 * (20 + i * 3),
    })),
  },

  // --- ARCHIVED RACES ---
  {
    id: "r11",
    name: "Skyline Relay",
    startTime: Date.now() - 1000 * 60 * 1440 * 2,
    state: "archived",
    finishers: new Array(4).fill(null).map((_, i) => ({
      id: `fS${i}`,
      name: `Teammate ${i + 1}`,
      finishTime: Date.now() - 1000 * 60 * (100 + i * 3),
      elapsedTime: 1000 * 60 * (100 + i * 3),
    })),
  },
  {
    id: "r12",
    name: "Minnesota Voyageur Trail Ultramarathon",
    startTime: Date.now() - 1000 * 60 * 1440 * 3,
    state: "archived",
    finishers: [
      { id: "f15", name: "Olive", finishTime: Date.now() - 1000 * 60 * 60, elapsedTime: 1000 * 60 * 1380 },
    ],
  },
  {
    id: "r13",
    name: "Harbor Half",
    startTime: Date.now() - 1000 * 60 * 1440 * 5,
    state: "archived",
    finishers: new Array(7).fill(null).map((_, i) => ({
      id: `fHH${i}`,
      name: `Runner ${i + 1}`,
      finishTime: Date.now() - 1000 * 60 * (600 - i * 5),
      elapsedTime: 1000 * 60 * (840 + i * 5),
    })),
  },
  {
    id: "r14",
    name: "Park Point 5K",
    startTime: Date.now() - 1000 * 60 * 1440 * 8,
    state: "archived",
    finishers: [
      { id: "f16", name: "Pete", finishTime: Date.now() - 1000 * 60 * 10, elapsedTime: 1000 * 60 * 1430 },
      { id: "f17", name: "Quinn", finishTime: Date.now() - 1000 * 60 * 5, elapsedTime: 1000 * 60 * 1435 },
    ],
  },
  {
    id: "r15",
    name: "Hartley Park Enduro",
    startTime: Date.now() - 1000 * 60 * 1440 * 10,
    state: "archived",
    finishers: new Array(6).fill(null).map((_, i) => ({
      id: `fHP${i}`,
      name: `Enduro Rider ${i + 1}`,
      finishTime: Date.now() - 1000 * 60 * (1000 - i * 2),
      elapsedTime: 1000 * 60 * (440 + i * 2),
    })),
  },
];
