// ./RaceContext.js
import React, { createContext, useContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import uuid from "react-native-uuid";
import { mockRaces } from "./MockData"; 

const RaceContext = createContext();

export const RaceProvider = ({ children }) => {
  // const [races, setRaces] = useState([]);
  // restore previous line and delete next line to use real data 
  // console.log("Mock races loaded:", mockRaces);
  const [races, setRaces] = useState(mockRaces || []);
  const [loaded, setLoaded] = useState(false);

  // Load races from storage on mount
  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem("races");
        if (stored && stored !== "[]") {
          setRaces(JSON.parse(stored));
          // console.log("Loaded races from storage.");
        } else {
          console.log("No stored races found — using mock data.");
          setRaces(mockRaces);
        }
      } catch (err) {
        console.error("Error loading races:", err);
      } finally {
        setLoaded(true);
      }
    })();
  }, []);

  // Save races only *after* loaded
  useEffect(() => {
    if (loaded) {
      AsyncStorage.setItem("races", JSON.stringify(races));
    }
  }, [races, loaded]);

  // Helper: persist
  const updateRaces = (fn) =>
    setRaces((prev) => {
      const next = fn(structuredClone(prev)); // deep copy
      return next;
    });

  // Create new race
  const createRace = (name) => {
    const newRace = {
      id: uuid.v4(),
      name,
      startTime: null,
      state: "before",
      finishers: [],
      deletedFinishers: [],
    };
    updateRaces((r) => [...r, newRace]);
    return newRace;
  };

  // Start race
  const startRace = (id) => {
    updateRaces((r) =>
      r.map((race) => {
        if (race.id !== id) return race;

        // If race already has a startTime, preserve it
        const existingStartTime = race.startTime || Date.now();

        return {
          ...race,
          startTime: existingStartTime,
          state: "started",
        };
      })
    );
  };

  // Stop race
  const stopRace = (id) => {
    updateRaces((r) =>
      r.map((race) => {
        if (race.id !== id) return race;
        return {
          ...race,
          state: "stopped",
          stoppedDate: new Date().toISOString(), // store in ISO string form for easy comparison
        };
      })
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
        if (race.state !== "started") return race; // ignore stopped/archived

        const finishTime = Date.now();
        const elapsedTime = finishTime - (race.startTime || finishTime);
        const newFinisher = {
          id: uuid.v4(),
          name: name || `Runner${race.finishers.length + 1}`,
          finishTime,
          elapsedTime,
        };
        return { ...race, finishers: [...race.finishers, newFinisher] };
      })
    );
  };

  // Manually insert a finisher and/or finish time (ex: in case user forgot to hit the button on time)
  const manualAddFinisher = (raceId, name = "", elapsedTime) => {
    null 
  }

  // Remove finisher 
  const removeFinisher = () => {null}


  const nameRace = (id, name) => {
    updateRaces((r) =>
      r.map((race) => {
        if (race.id !== id) return race;
        return {
          ...race,
          name: name,
        };
      })
    );
  }

  const setStartTime = (id, date) => {
    const timestamp = date.getTime(); 
    updateRaces((r) =>
      r.map((race) => {
        if (race.id !== id) return race;
        return {
          ...race,
          startTime: timestamp,
        };
      })
    );
  }

  const startTime = (id) => {
    const race = races.find((r) => r.id === id); 
    const startTime = race.startTime; 
    return startTime; 
  }

  const getRaceById = (id) => races.find((r) => r.id === id);

  return (
    <RaceContext.Provider
      value={{
        races,
        setRaces,
        createRace,
        nameRace, 
        setStartTime,
        startRace,        
        stopRace,
        archiveRace,
        addFinisher,
        manualAddFinisher,
        removeFinisher,
        updateRaces,
        getRaceById,
        startTime, 
      }}
    >
      {children}
    </RaceContext.Provider>
  );
}

export const useRaceContext = () => useContext(RaceContext);

