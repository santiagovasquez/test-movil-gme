import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, StyleSheet } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { LoginScreen } from './src/screens/LoginScreen';
import { VehiclesScreen } from './src/screens/VehiclesScreen';
import { SessionProvider, useSession } from './src/state/SessionProvider';

function Root() {
  const { status } = useSession();
  if (status === 'restoring') return <ActivityIndicator style={styles.loader} size="large" />;
  return status === 'signedIn' ? <VehiclesScreen /> : <LoginScreen />;
}

export default function App() {
  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.root}>
        <StatusBar style="dark" />
        <SessionProvider>
          <Root />
        </SessionProvider>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f5f7fa' },
  loader: { flex: 1 },
});
