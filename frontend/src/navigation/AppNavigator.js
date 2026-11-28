import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, AppState, BackHandler, StyleSheet, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { colors } from '../theme';
import { useAuth } from '../context/AuthContext';
import { useChildProfile } from '../context/ChildProfileContext';
import { useLanguage } from '../context/LanguageContext';
import BaselineScreen from '../modules/m01_onboarding/BaselineScreen';
import ChildProfileScreen from '../modules/m01_onboarding/ChildProfileScreen';
import { loadConsent } from '../modules/m01_onboarding/consentStore';
import ConsentScreen from '../modules/m01_onboarding/ConsentScreen';
import GoalsScreen from '../modules/m01_onboarding/GoalsScreen';
import HomeScreen from '../modules/m01_onboarding/HomeScreen';
import LoginScreen from '../modules/m01_onboarding/LoginScreen';
import ParentPortalScreen from '../modules/m01_onboarding/ParentPortalScreen';
import { createAccountPinStore } from '../modules/m01_onboarding/pinStore';
import PinScreen from '../modules/m01_onboarding/PinScreen';
import ResetPinScreen from '../modules/m01_onboarding/ResetPinScreen';
import ChildHomeScreen from '../modules/m03_games/ChildHomeScreen';
import ColourMatchingScreen from '../modules/m03_games/ColourMatchingScreen';
import { easyRoundFor } from '../modules/m03_games/easyRound';
import ObjectNamingScreen from '../modules/m03_games/ObjectNamingScreen';
import { getRewards } from '../modules/m03_games/rewardStore';
import { pickActivityAfterBreak } from '../modules/m07_intervention/afterBreak';
import CalmingBreakScreen from '../modules/m07_intervention/CalmingBreakScreen';
import { syncWithRetry } from '../modules/m08_sync/syncService';
import DashboardScreen from '../modules/m09_dashboard/DashboardScreen';
import ReportsScreen from '../modules/m10_reports/ReportsScreen';
import { ACTIVITIES } from '../utils/constants';

const Stack = createNativeStackNavigator();

const CHILD_ACTIVITIES = [
  { id: ACTIVITIES.OBJECT_NAMING, available: true, level: 1 },
  { id: ACTIVITIES.COLOUR_MATCHING, available: true, level: 1 },
  { id: ACTIVITIES.SOUND_IMITATION, available: false, level: 1 },
];

function screenForActivity(activityId) {
  if (activityId === ACTIVITIES.OBJECT_NAMING) return 'ObjectNaming';
  if (activityId === ACTIVITIES.COLOUR_MATCHING) return 'ColourMatching';
  return null;
}

/**
 * Blocks the Android hardware back button while Child Mode screens are active (UI-06 / BR-28).
 */
function useLockHardwareBack() {
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => true);
    return () => sub.remove();
  }, []);
}

function ChildHomeRoute({ navigation }) {
  useLockHardwareBack();
  const { child } = useChildProfile();
  const { language } = useLanguage();
  const [stars, setStars] = useState(0);

  const loadStars = useCallback(() => {
    if (!child?._id) {
      setStars(0);
      return;
    }
    getRewards(child._id).then((r) => setStars(r.totalStars)).catch(() => {});
  }, [child?._id]);

  useEffect(() => {
    loadStars();
    return navigation.addListener('focus', loadStars);
  }, [navigation, loadStars]);

  const selectGame = (activityId) => {
    const routeName = screenForActivity(activityId);
    if (!routeName) {
      Alert.alert(
        language === 'ur' ? 'جلد دستیاب ہوگا' : 'Coming soon',
        language === 'ur'
          ? 'آواز دہرانے والا کھیل اگلی اپڈیٹ میں شامل کیا جائے گا۔'
          : 'Sound imitation will be available in the next update.',
      );
      return;
    }
    navigation.navigate(routeName, { startStars: stars });
  };

  return (
    <ChildHomeScreen
      stars={stars}
      onSelectGame={selectGame}
      onExit={() => navigation.navigate('Home')}
    />
  );
}

function ChildGameRoute({ navigation, route, Screen, onSessionSaved }) {
  useLockHardwareBack();
  const { itemIds, roundSize, startStars = 0 } = route.params || {};
  return (
    <Screen
      itemIds={itemIds}
      roundSize={roundSize}
      startStars={startStars}
      onSessionSaved={onSessionSaved}
      onDone={() => navigation.navigate('ChildHome')}
      onExit={() => navigation.navigate('Home')}
    />
  );
}

function CalmingBreakRoute({ navigation, route }) {
  useLockHardwareBack();
  const { child } = useChildProfile();
  const stressedActivity = route.params?.stressedActivity || ACTIVITIES.OBJECT_NAMING;

  const handleDone = async () => {
    const nextActivity = pickActivityAfterBreak({
      stressedActivity,
      activities: CHILD_ACTIVITIES,
    });
    const nextScreen = screenForActivity(nextActivity);
    const easy = nextActivity ? easyRoundFor(nextActivity) : null;

    if (!nextScreen || !easy) {
      navigation.navigate('ChildHome');
      return;
    }

    let startStars = 0;
    if (child?._id) {
      try {
        startStars = (await getRewards(child._id)).totalStars;
      } catch {
        startStars = 0;
      }
    }
    navigation.replace(nextScreen, { ...easy, startStars });
  };

  return (
    <CalmingBreakScreen
      onDone={handleDone}
      onExit={() => navigation.navigate('Home')}
    />
  );
}

