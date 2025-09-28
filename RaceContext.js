// RaceContext.js
import React, { createContext, useState } from 'react';

export const RaceContext = createContext();

export const RaceProvider = ({ children }) => {
  const [finishers, setFinishers] = useState([]);

  const addFinisher = (name, time) => {
    const newFinisher = {
      id: Date.now().toString(),
      name,
      time,
    };
    setFinishers((prev) => [...prev, newFinisher]);
  };

  const removeFinisher = (id) => {
    setFinishers((prev) => prev.filter((f) => f.id !== id));
  };

  const clearRace = () => {
    setFinishers([]);
  };

  return (
    <RaceContext.Provider value={{ finishers, addFinisher, removeFinisher, clearRace }}>
      {children}
    </RaceContext.Provider>
  );
};
