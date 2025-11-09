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
      dns: [],
      dnf: [],
      volunteers: [],
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
          name: name || `Finisher${race.finishers.length + 1}`,
          finishTime,
        };
        return { ...race, finishers: [...race.finishers, newFinisher] };
      })
    );
  };

  // Edit a finisher's time
  const editFinisher = (raceId, recordId, newFinishTime, newName) => {
    updateRaces((races) =>
      races.map((race) => {
        if (race.id !== raceId) return race;

        const updatedFinishers = race.finishers.map((f) => {
          if (f.id !== recordId) return f;

          return {
            ...f,
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
  const insertFinisher = (raceId, finishTime, name, type) => {
    updateRaces((r) =>
      r.map((race) => {
        if (race.id !== raceId) return race;

        const newFinisher = {
          id: uuid.v4(),
          name: name || `Finisher${race.finishers.length + 1}`,
          finishTime,
        };
        return { ...race, finishers: [...race.finishers, newFinisher] };
      })
    );
  };

  /** 
   * Add a record to specified array, or edit an existing record 
   * Arrays: finishers, deletedFinishers, dns, dnf, volunteers
   * Accepts object newRecord = { raceId, type, oldType, recordId, name, finishTime, notes, gender };
   */ 
  const addEditRecord = (e) => {
    console.log("addEditRecord: ", e)
    updateRaces((races) =>
      races.map((race) => {
        if (race.id !== e.raceId) return race;

        const oldArray = race[e.oldType] || [];
        const newArray = race[e.type] || [];

        // EDIT
        if (e.recordId && e.oldType === e.type) {
          const updated = newArray.map((r) =>
            r.id === e.recordId
              ? { 
                  ...r, 
                  name: e.name ?? r.name, 
                  finishTime: e.finishTime ?? r.finishTime, 
                  notes: e.notes || r.notes, 
                  gender: e.gender ?? r.gender 
                }
              : r
          );
          return { ...race, [e.type]: updated };
        }

        // MOVE
        if (e.recordId && e.oldType !== e.type) {
          const moved = oldArray.find((r) => r.id === e.recordId);
          if (!moved) return race;
          return {
            ...race,
            [e.oldType]: oldArray.filter((r) => r.id !== e.recordId),
            [e.type]: [...newArray, moved],
          };
        }

        // ADD
        const description = typeToDescription(e.type);
        const newRecord = {
          id: e.recordId || uuid.v4(),
          name: e.name || `${description}${newArray.length + 1}`,
          finishTime: e.finishTime || null,
          notes: e.notes || "",
          gender: e.gender || "N/A",
        };

        return { ...race, [e.type]: [...newArray, newRecord] };
      })
    );
  };

  // remaps a record's array name to a user-facing description 
  const typeToDescription = (oldType) => {
    if (oldType === "finishers") {
      return "Finisher";
    }
    
    if (oldType === "volunteers") {
      return "Volunteer";
    }

    if (oldType === "dnf") {
      return "DNF"; 
    }

    if (oldType === "dns"){
      return "DNS"; 
    }

    return 
  }

  // Delete finisher 
  const deleteFinisher = (raceId, recordId) => {
    updateRaces((races) =>
      races.map((race) => {
        if (race.id !== raceId) return race;

        // Find the finisher being removed
        const finisherToRemove = race.finishers.find(f => f.id === recordId);
        if (!finisherToRemove) return race; // nothing to delete

        // Create updated arrays
        const updatedFinishers = race.finishers.filter(f => f.id !== recordId);
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
  const undeleteFinisher = (raceId, recordId) => {
    updateRaces((races) =>
      races.map((race) => {
        if (race.id !== raceId) return race;

        // Find the finisher being restored
        const finisherToRestore = (race.deletedFinishers || []).find(f => f.id === recordId);
        if (!finisherToRestore) return race; // nothing to undelete

        // Create updated arrays
        const updatedDeleted = (race.deletedFinishers || []).filter(f => f.id !== recordId);
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

  const getRecordById = ({ raceId, type, recordId }) => {
    const race = races.find(r => r.id === raceId);
    if (!race) return null;

    const record = race[type]?.find(r => r.id === recordId); 
    return record ? { ...record } : null; 
  }

  const getFinisherById = (raceId, recordId) => {
    const race = races.find(r => r.id === raceId);
    if (!race) return null;

    const finisher = race.finishers?.find(f => f.id === recordId);
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
        addEditRecord,
        updateRaces,
        startTime, 
        getRaceById,
        getFinisherById,
        getRecordById,
      }}
    >
      {children}
    </RaceContext.Provider>
  );
}

export const useRaceContext = () => useContext(RaceContext);

