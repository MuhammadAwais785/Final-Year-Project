import React, { createContext, useCallback, useContext, useState } from 'react';

const ChildProfileContext = createContext(null);

export function ChildProfileProvider({ children }) {
  const [child, setChild] = useState(null);
  const [childrenList, setChildrenList] = useState([]);

  const addOrSelectChild = useCallback((profile) => {
    if (!profile) return;
    setChild(profile);
    setChildrenList((prev) => {
      const exists = prev.some((p) => p._id === profile._id);
      return exists ? prev.map((p) => (p._id === profile._id ? profile : p)) : [...prev, profile];
    });
  }, []);

  const clearChildren = useCallback(() => {
    setChild(null);
    setChildrenList([]);
  }, []);

  return (
    <ChildProfileContext.Provider
      value={{ child, setChild, childrenList, setChildrenList, addOrSelectChild, clearChildren }}>
      {children}
    </ChildProfileContext.Provider>
  );
}

export const useChildProfile = () => useContext(ChildProfileContext);
