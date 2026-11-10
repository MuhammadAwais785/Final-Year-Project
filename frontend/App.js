import React from 'react';
import { AuthProvider } from './src/context/AuthContext';
import { ChildProfileProvider } from './src/context/ChildProfileContext';
import AppNavigator from './src/navigation/AppNavigator';
export default function App() {
  return <AuthProvider><ChildProfileProvider><AppNavigator /></ChildProfileProvider></AuthProvider>;
}
