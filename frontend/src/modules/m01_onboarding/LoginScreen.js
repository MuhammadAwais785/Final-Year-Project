import React, { useState } from 'react';
import { Alert, SafeAreaView, Text, TextInput, StyleSheet } from 'react-native';
import PrimaryButton from '../../components/PrimaryButton';
import { useAuth } from '../../context/AuthContext';

export default function LoginScreen() {
  const { login, register } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const submit = async (createAccount) => {
    try {
      await (createAccount ? register({ name: 'Guardian', email, password }) : login({ email, password }));
    } catch (error) {
      Alert.alert('Login failed', error.response?.data?.message || 'Backend se connection nahi ho saka.');
    }
  };
  return <SafeAreaView style={styles.container}>
    <Text style={styles.title}>Silent Screen Syndrome</Text>
    <Text style={styles.subtitle}>Guardian dashboard mein login karein</Text>
    <TextInput style={styles.input} placeholder="Email" autoCapitalize="none" value={email} onChangeText={setEmail} />
    <TextInput style={styles.input} placeholder="Password" secureTextEntry value={password} onChangeText={setPassword} />
    <PrimaryButton title="Login" onPress={() => submit(false)} />
    <PrimaryButton title="Create guardian account" onPress={() => submit(true)} />
  </SafeAreaView>;
}
const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, justifyContent: 'center', backgroundColor: '#f8fafc' },
  title: { fontSize: 28, fontWeight: '800', color: '#172554', marginBottom: 8 },
  subtitle: { color: '#475569', marginBottom: 24 },
  input: { backgroundColor: '#fff', borderColor: '#cbd5e1', borderWidth: 1, borderRadius: 10, padding: 13, marginTop: 12 }
});
