import React from 'react';
import { useAuth } from '../context/AuthContext';
import LoginScreen from '../modules/m01_onboarding/LoginScreen';
import DashboardScreen from '../modules/m09_dashboard/DashboardScreen';
export default function AppNavigator() {
  return useAuth().guardian ? <DashboardScreen /> : <LoginScreen />;
}
