import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ActivityIndicator, StyleSheet } from 'react-native';
import { MenuButton } from '../components/SideMenu';
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

export function RootNavigator() {
  const { status } = useSession();
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
                title: 'Vehículos',
                headerLeft: () => <MenuButton />,
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
});
