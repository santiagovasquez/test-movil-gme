import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { FlatList, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FleetSummaryBar } from '../components/FleetSummaryBar';
import { NetworkBanner } from '../components/NetworkBanner';
import { VehicleRowSkeleton } from '../components/Skeleton';
import { VehicleRow } from '../components/VehicleRow';
import { useVehicleList } from '../hooks/useVehicleList';
import type { RootStackParamList } from '../navigation/RootNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'Vehicles'>;

export function VehiclesScreen({ navigation }: Props) {
  const { rows, summary, loading, network } = useVehicleList();
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      <NetworkBanner status={network} />
      {loading ? (
        <View style={styles.list}>
          {Array.from({ length: 6 }, (_, i) => (
            <VehicleRowSkeleton key={i} />
          ))}
        </View>
      ) : (
        <FlatList
          data={rows}
          keyExtractor={(row) => row.vehicle.id}
          ListHeaderComponent={<FleetSummaryBar summary={summary} />}
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
  list: { padding: 16, gap: 10 },
});
