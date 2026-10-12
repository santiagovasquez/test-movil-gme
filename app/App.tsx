import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { StyleSheet } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { Session } from './src/lib/types';
import { LoginScreen } from './src/screens/LoginScreen';
import { VehiclesScreen } from './src/screens/VehiclesScreen';

export default function App() {
  const [session, setSession] = useState<Session | null>(null);

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.root}>
        <StatusBar style="dark" />
        {session ? (
          <VehiclesScreen session={session} onLogout={() => setSession(null)} />
        ) : (
          <LoginScreen onLoggedIn={setSession} />
        )}
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f5f7fa' },
});
