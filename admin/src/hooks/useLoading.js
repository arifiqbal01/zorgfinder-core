import React, { createContext, useContext, useState, useCallback } from "react";

const LoadingContext = createContext(null);

export const LoadingProvider = ({ children }) => {
  const [state, setState] = useState({
    visible: false,
    message: "",
  });

  const show = useCallback((message = "") => {
    setState({ visible: true, message });
  }, []);

  const hide = useCallback(() => {
    setState({ visible: false, message: "" });
  }, []);

  return (
    <LoadingContext.Provider value={{ ...state, show, hide }}>
      {children}
    </LoadingContext.Provider>
  );
};

export const useLoading = () => {
  const ctx = useContext(LoadingContext);
  if (!ctx) {
    throw new Error("useLoading must be used within LoadingProvider");
  }
  return ctx;
};
