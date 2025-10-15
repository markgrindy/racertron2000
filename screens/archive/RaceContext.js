./screens/archive/RaceContext.js

// ./RaceContext.js
import React, { createContext, useState } from 'react';
import { formatElapsedTime } from './utils/formatElapsedTime'

export const RaceContext = createContext();
export const useRace = () => useContext(RaceContext); 

export const RaceProvider = ({ children }) => {
  const [raceName, setRaceName] = useState("");
  const [startTime, setStartTime] = useState(new Date());
  const [finishers, setFinishers] = useState([]);
  const [deletedFinishers, setDeletedFinishers] = useState([]);
  const [raceState, setRaceState] = useState("before"); 

  // ---- Finishers ----
  const addFinisher = (name, timeString, finishTimeMs = Date.now()) => {

    const newFinisher = {
      id: String(finishTimeMs) + " " + Math.random().toString(36).slice(2,7),
      name: name ?? `Runner ${finishers.length + 1}`,
      time: timeString, // formatted elapsed string (snapshot) 
      finishTime: finishTimeMs, // numeric ms since epoch 
    };
    setFinishers((prev) => [...prev, newFinisher]);
    return newFinisher; 
  };

  // removeFinisher(id) -> moves the exact snapshot (place + time) into deletedFinishers
  const removeFinisher = (id) => {
    setFinishers((prev) => {
      const index = prev.findIndex((f) => f.id === id);
      if (index !== -1) {
        const toDelete = prev[index];
        const deletedCopy = {
          ...toDelete, 
          place: index + 1, // lock in the visible place at the time
          time: toDelete.time, // already a snapshot string if addFinisher was used
          finishTime: toDelete.finishTime, // numeric ms (optional)
        }; 
        setDeletedFinishers((prevDeleted) => [...prevDeleted, deletedCopy]);
      }
      return prev.filter((f) => f.id !== id);
    });
  };

  const restoreFinisher = (id, startTimeMs) => {
    setDeletedFinishers((prevDeleted) => {
      const index = prevDeleted.findIndex((f) => f.id === id);
      if (index === -1) return prevDeleted;

      const toRestore = prevDeleted[index];
      const newDeleted = prevDeleted.filter((f) => f.id !== id);

      setFinishers((prevFinishers) => {
        const newFinishers = [...prevFinishers, toRestore];

        // sort by finishTime
        newFinishers.sort((a, b) => a.finishTime - b.finishTime);

        // recompute place and elapsed time relative to current startTime
        return newFinishers.map((f, i) => ({
          ...f,
          place: i + 1,
          time: startTimeMs ? formatElapsedTime(f.finishTime - startTimeMs) : f.time,
        }));
      });

      return newDeleted;
    });
  };

  // ---- Navigation / UI/UX ---- 

  const startRace = (customStart = Date.now()) => {
    if (!startTime) {
      setStartTime(customStart);
      setFinishers([]);
      setDeletedFinishers([]);      
    }    
    setRaceState("running");
  };

  const getRace = () => ({
    name: raceName,
    startTime,
    finishers,
  });

  const finishRace = () => {
    setRaceState("finished");
  }

  const clearRace = () => {
    setStartTime(null);
    setFinishers([]);
    setDeletedFinishers([]); 
    setStartTime(new Date());
    setRaceState("before");
  };

  // expose helper to override finishers if you need (rare)
  const setFinishersExternal = (arr) => setFinishers(arr);

  return (
    <RaceContext.Provider value={{ 
      raceName,
      setRaceName,
      startTime,
      setStartTime,
      raceState,
      setRaceState,
      startRace,
      finishRace,
      addFinisher,
      removeFinisher, 
      restoreFinisher,
      finishers, 
      deletedFinishers,
      getRace, 
      clearRace, 
      setFinishers: setFinishersExternal, 
    }}>
      {children}
    </RaceContext.Provider>
  );
};