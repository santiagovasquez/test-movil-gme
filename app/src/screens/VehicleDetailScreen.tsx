import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useLayoutEffect } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AlertItem } from '../components/AlertItem';
import { useVehicleDetail } from '../hooks/useVehicleDetail';
import { formatAgo } from '../lib/positions';
import { PositionUpdate } from '../lib/types';
import type { RootStackParamList } from '../navigation/RootNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'VehicleDetail'>;

function Field({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <Text style={styles.fieldValue}>{value}</Text>
    </View>
  );
}

function PositionCard({
  position,
  secondsAgo,
  stale,
}: {
  position: PositionUpdate | undefined;
  secondsAgo: number | null;
  stale: boolean;
}) {
  if (!position || secondsAgo === null) {
    return (
      <View style={styles.card}>
        <Text style={styles.empty}>Sin datos de posición</Text>
      </View>
    );
  }
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.sectionTitle}>Última posición</Text>
        {stale ? <Text style={styles.stale}>Sin señal</Text> : null}
      </View>
      <Field label="Visto" value={formatAgo(secondsAgo)} />
      <Field label="Velocidad" value={`${position.speedKmh} km/h`} />
      <Field label="Rumbo" value={`${position.heading}°`} />
      <Field label="Latitud" value={position.lat.toFixed(6)} />
      <Field label="Longitud" value={position.lng.toFixed(6)} />
      <Field label="Registrada" value={new Date(position.recordedAt).toLocaleTimeString('es-CO')} />
    </View>
  );
}

export function VehicleDetailScreen({ route, navigation }: Props) {
  const { vehicleId } = route.params;
  const { vehicle, position, secondsAgo, stale, alerts, markAsRead } = useVehicleDetail(vehicleId);
  const insets = useSafeAreaInsets();

  useLayoutEffect(() => {
    if (vehicle) navigation.setOptions({ title: vehicle.label });
  }, [navigation, vehicle]);

  if (!vehicle) {
    return (
      <View style={styles.container}>
        <Text style={[styles.empty, styles.padded]}>Vehículo no encontrado</Text>
      </View>
    );
  }

  return (
    <FlatList
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingBottom: 16 + insets.bottom }]}
      data={alerts}
      keyExtractor={(alert) => alert.id}
      renderItem={({ item }) => <AlertItem alert={item} onMarkAsRead={markAsRead} />}
      ListHeaderComponent={
        <View style={styles.header}>
          <View style={styles.card}>
            <Text style={styles.title}>{vehicle.label}</Text>
            <Field label="Placa" value={vehicle.plate} />
            <Field label="Conductor" value={vehicle.driver} />
          </View>
          <PositionCard position={position} secondsAgo={secondsAgo} stale={stale} />
          <Text style={styles.sectionTitle}>Alertas</Text>
        </View>
      }
      ListEmptyComponent={<Text style={styles.empty}>Sin alertas</Text>}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f7fa' },
  content: { padding: 16, gap: 10 },
  padded: { padding: 16 },
  header: { gap: 10 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 14, gap: 6 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 18, fontWeight: '700', color: '#1f2933', marginBottom: 4 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#1f2933' },
  field: { flexDirection: 'row', justifyContent: 'space-between' },
  fieldLabel: { fontSize: 14, color: '#616e7c' },
  fieldValue: { fontSize: 14, fontWeight: '600', color: '#1f2933' },
  stale: {
    fontSize: 12,
    fontWeight: '600',
    color: '#c62828',
    backgroundColor: '#fde8e8',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    overflow: 'hidden',
  },
  empty: { fontSize: 14, color: '#7b8794', textAlign: 'center' },
});
