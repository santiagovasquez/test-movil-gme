import { ActivityIndicator, FlatList, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NetworkBanner } from '../components/NetworkBanner';
import { VehicleRow } from '../components/VehicleRow';
import { useVehicleList } from '../hooks/useVehicleList';

export function VehiclesScreen() {
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
          renderItem={({ item }) => <VehicleRow {...item} />}
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
