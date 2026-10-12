import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';
import { useFleetSync } from '../hooks/useFleetSync';
import { LoginScreen } from '../screens/LoginScreen';
import { VehicleDetailScreen } from '../screens/VehicleDetailScreen';
import { VehiclesScreen } from '../screens/VehiclesScreen';
import { useSession } from '../state/SessionProvider';

export type RootStackParamList = {
  Login: undefined;
  Vehicles: undefined;
  VehicleDetail: { vehicleId: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

/** Montado solo con sesión: al cerrarla se desmonta y limpia el store. */
function FleetSync() {
  useFleetSync();
  return null;
}

function LogoutButton() {
  const { logout } = useSession();
  return (
    <Pressable onPress={logout} hitSlop={8}>
      <Text style={styles.link}>Salir</Text>
    </Pressable>
  );
}

export function RootNavigator() {
  const { status, user } = useSession();
  if (status === 'restoring') return <ActivityIndicator style={styles.loader} size="large" />;

  return (
    <>
      {status === 'signedIn' ? <FleetSync /> : null}
      <Stack.Navigator>
        {status === 'signedIn' ? (
          <>
            <Stack.Screen
              name="Vehicles"
              component={VehiclesScreen}
              options={{
                title: user ? `Hola, ${user.name.split(' ')[0]}` : 'Vehículos',
                headerRight: () => <LogoutButton />,
              }}
            />
            <Stack.Screen
              name="VehicleDetail"
              component={VehicleDetailScreen}
              options={{ title: 'Vehículo' }}
            />
          </>
        ) : (
          <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
        )}
      </Stack.Navigator>
    </>
  );
}

const styles = StyleSheet.create({
  loader: { flex: 1 },
  link: { color: '#1b5e9c', fontWeight: '600', fontSize: 16 },
});
