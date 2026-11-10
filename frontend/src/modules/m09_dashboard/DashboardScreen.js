import React from 'react';
import { SafeAreaView, Text, StyleSheet, View } from 'react-native';
import PrimaryButton from '../../components/PrimaryButton';
import { useAuth } from '../../context/AuthContext';

export default function DashboardScreen() {
  const { guardian, logout } = useAuth();
  return <SafeAreaView style={styles.container}>
    <Text style={styles.title}>Assalam-o-alaikum, {guardian?.name}</Text>
    <Text style={styles.subtitle}>Aaj ke learning activities</Text>
    <View style={styles.card}><Text style={styles.cardTitle}>Object Naming</Text><Text>Vocabulary practice module</Text></View>
    <View style={styles.card}><Text style={styles.cardTitle}>Calm Break</Text><Text>Guided breathing aur mood check</Text></View>
    <PrimaryButton title="Logout" onPress={logout} />
  </SafeAreaView>;
}
const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, backgroundColor: '#f8fafc' },
  title: { fontSize: 24, fontWeight: '800', color: '#172554', marginTop: 24 },
  subtitle: { color: '#475569', marginVertical: 20 },
  card: { backgroundColor: '#fff', borderRadius: 14, padding: 18, marginBottom: 14, elevation: 2 },
  cardTitle: { fontSize: 18, fontWeight: '700', color: '#1d4ed8', marginBottom: 6 }
});