export default function AppNavigator() {
  const { guardian, profiles, initializing, refreshProfiles, markPinConfigured, logout } = useAuth();
  const { child, setChild, addOrSelectChild, clearChildren } = useChildProfile();

  const pinStore = useMemo(
    () =>
      createAccountPinStore({
        hasAccountPin: Boolean(guardian?.hasPin),
        onPinSynced: markPinConfigured,
      }),
    [guardian?.hasPin, markPinConfigured],
  );

  const childIds = useMemo(() => {
    const ids = (profiles || []).map((p) => p._id);
    if (child?._id && !ids.includes(child._id)) ids.push(child._id);
    return ids;
  }, [profiles, child?._id]);

  // Keep an active child selected whenever the guardian's profile list loads.
  useEffect(() => {
    if (!guardian) return;
    if (!child && profiles?.length > 0) {
      setChild(profiles[0]);
    }
  }, [guardian, profiles, child, setChild]);

  const runSync = useCallback(() => {
    if (!guardian || childIds.length === 0) return;
    syncWithRetry(childIds, {
      onUnauthorized: () => {
        clearChildren();
        logout();
      },
    });
  }, [guardian, childIds, clearChildren, logout]);

  // Sync on app launch / login and whenever the app returns to foreground (M-08).
  useEffect(() => {
    runSync();
  }, [runSync]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') runSync();
    });
    return () => sub.remove();
  }, [runSync]);

  if (initializing) {
    return (
      <View style={styles.bootScreen}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!guardian ? (
          <Stack.Screen name="Login" component={LoginScreen} />
        ) : (
          <>
            <Stack.Screen name="Home">
              {({ navigation }) => (
                <HomeScreen
                  childModeAvailable={Boolean(child)}
                  onChildMode={() => navigation.navigate('ChildHome')}
                  onParentPortal={() => navigation.navigate('Pin')}
                />
              )}
            </Stack.Screen>

            <Stack.Screen name="Pin">
              {({ navigation }) => (
                <PinScreen
                  store={pinStore}
                  onBack={() => navigation.goBack()}
                  onUnlocked={() => navigation.replace('ParentPortal')}
                  onForgotPin={() => navigation.navigate('ResetPin')}
                />
              )}
            </Stack.Screen>

            <Stack.Screen name="ResetPin">
              {({ navigation }) => (
                <ResetPinScreen
                  store={pinStore}
                  onBack={() => navigation.goBack()}
                  onResetSuccess={() => navigation.replace('ParentPortal')}
                />
              )}
            </Stack.Screen>

            <Stack.Screen name="ParentPortal">
              {({ navigation }) => (
                <ParentPortalScreen
                  onBack={() => navigation.navigate('Home')}
                  onNavigate={(route) => navigation.navigate(route)}
                />
              )}
            </Stack.Screen>

            <Stack.Screen name="Dashboard">
              {({ navigation }) => (
                <DashboardScreen
                  onBack={() => navigation.goBack()}
                  onOpenReports={() => navigation.navigate('Reports')}
                />
              )}
            </Stack.Screen>

            <Stack.Screen name="Reports">
              {({ navigation }) => (
                <ReportsScreen onBack={() => navigation.goBack()} />
              )}
            </Stack.Screen>

            <Stack.Screen name="ChildProfile">
              {({ navigation }) => (
                <ChildProfileScreen
                  onBack={() => navigation.goBack()}
                  onSaved={async (profile) => {
                    addOrSelectChild(profile);
                    refreshProfiles().catch(() => {});
                    const consent = await loadConsent(profile._id).catch(() => null);
                    if (!consent) {
                      navigation.replace('Consent');
                    } else {
                      navigation.goBack();
                    }
                  }}
                />
              )}
            </Stack.Screen>

            <Stack.Screen name="Consent">
              {({ navigation }) => (
                <ConsentScreen
                  onBack={() => navigation.goBack()}
                  onSaved={() => {
                    runSync();
                    navigation.goBack();
                  }}
                />
              )}
            </Stack.Screen>

            <Stack.Screen name="Baseline">
              {({ navigation }) => (
                <BaselineScreen
                  onBack={() => navigation.goBack()}
                  onExit={() => {
                    runSync();
                    navigation.goBack();
                  }}
                  onComplete={() => {
                    runSync();
                    navigation.goBack();
                  }}
                />
              )}
            </Stack.Screen>

            <Stack.Screen name="Goals">
              {({ navigation }) => (
                <GoalsScreen
                  onBack={() => navigation.goBack()}
                  onSaved={() => {
                    runSync();
                    navigation.goBack();
                  }}
                />
              )}
            </Stack.Screen>

            <Stack.Screen
              name="ChildHome"
              component={ChildHomeRoute}
              options={{ gestureEnabled: false }}
            />

            <Stack.Screen name="ObjectNaming" options={{ gestureEnabled: false }}>
              {(props) => (
                <ChildGameRoute
                  {...props}
                  Screen={ObjectNamingScreen}
                  onSessionSaved={runSync}
                />
              )}
            </Stack.Screen>

            <Stack.Screen name="ColourMatching" options={{ gestureEnabled: false }}>
              {(props) => (
                <ChildGameRoute
                  {...props}
                  Screen={ColourMatchingScreen}
                  onSessionSaved={runSync}
                />
              )}
            </Stack.Screen>

            <Stack.Screen
              name="CalmingBreak"
              component={CalmingBreakRoute}
              options={{ gestureEnabled: false }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  bootScreen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.parentBackground,
  },
});
