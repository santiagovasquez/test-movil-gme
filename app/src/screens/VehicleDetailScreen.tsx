import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useLayoutEffect } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AlertItem } from '../components/AlertItem';
import { CardSkeleton, Skeleton } from '../components/Skeleton';
import { StatusChip, VehicleIcon } from '../components/VehicleBadges';
import { useVehicleDetail } from '../hooks/useVehicleDetail';
import { cardinal, formatAgo } from '../lib/positions';
import type { RootStackParamList } from '../navigation/RootNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'VehicleDetail'>;

function StatTile({
  icon,
  label,
  value,
  unit,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  unit?: string;
}) {
  return (
    <View style={styles.tile}>
      <View style={styles.tileIcon}>{icon}</View>
      <Text style={styles.tileLabel}>{label}</Text>
      <Text style={styles.tileValue}>
        {value}
        {unit ? <Text style={styles.tileUnit}> {unit}</Text> : null}
      </Text>
    </View>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <Text style={styles.fieldValue}>{value}</Text>
    </View>
  );
}

export function VehicleDetailScreen({ route, navigation }: Props) {
  const { vehicleId } = route.params;
  const { loading, vehicle, position, secondsAgo, status, distanceKm, alerts, markAsRead } =
    useVehicleDetail(vehicleId);
  const insets = useSafeAreaInsets();
  const unread = alerts.filter((alert) => !alert.read).length;

  useLayoutEffect(() => {
    if (vehicle) navigation.setOptions({ title: vehicle.label });
  }, [navigation, vehicle]);

  if (!vehicle && loading.vehicle) {
    return (
      <View style={[styles.container, styles.content]}>
        <CardSkeleton lines={2} />
        <CardSkeleton lines={6} />
      </View>
    );
  }

  if (!vehicle) {
    return (
      <View style={styles.container}>
        <Text style={[styles.empty, styles.padded]}>Vehículo no encontrado</Text>
      </View>
    );
  }

  const header = (
    <View style={styles.header}>
      <View style={styles.hero}>
        <VehicleIcon label={vehicle.label} status={status} size={60} />
        <View style={styles.heroText}>
          <Text style={styles.title}>{vehicle.label}</Text>
          <View style={styles.heroLine}>
            <Text style={styles.plate}>{vehicle.plate}</Text>
            <Ionicons name="person-outline" size={13} color="#7b8794" />
            <Text style={styles.driver} numberOfLines={1}>
              {vehicle.driver}
            </Text>
          </View>
          <StatusChip status={status} />
        </View>
      </View>

      {loading.position ? (
        <CardSkeleton lines={4} />
      ) : (
        <>
          <View style={styles.grid}>
            <StatTile
              icon={<MaterialCommunityIcons name="speedometer" size={20} color="#1b5e9c" />}
              label="Velocidad"
              value={position ? String(position.speedKmh) : '—'}
              unit={position ? 'km/h' : undefined}
            />
            <StatTile
              icon={
                <Ionicons
                  name="navigate"
                  size={18}
                  color="#1b5e9c"
                  // El ícono apunta al noreste (45°): se compensa para que 0° sea el norte.
                  style={{ transform: [{ rotate: `${(position?.heading ?? 0) - 45}deg` }] }}
                />
              }
              label="Rumbo"
              value={position ? `${cardinal(position.heading)} · ${position.heading}°` : '—'}
            />
            <StatTile
              icon={<MaterialCommunityIcons name="map-marker-distance" size={20} color="#1b5e9c" />}
              label="Recorrido"
              value={distanceKm.toFixed(1)}
              unit="km"
            />
            <StatTile
              icon={<Ionicons name="time-outline" size={20} color="#1b5e9c" />}
              label="Última señal"
              value={secondsAgo === null ? '—' : formatAgo(secondsAgo)}
            />
          </View>

          <View style={styles.card}>
            <View style={styles.cardTitle}>
              <Ionicons name="location-outline" size={18} color="#1b5e9c" />
              <Text style={styles.sectionTitle}>Ubicación</Text>
            </View>
            {position ? (
              <>
                <Field label="Latitud" value={position.lat.toFixed(6)} />
                <Field label="Longitud" value={position.lng.toFixed(6)} />
                <Field
                  label="Registrada"
                  value={new Date(position.recordedAt).toLocaleTimeString('es-CO')}
                />
              </>
            ) : (
              <Text style={styles.empty}>Sin datos de posición</Text>
            )}
          </View>
        </>
      )}

      <View style={styles.alertsHeader}>
        <Text style={styles.sectionTitle}>Alertas</Text>
        {unread > 0 ? (
          <View style={styles.unreadPill}>
            <Text style={styles.unreadText}>
              {unread} sin leer
            </Text>
          </View>
        ) : null}
      </View>
    </View>
  );

  return (
    <FlatList
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingBottom: 16 + insets.bottom }]}
      data={loading.alerts ? [] : alerts}
      keyExtractor={(alert) => alert.id}
      renderItem={({ item }) => <AlertItem alert={item} onMarkAsRead={markAsRead} />}
      ListHeaderComponent={header}
      ListEmptyComponent={
        loading.alerts ? (
          <View style={styles.header}>
            <Skeleton style={styles.alertSkeleton} />
            <Skeleton style={styles.alertSkeleton} />
          </View>
        ) : (
          <View style={styles.noAlerts}>
            <Ionicons name="checkmark-done-circle-outline" size={32} color="#2e9e5b" />
            <Text style={styles.empty}>Sin alertas</Text>
          </View>
        )
      }
    />
  );
}

const shadow = {
  shadowColor: '#1f2933',
  shadowOpacity: 0.06,
  shadowRadius: 8,
  shadowOffset: { width: 0, height: 2 },
  elevation: 2,
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f7fa' },
  content: { padding: 16, gap: 10 },
  padded: { padding: 16 },
  header: { gap: 12 },
  hero: {
    ...shadow,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
  },
  heroText: { flex: 1, gap: 6 },
  title: { fontSize: 20, fontWeight: '800', color: '#1f2933' },
  heroLine: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  plate: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334e68',
    backgroundColor: '#eef2f7',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
    overflow: 'hidden',
    letterSpacing: 0.5,
    marginRight: 4,
  },
  driver: { flexShrink: 1, fontSize: 13, color: '#616e7c' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  tile: {
    ...shadow,
    flexBasis: '47%',
    flexGrow: 1,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    gap: 4,
  },
  tileIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#e8f0f8',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  tileLabel: { fontSize: 12, fontWeight: '600', color: '#7b8794' },
  tileValue: { fontSize: 18, fontWeight: '800', color: '#1f2933' },
  tileUnit: { fontSize: 13, fontWeight: '600', color: '#7b8794' },
  card: { ...shadow, backgroundColor: '#fff', borderRadius: 16, padding: 14, gap: 8 },
  cardTitle: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#1f2933' },
  field: { flexDirection: 'row', justifyContent: 'space-between' },
  fieldLabel: { fontSize: 14, color: '#616e7c' },
  fieldValue: { fontSize: 14, fontWeight: '600', color: '#1f2933' },
  alertsHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  unreadPill: { backgroundColor: '#fff1e6', paddingHorizontal: 9, paddingVertical: 3, borderRadius: 12 },
  unreadText: { fontSize: 12, fontWeight: '700', color: '#c05621' },
  noAlerts: { alignItems: 'center', gap: 6, paddingVertical: 16 },
  empty: { fontSize: 14, color: '#7b8794', textAlign: 'center' },
  alertSkeleton: { height: 72, borderRadius: 12 },
});
