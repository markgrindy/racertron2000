// ./RaceContext.js
import React, { createContext, useContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import uuid from "react-native-uuid";
import { mockRaces } from "./MockData"; 

const RaceContext = createContext();

export const RaceProvider = ({ children }) => {
  // TEMPORARY: clear all saved race data to start fresh
  const clearStoredRaces = async () => {
    try {
      await AsyncStorage.removeItem('races');
      console.log("All stored races cleared!");
    } catch (error) {
      console.error("Error clearing stored races:", error);
    }
  };

  // useEffect(() => {
  //   clearStoredRaces();
  // }, []);

  const [races, setRaces] = useState([]);
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

  // Delete race completely
  const deleteRace = (id) => {
    updateRaces((r) => r.filter((race) => race.id !== id));
  };

  // Add finisher
  const addFinisher = (raceId, name = "") => {
    updateRaces((r) =>
      r.map((race) => {
        if (race.id !== raceId) return race;
        if (race.state !== "started") return race; // ignore stopped/archived

        const finishTime = Date.now();
        const newFinisher = {
          id: uuid.v4(),
          name: name || `Runner${race.finishers.length + 1}`,
          finishTime,
        };
        return { ...race, finishers: [...race.finishers, newFinisher] };
      })
    );
  };

  // Edit a finisher's time
  const editFinisher = (raceId, finisherId, newFinishTime, newName) => {
    updateRaces((races) =>
      races.map((race) => {
        if (race.id !== raceId) return race;

        const updatedFinishers = race.finishers.map((f) => {
          if (f.id !== finisherId) return f;

          // Calculate new finishTime based on race start + new elapsed time
          // const updatedFinishTime = (race.startTime || 0) + newElapsedTime;

          return {
            ...f,
            // finishTime: updatedFinishTime,
            finishTime: newFinishTime,
            name: newName !== undefined ? newName : f.name,
          };
        });

        // Always sort from shortest (1st place) to longest (nth)
        const sortedFinishers = [...updatedFinishers].sort(
          (a, b) => a.finishTime - b.finishTime
        );

        return { ...race, finishers: updatedFinishers };
      })
    );
  };

  // Insert a finisher (via the manualy data entry form)
  const insertFinisher = (raceId, finishTime, name) => {
    updateRaces((r) =>
      r.map((race) => {
        if (race.id !== raceId) return race;

        const newFinisher = {
          id: uuid.v4(),
          name: name || `Runner${race.finishers.length + 1}`,
          finishTime,
        };
        return { ...race, finishers: [...race.finishers, newFinisher] };
      })
    );
  };

  // Delete finisher 
  const deleteFinisher = (raceId, finisherId) => {
    updateRaces((races) =>
      races.map((race) => {
        if (race.id !== raceId) return race;

        // Find the finisher being removed
        const finisherToRemove = race.finishers.find(f => f.id === finisherId);
        if (!finisherToRemove) return race; // nothing to delete

        // Create updated arrays
        const updatedFinishers = race.finishers.filter(f => f.id !== finisherId);
        const updatedDeleted = [...(race.deletedFinishers || []), finisherToRemove];

        return {
          ...race,
          finishers: updatedFinishers,
          deletedFinishers: updatedDeleted,
        };
      })
    );
  };

  // Undelete finisher (preserves sorted order by finish time )
  const undeleteFinisher = (raceId, finisherId) => {
    updateRaces((races) =>
      races.map((race) => {
        if (race.id !== raceId) return race;

        // Find the finisher being restored
        const finisherToRestore = (race.deletedFinishers || []).find(f => f.id === finisherId);
        if (!finisherToRestore) return race; // nothing to undelete

        // Create updated arrays
        const updatedDeleted = (race.deletedFinishers || []).filter(f => f.id !== finisherId);
        const updatedFinishers = [...race.finishers, finisherToRestore]
          // Sort by elapsed time (shortest first)
          .sort((a, b) => (a.finishTime || 0) - (b.finishTime || 0));

        return {
          ...race,
          finishers: updatedFinishers,
          deletedFinishers: updatedDeleted,
        };
      })
    );
  };

  // Clear deleted finishers list 
  const clearDeletedFinishers = (raceId) => {
    updateRaces((races) =>
      races.map((race) => {
        if (race.id !== raceId) return race;
        return race; // TODO: this doesn't do anything, right? 
      }
      )
    )
  }

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

  const getFinisherById = (raceId, finisherId) => {
    const race = races.find(r => r.id === raceId);
    if (!race) return null;

    const finisher = race.finishers?.find(f => f.id === finisherId);
    return finisher ? { ...finisher } : null;
  };

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
        deleteRace,
        addFinisher,
        insertFinisher,
        editFinisher,
        deleteFinisher,
        undeleteFinisher, 
        clearDeletedFinishers,
        updateRaces,
        startTime, 
        getRaceById,
        getFinisherById,
      }}
    >
      {children}
    </RaceContext.Provider>
  );
}

export const useRaceContext = () => useContext(RaceContext);

