// src/context/CompareContext.jsx
import { createContext, useContext, useEffect, useState } from "react";

const STORAGE_KEY = "zorg_compare_cart_v1";
const MAX = 3;

const CompareContext = createContext(null);

export function CompareProvider({ children }) {
  const [ids, setIds] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  }, [ids]);

  const add = (id) => {
    setIds((prev) => {
      if (prev.includes(id) || prev.length >= MAX) return prev;
      return [...prev, id];
    });
  };

  const remove = (id) => {
    setIds((prev) => prev.filter((x) => x !== id));
  };

  const clear = () => setIds([]);

  return (
    <CompareContext.Provider
      value={{
        ids,
        add,
        remove,
        clear,
        isFull: ids.length === MAX,
      }}
    >
      {children}
    </CompareContext.Provider>
  );
}

export function useCompareCart() {
  const ctx = useContext(CompareContext);
  if (!ctx) throw new Error("useCompareCart must be inside CompareProvider");
  return ctx;
}
