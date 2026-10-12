import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ActivityIndicator, FlatList, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NetworkBanner } from '../components/NetworkBanner';
import { VehicleRow } from '../components/VehicleRow';
import { useVehicleList } from '../hooks/useVehicleList';
import type { RootStackParamList } from '../navigation/RootNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'Vehicles'>;

export function VehiclesScreen({ navigation }: Props) {
  const { rows, loading, network } = useVehicleList();
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      <NetworkBanner status={network} />
      {loading ? (
        <ActivityIndicator style={styles.loader} size="large" />
      ) : (
        <FlatList
          data={rows}
          keyExtractor={(row) => row.vehicle.id}
          renderItem={({ item }) => (
            <VehicleRow
              {...item}
              onPress={() => navigation.navigate('VehicleDetail', { vehicleId: item.vehicle.id })}
            />
          )}
          contentContainerStyle={[styles.list, { paddingBottom: 16 + insets.bottom }]}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f7fa' },
  loader: { flex: 1 },
  list: { padding: 16, gap: 10 },
});
