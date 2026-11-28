import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/context/AuthContext';
import { ChildProfileProvider } from './src/context/ChildProfileContext';
import { LanguageProvider } from './src/context/LanguageContext';
import AppNavigator from './src/navigation/AppNavigator';

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <LanguageProvider>
          <ChildProfileProvider>
            <AppNavigator />
          </ChildProfileProvider>
        </LanguageProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
