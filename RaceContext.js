import React, { createContext, useContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import uuid from "react-native-uuid";
import { mockRaces } from "./MockData"; 

const RaceContext = createContext();

export function RaceProvider({ children }) {
  // const [races, setRaces] = useState([]);
  // restore previous line and delete next line to use real data 
  const [races, setRaces] = useState(mockRaces);

  // Load races on mount
  useEffect(() => {
    (async () => {
      const stored = await AsyncStorage.getItem("races");
      if (stored) setRaces(JSON.parse(stored));
    })();
  }, []);

  // Save races on change
  useEffect(() => {
    AsyncStorage.setItem("races", JSON.stringify(races));
  }, [races]);

  // Helper: persist
  const updateRaces = (fn) => setRaces((prev) => fn([...prev]));

  // Create new race
  const createRace = (name) => {
    const newRace = {
      id: uuid.v4(),
      name,
      startTime: null,
      state: "before",
      finishers: [],
    };
    updateRaces((r) => [...r, newRace]);
    return newRace;
  };

  // Start race
  const startRace = (id) => {
    updateRaces((r) =>
      r.map((race) =>
        race.id === id ? { ...race, startTime: Date.now(), state: "started" } : race
      )
    );
  };

  // Stop race
  const stopRace = (id) => {
    updateRaces((r) =>
      r.map((race) => (race.id === id ? { ...race, state: "stopped" } : race))
    );
  };

  // Archive race
  const archiveRace = (id) => {
    updateRaces((r) =>
      r.map((race) => (race.id === id ? { ...race, state: "archived" } : race))
    );
  };

  // Add finisher
  const addFinisher = (raceId, name = "") => {
    updateRaces((r) =>
      r.map((race) => {
        if (race.id !== raceId) return race;
        const finishTime = Date.now();
        const elapsedTime = finishTime - (race.startTime || finishTime);
        const newFinisher = {
          id: uuid.v4(),
          name,
          finishTime,
          elapsedTime,
        };
        return { ...race, finishers: [...race.finishers, newFinisher] };
      })
    );
  };

  const getRaceById = (id) => races.find((r) => r.id === id);

  return (
    <RaceContext.Provider
      value={{
        races,
        createRace,
        startRace,
        stopRace,
        archiveRace,
        addFinisher,
        getRaceById,
      }}
    >
      {children}
    </RaceContext.Provider>
  );
}

export function useRaceContext() {
  return useContext(RaceContext);
}
