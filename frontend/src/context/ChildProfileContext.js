import React, { createContext, useContext, useState } from 'react';

const ChildProfileContext = createContext(null);
export function ChildProfileProvider({ children }) {
  const [child, setChild] = useState(null);
  return <ChildProfileContext.Provider value={{ child, setChild }}>{children}</ChildProfileContext.Provider>;
}
export const useChildProfile = () => useContext(ChildProfileContext);
